/**
 * Funnel-events voor apexclusive.nl
 *
 * index.html verwees al naar dit bestand, maar het bestond niet (404). Dit is
 * een bewust minimale implementatie: er worden GEEN gegevens naar derden
 * gestuurd en er wordt niets over de bezoeker opgeslagen. Events worden alleen
 * op window.dataLayer gezet, de standaard die Google Tag Manager en de meeste
 * analytics-tools uitlezen.
 *
 * Zit er nog geen analytics op de site, dan gebeurt er functioneel niets en
 * kun je later een tool aansluiten zonder de HTML aan te passen.
 *
 * Meelezen tijdens ontwikkelen: zet ?apexdebug=1 in de URL, dan logt elk
 * event naar de console.
 */
(function () {
  'use strict';

  var DEBUG = /[?&]apexdebug=1\b/.test(location.search);

  window.dataLayer = window.dataLayer || [];

  function track(event, detail) {
    var payload = Object.assign({ event: 'apex_' + event }, detail || {});
    try {
      window.dataLayer.push(payload);
    } catch (e) {
      /* dataLayer kan door een extensie geblokkeerd zijn; nooit de pagina breken */
    }
    if (DEBUG && window.console) console.log('[apex-funnel]', payload);
  }

  // Publiek maken zodat andere scripts events kunnen sturen.
  window.apexTrack = track;

  function label(el) {
    return (el.getAttribute('aria-label') || el.textContent || '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 80);
  }

  document.addEventListener(
    'click',
    function (e) {
      var el = e.target instanceof Element ? e.target.closest('a,button') : null;
      if (!el) return;

      // WhatsApp
      if (el.matches('a[href*="wa.me"]')) {
        return track('whatsapp_click', { placement: el.className || 'onbekend' });
      }
      // E-mail
      if (el.matches('a[href^="mailto:"]')) {
        return track('email_click', { placement: el.className || 'onbekend' });
      }
      // Externe tools op de subdomeinen
      if (el.matches('a[href*=".apexclusive.nl"]')) {
        return track('tool_click', { tool: label(el), href: el.getAttribute('href') });
      }
      // Interne planners en briefs
      if (el.matches('a[href$="-planner.html"],a[href$="sourcing-brief.html"]')) {
        return track('tool_click', { tool: label(el), href: el.getAttribute('href') });
      }
      // Aanbod
      if (el.matches('a[href$="aanbod-urus.html"]')) {
        return track('offer_view_click', { label: label(el) });
      }
      // Marktplaats / AutoScout24
      if (el.matches('.market-link')) {
        return track('marketplace_click', { label: label(el) });
      }
      // Chat openen
      if (el.matches('#apex-chat-launcher')) {
        return track('chat_open');
      }
    },
    { passive: true, capture: true }
  );

  // Formulierinzendingen: alleen dát er verzonden is, nooit de inhoud.
  document.addEventListener(
    'submit',
    function (e) {
      var form = e.target;
      if (!(form instanceof HTMLFormElement)) return;
      if (form.id === 'lead-form') return track('lead_form_submit');
      if (form.id === 'brief-form') return track('sourcing_brief_submit');
    },
    { capture: true }
  );

  // Hoe diep leest iemand? Eenmalig per drempel, geen timers.
  var thresholds = [25, 50, 75, 100];
  var reached = {};
  var queued = false;

  function checkDepth() {
    queued = false;
    var doc = document.documentElement;
    var range = doc.scrollHeight - window.innerHeight;
    if (range <= 0) return;
    var pct = Math.min(100, Math.round((window.scrollY / range) * 100));
    for (var i = 0; i < thresholds.length; i++) {
      var t = thresholds[i];
      if (pct >= t && !reached[t]) {
        reached[t] = true;
        track('scroll_depth', { percent: t });
      }
    }
    if (reached[100]) window.removeEventListener('scroll', onScroll);
  }

  function onScroll() {
    if (!queued) {
      queued = true;
      requestAnimationFrame(checkDepth);
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });

  track('page_view', { path: location.pathname });
})();
