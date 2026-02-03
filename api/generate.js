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
        content: `Use web search to analyze ${url} and generate the MOST COMPREHENSIVE Schema.org JSON-LD markup possible for this nonprofit organization.

${schemaType !== 'auto' ? `Schema type: ${schemaType}` : 'Auto-detect the most appropriate schema type (NonprofitOrganization, EducationalOrganization, MedicalOrganization, LocalBusiness, PerformingGroup, SportsOrganization, etc.)'}

CRITICAL: This is a SINGLE-PASS generation. Make it as complete as possible because there will be no opportunity to improve it later.

EXHAUSTIVE INFORMATION TO FIND AND INCLUDE:

**Core Nonprofit Information:**
1. MISSION & IMPACT: Mission statement, areas of focus, populations served, impact metrics
2. SERVICES/PROGRAMS: Every program, service, class, event, or offering mentioned
3. ORGANIZATION TYPE: Nonprofit status, 501(c)(3) designation, areas of work

**Contact & Location:**
4. CONTACT: All phone numbers, all email addresses, contact forms
5. LOCATION: Complete address, geo coordinates, maps link, service areas, multiple locations
6. HOURS: Operating hours, office hours, service hours, appointment availability

**People & Leadership:**
7. PEOPLE: Staff, board members, volunteers, leadership with names, titles, contact info
8. FOUNDER/HISTORY: Organization history, founding information, key milestones

**Engagement Opportunities:**
9. DONATION OPTIONS: How to donate, giving levels, membership programs, fundraising campaigns
10. VOLUNTEER: Volunteer opportunities, how to get involved, skills needed
11. EVENTS: Upcoming events, calendar links, registration information

**Trust & Credibility:**
12. SOCIAL PROOF: Reviews, ratings, testimonials, awards, certifications, accreditations
13. SOCIAL MEDIA: Every platform (Facebook, Twitter, Instagram, LinkedIn, YouTube, TikTok, etc.)
14. PARTNERSHIPS: Parent organizations, affiliations, partners, funders

**Accessibility & Services:**
15. ACCESSIBILITY: Wheelchair access, assistive devices, language services, accommodations
16. AMENITIES: Parking, public transport, facilities, childcare
17. PRICING/FEES: Service costs, sliding scale, financial assistance, free programs

**Additional Details:**
18. POLICIES: Privacy policy, refund/cancellation, eligibility requirements
19. MEDIA: Images, videos, virtual tours, annual reports
20. AUDIENCE: Who this organization serves (age groups, demographics, communities)

INSTRUCTIONS:
1. Search ${url} thoroughly - main page, About, Mission, Programs, Services, Get Involved, Donate, Volunteer, Events, Contact, Team, Board, FAQ, etc.
2. Extract EVERY piece of actionable information found
3. Generate complete JSON-LD schema with ALL discovered data
4. Use proper Schema.org types and properties for everything
5. Prioritize information that helps people understand the mission, access services, donate, or volunteer
6. Be thorough - if it's on the website, it should be in the schema

For nonprofits, especially emphasize:
- Mission and who you serve
- How people can get help/access services
- How people can donate or volunteer
- Impact and credibility indicators

FORMAT YOUR RESPONSE:
[Complete comprehensive JSON-LD schema code with everything you found]

DO NOT include any recommendations section. Just return the most complete schema possible.`
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
