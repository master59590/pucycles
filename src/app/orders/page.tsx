import { redirect } from "next/navigation";
import { OrdersPage } from "@/components/orders-page";
import { getCustomerSession } from "@/lib/auth/customer";

export default async function OrdersRoute() {
  const session = await getCustomerSession();
  if (!session.user) redirect("/login?next=/orders");
  return <OrdersPage user={session.user} isAdmin={session.isAdmin} />;
}
