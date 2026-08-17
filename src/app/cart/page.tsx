import type { Metadata } from "next";
import { CartPage } from "@/components/cart-page";
import { getCustomerSession } from "@/lib/auth/customer";
import { getThaiShippingFee } from "@/lib/shop-settings";

export const metadata: Metadata = {
  title: "Shopping Cart",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function CartRoute() {
  const [session, thaiShippingFeeThb] = await Promise.all([getCustomerSession(), getThaiShippingFee()]);
  return <CartPage {...session} thaiShippingFeeThb={thaiShippingFeeThb} />;
}
