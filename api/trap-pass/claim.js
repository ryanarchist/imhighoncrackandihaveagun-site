const Stripe = require("stripe");
const { handleCors } = require("../_utils/cors");
const {
  cleanText,
  isEmail,
  normalizeEmail,
  notificationConfig,
  notifyTrapPassSignup
} = require("../_utils/trapPassNotifications");
const {
  deactivateTrapPassPromotionCode,
  ensureTrapPassPromotionCode,
  freePassPromotionCode,
  isActiveStatus
} = require("../_utils/trapPassPromotions");

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
      if (raw.length > 1024 * 64) {
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

async function supabaseRpc(functionName, payload) {
  const config = supabaseServerConfig();
  if (!config) throw new Error("supabase_not_configured");
  const response = await fetch(`${config.url}/rest/v1/rpc/${functionName}`, {
    method: "POST",
    headers: {
      apikey: config.key,
      Authorization: `Bearer ${config.key}`,
      "Content-Type": "application/json",
      Accept: "application/json"
    },
    body: JSON.stringify(payload)
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : {};

  if (!response.ok) {
    const error = new Error("supabase_claim_failed");
    error.status = response.status;
    error.body = data;
    throw error;
  }

  return data;
}

function passFromResult(result) {
  return result?.pass || result?.[0]?.pass || null;
}

module.exports = async function handler(req, res) {
  res.setHeader("Allow", "GET, POST, OPTIONS");
  if (handleCors(req, res, ["GET", "POST", "OPTIONS"])) return;

  if (req.method === "GET") {
    const notify = notificationConfig();
    return sendJson(res, 200, {
      claimReady: Boolean(supabaseServerConfig()),
      notificationReady: notify.configured,
      notificationMissing: notify.missing
    });
  }

  if (req.method !== "POST") {
    return sendJson(res, 405, { error: "method_not_allowed" });
  }

  if (!supabaseServerConfig()) {
    return sendJson(res, 503, { error: "claim_not_ready" });
  }

  let body;
  try {
    body = await parseBody(req);
  } catch (error) {
    return sendJson(res, error.message === "request_body_too_large" ? 413 : 400, {
      error: error.message === "request_body_too_large" ? "request_body_too_large" : "invalid_request_body"
    });
  }

  const email = normalizeEmail(body.email);
  if (!isEmail(email)) {
    return sendJson(res, 400, { error: "valid_email_required" });
  }

  try {
    const result = await supabaseRpc("claim_trap_pass", {
      p_email: email,
      p_display_name: cleanText(body.trapIdentity || body.displayName, 40),
      p_discord_username: cleanText(body.discordUsername, 80),
      p_wallet_address: "",
      p_thread_keys: ["trap-pass-lore", "public-project-witness"]
    });
    const pass = passFromResult(result);
    let notification = { sent: false, reason: "existing_pass" };
    let discount = { ready: false, reason: "stripe_not_configured" };

    if (pass && serverEnv("STRIPE_SECRET_KEY")) {
      try {
        const stripe = new Stripe(serverEnv("STRIPE_SECRET_KEY"));
        const serial = freePassPromotionCode(pass);
        discount = isActiveStatus(pass.status)
          ? await ensureTrapPassPromotionCode(
            stripe,
            serial,
            { source: "free_claim", tier: "Free Pass" }
          )
          : await deactivateTrapPassPromotionCode(stripe, serial);
      } catch (error) {
        console.warn("Trap Pass discount registration failed:", error.message);
        discount = { ready: false, reason: "registration_failed" };
      }
    }

    if (pass && !result.existed) {
      try {
        notification = await notifyTrapPassSignup({
          type: "free_claim",
          source: "trap_pass_claim",
          email,
          trapIdentity: pass.display_name || body.trapIdentity || body.displayName || "",
          sourcePassId: pass.trap_pass_id || "",
          sourceSerialNumber: pass.serial_number || "",
          pagePath: cleanText(body.pagePath, 260),
          userAgent: cleanText(req.headers["user-agent"] || body.userAgent, 260),
          tier: "Free Pass"
        });
      } catch (error) {
        console.warn("Trap Pass signup notification failed:", error.message);
        notification = { sent: false, reason: "notification_failed" };
      }
    }

    return sendJson(res, 200, {
      ...result,
      ok: true,
      notificationSent: Boolean(notification.sent),
      trapPassDiscountReady: Boolean(discount.ready)
    });
  } catch (error) {
    console.error("Trap Pass claim failed:", error.message);
    return sendJson(res, 500, {
      error: "trap_pass_claim_failed",
      message: "Trap Pass signup is unavailable right now."
    });
  }
};
