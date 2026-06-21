import Stripe from "stripe";
import {
  STRIPE_PRODUCTS,
  formatAmount,
  priceMatchesProduct,
  productMetadata
} from "./products.mjs";

const secretKey = process.env.STRIPE_SECRET_KEY;

if (!secretKey) {
  console.error("Missing STRIPE_SECRET_KEY. Set it in your local environment or deployment secrets.");
  process.exit(1);
}

const stripe = new Stripe(secretKey);

async function findProduct(product) {
  const searchQuery = `metadata['ihocaihag_product_key']:'${product.key}'`;

  try {
    const results = await stripe.products.search({
      query: searchQuery,
      limit: 1
    });
    if (results.data[0]) return results.data[0];
  } catch (error) {
    if (process.env.STRIPE_SYNC_VERBOSE === "1") {
      console.warn(`Product search skipped for ${product.key}: ${error.message}`);
    }
  }

  const listed = await stripe.products.list({ active: true, limit: 100 });
  return listed.data.find((item) => item.metadata?.ihocaihag_product_key === product.key)
    || listed.data.find((item) => item.name === product.name)
    || null;
}

async function findPriceByLookupKey(product) {
  const prices = await stripe.prices.list({
    active: true,
    lookup_keys: [product.lookupKey],
    limit: 1,
    expand: ["data.product"]
  });
  return prices.data[0] || null;
}

async function ensureProduct(product) {
  const existing = await findProduct(product);
  const metadata = productMetadata(product);

  if (!existing) {
    return stripe.products.create({
      name: product.name,
      description: product.description,
      active: true,
      metadata
    });
  }

  return stripe.products.update(existing.id, {
    name: product.name,
    description: product.description,
    active: true,
    metadata: {
      ...existing.metadata,
      ...metadata
    }
  });
}

async function ensurePrice(product, stripeProduct) {
  const existing = await findPriceByLookupKey(product);
  if (existing && priceMatchesProduct(existing, product)) {
    return { price: existing, changed: false };
  }

  const price = await stripe.prices.create({
    product: stripeProduct.id,
    unit_amount: product.unitAmount,
    currency: product.currency,
    lookup_key: product.lookupKey,
    transfer_lookup_key: true,
    ...(product.recurringInterval ? { recurring: { interval: product.recurringInterval } } : {}),
    metadata: productMetadata(product)
  });

  return { price, changed: true };
}

const rows = [];

for (const product of STRIPE_PRODUCTS) {
  const stripeProduct = await ensureProduct(product);
  const { price, changed } = await ensurePrice(product, stripeProduct);

  rows.push({
    product: product.name,
    lookup_key: product.lookupKey,
    product_id: stripeProduct.id,
    price_id: price.id,
    amount: formatAmount(product.unitAmount, product.currency),
    interval: product.recurringInterval || "",
    mode: product.mode,
    shipping: product.physical ? "required" : "not required",
    livemode: price.livemode,
    action: changed ? "created/updated price" : "already current"
  });
}

console.log("\nStripe product sync complete. No Connect accounts were created.\n");
console.table(rows);

console.log("\nSuggested .env lines if you want to pin Price IDs explicitly:\n");
for (const row of rows) {
  const product = STRIPE_PRODUCTS.find((item) => item.lookupKey === row.lookup_key);
  console.log(`${product.envName}=${row.price_id}`);
}
