"use client";

import Link from "next/link";
import { ArrowUpRight, PackageSearch } from "lucide-react";
import { CustomerShell } from "@/components/customer-shell";
import { useShop } from "@/components/shop-provider";
import { formatMoney, orderStatusCopy } from "@/data/commerce";
import type { CustomerUser } from "@/lib/auth/customer";

const ordersCopy = {
  en: { kicker: "YOUR ACCOUNT", title: "My orders", intro: "Track payment, preparation, and delivery.", loading: "Loading orders...", emptyTitle: "No orders yet", emptyText: "Your completed checkouts will appear here.", browse: "Browse products", items: "items", shippingPending: "Shipping pending" },
  th: { kicker: "บัญชีของคุณ", title: "คำสั่งซื้อของฉัน", intro: "ติดตามการชำระเงิน การจัดเตรียม และการจัดส่ง", loading: "กำลังโหลดคำสั่งซื้อ...", emptyTitle: "ยังไม่มีคำสั่งซื้อ", emptyText: "คำสั่งซื้อที่ยืนยันแล้วจะแสดงที่หน้านี้", browse: "เลือกดูสินค้า", items: "รายการ", shippingPending: "รอตรวจสอบค่าจัดส่ง" },
} as const;

export function OrdersPage({ user, isAdmin }: { user: CustomerUser; isAdmin: boolean }) {
  const { orders, preferences, hydrated, shopError } = useShop();
  const t = ordersCopy[preferences.locale];
  return <CustomerShell user={user} isAdmin={isAdmin}><main className="shop-page"><div className="shop-page-heading"><span className="section-kicker">{t.kicker}</span><h1>{t.title}</h1><p>{t.intro}</p></div>{shopError && <p className="field-error" role="alert">{shopError}</p>}
    {!hydrated ? <div className="shop-loading">{t.loading}</div> : orders.length === 0 ? <div className="shop-empty"><PackageSearch /><h2>{t.emptyTitle}</h2><p>{t.emptyText}</p><Link className="shop-primary-button" href="/products">{t.browse}</Link></div> : <div className="customer-orders">{orders.map((order) => { const total = order.subtotalThb + (order.shippingFeeThb ?? 0); return <Link href={`/orders/${order.orderNumber}`} key={order.orderNumber}><div><span className={`order-status ${order.status}`}>{orderStatusCopy[order.status][preferences.locale]}</span><h2>{order.orderNumber}</h2><p>{new Date(order.createdAt).toLocaleDateString(preferences.locale === "th" ? "th-TH" : "en-GB", { dateStyle: "medium" })} · {order.lines.reduce((sum, line) => sum + line.quantity, 0)} {t.items}</p></div><div><strong>{order.shippingFeeThb === null ? t.shippingPending : formatMoney(total, order.address.countryCode, preferences.locale)}</strong><ArrowUpRight /></div></Link>; })}</div>}
  </main></CustomerShell>;
}
