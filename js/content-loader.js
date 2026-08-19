/* ============================================================
   Fetches content from content/*.json and renders it into the
   page. Each section is a single JSON file holding a list, so
   editing that file — locally or straight on github.com — is
   all it takes to change the site; there is no build step.
   ============================================================ */

function fmtRange(start, end){
  if (!start) return '';
  return end ? `${start} – ${end}` : `${start} – Present`;
}

async function loadJson(path, fallback){
  try{
    const res = await fetch(path, { cache: 'no-store' });
    if (!res.ok) throw new Error(res.status);
    return await res.json();
  }catch(e){
    console.warn(`Could not load ${path}`, e);
    return fallback;
  }
}

// list-based content files are stored as { "items": [...] }
// rather than a raw array at the file root.
async function loadList(path){
  const data = await loadJson(path, { items: [] });
  return Array.isArray(data) ? data : (data.items || []);
}

function hostOf(url){
  try { return new URL(url).hostname.replace('www.',''); } catch(e){ return ''; }
}

/* an external link is labelled by where it goes — "Watch" for a video
   host, the network's name otherwise. */
function linkLabel(url){
  const h = hostOf(url);
  if (/youtu\.be|youtube\.com|vimeo\.com/.test(h)) return 'Watch';
  if (/instagram\.com/.test(h)) return 'Instagram';
  if (/linkedin\.com/.test(h)) return 'LinkedIn';
  return 'Link';
}

function tagFor(item){
  if (item.type === 'link') return linkLabel(item.url);
  return { image:'Photo', video:'Video', pdf:'PDF' }[item.type] || 'Media';
}

function mediaTile(item){
  const tagLabel = tagFor(item);
  // entity-encode the payload: a caption containing an apostrophe would
  // otherwise close the attribute and swallow the rest of the tile
  const call = `openMedia(${JSON.stringify(item).replace(/"/g, '&quot;')})`;
  if (item.type === 'image') {
    return `<div class="media-tile" onclick="${call}">
      <span class="tag">${tagLabel}</span><img src="${item.url}" alt="${item.caption||''}" loading="lazy">
    </div>`;
  }
  if (item.type === 'video') {
    return `<div class="media-tile" onclick="${call}">
      <span class="tag">${tagLabel}</span><video src="${item.url}" muted preload="metadata"></video>
    </div>`;
  }
  // a link can carry its own preview image; without one it falls back to
  // a card naming the destination
  if (item.thumb) {
    return `<div class="media-tile" onclick="${call}">
      <span class="tag">${tagLabel}</span>
      <img src="${item.thumb}" alt="${item.caption||''}" loading="lazy" onerror="this.style.display='none'">
    </div>`;
  }
  return `<div class="media-tile link-tile" onclick="${call}">
    <span class="tag">${tagLabel}</span>
    <span class="domain">${hostOf(item.url) || item.type.toUpperCase()}</span>
    <span class="title">${item.caption || 'View'}</span>
  </div>`;
}

/* ---------------- HOME ---------------- */
async function renderHome(){
  const el = document.getElementById('intro-copy');
  if (!el) return;
  const site = await loadJson('content/site.json', null);
  if (!site) return;
  el.innerHTML = site.intro.split('\n\n').map(p => `<p>${p}</p>`).join('');
  const hi = document.getElementById('hero-hi'); if (hi) hi.textContent = site.heroHi || 'Welcome';
  const t = document.getElementById('hero-title'); if (t) t.innerHTML = site.heroTitle || '';
  const r = document.getElementById('hero-role'); if (r) r.textContent = site.role || '';
  const b = document.getElementById('hero-blurb'); if (b) b.textContent = site.heroBlurb || '';
}

/* ---------------- EXPERIENCE OVERVIEW ---------------- */
async function renderExperienceList(){
  const el = document.getElementById('timeline');
  if (!el) return;
  const rows = await loadList('content/experience.json');
  if (!rows.length){ el.innerHTML = emptyState('No experience entries yet.'); return; }
  const sorted = [...rows].sort((a,b)=> (b.order||0) - (a.order||0));
  el.innerHTML = sorted.map(r => `
    <a class="timeline-row" href="experience-detail.html?id=${r.slug}">
      <div class="timeline-dates">${fmtRange(r.startDate, r.endDate)}</div>
      <div class="timeline-main">
        <h3>${r.company}</h3>
        <div class="role">${r.role}</div>
      </div>
      <div class="timeline-arrow">→</div>
    </a>`).join('');
}

/* ---------------- EXPERIENCE DETAIL ---------------- */
async function renderExperienceDetail(){
  const el = document.getElementById('detail-root');
  if (!el) return;
  const id = new URLSearchParams(location.search).get('id');
  const rows = await loadList('content/experience.json');
  const item = rows.find(r => r.slug === id) || rows[0];
  if (!item){ el.innerHTML = emptyState('Entry not found.'); return; }

  document.title = `${item.company} — Hani Abbas`;
  let html = `
    <div class="detail-header">
      <div class="company">${item.company} — ${fmtRange(item.startDate, item.endDate)}</div>
      <h1>${item.role}</h1>
    </div>
    <ul class="bullet-list">${(item.bullets||[]).map(b=>`<li>${b}</li>`).join('')}</ul>
  `;

  (item.highlights||[]).forEach(h => {
    html += `
      <div class="highlight-block">
        <div class="h-label">Highlight</div>
        <h3>${h.title}</h3>
        ${h.points && h.points.length ? `<ul class="h-points">${h.points.map(p=>`<li>${p}</li>`).join('')}</ul>` : ''}
        <div class="h-story">${(h.story||'').split('\n\n').map(p=>`<p>${p}</p>`).join('')}</div>
        ${h.media && h.media.length ? `<div class="media-strip">${h.media.map(mediaTile).join('')}</div>` : ''}
      </div>`;
  });

  el.innerHTML = html;
}

/* ---------------- CREATIVE WORK ---------------- */
let allProjects = [];
async function renderCreativeWork(){
  const grid = document.getElementById('project-grid');
  if (!grid) return;
  allProjects = await loadList('content/creative-work.json');
  if (!allProjects.length){ grid.innerHTML = emptyState('No projects yet.'); return; }
  // explicit `order` drives the sequence (higher shows first); year is
  // only the tie-break, so a project can be moved without faking its date
  allProjects.sort((a,b)=> ((b.order||0) - (a.order||0)) || ((b.year||0) - (a.year||0)));
  paintProjects('all');

  document.querySelectorAll('.filter-btn').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      document.querySelectorAll('.filter-btn').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      paintProjects(btn.dataset.filter);
    });
  });
}
function paintProjects(filter){
  const grid = document.getElementById('project-grid');
  const list = filter === 'all' ? allProjects : allProjects.filter(p => p.category === filter);
  if (!list.length){ grid.innerHTML = emptyState('Nothing in this category yet.'); return; }
  grid.innerHTML = list.map(p => {
    const cover = (p.media && p.media[0]) || null;
    const thumb = cover
      ? (cover.type === 'video'
          ? `<video src="${cover.url}" muted preload="metadata"></video>`
          : (cover.type === 'image' || cover.thumb)
            ? `<img src="${cover.thumb || cover.url}" alt="${p.title}" loading="lazy">`
            : `<div class="link-tile" style="height:100%;justify-content:center;align-items:center;"><span class="tag">${tagFor(cover)}</span></div>`)
      : '';
    return `
      <div class="project-card">
        <div class="thumb" onclick='openProject(${JSON.stringify(p.slug)})'>${thumb}</div>
        <div class="body">
          <div class="cat">${labelFor(p.category)}${p.year ? ' — ' + p.year : ''}</div>
          <h3>${p.title}</h3>
          <p>${p.description || ''}</p>
        </div>
      </div>`;
  }).join('');
}
function labelFor(cat){
  return { branding:'Branding & Identity', media:'Media', experiments:'Experiments' }[cat] || cat;
}
/* What a contact-sheet cell shows. A link points at another site, so it
   has no file to display — it shows its own thumb, or a card naming the
   destination, never a broken <img>. */
function galleryThumbFace(item, fallbackTitle){
  const alt = item.caption || fallbackTitle;
  if (item.type === 'video') return `<video src="${item.url}" muted preload="metadata"></video>`;
  if (item.type === 'link' || item.type === 'pdf') {
    const label = tagFor(item);
    // the preview is usually the project's own artwork, so the badge is what
    // tells a viewer this cell leaves the site rather than opening a picture
    if (item.thumb) {
      return `<span class="thumb-badge">${label === 'Watch' ? '▶ ' : ''}${label}</span>
        <img src="${item.thumb}" alt="${alt}" loading="lazy" onerror="this.style.display='none'">`;
    }
    return `<span class="thumb-link">
      <span class="domain">${hostOf(item.url) || item.type.toUpperCase()}</span>
      <span class="title">${alt}</span>
    </span>`;
  }
  return `<img src="${item.url}" alt="${alt}" loading="lazy">`;
}

/* A project opens as a contact sheet of everything in it; picking a frame
   hands off to the lightbox, which already knows how to page through the
   same list. */
function openProject(slug){
  const p = allProjects.find(x=>x.slug===slug);
  if (!p || !p.media || !p.media.length) return;

  let sheet = document.querySelector('.gallery-view');
  if (!sheet) {
    sheet = document.createElement('div');
    sheet.className = 'gallery-view';
    document.body.appendChild(sheet);
    sheet.addEventListener('click', (e) => {
      if (e.target === sheet || e.target.closest('.gallery-close')) closeProject();
    });
    // capture phase: this has to decide before the lightbox's own Escape
    // handler runs, otherwise the lightbox is already closed by the time we
    // look and a single Escape collapses both layers at once
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape' || !sheet.classList.contains('open')) return;
      if (document.querySelector('.lightbox.open')) return;   // lightbox closes first
      closeProject();
    }, true);
  }

  sheet.innerHTML = `
    <button class="gallery-close" aria-label="Close gallery">&times;</button>
    <div class="gallery-inner">
      <div class="gallery-head">
        <div class="cat">${labelFor(p.category)}${p.year ? ' — ' + p.year : ''}</div>
        <h2>${p.title}</h2>
        ${p.description ? `<p>${p.description}</p>` : ''}
        <div class="gallery-count">${p.media.length} ${p.media.length === 1 ? 'frame' : 'frames'}</div>
      </div>
      <div class="gallery-grid">
        ${p.media.map((mItem, i) => `
          <button class="gallery-thumb" type="button" aria-label="${mItem.caption || p.title}"
                  onclick="openGallery(${JSON.stringify(p.media).replace(/"/g, '&quot;')}, ${i})">
            ${galleryThumbFace(mItem, p.title)}
          </button>`).join('')}
      </div>
    </div>`;

  document.body.classList.add('menu-open');
  requestAnimationFrame(() => sheet.classList.add('open'));
}

function closeProject(){
  const sheet = document.querySelector('.gallery-view');
  if (!sheet) return;
  sheet.classList.remove('open');
  document.body.classList.remove('menu-open');
}
window.openProject = openProject;
window.closeProject = closeProject;

/* ---------------- CERTIFICATES ---------------- */
async function renderCertificates(){
  const el = document.getElementById('cert-root');
  if (!el) return;
  const rows = await loadList('content/certificates.json');
  if (!rows.length){ el.innerHTML = emptyState('No certificates yet.'); return; }
  const sorted = [...rows].sort((a,b)=> (b.year||0) - (a.year||0));

  // a plain object would reorder integer-like keys ("2015", "2021") into
  // ascending numeric order and undo the newest-first sort above
  const groups = new Map();
  sorted.forEach(r => {
    const key = r.period || String(r.year || 'Undated');
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(r);
  });

  // year groups first, newest down; named groups such as "Community" after
  const ordered = [...groups].sort((a, b) => {
    const na = /^\d{4}$/.test(a[0]), nb = /^\d{4}$/.test(b[0]);
    if (na && nb) return Number(b[0]) - Number(a[0]);
    return na ? -1 : nb ? 1 : 0;
  });

  el.innerHTML = ordered.map(([period, items]) => `
    <div class="cert-period">
      <div class="period-label">${period}</div>
      ${items.map(c => `
        <div class="cert-row">
          <div>
            <h3>${c.title}</h3>
            <div class="issuer">${c.issuer || ''}</div>
            ${c.note ? `<p class="cert-note">${c.note}</p>` : ''}
            ${c.link ? `<a class="cert-verify" href="${c.link}" target="_blank" rel="noopener">Verify credential ↗</a>` : ''}
            ${certShots(c)}
          </div>
          <div class="year">${c.year || ''}</div>
        </div>`).join('')}
    </div>`).join('');
}


/* one or many photos on a certificate / recognition */
function certPhotos(c){
  if (Array.isArray(c.photos) && c.photos.length) return c.photos;
  if (c.image) return [{ url: c.image, caption: c.imageCaption || '' }];
  return [];
}
function certShots(c){
  const shots = certPhotos(c);
  if (!shots.length) return '';
  return `<div class="cert-shots">${shots.map(p => {
    const item = { type: 'image', url: p.url, caption: p.caption || c.title };
    return `<button class="cert-shot" type="button" aria-label="${p.caption || c.title}"
        onclick="openMedia(${JSON.stringify(item).replace(/"/g, '&quot;')})">
        <img src="${p.url}" alt="${p.caption || c.title}" loading="lazy">
      </button>`;
  }).join('')}</div>`;
}

/* ---------------- helpers ---------------- */
function emptyState(msg){ return `<div class="empty-state">${msg}</div>`; }

document.addEventListener('DOMContentLoaded', () => {
  renderHome();
  renderExperienceList();
  renderExperienceDetail();
  renderCreativeWork();
  renderCertificates();
});
