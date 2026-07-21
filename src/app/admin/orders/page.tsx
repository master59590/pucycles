import { AdminOrdersPanel } from "@/components/admin-orders-panel";
import { getAdminOrders } from "@/lib/admin-orders";

export default async function AdminOrdersPage({ searchParams }: { searchParams: Promise<{ order?: string }> }) {
  const [orders, params] = await Promise.all([getAdminOrders(), searchParams]);
  return (
    <main>
      <div className="admin-page-heading"><div><span>การขาย</span><h1>คำสั่งซื้อ</h1><p>ตรวจสอบค่าจัดส่ง การชำระเงิน และการจัดส่งสินค้า</p></div></div>
      <AdminOrdersPanel orders={orders} initialOrderId={params.order} />
    </main>
  );
}
