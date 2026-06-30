const DEFAULT_ALLOWED_ORIGINS = [
  "https://imhighoncrackandihaveagun.com",
  "https://www.imhighoncrackandihaveagun.com",
  "https://imhighoncrackandihaveagun-site.vercel.app",
  "http://127.0.0.1:8876",
  "http://localhost:8876"
];

function allowedOrigins() {
  return new Set([
    ...DEFAULT_ALLOWED_ORIGINS,
    ...String(process.env.CHECKOUT_ALLOWED_ORIGINS || "")
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean)
  ]);
}

function applyCors(req, res) {
  const origin = req.headers.origin;
  if (!origin || !allowedOrigins().has(origin)) return;

  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Vary", "Origin");
}

function handleCors(req, res, methods) {
  applyCors(req, res);
  res.setHeader("Access-Control-Allow-Methods", methods.join(", "));
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Max-Age", "86400");

  if (req.method !== "OPTIONS") return false;
  res.statusCode = 204;
  res.end();
  return true;
}

module.exports = {
  applyCors,
  handleCors
};
