import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import {
  CHECKOUT_CANCEL_URL,
  CHECKOUT_SUCCESS_URL,
  STRIPE_PRODUCTS,
  findCatalogPrice,
  formatAmount,
  priceMatchesProduct,
  productImageUrl
} from "./stripe/products.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const failures = [];

function check(condition, message) {
  if (!condition) failures.push(message);
}

function loadBrowserScript(relativePath, windowValue) {
  const filename = path.join(root, relativePath);
  const source = fs.readFileSync(filename, "utf8");
  const context = vm.createContext({ window: windowValue, console, URL });
  vm.runInContext(source, context, { filename });
  return windowValue;
}

function priceLabelToCents(value) {
  const match = String(value || "").replaceAll(",", "").match(/\$([0-9]+(?:\.[0-9]{2})?)/);
  return match ? Math.round(Number(match[1]) * 100) : NaN;
}

function localTargetExists(value) {
  const clean = String(value || "").split("#")[0].split("?")[0].replace(/^\/+/, "");
  return Boolean(clean) && fs.existsSync(path.join(root, clean));
}

function mockResponse() {
  return {
    statusCode: 200,
    headers: {},
    body: "",
    setHeader(name, value) {
      this.headers[String(name).toLowerCase()] = value;
    },
    end(body = "") {
      this.body = String(body);
    }
  };
}

const contentWindow = loadBrowserScript("src/content/siteContent.js", {});
const content = contentWindow.IHOCAIHAGSiteContent;
const siteProducts = content?.storeContent?.products || [];
const configWindow = loadBrowserScript("config.js", {
  location: { hostname: "imhighoncrackandihaveagun.com" },
  localStorage: { getItem: () => "" }
});
const config = configWindow.TRAP_HOUSE_CONFIG || {};
const previewConfigWindow = loadBrowserScript("config.js", {
  location: { hostname: "imhighoncrackandihaveagun-site-git-launch-ryanarchists-projects.vercel.app" },
  localStorage: { getItem: () => "" }
});
const previewConfig = previewConfigWindow.TRAP_HOUSE_CONFIG || {};

check(siteProducts.length === STRIPE_PRODUCTS.length, "Store and Stripe catalog product counts differ.");
check(new Set(siteProducts.map((product) => product.key)).size === siteProducts.length, "Store product keys must be unique.");
check(new Set(STRIPE_PRODUCTS.map((product) => product.key)).size === STRIPE_PRODUCTS.length, "Stripe catalog product keys must be unique.");

for (const stripeProduct of STRIPE_PRODUCTS) {
  const siteProduct = siteProducts.find((product) => product.key === stripeProduct.key);
  check(Boolean(siteProduct), `Store is missing Stripe product ${stripeProduct.key}.`);
  if (!siteProduct) continue;
  check(priceLabelToCents(siteProduct.price) === stripeProduct.unitAmount, `${stripeProduct.key} price differs between Store and Stripe catalog.`);
  check((siteProduct.checkoutEnabled !== false) === (stripeProduct.checkoutEnabled !== false), `${stripeProduct.key} checkout availability differs between Store and Stripe catalog.`);
  check(siteProduct.imageSrc === stripeProduct.imagePath, `${stripeProduct.key} image differs between Store and Stripe catalog.`);
  check(localTargetExists(siteProduct.imageSrc), `${stripeProduct.key} Store image does not exist: ${siteProduct.imageSrc}`);
  check(productImageUrl(stripeProduct).endsWith(stripeProduct.imagePath), `${stripeProduct.key} Stripe image URL is invalid.`);
}

const enabledProducts = STRIPE_PRODUCTS.filter((product) => product.checkoutEnabled !== false);
check(enabledProducts.length === STRIPE_PRODUCTS.length, "Every Store product, including Trap Pass tiers, should be checkout-enabled.");
check(STRIPE_PRODUCTS.filter((product) => product.checkoutEnabled === false).length === 0, "No Store product should remain checkout-disabled.");

const sampleProduct = enabledProducts[0];
const sampleStripeProduct = {
  active: true,
  name: sampleProduct.name,
  metadata: { ihocaihag_product_key: sampleProduct.key }
};
const validPrice = {
  id: "price_valid",
  active: true,
  lookup_key: sampleProduct.lookupKey,
  unit_amount: sampleProduct.unitAmount,
  currency: sampleProduct.currency,
  recurring: sampleProduct.recurringInterval ? { interval: sampleProduct.recurringInterval } : null,
  product: sampleStripeProduct
};
check(priceMatchesProduct(validPrice, sampleProduct), "Approved Stripe Price validation rejected a valid product.");
check(!priceMatchesProduct({ ...validPrice, unit_amount: validPrice.unit_amount + 1 }, sampleProduct), "Stripe Price validation accepted the wrong amount.");
check(findCatalogPrice([validPrice], sampleProduct)?.id === validPrice.id, "Lookup-key Stripe Price discovery failed.");
check(findCatalogPrice([validPrice], sampleProduct, "price_stale") === null, "A stale pinned Stripe Price ID must not fall back to another Price.");
check(
  findCatalogPrice([{ ...validPrice, id: "price_metadata_only", lookup_key: null }], sampleProduct) === null,
  "An unpinned Stripe Price without the approved lookup_key must not open checkout."
);

check(CHECKOUT_SUCCESS_URL === "https://imhighoncrackandihaveagun.com/checkout/success?session_id={CHECKOUT_SESSION_ID}", "Stripe success URL is incorrect.");
check(CHECKOUT_CANCEL_URL === "https://imhighoncrackandihaveagun.com/store/", "Stripe cancel URL is incorrect.");
check(localTargetExists("/checkout/success/"), "Checkout success route is missing.");
check(config.stripeCheckoutHealthEndpoint === "https://imhighoncrackandihaveagun-site.vercel.app/api/stripe/health", "Browser Stripe health endpoint is incorrect.");
check(config.stripeCheckoutSessionEndpoint === "https://imhighoncrackandihaveagun-site.vercel.app/api/stripe/create-checkout-session", "Browser Checkout Session endpoint is incorrect.");
check(config.trapPassWalletEndpoint === "https://imhighoncrackandihaveagun-site.vercel.app/api/trap-pass/wallet", "Browser Trap Pass wallet endpoint is incorrect.");
check(previewConfig.stripeCheckoutHealthEndpoint === "/api/stripe/health", "Vercel Preview health checks must stay on the current deployment.");
check(previewConfig.stripeCheckoutSessionEndpoint === "/api/stripe/create-checkout-session", "Vercel Preview checkout must stay on the current deployment.");
check(previewConfig.trapPassWalletEndpoint === "/api/trap-pass/wallet", "Vercel Preview Trap Pass wallet lookup must stay on the current deployment.");
check(!("stripePublishableKey" in config), "Hosted Checkout does not need a browser Stripe publishable key.");

const checkoutSource = fs.readFileSync(path.join(root, "checkout.js"), "utf8");
check(!checkoutSource.includes("data-stripe-price-id"), "Browser checkout must not contain Stripe Price IDs.");
check(checkoutSource.includes("Checkout Opening Soon"), "Closed checkout must explain its state on the product button.");

const siteSource = fs.readFileSync(path.join(root, "src/site.js"), "utf8");
check(!siteSource.includes("filter((product) => product.checkoutEnabled !== false)"), "Store must list Trap Pass purchase options even when checkout is disabled.");

const webhookSource = fs.readFileSync(path.join(root, "api/stripe/webhook.js"), "utf8");
check(webhookSource.includes("product.checkoutEnabled === false"), "Webhook fulfillment must reject disabled Store products.");
check(webhookSource.includes("checkout.session.async_payment_succeeded"), "Webhook must handle delayed payment success.");
check(webhookSource.includes("checkout.session.async_payment_failed"), "Webhook must handle delayed payment failure.");
check(webhookSource.includes("checkout.session.expired"), "Webhook must handle expired Checkout Sessions.");
check(webhookSource.includes('payment_status: fullyRefunded ? "refunded" : "partially_refunded"'), "Webhook must distinguish full and partial refunds.");

const schemaSource = fs.readFileSync(path.join(root, "supabase/stripe_checkout_schema.sql"), "utf8");
for (const table of ["stripe_events", "stripe_orders", "stripe_subscriptions", "stripe_trap_pass_entitlements"]) {
  check(schemaSource.includes(`alter table public.${table} enable row level security`), `${table} must have RLS enabled in the Stripe schema.`);
  check(schemaSource.includes(`revoke all on public.${table} from anon, authenticated`), `${table} must revoke direct browser roles.`);
}

const envNames = ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET", "SUPABASE_URL", "SUPABASE_SECRET_KEY", "SUPABASE_SERVICE_ROLE_KEY", "ALLOW_TEST_STRIPE_CHECKOUT"];
const savedEnv = Object.fromEntries(envNames.map((name) => [name, process.env[name]]));
const savedFetch = globalThis.fetch;
for (const name of envNames) delete process.env[name];

try {
  const healthHandler = require(path.join(root, "api/stripe/health.js"));
  const healthResponse = mockResponse();
  await healthHandler({ method: "GET", headers: {} }, healthResponse);
  const healthBody = JSON.parse(healthResponse.body);
  check(healthResponse.statusCode === 503 && healthBody.ready === false, "Unconfigured health endpoint must return 503 and ready=false.");
  check(healthBody.mode === "unconfigured", "Unconfigured health endpoint must not claim test or live mode.");

  const checkoutHandler = require(path.join(root, "api/stripe/create-checkout-session.js"));
  const checkoutResponse = mockResponse();
  await checkoutHandler({ method: "POST", headers: {}, body: { productKey: sampleProduct.key, quantity: 1 } }, checkoutResponse);
  check(checkoutResponse.statusCode === 503, "Unconfigured Checkout Session endpoint must return 503.");
  check(JSON.parse(checkoutResponse.body).error === "checkout_not_ready", "Unconfigured Checkout Session endpoint returned the wrong error.");

  process.env.STRIPE_SECRET_KEY = "sk_test_verifier";
  process.env.STRIPE_WEBHOOK_SECRET = "whsec_verifier";
  process.env.SUPABASE_URL = "https://example.supabase.co";
  process.env.SUPABASE_SECRET_KEY = "sb_secret_verifier";
  globalThis.fetch = async () => ({ ok: true });

  const testModeHealthResponse = mockResponse();
  await healthHandler({ method: "GET", headers: {} }, testModeHealthResponse);
  const testModeHealthBody = JSON.parse(testModeHealthResponse.body);
  check(testModeHealthResponse.statusCode === 503, "Test-mode Stripe health must not open public checkout by default.");
  check(testModeHealthBody.mode === "test" && testModeHealthBody.liveModeRequired === true, "Test-mode Stripe health must say live mode is required.");

  const testModeCheckoutResponse = mockResponse();
  await checkoutHandler({ method: "POST", headers: {}, body: { productKey: sampleProduct.key, quantity: 1 } }, testModeCheckoutResponse);
  check(testModeCheckoutResponse.statusCode === 503, "Test-mode Checkout Session endpoint must fail closed by default.");
  check(JSON.parse(testModeCheckoutResponse.body).error === "live_stripe_required", "Test-mode Checkout Session endpoint returned the wrong error.");

  process.env.ALLOW_TEST_STRIPE_CHECKOUT = "1";

  const unknownProductResponse = mockResponse();
  await checkoutHandler({ method: "POST", headers: {}, body: { productKey: "not_a_product", quantity: 1 } }, unknownProductResponse);
  check(unknownProductResponse.statusCode === 400, "Unknown Store products must be rejected before external API calls.");
  check(JSON.parse(unknownProductResponse.body).error === "unknown_product", "Unknown Store product returned the wrong error.");

  const invalidQuantityResponse = mockResponse();
  await checkoutHandler({ method: "POST", headers: {}, body: { productKey: sampleProduct.key, quantity: "2junk" } }, invalidQuantityResponse);
  check(invalidQuantityResponse.statusCode === 400, "Malformed Store quantity must be rejected before Stripe is called.");
  check(JSON.parse(invalidQuantityResponse.body).error === "quantity_out_of_range", "Malformed Store quantity returned the wrong error.");
} finally {
  globalThis.fetch = savedFetch;
  for (const [name, value] of Object.entries(savedEnv)) {
    if (value == null) delete process.env[name];
    else process.env[name] = value;
  }
}

if (failures.length) {
  console.error(`Store verification failed with ${failures.length} issue(s):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Store verification passed: ${siteProducts.length} products, ${enabledProducts.length} checkout-enabled.`);
console.log(`Approved prices: ${enabledProducts.map((product) => `${product.key} ${formatAmount(product.unitAmount, product.currency)}`).join(", ")}`);
