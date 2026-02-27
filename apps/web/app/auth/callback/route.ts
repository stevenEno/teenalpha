import { CookieOptions, createServerClient } from "@supabase/ssr";
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

    return NextResponse.redirect(new URL(next, request.url));
}
