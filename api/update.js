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
        content: `Use web search to find actionable information from ${url} that helps users contact or visit, then update the schema.

CURRENT SCHEMA:
${originalSchema}

FIND AND ADD THESE ACTIONABLE DETAILS:
- ${improvementsList}

CRITICAL FOCUS - Add information that drives action:
1. CONTACT INFO: Phone numbers, email addresses users can actually use
2. LOCATION: Complete address so users know where to go
3. HOURS: When users can visit/call/engage
4. SERVICES: Specific offerings so users know if it meets their needs
5. PEOPLE: Names and roles to build trust
6. SOCIAL: Links so users can follow and engage
7. BOOKING/REGISTRATION: How users can get started

INSTRUCTIONS:
1. Search ${url} and relevant pages (Contact, About, Services, Hours, Team)
2. Find the REAL data for the improvements listed above
3. Add to schema using proper Schema.org properties:
   - "telephone": "actual phone number"
   - "email": "actual email"
   - "address": Full PostalAddress object
   - "openingHoursSpecification": Array with actual hours
   - "employee" or "member": Array with real names and titles
   - "sameAs": Array with actual social media URLs
   - "offers" or "hasOfferCatalog": Specific services/programs
4. Keep ALL existing properties
5. Return ONLY the complete updated JSON (no markdown)

REMEMBER: Only add information that helps users decide to contact, visit, or engage with this organization.`
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
