"use client";

import { CustomerShell } from "@/components/customer-shell";
import { useShop } from "@/components/shop-provider";
import { POLICY_VERSION, policySections } from "@/data/policies";
import type { CustomerUser } from "@/lib/auth/customer";

export function CustomerPolicies({ user }: { user: CustomerUser | null }) {
  const { preferences } = useShop();
  const thai = preferences.locale === "th";
  return <CustomerShell user={user}><main className="shop-page policy-page">
    <div className="shop-page-heading"><span className="section-kicker">PUCYCLES POLICIES</span><h1>{thai ? "นโยบายร้านค้า" : "Shop policies"}</h1><p>{thai ? "ข้อมูลการจัดส่ง การคืนสินค้า การรับประกัน ความเป็นส่วนตัว และเงื่อนไขการขาย" : "Shipping, returns, warranty, privacy, and terms of sale."}</p></div>
    <nav aria-label="Policy sections">{policySections.map((section) => <a key={section.id} href={`#${section.id}`}>{thai ? section.titleTh : section.title}</a>)}</nav>
    <div className="policy-sections">{policySections.map((section) => <section id={section.id} key={section.id}><span>{section.id.toUpperCase()}</span><h2>{thai ? section.titleTh : section.title}</h2>{(thai ? section.bodyTh : section.body).map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</section>)}</div>
    <p className="policy-version">{thai ? "ปรับปรุงล่าสุด" : "Last updated"}: {POLICY_VERSION}</p>
  </main></CustomerShell>;
}
