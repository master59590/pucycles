import { AdminStockPanel } from "@/components/admin-stock-panel";
import { getStockMovements } from "@/lib/admin-convenience";
import { getAdminProductData } from "@/lib/admin-products";

export default async function AdminStockPage() {
  const [{ products }, movements] = await Promise.all([getAdminProductData(), getStockMovements()]);
  return <AdminStockPanel products={products} movements={movements} />;
}
