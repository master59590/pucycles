import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { adminOrderStatusCopy } from "@/data/admin";
import type { AdminOrder } from "@/lib/admin-orders";

export function AdminOrderTable({ orders, limit }: { orders: AdminOrder[]; limit?: number }) {
  const rows = limit ? orders.slice(0, limit) : orders;

  return (
    <div className="admin-table-wrap">
      <table className="admin-table">
        <thead><tr><th>คำสั่งซื้อ</th><th>ลูกค้า</th><th>ประเทศ</th><th>ยอดรวม</th><th>สถานะ</th><th>วันที่</th><th><span className="sr-only">เปิด</span></th></tr></thead>
        <tbody>
          {rows.map((order) => (
            <tr key={order.id}>
              <td><strong>{order.orderNumber}</strong></td>
              <td>{order.customer}</td>
              <td>{order.country}</td>
              <td>{order.totalThb === null ? "รอค่าจัดส่ง" : `THB ${order.totalThb.toLocaleString("th-TH")}`}</td>
              <td><span className={`admin-status ${order.status}`}>{adminOrderStatusCopy[order.status]}</span></td>
              <td>{new Date(order.createdAt).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" })}</td>
              <td><Link className="table-icon-button" href={`/admin/orders?order=${order.id}`} aria-label={`เปิดคำสั่งซื้อ ${order.orderNumber}`} title="เปิดคำสั่งซื้อ"><ArrowUpRight /></Link></td>
            </tr>
          ))}
          {!rows.length && <tr><td colSpan={7} className="admin-empty-row">ยังไม่มีคำสั่งซื้อ</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
