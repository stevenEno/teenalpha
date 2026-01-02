import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export async function POST(request: NextRequest) {
  try {
    const { title, description, category, grade } = await request.json();

    // Validate inputs
    if (!title || !description) {
      return NextResponse.json(
        { error: 'Title and description are required' },
        { status: 400 }
      );
    }

    // Create the prompt for Claude
    const prompt = `You are an expert mentor helping a ${grade ? `grade ${grade}` : 'high school'} student plan an ambitious project.

Project Title: ${title}
Description: ${description}
Category: ${category || 'General'}

Generate a structured project plan with 5-8 tasks that will help this student complete their project successfully. Each task should:
1. Be concrete and actionable
2. Build on previous tasks (progressive complexity)
3. Be achievable in 2-6 hours for a motivated high school student
4. Include clear evidence they can provide to show completion

Respond ONLY with valid JSON in this exact format (no markdown, no code blocks):
{
  "projectSummary": "A 2-3 sentence overview of what this project will accomplish",
  "difficulty": "beginner" or "intermediate" or "advanced",
  "tasks": [
    {
      "title": "Short, action-oriented title (5-8 words)",
      "description": "Detailed explanation of what to do, including specific steps and resources. 2-4 sentences.",
      "suggestedEvidence": "What the student should provide as proof (e.g., 'Screenshot of working code', 'Photo of prototype', '2-minute demo video')",
      "estimatedHours": 3
    }
  ]
}

Make the tasks encouraging and specific. Reference real tools, websites, or techniques when relevant. The student is eager to learn but needs clear direction.`;

    // Call Claude API
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      temperature: 1,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    // Extract the text response
    const responseText = message.content
      .filter((block) => block.type === 'text')
      .map((block) => (block as any).text)
      .join('');

    // Parse and validate the response
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse AI response:', responseText);
      return NextResponse.json(
        { error: 'AI generated invalid response. Please try again.' },
        { status: 500 }
      );
    }

    // Validate the structure
    if (
      !parsedResponse.tasks ||
      !Array.isArray(parsedResponse.tasks) ||
      parsedResponse.tasks.length < 3
    ) {
      return NextResponse.json(
        { error: 'AI generated incomplete task list. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: parsedResponse,
    });
  } catch (error: any) {
    console.error('Error generating tasks:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate tasks' },
      { status: 500 }
    );
  }
}