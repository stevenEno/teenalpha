import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { generateText } from '@/lib/ai';

// Lightweight path summary (no steps/skills/tools yet)
interface PathSummary {
  id: string;
  name: string;
  icon: string;
  tagline: string;
  connection: string;
  moneyPath: string;
}

// POST: Generate 5 path SUMMARIES from interest (fast, ~2s)
// Details are loaded on-demand via /api/explore/generate-path-details
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { interest, visitorId } = body;

    if (!interest || typeof interest !== 'string' || interest.trim().length < 2) {
      return NextResponse.json(
        { error: 'Interest is required (minimum 2 characters)' },
        { status: 400 }
      );
    }

    const cleanInterest = interest.trim().slice(0, 100);

    console.log('Generating path summaries for interest:', cleanInterest);

    // Lightweight prompt - only summaries, no detailed steps
    const prompt = `You are a teen business advisor. A student is interested in: "${cleanInterest}"

Generate exactly 5 DIVERSE paths to earn their first dollar online within 30 days. Keep it brief.

Requirements:
- NO upfront costs (free to start)
- Teen-appropriate and safe
- Mix of: content creation, service, digital product, community, tech

For EACH path, provide ONLY:
1. **name** - Creative 2-4 word name
2. **icon** - Single emoji
3. **tagline** - 4-7 word hook
4. **connection** - ONE sentence connecting their interest to this path
5. **moneyPath** - Specific first dollar goal (e.g., "First $: Sell 1 print for $5")

Respond with JSON only (no markdown):
{
  "paths": [
    { "id": "1", "name": "string", "icon": "emoji", "tagline": "string", "connection": "string", "moneyPath": "string" }
  ]
}`;

    const responseText = await generateText({
      prompt,
      maxTokens: 1000,
      temperature: 1,
    });

    console.log('AI response length:', responseText.length);

    // Parse the response
    let pathsData: { paths: PathSummary[] };
    try {
      pathsData = JSON.parse(responseText);

      if (!Array.isArray(pathsData.paths) || pathsData.paths.length !== 5) {
        throw new Error('Expected exactly 5 paths');
      }

      // Ensure IDs and add placeholder for details
      pathsData.paths = pathsData.paths.map((path, index) => ({
        ...path,
        id: path.id || `path-${Date.now()}-${index}`,
      }));

      console.log('Successfully parsed', pathsData.paths.length, 'path summaries');
    } catch (parseError) {
      console.error('Failed to parse AI response:', responseText.substring(0, 500));
      throw new Error('AI generated invalid response format');
    }

    // Store guest session for analytics
    if (visitorId) {
      try {
        const cookieStore = await cookies();
        const supabase = createServerClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!,
          {
            cookies: {
              get(name: string) {
                return cookieStore.get(name)?.value;
              },
            },
          }
        );

        await supabase.from('guest_onboarding_sessions').insert({
          visitor_id: visitorId,
          interest: cleanInterest,
          paths_generated: pathsData.paths,
          variant: 'mindmap',
        });
      } catch (dbError) {
        console.error('Failed to save guest session:', dbError);
      }
    }

    return NextResponse.json({
      success: true,
      paths: pathsData.paths,
    });
  } catch (error: any) {
    console.error('Generate paths error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate paths' },
      { status: 500 }
    );
  }
}
