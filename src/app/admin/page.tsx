import Link from "next/link";
import { ArrowRight, CircleDollarSign, Clock3, PackageCheck, TriangleAlert } from "lucide-react";
import { AdminOrderTable } from "@/components/admin-order-table";
import { getAdminOrders } from "@/lib/admin-orders";
import { getCatalogProducts } from "@/lib/catalog";

export default async function AdminDashboard() {
  const [products, orders] = await Promise.all([getCatalogProducts(), getAdminOrders()]);
  const lowStock = products.filter((product) => product.stock <= 2).length;
  const count = (status: string) => orders.filter((order) => order.status === status).length;
  const today = new Intl.DateTimeFormat("th-TH", { dateStyle: "full", timeZone: "Asia/Bangkok" }).format(new Date());

  return (
    <main>
      <div className="admin-page-heading"><div><span>ภาพรวม</span><h1>แดชบอร์ด</h1><p>{today}</p></div></div>
      <section className="admin-metrics" aria-label="สรุปข้อมูลร้านค้า">
        <Link href="/admin/orders?status=shipping_quote"><article><div><span>รอแจ้งค่าจัดส่ง</span><strong>{count("shipping_quote")}</strong><small>ต้องดำเนินการ</small></div><Clock3 /></article></Link>
        <Link href="/admin/orders?status=payment_submitted"><article><div><span>รอตรวจสอบสลิป</span><strong>{count("payment_submitted")}</strong><small>มีหลักฐานรอตรวจ</small></div><CircleDollarSign /></article></Link>
        <Link href="/admin/orders?status=paid"><article><div><span>รอเตรียมสินค้า</span><strong>{count("paid") + count("preparing")}</strong><small>พร้อมจัดเตรียมและแพ็ก</small></div><PackageCheck /></article></Link>
        <Link href="/admin/stock"><article><div><span>สต็อกต้องตรวจสอบ</span><strong>{lowStock}</strong><small>เหลือน้อยหรือหมด</small></div><TriangleAlert /></article></Link>
      </section>
      <section className="admin-section">
        <div className="admin-section-heading"><div><h2>คำสั่งซื้อล่าสุด</h2><p>รายการล่าสุดจากลูกค้าทุกประเทศ</p></div><Link href="/admin/orders">ดูทั้งหมด <ArrowRight /></Link></div>
        <AdminOrderTable orders={orders} limit={5} />
      </section>
    </main>
  );
}
