# Stripe Checkout Setup

Status: direct Checkout Sessions are staged in code. Paid checkout stays closed on the static public launch until the server runtime and secrets are deployed.

Project folder:

```powershell
cd C:\Users\ryanh\OneDrive\Documents\GitHub\imhighoncrackandihaveagun-site
```

## Checkout Model

Use direct Stripe Checkout Sessions.

Do not use Stripe Connect for this version:

- No connected accounts.
- No seller onboarding.
- No Express Dashboard.
- No split payouts.

IHOCAIHAG is the only seller. Product discovery happens server-side through env price IDs or Stripe `lookup_key` values.

## Required Secrets

Set these only in local `.env.local` or deployment secrets. Never commit real values.

```text
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
SUPABASE_URL=
SUPABASE_SECRET_KEY=
```

Optional env price IDs can override lookup-key discovery:

```text
STRIPE_PRICE_OG_CRACK_PACK=
STRIPE_PRICE_RAW_DOC_PREORDER=
STRIPE_PRICE_BLACK_TEE=
STRIPE_PRICE_HARDCOVER_PREORDER=
STRIPE_PRICE_HANDY_SASS_PASS=
STRIPE_PRICE_CASH_FOR_TRASH_MONTHLY=
```

## Product Sync

After setting `STRIPE_SECRET_KEY`, run:

```powershell
pnpm run stripe:sync-products
pnpm run stripe:list-prices
```

The sync script creates or reuses the required products and prices in the Stripe mode attached to the current secret key. It also assigns the approved Product image URLs from `STRIPE_PRODUCT_ASSET_BASE_URL`, which defaults to the official site. Deploy the images before syncing.

## Supabase Fulfillment

Run both SQL files in Supabase before opening paid checkout:

```text
supabase/trap_house_schema.sql
supabase/stripe_checkout_schema.sql
```

The webhook grants access. The frontend never grants paid access by itself.

## Live URLs

Success:

```text
https://imhighoncrackandihaveagun.com/checkout/success?session_id={CHECKOUT_SESSION_ID}
```

Cancel:

```text
https://imhighoncrackandihaveagun.com/store/
```

API runtime on the Vercel deployment:

```text
https://imhighoncrackandihaveagun-site.vercel.app/api/stripe/health
https://imhighoncrackandihaveagun-site.vercel.app/api/stripe/create-checkout-session
```

Webhook on the Vercel deployment:

```text
https://imhighoncrackandihaveagun-site.vercel.app/api/stripe/webhook
```

Webhook after the custom domain is moved to Vercel:

```text
https://imhighoncrackandihaveagun.com/api/stripe/webhook
```

Stripe must send events to `/api/stripe/webhook`, not the homepage.

## Documentary Preorder Confirmation

After Stripe confirms payment for `raw_doc_preorder`, the webhook sends the
customer a Resend email containing:

- A stable `DOC-...` verification reference tied to the Checkout Session.
- The purchaser email, product, quantity, and amount paid.
- A statement that the email is proof of preorder and first-day access.
- Notice that release/access instructions will go to the same email address.

Documentary checkout fails closed if Resend is not configured. Delivery errors
fail the webhook so Stripe retries them. The request uses a Resend idempotency
key based on the Checkout Session so retries do not send duplicate confirmations.

Required or inherited deployment values:

```text
RESEND_API_KEY=
DOCUMENTARY_CONFIRMATION_FROM=
DOCUMENTARY_CONFIRMATION_REPLY_TO=
```

`DOCUMENTARY_CONFIRMATION_FROM` falls back to `RESEND_FROM` and then
`TRAP_PASS_NOTIFY_FROM`, so the existing verified sender can be reused.

## Trap Pass Holder Discount

Every active Trap Pass card serial is registered as a Stripe Promotion Code for
10% off. The customer enters the displayed card serial, such as `NB-0100`,
`HS-0001`, or `CFT-0001`, in Stripe Checkout's promotion-code field.

- Each serial can be redeemed once.
- Free claims and paid Trap Pass issuance register codes automatically.
- Checkout performs a server-side backfill so existing active serials are covered.
- Refunded, canceled, or otherwise inactive paid entitlements have their codes disabled.
- `STRIPE_TRAP_PASS_COUPON_ID` can override the default shared coupon ID.

## Static Launch Guard

GitHub Pages can publish the site, but it cannot run `/api/stripe/*`. The current public build keeps checkout buttons disabled until the app is deployed on a serverless host such as Vercel or Netlify with the secrets above.

The public static site is configured to call the Vercel API runtime for Stripe health checks and Checkout Sessions. Paid checkout opens only when the Vercel health endpoint confirms its secrets, Supabase schema access, and all four enabled Product/Price mappings:

```json
{ "ready": true, "missing": [], "unavailableProducts": [], "schemaReady": true }
```

If health returns HTTP 503, Store buttons remain disabled and read `Checkout Opening Soon`. Add the reported configuration only in deployment secrets, deploy the current code, and recheck. Do not open checkout from frontend-only code; the webhook is what records orders and grants paid access.

## Local Verification

Run this before every Store deployment:

```powershell
pnpm run verify
pnpm audit --prod
```

The verifier checks route/script integrity plus Store-to-catalog parity, approved amounts, image files, Price lookup rules, private Stripe schema controls, disabled product enforcement, delayed-payment/refund handlers, and fail-closed API behavior without secrets.
