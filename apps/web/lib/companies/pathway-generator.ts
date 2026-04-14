import Anthropic from '@anthropic-ai/sdk';
import type { Company, Pathway, QuizAnswers } from './schemas';

let _client: Anthropic | null = null;
function getClient() {
  if (!_client) _client = new Anthropic();
  return _client;
}

export async function generatePathway(
  answers: QuizAnswers,
  companies: Company[],
  isRetry = false
): Promise<Pathway> {
  const companyContext = companies.map((c, i) => ({
    index: i,
    id: c.id,
    name: c.name,
    description: c.description,
    sector: c.sector,
    interest_categories: c.interest_categories,
    teen_roles: c.teen_roles,
    micro_experiment: c.micro_experiment,
    city: c.city,
    funding_stage: c.funding_stage,
  }));

  const strictPrefix = isRetry
    ? '\n\nIMPORTANT: Your previous response had invalid company IDs. You MUST use ONLY the exact UUID IDs from the company list below. Copy them exactly.'
    : '';

  const systemPrompt = `You are a career pathway advisor for teens. You generate personalized, contrarian career pathway reports that connect a teen's interests to real local startups and opportunities.${strictPrefix}

You must respond with a valid JSON object matching this exact schema:
{
  "parent_voice": {
    "pathway_name": "string — a specific, contrarian career pathway name",
    "pathway_description": "string — 2-3 sentences for a parent. Professional, data-driven, emphasizing career viability.",
    "salary_range": "string — e.g. '$75,000 - $120,000'",
    "time_to_entry": "string — e.g. '2-4 years'",
    "matched_companies": [ { "company_id": "uuid", "why_matched": "1 sentence for parent" } ],
    "micro_experiments": [ { "title": "string", "description": "string", "location": "string", "cost": "string", "time_commitment": "string" } ]
  },
  "teen_voice": {
    "pathway_name": "string — same pathway name",
    "pathway_description": "string — 2-3 sentences directly to the teen. Casual, direct, motivating.",
    "salary_range": "string — same",
    "time_to_entry": "string — same",
    "matched_companies": [ { "company_id": "uuid (same as parent)", "why_matched": "1 sentence for teen, exciting" } ],
    "micro_experiments": [ { "title": "string", "description": "string", "location": "string", "cost": "string", "time_commitment": "string" } ]
  }
}

Rules:
- Pick 2-3 companies from the list. Use their EXACT id (UUID) values.
- Contrarian bias — apprenticeships, certifications, direct entry, startup paths over traditional 4-year college.
- Micro-experiments must reference real locations from the company list OR be clearly labeled "At home."
- Both voices describe the SAME pathway. Parent voice professional; teen voice casual and direct.
- Return ONLY the JSON object. No markdown, no explanation, no code blocks.`;

  const userPrompt = `Quiz answers:
- Interest pattern: ${answers.interest_category}
- Latent skill: ${answers.latent_skill}
- Work style: ${answers.work_style}
- School frustration: ${answers.school_gap}
- Parent's 2-year vision: ${answers.parent_vision}

Available companies (use their exact "id" values):
${JSON.stringify(companyContext, null, 2)}`;

  const response = await getClient().messages.create({
    model: 'claude-sonnet-4-6-20250514',
    max_tokens: 2000,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';
  return JSON.parse(text) as Pathway;
}

export function generateFallbackPathway(answers: QuizAnswers, companies: Company[]): Pathway {
  const matched = companies
    .filter((c) => c.interest_categories.includes(answers.interest_category))
    .sort((a, b) => (a.distance_from_center ?? 999) - (b.distance_from_center ?? 999))
    .slice(0, 3);

  if (matched.length < 3) {
    const remaining = companies
      .filter((c) => !matched.find((m) => m.id === c.id))
      .sort((a, b) => (a.distance_from_center ?? 999) - (b.distance_from_center ?? 999))
      .slice(0, 3 - matched.length);
    matched.push(...remaining);
  }

  const matchedCompanies = matched.map((c) => ({
    company_id: c.id,
    why_matched: `${c.name} offers ${c.teen_roles.join(', ') || 'hands-on'} opportunities in ${c.sector}.`,
  }));

  const microExperiments = matched.map((c) => ({
    title: c.micro_experiment?.split('.')[0] ?? `Visit ${c.name}`,
    description: c.micro_experiment ?? `Explore opportunities at ${c.name}.`,
    location: c.city ? `${c.name} — ${c.city}` : c.name,
    cost: 'Free',
    time_commitment: '2-3 hours',
  }));

  const name = `${answers.interest_category.charAt(0).toUpperCase() + answers.interest_category.slice(1)} Pathway`;
  return {
    parent_voice: {
      pathway_name: name,
      pathway_description: `Your teen's ${answers.interest_category} instinct connects directly to real local opportunities. Apprenticeships and startup entry points offer viable alternatives to a traditional 4-year path.`,
      salary_range: '$65,000 - $130,000',
      time_to_entry: '2-4 years',
      matched_companies: matchedCompanies,
      micro_experiments: microExperiments,
    },
    teen_voice: {
      pathway_name: name,
      pathway_description: `You're into ${answers.interest_category}? Companies near you literally hire people for this. You can start now — no 4-year degree required.`,
      salary_range: '$65,000 - $130,000',
      time_to_entry: '2-4 years',
      matched_companies: matchedCompanies.map((c) => ({
        ...c,
        why_matched: c.why_matched.replace(/offers .+ opportunities/, 'has programs you can actually try'),
      })),
      micro_experiments: microExperiments,
    },
  };
}
