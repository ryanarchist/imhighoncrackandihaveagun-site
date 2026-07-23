const crypto = require("crypto");
const {
  cleanText,
  isEmail,
  normalizeEmail
} = require("./trapPassNotifications");

const DOCUMENTARY_PRODUCT_KEY = "raw_doc_preorder";
const DEFAULT_REPLY_TO = "imhighoncrackandihaveagun@gmail.com";
const DEFAULT_SITE_URL = "https://imhighoncrackandihaveagun.com";

function serverEnv(name) {
  return String(process.env[name] || "").trim();
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

function senderAddress(value) {
  const clean = cleanText(value, 500);
  const bracketed = clean.match(/<([^<>]+)>/);
  const email = normalizeEmail(bracketed?.[1] || clean);
  return isEmail(email) ? `IHOCAIHAG Documentary <${email}>` : clean;
}

function documentaryNotificationConfig() {
  const apiKey = serverEnv("RESEND_API_KEY");
  const configuredFrom = serverEnv("DOCUMENTARY_CONFIRMATION_FROM");
  const fallbackFrom = serverEnv("RESEND_FROM") || serverEnv("TRAP_PASS_NOTIFY_FROM");
  const from = configuredFrom || senderAddress(fallbackFrom);
  const replyTo = serverEnv("DOCUMENTARY_CONFIRMATION_REPLY_TO")
    || serverEnv("TRAP_PASS_NOTIFY_TO")
    || DEFAULT_REPLY_TO;
  const siteUrl = (serverEnv("PUBLIC_SITE_URL") || DEFAULT_SITE_URL).replace(/\/+$/, "");
  const missing = [];

  if (!apiKey) missing.push("RESEND_API_KEY");
  if (!from) missing.push("DOCUMENTARY_CONFIRMATION_FROM");
  if (!isEmail(replyTo)) missing.push("DOCUMENTARY_CONFIRMATION_REPLY_TO");

  return {
    apiKey,
    from,
    replyTo,
    siteUrl,
    configured: missing.length === 0,
    missing
  };
}

function documentaryPreorderReference(checkoutSessionId) {
  const cleanSessionId = cleanText(checkoutSessionId, 500);
  if (!cleanSessionId) return "";
  const digest = crypto
    .createHash("sha256")
    .update(cleanSessionId)
    .digest("hex")
    .slice(0, 12)
    .toUpperCase();
  return `DOC-${digest}`;
}

function formatMoney(amount, currency) {
  const cents = Number(amount);
  const code = String(currency || "usd").trim().toUpperCase();
  if (!Number.isFinite(cents)) return "Payment confirmed";
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: code
    }).format(cents / 100);
  } catch (error) {
    return `${(cents / 100).toFixed(2)} ${code}`;
  }
}

function confirmationDetails(event) {
  const email = normalizeEmail(event.customerEmail || event.email);
  const checkoutSessionId = cleanText(event.checkoutSessionId, 500);
  return {
    email,
    checkoutSessionId,
    reference: documentaryPreorderReference(checkoutSessionId),
    productName: cleanText(
      event.productName || "RAW DOCUMENTARY preorder 1st day access",
      500
    ),
    amount: formatMoney(event.amountTotal, event.currency),
    quantity: Math.max(1, Number(event.quantity) || 1)
  };
}

function confirmationText(event) {
  const details = confirmationDetails(event);
  return [
    "YOUR DOCUMENTARY PREORDER IS CONFIRMED",
    "",
    "Payment was confirmed. This email is your verification for first-day documentary access.",
    "",
    `Verification reference: ${details.reference}`,
    `Purchaser email: ${details.email}`,
    `Order: ${details.productName}`,
    `Quantity: ${details.quantity}`,
    `Amount paid: ${details.amount}`,
    "",
    "Keep this email. Release and access instructions will be sent to this same email address when the documentary material is ready.",
    "",
    "Questions? Reply to this email.",
    "",
    "IHOCAIHAG",
    DEFAULT_SITE_URL
  ].join("\n");
}

function confirmationHtml(event, config) {
  const details = confirmationDetails(event);
  const rows = [
    ["Verification reference", details.reference],
    ["Purchaser email", details.email],
    ["Order", details.productName],
    ["Quantity", String(details.quantity)],
    ["Amount paid", details.amount]
  ];

  return `
    <div style="margin:0;padding:32px 16px;background:#070707;color:#f1ece4;font-family:Arial,sans-serif;">
      <div style="max-width:640px;margin:0 auto;border:1px solid #3b2727;background:#120e0e;">
        <div style="padding:28px;border-bottom:3px solid #a9151b;">
          <div style="color:#d72b31;font-size:13px;font-weight:700;letter-spacing:1px;">IHOCAIHAG DOCUMENTARY</div>
          <h1 style="margin:10px 0 0;color:#f1ece4;font-size:30px;line-height:1.1;">Your preorder is confirmed.</h1>
        </div>
        <div style="padding:28px;">
          <p style="margin:0 0 22px;color:#d8c9bc;font-size:17px;line-height:1.6;">
            Payment was confirmed. This email is your verification for first-day documentary access.
          </p>
          <table cellpadding="10" cellspacing="0" style="width:100%;border-collapse:collapse;color:#f1ece4;">
            ${rows.map(([label, value]) => `
              <tr>
                <td style="border:1px solid #3b2727;color:#bb9f8a;font-weight:700;">${escapeHtml(label)}</td>
                <td style="border:1px solid #3b2727;">${escapeHtml(value)}</td>
              </tr>
            `).join("")}
          </table>
          <p style="margin:24px 0 0;color:#d8c9bc;font-size:16px;line-height:1.6;">
            Keep this email. Release and access instructions will be sent to this same email address when the documentary material is ready.
          </p>
          <p style="margin:24px 0 0;">
            <a href="${escapeHtml(config.siteUrl)}" style="color:#ffffff;background:#a9151b;padding:12px 18px;text-decoration:none;font-weight:700;">VISIT THE ARCHIVE</a>
          </p>
        </div>
      </div>
    </div>
  `;
}

async function sendDocumentaryPreorderConfirmation(event = {}) {
  if (event.productKey !== DOCUMENTARY_PRODUCT_KEY) {
    return { sent: false, reason: "not_documentary_preorder" };
  }

  const details = confirmationDetails(event);
  if (!isEmail(details.email)) return { sent: false, reason: "invalid_email" };
  if (!details.checkoutSessionId) return { sent: false, reason: "missing_checkout_session" };

  const config = documentaryNotificationConfig();
  if (!config.configured) {
    const error = new Error("documentary_confirmation_env_missing");
    error.missing = config.missing;
    throw error;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": `documentary-preorder/${details.checkoutSessionId}`
    },
    body: JSON.stringify({
      from: config.from,
      to: [details.email],
      reply_to: config.replyTo,
      subject: `Documentary preorder confirmed - ${details.reference}`,
      text: confirmationText(event),
      html: confirmationHtml(event, config),
      tags: [
        { name: "category", value: "documentary_preorder" },
        { name: "product", value: DOCUMENTARY_PRODUCT_KEY }
      ]
    })
  });
  const text = await response.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch (error) {
    data = { message: text };
  }

  if (!response.ok) {
    const error = new Error("documentary_confirmation_failed");
    error.status = response.status;
    error.body = data;
    throw error;
  }

  return {
    sent: true,
    id: data.id || null,
    reference: details.reference
  };
}

module.exports = {
  DOCUMENTARY_PRODUCT_KEY,
  confirmationText,
  documentaryNotificationConfig,
  documentaryPreorderReference,
  sendDocumentaryPreorderConfirmation
};
