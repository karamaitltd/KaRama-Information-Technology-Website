# Enable automatic quotation requests

The Automations page is built for Vercel with a private Supabase database and Resend email delivery to **info@karama.tech**. No credentials have been added and no live email has been sent.

## 1. Supabase

Create/select your Supabase project. Run `supabase/schema.sql` in its SQL Editor. This creates the private quotation table and a server-only function with database-backed rate limiting. Leave the Data API enabled for the public schema; the explicit grants and Row Level Security prevent browser access. Copy the project URL and server **secret key** from the project settings. A legacy service-role key is also supported through `SUPABASE_SERVICE_ROLE_KEY`.

Only the Vercel API uses the secret key. The frontend does not need a Supabase key or visitor accounts. Never paste a server secret into HTML, browser JavaScript, or chat.

## 2. Email sending

In [Resend](https://resend.com/docs/dashboard/domains/introduction), verify a sending domain you control, such as `karama.tech`, by adding the required DNS records. Create a sending API key. Use an address on that verified domain, such as `quotations@karama.tech`, for the sender. Your existing inbox at `info@karama.tech` remains the fixed recipient. Customer email is optional and becomes Reply-To when provided.

## 3. Vercel

Import this website folder as the Vercel project root. Choose the **Other** framework preset. `vercel.json` sets the build command to `npm run build`, public output to `dist`, and creates the `/api/quotation` Node function. Use Node.js 22 or a newer supported version. There are no npm dependencies.

Add the following in Vercel → Project → Settings → Environment Variables for the environments you deploy:

| Variable | Value |
| --- | --- |
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_SECRET_KEY` | Your server secret key, kept private |
| `RESEND_API_KEY` | Your Resend sending API key |
| `QUOTATION_FROM_EMAIL` | `KaRama IT <quotations@karama.tech>` after verifying the sender domain |

Deploy or redeploy after setting them. Do not copy `.env.example` placeholder values as real credentials.

## 4. Verify the hosted flow

Add a camera and lock to the cart, change quantities, and request a quotation. Full name and a valid phone are required; email is optional. Submit one real request and verify the corresponding row in Supabase and email in `info@karama.tech`. Verify phone-only requests too. Do not consider launch verification complete until the inbox has received the request.

The required Service requirement dropdown offers Products with installation or Products only. Its selection is stored in the existing JSON payload and included in the enquiry email; no extra database column or schema migration is needed.

The handler saves the request first, then asks Resend to send it. Success means Resend accepted the message; it does not prove inbox delivery. Monitor bounces and delivery in the Resend dashboard. Supabase `email_status = 'pending'` means sending has not been confirmed; `accepted` means the provider accepted it. Check pending requests in Supabase if email service is disrupted.

Retries reuse the same reference and Resend idempotency key. Requests with an uncertain status older than 23 hours require a manual check instead of risking duplicate emails. If a visitor refreshes the page, the cart remains; retry references and contact details are kept only in page memory. A new submission after a refresh can create a new request. Rate limiting allows 20 new/pending submission attempts per network per hour. A network change during a retry may require starting a fresh request.

## Local development and checks

Run `npm run dev` and open `http://127.0.0.1:4173/automations.html`. The catalog also opens directly from `automations.html`; sending requires the server. Without configured environment variables, submission returns an explicit unavailable message and retains the cart. For a configured local server, load environment variables privately, for example `node --env-file=.env scripts/dev.cjs`; the normal dev command does not load `.env` automatically.

Run `npm test` for API validation and failure-path tests, and `npm run build` for the public site output. Automated API tests mock Supabase and Resend and never send emails.

If npm is unavailable on your computer, use the dependency-free equivalents: `node scripts/dev.cjs`, `node --test tests/quotation.test.cjs`, and `node scripts/build.cjs`. These direct Node commands were used for local verification because the existing npm installation on this computer points to a missing npm CLI file.

Product titles are descriptive labels derived from the 51 supplied images. Exact model numbers, specifications, bundles and availability must be confirmed by KaRama. Product references connect each card, image and quotation line to the same record. Maintain `products.json` and the matching cards in `automations.html` together when changing the catalog.

The cart stores product IDs and quantities in local storage. Contact details, notes and requested items are stored in the private Supabase table when sent. Review retention requirements before launch; remove expired customer records as appropriate. Old rows in `quotation_rate_limits` can be periodically removed after their one-hour window.

API implementation follows the official [Vercel Node function documentation](https://vercel.com/docs/functions/runtimes/node-js), [Supabase server-key guidance](https://supabase.com/docs/guides/getting-started/api-keys), and [Resend sending API](https://resend.com/docs/api-reference/emails/send-email).
