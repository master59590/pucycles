import { AdminNotificationsPanel } from "@/components/admin-notifications-panel";
import { getAdminNotifications } from "@/lib/admin-operations";

export default async function AdminNotificationsPage() {
  return <AdminNotificationsPanel notifications={await getAdminNotifications()} />;
}
