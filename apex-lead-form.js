/**
 * Leadformulieren — gedeeld door homepage en dienstpagina's.
 * Bindt elk <form class="lead-form">; stuurt naar /api/apex-lead en valt
 * bij een storing terug op mailto, zodat een aanvraag nooit verloren gaat.
 */
(function () {
  'use strict';

  document.querySelectorAll('form.lead-form').forEach(function (form) {
    form.addEventListener('submit', async function (event) {
      event.preventDefault();
      const status = form.querySelector('.form-status');
      const submit = form.querySelector('button[type="submit"]');
      if (!status) return;

      const data = new FormData(form);
      // Honeypot: bots vullen het verborgen veld 'website' vaak wel in.
      if (data.get('website')) return;

      if (!form.reportValidity()) {
        status.textContent = 'Vul uw naam, e-mailadres en wensen in.';
        return;
      }

      const values = {
        name: String(data.get('name') || '').trim(),
        email: String(data.get('email') || '').trim(),
        phone: String(data.get('phone') || '').trim(),
        request: String(data.get('request') || '').trim(),
        website: '',
        brand: 'apex'
      };

      submit.disabled = true;
      form.setAttribute('aria-busy', 'true');
      status.textContent = 'Aanvraag wordt verzonden…';

      const fallback = `mailto:info@apexclusive.nl?subject=${encodeURIComponent('Nieuwe aanvraag via APEXclusive')}&body=${encodeURIComponent(`Naam: ${values.name}\nE-mail: ${values.email}\nTelefoon: ${values.phone || '-'}\n\nAanvraag:\n${values.request}`)}`;

      try {
        const response = await fetch('/api/apex-lead', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(values)
        });
        if (!response.ok) throw new Error('send failed');
        form.reset();
        status.textContent = 'Bedankt. Uw aanvraag is ontvangen. We nemen binnen 24 uur contact op.';
        window.apexTrack?.('lead_form_submit');
      } catch (_) {
        status.textContent = 'Uw e-mailprogramma wordt geopend…';
        window.location.href = fallback;
      } finally {
        submit.disabled = false;
        form.removeAttribute('aria-busy');
      }
    });
  });
})();
