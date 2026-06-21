# The Trap House Discord Setup Package

This folder builds the public-release Discord structure for IHOCAIHAG / IM HIGH ON CRACK AND I HAVE A GUN.

It creates roles, categories, channels, permissions, slowmode/NSFW settings, starter pinned messages, and pinned launch images. It is designed to be rerunnable: existing roles/channels are skipped or updated instead of duplicated.

## Files

- `package.json` - Node dependencies and setup script.
- `.env.example` - Environment variables you copy into `.env`.
- `setup_discord.js` - Rerunnable Discord setup script.
- `setup_discord_rest.mjs` - Dependency-free REST setup script for machines without npm.
- `apply_discord_setup.ps1` - Prompt-based launcher that avoids saving the bot token in `.env`.
- `check_discord_package.js` - Local preflight checker that does not need a Discord token.
- `config/server-map.json` - Roles, categories, channels, starter messages, and integration notes.
- `content/start-here.md` - Pinned welcome for `#knock-first`.
- `content/rules.md` - Pinned grimey house rules for `#house-rules`.
- `content/thread-map.md` - Pinned Threads explanation for `#the-map-on-the-wall`.
- `content/official-links.md` - Pinned official links for `#official-stash`.
- `content/launch-announcement.md` - Pinned opening post for `#announcements-from-the-couch`.
- `content/new-drops.md` - Pinned starter post for `#new-drops`.
- `content/resources.md` - Pinned support/resource post for `#resources-in-the-cabinet`.
- `content/channel-starters.json` - Short starter copy for every remaining channel.

## Setup

1. Create a Discord bot in the Discord Developer Portal.
2. Enable server members intent only if you later add member automation. This first setup script needs guild/channel access.
3. Invite the bot to your server with permissions to manage roles, manage channels, send messages, attach files, embed links, pin messages, view channels, read message history, and manage messages.
4. Copy `.env.example` to `.env`.
5. Add your real `DISCORD_BOT_TOKEN` and `DISCORD_GUILD_ID`.
6. Set `APPLY_SERVER_BRANDING=true` only if you want the script to apply the server name/icon and attempt the banner.
7. Run:

```bash
npm install
npm run check
npm run setup
```

If npm is not available on this machine, use the dependency-free REST runner:

```bash
C:\Users\ryanh\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe check_discord_package.js
C:\Users\ryanh\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe setup_discord_rest.mjs
```

Or use the prompt-based launcher:

```powershell
.\apply_discord_setup.ps1 -ApplyBranding
```

## Notes

The script does not print your bot token. It does not publish the website. It only edits the Discord server connected to the guild ID you provide.

The setup is additive/rerunnable. If a mapped role, category, or channel is missing, it recreates it. It does not delete manual channels or personal edits you added outside the map.

Manual settings still worth checking after the script:

- Put the bot role high enough in the Discord role list to assign created roles.
- Review channel order and drag anything that needs a better visual placement.
- Confirm heavy rooms are marked NSFW and have slowmode.
- Confirm `#house-rules`, `#official-stash`, `#announcements-from-the-couch`, `#new-drops`, `#the-map-on-the-wall`, and `#resources-in-the-cabinet` are read-only.
- Create the final public Discord invite only after the server is visually checked.
- Keep the website invite hidden from public site pages until the website launch is approved.

Public-release checklist:

`../DISCORD_PUBLIC_RELEASE.md`

Core idea:

The website is the map. The Discord is the room. The Trap Pass gets you deeper inside.
