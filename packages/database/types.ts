export interface Profile {
id: string;
role: 'teen' | 'mentor' | 'parent' | 'admin';
full_name: string | null;
email: string | null;
avatar_url: string | null;

// Teen fields
grade: number | null;
school: string | null;
bio: string | null;

//Mentor fields
expertise: string[] | null;
max_mentees: number | null;
linkedin_url: string | null;


created_at: string;
updated_at: string;
}

export interface Project {
id: string;
teen_id: string;
title: string;
description: string;
category: string | null;
status: 'active' | 'completed' | 'archived';
ai_generated: boolean;
ai_prompt: string | null;
created_at: string;
updated_at: string;
completed_at: string | null;
}

export interface Task {
id: string;
project_id: string;
title: string;
description: string | null;
status: 'todo' | 'in_progress' | 'done';
order_index: number;
evidence_url: string | null;
evidence_type: string | null;
evidence_description: string | null;
ai_generated: boolean;
suggested_evidence: string | null;
created_at: string;
updated_at: string;
completed_at: string | null;
}

export interface Mentorship {
    id: string;
    mentor_id: string;
    teen_id: string;
    status: 'pending' | 'active' | 'completed' | 'declined';
    invited_by: string | null;
    invitation_message: string | null;
    created_at: string;
    accepted_at: string | null;
    completed_at: string | null;
}

export interface FamilyConnection {
    id: string;
    parent_id: string;
    teen_id: string;
    relationship: string | null;
    verified: boolean;
    created_at: string;
    verified_at: string | null;
}

export interface Comment {
    id: string;
    project_id: string | null;
    task_id: string | null;
    author_id: string;
    content: string;
    created_at: string;
    updated_at: string;
}

export interface ProjectWithTasks extends Project {
    tasks: Task[];
}

export interface MentorshipWithProfiles extends Mentorship {
    mentor: Profile;
    teen: Profile;
}