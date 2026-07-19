# Authentic Info Needed Before Public Launch

Use this list for anything that should come from Ryan or verified project records only. Do not invent these details in public copy.

## Identity And Links

- Final public website URL and preferred display casing. Current repo/domain candidate: `imhighoncrackandihaveagun.com`.
- Final Discord invite link or vanity invite. Current verified invite: `https://discord.gg/64MKTrGGsD`.
- Official social links confirmed by Ryan on 2026-06-27:
  - Instagram: `https://www.instagram.com/ihocaihag/`
  - TikTok: `https://www.tiktok.com/@ihocaihagofficial`
  - Threads: `https://www.threads.net/@ihocaihag`
  - YouTube: `https://youtube.com/@imhighoncrackandihaveagun`
  - X: `https://x.com/comradejizzy`
  - Patreon: `https://www.patreon.com/IMHIGHONCRACKANDIHAVEAGUN`
  - Spotify: `https://open.spotify.com/artist/7GUAmAkkpLLESm0Fig1NWZ`
  - Apple Music: `https://music.apple.com/search?term=IHOCAIHAG`
- Store/checkout deployment target and Stripe webhook secret.
- Final project subtitle or one-sentence public positioning line.
- Confirm whether "IHOCAIHAG" or the full title should lead each page.

## Author Bio

- Short author bio, 25-40 words.
- Medium author bio, 75-125 words.
- Press/about version, 150-250 words.
- Which author portrait should be the official primary image.
- Any topics, names, locations, or old history that should stay private.
- Spoken-word author-profile room intro: final video/audio file, transcript, captions, poster frame, and whether it should autoplay muted or wait for a click.
- Final public labels for each author-profile action figure and which parts of the story each figure is allowed to represent.

## Book And Documentary

- Final book title/subtitle, edition status, release target, ISBN/ASIN if any.
- Final cover choice and whether the masked red cover is the lead cover.
- Back-cover blurb and chapter/excerpt copy cleared for public use.
- Documentary status, trailer URL, runtime if known, and first-look rules.
- Which videos, clips, keyframes, and transcript excerpts are cleared for public pages.

## Trap Passes And Drops

- Final Trap Pass wave names, quantities, pricing, and benefits.
- Whether Trap Passes are free, paid, bundled, or manually issued.
- Redemption rules for hidden rooms, Discord roles, drops, discounts, and archive access.
- Final preorder products, quantities, prices, shipping/fulfillment details, and refund language.
- Merch sizes, variants, inventory counts, vendor, and shipping windows.
- Whether any future blockchain or external unlock layer is actually being used; if not, keep public language to Trap Pass access, roles, perks, and unlock data.

## Threads And Story Evidence

- Confirm the canonical thread list and names.
- For each thread: approved summary, key dates, allowed public details, and attached evidence.
- Which clips/photos/chapters connect to January 22 / The Origin / Blast Crater.
- Which story moments should connect when two thread nodes cross in the interactive map.
- Any thread labels that are too private, too inaccurate, or need renaming.

## Room, Car, And Object Stories

- Final list of real room objects to make clickable.
- Final list of car interior objects to make clickable.
- For each object: name, date/era, story, thread tags, page route, Discord room, and public/private boundary.
- Any objects that should appear visually but should not open a story yet.
- Which TV/video screen should appear in the profile room background and what spoken-word intro file should play there.

## Discord

- Final server name casing, icon, banner, and welcome image.
- Final roles, who gets each role, and which roles can be automated.
- Final channel list before public invite is shared.
- Who can moderate, who can approve posts, and what must be removed immediately.
- Whether the heavier opt-in rooms should be age-gated, role-gated, hidden, or all three.

## Safety, Legal, And Privacy

- Final disclaimer text and placement.
- Final support/resource links beyond SAMHSA if desired.
- Age gate choice and exact wording.
- Privacy policy, terms, cookie/email storage wording, and checkout policy.
- Image clearance for child photos, family photos, identifiable people, weapons, drugs, money, and platform-sensitive content.

## Integrations

- Checkout provider and product IDs.
- Stripe Checkout Sessions:
  - Direct Checkout Sessions are the selected path.
  - Product sync can discover/create prices by `lookup_key`; manual Stripe Price ID copying is optional.
  - Stripe secret key and webhook secret must be supplied only through local environment variables or deployment secrets, never committed to site files.
- Email capture provider.
- Final pass storage/database provider. Supabase project URL and publishable key are wired; `supabase/trap_house_schema.sql` still needs to be run in Supabase before live storage is real.
- Discord bot token/guild setup handled by Ryan only; do not commit secrets.
- Public analytics choice, if any.
