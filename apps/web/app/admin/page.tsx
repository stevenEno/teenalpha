import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { Header } from "@/components/layout/Header";
import { AdminDashboard } from "@/components/admin/AdminDashboard";

export const metadata = {
  title: "Admin Dashboard - Teen Alpha",
  description: "Admin overview and analytics",
};

export default async function AdminPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'admin') {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header profile={profile} />
      <AdminDashboard />
    </div>
  );
}
