import { redirect } from "next/navigation";
import { CheckoutForm } from "@/components/checkout-form";
import { getCustomerSession } from "@/lib/auth/customer";
import { getSavedAddress } from "@/lib/saved-address";

export default async function CheckoutPage() {
  const session = await getCustomerSession();
  if (!session.user) redirect("/login?next=/checkout");
  const savedAddress = await getSavedAddress();
  return <CheckoutForm user={session.user} isAdmin={session.isAdmin} savedAddress={savedAddress} />;
}
