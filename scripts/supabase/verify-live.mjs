import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();

function loadEnvFile(fileName) {
  const filePath = path.join(root, fileName);
  if (!fs.existsSync(filePath)) return;

  const text = fs.readFileSync(filePath, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const index = trimmed.indexOf("=");
    const key = trimmed.slice(0, index).trim();
    let value = trimmed.slice(index + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvFile(".env.local");
loadEnvFile(".env");

function env(...names) {
  for (const name of names) {
    const value = process.env[name];
    if (value && !value.includes("REPLACE_ME")) return value;
  }
  return "";
}

function normalizeSupabaseUrl(value) {
  const trimmed = String(value || "").trim().replace(/\/+$/, "");
  if (!trimmed) return "";
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  return `https://${trimmed}.supabase.co`;
}

const supabaseUrl = normalizeSupabaseUrl(env(
  "SUPABASE_URL",
  "TRAP_HOUSE_SUPABASE_URL",
  "SUPABASE_PROJECT_ID",
  "TRAP_HOUSE_SUPABASE_PROJECT_ID"
));

const publishableKey = env(
  "SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_ANON_KEY",
  "TRAP_HOUSE_SUPABASE_PUBLISHABLE_KEY",
  "TRAP_HOUSE_SUPABASE_ANON_KEY"
);

const serviceKey = env(
  "SUPABASE_SECRET_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "TRAP_HOUSE_SUPABASE_SECRET_KEY",
  "TRAP_HOUSE_SUPABASE_SERVICE_ROLE_KEY"
);

const expectedTables = [
  "email_captures",
  "trap_pass_wave_counters",
  "trap_passes"
];

const optionalStripeTables = [
  "stripe_events",
  "stripe_orders",
  "stripe_subscriptions",
  "stripe_trap_pass_serial_counters",
  "stripe_trap_pass_entitlements"
];

function fail(message) {
  console.error(`FAIL: ${message}`);
  process.exitCode = 1;
}

function ok(message) {
  console.log(`OK: ${message}`);
}

function warn(message) {
  console.warn(`WARN: ${message}`);
}

async function supabaseFetch(key, route, options = {}) {
  const response = await fetch(`${supabaseUrl}${route}`, {
    ...options,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });

  const text = await response.text();
  let body = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }

  return { response, body, text };
}

async function checkTable(table) {
  const { response, text } = await supabaseFetch(serviceKey, `/rest/v1/${table}?select=*&limit=1`);
  if (!response.ok) {
    fail(`service key cannot read ${table}: ${response.status} ${text}`);
    return false;
  }
  ok(`table exists and service key can read ${table}`);
  return true;
}

async function checkAnonBlocked(table) {
  const { response } = await supabaseFetch(publishableKey, `/rest/v1/${table}?select=*&limit=1`);
  if (response.ok) {
    fail(`publishable key can directly read private table ${table}; RLS/grants are too open`);
    return;
  }
  ok(`publishable key cannot directly read private table ${table}`);
}

async function checkRpc() {
  const { response, body, text } = await supabaseFetch(
    publishableKey,
    "/rest/v1/rpc/lookup_trap_pass_public",
    {
      method: "POST",
      body: JSON.stringify({ p_query: "missing-pass-for-launch-check@example.com" })
    }
  );

  if (!response.ok) {
    fail(`lookup_trap_pass_public RPC failed: ${response.status} ${text}`);
    return;
  }

  const result = Array.isArray(body) ? body[0] : body;
  if (!result || result.found !== false || !Object.prototype.hasOwnProperty.call(result, "pass")) {
    fail("lookup_trap_pass_public did not return the expected safe not-found shape");
    return;
  }
  ok("lookup_trap_pass_public is callable from the publishable key and returns no private fields");
}

async function checkStorageBuckets() {
  const { response, body, text } = await supabaseFetch(serviceKey, "/storage/v1/bucket");
  if (!response.ok) {
    warn(`could not list storage buckets: ${response.status} ${text}`);
    return;
  }

  const buckets = Array.isArray(body) ? body.map((bucket) => bucket.name) : [];
  if (buckets.length) {
    ok(`storage buckets visible to service key: ${buckets.join(", ")}`);
  } else {
    ok("no storage buckets found; current email and Trap Pass storage does not require one");
  }
}

async function main() {
  console.log("Trap House Supabase live verification");
  console.log(`Project: ${supabaseUrl || "(missing)"}`);

  if (!supabaseUrl) fail("SUPABASE_URL or SUPABASE_PROJECT_ID is missing");
  if (!publishableKey) fail("SUPABASE_PUBLISHABLE_KEY or SUPABASE_ANON_KEY is missing");
  if (!serviceKey) fail("SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY is missing");
  if (process.exitCode) return;

  for (const table of expectedTables) {
    await checkTable(table);
  }
  await checkAnonBlocked("email_captures");
  await checkAnonBlocked("trap_passes");
  await checkRpc();
  await checkStorageBuckets();

  let stripeTablesReady = true;
  for (const table of optionalStripeTables) {
    const exists = await checkTable(table);
    stripeTablesReady = stripeTablesReady && exists;
  }

  if (!stripeTablesReady) {
    warn("Stripe fulfillment tables are not fully installed. Run supabase/stripe_checkout_schema.sql before enabling live paid checkout.");
  }

  if (!process.exitCode) ok("Supabase live verification finished.");
}

main().catch((error) => {
  fail(error.message);
});
