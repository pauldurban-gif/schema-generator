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
      max_tokens: 6000,
      tools: [{
        type: "web_search_20250305",
        name: "web_search"
      }],
      messages: [{
        role: 'user',
        content: `Use web search to analyze ${url} and generate comprehensive Schema.org JSON-LD markup for this nonprofit.

${schemaType !== 'auto' ? `Schema type: ${schemaType}` : 'Auto-detect schema type (NonprofitOrganization, EducationalOrganization, MedicalOrganization, etc.)'}

FIND AND INCLUDE (prioritize what's actually on the site):
• Mission, services, programs, who you serve
• Contact: phone, email, forms
• Location: address, hours, service areas
• People: staff, board, leadership with roles
• Engagement: donation links, volunteer info, events
• Social media profiles (all platforms)
• Accessibility, amenities, policies
• Awards, certifications, partnerships
• 501(c)(3) status if mentioned

INSTRUCTIONS:
1. Search ${url} main pages: homepage, About, Programs, Contact, Get Involved, Donate
2. Extract all actionable information found
3. Generate complete JSON-LD with proper Schema.org properties
4. Focus on: mission clarity, service access, donation/volunteer pathways

Return ONLY the complete JSON-LD schema. No explanations or recommendations.`
      }]
    });

    let fullResponse = message.content
      .filter(block => block.type === 'text')
      .map(block => block.text)
      .join('\n');

    // Clean markdown
    fullResponse = fullResponse.replace(/```json\s*/gi, '').replace(/```\s*/g, '');

    // Extract JSON (no recommendations section anymore)
    let schema = fullResponse.trim();
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

    res.json({ schema });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
}
