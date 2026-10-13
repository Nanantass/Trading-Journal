export async function parseTradeScreenshot(base64Image, mimeType = 'image/jpeg') {
  const response = await fetch('/api/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 1000,
      system: `You are a trading screenshot parser for Bybit Perpetual futures. 
Extract ALL visible trade fields from the screenshot and return ONLY a valid JSON object.
No markdown, no preamble. Raw JSON only.

Return this structure (use null for missing fields):
{
  "pair": "BTCUSDT",
  "direction": "LONG or SHORT",
  "entryPrice": 103200.00,
  "exitPrice": 105800.00,
  "size": 200.00,
  "leverage": 5,
  "pnl": 25.19,
  "pnlPercent": 2.52,
  "rrRatio": null,
  "sl": 102000.00,
  "tp": 106000.00,
  "liqPrice": 82560.00,
  "status": "CLOSED or OPEN",
  "date": "ISO string if visible else null",
  "duration": "string if visible else null",
  "fees": null,
  "notes": "any other relevant info from screenshot"
}`,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: mimeType, data: base64Image }
          },
          { type: 'text', text: 'Parse this Bybit trade screenshot and extract all fields.' }
        ]
      }]
    })
  })

  if (!response.ok) throw new Error(`API error: ${response.status}`)
  const data = await response.json()
  const raw = data.content.map(b => b.text || '').join('').replace(/```json\n?|```/g, '').trim()
  return JSON.parse(raw)
}

export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result.split(',')[1])
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}
