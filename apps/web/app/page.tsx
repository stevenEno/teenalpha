import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export default async function HomePage() {
    const cookieStore = cookies();

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                async get(name: string) {
                    return (await cookieStore).get(name)?.value;
                },
            },
        }
    );
    const { data: { user }} = await supabase.auth.getUser();

    if (user) {
        redirect('/dashboard');
    }

    // All unauthenticated users go to the explore flow
    redirect('/explore');
}
