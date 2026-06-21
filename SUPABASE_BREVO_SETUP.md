# Supabase And Brevo Setup

The static site is approved for public launch. Keep all private keys in local env files or deployment secrets only.

## Supabase

Current public project URL:

```text
https://xpmozqmqzrljvnubnnxs.supabase.co
```

Current publishable key is already wired in `config.js`.

To turn on real entry email capture and Trap Pass storage:

1. Open Supabase Dashboard.
2. Go to SQL Editor.
3. Paste and run `supabase/trap_house_schema.sql`.
4. Test locally:
   - Open `/`.
   - Enter an email through the welcome gate.
   - Claim a Trap Pass at `/trap-pass/`.
   - Check it at `/check-pass/`.

The SQL creates private tables and public-safe RPC functions. Public browser code can claim and look up passes, but does not receive private row IDs, email lists, private notes, or backend-only data.

## Brevo

Brevo is not connected yet. Needed from Ryan:

- Brevo API key, supplied through a local secret or environment variable, not pasted into a committed file.
- Sender email and sender name.
- List ID for launch/email capture.
- Whether entry-gate emails should immediately sync to Brevo or stay in Supabase until launch approval.
- Confirmation email wording, if automatic confirmations are enabled.

## Still Not Done

- Checkout/preorder provider and product IDs.
- Privacy policy/email consent copy.
- Final official links and author bio.
- Final approval to publish the website.
