"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Boxes, ExternalLink, LayoutDashboard, LogOut, PackageSearch, Settings, ShoppingCart, Tags, Warehouse } from "lucide-react";

const navigation = [
  { href: "/admin", label: "ภาพรวม", icon: LayoutDashboard },
  { href: "/admin/orders", label: "คำสั่งซื้อ", icon: ShoppingCart },
  { href: "/admin/products", label: "สินค้า", icon: Boxes },
  { href: "/admin/catalog", label: "ข้อมูลสินค้า", icon: Tags },
  { href: "/admin/stock", label: "สต็อก", icon: Warehouse },
  { href: "/admin/settings", label: "ตั้งค่า", icon: Settings },
];

export function AdminShell({ children, user }: { children: React.ReactNode; user: { name: string; email: string } }) {
  const pathname = usePathname();

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
