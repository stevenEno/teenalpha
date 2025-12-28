export interface Profile {
id: string;
role: 'teen' | 'mentor' | 'parent' | 'admin';
full_name: string;
email: string;
phone: string;
address: string;
city: string;
state: string;
zip: string;
created_at: string;
updated_at: string;
}

export interface Project {
id: string;
teen_id: string;
title: string;
description: string;
status: 'active' | 'completed' | 'archived';
created_at: string;
}

export interface Task {
id: string;
project_id: string;
title: string;
description: string;
status: 'todo' | 'in_progress' | 'done';
order_index: number;
created_at: string;
}
