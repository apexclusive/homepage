/* APEXclusive · Deel-component (word-of-mouth).
   Activeert elke knop met [data-share]. Gebruikt de Web Share API waar beschikbaar,
   anders WhatsApp. Een aparte [data-share-copy] knop kopieert de URL naar het klembord. */
(() => {
  'use strict';

  const pageUrl = () => location.href.split('#')[0];

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).then(() => true).catch(() => false);
    }
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      ta.remove();
      return Promise.resolve(ok);
    } catch (e) {
      return Promise.resolve(false);
    }
  }

  function ensureLiveRegion() {
    let region = document.getElementById('share-live');
    if (region) return region;
    region = document.createElement('div');
    region.id = 'share-live';
    region.setAttribute('role', 'status');
    region.setAttribute('aria-live', 'polite');
    region.style.cssText = 'position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0';
    document.body.appendChild(region);
    return region;
  }

  function feedback(el, msg) {
    const original = el.innerHTML;
    el.classList.add('is-shared');
    el.textContent = msg;
    ensureLiveRegion().textContent = msg;
    setTimeout(() => { el.innerHTML = original; el.classList.remove('is-shared'); }, 2200);
  }

  document.querySelectorAll('[data-share]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const title = btn.getAttribute('data-share-title') || document.title;
      const text = btn.getAttribute('data-share-text') || '';
      const url = btn.getAttribute('data-share-url') || pageUrl();
      const shareData = { title, text, url };

      if (navigator.share) {
        try {
          await navigator.share(shareData);
          return;
        } catch (e) {
          if (e && e.name === 'AbortError') return;
          // val door naar WhatsApp-fallback
        }
      }

      const wa = 'https://wa.me/?text=' + encodeURIComponent(title + '\n' + text + '\n' + url);
      window.open(wa, '_blank', 'noopener,noreferrer');
    });
  });

  document.querySelectorAll('[data-share-copy]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const url = btn.getAttribute('data-share-url') || pageUrl();
      const ok = await copyText(url);
      feedback(btn, ok ? '✓ Link gekopieerd' : 'Kopiëren mislukt');
    });
  });
})();
