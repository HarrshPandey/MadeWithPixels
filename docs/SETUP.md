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
| `RESEND_API_KEY` + `AUDIT_FROM` | **All site emails** | Resend sends every email: contact and lightbox enquiries, pixel sketches, audit reports, and the confirmation replies to visitors. `AUDIT_FROM` is the sender, e.g. `MadeOfPixels <audit@madeofpixels.in>`, on a domain you verified in Resend. Without these, forms show an error and ask visitors to email you. |
| `AUDIT_TO` | Optional | Where those emails go. Defaults to hello@madeofpixels.in. |
| `AUDIT_REPLY_TO` | Optional | Reply-to on the confirmation emails visitors receive. Defaults to hello@madeofpixels.in. |
| `AUTORESPONSE` | Optional | Set to `off` to stop sending visitors the "We got your brief" confirmation email. |
| `PSI_API_KEY` | Optional | Google PageSpeed Insights key (see below). The audit works without it but speed results can be limited. |

## 2b. Creating the PageSpeed key (PSI_API_KEY)
1. Go to console.cloud.google.com and sign in. Create a project (e.g. MadeOfPixels).
2. Menu > APIs & Services > Library > search "PageSpeed Insights API" > Enable.
3. APIs & Services > Credentials > **+ Create credentials > API key**. If Google offers the "Help me choose" wizard that asks for user data or application data, close it and pick the plain "API key" option; the audit calls Google from our server about public web pages, so no user or application data is involved.
4. Copy the key, press "Edit API key", under API restrictions choose Restrict key > PageSpeed Insights API > Save. Leave application restrictions on None.

## 3. Using the admin panel (`/admin`)
- **Projects, Blog, Gallery, Reviews** each have a list on the left and a form on the right.
- **Save and publish** commits the change to GitHub. Vercel rebuilds and the live site updates in about a minute.
- **Blog posts** are markdown. Untick *Published* to keep a draft hidden.
- **Gallery**: visitors who tick the permission box send their sketch to your inbox (the email says whether they gave permission, shows the sketch and the # and . rows). To show it, add a Gallery entry, paste the rows (or click the squares), tick *Approved*, save.
- **Reviews**: type the reviewer's name and paste their review. Optionally upload a profile photo; if you do not, their initials are shown in a square. The Reviews section stays hidden on the site until at least one review is published.

You can also edit `content/*.json` directly in GitHub; the result is the same.

## 4. Forms and emails
There is no Formspree any more. The contact form, the contact lightbox and the pixel sketch form post to `/api/submit`, which emails you through Resend and sends the visitor a short confirmation ("We got your brief. Reply within 24 hours."). Spam is filtered with a hidden trap field and rate limits. You can delete the old Formspree form.

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
