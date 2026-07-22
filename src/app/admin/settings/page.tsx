import { AdminSettingsPanel } from "@/components/admin-settings-panel";
import { getThaiShippingFee } from "@/lib/shop-settings";

export default async function AdminSettingsPage() {
  const thaiShippingFeeThb = await getThaiShippingFee();
  return <AdminSettingsPanel thaiShippingFeeThb={thaiShippingFeeThb} />;
}
