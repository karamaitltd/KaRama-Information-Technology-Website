# GitHub Pages hosting

The workflow in `.github/workflows/pages.yml` tests and builds the website on pushes to `main`, then publishes only the public `dist/` output to GitHub Pages. SQL, server source, tests and environment files are not part of the hosted output.

A repository administrator, maintainer, or member with permission to manage Pages must first open Settings → Pages and select **GitHub Actions** under Build and deployment → Source. The deployment then runs automatically. If the first run occurred before Pages was enabled, rerun the workflow from the Actions tab.

The expected project URL is:
https://karamaitltd.github.io/KaRama-Information-Technology-Website/

Confirm a successful deployment and open the URL before treating it as live.

## Quotation requests

GitHub Pages hosts static files and cannot execute the Vercel `/api/quotation` server. The Pages build therefore labels the quotation button **Prepare quotation email** and opens the visitor’s email app with their contact details, products, quantities, and installation choice addressed to info@karama.tech. The visitor must review and send that email. The cart remains available. There is no automatic database write or server-side email on GitHub Pages.

The ordinary build and Vercel serverless function keep the automatic Supabase + email flow for future use. See `VERCEL-SETUP.md` for that setup. No credentials are needed for the GitHub Pages build.

To build the Pages output locally, run `node scripts/build.cjs --github-pages`. All asset and navigation URLs are relative, so the site works beneath the repository path, including English and Saudi Arabic links.

Official references: [Pages workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages), [Pages publishing source](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).
