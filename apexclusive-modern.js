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
    window.addEventListener('resize', () => { if (window.innerWidth > 860) closeMenu(); }, { passive: true });
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

  const aiLauncher = document.getElementById('ai-launcher');
  const aiPanel = document.getElementById('ai-panel');
  const aiForm = document.getElementById('ai-form');
  const aiInput = document.getElementById('ai-input');
  const aiMessages = document.getElementById('ai-messages');
  let aiHistory = [];
  let aiTypingEl = null;
  function escapeHtml(value) { return String(value).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c])); }
  function formatBot(text) {
    return escapeHtml(text)
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/(^|\s)\*([^*\n]+)\*/g, '$1<em>$2</em>');
  }
  function addAiMessage(text, role) {
    const node = document.createElement('div');
    node.className = `ai-message ai-${role}`;
    if (role === 'bot') node.innerHTML = formatBot(text); else node.textContent = text;
    aiMessages.appendChild(node);
    aiMessages.scrollTop = aiMessages.scrollHeight;
  }
  function showAiTyping() {
    if (aiTypingEl) return;
    aiTypingEl = document.createElement('div');
    aiTypingEl.className = 'ai-message ai-bot ai-typing';
    aiTypingEl.textContent = '…';
    aiMessages.appendChild(aiTypingEl);
    aiMessages.scrollTop = aiMessages.scrollHeight;
  }
  function hideAiTyping() { if (aiTypingEl) { aiTypingEl.remove(); aiTypingEl = null; } }
  if (aiLauncher && aiPanel) {
    // Focus-trap: houd de tab-volgorde binnen het chatpaneel zolang het open is.
    function trapAiFocus(event) {
      if (aiPanel.hidden) return;
      if (event.key !== 'Tab') return;
      const focusables = aiPanel.querySelectorAll('button, input, [href], [tabindex]:not([tabindex="-1"])');
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    const toggleAi = () => {
      const open = aiPanel.hidden;
      aiPanel.hidden = !open;
      aiLauncher.setAttribute('aria-expanded', String(open));
      if (open) { aiInput?.focus(); document.addEventListener('keydown', trapAiFocus); }
      else document.removeEventListener('keydown', trapAiFocus);
    };
    aiLauncher.addEventListener('click', toggleAi);
    aiPanel.querySelector('.ai-close').addEventListener('click', toggleAi);
    aiPanel.querySelectorAll('.ai-quick button').forEach(btn=>btn.addEventListener('click',()=>{aiInput.value=btn.textContent;aiForm.requestSubmit();}));
    aiForm.addEventListener('submit',async event=>{
      event.preventDefault();
      const question=aiInput.value.trim(); if(!question) return;
      aiInput.value=''; addAiMessage(question,'user'); aiHistory.push({role:'user',content:question});
      const submit=aiForm.querySelector('button'); submit.disabled=true; showAiTyping();
      try{
        const response=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({brand:'apex',messages:aiHistory.slice(-12)})});
        const data=await response.json();
        const answer=data.reply||data.error||'Er ging iets mis. Neem gerust rechtstreeks contact op.';
        addAiMessage(answer,'bot'); aiHistory.push({role:'assistant',content:answer});
      }catch(_){ addAiMessage('De adviseur is tijdelijk niet bereikbaar. U kunt ons ook direct WhatsAppen.','bot'); }
      finally{ hideAiTyping(); submit.disabled=false; }
    });
  }
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && aiPanel && !aiPanel.hidden) {
      aiPanel.hidden = true;
      aiLauncher?.setAttribute('aria-expanded', 'false');
      aiLauncher?.focus();
    }
  });

  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  // Scrollspy: markeer de actieve sectie in de hoofdnavigatie.
  if ('IntersectionObserver' in window) {
    const spyLinks = document.querySelectorAll('.desktop-nav a[href^="#"]');
    if (spyLinks.length) {
      const spySections = ['diensten', 'werkwijze', 'aanbod', 'cases', 'tools', 'over', 'investering'];
      const setActive = id => {
        spyLinks.forEach(link => {
          const active = link.getAttribute('href') === '#' + id;
          link.classList.toggle('active', active);
          if (active) link.setAttribute('aria-current', 'true');
          else link.removeAttribute('aria-current');
        });
      };
      const spyObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) setActive(entry.target.id);
        });
      }, { rootMargin: '-35% 0px -60% 0px' });
      spySections.forEach(id => {
        const section = document.getElementById(id);
        if (section) spyObserver.observe(section);
      });
    }
  }
})();
