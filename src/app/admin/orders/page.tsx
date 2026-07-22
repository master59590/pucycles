import { AdminOrdersPanel } from "@/components/admin-orders-panel";
import { getShippingCarriers } from "@/lib/admin-convenience";
import { getAdminOrders } from "@/lib/admin-orders";
import { getAdminOrderActivity } from "@/lib/admin-operations";

export default async function AdminOrdersPage({ searchParams }: { searchParams: Promise<{ order?: string; status?: string }> }) {
  const [orders, activity, carriers, params] = await Promise.all([getAdminOrders(), getAdminOrderActivity(), getShippingCarriers(), searchParams]);
  return (
    <main>
      <div className="admin-page-heading"><div><span>การขาย</span><h1>คำสั่งซื้อ</h1><p>ตรวจสอบค่าจัดส่ง การชำระเงิน และการจัดส่งสินค้า</p></div></div>
      <AdminOrdersPanel orders={orders} events={activity.events} refunds={activity.refunds} carriers={carriers.filter((carrier) => carrier.isActive)} initialOrderId={params.order} initialStatus={params.status} />
    </main>
  );
}
