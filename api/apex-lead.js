/**
 * Ontvangt aanvragen van het leadformulier op de homepage en van de
 * contactvorm in de AI-chat. Beide posten naar /api/apex-lead.
 *
 * Aflevering gebeurt via de eerste bezorgmethode die geconfigureerd is:
 *
 *   1. LEAD_WEBHOOK_URL   — POST met de lead als JSON. Werkt met Make,
 *                           Zapier, n8n, Slack-workflows of je eigen CRM.
 *   2. RESEND_API_KEY     — verstuurt een e-mail via Resend naar LEAD_TO_EMAIL
 *                           (standaard info@apexclusive.nl). Vereist ook
 *                           LEAD_FROM_EMAIL op een in Resend verifieerd domein.
 *
 * Is er geen enkele methode geconfigureerd, dan antwoordt dit endpoint met
 * 503. Dat is bewust: de frontend vangt een niet-ok response af en opent dan
 * het mailprogramma van de bezoeker. Zo raakt een aanvraag nooit stil verloren.
 */

const ALLOWED_ORIGINS = new Set([
  'https://apexclusive.nl',
  'https://www.apexclusive.nl',
  'https://vergelijk.apexclusive.nl',
  'http://localhost:4173'
]);

const MAX_BODY_BYTES = 20000;

const FIELD_LIMITS = {
  name: 120,
  email: 200,
  phone: 40,
  request: 4000
};

function clean(value, max) {
  return String(value ?? '')
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '') // controltekens weg
    .trim()
    .slice(0, max);
}

/**
 * Bewust conservatief: dit hoeft geen volledige RFC 5322 validatie te zijn,
 * alleen genoeg om typefouten en bots tegen te houden zonder echte adressen
 * te weigeren.
 */
function isPlausibleEmail(value) {
  return /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/.test(value) && value.length <= FIELD_LIMITS.email;
}

function isPlausiblePhone(value) {
  if (!value) return true; // optioneel veld
  return /^[+()\d\s./-]{6,40}$/.test(value);
}

export default async function handler(req, res) {
  const requestOrigin = req.headers.origin;
  const localOrigin = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(requestOrigin || '');

  if (requestOrigin && !ALLOWED_ORIGINS.has(requestOrigin) && !localOrigin) {
    return res.status(403).json({ error: 'Origin niet toegestaan' });
  }
  if (requestOrigin) res.setHeader('Access-Control-Allow-Origin', requestOrigin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Alleen POST toegestaan' });

  const contentType = String(req.headers?.['content-type'] || '').toLowerCase();
  if (contentType && !contentType.startsWith('application/json')) {
    return res.status(415).json({ error: 'Gebruik application/json' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    if (body.length > MAX_BODY_BYTES) {
      return res.status(413).json({ error: 'Aanvraag is te groot' });
    }
    try {
      body = JSON.parse(body);
    } catch {
      return res.status(400).json({ error: 'Ongeldige JSON in body' });
    }
  }
  if (!body || typeof body !== 'object') {
    return res.status(400).json({ error: 'Ongeldige aanvraag' });
  }

  // Honeypot: het formulier heeft een verborgen veld 'website'. Echte
  // bezoekers zien het niet, bots vullen het vaak wel in. Antwoord 200 zodat
  // een bot niet leert dat hij ontmaskerd is, maar doe verder niets.
  if (clean(body.website, 200)) {
    return res.status(200).json({ ok: true });
  }

  const lead = {
    name: clean(body.name, FIELD_LIMITS.name),
    email: clean(body.email, FIELD_LIMITS.email),
    phone: clean(body.phone, FIELD_LIMITS.phone),
    request: clean(body.request, FIELD_LIMITS.request),
    brand: body.brand === 'mpx' ? 'mpx' : 'apex'
  };

  const problems = [];
  if (lead.name.length < 2) problems.push('naam');
  if (!isPlausibleEmail(lead.email)) problems.push('e-mailadres');
  if (!isPlausiblePhone(lead.phone)) problems.push('telefoonnummer');
  if (!lead.request) problems.push('aanvraag');

  if (problems.length) {
    return res.status(400).json({ error: `Controleer uw ${problems.join(', ')}.` });
  }

  const webhookUrl = process.env.LEAD_WEBHOOK_URL;
  const resendKey = process.env.RESEND_API_KEY;

  if (!webhookUrl && !resendKey) {
    // Geen bezorgmethode geconfigureerd. De frontend valt hierdoor terug op
    // mailto, wat beter is dan doen alsof de aanvraag is aangekomen.
    return res.status(503).json({
      error: 'Online verzenden is nog niet geconfigureerd.'
    });
  }

  const submittedAt = new Date().toISOString();
  const payload = { ...lead, submittedAt, source: 'apexclusive.nl' };

  try {
    if (webhookUrl) {
      const hookResponse = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!hookResponse.ok) {
        throw new Error(`webhook antwoordde met ${hookResponse.status}`);
      }
      return res.status(200).json({ ok: true });
    }

    const toEmail = process.env.LEAD_TO_EMAIL || 'info@apexclusive.nl';
    const fromEmail = process.env.LEAD_FROM_EMAIL;
    if (!fromEmail) {
      throw new Error('LEAD_FROM_EMAIL ontbreekt naast RESEND_API_KEY');
    }

    const lines = [
      `Naam:      ${lead.name}`,
      `E-mail:    ${lead.email}`,
      `Telefoon:  ${lead.phone || '-'}`,
      `Ontvangen: ${submittedAt}`,
      '',
      'Aanvraag:',
      lead.request
    ];

    const mailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${resendKey}`
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [toEmail],
        reply_to: lead.email,
        subject: `Nieuwe aanvraag via apexclusive.nl — ${lead.name}`,
        text: lines.join('\n')
      })
    });

    if (!mailResponse.ok) {
      const detail = await mailResponse.text().catch(() => '');
      throw new Error(`Resend antwoordde met ${mailResponse.status} ${detail.slice(0, 200)}`);
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    // Geen e-mailadres of telefoonnummer in de logs: dat is persoonsgegeven.
    console.error('Lead kon niet worden afgeleverd:', error?.message || error);
    return res.status(502).json({ error: 'Aanvraag kon niet worden verzonden.' });
  }
}
