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
  const apexFallback = `Bedankt voor je bericht. We helpen je graag verder met een passende auto of importtraject. Laat gerust je naam en telefoonnummer achter, dan nemen we persoonlijk contact met je op.`;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    const lastUserMessage = (messages[messages.length - 1]?.content || '').toLowerCase();
    const reply = brand === 'mpx' ? mpxFallback : apexFallback;
    return res.status(200).json({
      reply: reply + (lastUserMessage.includes('website') ? ' We bespreken graag jouw website-doel, doelgroep en uitstraling.' : '')
    });
  }

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
- Oprichter: Martijn Puts, professioneel piloot en autofanaat
- Specialiteit: Import van exclusieve auto's uit heel Europa
- Zoekgebied: Duitsland, België, Italië, Spanje, Zweden, Luxemburg, Frankrijk
- Werkwijze: volledig A tot Z, van eerste gesprek tot sleuteloverdracht aan huis
- USP: 100% onafhankelijk, geen dealerbelang

DIENSTEN:
- Importbegeleiding en voertuig opsporen
- Onafhankelijke aankoopkeuring ter plaatse (op verzoek)
- BPM-taxatie via erkende partners
- RDW-keuring en kentekenmontage aan huis
- Onderhandeling en volledige papierafhandeling

TOOLS:
- BPM Calculator: https://bpm.apexclusive.nl
- Kentekencheck: https://kentekencheck.apexclusive.nl
- Advertentie Analyse: https://carrapport.apexclusive.nl

CONTACT:
- Email: info@apexclusive.nl
- WhatsApp: +31 6 24 73 59 39
- Locatie: Maastricht

LEAD OPVANGEN:
Als een bezoeker serieuze interesse toont in import, aankoopbegeleiding of een specifieke auto,
vraag dan vriendelijk naar naam en telefoonnummer of email. Vertel dat Martijn persoonlijk
contact opneemt binnen 24 uur. Formuleer dit natuurlijk in het gesprek, niet als een formulier.

INSTRUCTIES:
- Spreek ALTIJD Nederlands
- Wees professioneel, warm en behulpzaam
- Toon passie voor auto's waar passend
- Geef GEEN specifiek financieel of juridisch advies
- Verwijs voor complexe vragen naar een gesprek met Martijn
- Houd antwoorden onder de 120 woorden tenzij echt nodig
- Gebruik vetgedrukt voor belangrijke termen
- Bij BPM vragen: verwijs altijd naar https://bpm.apexclusive.nl
- Bij kenteken vragen: verwijs naar https://kentekencheck.apexclusive.nl
- Bij prijsvragen advertenties: verwijs naar https://carrapport.apexclusive.nl`
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