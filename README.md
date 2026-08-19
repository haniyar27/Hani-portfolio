# Hani Abbas — Portfolio

A static portfolio site hosted on GitHub Pages at **https://haniyar.art**.
No build step, no framework, no hosting bill — every page is plain HTML that
reads its text and media lists from `content/*.json` when it loads.

---

## 1. What's in this repo

```
index.html               → Home
experience.html          → Experience overview (timeline)
experience-detail.html   → Individual workplace page (reads ?id=slug)
creative-work.html       → Branding / Media / Experiments, filterable
certificates.html        → Certificates & Recognitions, grouped by period
contact.html             → Contact info
404.html                 → Shown for any unknown URL

content/                 → All editable text content (JSON)
images/, media/          → Photos, videos, renders
css/, js/                → Styling and site logic
dev/serve.py             → Local preview server (see §4)
CNAME                    → The custom domain, read by GitHub Pages
.nojekyll                → Tells Pages to publish files as-is, no Jekyll
```

---

## 2. How it's hosted

GitHub Pages serves the `main` branch of `haniyar27/Hani-portfolio` from the
repo root, with `CNAME` pointing it at `haniyar.art` and HTTPS enforced.

**Pushing to `main` publishes the site.** A change is live in about a minute.
Nothing else is involved — no Netlify, no build service, no deploy keys.

Check on a deploy with:

```bash
gh api repos/haniyar27/Hani-portfolio/pages/builds --jq '.[0] | {status, created_at, error: .error.message}'
```

One rule keeps this working: **internal links stay relative and keep the
`.html` extension** — `experience.html`, never `/experience` or a full
`https://…` URL. That way the site works from the domain root and from a
`github.io/repo/` subpath alike. (`404.html` is the deliberate exception —
see the comment at the top of that file.)

---

## 3. Editing content

All the words and media lists live in four JSON files. Changing one changes
the site — there's nothing to rebuild.

- **Home** → `content/site.json` — hero text and the intro story.
- **Experience** → `content/experience.json` — one entry per workplace, each
  with bullet points and optional **highlights** (a title + short story +
  media gallery).
- **Creative Work** → `content/creative-work.json` — projects tagged
  `branding`, `media`, or `experiments`. First media item = cover photo.
- **Certificates** → `content/certificates.json` — grouped on the page by
  the `period` field.

Every media item follows the same shape:

```json
{ "type": "image | video | pdf | link", "url": "...", "caption": "..." }
```

`type: "link"` is for pasted URLs — YouTube and Vimeo links auto-embed, and
anything else (LinkedIn posts, articles) gets a clean "open link" card.
Clicking any media tile opens it in a full-screen preview automatically.

Image and video URLs are repo-relative paths like
`images/creative/branding/wrwr/cover.jpg` — add the file to the repo, then
point at it from the JSON.

**Three ways to make a change:**

1. **Ask Claude Code** — hand over the text or files and they get added,
   checked, and pushed.
2. **Edit on github.com** — open any `content/*.json` file, click the pencil
   icon, edit, and commit. That commit deploys itself.
3. **Edit locally** — change the file, preview it (§4), then commit and push.

---

## 4. Previewing locally

Opening the HTML files straight off the disk won't work — the pages fetch
their JSON, which browsers block on `file://` URLs. Run the small preview
server instead:

```bash
python3 dev/serve.py
```

Then open http://127.0.0.1:4173. It deliberately behaves the way GitHub
Pages does — plain static files, no clean-URL magic, `404.html` for a miss —
so anything broken there is broken in production too.

---

## 5. Notes

The site previously ran on Netlify with a Decap CMS admin panel at `/admin`.
Both were removed on 2026-08-19 when hosting moved to GitHub Pages: the CMS
depended on Netlify Identity and Git Gateway, which only exist on Netlify.
Content editing now goes through the three routes in §3.
