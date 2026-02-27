import { createBrowserClient } from './client';
import type { Profile } from './types';

export async function signUp(email: string, password: string, userData: {
    full_name: string;
    role: 'teen' | 'mentor' | 'parent' | 'admin';
    grade?: number;
    school?: string;
    bio?: string;
    expertise?: string[];
}, options?: { emailRedirectTo?: string }) {
    const supabase = createBrowserClient();

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: userData, // This gets passed to handle_new_user() function
            emailRedirectTo: options?.emailRedirectTo,
        },
    });
    if (error) throw error;
    return data;
}

export async function signIn(email: string, password: string) {
    const supabase = createBrowserClient();

    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });
    if (error) throw error;
    return data;
}

export async function signOut() {
    const supabase = createBrowserClient();

    const { error } = await supabase.auth.signOut();
    if (error) throw error;
}

export async function getCurrentUser() {
    const supabase = createBrowserClient();

    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
}

export async function getCurrentProfile(): Promise<Profile | null> {
    const supabase = createBrowserClient();

    const {data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    if (error) throw error;
    return data as Profile;
}

export async function resetPassword(email: string) {
    const supabase = createBrowserClient();

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password`,
        });
    if (error) throw error;
}

export async function updatePassword(newPassword: string) {
    const supabase = createBrowserClient();
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
}