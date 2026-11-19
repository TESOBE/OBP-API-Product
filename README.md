# OBP-API product site

The product site for [OBP-API](https://github.com/OpenBankProject/OBP-API), served by GitHub Pages from `docs/`.

It is plain HTML, one stylesheet and one script, with no build step. Edit the pages in `docs/` directly.

## Pages

- `index.html`: overview, with the figures, a demo of API calls and the architecture diagram
- `capabilities.html`, `security.html`, `standards.html`, `architecture.html`, `deploy.html`
- `apps.html`, with a page per app: `portal.html`, `api-explorer.html`, `api-manager.html`, `sandbox-populator.html`, `hola.html`, `opey.html`, `mcp.html`, `bank-node.html`, `senti.html`. Their screenshots are in `docs/img/apps/`

## Figures

The figures on the pages (endpoints, Roles, versions, endpoints by area) come from `docs/figures.json`. Browsers cannot read OBP-API from another site, because it sends CORS headers only on the preflight request, so the figures are fetched by a script instead:

```bash
python3 scripts/update_figures.py https://apisandbox.openbankproject.com
```

The GitHub Action in `.github/workflows/update-figures.yml` runs it every day, and commits `figures.json` when a figure changes.

## Search engines and AI tools

`scripts/update_seo.py` writes what search engines and AI tools read, from one list of pages:

- in each page's head, between `<!-- seo:` and `<!-- /seo -->`: the canonical address, Open Graph and Twitter tags for link previews, and JSON-LD structured data (TESOBE, the site, the page, and for each product page the software itself). It also sets each page's title;
- `docs/sitemap.xml`, `docs/robots.txt` and `docs/llms.txt` (a short Markdown guide to the site for AI tools, see https://llmstxt.org).

Each page's own `<meta name="description">` is the description used everywhere. After adding or renaming a page, or changing a title or description, add the page to `PAGES` in the script and run it:

```bash
python3 scripts/update_seo.py
```

It stops with a message if a page in `docs/` is missing from its list. The GitHub Action in `.github/workflows/update-seo.yml` runs it whenever a page or the script changes on `main`, and commits the result, so running it by hand is only needed to see the result before pushing. The sitemap dates each page by its last commit. The image shown when a link is shared is `docs/img/social.jpg` (1200 by 630).

## Animation

Sections fade in as they scroll into view, the figures count up, the demo terminal types API calls, and the diagram shows requests flowing. All of it is switched off for visitors who ask their system for reduced motion.

## Publishing

The site is published at https://obp-api-product.tesobe.com.

In the repository's settings, under Pages, choose the `docs/` folder of the main branch. `docs/CNAME` holds the domain name. In TESOBE's DNS, add a `CNAME` record for `obp-api-product` pointing to `<owner>.github.io`, where `<owner>` is the GitHub organisation that holds the repository. Then tick "Enforce HTTPS" in the Pages settings once GitHub has issued the certificate.

## Licence

Copyright (C) 2011-2026, TESOBE GmbH.

This site is licensed under the GNU Affero General Public License, version 3, like OBP-API itself. See `LICENSE`.
