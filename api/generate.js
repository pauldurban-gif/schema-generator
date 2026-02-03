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

CRITICAL: Contact information (phone, email, address) is OFTEN in website footers, headers, or sidebars. You MUST extract this information wherever you find it - don't skip footer content.

FIND AND INCLUDE (extract from ANY location on the page):
• CONTACT INFORMATION (PRIORITY - check everywhere including footer/header):
  - Phone number(s) - often in footer
  - Email address(es) - often in footer
  - Physical address - often in footer
  - Contact forms
• Mission, services, programs, who you serve
• Location: hours, service areas
• People: staff, board, leadership with roles
• Engagement: donation links, volunteer info, events
• Social media profiles (all platforms) - CHECK FOOTER
• Accessibility, amenities, policies
• Awards, certifications, partnerships
• 501(c)(3) status if mentioned

INSTRUCTIONS:
1. Search ${url} main pages: homepage (INCLUDE FOOTER AND HEADER CONTENT), About, Programs, Contact, Get Involved, Donate
2. When analyzing the homepage, pay special attention to footer and header sections for contact details
3. Extract ALL actionable information found, regardless of where it appears on the page
4. Generate complete JSON-LD with proper Schema.org properties
5. If you find phone/email/address in the footer, include it in the schema

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
