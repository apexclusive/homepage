export default async function handler(req, res) {

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Alleen POST toegestaan' });

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'Configuratiefout' });

  const { messages } = req.body;
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
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

EIGEN GARAGE MARTIJN:
Lamborghini Huracán LP610 (import Zweden), McLaren 650S Spyder (import België),
Lamborghini Urus (import Luxemburg), Porsche 911 Turbo, BMW M4, Porsche Macan Turbo

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
- Gebruik **vetgedrukt** voor belangrijke termen
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
        stream: true
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('OpenAI fout:', response.status, errorData);
      if (response.status === 401) return res.status(500).json({ error: 'API sleutel ongeldig.' });
      if (response.status === 429) return res.status(429).json({ error: 'Even geduld — probeer opnieuw.' });
      return res.status(500).json({ error: 'Er ging iets mis. Probeer opnieuw.' });
    }

    // Streaming response doorsturen naar client
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') {
            res.write('data: [DONE]\n\n');
            continue;
          }
          try {
            const parsed = JSON.parse(data);
            const token = parsed.choices?.[0]?.delta?.content;
            if (token) {
              res.write(`data: ${JSON.stringify({ token })}\n\n`);
            }
          } catch (e) {
            // ongeldige JSON overslaan
          }
        }
      }
    }
    res.end();

  } catch (error) {
    console.error('Fout:', error.message);
    if (!res.headersSent) {
      return res.status(500).json({ error: 'Verbindingsfout. Neem contact op via info@apexclusive.nl' });
    }
    res.end();
  }
}
