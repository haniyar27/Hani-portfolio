# Hani Abbas — Portfolio

A static portfolio site with a built-in content admin, so new photos, videos,
PDFs, and text can be added without touching code.

---

## 1. What's in this folder

```
index.html              → Home
experience.html          → Experience overview (timeline)
experience-detail.html   → Individual workplace page (reads ?id=slug)
creative-work.html       → Branding / Media / Experiments, filterable
certificates.html        → Certificates & Awards, grouped by period
contact.html              → Contact info

content/                → All editable text content (JSON, edited via /admin)
images/, media/          → Photos, videos, renders already added
admin/                   → The content editor (Decap CMS)
css/, js/                → Styling and site logic — no need to touch these
```

The site has **no build step**. Every page is plain HTML that fetches its
content from the `content/*.json` files at load time. Editing those files
(directly, or through `/admin`) updates the live site immediately.

---

## 2. Put it online (Netlify, free)

1. Create a free account at **netlify.com**.
2. Push this folder to a **GitHub repository** (Netlify deploys from Git).
   - Easiest path: create a new repo on github.com, then in this folder run:
     ```
     git init
     git add .
     git commit -m "Initial portfolio"
     git branch -M main
     git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
     git push -u origin main
     ```
3. In Netlify: **Add new site → Import an existing project → GitHub** → select the repo.
   - Build command: leave blank
   - Publish directory: `.` (this repo's root)
4. Deploy. You'll get a free `yourname.netlify.app` address immediately.

## 3. Connect your real domain (~$10–12/year)

1. Buy the domain (e.g. `haniabbas.com`) from Namecheap, Google Domains, or similar.
2. In Netlify: **Site settings → Domain management → Add a custom domain** → enter it.
3. Netlify shows you 1–2 DNS records to add at your domain registrar (usually
   just changing the nameservers, or adding an A record + CNAME).
4. Free HTTPS (SSL) is issued automatically within a few minutes of DNS updating.

## 4. Turn on the content admin (`/admin`)

The admin panel needs a login system before it'll work — this is a one-time setup:

1. In Netlify: **Site settings → Identity → Enable Identity**.
2. Under Identity settings, set **Registration** to "Invite only" (so only you can log in).
3. Still in Identity settings, scroll to **Services → Git Gateway → Enable Git Gateway**.
4. Go to the **Identity** tab (top nav) → **Invite users** → invite your own email.
5. Check your email, accept the invite, set a password.
6. Visit `yourdomain.com/admin` and log in.

From then on, `/admin` is your content editor — add photos, videos, PDFs,
or links, edit any text, and hit **Publish**. Changes go live in under a minute.

> Before step 1, open `admin/config.yml` and replace `REPLACE_WITH_YOUR_DOMAIN`
> with your actual domain (or Netlify subdomain) on the `site_url` and
> `display_url` lines.

---

## 5. How content is structured (for reference)

- **Home** → `content/site.json` — hero text and the intro story.
- **Experience** → `content/experience.json` — one entry per workplace, each
  with bullet points and optional **highlights** (a title + short story +
  media gallery). This is where the MEVS and Ahli United Bank highlights live.
- **Creative Work** → `content/creative-work.json` — projects tagged
  `branding`, `media`, or `experiments`. First media item = cover photo.
- **Certificates** → `content/certificates.json` — grouped on the page by
  the `period` field.

Every media item (in Experience highlights or Creative Work) follows the
same shape:
```json
{ "type": "image | video | pdf | link", "url": "...", "caption": "..." }
```
`type: "link"` is for pasted URLs (YouTube, LinkedIn, etc.) — the site
auto-embeds YouTube/Vimeo links, and shows a clean "open link" card for
anything else (like LinkedIn posts). Clicking any media tile opens it in
a full preview window automatically — no extra setup needed per item.

---

## 6. Adding content yourself later

Through `/admin` you can, without touching code:
- Add a new workplace or edit an existing one
- Add highlight stories with photo/video galleries to any workplace
- Add Creative Work projects (branding, media, experiments) with cover images
- Add certificates/awards
- Upload photos, videos, or PDFs directly, or paste external links

If you'd rather hand me new content in chat like we've been doing, that
works too — just send me the files/text and I'll update the JSON directly.
