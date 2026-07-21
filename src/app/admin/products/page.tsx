import { AdminProductsPanel } from "@/components/admin-products-panel";
import { getAdminProductData } from "@/lib/admin-products";

export default async function AdminProductsPage() {
  const data = await getAdminProductData();
  return <main><AdminProductsPanel data={data} /></main>;
}
