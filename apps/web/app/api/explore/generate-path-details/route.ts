import { NextRequest, NextResponse } from 'next/server';
import type { ExploreStep } from '@teen-alpha/database';
import { generateText } from '@/lib/ai';

interface PathDetails {
  steps: ExploreStep[];
  skills: string[];
  tools: string[];
}

// POST: Generate detailed steps/skills/tools for a specific path (on-demand)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { interest, pathName, pathTagline, pathConnection, moneyPath } = body;

    if (!interest || !pathName) {
      return NextResponse.json(
        { error: 'Interest and pathName are required' },
        { status: 400 }
      );
    }

    console.log('Generating details for path:', pathName);

    const prompt = `You are a teen business advisor. A student interested in "${interest}" chose the path: "${pathName}"

Path context:
- Tagline: ${pathTagline}
- Connection: ${pathConnection}
- Goal: ${moneyPath}

Generate the ACTION PLAN for this path. Be specific and practical.

Provide:
1. **steps** - Exactly 5 concrete steps, each with:
   - order: 1-5
   - title: Action verb + specific task (e.g., "Create your first design using Canva")
   - description: 2-3 sentences with specific, actionable instructions a teen can follow TODAY
   - timeEstimate: Realistic time (e.g., "30 min", "2 hours", "1 week")

2. **skills** - Array of 3-4 skills they'll develop (be specific, not generic)

3. **tools** - Array of 2-3 FREE tools they'll use (real tool names with brief purpose)

Make steps progressively build toward the money goal. Step 5 should be about making the first sale/earning.

Respond with JSON only (no markdown):
{
  "steps": [
    { "order": 1, "title": "string", "description": "string", "timeEstimate": "string" }
  ],
  "skills": ["string"],
  "tools": ["string"]
}`;

    const responseText = await generateText({
      prompt,
      maxTokens: 1500,
      temperature: 1,
    });

    console.log('AI details response length:', responseText.length);

    // Parse the response
    let details: PathDetails;
    try {
      details = JSON.parse(responseText);

      if (!Array.isArray(details.steps) || details.steps.length !== 5) {
        throw new Error('Expected exactly 5 steps');
      }

      console.log('Successfully parsed path details');
    } catch (parseError) {
      console.error('Failed to parse AI response:', responseText.substring(0, 500));
      throw new Error('AI generated invalid response format');
    }

    return NextResponse.json({
      success: true,
      details,
    });
  } catch (error: any) {
    console.error('Generate path details error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate path details' },
      { status: 500 }
    );
  }
}
