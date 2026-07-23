const TRAP_PASS_COUPON_ID = "trap-pass-holder-10";
const TRAP_PASS_DISCOUNT_PERCENT = 10;
const TRAP_PASS_PROMOTION_BENEFIT = "trap_pass_holder_10_percent";
const FREE_PASS_FIRST_HOLDER_NUMBER = 100;
const FREE_PASS_PREFIX = "NB";
const SYNC_TTL_MS = 5 * 60 * 1000;

let lastSyncAt = 0;
let activeSync = null;

function normalizeTrapPassSerial(value) {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "")
    .replace(/[^A-Z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function freePassPromotionCode(pass) {
  const serialNumber = Number(pass?.serial_number);
  if (!Number.isSafeInteger(serialNumber) || serialNumber < 1) return "";
  const holderNumber = FREE_PASS_FIRST_HOLDER_NUMBER + serialNumber - 1;
  return `${FREE_PASS_PREFIX}-${String(holderNumber).padStart(4, "0")}`;
}

function isActiveStatus(value) {
  const status = String(value || "active").trim().toLowerCase();
  return status === "active" || status === "trialing";
}

function couponIdFromPromotionCode(promotionCode) {
  if (typeof promotionCode?.coupon === "string") return promotionCode.coupon;
  if (promotionCode?.coupon?.id) return promotionCode.coupon.id;
  if (typeof promotionCode?.promotion?.coupon === "string") return promotionCode.promotion.coupon;
  if (promotionCode?.promotion?.coupon?.id) return promotionCode.promotion.coupon.id;
  return "";
}

function isMissingStripeResource(error) {
  return error?.statusCode === 404
    || error?.code === "resource_missing"
    || error?.raw?.code === "resource_missing";
}

function couponId() {
  return String(process.env.STRIPE_TRAP_PASS_COUPON_ID || TRAP_PASS_COUPON_ID).trim();
}

async function ensureTrapPassCoupon(stripe) {
  const id = couponId();
  let coupon;

  try {
    coupon = await stripe.coupons.retrieve(id);
  } catch (error) {
    if (!isMissingStripeResource(error)) throw error;
    coupon = await stripe.coupons.create({
      id,
      name: "Trap Pass Holder 10% Off",
      percent_off: TRAP_PASS_DISCOUNT_PERCENT,
      duration: "once",
      metadata: {
        benefit: TRAP_PASS_PROMOTION_BENEFIT,
        source: "ihocaihag_site"
      }
    });
  }

  if (
    coupon.valid === false
    || Number(coupon.percent_off) !== TRAP_PASS_DISCOUNT_PERCENT
    || coupon.duration !== "once"
  ) {
    throw new Error(`Stripe coupon ${id} does not match the approved Trap Pass discount.`);
  }

  return coupon;
}

async function createPromotionCode(stripe, coupon, code, metadata) {
  const params = {
    coupon: coupon.id,
    code,
    active: true,
    max_redemptions: 1,
    metadata
  };

  try {
    return await stripe.promotionCodes.create(params);
  } catch (error) {
    const unsupportedCouponParam = error?.param === "coupon"
      || error?.code === "parameter_unknown"
      || error?.raw?.param === "coupon";
    if (!unsupportedCouponParam) throw error;

    const { coupon: ignoredCoupon, ...currentParams } = params;
    return stripe.promotionCodes.create({
      ...currentParams,
      promotion: {
        type: "coupon",
        coupon: coupon.id
      }
    });
  }
}

async function findPromotionCode(stripe, code) {
  const result = await stripe.promotionCodes.list({ code, limit: 100 });
  return (result.data || []).find(
    (item) => normalizeTrapPassSerial(item.code) === code
  ) || null;
}

async function ensureTrapPassPromotionCode(stripe, serial, details = {}) {
  const code = normalizeTrapPassSerial(serial);
  if (!code) return { ready: false, reason: "invalid_serial" };

  const coupon = await ensureTrapPassCoupon(stripe);
  const existing = await findPromotionCode(stripe, code);

  if (existing) {
    const existingCouponId = couponIdFromPromotionCode(existing);
    if (existingCouponId && existingCouponId !== coupon.id) {
      throw new Error(`Promotion code ${code} already belongs to another Stripe coupon.`);
    }

    const exhausted = Number(existing.max_redemptions) > 0
      && Number(existing.times_redeemed) >= Number(existing.max_redemptions);
    if (exhausted) {
      return { ready: false, reason: "already_redeemed", promotionCode: existing };
    }
    if (!existing.active) {
      const promotionCode = await stripe.promotionCodes.update(existing.id, { active: true });
      return { ready: true, created: false, reactivated: true, promotionCode };
    }
    return { ready: true, created: false, promotionCode: existing };
  }

  const promotionCode = await createPromotionCode(stripe, coupon, code, {
    benefit: TRAP_PASS_PROMOTION_BENEFIT,
    trap_pass_serial: code,
    source: String(details.source || "trap_pass").slice(0, 500),
    tier: String(details.tier || "").slice(0, 500),
    product_key: String(details.productKey || "").slice(0, 500)
  });
  return { ready: true, created: true, promotionCode };
}

async function deactivateTrapPassPromotionCode(stripe, serial) {
  const code = normalizeTrapPassSerial(serial);
  if (!code) return { disabled: false, reason: "invalid_serial" };
  const existing = await findPromotionCode(stripe, code);
  if (!existing || existing.metadata?.benefit !== TRAP_PASS_PROMOTION_BENEFIT) {
    return { disabled: false, reason: "not_managed" };
  }
  if (!existing.active) return { disabled: false, reason: "already_inactive" };
  const promotionCode = await stripe.promotionCodes.update(existing.id, { active: false });
  return { disabled: true, promotionCode };
}

async function fetchSupabaseRows(config, table, select) {
  const rows = [];
  const pageSize = 1000;
  for (let offset = 0; ; offset += pageSize) {
    const response = await fetch(
      `${config.url}/rest/v1/${table}?select=${encodeURIComponent(select)}&limit=${pageSize}&offset=${offset}`,
      {
        method: "GET",
        headers: {
          apikey: config.key,
          Authorization: `Bearer ${config.key}`,
          Accept: "application/json"
        }
      }
    );
    const text = await response.text();
    if (!response.ok) {
      throw new Error(`Supabase ${table} promotion sync failed ${response.status}: ${text}`);
    }
    const page = text ? JSON.parse(text) : [];
    rows.push(...page);
    if (page.length < pageSize) return rows;
  }
}

async function listAllPromotionCodes(stripe) {
  const rows = [];
  let startingAfter;
  do {
    const page = await stripe.promotionCodes.list({
      limit: 100,
      ...(startingAfter ? { starting_after: startingAfter } : {})
    });
    rows.push(...(page.data || []));
    startingAfter = page.has_more && page.data?.length
      ? page.data[page.data.length - 1].id
      : "";
  } while (startingAfter);
  return rows;
}

async function runPromotionSync(stripe, supabaseConfig) {
  const [freePasses, entitlements, promotionCodes] = await Promise.all([
    fetchSupabaseRows(supabaseConfig, "trap_passes", "serial_number,status"),
    fetchSupabaseRows(
      supabaseConfig,
      "stripe_trap_pass_entitlements",
      "serial_number,status,tier,product_key"
    ),
    listAllPromotionCodes(stripe)
  ]);
  const desired = new Map();

  for (const pass of freePasses) {
    if (!isActiveStatus(pass.status)) continue;
    const code = freePassPromotionCode(pass);
    if (code) desired.set(code, { source: "free_claim", tier: "Free Pass" });
  }
  for (const entitlement of entitlements) {
    if (!isActiveStatus(entitlement.status)) continue;
    const code = normalizeTrapPassSerial(entitlement.serial_number);
    if (code) {
      desired.set(code, {
        source: "stripe_entitlement",
        tier: entitlement.tier,
        productKey: entitlement.product_key
      });
    }
  }

  let created = 0;
  let reactivated = 0;
  let disabled = 0;

  await ensureTrapPassCoupon(stripe);
  for (const [code, details] of desired) {
    const result = await ensureTrapPassPromotionCode(stripe, code, details);
    if (result.created) created += 1;
    if (result.reactivated) reactivated += 1;
  }

  for (const promotionCode of promotionCodes) {
    const code = normalizeTrapPassSerial(promotionCode.code);
    if (
      promotionCode.active
      && promotionCode.metadata?.benefit === TRAP_PASS_PROMOTION_BENEFIT
      && !desired.has(code)
    ) {
      await stripe.promotionCodes.update(promotionCode.id, { active: false });
      disabled += 1;
    }
  }

  return {
    ready: true,
    serials: desired.size,
    created,
    reactivated,
    disabled
  };
}

async function syncTrapPassPromotionCodes(stripe, supabaseConfig, options = {}) {
  if (!stripe || !supabaseConfig?.url || !supabaseConfig?.key) {
    return { ready: false, reason: "missing_config" };
  }
  if (!options.force && Date.now() - lastSyncAt < SYNC_TTL_MS) {
    return { ready: true, cached: true };
  }
  if (activeSync) return activeSync;

  activeSync = runPromotionSync(stripe, supabaseConfig)
    .then((result) => {
      lastSyncAt = Date.now();
      return result;
    })
    .finally(() => {
      activeSync = null;
    });
  return activeSync;
}

module.exports = {
  TRAP_PASS_COUPON_ID,
  TRAP_PASS_DISCOUNT_PERCENT,
  TRAP_PASS_PROMOTION_BENEFIT,
  deactivateTrapPassPromotionCode,
  ensureTrapPassCoupon,
  ensureTrapPassPromotionCode,
  freePassPromotionCode,
  isActiveStatus,
  normalizeTrapPassSerial,
  syncTrapPassPromotionCodes
};
