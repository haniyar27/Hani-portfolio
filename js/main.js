/* ============================================================
   Shared behavior: nav toggle + universal media lightbox.
   The lightbox auto-detects media type so any content added
   through the admin (image / video / pdf / external link)
   gets a working preview window with zero extra setup.
   ============================================================ */

// ---- mobile nav toggle ----
document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', () => links.classList.toggle('open'));
    links.querySelectorAll('a').forEach(a => a.addEventListener('click', () => links.classList.remove('open')));
  }

  // mark active nav link
  const norm = p => p.replace(/\.html$/, '').replace(/\/$/, '') || '/';
  const path = norm(location.pathname);
  document.querySelectorAll('.nav-links a').forEach(a => {
    if (norm(a.getAttribute('href')) === path) a.classList.add('active');
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
    <div class="lightbox-inner"></div>
  `;
  document.body.appendChild(lb);
  lb.addEventListener('click', (e) => { if (e.target === lb) closeLightbox(); });
  lb.querySelector('.lightbox-close').addEventListener('click', closeLightbox);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeLightbox(); });
}

function closeLightbox(){
  const lb = document.querySelector('.lightbox');
  if (!lb) return;
  lb.classList.remove('open');
  lb.querySelector('.lightbox-inner').innerHTML = '';
}

/**
 * openMedia(item) — item: { type: 'image'|'video'|'pdf'|'link', url, caption, embed }
 * 'link' items with a youtube/vimeo URL get an auto iframe embed;
 * other links open a simple preview card with an "open" action.
 */
function openMedia(item){
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
        <div style="background:var(--blueprint); padding:48px; text-align:center; max-width:520px; margin:0 auto;">
          <div style="font-family:var(--font-mono); font-size:12px; color:var(--brass); text-transform:uppercase; margin-bottom:14px;">External link</div>
          <p style="color:var(--canvas); margin-bottom:24px;">${item.caption || item.url}</p>
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
