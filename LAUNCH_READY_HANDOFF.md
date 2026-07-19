# Launch Readiness Handoff

Audit date: 2026-07-18

Status: the static visitor experience passes local launch QA. It has not been published from this checkout. Paid checkout and production Trap Pass claims are intentionally closed until their server-side dependencies are configured and verified.

## Ready in the Local Build

- Public navigation follows the intended order: Home, About, Thread Map, Book, Doc, Drops, Trap Pass, Trap House, Store.
- Home, About, Thread Map, nine thread detail pages, Book, Documentary, Official Drops, Trap Pass, Trap House, Store, and My Pass render without missing local assets or horizontal overflow.
- The Thread Map links to all nine corresponding thread definitions.
- Book and Documentary have standalone pages and the requested artwork and synopsis copy.
- Official Drops includes the supplied YouTube and Instagram embeds. Instagram may still require sign-in or display an age restriction controlled by Instagram.
- Store products remain visible but unavailable until checkout is healthy.
- Trap Pass claim, wallet, card flip/download, public profile, and validation flows work in localhost review mode.
- Public metadata, canonical URLs, social images, and sitemap entries are aligned with the primary public routes.
- Utility and legacy route shells are noindexed.
- Checkout refuses to create a Stripe session unless Stripe, webhook fulfillment, and Supabase order storage are all ready.
- Production Trap Pass claim and email recovery controls remain closed while secure email authentication is unconfigured.

## Local Verification

Run from the repository root:

```powershell
pnpm install --frozen-lockfile
pnpm run site:verify
```

Expected result:

```text
Site verification passed: 25 scripts, 12 JSON files, and 48 route shells.
```

The verifier checks JavaScript syntax, JSON parsing, local route and asset targets, public placeholder copy, Trap Pass script order, and sitemap targets.

## Required Before Publishing

### 1. Publish the Current Site Build

- Confirm the intended hosting source and deployment branch.
- Publish this reviewed checkout to the live domain.
- Confirm the custom domain, HTTPS, and all primary routes against the deployed build.
- Re-run the browser audit against production after DNS/CDN caches settle.

### 2. Open Paid Checkout

- Configure deployment secrets: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `SUPABASE_URL`, and either `SUPABASE_SECRET_KEY` or `SUPABASE_SERVICE_ROLE_KEY`.
- Run `supabase/stripe_checkout_schema.sql` in the production Supabase project.
- Create/review the six Stripe catalog entries and populate all `STRIPE_PRICE_*` variables.
- Register the production Stripe webhook endpoint at `/api/stripe/webhook` for the events handled by the code.
- Set checkout origins, success/cancel URLs, tax behavior, and allowed shipping countries.
- Confirm product prices, inventory, shipping, fulfillment, preorder timing, refunds, and customer-support language.
- Require `/api/stripe/health` to return HTTP 200 with `ready: true` before enabling checkout buttons.
- Complete one Stripe test-mode purchase and verify the checkout session, signed webhook, Supabase order row, entitlement, success page, and duplicate-event handling end to end.

### 3. Open Production Trap Pass Claims

The current public frontend expects the v2 Trap Pass contract. The repository's existing `supabase/trap_house_schema.sql` contains the older claim/lookup contract and is not sufficient by itself.

Before enabling production claims:

- Add and deploy the authenticated v2 database schema and RPCs expected by `trap-pass-system.js`:
  - `trap_pass_claim_current_release`
  - `trap_pass_get_my_wallet`
  - `trap_pass_update_my_profile`
  - `trap_pass_claim_release`
  - `trap_pass_validate_serial`
  - `trap_pass_public_profile`
- Configure Supabase Auth email delivery, allowed redirect URLs, and the PKCE callback/session flow.
- Set `recovery.emailProviderConfigured` to `true` only after production email login and recovery are verified.
- Verify serial uniqueness, release caps, profile privacy, row-level security, public-field filtering, and recovery behavior with production-like accounts.

## Go-Live Acceptance Checklist

- `pnpm run site:verify` passes from a clean dependency install.
- Primary routes return 200 on the public domain and the current homepage artwork is visible.
- No public page contains placeholder copy, missing images, console errors, or unexpected overflow at desktop and mobile widths.
- Header links, home calls to action, Thread Map hotspots, embeds, Discord invite, and social links reach their intended destinations.
- Checkout remains visibly closed unless `/api/stripe/health` is healthy and fulfillment has passed a test transaction.
- Trap Pass claims remain visibly closed unless authenticated v2 storage and email recovery have passed production tests.
- Privacy, age/trigger warning, preorder, refund, shipping, and support language receive final owner/legal review.
- A rollback point and post-launch monitoring owner are identified before the public switch.

## Deliberately Not Guessed

- Release dates and delivery timing.
- Product prices or inventory counts.
- Shipping and refund policies.
- Legal or medical claims.
- Private details about people represented in the archive.

The safe launch sequence is: publish and verify the static visitor experience first, then open commerce and production Trap Pass issuance only after each backend passes its own acceptance test.
