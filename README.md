# MadeOfPixels Studio

Static site generator plus a few Vercel functions. Start with **docs/SETUP.md** (environment variables, admin panel, monitoring).

```
node build/build.js     # regenerates site/ (pages, sitemap, feed, social images, vercel.json)
node build/lint.js      # SEO + integrity check: titles, descriptions, canonicals, JSON-LD, links, anchors, sitemap, placeholders
```

| Where | What |
|---|---|
| `content/*.json` | projects, blog posts, gallery sketches, reviews (edited from /admin, or by hand) |
| `build/lib.js` | site config (contact, GA4, Clarity), services, FAQ, schema, nav, footer, page chrome |
| `build/pages.js`, `build/pages2.js` | page builders; pages.js also re-renders your original landing pages and security policy |
| `build/og.js` | dependency-free 1200x630 social preview images in the pixel style |
| `build/assets-src/` | CSS, `site.js` + `features.js` (all interactions), `admin.js` |
| `api/` | serverless functions: submit (all form emails), audit, audit-send, content (admin saves), upload, log, health |
| `docs/` | SETUP.md (environment variables, admin, monitoring) |
| `site/` | generated output (git-ignored; Vercel builds it) |

Estimator prices: the `ESTIMATOR` object in `build/assets-src/site.js`. The generated site has no placeholder text; the lint fails if one appears.
