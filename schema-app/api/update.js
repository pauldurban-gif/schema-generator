import Anthropic from '@anthropic-ai/sdk';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { url, originalSchema, improvements } = req.body;

    if (!url || !originalSchema || !improvements?.length) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const improvementsList = improvements.join('\n- ');

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8000,
      tools: [{
        type: "web_search_20250305",
        name: "web_search"
      }],
      messages: [{
        role: 'user',
        content: `Search ${url} to find missing information, then update this schema.

CURRENT SCHEMA:
${originalSchema}

FIND AND ADD:
- ${improvementsList}

CRITICAL:
1. Search ${url} for the actual data
2. Add real phone numbers, emails, addresses, etc. from the site
3. Keep all existing properties
4. Return ONLY the complete updated JSON (no markdown)

The updated schema MUST have more fields than the original.`
      }]
    });

    let schema = message.content
      .filter(block => block.type === 'text')
      .map(block => block.text)
      .join('\n');

    // Clean
    schema = schema.replace(/```json\s*/gi, '').replace(/```\s*/g, '');
    
    const start = schema.indexOf('{');
    if (start > 0) schema = schema.substring(start);

    // Find end
    let count = 0, end = -1;
    for (let i = 0; i < schema.length; i++) {
      if (schema[i] === '{') count++;
      if (schema[i] === '}' && --count === 0) {
        end = i + 1;
        break;
      }
    }
    if (end > 0) schema = schema.substring(0, end);

    res.json({ schema });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
}
