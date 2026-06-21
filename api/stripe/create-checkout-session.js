const path = require("path");
const { pathToFileURL } = require("url");
const Stripe = require("stripe");

async function loadCatalog() {
  const catalogPath = path.join(__dirname, "..", "..", "scripts", "stripe", "products.mjs");
  return import(pathToFileURL(catalogPath).href);
}

function sendJson(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(body));
}

function parseBody(req) {
  if (req.body && typeof req.body === "object") return Promise.resolve(req.body);
  if (typeof req.body === "string") {
    try {
      return Promise.resolve(JSON.parse(req.body));
    } catch (error) {
      return Promise.reject(new Error("invalid_json_body"));
    }
  }

  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > 1024 * 1024) {
        reject(new Error("request_body_too_large"));
        req.destroy();
      }
    });
    req.on("end", () => {
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch (error) {
        reject(new Error("invalid_json_body"));
      }
    });
    req.on("error", reject);
  });
}

function parseAllowedCountries(value) {
  return String(value || "US")
    .split(",")
    .map((country) => country.trim().toUpperCase())
    .filter(Boolean);
}

function cleanEmail(value) {
  const email = String(value || "").trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : "";
}

async function resolvePrice(stripe, product) {
  const envPriceId = process.env[product.envName];

  if (envPriceId) {
    const price = await stripe.prices.retrieve(envPriceId, { expand: ["product"] });
    if (!price.active) {
      throw new Error(`Configured ${product.envName} points to an inactive Stripe price.`);
    }
    return price;
  }

  const prices = await stripe.prices.list({
    active: true,
    lookup_keys: [product.lookupKey],
    limit: 1,
    expand: ["data.product"]
  });

  const price = prices.data[0];
  if (!price) {
    const fallbackPrices = await stripe.prices.list({
      active: true,
      limit: 100,
      expand: ["data.product"]
    });
    const fallbackPrice = fallbackPrices.data.find((candidate) => {
      const stripeProduct = typeof candidate.product === "object" ? candidate.product : null;
      const productKey = stripeProduct?.metadata?.ihocaihag_product_key;
      return (
        productKey === product.key
        || stripeProduct?.name === product.name
        || stripeProduct?.metadata?.lookup_key === product.lookupKey
      );
    });

    if (fallbackPrice) return fallbackPrice;

    throw new Error(`No active Stripe price found for lookup_key "${product.lookupKey}". Run npm run stripe:sync-products.`);
  }

  return price;
}

function checkoutMetadata(product, body) {
  return {
    product_key: product.key,
    lookup_key: product.lookupKey,
    fulfillment: product.fulfillment,
    access: product.access,
    physical_shipping_required: String(product.physical),
    grants_trap_pass: String(product.grantsTrapPass),
    trap_pass_tier: product.trapPassTier || "",
    source: "ihocaihag_site",
    stripe_connect: "false",
    visitor_pass_id: String(body.trapPassId || "").slice(0, 80)
  };
}

module.exports = async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.setHeader("Allow", "POST, OPTIONS");
    return sendJson(res, 204, {});
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return sendJson(res, 405, { error: "method_not_allowed" });
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return sendJson(res, 500, { error: "stripe_secret_key_missing" });
  }

  try {
    const body = await parseBody(req);
    const catalog = await loadCatalog();
    const product = catalog.getProductByKey(body.productKey || body.lookupKey);

    if (!product) {
      return sendJson(res, 400, { error: "unknown_product" });
    }

    const stripe = new Stripe(secretKey);
    const price = await resolvePrice(stripe, product);
    const requestedQuantity = Number.parseInt(body.quantity, 10);
    const quantity = Number.isFinite(requestedQuantity) ? requestedQuantity : product.quantityMin;

    if (quantity < product.quantityMin || quantity > product.quantityMax) {
      return sendJson(res, 400, {
        error: "quantity_out_of_range",
        min: product.quantityMin,
        max: product.quantityMax
      });
    }

    const customerEmail = cleanEmail(body.email);
    const metadata = checkoutMetadata(product, body);
    const lineItem = {
      price: price.id,
      quantity
    };

    if (product.quantityMax > product.quantityMin) {
      lineItem.adjustable_quantity = {
        enabled: true,
        minimum: product.quantityMin,
        maximum: product.quantityMax
      };
    }

    const session = await stripe.checkout.sessions.create({
      mode: product.mode,
      line_items: [lineItem],
      success_url: process.env.STRIPE_SUCCESS_URL || catalog.CHECKOUT_SUCCESS_URL,
      cancel_url: process.env.STRIPE_CANCEL_URL || catalog.CHECKOUT_CANCEL_URL,
      automatic_tax: { enabled: process.env.STRIPE_AUTOMATIC_TAX === "1" },
      allow_promotion_codes: true,
      billing_address_collection: "auto",
      ...(customerEmail ? { customer_email: customerEmail } : {}),
      ...(product.physical ? {
        shipping_address_collection: {
          allowed_countries: parseAllowedCountries(process.env.STRIPE_ALLOWED_SHIPPING_COUNTRIES)
        },
        phone_number_collection: { enabled: true }
      } : {}),
      metadata,
      ...(product.mode === "subscription" ? {
        subscription_data: { metadata }
      } : {
        payment_intent_data: { metadata }
      })
    });

    return sendJson(res, 200, {
      id: session.id,
      url: session.url
    });
  } catch (error) {
    console.error("Stripe checkout creation failed:", error.message);
    return sendJson(res, 500, {
      error: "checkout_session_failed",
      message: error.message
    });
  }
};
