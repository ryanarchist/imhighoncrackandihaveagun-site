# The Trap House Discord Public Release Checklist

Status: Discord and static website public release prep. Website static launch approved; paid checkout remains staged.

## What Is Ready

- Server structure package: `discord-setup-package/`
- Roles, categories, channels, permissions, NSFW/slowmode flags, and pinned starter posts.
- Pinned image uploads for the front door, rules, official links, new drops, thread map, and resources.
- Starter copy for every channel, so new rooms are not empty on first public entry.
- Complete 12-Thread channel map.
- Trap Pass role/access lanes prepared for manual roles now and bot mapping later.
- Public launch copy and official links copy.

## Required Manual Info

- Discord bot token.
- Discord server/guild ID: `1515763346790420680`.
- Final permanent invite URL. Supplied and verified: `https://discord.gg/64MKTrGGsD`.
- `Amelia the Plug` should hold the `Mod` role besides Ryan.
- `Heavy Content OK` is approved as manual opt-in now; reaction role or bot assignment can come later.

## Bot Permissions

Invite the setup bot with:

- Manage Roles
- Manage Channels
- View Channels
- Send Messages
- Manage Messages
- Read Message History
- Attach Files
- Embed Links
- Manage Server, only if `APPLY_SERVER_BRANDING=true`

Put the bot role above every role it needs to create or manage.

## Run The Setup

From:

```bash
C:\Users\ryanh\OneDrive\Documents\GitHub\imhighoncrackandihaveagun-site\discord-setup-package
```

Create `.env` from `.env.example`, then fill in:

```bash
DISCORD_BOT_TOKEN=...
DISCORD_GUILD_ID=...
APPLY_SERVER_BRANDING=true
```

Then run:

```bash
npm install
npm run check
npm run setup
```

If npm is not available, run the dependency-free setup instead:

```bash
C:\Users\ryanh\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe check_discord_package.js
C:\Users\ryanh\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe setup_discord_rest.mjs
```

Or use the safer prompt-based launcher so the token is not saved to `.env`:

```powershell
.\apply_discord_setup.ps1 -ApplyBranding
```

Use `APPLY_SERVER_BRANDING=false` if you want to set icon/banner manually.

## After Setup Click Checks

- Server icon is `assets/trap-house/trap-house-discord-logo.png`.
- Server banner is `assets/trap-house/trap-house-discord-banner.png`, if Discord allows banners on the server.
- `#knock-first`, `#house-rules`, `#official-stash`, `#announcements-from-the-couch`, `#new-drops`, `#the-map-on-the-wall`, and `#resources-in-the-cabinet` have pinned starter posts.
- Member rooms have their short starter posts.
- The pinned images appear and are not cropped into nonsense.
- Heavy channels are age-restricted/NSFW.
- `#house-rules`, `#official-stash`, `#announcements-from-the-couch`, `#new-drops`, `#the-map-on-the-wall`, and `#resources-in-the-cabinet` are read-only for normal members.
- Trap Pass and locked rooms are hidden from normal members.
- Give Ryan and trusted helpers the `Mod` role.
- Give `Amelia the Plug` the `Mod` role.
- Create a permanent invite link only after the above is checked.

## Recommended Public Server Settings

- Verification level: require verified email.
- Default notifications: only mentions.
- AutoMod: anti-spam, phishing/scam links, mass mention spam, and hard-line illegal sourcing terms only.
- Do not use a giant corporate word filter. The room is supposed to be raw.
- Keep the hard lines: no sourcing, threats, doxxing, minors, exploitation, spam floods, unsafe instructions, or private material.

## Public Invite Copy

The Trap House Discord is open.

The static site is approved for public launch, and the room is live: Threads, archive drops, Trap Pass roll call, writing, music, book/doc updates, and the people who get why this project has to exist.

Pull up inside:

`https://discord.gg/64MKTrGGsD`

Real people. Real vibes. One house.

## Fast Rollback

If the public invite brings in a bad wave:

- Pause invites.
- Temporarily lock `#living-room`, `#new-faces-at-the-door`, and `#tap-in`.
- Keep `#knock-first`, `#house-rules`, and `#official-stash` visible.
- Use `#broken-glass-report` for staff notes.
- Reopen once spam/raid accounts are removed.
