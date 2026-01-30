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
    const { url, schemaType } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8000,
      tools: [{
        type: "web_search_20250305",
        name: "web_search"
      }],
      messages: [{
        role: 'user',
        content: `Use web search to analyze ${url} and generate Schema.org JSON-LD markup that helps users decide to contact or visit this organization.

${schemaType !== 'auto' ? `Schema type: ${schemaType}` : 'Auto-detect type.'}

PRIORITY INFORMATION TO FIND AND INCLUDE:
1. CONTACT: Phone, email, contact form
2. LOCATION: Full address, maps link
3. HOURS: When are they open/available?
4. SERVICES: What do they offer? Key programs?
5. PEOPLE: Key staff, leadership (with titles)
6. SOCIAL PROOF: Reviews, ratings, testimonials
7. SOCIAL MEDIA: Links to Facebook, Twitter, LinkedIn, etc.
8. ACTIONABILITY: How can someone get started? Booking? Registration?

INSTRUCTIONS:
1. Search ${url} and key pages (About, Contact, Services, Team, Hours, etc.)
2. Generate complete JSON-LD schema with ALL actionable information found
3. Focus on data that encourages follow-up or site visits

FORMAT YOUR RESPONSE:
[Complete JSON-LD schema code]

---RECOMMENDATIONS---
**ACTIONABLE_IMPROVEMENTS**
Focus ONLY on missing information that would help users decide to contact/visit:
- [e.g. "Add phone number from Contact page - helps users call directly"]
- [e.g. "Add business hours - users need to know when you're open"]
- [e.g. "Add specific services offered - helps users know if you meet their needs"]
- [e.g. "Add team member names and roles - builds trust and credibility"]
- [e.g. "Add social media links - allows users to follow and engage"]

DO NOT suggest:
- Generic SEO improvements
- Technical metadata
- Anything that doesn't directly help users take action

Each improvement should answer: "How does this help someone decide to contact or visit?"`
      }]
    });

    let fullResponse = message.content
      .filter(block => block.type === 'text')
      .map(block => block.text)
      .join('\n');

    // Clean markdown
    fullResponse = fullResponse.replace(/```json\s*/gi, '').replace(/```\s*/g, '');

    // Split schema and recommendations
    const parts = fullResponse.split('---RECOMMENDATIONS---');
    let schema = parts[0].trim();
    const recs = parts[1] || '';

    // Extract JSON
    const start = schema.indexOf('{');
    if (start > 0) schema = schema.substring(start);

    // Find JSON end
    let count = 0, end = -1;
    for (let i = 0; i < schema.length; i++) {
      if (schema[i] === '{') count++;
      if (schema[i] === '}' && --count === 0) {
        end = i + 1;
        break;
      }
    }
    if (end > 0) schema = schema.substring(0, end);

    // Parse improvements
    const match = recs.match(/\*\*ACTIONABLE_IMPROVEMENTS\*\*([\s\S]*?)(?=\*\*|$)/);
    let improvements = [];
    
    if (match) {
      improvements = match[1]
        .split('\n')
        .map(l => l.trim())
        .filter(l => l && !l.startsWith('**'))
        .map(l => l.replace(/^[-*•]\s*/, '').replace(/^\d+\.\s*/, ''));
    } else {
      improvements = recs.split('\n')
        .filter(l => {
          const t = l.trim();
          return (t.match(/^[-*•]\s+\w/) || t.match(/^\d+\.\s+\w/)) && t.length > 20;
        })
        .map(l => l.trim().replace(/^[-*•]\s*/, '').replace(/^\d+\.\s*/, ''));
    }

    res.json({ schema, recommendations: recs, improvements });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
}
