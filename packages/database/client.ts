import { createClient } from '@supabase/supabase-js';
import { createBrowserClient as createBrowserSupabaseClient } from '@supabase/ssr';

// For client components
export const createBrowserClient = () => {
    return createBrowserSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
};

// For server components (pages, layouts)
export const createServerClient = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    return createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            persistSession: false,
            autoRefreshToken: false
        },
    });
};

// Legacy export for convenience (client-side only)
export const supabase = createBrowserClient();