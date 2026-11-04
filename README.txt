KaRama IT Website
=================

Six-page business website with 51 product cards, filters, a quotation cart, and English / Saudi Arabic switching.

VERCEL + SUPABASE
Run node scripts/dev.cjs for local preview. Run node scripts/build.cjs to build.
Both forms save private enquiries and send branded emails to KaRama and visitors.
See VERCEL-SETUP.md for server configuration and delivery checks.

GITHUB PAGES
The existing Pages workflow publishes a static version using email-app enquiries.
See GITHUB-PAGES.md for hosting details.

CHECKS
Run node --test tests/quotation.test.cjs. The tests do not send real emails.
