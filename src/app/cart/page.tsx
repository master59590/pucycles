import { CartPage } from "@/components/cart-page";
import { getCustomerSession } from "@/lib/auth/customer";

export default async function CartRoute() {
  const session = await getCustomerSession();
  return <CartPage {...session} />;
}
