import { supabase } from './client';
import type { Profile, Project, Task } from './types';

// Profile queries
export async function getProfile(userId: string) {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (error) throw error;
    return data as Profile;
}

export async function updateProfile(userId: string, updates: Partial<Profile>) {
    const { data, error } = await supabase.from('profiles').update(updates).eq('id', userId).select().single();
    if (error) throw error;
    return data as Profile;
}

export async function getMentorProfiles() {
    const { data, error } = await supabase.from('profiles').select('*').eq('role', 'mentor');
    if (error) throw error;
    return data as Profile[];
}

//Projects
export async function getProjects(teenId: string) {
    const { data, error } = await supabase.from('projects').select('*').eq('teen_id', teenId).order('created_at', { ascending: false });
    if (error) throw error;
    return data as Project[];
}

export async function getProject(projectId: string) {
    const { data, error } = await supabase.from('projects').select('*, tasks(*)').eq('id', projectId).single();
    if (error) throw error;
    return data;
}

export async function createProject(project: {
    teen_id: string;
    title: string;
    description: string;
    category: string;
    ai_generated: boolean;
    ai_prompt: string;
}) {
    const { data, error } = await supabase.from('projects').insert(project).select().single();
    if (error) throw error;
    return data as Project;
}

export async function updateProject(projectId: string, updates: Partial<Project>) {
    const { data, error } = await supabase.from('projects').update(updates).eq('id', projectId).select().single();
    if (error) throw error;
    return data as Project;
}

export async function deleteProject(projectId: string) {
    const { error } = await supabase.from('projects').delete().eq('id', projectId);
    if (error) throw error;
}

//Tasks
export async function getTasks(projectId: string) {
    const { data, error } = await supabase.from('tasks').select('*').eq('project_id', projectId).order('order_index', { ascending: true });
    if (error) throw error;
    return data as Task[];
}

export async function createTask(task: {
    project_id: string;
    title: string;
    description?: string;
    status?: 'todo' | 'in_progress' | 'done';
    order_index: number;
    ai_generated: boolean;
    suggested_evidence?: string;
}) {
    const { data, error } = await supabase.from('tasks').insert(task).select().single();
    if (error) throw error;
    return data as Task;
}

export async function updateTask(taskId: string, updates: Partial<Task>) {
    const { data, error } = await supabase.from('tasks').update(updates).eq('id', taskId).select().single();
    if (error) throw error;
    return data as Task;
}

export async function deleteTask(taskId: string) {
    const { error } = await supabase.from('tasks').delete().eq('id', taskId);
    if (error) throw error;
}

//Storage of evidence files
export async function uploadEvidenceFile(file: File, projectId: string, taskId: string) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${projectId}/${taskId}/${Date.now()}.${fileExt}`;

    const { data, error } = await supabase.storage.from('evidence').upload(fileName, file);
    if (error) throw error;

    // Get public URL
    const { data: urlData } = supabase.storage.from('evidence').getPublicUrl(fileName);
    return urlData.publicUrl;
}

export async function deleteEvidenceFile(filePath: string) {
    const { error } = await supabase.storage.from('evidence').remove([filePath]);
    if (error) throw error;
}