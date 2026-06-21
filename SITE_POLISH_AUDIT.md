# Site Polish Audit

This is the current working audit for the public static launch build.

## Benchmark Notes

References checked:

- Awwwards storytelling collection: https://www.awwwards.com/awwwards/collections/storytelling/
- Awwwards interactive websites: https://www.awwwards.com/websites/web-interactive/
- Awwwards storytelling websites: https://www.awwwards.com/websites/storytelling/
- Awwwards immersive experience inspiration: https://www.awwwards.com/inspiration/immersive-experience
- Awwwards SOTD, The Power of Digital Storytelling: https://www.awwwards.com/sites/the-power-of-storytelling

What those references reward:

- Visual and UI design fused into story, not decoration.
- Interaction that reveals narrative or participation.
- Strong motion/transition logic without losing usability.
- Unusual navigation that still gives visitors a clear way forward.
- Content, creativity, usability, and design all working together.

## Improvement Passes Completed

1. Public copy pass: removed public-facing builder language, admin links, draft/prototype phrasing, and internal implementation labels from the main visitor routes.
2. Threads pass: added structured thread data, a dedicated Threads route, an interactive crossing graph, and pass/thread affinity.
3. Trap Pass pass: expanded public-safe summaries, role/access mappings, phases, pass terminal, proof baggies, and Discord access logic without exposing private account fields.
4. Discord pass: finalized the Discord house map data, starter messages, role/channel map, setup package, and public-safe verifier language.
5. Visual asset pass: placed the masked cover, threads board, door-opening poster, URL poster, pass image, author-profile room, bookshelf, documentary, preorder, and Discord identity assets in stronger route-specific roles.
6. Responsive polish pass: fixed mobile overflow in framework rows and added shared containment rules for dense grids/panels.
7. Verification pass: checked JSON parsing, JavaScript syntax, asset links, internal routes, main-route browser rendering, mobile overflow, Threads click behavior, and Trap Pass private-field safety.
8. Launch-readiness pass: replaced unverified archive stats with log-backed counts, hardened public-host Trap Pass claim behavior, noindexed/redirected admin tooling, cache-busted changed assets, and fixed the final Discord mobile heading overflow.
9. Backbone/start pass: added `PROJECT_BACKBONE.md`, `MASTER_TODO.md`, `AGENTS.md`, centralized official links, and built `/start-here/` as the first-time visitor route.
10. Welcome/room pass: rebuilt the entry screen around the new desktop/mobile room artwork, removed duplicate title text from the welcome overlay, moved the previous welcome art inside the site, added Book and Dopesick rooms, reduced repeated tagline copy, normalized Trap Pass nav wording, and updated the Pass Terminal language.
11. Author-profile room pass: reframed the old figure-room concept into a living author profile, added story stations for the main public-safe parts of Ryan's story, staged a spoken-word TV slot, and kept final labels/video details in the authentic-info list.
12. Research/strategy pass: folded in the thread theory and Crack Capitalism research report, tightened public theory language, added a cleaner first-contact route, staged Stripe config without checkout, and swapped the author-profile room to the corrected Paradise/Oblivion layout.

## Feedback List Sweep

- Room logic: preserved Project, Threads, Documentary, Archive, Trap Pass, Phases, Preorders, Discord, and added Book/Dopesick as clear rooms.
- Nav: active states remain route-specific; labels were expanded to include Book and Dopesick, and public "Get Pass" labels were normalized to "Trap Pass."
- Welcome: new desktop/mobile artwork is the entry screen; the overlay no longer repeats the project title already baked into the art.
- Duplicate tagline: the entry gate keeps the main map/room/pass line, while interior repeats were replaced with room-specific copy.
- Hero copy: the Project route keeps the map/room/pass explanation; the start/home hero now uses the requested brain-break line so the two screens do different jobs.
- Documentary framing: the public documentary disclaimer and framing block remain visible near the documentary page.
- Archive framing: the archive terminal still explains the processing numbers as an evidence-machine pulse rather than random dev stats.
- Trap Pass: public-safe summaries, Supabase-backed storage, "No Private Fields" language, phases, and baggies remain wired.
- Preorders: product ladder is present, with unconfirmed prices/limits intentionally held for Ryan instead of guessed.
- Layout: heading wrapping, nav crowding, and pass ID word breaking were tightened for the mid-word cutoff issue.

## Verification Results

- JSON parse: pass.
- JavaScript syntax check: pass.
- Asset/link sweep: 0 missing assets, 0 missing route targets.
- Entry gate desktop/mobile QA: new room artwork loads, no duplicate project-name overlay appears, the tagline/email gate fits, and `?entry=1` can force the welcome screen for review.
- Browser route audit across the main public review routes: no broken images in the visible viewport, no console errors, no public admin links, no horizontal overflow, no flagged builder-copy strings.
- Mobile viewport sweep: no horizontal overflow on key pages after CSS cache-bust.
- Final browser failure-only QA: 0 desktop failures and 0 mobile failures.
- Start Here route QA: `/start-here/` returns 200, has no broken images, no console errors, and no mobile overflow.
- Trap Pass local review flow: claim, pass inventory, and pass lookup work.
- Supabase public lookup: pass summary returned through `lookup_trap_pass_public`, with no email or wallet fields exposed.
- Archive terminal stats now use verified June 10/June 12 archive log outputs instead of placeholder counts.
- Threads graph behavior: selecting Addiction Machine and Money Desperation highlights connected lines and updates the crossing inspector.
- Trap Pass safety test: public summary omits private account fields while preserving pass ID, role mapping, channels, phase, and thread keys.

## Still Needs Ryan

The remaining integration unknowns are tracked in `AUTHENTIC_INFO_NEEDED.md`. The biggest ones are serverless Stripe checkout deployment, webhook verification, cleared clips/keyframes, spoken-word room intro, and approved object stories for the room/car environment.
