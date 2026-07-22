"use client";

import Link from "next/link";
import { ArrowUpRight, PackageSearch } from "lucide-react";
import { CustomerShell } from "@/components/customer-shell";
import { useShop } from "@/components/shop-provider";
import { formatMoney, orderStatusCopy } from "@/data/commerce";
import type { CustomerUser } from "@/lib/auth/customer";

export function OrdersPage({ user, isAdmin }: { user: CustomerUser; isAdmin: boolean }) {
  const { orders, preferences, hydrated, shopError } = useShop();
  return <CustomerShell user={user} isAdmin={isAdmin}><main className="shop-page"><div className="shop-page-heading"><span className="section-kicker">YOUR ACCOUNT</span><h1>My orders</h1><p>Track payment, preparation, and delivery.</p></div>{shopError && <p className="field-error" role="alert">{shopError}</p>}
    {!hydrated ? <div className="shop-loading">Loading orders...</div> : orders.length === 0 ? <div className="shop-empty"><PackageSearch /><h2>No orders yet</h2><p>Your completed checkouts will appear here.</p><Link className="shop-primary-button" href="/products">Browse products</Link></div> : <div className="customer-orders">{orders.map((order) => { const total = order.subtotalThb + (order.shippingFeeThb ?? 0); return <Link href={`/orders/${order.orderNumber}`} key={order.orderNumber}><div><span className={`order-status ${order.status}`}>{orderStatusCopy[order.status][preferences.locale]}</span><h2>{order.orderNumber}</h2><p>{new Date(order.createdAt).toLocaleDateString(preferences.locale === "th" ? "th-TH" : "en-GB", { dateStyle: "medium" })} · {order.lines.reduce((sum, line) => sum + line.quantity, 0)} items</p></div><div><strong>{order.shippingFeeThb === null ? "Shipping pending" : formatMoney(total, order.address.countryCode, preferences.locale, order.exchangeRate)}</strong><ArrowUpRight /></div></Link>; })}</div>}
  </main></CustomerShell>;
}
