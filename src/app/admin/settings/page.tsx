import { AdminSettingsPanel } from "@/components/admin-settings-panel";
import { getShippingCarriers } from "@/lib/admin-convenience";
import { getAdminSettings } from "@/lib/admin-operations";
import { getThaiShippingFee } from "@/lib/shop-settings";

export default async function AdminSettingsPage() {
  const [thaiShippingFeeThb, settings, carriers] = await Promise.all([getThaiShippingFee(), getAdminSettings(), getShippingCarriers()]);
  return <AdminSettingsPanel
    thaiShippingFeeThb={thaiShippingFeeThb}
    payment={settings.payment}
    cronConfigured={settings.cronConfigured}
    adminEmail={process.env.ADMIN_LOGIN_EMAIL?.trim() ?? ""}
    lastLoginAt={settings.lastLoginAt}
    lastLoginUserAgent={settings.lastLoginUserAgent}
    carriers={carriers}
  />;
}
