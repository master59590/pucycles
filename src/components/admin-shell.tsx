"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Boxes, ChevronDown, ExternalLink, LayoutDashboard, LogOut, PackageSearch, Settings, ShoppingCart, Tags, Warehouse } from "lucide-react";
import { useState } from "react";

const navigation = [
  { href: "/admin", label: "ภาพรวม", icon: LayoutDashboard },
  { href: "/admin/orders", label: "คำสั่งซื้อ", icon: ShoppingCart },
];

const productNavigation = [
  { href: "/admin/products", label: "รายการสินค้า", icon: Boxes },
  { href: "/admin/catalog", label: "ข้อมูลสินค้า", icon: Tags },
  { href: "/admin/stock", label: "สต็อก", icon: Warehouse },
];

export function AdminShell({ children, user }: { children: React.ReactNode; user: { name: string; email: string } }) {
  const pathname = usePathname();
  const productSectionActive = productNavigation.some(({ href }) => pathname.startsWith(href));
  const [productOpen, setProductOpen] = useState(productSectionActive);

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Link className="admin-brand" href="/admin">
          <Image src="/pucycles-logo.jpg" alt="PUCYCLES" width={52} height={52} priority />
          <span>PUCYCLES<small>ADMIN</small></span>
        </Link>
        <nav aria-label="เมนูผู้ดูแลระบบ">
          {navigation.map(({ href, label, icon: Icon }) => {
            const active = href === "/admin" ? pathname === href : pathname.startsWith(href);
            return <Link key={href} href={href} className={active ? "active" : ""}><Icon aria-hidden="true" />{label}</Link>;
          })}
          <div className={`admin-nav-group ${productOpen ? "open" : ""}`}>
            <button type="button" className={productSectionActive ? "active" : ""} onClick={() => setProductOpen((current) => !current)} aria-expanded={productOpen}>
              <Boxes aria-hidden="true" />สินค้า<ChevronDown className="admin-nav-chevron" aria-hidden="true" />
            </button>
            <div className="admin-nav-submenu">
              {productNavigation.map(({ href, label, icon: Icon }) => <Link key={href} href={href} className={pathname.startsWith(href) ? "active" : ""}><Icon aria-hidden="true" />{label}</Link>)}
            </div>
          </div>
          <Link href="/admin/settings" className={pathname.startsWith("/admin/settings") ? "active" : ""}><Settings aria-hidden="true" />ตั้งค่า</Link>
        </nav>
        <div className="admin-sidebar-footer">
          <Link href="/"><ExternalLink aria-hidden="true" />เปิดหน้าร้าน</Link>
          <form action="/admin/signout" method="post"><button><LogOut aria-hidden="true" />ออกจากระบบ</button></form>
        </div>
      </aside>

      <div className="admin-workspace">
        <header className="admin-topbar">
          <div><PackageSearch aria-hidden="true" /><span>ระบบจัดการร้านค้า</span></div>
          <div className="admin-user"><span>{user.name}<small>{user.email}</small></span><strong>{user.name.charAt(0).toUpperCase()}</strong></div>
        </header>
        <div className="admin-content">{children}</div>
      </div>
    </div>
  );
}
