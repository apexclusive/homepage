export default async function handler(req, res) {
  // Alleen POST toestaan
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { messages } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Geen berichten meegestuurd' });
  }

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'API sleutel niet geconfigureerd' });
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Je bent de digitale adviseur van APEXclusive, een premium automotive advisory bedrijf 
            gevestigd in Maastricht. Oprichter is Martijn Puts, een professioneel piloot en autofanaat.
            
            APEXclusive helpt klanten met:
            - Import van exclusieve auto's uit heel Europa (Duitsland, België, Italië, Spanje, Zweden, Luxemburg, Frankrijk)
            - BPM-berekeningen en taxaties via erkende partners
            - Onafhankelijke aankoopkeuringen ter plaatse
            - RDW-keuring en kentekenregistratie aan huis
            - Volledige A tot Z begeleiding
            
            Tools beschikbaar:
            - BPM Calculator: https://bpm.apexclusive.nl
            - Kentekencheck: https://kentekencheck.apexclusive.nl  
            - Advertentie Analyse: https://carrapport.apexclusive.nl
            
            Contact:
            - Email: info@apexclusive.nl
            - WhatsApp: +31 6 24 73 59 39
            
            Spreek altijd Nederlands. Wees professioneel, beknopt en behulpzaam. 
            Geef geen financieel advies. Verwijs voor specifieke vragen naar een gesprek met Martijn.`
          },
          ...messages
        ],
        max_tokens: 500,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI fout:', errorData);
      return res.status(500).json({ 
        error: 'Er ging iets mis met de AI verbinding. Probeer het later opnieuw.' 
      });
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content;

    if (!reply) {
      return res.status(500).json({ error: 'Geen antwoord ontvangen' });
    }

    return res.status(200).json({ reply });

  } catch (error) {
    console.error('Server fout:', error);
    return res.status(500).json({ 
      error: 'Verbindingsfout. Neem contact op via apexclusive.nl/#contact' 
    });
  }
}
