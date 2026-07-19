const path = require("path");
const { pathToFileURL } = require("url");
const { handleCors } = require("../_utils/cors");

const CURRENT_RELEASE = {
  id: "gen-2-wave-1-no-brakes",
  name: "No Brakes",
  generation: 2,
  waveNumber: 1,
  prefix: "NB",
  frontArtwork: "/assets/trap-house/trap-pass-no-brakes-current-approved.png",
  backArtwork: "",
  frontPlaceholder: "NO BRAKES",
  backPlaceholder: "IHOCAIHAG TRAP PASS / NO BRAKES"
};

const HOLDER_FIRST_NUMBER = 100;
const PAID_PREFIX_OFFSETS = {
  HS: 700000,
  CFT: 800000
};

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

function supabaseServerConfig() {
  const url = serverEnv("SUPABASE_URL") || serverEnv("TRAP_HOUSE_SUPABASE_URL");
  const key = serverEnv("SUPABASE_SERVICE_ROLE_KEY")
    || serverEnv("SUPABASE_SECRET_KEY")
    || serverEnv("TRAP_HOUSE_SUPABASE_SERVICE_ROLE_KEY")
    || serverEnv("TRAP_HOUSE_SUPABASE_SECRET_KEY");
  return url && key ? { url: url.replace(/\/+$/, ""), key } : null;
}

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function normalizeSerial(value) {
  return String(value || "")
    .replace(/[<>\u0000-\u001f\u007f]/g, "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");
}

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(value));
}

function formatHolderId(holderNumber) {
  return `TP-${String(Number(holderNumber) || HOLDER_FIRST_NUMBER).padStart(4, "0")}`;
}

function formatCardSerial(holderNumber) {
  return `${CURRENT_RELEASE.prefix}-${String(Number(holderNumber) || HOLDER_FIRST_NUMBER).padStart(4, "0")}`;
}

function legacyLiveSerialToHolderNumber(serialNumber) {
  return HOLDER_FIRST_NUMBER + Math.max(0, (Number(serialNumber) || 1) - 1);
}

function holderNumberToLegacyLivePassId(holderNumber) {
  const legacySerial = Number(holderNumber) - HOLDER_FIRST_NUMBER + 1;
  if (!Number.isFinite(legacySerial) || legacySerial < 1) return "";
  return `W3-${String(legacySerial).padStart(5, "0")}`;
}

function legacyLiveLookupQuery(value) {
  const clean = normalizeSerial(value);
  const holderMatch = clean.match(/^TP-(\d{4,})$/);
  if (holderMatch) return holderNumberToLegacyLivePassId(Number(holderMatch[1]));
  const cardMatch = clean.match(/^NB-(\d{4,})(?:-R[2-9]\d*)?$/);
  if (cardMatch) return holderNumberToLegacyLivePassId(Number(cardMatch[1]));
  return clean;
}

function paidHolderNumber(serialNumber) {
  const clean = normalizeSerial(serialNumber);
  const match = clean.match(/^([A-Z]+)-0*(\d+)$/);
  if (!match) return 900000;
  const offset = PAID_PREFIX_OFFSETS[match[1]] || 900000;
  return offset + Math.max(1, Number(match[2]) || 1);
}

async function parseRequest(req) {
  if (req.method === "GET") {
    const url = new URL(req.url || "/", "https://imhighoncrackandihaveagun.com");
    return { query: url.searchParams.get("query") || "" };
  }
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") return JSON.parse(req.body || "{}");

  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > 1024 * 256) {
        reject(new Error("request_body_too_large"));
        req.destroy();
      }
    });
    req.on("end", () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch (error) {
        reject(new Error("invalid_json_body"));
      }
    });
    req.on("error", reject);
  });
}

async function supabaseFetch(route) {
  const config = supabaseServerConfig();
  if (!config) throw new Error("supabase_not_configured");
  const response = await fetch(`${config.url}${route}`, {
    method: "GET",
    headers: {
      apikey: config.key,
      Authorization: `Bearer ${config.key}`,
      Accept: "application/json"
    }
  });
  const text = await response.text();
  const body = text ? JSON.parse(text) : null;
  if (!response.ok) {
    const error = new Error("supabase_query_failed");
    error.status = response.status;
    error.body = body || text;
    throw error;
  }
  return Array.isArray(body) ? body : [];
}

async function findFreePass(query) {
  const select = "trap_pass_id,wave_number,wave_name,serial_number,display_name,discord_role,status,missions_completed,unlock_level,thread_keys,created_at";
  if (isEmail(query)) {
    const rows = await supabaseFetch(
      `/rest/v1/trap_passes?select=${encodeURIComponent(select)}&email_normalized=eq.${encodeURIComponent(normalizeEmail(query))}&limit=1`
    );
    return rows[0] || null;
  }

  const legacyQuery = legacyLiveLookupQuery(query);
  if (!legacyQuery) return null;
  const rows = await supabaseFetch(
    `/rest/v1/trap_passes?select=${encodeURIComponent(select)}&trap_pass_id=eq.${encodeURIComponent(legacyQuery)}&limit=1`
  );
  return rows[0] || null;
}

async function findStripeEntitlements(query) {
  const select = "serial_number,tier,status,product_key,customer_email,created_at";
  const cleanSerial = normalizeSerial(query);
  const filter = isEmail(query)
    ? `customer_email=eq.${encodeURIComponent(normalizeEmail(query))}`
    : `serial_number=eq.${encodeURIComponent(cleanSerial)}`;
  return supabaseFetch(
    `/rest/v1/stripe_trap_pass_entitlements?select=${encodeURIComponent(select)}&${filter}&order=created_at.asc`
  );
}

function freeCardFromPass(pass) {
  const holderNumber = legacyLiveSerialToHolderNumber(pass.serial_number);
  return {
    cardSerial: formatCardSerial(holderNumber),
    waveId: CURRENT_RELEASE.id,
    waveName: CURRENT_RELEASE.name,
    generation: CURRENT_RELEASE.generation,
    waveNumber: CURRENT_RELEASE.waveNumber,
    status: pass.status || "active",
    frontArtwork: CURRENT_RELEASE.frontArtwork,
    backArtwork: CURRENT_RELEASE.backArtwork,
    frontPlaceholder: CURRENT_RELEASE.frontPlaceholder,
    backPlaceholder: CURRENT_RELEASE.backPlaceholder
  };
}

function cardStatus(status) {
  const clean = String(status || "active").toLowerCase();
  if (clean === "active" || clean === "trialing") return "active";
  return clean || "review_required";
}

function stripeCardFromEntitlement(catalog, entitlement) {
  const product = catalog.getProductByKey(entitlement.product_key);
  return {
    cardSerial: normalizeSerial(entitlement.serial_number),
    waveId: CURRENT_RELEASE.id,
    waveName: entitlement.tier || product?.trapPassTier || product?.name || "Trap Pass",
    generation: CURRENT_RELEASE.generation,
    waveNumber: CURRENT_RELEASE.waveNumber,
    status: cardStatus(entitlement.status),
    frontArtwork: product?.imagePath || CURRENT_RELEASE.frontArtwork,
    backArtwork: "",
    frontPlaceholder: String(entitlement.tier || "TRAP PASS").toUpperCase(),
    backPlaceholder: `IHOCAIHAG TRAP PASS / ${String(entitlement.tier || "ACCESS").toUpperCase()}`
  };
}

function tierFromEntitlements(entitlements) {
  if (entitlements.some((item) => item.product_key === "handy_sass_pass" && cardStatus(item.status) === "active")) {
    return { id: "handy-sass", label: "Handy Sass", publicLabel: "HANDY SASS HOLDER" };
  }
  if (entitlements.some((item) => item.product_key === "cash_for_trash_monthly" && cardStatus(item.status) === "active")) {
    return { id: "cash-for-trash", label: "Cash For Trash", publicLabel: "CASH FOR TRASH HOLDER" };
  }
  return { id: "free", label: "Free Pass", publicLabel: "FREE PASS HOLDER" };
}

function dedupeCards(cards) {
  const seen = new Set();
  return cards.filter((card) => {
    if (!card.cardSerial || seen.has(card.cardSerial)) return false;
    seen.add(card.cardSerial);
    return true;
  });
}

async function walletFromRecords(freePass, entitlements) {
  const catalog = await loadCatalog();
  const cleanEntitlements = entitlements.filter((item) => {
    const status = cardStatus(item.status);
    return item.serial_number && status !== "refunded" && status !== "canceled";
  });
  if (!freePass && !cleanEntitlements.length) return null;

  const freeHolderNumber = freePass ? legacyLiveSerialToHolderNumber(freePass.serial_number) : 0;
  const holderNumber = freeHolderNumber || paidHolderNumber(cleanEntitlements[0]?.serial_number);
  const tier = tierFromEntitlements(cleanEntitlements);
  const freeCard = freePass ? freeCardFromPass(freePass) : null;
  const paidCards = cleanEntitlements.map((item) => stripeCardFromEntitlement(catalog, item));
  const cards = dedupeCards([...paidCards, freeCard].filter(Boolean));
  const timestamp = freePass?.created_at || cleanEntitlements[0]?.created_at || new Date().toISOString();
  const trapIdentity = String(freePass?.display_name || "").trim();

  return {
    holderPublicId: formatHolderId(holderNumber),
    sourcePassId: freePass?.trap_pass_id || "",
    sourceSerialNumber: freePass?.serial_number || null,
    trapIdentity,
    displayIdentity: trapIdentity || formatHolderId(holderNumber),
    originalEntryWave: CURRENT_RELEASE.name,
    originalEntryWaveLabel: CURRENT_RELEASE.name,
    currentTierId: tier.id,
    currentTierLabel: tier.label,
    currentTierPublicLabel: tier.publicLabel,
    memberSince: timestamp,
    publicProfileEnabled: false,
    publicProfileUrl: "",
    selectedPublicThreadSlugs: Array.isArray(freePass?.thread_keys) ? freePass.thread_keys : [],
    cards,
    featuredPass: cards[0] || null,
    fullWalletAvailable: false,
    publicClaimOnly: true,
    serverBacked: true
  };
}

module.exports = async function handler(req, res) {
  res.setHeader("Allow", "GET, POST, OPTIONS");
  if (handleCors(req, res, ["GET", "POST", "OPTIONS"])) return;

  if (req.method !== "GET" && req.method !== "POST") {
    return sendJson(res, 405, { error: "method_not_allowed" });
  }

  if (!supabaseServerConfig()) {
    return sendJson(res, 503, { error: "wallet_not_ready" });
  }

  try {
    const body = await parseRequest(req);
    const query = String(body.query || body.email || body.serial || "").trim();
    if (!query) return sendJson(res, 400, { error: "query_required" });

    const [freePass, entitlements] = await Promise.all([
      findFreePass(query).catch(() => null),
      findStripeEntitlements(query).catch(() => [])
    ]);
    const wallet = await walletFromRecords(freePass, entitlements);
    return sendJson(res, 200, { ok: true, found: Boolean(wallet), wallet });
  } catch (error) {
    const status = error.message === "request_body_too_large" ? 413 : 500;
    return sendJson(res, status, {
      error: status === 413 ? "request_body_too_large" : "wallet_lookup_failed"
    });
  }
};
