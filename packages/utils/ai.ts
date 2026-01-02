interface GeneratedTask {
    title: string;
    description: string;
    suggestedEvidence: string;
    estimatedHours: number;
}

interface AITaskGenerationResult {
    tasks: GeneratedTask[];
    projectSummary: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export function parseAITaskResponse(aiResponse: string): AITaskGenerationResult {
    try {

        const cleanedResponse = aiResponse.replace(/```json\n|```/g, '').trim();       
        const parsed = JSON.parse(cleanedResponse);
        return parsed;
    } catch (error) {
        console.error('Error parsing AI task response:', error);
        console.error('Raw response:', aiResponse);
        throw new Error('Failed to parse AI task response. Please try again.');
    }
}

export function validateGeneratedTasks(result: AITaskGenerationResult): boolean {
    if (!result.tasks || !Array.isArray(result.tasks)) {
        return false;
    }
    if (result.tasks.length < 3 || result.tasks.length > 10) {
        return false;
    }
    return result.tasks.every(task => 
        task.title && task.description && task.suggestedEvidence && typeof task.estimatedHours === 'number');
}

export const PROJECT_CATEGORIES = [
    'Coding & Software',
    'Robotics & Hardware',
    'Art & Design',
    'Music & Audio',
    'Writing & Content',
    'Business & Entrepreneurship',
    'Science & Research',
    'Social Impact',
    'Other',
] as const;

export type ProjectCategory = (typeof PROJECT_CATEGORIES)[number];