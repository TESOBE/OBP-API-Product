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

## Animation

Sections fade in as they scroll into view, the figures count up, the demo terminal types API calls, and the diagram shows requests flowing. All of it is switched off for visitors who ask their system for reduced motion.

## Publishing

The site is published at https://obp-api-product.tesobe.com.

In the repository's settings, under Pages, choose the `docs/` folder of the main branch. `docs/CNAME` holds the domain name. In TESOBE's DNS, add a `CNAME` record for `obp-api-product` pointing to `<owner>.github.io`, where `<owner>` is the GitHub organisation that holds the repository. Then tick "Enforce HTTPS" in the Pages settings once GitHub has issued the certificate.

## Licence

Copyright (C) 2011-2026, TESOBE GmbH.

This site is licensed under the GNU Affero General Public License, version 3, like OBP-API itself. See `LICENSE`.
