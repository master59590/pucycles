import { redirect } from "next/navigation";
import { OrderDetail } from "@/components/order-detail";
import { getCustomerSession } from "@/lib/auth/customer";

export default async function OrderDetailRoute({ params }: { params: Promise<{ orderNumber: string }> }) {
  const session = await getCustomerSession();
  const { orderNumber } = await params;
  if (!session.user) redirect(`/login?next=/orders/${encodeURIComponent(orderNumber)}`);
  return <OrderDetail orderNumber={orderNumber} user={session.user} isAdmin={session.isAdmin} />;
}
