import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Default project recommendations prompt
export const DEFAULT_PROJECT_PROMPT = `You are a high school coding mentor helping a teen find their perfect first coding project.

Here is what we know about them based on their {{platform}} activity:

{{profileDescription}}

Based on this information, recommend 5 coding projects that:
1. Match their interests and personality
2. Are achievable for beginners (can complete in 2-4 weeks)
3. Teach valuable programming skills
4. Feel personally meaningful to them
5. Can be shown off to friends/family

For EACH project, provide:
- A catchy, specific title (not generic)
- Why it matches their interests (reference specific {{platform}} data)
- What they'll learn
- Difficulty level (Beginner/Intermediate)
- Estimated time (e.g., "2-3 weeks")
- Primary language/framework to use
- A specific first step to get started

Respond ONLY with valid JSON (no markdown, no code blocks):
{
  "recommendations": [
    {
      "title": "Specific project title",
      "description": "2-3 sentence description of what they'll build",
      "whyThisMatches": "1-2 sentences connecting to their {{platform}} interests",
      "skillsLearned": ["skill1", "skill2", "skill3"],
      "difficulty": "Beginner or Intermediate",
      "estimatedTime": "X weeks",
      "techStack": ["primary language/framework", "tool2"],
      "firstStep": "Specific actionable first step"
    }
  ]
}`;

export async function getPromptTemplate(promptId: string): Promise<string> {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    const { data, error } = await supabase
      .from('prompt_templates')
      .select('template')
      .eq('prompt_id', promptId)
      .single();

    if (error || !data) {
      console.log(`Using default prompt for ${promptId}`);
      return DEFAULT_PROJECT_PROMPT;
    }

    console.log(`Using custom prompt for ${promptId}`);
    return data.template;
  } catch (error) {
    console.error('Error fetching prompt template:', error);
    return DEFAULT_PROJECT_PROMPT;
  }
}

export function interpolatePrompt(template: string, variables: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
  }
  return result;
}
