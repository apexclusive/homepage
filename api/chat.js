// Simpele in-memory rate limiter per IP (per serverless-instance). Niet
// globaal, maar genoeg om een burst van bot-verkeer af te remmen zonder
// dat een echte bezoeker er last van heeft.
const RATE_LIMIT = 20;          // max berichten
const RATE_WINDOW_MS = 60_000;  // per minuut
const rateBuckets = new Map();

function isRateLimited(ip) {
  if (!ip) return false;
  const now = Date.now();
  const timestamps = (rateBuckets.get(ip) || []).filter(t => now - t < RATE_WINDOW_MS);
  if (timestamps.length >= RATE_LIMIT) {
    rateBuckets.set(ip, timestamps);
    return true;
  }
  timestamps.push(now);
  rateBuckets.set(ip, timestamps);
  return false;
}

export default async function handler(req, res) {
  const requestOrigin = req.headers.origin;
  const allowedOrigins = new Set([
    'https://apexclusive.nl',
    'https://www.apexclusive.nl',
    'https://vergelijk.apexclusive.nl',
    'https://mpxstudio.nl',
    'https://www.mpxstudio.nl',
    'http://localhost:4173'
  ]);
  const localOrigin = /^https?:\/\/(localhost|127\.0\.1)(:\d+)?$/.test(requestOrigin || '');
  if (requestOrigin && !allowedOrigins.has(requestOrigin) && !localOrigin) {
    return res.status(403).json({ error: 'Origin niet toegestaan' });
  }
  if (requestOrigin) res.setHeader('Access-Control-Allow-Origin', requestOrigin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  if (req.method === 'OPTIONS') return res.status(204).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Alleen POST toegestaan' });
  }

  const clientIp = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.headers['x-real-ip'] || 'onbekend';
  if (isRateLimited(clientIp)) {
    res.setHeader('Retry-After', '60');
    return res.status(429).json({ error: 'Even geduld — u hebt veel berichten in korte tijd verstuurd. Probeer over een minuut opnieuw.' });
  }

  const contentType = String(req.headers?.['content-type'] || '').toLowerCase();
  if (contentType && !contentType.startsWith('application/json')) {
    return res.status(415).json({ error: 'Gebruik application/json' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    if (body.length > 30000) return res.status(413).json({ error: 'Aanvraag is te groot' });
    try {
      body = JSON.parse(body);
    } catch (err) {
      return res.status(400).json({ error: 'Ongeldige JSON in body' });
    }
  }

  const brand = body?.brand === 'mpx' ? 'mpx' : 'apex';
  const allowedRoles = new Set(['user', 'assistant']);
  const messages = (Array.isArray(body?.messages) ? body.messages : [])
    .filter(message => allowedRoles.has(message?.role))
    .map(message => ({ role: message.role, content: String(message.content || '').trim().slice(0, 4000) }))
    .filter(message => message.content)
    .slice(-12);
  if (!messages.length || messages.at(-1)?.role !== 'user') {
    return res.status(400).json({ error: 'Geen geldige berichten' });
  }

  const mpxFallback = `Wij helpen bedrijven met premium webdesign, branding en slimme digitale touchpoints. Laat gerust je projectidee weten en we geven je direct een heldere volgende stap. Neem ook contact op via info@mpxstudio.nl of WhatsApp.`;
  const apexFallback = `Bedankt voor uw bericht. We helpen u graag verder met een passende auto of importtraject. Laat gerust uw naam en telefoonnummer achter, dan nemen we persoonlijk contact met u op.`;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    const lastUserMessage = (messages[messages.length - 1]?.content || '').toLowerCase();
    const reply = brand === 'mpx' ? mpxFallback : apexFallback;
    return res.status(200).json({
      reply: reply + (lastUserMessage.includes('website') ? ' We bespreken graag jouw website-doel, doelgroep en uitstraling.' : '')
    });
  }

  const toolContext = String(body?.toolContext || '');
  const apexContextNote = toolContext === 'importtraject'
    ? `\n\nHUIDIGE CONTEXT: de bezoeker gebruikt de Import traject planner (https://apexclusive.nl/import-traject-planner.html). Help bij vragen over het importplan, BPM, RDW en termijnen. Verwijs bij verdieping naar importbegeleiding (https://apexclusive.nl/importbegeleiding.html) en het BPM-artikel (https://apexclusive.nl/kennisbank-bpm-import.html).`
    : toolContext === 'sourcingbrief'
      ? `\n\nHUIDIGE CONTEXT: de bezoeker stelt een sourcing brief op (https://apexclusive.nl/sourcing-brief.html). Help de brief scherp en concreet te krijgen (merk, model, budget, eisen, timing). Verwijs voor het zoeken zelf naar de sourcing service (https://apexclusive.nl/sourcing-service.html).`
      : toolContext === 'verkoopvoorbereiding'
        ? `\n\nHUIDIGE CONTEXT: de bezoeker gebruikt de Verkoopvoorbereiding planner (https://apexclusive.nl/verkoopvoorbereiding-planner.html). Help bij de voorbereiding en overdracht van de verkoop. Verwijs voor persoonlijke begeleiding naar verkoopbegeleiding (https://apexclusive.nl/verkoopbegeleiding.html) en het verkoop-artikel (https://apexclusive.nl/kennisbank-verkoop.html).`
      : toolContext === 'maandkosten'
        ? `\n\nHUIDIGE CONTEXT: de bezoeker gebruikt de Maandkosten calculator (https://apexclusive.nl/maandkosten-calculator.html). Help bij het inschatten van afschrijving, brandstof, verzekering, wegenbelasting en onderhoud. Geef GEEN financieel of fiscaal advies; verwijs voor BPM naar https://bpm.apexclusive.nl, voor financiering naar https://lening.apexclusive.nl en voor persoonlijk advies naar het contactformulier (https://apexclusive.nl/#contact).`
      : toolContext === 'anthems'
        ? `\n\nHUIDIGE CONTEXT: de bezoeker gebruikt de Top 100 rij-anthems (https://apexclusive.nl/top100-rij-anthems.html), een lijst van 100 rij-anthems met een genrequiz ('wat vindt u vet?'), een ritfilter (highway/nacht/cruise/feest), een ingebouwde Spotify-speler en links naar Tidal (verliesvrije hifi). Help bij vragen over de lijst, de quiz, Spotify, Tidal en audio-kwaliteit. Koppel enthousiasme over muziek en autorijden waar passend aan de diensten van APEXclusive (https://apexclusive.nl/sourcing-service.html).`
        : '';

  const systemPrompt = brand === 'mpx'
    ? {
        role: 'system',
        content: `Je bent de digitale adviseur van MPX Studio, een premium digital agency gevestigd in Nederland.

OVER MPX STUDIO:
- MPX Studio ontwikkelt premium maatwerk websites voor bedrijven
- Specialiteit: webdesign, brand identity, development en AI-ondersteuning
- Doel: bedrijven laten sterker overkomen en meer vertrouwen opbouwen online
- Klanten: tandartspraktijken, klinieken, automotive bedrijven, lokale dienstverleners en ambachtelijke bedrijfsleven
- Kwaliteit: premium, luxe, helder, professioneel en conversiegericht

DIENSTEN:
- Premium maatwerk websites
- Brand identity en visuele richting
- Development en snelle moderne techniek
- AI & automatisering zoals chatbots, leadflow en slimme workflows

CONTACT:
- Email: info@mpxstudio.nl
- WhatsApp: +31 6 24 73 59 39
- Locatie: Nederland

INSTRUCTIES:
- Spreek ALTIJD Nederlands
- Wees professioneel, warm en direct
- Help bezoekers te begrijpen wat MPX Studio doet en voor wie
- Wees helder over premium webdesign, branding en conversie
- Noem altijd dat het om maatwerk gaat, niet standaard templates
- Houd antwoorden kort, helder en commercieel relevant
- Vraag als een bezoeker geïnteresseerd is, vriendelijk naar projectdoel, doelgroep en contactgegevens
- Gebruik vetgedrukt voor belangrijke termen`
      }
    : {
        role: 'system',
        content: `Je bent de digitale adviseur van APEXclusive, een premium automotive advisory bedrijf gevestigd in Maastricht, Nederland.

OVER APEXCLUSIVE:
- Oprichter: Martijn Puts, professioneel piloot en ervaren auto-importeur
- Specialiteit: aankoop en import van exclusieve auto's uit heel Europa
- Zoekgebied: Duitsland, België, Italië, Spanje, Zweden, Luxemburg, Frankrijk
- Werkwijze: volledig A tot Z, van eerste gesprek tot sleuteloverdracht
- USP: 100% onafhankelijk, geen dealerbelang, volledige transparantie vooraf

DIENSTEN (met pagina's):
- Aankoopbegeleiding: https://apexclusive.nl/aankoopbegeleiding.html
- Importbegeleiding: https://apexclusive.nl/importbegeleiding.html
- Sourcing service (gericht zoeken, ook niet-openbaar aanbod): https://apexclusive.nl/sourcing-service.html
- Verkoopbegeleiding: https://apexclusive.nl/verkoopbegeleiding.html
- Actueel aanbod (Lamborghini Urus): https://apexclusive.nl/aanbod-urus.html
- Afgeronde dossiers: https://apexclusive.nl/cases.html
- Over APEXclusive: https://apexclusive.nl/over-apexclusive.html

GRATIS HULPMIDDELEN (13 stuks, https://apexclusive.nl/#tools):
1. Kentekenvergelijking: https://vergelijk.apexclusive.nl
2. RDW kentekencheck: https://kentekencheck.apexclusive.nl
3. Advertentie analyse: https://carrapport.apexclusive.nl
4. Auto waarde: https://waarde.apexclusive.nl
5. BPM calculator: https://bpm.apexclusive.nl
6. Verzekering vergelijken: https://verzekering.apexclusive.nl
7. Auto lening: https://lening.apexclusive.nl
8. Import traject planner: https://apexclusive.nl/import-traject-planner.html
9. Advertentie tips: https://advertentie.apexclusive.nl
10. Sourcing brief opstellen: https://apexclusive.nl/sourcing-brief.html
11. Verkoopvoorbereiding planner: https://apexclusive.nl/verkoopvoorbereiding-planner.html
12. Maandkosten calculator (wat kost uw auto per maand): https://apexclusive.nl/maandkosten-calculator.html
13. Top 100 rij-anthems (Spotify + Tidal): https://apexclusive.nl/top100-rij-anthems.html

KENNISBANK (https://apexclusive.nl/kennisbank.html):
- BPM bij import: https://apexclusive.nl/kennisbank-bpm-import.html
- Controle vóór aankoop: https://apexclusive.nl/kennisbank-aankoopcontrole.html
- Exclusieve auto verkopen: https://apexclusive.nl/kennisbank-verkoop.html
- Maandkosten exclusieve auto: https://apexclusive.nl/kennisbank-maandkosten.html
- Auto importeren uit Duitsland: https://apexclusive.nl/kennisbank-importeren-duitsland.html
- Restwaarde en afschrijving: https://apexclusive.nl/kennisbank-restwaarde.html
- Porsche 911 kopen (modelgids): https://apexclusive.nl/kennisbank-porsche-911.html
- Mercedes G-Klasse kopen (modelgids): https://apexclusive.nl/kennisbank-g-klasse.html

CONTACT:
- Email: info@apexclusive.nl
- WhatsApp: https://wa.me/31624735939
- Telefoon: +31 6 24 73 59 39
- Locatie: Maastricht

LEAD OPVANGEN:
Als een bezoeker serieuze interesse toont in een auto, aankoop, import of verkoop,
vraag dan vriendelijk naar naam en telefoonnummer of email. Vertel dat Martijn
persoonlijk contact opneemt binnen 24 uur. Formuleer dit natuurlijk in het gesprek,
niet als een formulier.

INSTRUCTIES:
- Spreek ALTIJD Nederlands en gebruik de 'u'-vorm (nooit 'je' of 'jij')
- Wees professioneel, warm en behulpzaam
- Toon passie voor auto's waar passend
- Geef GEEN specifiek financieel of juridisch advies
- Verwijs voor complexe vragen naar een gesprek met Martijn
- Houd antwoorden onder de 120 woorden tenzij echt nodig
- Gebruik vetgedrukt voor belangrijke termen
- Verwijs actief naar de juiste pagina's en hulpmiddelen hierboven
- Bij BPM vragen: verwijs naar https://bpm.apexclusive.nl en het kennisbank-artikel
- Bij kenteken/historie vragen: verwijs naar https://kentekencheck.apexclusive.nl
- Bij advertentie- of prijsvragen: verwijs naar https://carrapport.apexclusive.nl en https://waarde.apexclusive.nl
- Bij verkoopvragen: verwijs naar https://apexclusive.nl/verkoopbegeleiding.html en https://apexclusive.nl/verkoopvoorbereiding-planner.html
- Bij zoekvragen: verwijs naar https://apexclusive.nl/sourcing-service.html en https://apexclusive.nl/sourcing-brief.html
- Alle hulpmiddelen zijn gratis, zonder kosten of verplichtingen${apexContextNote}`
      };

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + apiKey
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [systemPrompt, ...messages],
        max_tokens: 400,
        temperature: 0.7,
        presence_penalty: 0.1,
        stream: false
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('OpenAI fout:', response.status, errorData);

      if (response.status === 401) {
        return res.status(500).json({ error: 'API sleutel ongeldig.' });
      }
      if (response.status === 429) {
        return res.status(429).json({ error: 'Even geduld — probeer opnieuw.' });
      }
      return res.status(500).json({ error: 'Er ging iets mis. Probeer opnieuw.' });
    }

    const result = await response.json();
    const reply =
      result.reply ||
      result.text ||
      result.content ||
      result.choices?.[0]?.message?.content ||
      result.choices?.[0]?.text ||
      '';

    if (!reply) {
      return res.status(500).json({ error: 'Geen antwoord ontvangen van OpenAI.' });
    }

    return res.status(200).json({ reply });
  } catch (error) {
    console.error('Fout:', error);
    return res.status(500).json({ error: brand === 'mpx' ? 'Verbindingsfout. Neem contact op via info@mpxstudio.nl' : 'Verbindingsfout. Neem contact op via info@apexclusive.nl' });
  }
}