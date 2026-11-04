KaRama IT Website
=================

OPEN THE WEBSITE
Double-click index.html, or open it in Google Chrome. No build step, installation
or internet connection is needed. All links work directly from the local folder.

PAGES
index.html          Home
expertise.html      Interactive services explorer
possibilities.html  Illustrative business possibilities
approach.html       Process and working principles
contact.html        Project brief form
automations.html    51-product catalog, category/brand filters and quotation cart

LANGUAGES
Use the English / العربية button next to Let's talk in the header on any page.
Arabic uses the Saudi Arabia locale (ar-SA) and a right-to-left layout.
The choice is remembered and carried across pages. Arabic product search and
Arabic digits in mobile numbers are supported. Product references stay the same.

SHARED FILES
styles.css          Responsive design; primary blue #0095fd from the supplied logo
app.js              Service tabs, mobile menu, privacy dialog and email enquiry
i18n.js / i18n.css  English / Saudi Arabic translations and right-to-left layout
assets/             Both supplied company logos, preserved unchanged
DESIGN-NOTES.txt    Design research and decisions

BEFORE PUBLIC LAUNCH
Confirm proposed services and copy. Business email and phone numbers are in the
footer and on the contact page. The contact form opens the visitor's
email app with an enquiry addressed to info@karama.tech. To send enquiries without
the email app, connect a form backend and update the privacy information.
Add applicable legal company details.

HOSTING
Vercel frontend + Vercel quotation API + private Supabase database.
See VERCEL-SETUP.md for the database schema and environment variables required
to enable automatic quotation emails to info@karama.tech through Resend.
Run npm run dev for local preview, npm test for API checks and npm run build
to create the public dist/ folder. The website has not been published.
