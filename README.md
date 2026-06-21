# imhighoncrackandihaveagun-site

Public launch source for the first working version of:

> The website is the map. The Discord is the room. The Trap Pass gets you deeper inside.

The static public site can be published from this repo. Trap Pass claiming uses Supabase when configured, with localhost fallback for review.

## Project Memory

Before using another AI/helper on this repo, point it at:

- `AGENTS.md`
- `PROJECT_BACKBONE.md`
- `MASTER_TODO.md`
- `AUTHENTIC_INFO_NEEDED.md`

## Run Locally

From this folder:

```powershell
python -m http.server 8876 --bind 127.0.0.1
```

Open:

```text
http://127.0.0.1:8876/index.html
```

## Local Routes

- `/` is the public map and first impression.
- `/start-here/` is the first-time visitor route and cleanest explanation of the project.
- `/project/` explains the book, documentary, soundtrack, archive, Trap Pass, and Discord loop.
- `/documentary/` is the raw documentary shell for trailers, clips, first-look access, and safety framing.
- `/preorders/` is the public store ladder. Paid checkout is staged in code but stays closed on GitHub Pages until a serverless runtime and Stripe secrets are deployed.
- `/trap-pass/` claims a Digital Trap Pass through Supabase after the SQL setup is installed, with localhost fallback for review.
- `/check-pass/` looks up a pass by email or pass ID.
- `/pass/?id=W3-00001` shows the public pass profile.
- `/wallet/` shows the Pass Terminal, selected passes, and virtual proof baggies.
- `/room-map/` shows the author-profile room, bookshelf, spoken-word TV slot, and clickable object-story framework.
- `/mission-board/` shows current missions.
- `/trap-house-roll-call/` shows public holders without emails.
- `/discord/` explains how the Discord connects to the site.
- `/discord-framework/` shows the local-only server blueprint before any live Discord edits.
- `/archive-terminal/` shows AI archive stats from `data/archive-stats.json`.
- `/admin/` exports/imports local pass data and sets the Discord invite URL for this browser. It redirects away on non-localhost public traffic.

## Locked Routes

These are wired as pass-gated mockup rooms:

- `/room/`
- `/evidence-locker/`
- `/wave-1-ghost/`
- `/deer-witness/`
- `/all-hands-on-deck/`
- `/og-scum-file/`
- `/the-loop/`

## Important Notes

- Supabase schema lives at `supabase/trap_house_schema.sql`; run it once in the Supabase SQL Editor before relying on live email/pass storage.
- Use `npm run supabase:verify` after local env secrets are set to check tables, public RPC access, and RLS behavior.
- Browser `localStorage` is still used as a localhost review fallback and cached selected-pass display.
- Emails and private unlock fields stay out of public pass cards and roll call pages.
- `/admin/` is a local tool. The public build redirects it back to the main site.
- `/preorders/` has direct Stripe Checkout Sessions staged server-side. GitHub Pages cannot run `/api/stripe/*`, so paid checkout remains visibly closed until the app is deployed with serverless functions and secrets.
- Never commit Stripe or Supabase secret keys. Keep real values in `.env.local` and deployment secrets only.
- Direct URLs like `/pass/W3-00001` need server routing later. Static Phase 1 uses `/pass/?id=W3-00001`.
- No new character graphics were generated. The visual direction uses existing site assets.
- Discord invite buttons currently point to `https://discord.gg/64MKTrGGsD`.
- New local visual assets live in `assets/trap-house/`.
- The broader route/drop/asset launch model lives in `data/site-model.json`.
- The Discord server blueprint lives in `data/discord-framework.json` and can be exported from `/admin/`.
- Confirmed official links live in `data/official-links.json`.
- Content/archive tagging rules live in `data/content-taxonomy.json`.
- Episode report structure lives in `archive-tools/EPISODE_REPORT_TEMPLATE.md`.
