export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Alleen POST toegestaan' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Configuratiefout: ontbrekende OpenAI API-sleutel' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch (err) {
      return res.status(400).json({ error: 'Ongeldige JSON in body' });
    }
  }

  const { messages } = body;
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Geen geldige berichten' });
  }

  const systemPrompt = {
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
        'Authorization': `Bearer ${apiKey}`
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
    return res.status(500).json({ error: 'Verbindingsfout. Neem contact op via info@apexclusive.nl' });
  }
}