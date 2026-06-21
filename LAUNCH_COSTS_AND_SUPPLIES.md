# Launch Costs And Supplies

Updated 2026-06-21. Static website launch approved by Ryan; paid checkout still requires serverless deployment secrets before it opens.

## Cheapest Public Launch

- Discord: $0/month.
- Static website hosting: $0/month on GitHub Pages or similar static hosting.
- Domain: keep using the owned domain if it is already paid; otherwise expect roughly $10-$25/year for a normal non-premium domain depending on registrar and renewal price.
- Checkout: $0/month with direct Stripe Checkout Sessions, plus card processing fees per sale. Serverless hosting may be needed for webhooks and fulfillment.
- Email capture: $0/month to start on a free email-marketing tier if volume is low.

Estimated starting cost: $0/month plus domain renewal and payment processing fees.

## Recommended Lean Production Stack

- Static website hosting: GitHub Pages free, or Vercel/Render free tier if a deploy workflow is easier.
- Pass storage/account recovery: Supabase free for launch testing, Supabase Pro when real pass data matters.
- Discord bot: manual role mapping now; later host the bot on a small service if it needs to run 24/7.
- Checkout/preorders: Stripe direct Checkout Sessions for digital/pass sales and preorders; Fourthwall or another vendor can still handle merch fulfillment later if needed.
- Email: Brevo free to start; paid email later if list volume or automation grows.

Estimated early real-world cost: $0-$35/month plus processing fees.

## More Proper Production Stack

- Supabase Pro for real Trap Pass storage and recovery.
- Small always-on bot hosting if automatic Discord roles and slash commands are active.
- Paid email plan once the list grows.
- Optional paid hosting plan only if traffic, build workflow, or backend functions need it.
- Optional merch/store platform if preorder operations move beyond direct Stripe checkout.

Estimated production cost: about $40-$90/month plus checkout/payment/fulfillment fees.

## Do Not Buy Yet Unless Needed

- Blockchain minting or external wallet infrastructure.
- Shopify, unless physical product fulfillment and store operations are ready.
- Full paid hosting if GitHub Pages plus a serverless payment host is enough.
- Paid email until the free tier gets tight.
- Discord boosts unless branding/banner perks matter immediately.
- Expensive analytics until the site is public and traffic exists.

## Ryan Must Supply

- Final deploy approval and domain/DNS access.
- Final official links, especially Instagram and Spotify artist URL.
- Serverless deployment target for Stripe Checkout Sessions and webhooks.
- Product list: exact names, prices, quantities, shipping rules, refund language, fulfillment plan.
- Trap Pass rules: free/paid/bundled/manual, wave quantities, role mapping, perks.
- Email provider login/API key and sender email/domain.
- Supabase SQL setup confirmation for real pass storage.
- Final author bio and official author image.
- Final disclaimer, age gate, privacy, and terms language.
- Cleared media list: which images, clips, screenshots, stories, and object details are approved for public pages.
- Discord bot token only through the setup prompt or environment variables; never commit it.

## Current Discord Facts

- Invite: `https://discord.gg/64MKTrGGsD`
- Server ID: `1515763346790420680`
- Bot authenticated as `ol roon`.
- Amelia the Plug has been assigned `Mod`.
- The pasted bot token should be reset in Discord Developer Portal because it appeared in chat.
