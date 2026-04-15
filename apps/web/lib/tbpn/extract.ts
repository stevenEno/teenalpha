import Groq from 'groq-sdk';

export interface ExtractedCompany {
  name: string;
  description: string;
  sector: string;
  funding_stage: string | null;
  funding_raised_usd: number | null;
  location_hint: string | null;
  hiring_signal: boolean;
  website: string | null;
}

/**
 * Pull startup mentions out of a TBPN episode blurb. Only keeps companies that
 * are clearly named and have at least funding or hiring signal worth tracking.
 */
export async function extractCompaniesFromEpisode(
  episodeTitle: string,
  episodeDescription: string
): Promise<ExtractedCompany[]> {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

  const systemPrompt = `You read Technology Brothers (TBPN) podcast episode descriptions and extract startup mentions.

Return JSON only — no markdown, no prose:
{"companies":[{"name":"string","description":"1 sentence","sector":"lowercase single word like ai|space|defense|energy|manufacturing|biotech|climate|healthtech|fintech|robotics|technology","funding_stage":"Seed|Series A|Series B|Series C|Series D|null","funding_raised_usd":number|null,"location_hint":"city or area, null if unknown","hiring_signal":boolean,"website":"url or null"}]}

Rules:
- Only include companies that are real startups (not public giants like Meta, Google, Apple, Amazon, Microsoft).
- If the episode doesn't mention any fitting startup, return {"companies":[]}.
- funding_raised_usd: raw integer, no formatting. Leave null if unclear.
- hiring_signal: true if the company raised money, is expanding, opening offices, or explicitly hiring.
- Be conservative — skip companies that are only passingly mentioned.`;

  const userPrompt = `Episode title: ${episodeTitle}

Episode description:
${episodeDescription}`;

  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    temperature: 0.2,
    max_tokens: 1500,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
  });

  const text = completion.choices[0]?.message?.content ?? '{}';
  const parsed = JSON.parse(text) as { companies?: ExtractedCompany[] };
  return (parsed.companies ?? []).filter((c) => c.name && c.sector);
}

export async function geocodeLocationHint(
  hint: string | null
): Promise<{ latitude: number; longitude: number; city: string | null; region: string | null } | null> {
  if (!hint) return null;
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  if (!token) return null;
  try {
    const url = `https://api.mapbox.com/search/geocode/v6/forward?q=${encodeURIComponent(hint)}&limit=1&access_token=${token}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const j = (await res.json()) as {
      features?: Array<{
        geometry: { coordinates: [number, number] };
        properties: { context?: { place?: { name?: string }; region?: { name?: string } } };
      }>;
    };
    const f = j.features?.[0];
    if (!f) return null;
    const [longitude, latitude] = f.geometry.coordinates;
    return {
      latitude,
      longitude,
      city: f.properties.context?.place?.name ?? null,
      region: f.properties.context?.region?.name ?? null,
    };
  } catch (err) {
    console.error('Geocode failed for', hint, err);
    return null;
  }
}
