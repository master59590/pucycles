import type { Metadata } from "next";
import { AdminLogin } from "@/components/admin-login";
import { AdminShell } from "@/components/admin-shell";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Admin Dashboard",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const adminEmail = process.env.ADMIN_LOGIN_EMAIL?.trim().toLowerCase();
  const { data: profile } = user
    ? await supabase.from("profiles").select("role").eq("id", user.id).single()
    : { data: null };

  if (!user || !adminEmail || user.app_metadata.provider !== "email" || user.email?.toLowerCase() !== adminEmail || profile?.role !== "admin") return <AdminLogin />;

  return (
    <AdminShell user={{
      email: user.email ?? "",
      name: user.user_metadata.full_name ?? user.user_metadata.name ?? "เจ้าของร้าน",
    }}>
      {children}
    </AdminShell>
  );
}
