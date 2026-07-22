import { AdminLogin } from "@/components/admin-login";
import { AdminShell } from "@/components/admin-shell";
import { createClient } from "@/lib/supabase/server";
import { getUnreadAdminNotificationCount } from "@/lib/admin-operations";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const adminEmail = process.env.ADMIN_LOGIN_EMAIL?.trim().toLowerCase();
  const { data: profile } = user
    ? await supabase.from("profiles").select("role").eq("id", user.id).single()
    : { data: null };

  if (!user || !adminEmail || user.app_metadata.provider !== "email" || user.email?.toLowerCase() !== adminEmail || profile?.role !== "admin") return <AdminLogin />;

  const unreadNotifications = await getUnreadAdminNotificationCount();

  return (
    <AdminShell user={{
      email: user.email ?? "",
      name: user.user_metadata.full_name ?? user.user_metadata.name ?? "เจ้าของร้าน",
    }} unreadNotifications={unreadNotifications}>
      {children}
    </AdminShell>
  );
}
