import { CartPage } from "@/components/cart-page";
import { getCustomerSession } from "@/lib/auth/customer";
import { getThaiShippingFee } from "@/lib/shop-settings";

export default async function CartRoute() {
  const [session, thaiShippingFeeThb] = await Promise.all([getCustomerSession(), getThaiShippingFee()]);
  return <CartPage {...session} thaiShippingFeeThb={thaiShippingFeeThb} />;
}
