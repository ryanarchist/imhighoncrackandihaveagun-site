function sendJson(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(body));
}

function serverEnv(name) {
  return String(process.env[name] || "").trim();
}

function hasSupabaseSecret() {
  return Boolean(
    serverEnv("SUPABASE_SERVICE_ROLE_KEY")
      || serverEnv("SUPABASE_SECRET_KEY")
      || serverEnv("TRAP_HOUSE_SUPABASE_SERVICE_ROLE_KEY")
      || serverEnv("TRAP_HOUSE_SUPABASE_SECRET_KEY")
  );
}

module.exports = async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.setHeader("Allow", "GET, OPTIONS");
    return sendJson(res, 204, {});
  }

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return sendJson(res, 405, { error: "method_not_allowed" });
  }

  const missing = [];
  if (!serverEnv("STRIPE_SECRET_KEY")) missing.push("STRIPE_SECRET_KEY");
  if (!serverEnv("STRIPE_WEBHOOK_SECRET")) missing.push("STRIPE_WEBHOOK_SECRET");
  if (!serverEnv("SUPABASE_URL") && !serverEnv("TRAP_HOUSE_SUPABASE_URL")) missing.push("SUPABASE_URL");
  if (!hasSupabaseSecret()) missing.push("SUPABASE_SECRET_KEY");

  const ready = missing.length === 0;
  return sendJson(res, ready ? 200 : 503, {
    ready,
    mode: serverEnv("STRIPE_SECRET_KEY").startsWith("sk_live_") ? "live" : "test",
    missing
  });
};
