export default async function handler(req, res) {
  
  // CORS headers (voor alle omgevingen)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Preflight request afhandelen
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Alleen POST toestaan
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Alleen POST toegestaan' });
  }

  // API sleutel ophalen uit environment
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('OPENAI_API_KEY niet gevonden');
    return res.status(500).json({ 
      error: 'Configuratiefout — neem contact op via info@apexclusive.nl' 
    });
  }

  // Berichten ophalen uit request body
  const { messages } = req.body;
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Geen geldige berichten ontvangen' });
  }

  // Systeem prompt voor APEXclusive
  const systemPrompt = {
    role: 'system',
    content: `Je bent de digitale adviseur van APEXclusive, een premium automotive 
advisory bedrijf gevestigd in Maastricht, Nederland. 

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

TOOLS (gratis, geen registratie):
- BPM Calculator: https://bpm.apexclusive.nl
- Kentekencheck (RDW-data): https://kentekencheck.apexclusive.nl
- Advertentie Analyse: https://carrapport.apexclusive.nl

CONTACT:
- Email: info@apexclusive.nl
- WhatsApp: +31 6 24 73 59 39
- Locatie: Maastricht

EIGEN GARAGE MARTIJN:
Lamborghini Huracán LP610 (import Zweden), McLaren 650S Spyder (import België), 
Lamborghini Urus (import Luxemburg), Porsche 911 Turbo, BMW M4, Porsche Macan Turbo

INSTRUCTIES:
- Spreek ALTIJD Nederlands
- Wees professioneel, beknopt en behulpzaam
- Toon passie voor auto's waar passend
- Geef GEEN specifiek financieel of juridisch advies
- Verwijs voor complexe vragen altijd naar een persoonlijk gesprek met Martijn
- Bij vragen over BPM: verwijs naar de gratis BPM Calculator tool
- Bij vragen over een specifiek voertuig: verwijs naar de Advertentie Analyse tool
- Houd antwoorden onder de 150 woorden tenzij echt nodig
- Eindig regelmatig met een uitnodiging voor contact of gebruik van de tools`
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
        presence_penalty: 0.1
      })
    });

    // OpenAI fout afhandelen
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('OpenAI API fout:', response.status, errorData);
      
      if (response.status === 401) {
        return res.status(500).json({ 
          error: 'API sleutel ongeldig. Controleer de Vercel environment variabelen.' 
        });
      }
      if (response.status === 429) {
        return res.status(429).json({ 
          error: 'Even geduld — te veel verzoeken. Probeer over enkele seconden opnieuw.' 
        });
      }
      return res.status(500).json({ 
        error: 'Er ging iets mis. Probeer opnieuw of neem contact op via WhatsApp.' 
      });
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content?.trim();

    if (!reply) {
      return res.status(500).json({ error: 'Geen antwoord ontvangen van AI' });
    }

    return res.status(200).json({ reply });

  } catch (error) {
    console.error('Onverwachte fout:', error.message);
    return res.status(500).json({ 
      error: 'Verbindingsfout. Neem contact op via info@apexclusive.nl of WhatsApp.' 
    });
  }
}
