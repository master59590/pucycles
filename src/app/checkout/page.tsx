import { redirect } from "next/navigation";
import { CheckoutForm } from "@/components/checkout-form";
import { getCustomerSession } from "@/lib/auth/customer";
import { getSavedAddress } from "@/lib/saved-address";
import { getThaiShippingFee } from "@/lib/shop-settings";

export default async function CheckoutPage() {
  const session = await getCustomerSession();
  if (!session.user) redirect("/login?next=/checkout");
  const [savedAddress, thaiShippingFeeThb] = await Promise.all([getSavedAddress(), getThaiShippingFee()]);
  return <CheckoutForm user={session.user} isAdmin={session.isAdmin} savedAddress={savedAddress} thaiShippingFeeThb={thaiShippingFeeThb} />;
}
