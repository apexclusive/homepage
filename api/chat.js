export default async function handler(req, res) {

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if(req.method === 'OPTIONS'){
    return res.status(200).end();
  }

  if(req.method !== 'POST'){
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { messages } = req.body;

  if(!messages || !Array.isArray(messages)){
    return res.status(400).json({ error: 'Ongeldige invoer' });
  }

  const apiKey = process.env.OPENAI_API_KEY;

  if(!apiKey){
    return res.status(500).json({ 
      error: 'API key niet geconfigureerd' 
    });
  }

  const systemPrompt = {
    role: 'system',
    content: `
Je bent de digitale adviseur van APEXclusive, een exclusief 
automotive importbedrijf gevestigd in Maastricht.

Je helpt klanten met:
- Import van premium en supersportwagens vanuit Europa naar Nederland
- BPM berekeningen en wetgeving (NEDC, WLTP, forfaitaire afschrijving)
- Het importproces stap voor stap uitleggen
- Kosten bij import: BPM, RDW-keuring (±€960), APK, transport
- Supercar advies: Lamborghini, Ferrari, Porsche, McLaren, 
  Bentley, Rolls-Royce, Aston Martin, Bugatti etc.
- Taxatie via erkende RDW-partners

Stijl:
- Spreek altijd Nederlands
- Professioneel maar persoonlijk en toegankelijk  
- Concrete antwoorden, geen wolligheid
- Bij vragen over exacte prijzen of offertes:
  verwijs naar apexclusive.nl/#contact
- Bij BPM vragen: verwijs naar bpm.apexclusive.nl
- Geen financieel of juridisch advies geven
- Sluit langere antwoorden af met een vervolgvraag

Bij vragen buiten automotive:
"Daar kan ik u helaas niet mee helpen, maar voor alles 
rondom premium auto import sta ik graag voor u klaar."
    `
  };

  try {
    const response = await fetch(
      'https://api.openai.com/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model:       'gpt-4o-mini',
          messages:    [systemPrompt, ...messages.slice(-10)],
          max_tokens:  500,
          temperature: 0.7
        })
      }
    );

    const data = await response.json();

    if(!response.ok){
      console.error('OpenAI error:', data);
      return res.status(500).json({
        error: 'Er is een fout opgetreden. Probeer opnieuw.'
      });
    }

    const reply = data.choices[0].message.content;
    return res.status(200).json({ reply });

  } catch(error) {
    console.error('Server error:', error);
    return res.status(500).json({
      error: 'Verbindingsfout. Probeer het opnieuw.'
    });
  }
}
