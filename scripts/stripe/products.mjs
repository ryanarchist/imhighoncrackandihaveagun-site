export const CHECKOUT_SUCCESS_URL =
  "https://imhighoncrackandihaveagun.com/checkout/success?session_id={CHECKOUT_SESSION_ID}";

export const CHECKOUT_CANCEL_URL = "https://imhighoncrackandihaveagun.com/store/";

export const REQUIRED_ENV_LINES = [
  "STRIPE_PRICE_OG_CRACK_PACK",
  "STRIPE_PRICE_RAW_DOC_PREORDER",
  "STRIPE_PRICE_BLACK_TEE",
  "STRIPE_PRICE_HARDCOVER_PREORDER",
  "STRIPE_PRICE_HANDY_SASS_PASS",
  "STRIPE_PRICE_CASH_FOR_TRASH_MONTHLY"
];

export const STRIPE_PRODUCTS = [
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
    access: "physical_preorder_bundle"
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
    access: "raw_documentary_first_day"
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
    access: "merch_order"
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
    access: "book_preorder"
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
    access: "handy_sass_holder"
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
    access: "cash_for_trash_member"
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
    access: product.access
  }));
}

export function priceMatchesProduct(price, product) {
  const recurringInterval = price.recurring?.interval || null;
  return (
    price.active === true &&
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
    direct_checkout_only: "true",
    stripe_connect: "false"
  };
}
