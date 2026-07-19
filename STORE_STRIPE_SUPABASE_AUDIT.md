# Store, Stripe, And Supabase Audit

Audit date: 2026-07-18

## Executive Status

The current Store is a website catalog at `/store/`. Each enabled product button sends a server-controlled product key to the Vercel Checkout Session endpoint, which creates a Stripe-hosted Checkout Session and returns its unique Stripe URL. There is no Payment Link collection, Stripe-hosted catalog, custom cart, or browser-side card form.

Checkout is not launch-ready. The deployed health endpoint returned HTTP 503 and reported that its Stripe secret, webhook secret, Supabase URL, and Supabase server secret were missing. It also returned the older health payload, proving the current repository hardening has not been deployed to that API runtime. No Checkout Session or charge was created during this audit. The unused browser publishable key and misleading browser-side mode were removed; server health is now the only checkout readiness authority.

## Current Customer Flow

1. Main navigation, mobile navigation, homepage Store preview, legacy Store routes, and the new footer Store link point to `/store/`.
2. `/store/` renders six product concepts from `src/content/siteContent.js`.
3. `checkout.js` calls the configured Vercel `/api/stripe/health` endpoint.
4. Buttons stay disabled unless that trusted endpoint confirms server configuration, all four enabled product mappings, and access to the existing Supabase order table.
5. An enabled button posts only an allowlisted product key and quantity to `/api/stripe/create-checkout-session`. Stripe Checkout collects the customer email.
6. The server selects the Stripe Price from its own catalog/env mapping, validates product identity, amount, currency, and billing interval, and creates the Checkout Session.
7. The browser is redirected to the session-specific Stripe-hosted Checkout URL.
8. Success returns to `/checkout/success?session_id={CHECKOUT_SESSION_ID}`. Cancel returns to `/store/`.
9. The success page now shows a neutral processing message. It does not grant access, display backend identifiers, or claim that visiting the URL completed payment.

There is no single permanent Stripe Store URL in this implementation. The exact Stripe destination is the unique `session.url` created for each purchase.

## Entry-Point Audit

| Entry point | Destination | Result |
| --- | --- | --- |
| Main navigation Store | `/store/` | Consistent |
| Mobile navigation Store | `/store/` | Consistent |
| Homepage Store preview | `/store/` | Consistent |
| Footer Store | `/store/` | Added in this pass |
| `/shop/` | Website Store renderer | Preserved |
| `/preorders/` | Website Store renderer | Preserved |
| Trap Pass Cash For Trash | `/store/#cash-for-trash` | Product intentionally disabled |
| Trap Pass Handy Sass | `/store/#handy-sass` | Product intentionally disabled |

## Product Audit

The website prices match the server catalog. The Stripe dashboard could not be inspected because no usable secret key was available locally or in the deployed runtime. Product/Price existence, dashboard images, dashboard descriptions, and active state remain unverified.

| Product key | Public concept | Catalog price | Mode | Shipping | Current result |
| --- | --- | ---: | --- | --- | --- |
| `og_crack_pack` | The OG Crack Pack | $99.99 | One-time payment | Required | Ordinary-product code path eligible; deployment closed |
| `raw_doc_preorder` | Raw Documentary First-Day Access | $9.99 | One-time payment | No | Ordinary-product code path eligible; deployment closed |
| `black_tee` | Official IHOCAIHAG Black Tee | $27.99 | One-time payment | Required | Ordinary-product code path eligible; deployment closed |
| `hardcover_preorder` | Hardcover Book Preorder | $39.99 | One-time payment | Required | Ordinary-product code path eligible; deployment closed |
| `handy_sass_pass` | Handy Sass Trap Pass | $39.99 | One-time payment | Required | Disabled: no authenticated holder linkage |
| `cash_for_trash_monthly` | Cash For Trash Trap Pass | $4.99/month | Subscription | No | Disabled: no authenticated holder linkage |

Cash For Trash annual is represented only as an unavailable UI/config concept. It is not in the server Stripe catalog, required env list, or Checkout flow. No annual product or price was created.

Website product descriptions now match the server catalog descriptions. Approved artwork is connected for all six Store concepts. The Stripe sync script now assigns each Product its approved public image URL; those URLs must be deployed and reachable before the sync is run, then confirmed in Stripe test mode.

## Checkout Authority

The server, not the browser, controls the Stripe Price. Browser `data-stripe-price-id` output was removed. The Checkout endpoint accepts a product key but resolves it against the fixed server catalog. This pass added validation that the active Stripe Price has the expected product identity, amount, currency, and recurring interval.

The endpoint no longer accepts or stores an unverified browser-supplied Trap Pass ID. Raw Stripe/API errors are logged server-side and a generic safe message is returned to the browser.

Physical products request a shipping address and phone number in Stripe Checkout. Subscriptions use `mode: subscription`; ordinary and physical products use `mode: payment`. Promotion codes are allowed. Automatic tax is enabled only when configured server-side.

## Webhook And Supabase Flow

Webhook endpoint: `/api/stripe/webhook` on the serverless deployment.

The webhook:

- requires the Stripe secret and webhook signing secret;
- reads the raw request body;
- verifies the `Stripe-Signature` before processing;
- retrieves the Checkout Session and line items from Stripe;
- derives payment/subscription authority from the verified Stripe objects;
- writes through a Supabase server secret, never the browser key;
- handles completed and delayed-payment-success Checkout events;
- records failed/expired delayed Checkout state without granting access;
- tracks subscription created, updated, deleted, paid invoice, and failed invoice events;
- distinguishes partial from full refunds, flags the order for review, and revokes any associated Trap Pass entitlement only after a full refund.

Tables defined in `supabase/stripe_checkout_schema.sql`:

- `stripe_events`
- `stripe_orders`
- `stripe_subscriptions`
- `stripe_trap_pass_serial_counters`
- `stripe_trap_pass_entitlements`

All are private with RLS enabled and direct `anon`/`authenticated` access revoked in the schema file. Whether this schema has actually been applied to the live Supabase project could not be verified without a server/service key.

Ordinary purchases write one `stripe_orders` row and do not create a Trap Pass holder. Subscription records are upserted by Stripe subscription ID. Checkout orders and legacy entitlements are upserted by Checkout Session ID.

## Duplicate-Event Handling

Before this pass, `stripe_events` was upserted and then every delivery was processed again. A repeated Checkout event could allocate another Trap Pass serial before the entitlement upsert merged the row.

The webhook now claims a new event with an insert that ignores the unique `stripe_event_id` conflict. Processed or currently-processing duplicates return successfully without re-running fulfillment. Failed events and stale `received` events can retry. Checkout fulfillment also reuses an existing order serial when the same session is encountered. This logic was syntax/static tested but not exercised against live Stripe/Supabase services.

## Trap Pass Purchase Flow

The existing webhook can create a row in `stripe_trap_pass_entitlements`, but that table contains only Stripe/customer email fields and a separate legacy serial. It has no authenticated user ID or permanent holder foreign key. It does not update the current holder wallet model, preserve the permanent holder number, or prove that a submitted email belongs to an existing holder.

Because email-only merging would be unsafe, this pass did not auto-link or create a holder. `handy_sass_pass` and `cash_for_trash_monthly` are disabled in both the website UI and Checkout Session endpoint until a trusted holder link exists.

The minimal missing server capability is an authenticated checkout start that derives the holder from the verified session and writes a trusted holder reference into Checkout metadata. The verified webhook then needs a server-only RPC that applies the Stripe entitlement to that same holder. Cancellation, failed invoice, expiration, and refund handling must call the same trusted path to recalculate the current tier. This requires the canonical holder schema/auth work; no migration was guessed or run here.

## Success And Cancellation

Success returns to the website's `/checkout/success` route. The page now says `PROCESSING PAYMENT`, keeps all Stripe/Supabase identifiers hidden, and offers Store first with My Pass as an optional secondary destination. It does not use the query parameter as payment authority.

Cancellation returns directly to `/store/`. No client code grants access on cancellation or success-page arrival. There is no customer billing portal configuration; `/billing/` is not a working Stripe portal and must not be presented as one before a real portal link exists.

## Confirmed Fixes

- Replaced the hidden localStorage checkout gate with a server-health gate.
- Made health readiness validate the four enabled Stripe product mappings and read access to the existing Supabase order table.
- Kept buttons closed when the deployed server is not ready.
- Disabled only the two products that require missing authenticated holder linking.
- Added server enforcement for those disabled product keys.
- Removed browser Price ID output and unverified visitor pass metadata.
- Added Stripe Price/product/amount/currency/interval validation.
- Required either the exact pinned Price ID or exact approved lookup key; name/metadata fallback cannot open checkout.
- Replaced raw Checkout errors with a customer-safe response.
- Added strict quantity parsing and rejects unknown, unavailable, or malformed requests before external API calls.
- Corrected health mode reporting so a missing key is `unconfigured`, not `test`.
- Added idempotent webhook event claiming and serial reuse.
- Added delayed-payment success/failure and expired Checkout handling.
- Made delayed-payment failure and expiration create/update authoritative order state even if webhook events arrive out of order.
- Rejected disabled products again at verified webhook fulfillment.
- Distinguished partial and full refunds; full refunds revoke linked paid entitlement state.
- Added a two-megabyte webhook raw-body cap while preserving signed raw-body verification.
- Added a neutral success page and a consistent footer Store link.
- Added factual website descriptions and approved artwork for all six Store concepts.
- Added Stripe Product image sync and a Store verifier covering catalog parity, amounts, assets, Price lookup behavior, private schema controls, and fail-closed API responses.
- Added a clear `Checkout Opening Soon` state to enabled products while the deployed API is closed.

## Remaining Security And Launch Blockers

- Deployed Stripe secret and webhook signing secret are missing.
- Deployed Supabase server URL and server secret are missing.
- The current Vercel API deployment is stale and does not include this audit's safety changes.
- Live Stripe Products and Prices could not be enumerated or matched.
- Live webhook endpoint registration and subscribed event list could not be verified.
- Live Supabase Stripe tables and RLS could not be verified.
- Cash For Trash and Handy Sass have no authenticated holder linkage and remain disabled.
- No safe customer billing portal is configured.
- Product inventory, fulfillment ownership, shipping cost/timing, refund policy, privacy/terms, and customer support language remain incomplete.
- The signed first-edition hardcover is advertised as the first 50 copies, but no production inventory cap has been configured or verified.
- Stripe Product images are managed by the sync script but could not be verified in the Stripe Dashboard without a usable server key.
- Stripe SDK `17.7.0` has no known production dependency vulnerabilities in the current audit, but the available major version is newer and should be upgraded only in a separate test-mode compatibility pass.
- Supabase live verification and a real test-mode purchase could not run because no local or deployed server configuration is available.

## Files Changed In This Pass

- `checkout.js`
- `config.js`
- `api/stripe/create-checkout-session.js`
- `api/stripe/health.js`
- `api/stripe/webhook.js`
- `scripts/stripe/products.mjs`
- `scripts/stripe/sync-products.mjs`
- `scripts/verify-store.mjs`
- `src/content/siteContent.js`
- `src/site.js`
- `.env.example`
- `package.json`
- `STORE_STRIPE_SUPABASE_AUDIT.md`
- `STORE_LAUNCH_CHECKLIST.md`

No Supabase schema, authentication file, Trap Pass runtime file, database migration, secret, environment value, Stripe object, or live-mode setting was changed. No migration was run.
