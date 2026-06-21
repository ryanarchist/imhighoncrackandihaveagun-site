# Launch Ready Handoff

Status: public launch package approved by Ryan for static deployment. Paid checkout remains closed until the serverless payment room is connected.

## Already Built Locally

- Main map route.
- Project page.
- Documentary page.
- Preorders/drop model page with checkout closed.
- Trap Pass claim/check/profile flow wired for Supabase storage, with browser-storage fallback on localhost.
- Pass terminal with Trap Pass cards and proof baggies.
- Threads route with interactive crossing map.
- Room map with clickable object-story framework.
- Discord page and Discord framework page.
- Mission board, archive terminal, roll call, and locked room route shells.
- Discord setup package with roles, channels, pinned posts, images, and starter copy.
- Verified archive terminal stats from the June 10 scene/thread and clip candidate summaries plus the June 12 visual keyframe summary.
- Public Discord invite buttons use the verified Trap House invite: `https://discord.gg/64MKTrGGsD`.
- Public Trap Pass and entry-email capture are wired to Supabase RPC calls after `supabase/trap_house_schema.sql` is run in the Supabase SQL Editor.
- Admin tooling is noindexed and redirects away from public hosts.
- Project memory files are saved: `AGENTS.md`, `PROJECT_BACKBONE.md`, and `MASTER_TODO.md`.
- Dedicated first-time visitor route added at `/start-here/`.
- Official social links are centralized in `data/official-links.json`; Instagram, TikTok, YouTube, X, Patreon, and Spotify were confirmed by Ryan on 2026-06-18.
- Stripe publishable test key is staged in `config.js`; direct Checkout Sessions and product sync scripts are built, but checkout stays closed on GitHub Pages until serverless functions and secrets are deployed.
- The corrected author-profile room image is installed at `assets/trap-house/author-profile-room-paradise-oblivion.png` and wired into `/room-map/`.
- Research-report framing is folded into the Project and Threads routes: threads are recurring wires/patterns, and Crack Capitalism is framed as structural reward logic rather than an unsupported brain-scan claim.

## Verification Completed

- JavaScript syntax sweep: passed.
- JSON parse sweep: passed.
- Local route/asset sweep: 0 missing assets, 0 missing route targets.
- Discord setup package preflight: passed.
- JavaScript syntax sweep with bundled Node: passed.
- JSON parse sweep: passed.
- Desktop browser audit across key public routes: 0 broken images, 0 console errors, 0 horizontal overflow, 0 skinny metadata fields.
- Mobile browser audit across key public routes: 0 broken images, 0 console errors, 0 horizontal overflow, 0 skinny metadata fields.
- Entry email gate opens correctly on mobile without submitting during QA.

## Launch Blockers Ryan Must Provide

1. Serverless deployment target for Stripe checkout functions.
2. Stripe webhook secret and secret key supplied through deployment secrets only.
3. Checkout/preorder provider details:
   - Direct Stripe Checkout Sessions are selected.
   - Exact products, quantities, prices, shipping/fulfillment rules, and refund language should be reviewed before opening paid checkout.
   - Run `npm run stripe:sync-products` and `npm run stripe:list-prices` after `STRIPE_SECRET_KEY` is available locally.
4. Trap Pass decision:
   - Free claim, paid purchase, manual issue, or bundled with preorder.
   - Final wave names, quantities, perks, and Discord role rules.
5. Author bio:
   - Short 25-40 word version.
   - Medium 75-125 word version.
   - Official portrait choice.
6. Legal/safety approval:
   - Final disclaimer wording.
   - Age gate wording.
   - Privacy/email/checkout language.
7. Cleared public media:
   - Which clips, keyframes, screenshots, and object stories are allowed on public routes.
   - Any images that should not be used.
   - Spoken-word author-profile room intro clip, captions/transcript, poster frame, and autoplay/click-to-play preference.
8. Supabase/Brevo final setup:
   - Run `supabase/trap_house_schema.sql` in the Supabase SQL Editor.
   - Run `supabase/stripe_checkout_schema.sql` before opening paid checkout.
   - Provide Brevo sender identity, list ID, and API key through a local secret/env path, not chat.

## Do Not Guess

- Release dates.
- Product prices.
- Inventory counts beyond current mockup notes.
- Shipping timing.
- Refund policy.
- Medical/legal wording beyond basic resource/support framing.
- Personal biography details.
- Private story details tied to real people, locations, or family.

## Final Pre-Publish Pass

When Ryan provides the missing info:

1. Enable checkout only after serverless functions and deployment secrets are set.
2. Update author bio and final preorder policy language if Ryan revises them.
3. Re-run route/asset/mobile/browser verification after inserting final info.
4. Keep checkout closed until webhook fulfillment is verified end to end.
