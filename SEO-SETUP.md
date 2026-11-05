# Search setup for KaRama IT

The primary search domain is **https://karama.tech/**. The second domain and both www addresses redirect to it in Vercel. Keep existing Google Workspace and Resend DNS records unchanged.

## Implemented

- Six English pages and six static Saudi Arabic pages under `/ar/`. The build includes translated page content, product names, titles, descriptions and RTL markup without requiring JavaScript.
- Self-referencing canonicals and reciprocal `en`, `ar-SA` and `x-default` links. Language links are crawlable anchors; switching language in the browser preserves the quotation cart and form state.
- Page-specific search and social metadata. Open Graph and Twitter previews use the existing KaRama logo.
- Organization, WebSite, WebPage, Service, BreadcrumbList and catalogue ItemList JSON-LD. Addresses, phones and social profiles match the visible website. Products are quotation-based, so no prices, stock status, ratings or merchant Product offers are invented.
- `https://karama.tech/robots.txt` and `https://karama.tech/sitemap.xml`, listing twelve canonical pages with language alternates. API routes are excluded from crawling and carry noindex headers.
- GitHub Pages and vercel.app copies use noindex to keep the custom domain as the search destination. Older `?lang=ar-SA` links still serve Arabic content on Vercel and normalize to the dedicated language path in the browser.

## Maintain

Page metadata and structured data: `lib/seo.cjs`. Shared translations: `i18n-data.js`. Static localization: `lib/localize.cjs`. Run `node scripts/build.cjs` after edits. Source HTML includes English metadata for local editing; the build refreshes metadata for both locales from the shared config.

Run `node --test tests/*.test.cjs` to check form validation/delivery mocks, localized metadata, sitemap coverage, public asset links and the GitHub Pages fallback. Preview the built output with `node scripts/dev.cjs --built`.

## Search Console

On November 5, 2026, the **karama.tech** Domain property was verified for the approved Google account **info@karamaitco.com** using an additional Google verification TXT record in Wix. Keep that record to retain ownership verification. Workspace MX/SPF/DKIM and Resend DKIM records were preserved.

Google processed `https://karama.tech/sitemap.xml` successfully and reported **12 discovered pages**. Reuse this verified property at https://search.google.com/search-console?resource_id=sc-domain%3Akarama.tech. Inspect English and Arabic URLs there to review later crawling, indexing and search performance. Search engine crawling and ranking are external processes; sitemap processing does not mean the pages have already been indexed or ranked.

Official references:
- https://developers.google.com/search/docs/specialty/international/localized-versions
- https://developers.google.com/search/docs/appearance/structured-data/organization
- https://developers.google.com/search/docs/appearance/structured-data/product-snippet
