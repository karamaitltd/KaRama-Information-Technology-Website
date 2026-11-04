# Vercel, Supabase and branded enquiry emails

The website has two server endpoints: `/api/contact` and `/api/quotation`. Both validate the form, save the enquiry to Supabase, email the full request to **info@karama.tech**, and send a branded confirmation to the visitor. Email is required for both forms. Full name and phone are also required for quotations.

Quotation emails include the selected products, quantities, installation choice, contact details and notes. Both staff and customer copies include a CSV product summary attachment. The KaRama logo is embedded as an inline image attachment. Customer confirmations use English or Saudi Arabic according to the visitor’s language selection.

## Database

Supabase project: **KaRama IT Website**, organization **KaRama LTD**, project reference `frsivsbogurkoohnfkdt`, region Frankfurt (`eu-central-1`). API URL: `https://frsivsbogurkoohnfkdt.supabase.co`.

The schema in `supabase/website-enquiries.sql` creates:

- `website_enquiries`: the contact or quotation details, language and independent staff/customer email statuses.
- `website_enquiry_items`: product references, names, categories and quantities for quotation requests.
- `website_enquiry_rate_limits`: hashed network identifiers and request limits shared across server instances.

These tables have Row Level Security enabled and no access grants for anonymous or signed-in website visitors. Only the server secret key can call the submission function or access enquiry records. The browser needs no Supabase key or customer account. The initial schema and line-item storage were tested using a transaction that was rolled back.

## Vercel configuration

Import `karamaitltd/KaRama-Information-Technology-Website`, with the repository root and the Other preset. `vercel.json` builds `dist/` and deploys the two API routes with the bundled logo. Use Node 22 or a newer supported version. There are no npm dependencies.

Store these values privately in Vercel for the deployed environments:

| Variable | Value |
| --- | --- |
| `SUPABASE_URL` | `https://frsivsbogurkoohnfkdt.supabase.co` |
| `SUPABASE_SECRET_KEY` | The project’s server Secret key; never a browser publishable key |
| `RESEND_API_KEY` | The website’s sending-only key, restricted to karama.tech |
| `QUOTATION_FROM_EMAIL` | `KaRama IT <info@karama.tech>` |

The existing verified karama.tech domain can be shared with the other application. This website uses its own sending key. No transfer, DNS change, or rotation of the existing application’s key is required.

## Delivery and retries

Requests are saved before either email is sent. Staff and customer messages have separate deterministic idempotency keys and acceptance statuses. If only one email fails, a retry with the same form details sends only the missing message. The form keeps the visitor’s details and the cart on failure. Accepted messages are not resent. Supabase records track provider acceptance, which does not prove inbox delivery; verify Delivered or inspect bounces in Resend.

An uncertain request older than 23 hours requires a manual check to avoid resending after the provider’s idempotency window. A browser refresh creates a new in-memory request reference on resubmission; it can therefore produce a second request. Pending messages are visible in Supabase for staff follow-up. There is no background retry scheduler yet.

## Verification

Run `node --test tests/quotation.test.cjs` and `node scripts/build.cjs`. For local preview use `node scripts/dev.cjs`, or `node --env-file=.env scripts/dev.cjs` with a private environment file. Tests mock external services and send no real email.

After deployment, submit a clearly marked contact test and quotation test using an approved inbox. Confirm the saved records and product line items, the staff emails, and customer receipts with logo and product attachment. Confirm delivery in Resend before declaring the live email flow verified.

GitHub Pages uses a separate static build and prepares emails in the visitor’s email app; it cannot execute these endpoints. See `GITHUB-PAGES.md`.
