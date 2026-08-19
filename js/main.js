/* ============================================================
   Shared behavior: nav toggle + universal media lightbox.
   The lightbox auto-detects media type, so any item added to
   content/*.json (image / video / pdf / external link) gets a
   working preview window with zero extra setup.
   ============================================================ */

// ---- mobile nav ----
document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');

  if (toggle && links) {
    const setMenu = (open) => {
      links.classList.toggle('open', open);
      document.body.classList.toggle('menu-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    };
    toggle.addEventListener('click', () => setMenu(!links.classList.contains('open')));
    links.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setMenu(false)));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && links.classList.contains('open')) { setMenu(false); toggle.focus(); }
    });
    // never leave the sheet stranded when resizing up to desktop
    window.addEventListener('resize', () => {
      if (window.innerWidth > 900 && links.classList.contains('open')) setMenu(false);
    });
  }

  // mark active nav link — compare page names only, so the links stay
  // relative and keep matching whether the site is served from a domain
  // root or a GitHub Pages subpath
  const pageName = p => (p.split(/[?#]/)[0].split('/').pop() || '').replace(/\.html$/, '') || 'index';
  const here = pageName(location.pathname);
  document.querySelectorAll('.nav-links a').forEach(a => {
    const href = a.getAttribute('href') || '';
    if (/^[a-z]+:|^\/\//i.test(href)) return;   // leave external links alone
    if (pageName(href) === here) a.classList.add('active');
  });

  buildLightbox();
});

// ---- lightbox ----
function buildLightbox(){
  if (document.querySelector('.lightbox')) return;
  const lb = document.createElement('div');
  lb.className = 'lightbox';
  lb.innerHTML = `
    <button class="lightbox-close" aria-label="Close preview">&times;</button>
    <button class="lightbox-nav prev" aria-label="Previous">&#8249;</button>
    <button class="lightbox-nav next" aria-label="Next">&#8250;</button>
    <div class="lightbox-count"></div>
    <div class="lightbox-inner"></div>
  `;
  document.body.appendChild(lb);
  lb.addEventListener('click', (e) => { if (e.target === lb) closeLightbox(); });
  lb.querySelector('.lightbox-close').addEventListener('click', closeLightbox);
  lb.querySelector('.prev').addEventListener('click', (e) => { e.stopPropagation(); step(-1); });
  lb.querySelector('.next').addEventListener('click', (e) => { e.stopPropagation(); step(1); });
  document.addEventListener('keydown', (e) => {
    if (!lb.classList.contains('open')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') step(-1);
    if (e.key === 'ArrowRight') step(1);
  });
}

function closeLightbox(){
  const lb = document.querySelector('.lightbox');
  if (!lb) return;
  lb.classList.remove('open');
  lb.querySelector('.lightbox-inner').innerHTML = '';
  gallery = [];
}

/* ---- gallery state ----
   One item and many items go through the same path; the nav only shows
   itself once there is somewhere to go. */
let gallery = [], galleryAt = 0;

function openGallery(items, start){
  gallery = (items || []).filter(Boolean);
  if (!gallery.length) return;
  galleryAt = Math.max(0, Math.min(start || 0, gallery.length - 1));
  paintGallery();
}

function step(delta){
  if (gallery.length < 2) return;
  galleryAt = (galleryAt + delta + gallery.length) % gallery.length;
  paintGallery();
}

function paintGallery(){
  renderMedia(gallery[galleryAt]);
  const lb = document.querySelector('.lightbox');
  const many = gallery.length > 1;
  lb.querySelectorAll('.lightbox-nav').forEach(b => b.style.display = many ? 'grid' : 'none');
  const count = lb.querySelector('.lightbox-count');
  count.style.display = many ? 'block' : 'none';
  count.textContent = `${galleryAt + 1} / ${gallery.length}`;
}
window.openGallery = openGallery;

/**
 * openMedia(item) — item: { type: 'image'|'video'|'pdf'|'link', url, caption, embed }
 * 'link' items with a youtube/vimeo URL get an auto iframe embed;
 * other links open a simple preview card with an "open" action.
 */
function openMedia(item){
  openGallery([item], 0);
}

function renderMedia(item){
  buildLightbox();
  const lb = document.querySelector('.lightbox');
  const inner = lb.querySelector('.lightbox-inner');
  inner.innerHTML = '';

  const cap = item.caption ? `<div class="lightbox-caption">${item.caption}</div>` : '';

  if (item.type === 'image') {
    inner.innerHTML = `<img src="${item.url}" alt="${item.caption || ''}">${cap}`;
  } else if (item.type === 'video') {
    inner.innerHTML = `<video src="${item.url}" controls autoplay playsinline></video>${cap}`;
  } else if (item.type === 'pdf') {
    inner.innerHTML = `<iframe src="${item.url}" title="${item.caption || 'Document preview'}"></iframe>${cap}`;
  } else if (item.type === 'link') {
    const embed = youtubeEmbed(item.url) || vimeoEmbed(item.url);
    if (embed) {
      inner.innerHTML = `<iframe src="${embed}" title="${item.caption || 'Video'}" allow="autoplay; encrypted-media" allowfullscreen></iframe>${cap}`;
    } else {
      inner.innerHTML = `
        <div class="link-card">
          <div class="link-card-label">External link</div>
          <p>${item.caption || item.url}</p>
          <a class="btn btn-solid" href="${item.url}" target="_blank" rel="noopener">Open link ↗</a>
        </div>`;
    }
  }
  lb.classList.add('open');
}

function youtubeEmbed(url){
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([\w-]{6,})/);
  return m ? `https://www.youtube.com/embed/${m[1]}` : null;
}
function vimeoEmbed(url){
  const m = url.match(/vimeo\.com\/(\d+)/);
  return m ? `https://player.vimeo.com/video/${m[1]}` : null;
}

// expose for inline onclick usage from dynamically rendered content
window.openMedia = openMedia;
