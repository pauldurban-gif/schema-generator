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
3. Then identify 3-5 additional improvements that could enhance the schema

FORMAT YOUR RESPONSE EXACTLY LIKE THIS:
[Complete JSON-LD schema code]

---RECOMMENDATIONS---
**ACTIONABLE_IMPROVEMENTS**
- [improvement 1 with specific detail - e.g. "Add pricing information for individual tickets"]
- [improvement 2 with specific detail - e.g. "Include upcoming event schedule or calendar link"]  
- [improvement 3 with specific detail - e.g. "Add parking information and directions"]
- [improvement 4 with specific detail - e.g. "Include accessibility features for visitors with disabilities"]
- [improvement 5 with specific detail - e.g. "Add customer reviews or testimonials to build credibility"]

CRITICAL: You MUST provide at least 3 specific improvements in the ACTIONABLE_IMPROVEMENTS section. Even if the schema is comprehensive, suggest enhancements like:
- Adding upcoming events/calendar
- Including pricing details
- Adding parking/directions
- Specifying accessibility features
- Including FAQs or common questions
- Adding newsletter signup
- Specifying dress code or visitor guidelines
- Including donation opportunities
- Adding volunteer information
- Specifying refund/cancellation policies

Focus on information that helps users take action, even if not currently on the website.`
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

    // Parse improvements - be very aggressive
    console.log('Full recommendations text:', recs);
    
    let improvements = [];
    
    // Method 1: Look for ACTIONABLE_IMPROVEMENTS section
    const match = recs.match(/ACTIONABLE[_\s]*IMPROVEMENTS[:\s]*([\s\S]*?)(?=\n\n|\*\*[A-Z]|$)/i);
    if (match) {
      console.log('Found ACTIONABLE_IMPROVEMENTS section');
      improvements = match[1]
        .split('\n')
        .map(l => l.trim())
        .filter(l => l && !l.startsWith('**') && l.length > 10)
        .map(l => l.replace(/^[-*•]\s*/, '').replace(/^\d+\.\s*/, '').trim())
        .filter(l => l.length > 0);
    }
    
    // Method 2: If that failed, extract ALL bullet points from recommendations
    if (improvements.length === 0) {
      console.log('Fallback: extracting all bullet points');
      improvements = recs.split('\n')
        .map(l => l.trim())
        .filter(l => {
          // Must start with bullet or number
          const hasBullet = l.match(/^[-*•]\s+/) || l.match(/^\d+\.\s+/);
          // Must be substantial (>15 chars)
          const isSubstantial = l.length > 15;
          // Must not be a header
          const notHeader = !l.startsWith('**') && !l.endsWith('**') && !l.endsWith(':');
          return hasBullet && isSubstantial && notHeader;
        })
        .map(l => l.replace(/^[-*•]\s*/, '').replace(/^\d+\.\s*/, '').trim());
    }
    
    // Method 3: If still nothing, look for any lines that look like suggestions
    if (improvements.length === 0) {
      console.log('Fallback 2: looking for suggestion-like lines');
      improvements = recs.split('\n')
        .map(l => l.trim())
        .filter(l => {
          // Look for action words
          const hasActionWord = /\b(add|include|provide|specify|update|create|list)\b/i.test(l);
          // Reasonable length
          const goodLength = l.length > 20 && l.length < 200;
          // Not a header
          const notHeader = !l.startsWith('**') && !l.match(/^[A-Z\s]+:$/);
          return hasActionWord && goodLength && notHeader;
        })
        .slice(0, 10); // Max 10 improvements
    }
    
    console.log('Final improvements:', improvements);
    
    // Ensure minimum of 3 improvements
    if (improvements.length < 3) {
      console.log('Less than 3 improvements - adding generic ones');
      const genericImprovements = [
        'Add upcoming events or calendar to show what\'s happening',
        'Include specific pricing information for services/tickets',
        'Add parking information and directions for visitors',
        'Specify accessibility features and accommodations',
        'Include customer reviews or testimonials to build trust',
        'Add newsletter signup or mailing list option',
        'Include refund or cancellation policy information'
      ];
      
      // Add generic improvements until we have at least 3
      for (const generic of genericImprovements) {
        if (improvements.length >= 3) break;
        if (!improvements.includes(generic)) {
          improvements.push(generic);
        }
      }
    }
    
    console.log('Final improvements count:', improvements.length);
    
    res.json({ schema, recommendations: recs, improvements });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
}
