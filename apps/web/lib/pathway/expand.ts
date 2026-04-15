import Groq from 'groq-sdk';

export interface ExpandedBranch {
  title: string;
  description: string;
  kind: 'skill' | 'project' | 'opportunity';
}

/**
 * Generate 5 next-step branches for a completed pathway node.
 * Uses Groq (fast, cheap) for constant regeneration as the teen progresses.
 */
export async function expandNodeBranches(params: {
  interest: string;
  pathName: string;
  completedNodeTitle: string;
  completedNodeDescription: string | null;
  parentChain: string[]; // ancestor titles from root → completed node
  nextKind: 'skill' | 'project';
}): Promise<ExpandedBranch[]> {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

  const systemPrompt = `You are a career pathway advisor for teens. Given a teen's completed step, generate exactly 5 distinct next-step branches.

Return JSON only — no markdown, no code blocks, no commentary:
{"branches":[{"title":"short 3-6 word action","description":"1 sentence — direct, teen-voice, no corporate speak","kind":"${params.nextKind}"}]}

Rules:
- Exactly 5 branches, all diverse (different angles, not variations of the same thing).
- kind="${params.nextKind}" for every branch.
- Titles are imperative/action-oriented (e.g. "Learn basic Python", "Build a tide chart", "Ship a YouTube short").
- If kind="project", each branch must be a small concrete thing the teen can actually ship in days-to-weeks.
- No dead-ends. Every branch should open up more possibilities.`;

  const userPrompt = `Teen's interest: ${params.interest}
Current pathway: ${params.pathName}
They just completed: "${params.completedNodeTitle}"${params.completedNodeDescription ? ` — ${params.completedNodeDescription}` : ''}
Path so far: ${params.parentChain.join(' → ')}

Generate the next 5 branches.`;

  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    temperature: 0.8,
    max_tokens: 800,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
  });

  const text = completion.choices[0]?.message?.content ?? '{}';
  const parsed = JSON.parse(text) as { branches?: ExpandedBranch[] };
  const branches = (parsed.branches ?? []).slice(0, 5);
  if (branches.length < 3) throw new Error('Too few branches returned');
  return branches.map((b) => ({ ...b, kind: params.nextKind }));
}
