# If The Discord Link Is Live Right Now

Website static launch is approved. Paid checkout stays staged until the payment room is connected.

## Live Status - 2026-06-17

- Verified public invite: `https://discord.gg/64MKTrGGsD`
- Server/guild ID: `1515763346790420680`
- Bot token authenticated as `ol roon` and reached `The Trap House`.
- Live setup pass completed and then rerun with optimized branding assets:
  - 13 roles found/confirmed.
  - 8 categories found/confirmed.
  - 43 channels updated.
  - Starter posts already existed for 42 rooms.
  - One new official-stash post landed with 2 attached assets.
- Server icon/name branding applied.
- Banner branding was attempted with optimized assets; Discord API reported success, but a later guild read did not show a banner hash, so visually confirm in Discord.
- `Amelia the Plug` / `ameliatheplug` was assigned the `Mod` role.
- `Heavy Content OK` is ready as a manual opt-in role now; reaction role or bot automation can come later.
- Server default notifications are set to mentions only.
- Verification level is set to verified email.
- Existing manual/extra channels are not deleted by the setup. If Ryan deletes a mapped room, the next rerun recreates it.
- Reset the bot token in Discord Developer Portal after this run because the token was pasted into chat.

## Fast Check

Before sending the invite wider, make sure these exist and are visible:

- `#knock-first`
- `#house-rules`
- `#official-stash`
- `#living-room`
- `#announcements-from-the-couch`

If those do not exist yet, pause the invite until the setup package is applied.

## If People Are Already Entering

Pin this in the first visible channel:

```text
Welcome to The Trap House. The Discord and public site are opening together while paid checkout stays staged.

This is 18+ documentary/archive space: real stories, Threads, archive drops, book/doc/music updates, Trap Pass roll call, and community buildout.

Raw is welcome. Reckless is not.

No sourcing, plugs, threats, doxxing, minors, exploitation, scam links, unsafe instructions, or private material.

The website is the map. The Discord is the room. The Trap Pass gets you deeper inside.
```

Pin this if the rules channel is not ready:

```text
Grimey house rules:

Keep it raw, keep it useful.

No sourcing, selling, plugs, instructions, threats, doxxing, minors, exploitation, private material, spam floods, or telling people to imitate dangerous footage.

Heavy story context belongs in heavy rooms once those open.

Mods can clean risky stuff so the house stays standing.
```

## Quick Lockdown

If the room gets hit by spam:

- Pause the invite.
- Lock `#living-room`.
- Keep only `#knock-first`, `#house-rules`, and `#official-stash` visible.
- Remove obvious spam/raid accounts.
- Reopen after the setup package is applied.

## Apply The Full Setup

From PowerShell:

```powershell
cd C:\Users\ryanh\OneDrive\Documents\GitHub\imhighoncrackandihaveagun-site\discord-setup-package
.\apply_discord_setup.ps1 -ApplyBranding
```

It will ask for:

- Discord server/guild ID
- Discord bot token

Then it creates/updates the roles, channels, permissions, pinned posts, and images.
