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
npm run stripe:sync-products
npm run stripe:list-prices
```

The sync script creates or reuses the required products and prices in the Stripe mode attached to the current secret key.

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
https://imhighoncrackandihaveagun.com/shop
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

## Static Launch Guard

GitHub Pages can publish the site, but it cannot run `/api/stripe/*`. The current public build keeps checkout buttons disabled until the app is deployed on a serverless host such as Vercel or Netlify with the secrets above.

The public static site is configured to call the Vercel API runtime for Stripe health checks and Checkout Sessions. Paid checkout opens only when the Vercel health endpoint returns:

```json
{ "ready": true }
```

If the health endpoint returns `missing`, add those exact env vars to the Vercel project and redeploy. Do not open checkout from frontend-only code; the webhook is what records orders and grants paid Trap Pass access.
