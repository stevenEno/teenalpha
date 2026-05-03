import { CookieOptions, createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get("code");
    const next = requestUrl.searchParams.get("next") || "/onboarding";

    if (!code) {
        return NextResponse.redirect(
            new URL("/login?error=missing_code", request.url)
        );
    }

    const cookieStore = cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                async get(name: string) {
                    return (await cookieStore).get(name)?.value;
                },
                async set(name: string, value: string, options: CookieOptions) {
                    (await cookieStore).set(name, value, options);
                },
                async remove(name: string, options: CookieOptions) {
                    (await cookieStore).delete(name);
                },
            },
        }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
        return NextResponse.redirect(
            new URL("/login?error=confirmation_failed", request.url)
        );
    }

    // Server-side guest data sync: if the new user came from /explore, their
    // guest session data is in the DB (guest_onboarding_sessions). The visitor_id
    // cookie (set by guest-storage.ts) lets us find it even when email verification
    // opened in a new tab where localStorage is empty.
    try {
        const { data: { user } } = await supabase.auth.getUser();
        const visitorId = (await cookieStore).get('ta_visitor_id')?.value;

        if (user && visitorId) {
            const admin = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.SUPABASE_SERVICE_ROLE_KEY!
            );

            // Check if user already has projects (sync already happened)
            const { count: projectCount } = await admin
                .from('projects')
                .select('*', { count: 'exact', head: true })
                .eq('teen_id', user.id);

            if ((projectCount ?? 0) === 0) {
                // Find the guest session by visitor_id
                const { data: session } = await admin
                    .from('guest_onboarding_sessions')
                    .select('*')
                    .eq('visitor_id', visitorId)
                    .not('paths_generated', 'is', null)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .maybeSingle();

                if (session?.paths_generated) {
                    const paths = session.paths_generated as Array<{
                        id: string;
                        name: string;
                        icon: string;
                        tagline: string;
                        connection: string;
                        moneyPath: string;
                        steps: Array<{ order: number; title: string; description: string; timeEstimate: string }>;
                    }>;
                    const selectedIndex = session.selected_path_index ?? 0;
                    const selectedPath = paths[selectedIndex];

                    if (selectedPath) {
                        // Update profile with onboarding interest
                        await admin
                            .from('profiles')
                            .update({
                                onboarding_interest: session.interest,
                                onboarding_completed_at: new Date().toISOString(),
                            })
                            .eq('id', user.id);

                        // Create project from the selected path
                        const projectTitle = `${selectedPath.icon || ''} ${selectedPath.name}`.trim();
                        const projectDesc = `${selectedPath.tagline}\n\n${selectedPath.connection}\n\nGoal: ${selectedPath.moneyPath}`;

                        const { data: project } = await admin
                            .from('projects')
                            .insert({
                                teen_id: user.id,
                                title: projectTitle,
                                description: projectDesc,
                                category: 'explore',
                                status: 'active',
                                ai_generated: true,
                                ai_prompt: `Generated from explore flow with interest: ${session.interest}`,
                        money_path: selectedPath.moneyPath || null,
                            })
                            .select()
                            .single();

                        if (project && selectedPath.steps) {
                            await admin.from('tasks').insert(
                                selectedPath.steps.map((step, idx) => ({
                                    project_id: project.id,
                                    title: step.title,
                                    description: `${step.description}\n\nEstimated time: ${step.timeEstimate}`,
                                    status: 'todo',
                                    order_index: step.order ?? idx,
                                    ai_generated: true,
                                    suggested_evidence:
                                        idx === selectedPath.steps.length - 1
                                            ? 'Screenshot of your first dollar earned!'
                                            : null,
                                }))
                            );
                        }

                        // Link the guest session to this user
                        await admin
                            .from('guest_onboarding_sessions')
                            .update({
                                selected_path_index: selectedIndex,
                                converted_user_id: user.id,
                            })
                            .eq('id', session.id);
                    }
                }
            }
        }
    } catch (syncError) {
        // Non-blocking: if server-side sync fails, GuestDataSyncer on the
        // client side will still try from localStorage (if available).
        console.error('Server-side guest sync failed (non-blocking):', syncError);
    }

    return NextResponse.redirect(new URL(next, request.url));
}
