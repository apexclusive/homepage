(function(){
  const header = document.querySelector('#nav, .topbar, body > header:not(.hero), header:not(.hero)');
  if (!header) return;

  header.dataset.scrollHeader = 'true';

  const style = document.createElement('style');
  style.textContent = '[data-scroll-header]{transition:transform .28s ease,background-color .28s ease}[data-scroll-header].is-scroll-hidden{transform:translateY(-110%)}';
  document.head.appendChild(style);

  let lastScrollY = window.scrollY;
  let ticking = false;

  function updateHeader(){
    const currentScrollY = window.scrollY;
    const delta = currentScrollY - lastScrollY;

    if (currentScrollY <= 12 || delta < -6){
      header.classList.remove('is-scroll-hidden');
    } else if (delta > 6){
      header.classList.add('is-scroll-hidden');
    }

    lastScrollY = currentScrollY;
    ticking = false;
  }

  window.addEventListener('scroll', function(){
    if (!ticking){
      window.requestAnimationFrame(updateHeader);
      ticking = true;
    }
  }, {passive:true});

  header.addEventListener('focusin', function(){
    header.classList.remove('is-scroll-hidden');
  });
})();