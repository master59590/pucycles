import { Storefront } from "@/components/storefront";
import { getCustomerSession } from "@/lib/auth/customer";

export default async function ProductsPage() {
  const session = await getCustomerSession();
  return <Storefront {...session} showHero={false} />;
}
