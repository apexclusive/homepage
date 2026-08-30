(() => {
  'use strict';
  const header = document.getElementById('site-header');
  const menuButton = document.querySelector('.menu-button');
  const menu = document.getElementById('mobile-menu');
  const progress = document.getElementById('site-progress');
  let lastY = window.scrollY;

  function closeMenu() {
    if (!menu || !menuButton) return;
    menu.hidden = true;
    menuButton.classList.remove('open');
    menuButton.setAttribute('aria-expanded', 'false');
  }
  if (menuButton && menu) {
    menuButton.addEventListener('click', () => {
      const open = menu.hidden;
      menu.hidden = !open;
      menuButton.classList.toggle('open', open);
      menuButton.setAttribute('aria-expanded', String(open));
      if (open) menu.querySelector('a')?.focus();
    });
    menu.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') { closeMenu(); menuButton.focus(); }
    });
  }

  function onScroll() {
    const y = window.scrollY;
    const range = document.documentElement.scrollHeight - window.innerHeight;
    if (progress && range > 0) progress.style.transform = `scaleX(${Math.min(1, y / range)})`;
    if (header && y > 100 && y > lastY + 8) header.classList.add('is-hidden');
    if (header && y < lastY - 8) header.classList.remove('is-hidden');
    if (header && y < 24) header.classList.remove('is-hidden');
    lastY = y;
  }
  window.addEventListener('scroll', onScroll, { passive: true });

  const form = document.getElementById('lead-form');
  if (form) form.addEventListener('submit', async event => {
    event.preventDefault();
    const status = document.getElementById('lead-form-status');
    const submit = form.querySelector('button[type="submit"]');
    const data = new FormData(form);
    if (data.get('website')) return;
    if (!form.reportValidity()) { status.textContent = 'Vul uw naam, e-mailadres en wensen in.'; return; }
    const values = {
      name: String(data.get('name') || '').trim(),
      email: String(data.get('email') || '').trim(),
      phone: String(data.get('phone') || '').trim(),
      request: String(data.get('request') || '').trim(),
      website: '', brand: 'apex'
    };
    submit.disabled = true; form.setAttribute('aria-busy', 'true'); status.textContent = 'Aanvraag wordt verzonden…';
    const fallback = `mailto:info@apexclusive.nl?subject=${encodeURIComponent('Nieuwe aanvraag via APEXclusive')}&body=${encodeURIComponent(`Naam: ${values.name}\nE-mail: ${values.email}\nTelefoon: ${values.phone || '-'}\n\nAanvraag:\n${values.request}`)}`;
    try {
      const response = await fetch('/api/apex-lead', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(values) });
      if (!response.ok) throw new Error('send failed');
      form.reset(); status.textContent = 'Bedankt. Uw aanvraag is ontvangen. We nemen binnen 24 uur contact op.';
      window.apexTrack?.('lead_form_submit');
    } catch (_) {
      status.textContent = 'Uw e-mailprogramma wordt geopend…';
      window.location.href = fallback;
    } finally { submit.disabled = false; form.removeAttribute('aria-busy'); }
  });
  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
})();
