const path = require("path");
const { pathToFileURL } = require("url");
const Stripe = require("stripe");
const { handleCors } = require("../_utils/cors");

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

function hasSupabaseSecret() {
  return Boolean(
    serverEnv("SUPABASE_SERVICE_ROLE_KEY")
      || serverEnv("SUPABASE_SECRET_KEY")
      || serverEnv("TRAP_HOUSE_SUPABASE_SERVICE_ROLE_KEY")
      || serverEnv("TRAP_HOUSE_SUPABASE_SECRET_KEY")
  );
}

function supabaseServerConfig() {
  const url = serverEnv("SUPABASE_URL") || serverEnv("TRAP_HOUSE_SUPABASE_URL");
  const key = serverEnv("SUPABASE_SERVICE_ROLE_KEY")
    || serverEnv("SUPABASE_SECRET_KEY")
    || serverEnv("TRAP_HOUSE_SUPABASE_SERVICE_ROLE_KEY")
    || serverEnv("TRAP_HOUSE_SUPABASE_SECRET_KEY");
  return url && key ? { url: url.replace(/\/+$/, ""), key } : null;
}

async function listActivePrices(stripe) {
  const prices = [];
  let startingAfter = "";
  do {
    const page = await stripe.prices.list({
      active: true,
      limit: 100,
      expand: ["data.product"],
      ...(startingAfter ? { starting_after: startingAfter } : {})
    });
    prices.push(...page.data);
    startingAfter = page.has_more ? page.data[page.data.length - 1]?.id || "" : "";
  } while (startingAfter);
  return prices;
}

async function unavailableProductKeys(secretKey) {
  const catalog = await loadCatalog();
  const prices = await listActivePrices(new Stripe(secretKey));
  return catalog.STRIPE_PRODUCTS
    .filter((product) => product.checkoutEnabled !== false)
    .filter((product) => {
      const candidate = catalog.findCatalogPrice(
        prices,
        product,
        serverEnv(product.envName)
      );
      return !candidate || !catalog.priceMatchesProduct(candidate, product);
    })
    .map((product) => product.key);
}

async function stripeOrderSchemaReady() {
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

module.exports = async function handler(req, res) {
  res.setHeader("Allow", "GET, OPTIONS");
  if (handleCors(req, res, ["GET", "OPTIONS"])) return;

  if (req.method !== "GET") {
    return sendJson(res, 405, { error: "method_not_allowed" });
  }

  const missing = [];
  if (!serverEnv("STRIPE_SECRET_KEY")) missing.push("STRIPE_SECRET_KEY");
  if (!serverEnv("STRIPE_WEBHOOK_SECRET")) missing.push("STRIPE_WEBHOOK_SECRET");
  if (!serverEnv("SUPABASE_URL") && !serverEnv("TRAP_HOUSE_SUPABASE_URL")) missing.push("SUPABASE_URL");
  if (!hasSupabaseSecret()) missing.push("SUPABASE_SECRET_KEY");

  const stripeSecret = serverEnv("STRIPE_SECRET_KEY");
  const mode = stripeMode(stripeSecret);
  const liveModeRequired = mode === "test" && !testCheckoutAllowed();
  let unavailableProducts = [];
  let schemaReady = false;

  if (!missing.length && !liveModeRequired) {
    try {
      unavailableProducts = await unavailableProductKeys(stripeSecret);
    } catch (error) {
      unavailableProducts = ["stripe_catalog_unavailable"];
    }
    try {
      schemaReady = await stripeOrderSchemaReady();
    } catch (error) {
      schemaReady = false;
    }
  }

  const ready = missing.length === 0 && !liveModeRequired && unavailableProducts.length === 0 && schemaReady;
  return sendJson(res, ready ? 200 : 503, {
    ready,
    mode,
    missing,
    liveModeRequired,
    unavailableProducts,
    schemaReady
  });
};
