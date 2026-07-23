const path = require("path");
const { pathToFileURL } = require("url");
const Stripe = require("stripe");
const { handleCors } = require("../_utils/cors");
const {
  DOCUMENTARY_PRODUCT_KEY,
  documentaryNotificationConfig
} = require("../_utils/orderNotifications");
const { syncTrapPassPromotionCodes } = require("../_utils/trapPassPromotions");

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

async function resolvePrice(stripe, product, priceMatchesProduct) {
  const envPriceId = process.env[product.envName];

  if (envPriceId) {
    const price = await stripe.prices.retrieve(envPriceId, { expand: ["product"] });
    if (!priceMatchesProduct(price, product)) {
      throw new Error(`Configured ${product.envName} does not match the approved catalog amount, currency, or billing interval.`);
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
    throw new Error(`No active Stripe price found for lookup_key "${product.lookupKey}". Run npm run stripe:sync-products.`);
  }

  if (!priceMatchesProduct(price, product)) {
    throw new Error(`Stripe lookup_key "${product.lookupKey}" does not match the approved catalog amount, currency, or billing interval.`);
  }
  return price;
}

function serverEnv(name) {
  return String(process.env[name] || "").trim();
}

function stripeMode(secretKey) {
  if (secretKey.startsWith("sk_live_")) return "live";
  if (secretKey.startsWith("sk_test_")) return "test";
  return "unconfigured";
}

function testCheckoutAllowed() {
  return serverEnv("ALLOW_TEST_STRIPE_CHECKOUT") === "1";
}

function supabaseServerConfig() {
  const url = serverEnv("SUPABASE_URL") || serverEnv("TRAP_HOUSE_SUPABASE_URL");
  const key = serverEnv("SUPABASE_SERVICE_ROLE_KEY")
    || serverEnv("SUPABASE_SECRET_KEY")
    || serverEnv("TRAP_HOUSE_SUPABASE_SERVICE_ROLE_KEY")
    || serverEnv("TRAP_HOUSE_SUPABASE_SECRET_KEY");
  return url && key ? { url: url.replace(/\/+$/, ""), key } : null;
}

async function fulfillmentStorageReady() {
  const config = supabaseServerConfig();
  if (!config) return false;
  const response = await fetch(`${config.url}/rest/v1/stripe_orders?select=stripe_checkout_session_id&limit=1`, {
    method: "GET",
    headers: {
      apikey: config.key,
      Authorization: `Bearer ${config.key}`,
      Accept: "application/json"
    }
  });
  return response.ok;
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
    release: product.release || "",
    variant: product.variant || "",
    edition_size: product.editionSize ? String(product.editionSize) : "",
    source: "ihocaihag_site",
    stripe_connect: "false"
  };
}

function checkoutCustomFields(product) {
  return (product.checkoutCustomFields || []).map((field) => ({
    key: field.key,
    label: {
      type: "custom",
      custom: field.label
    },
    type: field.type || "text",
    optional: false,
    ...(field.type === "text" || !field.type ? {
      text: {
        minimum_length: field.minimumLength || 1,
        maximum_length: field.maximumLength || 255
      }
    } : {})
  }));
}

module.exports = async function handler(req, res) {
  res.setHeader("Allow", "POST, OPTIONS");
  if (handleCors(req, res, ["POST", "OPTIONS"])) return;

  if (req.method !== "POST") {
    return sendJson(res, 405, { error: "method_not_allowed" });
  }

  const secretKey = serverEnv("STRIPE_SECRET_KEY");
  if (!secretKey || !serverEnv("STRIPE_WEBHOOK_SECRET") || !supabaseServerConfig()) {
    return sendJson(res, 503, { error: "checkout_not_ready" });
  }
  if (stripeMode(secretKey) === "test" && !testCheckoutAllowed()) {
    return sendJson(res, 503, {
      error: "live_stripe_required",
      message: "Live checkout is not open yet."
    });
  }

  try {
    let body;
    try {
      body = await parseBody(req);
    } catch (error) {
      const tooLarge = error.message === "request_body_too_large";
      return sendJson(res, tooLarge ? 413 : 400, {
        error: tooLarge ? "request_body_too_large" : "invalid_request_body"
      });
    }
    const catalog = await loadCatalog();
    const product = catalog.getProductByKey(body.productKey || body.lookupKey);

    if (!product) {
      return sendJson(res, 400, { error: "unknown_product" });
    }

    if (product.checkoutEnabled === false) {
      return sendJson(res, 409, { error: "product_unavailable" });
    }
    if (
      product.key === DOCUMENTARY_PRODUCT_KEY
      && !documentaryNotificationConfig().configured
    ) {
      return sendJson(res, 503, {
        error: "documentary_confirmation_not_ready",
        message: "Documentary preorder confirmation email is not ready."
      });
    }
    const quantity = body.quantity == null ? product.quantityMin : Number(body.quantity);

    if (!Number.isSafeInteger(quantity) || quantity < product.quantityMin || quantity > product.quantityMax) {
      return sendJson(res, 400, {
        error: "quantity_out_of_range",
        min: product.quantityMin,
        max: product.quantityMax
      });
    }

    if (!await fulfillmentStorageReady()) {
      return sendJson(res, 503, { error: "checkout_storage_not_ready" });
    }

    const stripe = new Stripe(secretKey);
    const price = await resolvePrice(stripe, product, catalog.priceMatchesProduct);

    try {
      await syncTrapPassPromotionCodes(stripe, supabaseServerConfig());
    } catch (error) {
      console.warn("Trap Pass promotion sync failed:", error.message);
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
      ...(product.checkoutCustomFields?.length ? {
        custom_fields: checkoutCustomFields(product)
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
      message: "Checkout is unavailable for this product."
    });
  }
};
