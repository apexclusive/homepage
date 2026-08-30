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
  const aiLauncher = document.getElementById('ai-launcher');
  const aiPanel = document.getElementById('ai-panel');
  const aiForm = document.getElementById('ai-form');
  const aiInput = document.getElementById('ai-input');
  const aiMessages = document.getElementById('ai-messages');
  let aiHistory = [];
  function addAiMessage(text, role) { const node=document.createElement('div'); node.className=`ai-message ai-${role}`; node.textContent=text; aiMessages.appendChild(node); aiMessages.scrollTop=aiMessages.scrollHeight; }
  if (aiLauncher && aiPanel) {
    const toggleAi = () => { const open=aiPanel.hidden; aiPanel.hidden=!open; aiLauncher.setAttribute('aria-expanded',String(open)); if(open) aiInput?.focus(); };
    aiLauncher.addEventListener('click',toggleAi); aiPanel.querySelector('.ai-close').addEventListener('click',toggleAi);
    aiPanel.querySelectorAll('.ai-quick button').forEach(btn=>btn.addEventListener('click',()=>{aiInput.value=btn.textContent;aiForm.requestSubmit();}));
    aiForm.addEventListener('submit',async event=>{event.preventDefault();const question=aiInput.value.trim();if(!question)return;aiInput.value='';addAiMessage(question,'user');aiHistory.push({role:'user',content:question});const submit=aiForm.querySelector('button');submit.disabled=true;try{const response=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({brand:'apex',messages:aiHistory.slice(-12)})});const data=await response.json();const answer=data.reply||data.error||'Er ging iets mis. Neem gerust rechtstreeks contact op.';addAiMessage(answer,'bot');aiHistory.push({role:'assistant',content:answer});}catch(_){addAiMessage('De adviseur is tijdelijk niet bereikbaar. U kunt ons ook direct WhatsAppen.','bot');}finally{submit.disabled=false;}});
  }

  const intro = document.getElementById('site-intro');
  if (intro) {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const dismiss = () => { intro.classList.add('is-done'); window.setTimeout(() => intro.remove(), 550); };
    if (reduce) dismiss(); else window.setTimeout(dismiss, 850);
  }

  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
})();
