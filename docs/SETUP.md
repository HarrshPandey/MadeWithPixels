# Setup guide

The site is static HTML plus a few small serverless functions in `api/`. Vercel builds it (`node build/build.js`) and serves it, so the admin panel can change content without you touching code.

## 1. Deploy
1. Put this whole folder in your GitHub repo (`HarrshPandey/MadeWithPixels`) and push.
2. In Vercel, import the repo. Settings are read from `vercel.json` (build command `node build/build.js`, output `site`). Node 20 or newer.
3. Add the environment variables below under Project > Settings > Environment Variables, then redeploy.

## 2. Environment variables

| Variable | Needed for | Notes |
|---|---|---|
| `ADMIN_PASSWORD` | Admin panel login (`/admin`) | Pick a long passphrase. |
| `GITHUB_TOKEN` | Publishing from the admin panel | Fine-grained token on this repo only, with **Contents: Read and write**. |
| `GITHUB_REPO` | Publishing from the admin panel | `HarrshPandey/MadeWithPixels` |
| `GITHUB_BRANCH` | Publishing (optional) | Defaults to `main`. |
| `RESEND_API_KEY` + `AUDIT_FROM` | Emailing audit results to visitors | Create a free Resend account, verify your domain, then use e.g. `MadeOfPixels <audit@madeofpixels.in>`. Without these the audit still works and shows results on screen. |
| `AUDIT_REPLY_TO` | Optional | Defaults to `hello@madeofpixels.in`. |
| `PSI_API_KEY` | Optional | Google PageSpeed Insights key. The audit works without it, but a key avoids Google's anonymous rate limits. |
| `GOOGLE_PLACES_API_KEY` + `GOOGLE_PLACE_ID` | "Import from Google" for reviews | Enable the **Places API (New)** in Google Cloud and find your Place ID for the Business Profile. |

## 3. Using the admin panel (`/admin`)
- **Projects, Blog, Gallery, Reviews** each have a list on the left and a form on the right.
- **Save and publish** commits the change to GitHub. Vercel rebuilds and the live site updates in about a minute.
- **Blog posts** are markdown. Untick *Published* to keep a draft hidden.
- **Gallery**: visitors who tick the permission box send their sketch to your Formspree inbox (the email shows the `gallery_ok` line and the sketch as `#` and `.` rows). To show it, add a Gallery entry, paste the rows (or click the squares), tick *Approved*, save.
- **Reviews**: add them by hand, or press *Import from Google* (needs the Places keys). Imported reviews start unpublished so you can check them first. The Reviews section stays hidden on the site until at least one review is published.

You can also edit `content/*.json` directly in GitHub; the result is the same.

## 4. Formspree autoresponder
Paste the text from `docs/autoresponder.txt` into Formspree > your form > Settings > Autoresponse. It is a dashboard setting, not code.

## 5. Uptime and error monitoring
- **UptimeRobot (free):** create an HTTP monitor for `https://madeofpixels.in/api/health` and one for `https://madeofpixels.in/` (5-minute interval) with email alerts.
- **GitHub check:** `.github/workflows/uptime.yml` requests every page in the sitemap every 30 minutes and fails (GitHub emails you) if anything breaks. Turn on failed-run notifications in GitHub notification settings.
- **Browser errors:** JavaScript errors are posted to `/api/log`. Read them in Vercel > your project > Logs and search for `client-error`.

## 6. Analytics and cookies
Google Analytics and Microsoft Clarity only load after a visitor presses *Accept* in the cookie banner. IDs live in `build/lib.js` (`SITE.ga`, `SITE.clarity`). Visitors can reopen the choice from "Cookie settings" in the footer.

## 7. Social preview images
`node build/build.js` draws a 1200x630 image for every page into `site/og/`, in the studio's pixel style. Nothing to maintain; titles come from each page.

## 8. Local development
```
node build/build.js     # regenerate site/
node build/lint.js      # SEO and integrity checks (fails on placeholders)
```
The `api/` functions need Vercel (`vercel dev`) to run locally.
