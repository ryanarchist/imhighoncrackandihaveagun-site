# Trap House Next Passes

## Phase 1 Review

- Done: replaced placeholder archive stats with real counts from the June 10 and June 12 archive logs.
- Done: created `PROJECT_BACKBONE.md`, `MASTER_TODO.md`, and `AGENTS.md` so future AI/helper sessions can refresh on the project spine.
- Done: added `/start-here/` as the clean first-time visitor route.
- Add the final Discord invite URL in `/admin/` while reviewing locally.
- Review `data/site-model.json` and decide which draft preorder items should be visible, hidden, or connected to real checkout later.
- Review `/project/`, `/documentary/`, and `/preorders/` copy before public launch.
- Decide which locked routes should stay public teasers and which should be truly hidden after backend auth exists.
- Review channel names, mission language, and room names against the Discord structure before publishing anything.

## Phase 2 Discord Integration

- Build a Discord bot that can verify a Trap Pass ID and assign the correct role.
- Review `data/discord-framework.json` and `DISCORD_SETUP.md` before live server edits.
- Mirror mission drops from `/mission-board/` into a Discord channel.
- Add a site-to-Discord webhook for archive status updates.
- Add Discord-to-site approved submissions for stories, clips, stills, and quotes.
- Keep a human approval queue before anything becomes public on the website.

## Phase 3 Real Storage

- Move the registry out of `localStorage` into a real backend database.
- Add server-side email uniqueness, pass lookup, and private admin auth.
- Add CSV/JSON imports from the current local admin export.
- Support direct pass URLs like `/pass/W3-00001`.
- Add rate limits and abuse protection before opening public claim forms.

## Phase 4 Future Unlock Layer

- Keep Trap Pass data public-safe and focused on access, roles, perks, missions, and unlock status.
- Decide whether Trap Passes are free, paid, bundled, or manually issued.
- Add external unlock verification only after the database and Discord bot are stable.
- Generate public pass summaries from approved pass records, not from raw form input.

## Phase 5 Archive Engine

- Parse the keyframe and transcript logs into structured JSON.
- Generate approved clip candidates for the archive terminal.
- Add contact sheet review pages for pass holders.
- Wire selected archive objects into room/item stories on the interactive site.
