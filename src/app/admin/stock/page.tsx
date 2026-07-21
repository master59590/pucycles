import { AdminStockPanel } from "@/components/admin-stock-panel";
import { getAdminProductData } from "@/lib/admin-products";

export default async function AdminStockPage() {
  const { products } = await getAdminProductData();
  return <AdminStockPanel products={products} />;
}
