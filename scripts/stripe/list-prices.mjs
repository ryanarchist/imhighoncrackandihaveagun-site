import Stripe from "stripe";
import {
  REQUIRED_ENV_LINES,
  STRIPE_PRODUCTS,
  formatAmount,
  getProductByLookupKey
} from "./products.mjs";

const secretKey = process.env.STRIPE_SECRET_KEY;

if (!secretKey) {
  console.error("Missing STRIPE_SECRET_KEY. Set it in your local environment or deployment secrets.");
  process.exit(1);
}

const stripe = new Stripe(secretKey);

async function listAllActivePrices() {
  const prices = [];
  let startingAfter;

  do {
    const page = await stripe.prices.list({
      active: true,
      limit: 100,
      expand: ["data.product"],
      ...(startingAfter ? { starting_after: startingAfter } : {})
    });

    prices.push(...page.data);
    startingAfter = page.has_more ? page.data[page.data.length - 1]?.id : null;
  } while (startingAfter);

  return prices;
}

function productName(price) {
  if (price.product && typeof price.product === "object") return price.product.name || "";
  return "";
}

function productId(price) {
  if (price.product && typeof price.product === "object") return price.product.id || "";
  return String(price.product || "");
}

function suggestedPriceFor(product, prices) {
  return prices.find((price) => price.lookup_key === product.lookupKey)
    || prices.find((price) => productName(price) === product.name)
    || null;
}

const prices = await listAllActivePrices();

console.log("\nActive Stripe prices for this STRIPE_SECRET_KEY:\n");
console.table(prices.map((price) => ({
  "product name": productName(price),
  "product id": productId(price),
  "price id": price.id,
  "unit amount": formatAmount(price.unit_amount, price.currency),
  currency: String(price.currency || "").toUpperCase(),
  "recurring interval": price.recurring?.interval || "",
  lookup_key: price.lookup_key || "",
  livemode: price.livemode
})));

console.log("\nSuggested .env lines:\n");
for (const envName of REQUIRED_ENV_LINES) {
  const product = STRIPE_PRODUCTS.find((item) => item.envName === envName);
  const price = product ? suggestedPriceFor(product, prices) : null;
  console.log(`${envName}=${price?.id || ""}`);
}

const matchedLookupKeys = new Set(
  prices
    .map((price) => price.lookup_key)
    .filter(Boolean)
    .filter((lookupKey) => getProductByLookupKey(lookupKey))
);
const missing = STRIPE_PRODUCTS.filter((product) => !matchedLookupKeys.has(product.lookupKey));

if (missing.length) {
  console.log("\nMissing lookup_keys:");
  for (const product of missing) {
    console.log(`- ${product.lookupKey} (${product.name})`);
  }
  console.log("\nRun: npm run stripe:sync-products");
}
