# The Trap House Discord Setup Notes

Public Discord prep is approved. Website publishing is still not approved.

Use `discord-setup-package/` to apply the server structure after Ryan provides a Discord bot token. The server/guild ID is `1515763346790420680`.

## Identity

- Server name: The Trap House
- Server/guild ID: `1515763346790420680`
- Verified invite: `https://discord.gg/64MKTrGGsD`
- Banner: `assets/trap-house/trap-house-discord-banner-960.jpg`
- Icon: `assets/trap-house/trap-house-discord-logo-512.png`
- House line: The website is the map. The Discord is the room. The Trap Pass gets you deeper inside.
- Rules version: grimey house rules
- Trusted Mod to assign manually: Amelia the Plug
- `Heavy Content OK`: manual opt-in now, reaction role or bot automation later

## Culture

The target feel is loose, raw, lived-in, and low-friction. The server should not feel like a corporate support forum.

Basic boundaries still matter:

- No doxxing.
- No direct threats.
- No exploitation.
- No spam floods that make the room unusable.
- No posting things that put the project or members at risk.

## Manual Setup Order

1. Apply the server icon and banner.
2. Create roles from `data/discord-framework.json`.
3. Create categories in the same order as the JSON.
4. Create channels inside each category.
5. Set `announcements` and `mission-board` to staff/bot posting.
6. Leave most member rooms open to verified members.
7. Gate wave rooms by Wave 1, Wave 2, Wave 3, and Inner Room roles.
8. Pin the map/room/pass explanation in `#the-map-on-the-wall`.
9. Confirm the complete 12-Thread map exists.
10. Create the public invite only after the server looks right.

## Bot Phase

The future bot should start with:

- `/trap-pass verify`
- `/trap-pass profile`
- `/mission drop`
- `/mission proof`
- `/archive status`
- `/clip vote`

The bot should never expose private email, wallet, or admin data in public channels.

See `DISCORD_PUBLIC_RELEASE.md` for the launch checklist.
