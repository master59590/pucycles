"use client";

import { Bell, CheckCheck, ExternalLink, PackageSearch } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { AdminNotification } from "@/lib/admin-operations";
import { createClient } from "@/lib/supabase/client";

export function AdminNotificationsPanel({ notifications }: { notifications: AdminNotification[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const openNotification = async (notification: AdminNotification) => {
    setError("");
    if (!notification.isRead) {
      const { error: readError } = await createClient().rpc("admin_mark_notification_read", { p_notification_id: notification.id });
      if (readError) return setError(readError.message);
    }
    if (notification.orderId) router.push(`/admin/orders?order=${notification.orderId}`);
    else router.refresh();
  };

  const markAllRead = async () => {
    setBusy(true);
    setError("");
    const { error: readError } = await createClient().rpc("admin_mark_all_notifications_read");
    setBusy(false);
    if (readError) return setError(readError.message);
    router.refresh();
  };

  return <main>
    <div className="admin-page-heading admin-heading-actions"><div><span>งานที่ต้องติดตาม</span><h1>การแจ้งเตือน</h1><p>เหตุการณ์สำคัญจากคำสั่งซื้อและสต็อกสินค้า</p></div><button className="admin-secondary-button" disabled={busy || !notifications.some((item) => !item.isRead)} onClick={() => void markAllRead()}><CheckCheck />อ่านทั้งหมดแล้ว</button></div>
    {error && <p className="admin-action-message error" role="alert">{error}</p>}
    <section className="admin-notification-list">
      {notifications.map((notification) => <button type="button" key={notification.id} className={notification.isRead ? "read" : "unread"} onClick={() => void openNotification(notification)}>
        <span className="admin-notification-icon">{notification.orderId ? <PackageSearch /> : <Bell />}</span>
        <span><strong>{notification.title}</strong><small>{notification.body}</small><time>{new Date(notification.createdAt).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" })}</time></span>
        {notification.orderId && <ExternalLink />}
      </button>)}
      {!notifications.length && <div className="admin-empty-state"><Bell /><strong>ยังไม่มีการแจ้งเตือน</strong><span>เหตุการณ์ใหม่จากออเดอร์และสต็อกจะแสดงที่นี่</span></div>}
    </section>
  </main>;
}
