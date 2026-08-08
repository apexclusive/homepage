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
  // ... foutafhandeling ...
}

const result = await response.json();
const reply = result.choices?.[0]?.message?.content ||
              result.choices?.[0]?.text || '';

return res.status(200).json({ reply });
