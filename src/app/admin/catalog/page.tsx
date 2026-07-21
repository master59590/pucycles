import { AdminCatalogPanel } from "@/components/admin-catalog-panel";
import { getCatalogTaxonomy } from "@/lib/catalog-taxonomy";

export default async function AdminCatalogPage() {
  const data = await getCatalogTaxonomy();
  return <AdminCatalogPanel {...data} />;
}
