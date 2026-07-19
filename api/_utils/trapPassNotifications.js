const DEFAULT_NOTIFY_TO = "imhighoncrackandihaveagun@gmail.com";

function serverEnv(name) {
  return String(process.env[name] || "").trim();
}

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(value));
}

function cleanText(value, maxLength = 260) {
  return String(value || "")
    .replace(/[<>\u0000-\u001f\u007f]/g, "")
    .trim()
    .slice(0, maxLength);
}

function escapeHtml(value) {
  return String(value || "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

function notificationConfig() {
  const apiKey = serverEnv("RESEND_API_KEY");
  const to = serverEnv("TRAP_PASS_NOTIFY_TO") || DEFAULT_NOTIFY_TO;
  const from = serverEnv("TRAP_PASS_NOTIFY_FROM") || serverEnv("RESEND_FROM");
  const replyTo = serverEnv("TRAP_PASS_NOTIFY_REPLY_TO") || to;
  const missing = [];

  if (!apiKey) missing.push("RESEND_API_KEY");
  if (!from) missing.push("TRAP_PASS_NOTIFY_FROM");
  if (!to) missing.push("TRAP_PASS_NOTIFY_TO");

  return {
    apiKey,
    to,
    from,
    replyTo,
    configured: missing.length === 0,
    missing
  };
}

function displayValue(value, fallback = "Not provided") {
  const clean = cleanText(value, 500);
  return clean || fallback;
}

function signupSubject(event) {
  const email = normalizeEmail(event.email);
  if (event.type === "stripe_checkout") return `New paid Trap Pass: ${email}`;
  return `New Trap Pass signup: ${email}`;
}

function signupText(event) {
  const lines = [
    event.type === "stripe_checkout" ? "A paid Trap Pass was purchased." : "A new free Trap Pass was claimed.",
    "",
    `Email: ${normalizeEmail(event.email)}`,
    `Trap identity: ${displayValue(event.trapIdentity)}`,
    `Holder ID: ${displayValue(event.holderPublicId)}`,
    `Card serial: ${displayValue(event.cardSerial || event.trapPassSerial || event.sourcePassId)}`,
    `Tier/product: ${displayValue(event.tier || event.productName || event.productKey)}`,
    `Source: ${displayValue(event.source || event.type || "trap_pass_claim")}`,
    `Page: ${displayValue(event.pagePath)}`,
    `Time: ${new Date().toISOString()}`
  ];

  return lines.join("\n");
}

function signupHtml(event) {
  const rows = [
    ["Email", normalizeEmail(event.email)],
    ["Trap identity", displayValue(event.trapIdentity)],
    ["Holder ID", displayValue(event.holderPublicId)],
    ["Card serial", displayValue(event.cardSerial || event.trapPassSerial || event.sourcePassId)],
    ["Tier/product", displayValue(event.tier || event.productName || event.productKey)],
    ["Source", displayValue(event.source || event.type || "trap_pass_claim")],
    ["Page", displayValue(event.pagePath)],
    ["Time", new Date().toISOString()]
  ];

  return `
    <div style="font-family: Arial, sans-serif; color: #15110f;">
      <h1 style="margin: 0 0 16px;">${escapeHtml(event.type === "stripe_checkout" ? "New paid Trap Pass" : "New Trap Pass signup")}</h1>
      <table cellpadding="8" cellspacing="0" style="border-collapse: collapse;">
        ${rows.map(([label, value]) => `
          <tr>
            <td style="border: 1px solid #ddd; font-weight: 700;">${escapeHtml(label)}</td>
            <td style="border: 1px solid #ddd;">${escapeHtml(value)}</td>
          </tr>
        `).join("")}
      </table>
    </div>
  `;
}

async function notifyTrapPassSignup(event = {}) {
  const email = normalizeEmail(event.email || event.customerEmail);
  if (!isEmail(email)) return { sent: false, reason: "invalid_email" };

  const config = notificationConfig();
  if (!config.configured) {
    return { sent: false, reason: "notification_env_missing", missing: config.missing };
  }

  const body = {
    from: config.from,
    to: [config.to],
    reply_to: config.replyTo,
    subject: signupSubject({ ...event, email }),
    text: signupText({ ...event, email }),
    html: signupHtml({ ...event, email })
  };

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : {};

  if (!response.ok) {
    const error = new Error("trap_pass_notification_failed");
    error.status = response.status;
    error.body = data;
    throw error;
  }

  return {
    sent: true,
    id: data.id || null
  };
}

module.exports = {
  notifyTrapPassSignup,
  notificationConfig,
  normalizeEmail,
  isEmail,
  cleanText
};
