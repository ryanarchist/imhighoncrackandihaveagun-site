export const CHECKOUT_SUCCESS_URL =
  "https://imhighoncrackandihaveagun.com/checkout/success?session_id={CHECKOUT_SESSION_ID}";

export const CHECKOUT_CANCEL_URL = "https://imhighoncrackandihaveagun.com/store/";

export const REQUIRED_ENV_LINES = [
  "STRIPE_PRICE_OC80_JERSEY_HOME",
  "STRIPE_PRICE_OC80_JERSEY_AWAY",
  "STRIPE_PRICE_OG_CRACK_PACK",
  "STRIPE_PRICE_RAW_DOC_PREORDER",
  "STRIPE_PRICE_BLACK_TEE",
  "STRIPE_PRICE_HARDCOVER_PREORDER",
  "STRIPE_PRICE_HANDY_SASS_PASS",
  "STRIPE_PRICE_CASH_FOR_TRASH_MONTHLY"
];

const OC80_JERSEY_DESCRIPTION =
  "The official GEN 2 WAVE 1 Trap Pass release: the OC #80 IHOCAIHAG Basketball Jersey. Only 80 will ever be made\u201440 Teal Home and 40 White Away. Each new Trap Pass wave unlocks one exclusive merch drop, and this is the first. Built from breathable athletic mesh with distressed chalk graphics, a stamped #80 badge, \u201cNOTHING BEATS AN ORIGINAL\u201d back design, custom neck label and stitched hem patch. Once all 80 are gone, this wave is closed.";

export const STRIPE_PRODUCTS = [
  {
    key: "oc80_jersey_home",
    envName: "STRIPE_PRICE_OC80_JERSEY_HOME",
    lookupKey: "oc80_jersey_home",
    name: "IHOCAIHAG \u201cNOTHING BEATS AN ORIGINAL\u201d #80 BASKETBALL JERSEY (HOME)",
    description: OC80_JERSEY_DESCRIPTION,
    unitAmount: 8000,
    currency: "usd",
    mode: "payment",
    recurringInterval: null,
    physical: true,
    quantityMin: 1,
    quantityMax: 1,
    fulfillment: "physical_limited_jersey",
    grantsTrapPass: false,
    access: "gen2_wave1_merch_drop",
    release: "GEN 2 WAVE 1",
    variant: "Teal Home",
    editionSize: 40,
    imagePath: "/assets/trap-house/store-oc80-home-jersey.png"
  },
  {
    key: "oc80_jersey_away",
    envName: "STRIPE_PRICE_OC80_JERSEY_AWAY",
    lookupKey: "oc80_jersey_away",
    name: "IHOCAIHAG \u201cNOTHING BEATS AN ORIGINAL\u201d #80 BASKETBALL JERSEY (AWAY)",
    description: OC80_JERSEY_DESCRIPTION,
    unitAmount: 8000,
    currency: "usd",
    mode: "payment",
    recurringInterval: null,
    physical: true,
    quantityMin: 1,
    quantityMax: 1,
    fulfillment: "physical_limited_jersey",
    grantsTrapPass: false,
    access: "gen2_wave1_merch_drop",
    release: "GEN 2 WAVE 1",
    variant: "White Away",
    editionSize: 40,
    imagePath: "/assets/trap-house/store-oc80-away-jersey.png"
  },
  {
    key: "og_crack_pack",
    envName: "STRIPE_PRICE_OG_CRACK_PACK",
    lookupKey: "og_crack_pack",
    name: "THE og cRaCk paCk",
    description: "Physical preorder bundle / OG Crack Pack.",
    unitAmount: 9999,
    currency: "usd",
    mode: "payment",
    recurringInterval: null,
    physical: true,
    quantityMin: 1,
    quantityMax: 1,
    fulfillment: "physical_bundle_preorder",
    grantsTrapPass: false,
    access: "physical_preorder_bundle",
    imagePath: "/assets/trap-house/store-og-crack-pack-approved.png"
  },
  {
    key: "raw_doc_preorder",
    envName: "STRIPE_PRICE_RAW_DOC_PREORDER",
    lookupKey: "raw_doc_preorder",
    name: "RAW DOCUMENTARY preorder 1st day access",
    description: "Digital first-day access to selected raw documentary material.",
    unitAmount: 999,
    currency: "usd",
    mode: "payment",
    recurringInterval: null,
    physical: false,
    quantityMin: 1,
    quantityMax: 1,
    fulfillment: "digital_raw_doc_access",
    grantsTrapPass: false,
    access: "raw_documentary_first_day",
    imagePath: "/assets/trap-house/documentary-dvd-cover.png"
  },
  {
    key: "black_tee",
    envName: "STRIPE_PRICE_BLACK_TEE",
    lookupKey: "black_tee",
    name: "Signature Official ihocaihag Black Tee",
    description: "Official black IHOCAIHAG project shirt.",
    unitAmount: 2799,
    currency: "usd",
    mode: "payment",
    recurringInterval: null,
    physical: true,
    quantityMin: 1,
    quantityMax: 5,
    fulfillment: "physical_merch",
    grantsTrapPass: false,
    access: "merch_order",
    imagePath: "/store-shirt-black.webp"
  },
  {
    key: "hardcover_preorder",
    envName: "STRIPE_PRICE_HARDCOVER_PREORDER",
    lookupKey: "hardcover_preorder",
    name: "IM HIGH ON CRACK AND I HAVE A GUN Hardcover Book preorder",
    description: "Hardcover preorder for the book object.",
    unitAmount: 3999,
    currency: "usd",
    mode: "payment",
    recurringInterval: null,
    physical: true,
    quantityMin: 1,
    quantityMax: 3,
    fulfillment: "hardcover_book_preorder",
    grantsTrapPass: false,
    access: "book_preorder",
    imagePath: "/assets/trap-house/store-hardcover-book-approved.png"
  },
  {
    key: "handy_sass_pass",
    envName: "STRIPE_PRICE_HANDY_SASS_PASS",
    lookupKey: "handy_sass_pass",
    name: "HANDY SASS TRAP PASS",
    description: "Physical lifetime Trap Pass with mailed collectible card.",
    unitAmount: 3999,
    currency: "usd",
    mode: "payment",
    recurringInterval: null,
    physical: true,
    quantityMin: 1,
    quantityMax: 1,
    fulfillment: "physical_trap_pass",
    grantsTrapPass: true,
    trapPassTier: "Handy Sass",
    serialPrefix: "HS",
    access: "handy_sass_holder",
    imagePath: "/assets/trap-house/store-handy-sass-approved.png"
  },
  {
    key: "cash_for_trash_monthly",
    envName: "STRIPE_PRICE_CASH_FOR_TRASH_MONTHLY",
    lookupKey: "cash_for_trash_monthly",
    name: "CASH FOR TRASH TRAP PASS",
    description: "Monthly digital Trap Pass membership.",
    unitAmount: 499,
    currency: "usd",
    mode: "subscription",
    recurringInterval: "month",
    physical: false,
    quantityMin: 1,
    quantityMax: 1,
    fulfillment: "digital_monthly_membership",
    grantsTrapPass: true,
    trapPassTier: "Cash for Trash",
    serialPrefix: "CFT",
    access: "cash_for_trash_member",
    imagePath: "/assets/trap-house/trap-pass-cash-for-trash-approved.png"
  }
];

export function normalizeProductKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function getProductByKey(value) {
  const key = normalizeProductKey(value);
  return STRIPE_PRODUCTS.find((product) => product.key === key || product.lookupKey === key);
}

export function getProductByLookupKey(value) {
  const key = normalizeProductKey(value);
  return STRIPE_PRODUCTS.find((product) => product.lookupKey === key);
}

export function getProductByEnvName(value) {
  return STRIPE_PRODUCTS.find((product) => product.envName === value);
}

export function formatAmount(unitAmount, currency = "usd") {
  if (!Number.isFinite(unitAmount)) return "";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase()
  }).format(unitAmount / 100);
}

export function publicCheckoutProducts() {
  return STRIPE_PRODUCTS.map((product) => ({
    key: product.key,
    lookupKey: product.lookupKey,
    name: product.name,
    description: product.description,
    priceLabel: formatAmount(product.unitAmount, product.currency),
    mode: product.mode,
    physical: product.physical,
    quantityMin: product.quantityMin,
    quantityMax: product.quantityMax,
    fulfillment: product.fulfillment,
    access: product.access,
    imagePath: product.imagePath,
    checkoutEnabled: product.checkoutEnabled !== false
  }));
}

export function findCatalogPrice(prices, product, pinnedPriceId = "") {
  const list = Array.isArray(prices) ? prices : [];
  if (pinnedPriceId) {
    return list.find((price) => price.id === pinnedPriceId) || null;
  }
  return list.find((price) => price.lookup_key === product.lookupKey) || null;
}

export function productImageUrl(product, baseUrl = "https://imhighoncrackandihaveagun.com") {
  if (!product?.imagePath) return "";
  const cleanBase = String(baseUrl || "").trim().replace(/\/+$/, "");
  const cleanPath = String(product.imagePath).startsWith("/") ? product.imagePath : `/${product.imagePath}`;
  return cleanBase ? `${cleanBase}${cleanPath}` : "";
}

export function priceMatchesProduct(price, product) {
  const recurringInterval = price.recurring?.interval || null;
  const stripeProduct = price.product && typeof price.product === "object" ? price.product : null;
  const identityMatches = Boolean(
    stripeProduct
    && stripeProduct.active !== false
    && (
      stripeProduct.metadata?.ihocaihag_product_key === product.key
      || stripeProduct.metadata?.lookup_key === product.lookupKey
      || stripeProduct.name === product.name
    )
  );
  return (
    price.active === true &&
    identityMatches &&
    price.unit_amount === product.unitAmount &&
    String(price.currency || "").toLowerCase() === product.currency &&
    recurringInterval === product.recurringInterval
  );
}

export function productMetadata(product) {
  return {
    ihocaihag_product_key: product.key,
    lookup_key: product.lookupKey,
    fulfillment: product.fulfillment,
    physical_shipping_required: String(product.physical),
    grants_trap_pass: String(product.grantsTrapPass),
    trap_pass_tier: product.trapPassTier || "",
    release: product.release || "",
    variant: product.variant || "",
    edition_size: product.editionSize ? String(product.editionSize) : "",
    direct_checkout_only: "true",
    stripe_connect: "false"
  };
}
