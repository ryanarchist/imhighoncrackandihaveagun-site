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
const orderNotifications = require(path.join(root, "api/_utils/orderNotifications.js"));
const trapPassPromotions = require(path.join(root, "api/_utils/trapPassPromotions.js"));
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
const disabledProductKeys = STRIPE_PRODUCTS
  .filter((product) => product.checkoutEnabled === false)
  .map((product) => product.key)
  .sort();
check(enabledProducts.length === STRIPE_PRODUCTS.length - 2, "Only the two sold-out jerseys should be checkout-disabled.");
check(
  JSON.stringify(disabledProductKeys) === JSON.stringify(["oc80_jersey_away", "oc80_jersey_home"]),
  "Sold-out checkout protection must apply to both jersey variants and no other products."
);

for (const jerseyKey of ["oc80_jersey_home", "oc80_jersey_away"]) {
  const jersey = STRIPE_PRODUCTS.find((product) => product.key === jerseyKey);
  check(jersey?.quantityMax === 1, `${jerseyKey} must stay limited to one jersey per Checkout Session.`);
  check(jersey?.editionSize === 40, `${jerseyKey} must retain its 40-piece edition metadata.`);
  check(jersey?.checkoutCustomFields?.some((field) => field.key === "jersey_size"), `${jerseyKey} must collect a required jersey size.`);
  check(jersey?.checkoutEnabled === false, `${jerseyKey} must reject new Checkout Sessions after selling out.`);
  const siteJersey = siteProducts.find((product) => product.key === jerseyKey);
  check(siteJersey?.soldOut === true, `${jerseyKey} must display the sold-out Store treatment.`);
  check(siteJersey?.buttonLabel === "Sold Out", `${jerseyKey} must label its disabled purchase button Sold Out.`);
}

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
check(config.trapPassClaimEndpoint === "https://imhighoncrackandihaveagun-site.vercel.app/api/trap-pass/claim", "Browser Trap Pass claim endpoint is incorrect.");
check(config.trapPassWalletEndpoint === "https://imhighoncrackandihaveagun-site.vercel.app/api/trap-pass/wallet", "Browser Trap Pass wallet endpoint is incorrect.");
check(previewConfig.stripeCheckoutHealthEndpoint === "/api/stripe/health", "Vercel Preview health checks must stay on the current deployment.");
check(previewConfig.stripeCheckoutSessionEndpoint === "/api/stripe/create-checkout-session", "Vercel Preview checkout must stay on the current deployment.");
check(previewConfig.trapPassClaimEndpoint === "/api/trap-pass/claim", "Vercel Preview Trap Pass claims must stay on the current deployment.");
check(previewConfig.trapPassWalletEndpoint === "/api/trap-pass/wallet", "Vercel Preview Trap Pass wallet lookup must stay on the current deployment.");
check(!("stripePublishableKey" in config), "Hosted Checkout does not need a browser Stripe publishable key.");
check(
  trapPassPromotions.freePassPromotionCode({ serial_number: 1 }) === "NB-0100",
  "The first free Trap Pass must map to Stripe promotion code NB-0100."
);
check(
  trapPassPromotions.normalizeTrapPassSerial(" hs-0007 ") === "HS-0007",
  "Paid Trap Pass serials must preserve their displayed promotion-code format."
);

let createdCouponParams;
let createdPromotionParams;
const fakeStripeForPromotions = {
  coupons: {
    async retrieve() {
      const error = new Error("missing");
      error.code = "resource_missing";
      error.statusCode = 404;
      throw error;
    },
    async create(params) {
      createdCouponParams = params;
      return { ...params, valid: true };
    }
  },
  promotionCodes: {
    async list() {
      return { data: [], has_more: false };
    },
    async create(params) {
      createdPromotionParams = params;
      return { id: "promo_test", code: params.code, active: true, ...params };
    },
    async update(id, params) {
      return { id, ...params };
    }
  }
};
const promotionResult = await trapPassPromotions.ensureTrapPassPromotionCode(
  fakeStripeForPromotions,
  "NB-0100",
  { source: "verification", tier: "Free Pass" }
);
check(createdCouponParams?.percent_off === 10, "Trap Pass coupon must grant exactly 10% off.");
check(createdCouponParams?.duration === "once", "Trap Pass coupon must apply once to subscriptions.");
check(createdPromotionParams?.code === "NB-0100", "Stripe promotion code must equal the displayed Trap Pass serial.");
check(createdPromotionParams?.max_redemptions === 1, "Each Trap Pass serial must be redeemable only once.");
check(promotionResult.ready === true, "Trap Pass promotion registration must report ready.");

const documentarySessionId = "cs_live_documentary_verification";
const documentaryReference = orderNotifications.documentaryPreorderReference(documentarySessionId);
check(/^DOC-[A-F0-9]{12}$/.test(documentaryReference), "Documentary preorder reference must use the approved DOC format.");
check(
  documentaryReference === orderNotifications.documentaryPreorderReference(documentarySessionId),
  "Documentary preorder reference must be stable for the same Checkout Session."
);

const documentaryEnvNames = [
  "RESEND_API_KEY",
  "RESEND_FROM",
  "TRAP_PASS_NOTIFY_FROM",
  "TRAP_PASS_NOTIFY_TO",
  "DOCUMENTARY_CONFIRMATION_FROM",
  "DOCUMENTARY_CONFIRMATION_REPLY_TO"
];
const savedDocumentaryEnv = Object.fromEntries(
  documentaryEnvNames.map((name) => [name, process.env[name]])
);
const savedDocumentaryFetch = globalThis.fetch;
let documentaryEmailRequest;
try {
  process.env.RESEND_API_KEY = "re_verifier";
  process.env.TRAP_PASS_NOTIFY_FROM = "IHOCAIHAG Trap Pass <trap-pass@example.com>";
  process.env.TRAP_PASS_NOTIFY_TO = "archive@example.com";
  delete process.env.RESEND_FROM;
  delete process.env.DOCUMENTARY_CONFIRMATION_FROM;
  delete process.env.DOCUMENTARY_CONFIRMATION_REPLY_TO;
  globalThis.fetch = async (url, options) => {
    documentaryEmailRequest = { url, options };
    return {
      ok: true,
      status: 200,
      async text() {
        return JSON.stringify({ id: "email_documentary_verifier" });
      }
    };
  };

  const documentaryEmailResult = await orderNotifications.sendDocumentaryPreorderConfirmation({
    productKey: "raw_doc_preorder",
    productName: "RAW DOCUMENTARY preorder 1st day access",
    customerEmail: "viewer@example.com",
    checkoutSessionId: documentarySessionId,
    amountTotal: 999,
    currency: "usd",
    quantity: 1
  });
  const documentaryEmailBody = JSON.parse(documentaryEmailRequest?.options?.body || "{}");
  check(documentaryEmailResult.sent === true, "Paid documentary preorder must send a customer confirmation.");
  check(
    documentaryEmailRequest?.url === "https://api.resend.com/emails",
    "Documentary confirmation must use the Resend email endpoint."
  );
  check(
    documentaryEmailRequest?.options?.headers?.["Idempotency-Key"]
      === `documentary-preorder/${documentarySessionId}`,
    "Documentary confirmation must be idempotent per Checkout Session."
  );
  check(
    documentaryEmailBody.to?.[0] === "viewer@example.com",
    "Documentary confirmation must be addressed to the purchaser."
  );
  check(
    documentaryEmailBody.subject?.includes(documentaryReference),
    "Documentary confirmation subject must include the verification reference."
  );
  check(
    documentaryEmailBody.text?.includes("This email is your verification for first-day documentary access."),
    "Documentary confirmation must identify itself as the customer's access verification."
  );
} finally {
  globalThis.fetch = savedDocumentaryFetch;
  for (const [name, value] of Object.entries(savedDocumentaryEnv)) {
    if (value == null) delete process.env[name];
    else process.env[name] = value;
  }
}

const checkoutSource = fs.readFileSync(path.join(root, "checkout.js"), "utf8");
check(!checkoutSource.includes("data-stripe-price-id"), "Browser checkout must not contain Stripe Price IDs.");
check(checkoutSource.includes("Checkout Opening Soon"), "Closed checkout must explain its state on the product button.");

const checkoutSessionSource = fs.readFileSync(path.join(root, "api/stripe/create-checkout-session.js"), "utf8");
check(checkoutSessionSource.includes("custom_fields: checkoutCustomFields(product)"), "Jersey Checkout Sessions must collect the configured size field.");
check(checkoutSessionSource.includes("syncTrapPassPromotionCodes"), "Checkout must backfill active Trap Pass promotion codes.");
check(
  checkoutSessionSource.includes("documentary_confirmation_not_ready"),
  "Documentary checkout must fail closed when customer confirmation email is not configured."
);

const siteSource = fs.readFileSync(path.join(root, "src/site.js"), "utf8");
check(!siteSource.includes("filter((product) => product.checkoutEnabled !== false)"), "Store must list Trap Pass purchase options even when checkout is disabled.");

const webhookSource = fs.readFileSync(path.join(root, "api/stripe/webhook.js"), "utf8");
check(webhookSource.includes("product.checkoutEnabled === false"), "Webhook fulfillment must reject disabled Store products.");
check(webhookSource.includes("checkout.session.async_payment_succeeded"), "Webhook must handle delayed payment success.");
check(webhookSource.includes("checkout.session.async_payment_failed"), "Webhook must handle delayed payment failure.");
check(webhookSource.includes("checkout.session.expired"), "Webhook must handle expired Checkout Sessions.");
check(webhookSource.includes("ensureTrapPassPromotionCode"), "Paid Trap Pass issuance must register the serial as a promotion code.");
check(
  webhookSource.includes("sendDocumentaryPreorderConfirmation"),
  "Paid documentary fulfillment must send the purchaser a confirmation email."
);
check(
  !/case "checkout\.session\.expired":\s*await handleCheckoutFailure/.test(webhookSource),
  "Expired Checkout Sessions must be acknowledged without creating abandoned orders."
);
check(webhookSource.includes('payment_status: fullyRefunded ? "refunded" : "partially_refunded"'), "Webhook must distinguish full and partial refunds.");

const schemaSource = fs.readFileSync(path.join(root, "supabase/stripe_checkout_schema.sql"), "utf8");
for (const table of ["stripe_events", "stripe_orders", "stripe_subscriptions", "stripe_trap_pass_entitlements"]) {
  check(schemaSource.includes(`alter table public.${table} enable row level security`), `${table} must have RLS enabled in the Stripe schema.`);
  check(schemaSource.includes(`revoke all on public.${table} from anon, authenticated`), `${table} must revoke direct browser roles.`);
}

const envNames = [
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "SUPABASE_URL",
  "SUPABASE_SECRET_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "ALLOW_TEST_STRIPE_CHECKOUT",
  ...documentaryEnvNames
];
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

  const claimHandler = require(path.join(root, "api/trap-pass/claim.js"));
  const claimHealthResponse = mockResponse();
  await claimHandler({ method: "GET", headers: {} }, claimHealthResponse);
  const claimHealthBody = JSON.parse(claimHealthResponse.body);
  check(claimHealthResponse.statusCode === 200, "Trap Pass claim health endpoint must return 200.");
  check(claimHealthBody.claimReady === false, "Unconfigured Trap Pass claim health must report claimReady=false.");
  check(claimHealthBody.notificationReady === false, "Unconfigured Trap Pass claim health must report notificationReady=false.");

  const claimResponse = mockResponse();
  await claimHandler({ method: "POST", headers: {}, body: { email: "claim@example.com" } }, claimResponse);
  check(claimResponse.statusCode === 503, "Unconfigured Trap Pass claim endpoint must return 503.");
  check(JSON.parse(claimResponse.body).error === "claim_not_ready", "Unconfigured Trap Pass claim endpoint returned the wrong error.");

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

  for (const jerseyKey of ["oc80_jersey_home", "oc80_jersey_away"]) {
    const soldOutCheckoutResponse = mockResponse();
    await checkoutHandler(
      { method: "POST", headers: {}, body: { productKey: jerseyKey, quantity: 1 } },
      soldOutCheckoutResponse
    );
    check(soldOutCheckoutResponse.statusCode === 409, `${jerseyKey} must reject new Checkout Sessions.`);
    check(
      JSON.parse(soldOutCheckoutResponse.body).error === "product_unavailable",
      `${jerseyKey} checkout must return product_unavailable.`
    );
  }

  const documentaryNotReadyResponse = mockResponse();
  await checkoutHandler(
    {
      method: "POST",
      headers: {},
      body: { productKey: "raw_doc_preorder", quantity: 1 }
    },
    documentaryNotReadyResponse
  );
  check(
    documentaryNotReadyResponse.statusCode === 503,
    "Documentary Checkout must stay closed when customer confirmation email is unconfigured."
  );
  check(
    JSON.parse(documentaryNotReadyResponse.body).error === "documentary_confirmation_not_ready",
    "Unconfigured documentary confirmation returned the wrong Checkout error."
  );

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
