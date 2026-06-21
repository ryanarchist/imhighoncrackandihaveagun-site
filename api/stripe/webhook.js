const path = require("path");
const { pathToFileURL } = require("url");
const Stripe = require("stripe");

async function loadCatalog() {
  const catalogPath = path.join(__dirname, "..", "..", "scripts", "stripe", "products.mjs");
  return import(pathToFileURL(catalogPath).href);
}

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

function sendJson(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(body));
}

function supabaseConfig() {
  const url = process.env.SUPABASE_URL || process.env.TRAP_HOUSE_SUPABASE_URL;
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY
    || process.env.SUPABASE_SECRET_KEY
    || process.env.TRAP_HOUSE_SUPABASE_SERVICE_ROLE_KEY
    || process.env.TRAP_HOUSE_SUPABASE_SECRET_KEY;
  if (!url || !serviceRoleKey) return null;
  return {
    url: url.replace(/\/+$/, ""),
    serviceRoleKey
  };
}

function requireSupabase() {
  const config = supabaseConfig();
  if (!config) {
    throw new Error("Supabase server env is missing. Set SUPABASE_URL and SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY.");
  }
  return config;
}

async function supabaseFetch(route, options = {}) {
  const config = requireSupabase();
  const response = await fetch(`${config.url}${route}`, {
    ...options,
    headers: {
      apikey: config.serviceRoleKey,
      Authorization: `Bearer ${config.serviceRoleKey}`,
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Supabase ${route} failed ${response.status}: ${text}`);
  }

  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch (error) {
    return text;
  }
}

async function upsertRow(table, row, conflictColumn) {
  const query = conflictColumn ? `?on_conflict=${encodeURIComponent(conflictColumn)}` : "";
  const result = await supabaseFetch(`/rest/v1/${table}${query}`, {
    method: "POST",
    headers: {
      Prefer: conflictColumn
        ? "resolution=merge-duplicates,return=representation"
        : "return=representation"
    },
    body: JSON.stringify(row)
  });
  return Array.isArray(result) ? result[0] : result;
}

async function patchRows(table, filter, row) {
  return supabaseFetch(`/rest/v1/${table}?${filter}`, {
    method: "PATCH",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify(row)
  });
}

async function nextTrapPassSerial(prefix) {
  const result = await supabaseFetch("/rest/v1/rpc/stripe_next_trap_pass_serial", {
    method: "POST",
    body: JSON.stringify({ p_prefix: prefix })
  });

  if (typeof result === "string") return result;
  if (result && typeof result === "object" && result.stripe_next_trap_pass_serial) {
    return result.stripe_next_trap_pass_serial;
  }
  throw new Error("Trap Pass serial RPC returned an empty value.");
}

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function statusFromSubscription(subscription) {
  const status = subscription?.status || "";
  if (status === "active" || status === "trialing") return "active";
  if (status === "past_due" || status === "unpaid" || status === "incomplete") return "past_due";
  if (status === "canceled" || status === "incomplete_expired") return "canceled";
  return status || "unknown";
}

function fulfillmentAccessStatus(session, subscription) {
  if (session.mode === "subscription") {
    const status = statusFromSubscription(subscription);
    return status === "active" ? "granted" : "pending_subscription";
  }
  return session.payment_status === "paid" ? "granted" : "pending_payment";
}

function productFromLineItem(catalog, lineItem) {
  const price = lineItem?.price;
  const lookupKey = price?.lookup_key;
  const envMatch = catalog.STRIPE_PRODUCTS.find((product) => process.env[product.envName] === price?.id);
  return catalog.getProductByLookupKey(lookupKey) || envMatch || null;
}

async function recordStripeEvent(event, status = "received") {
  return upsertRow("stripe_events", {
    stripe_event_id: event.id,
    event_type: event.type,
    livemode: Boolean(event.livemode),
    status,
    payload: event
  }, "stripe_event_id");
}

async function retrieveCustomerEmail(stripe, customerId) {
  if (!customerId) return "";
  try {
    const customer = await stripe.customers.retrieve(customerId);
    return normalizeEmail(customer.email);
  } catch (error) {
    console.warn("Could not retrieve Stripe customer email:", error.message);
    return "";
  }
}

async function handleCheckoutCompleted(stripe, catalog, sessionId) {
  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["customer", "subscription", "payment_intent"]
  });
  const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
    limit: 10,
    expand: ["data.price.product"]
  });
  const firstLineItem = lineItems.data[0];
  const product = catalog.getProductByKey(session.metadata?.product_key)
    || productFromLineItem(catalog, firstLineItem);

  if (!product) {
    throw new Error(`Could not match Checkout Session ${session.id} to a known product.`);
  }

  const subscription =
    session.subscription && typeof session.subscription === "object"
      ? session.subscription
      : null;
  const stripeCustomerId =
    typeof session.customer === "string" ? session.customer : session.customer?.id || "";
  const customerEmail = normalizeEmail(
    session.customer_details?.email
    || session.customer_email
    || (typeof session.customer === "object" ? session.customer.email : "")
    || await retrieveCustomerEmail(stripe, stripeCustomerId)
  );
  const accessStatus = fulfillmentAccessStatus(session, subscription);
  const shouldGrantTrapPass = product.grantsTrapPass && accessStatus === "granted";
  const trapPassSerial = shouldGrantTrapPass
    ? await nextTrapPassSerial(product.serialPrefix)
    : "";

  const order = await upsertRow("stripe_orders", {
    stripe_checkout_session_id: session.id,
    stripe_payment_intent_id:
      typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id || null,
    stripe_customer_id: stripeCustomerId || null,
    stripe_subscription_id:
      typeof session.subscription === "string" ? session.subscription : session.subscription?.id || null,
    customer_email: customerEmail || null,
    product_key: product.key,
    product_name: product.name,
    price_id: firstLineItem?.price?.id || null,
    lookup_key: firstLineItem?.price?.lookup_key || product.lookupKey,
    mode: session.mode,
    quantity: firstLineItem?.quantity || 1,
    amount_total: session.amount_total,
    currency: session.currency,
    payment_status: session.payment_status,
    subscription_status: subscription ? statusFromSubscription(subscription) : null,
    fulfillment_type: product.fulfillment,
    requires_shipping: Boolean(product.physical),
    shipping_details: session.shipping_details || null,
    access_status: accessStatus,
    trap_pass_serial: trapPassSerial || null,
    raw_session: session,
    updated_at: new Date().toISOString()
  }, "stripe_checkout_session_id");

  if (product.grantsTrapPass && trapPassSerial) {
    await upsertRow("stripe_trap_pass_entitlements", {
      stripe_checkout_session_id: session.id,
      stripe_customer_id: stripeCustomerId || null,
      stripe_subscription_id:
        typeof session.subscription === "string" ? session.subscription : session.subscription?.id || null,
      customer_email: customerEmail || null,
      product_key: product.key,
      tier: product.trapPassTier || product.name,
      serial_number: trapPassSerial,
      status: product.mode === "subscription" ? statusFromSubscription(subscription) : "active",
      order_id: order?.id || null,
      updated_at: new Date().toISOString()
    }, "stripe_checkout_session_id");
  }

  if (subscription) {
    await upsertSubscription(subscription, customerEmail, product);
  }
}

async function upsertSubscription(subscription, customerEmail = "", product = null) {
  const currentPeriodEnd = subscription.current_period_end
    ? new Date(subscription.current_period_end * 1000).toISOString()
    : null;

  await upsertRow("stripe_subscriptions", {
    stripe_subscription_id: subscription.id,
    stripe_customer_id: typeof subscription.customer === "string" ? subscription.customer : subscription.customer?.id || null,
    customer_email: normalizeEmail(customerEmail) || null,
    product_key: product?.key || subscription.metadata?.product_key || null,
    lookup_key: product?.lookupKey || subscription.metadata?.lookup_key || null,
    status: statusFromSubscription(subscription),
    current_period_end: currentPeriodEnd,
    cancel_at_period_end: Boolean(subscription.cancel_at_period_end),
    raw_subscription: subscription,
    updated_at: new Date().toISOString()
  }, "stripe_subscription_id");

  await patchRows(
    "stripe_trap_pass_entitlements",
    `stripe_subscription_id=eq.${encodeURIComponent(subscription.id)}`,
    {
      status: statusFromSubscription(subscription),
      updated_at: new Date().toISOString()
    }
  );
}

async function handleSubscriptionEvent(stripe, catalog, subscription) {
  const customerEmail = await retrieveCustomerEmail(
    stripe,
    typeof subscription.customer === "string" ? subscription.customer : subscription.customer?.id
  );
  const product = catalog.getProductByKey(subscription.metadata?.product_key);
  await upsertSubscription(subscription, customerEmail, product);
}

async function handleInvoiceEvent(invoice, status) {
  const subscriptionId =
    typeof invoice.subscription === "string" ? invoice.subscription : invoice.subscription?.id;
  if (!subscriptionId) return;

  await patchRows(
    "stripe_subscriptions",
    `stripe_subscription_id=eq.${encodeURIComponent(subscriptionId)}`,
    {
      status,
      last_invoice_id: invoice.id,
      updated_at: new Date().toISOString()
    }
  );

  await patchRows(
    "stripe_trap_pass_entitlements",
    `stripe_subscription_id=eq.${encodeURIComponent(subscriptionId)}`,
    {
      status: status === "active" ? "active" : "past_due",
      updated_at: new Date().toISOString()
    }
  );
}

async function handleRefund(charge) {
  const paymentIntentId =
    typeof charge.payment_intent === "string" ? charge.payment_intent : charge.payment_intent?.id;
  if (!paymentIntentId) return;

  await patchRows(
    "stripe_orders",
    `stripe_payment_intent_id=eq.${encodeURIComponent(paymentIntentId)}`,
    {
      payment_status: "refunded",
      access_status: "review_required",
      updated_at: new Date().toISOString()
    }
  );
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return sendJson(res, 405, { error: "method_not_allowed" });
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!secretKey || !webhookSecret) {
    return sendJson(res, 500, { error: "stripe_webhook_env_missing" });
  }

  const stripe = new Stripe(secretKey);
  const rawBody = await readRawBody(req);
  const signature = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (error) {
    console.error("Stripe webhook signature failed:", error.message);
    return sendJson(res, 400, { error: "invalid_signature" });
  }

  try {
    const catalog = await loadCatalog();
    await recordStripeEvent(event, "received");

    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(stripe, catalog, event.data.object.id);
        break;
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await handleSubscriptionEvent(stripe, catalog, event.data.object);
        break;
      case "invoice.paid":
        await handleInvoiceEvent(event.data.object, "active");
        break;
      case "invoice.payment_failed":
        await handleInvoiceEvent(event.data.object, "past_due");
        break;
      case "payment_intent.succeeded":
      case "payment_intent.payment_failed":
        break;
      case "charge.refunded":
        await handleRefund(event.data.object);
        break;
      default:
        break;
    }

    await recordStripeEvent(event, "processed");
    return sendJson(res, 200, { received: true });
  } catch (error) {
    console.error("Stripe webhook processing failed:", error.message);
    try {
      await recordStripeEvent(event, "failed");
    } catch (recordError) {
      console.error("Could not record failed Stripe event:", recordError.message);
    }
    return sendJson(res, 500, { error: "webhook_processing_failed" });
  }
};

module.exports.config = {
  api: {
    bodyParser: false
  }
};
