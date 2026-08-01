"use client";

import Image from "next/image";
import Link from "next/link";
import { Camera, CircleUserRound, ExternalLink, LogOut, MapPin, Menu, ShoppingBag, X } from "lucide-react";
import { useState } from "react";
import { countries, getCountry } from "@/data/commerce";
import type { CustomerUser } from "@/lib/auth/customer";
import { useShop } from "@/components/shop-provider";

export function CustomerShell({ children, user }: { children: React.ReactNode; user: CustomerUser | null; isAdmin?: boolean }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { preferences, setPreferences, cartCount } = useShop();
  const country = getCountry(preferences.countryCode);
  const labels = preferences.locale === "th"
    ? { shop: "สินค้า", models: "รุ่นรถ", brands: "แบรนด์", orders: "คำสั่งซื้อ", contact: "ช่องทางติดต่อ", market: "ประเทศจัดส่ง", addressLabel: "ที่อยู่ร้าน", utility: "จัดส่งอะไหล่ทั่วโลก · ราคาทั้งหมดเป็น THB", country: "ประเทศ", signIn: "เข้าสู่ระบบด้วย Google", signOut: "ออกจากระบบ", cart: "ตะกร้า", openMenu: "เปิดเมนู", closeMenu: "ปิดเมนู" }
    : { shop: "Shop", models: "Motorcycles", brands: "Brands", orders: "My orders", contact: "Contact", market: "Delivery country", addressLabel: "Shop address", utility: "Worldwide parts shop · All prices are in THB", country: "Country", signIn: "Sign in with Google", signOut: "Sign out", cart: "Cart", openMenu: "Open menu", closeMenu: "Close menu" };

  return (
    <div className="site-shell">
      <div className="utility-bar">
        <span>{labels.utility}</span>
        <div className="locale-controls">
          <label className="sr-only" htmlFor="site-country">{labels.country}</label>
          <select id="site-country" value={preferences.countryCode} onChange={(event) => setPreferences({ ...preferences, countryCode: event.target.value as typeof preferences.countryCode })}>
            {countries.map((item) => <option key={item.code} value={item.code}>{preferences.locale === "th" ? item.nameTh : item.name}</option>)}
          </select>
          <div className="language-switch" aria-label="Language">
            <button className={preferences.locale === "en" ? "active" : ""} onClick={() => setPreferences({ ...preferences, locale: "en" })}>EN</button>
            <button className={preferences.locale === "th" ? "active" : ""} onClick={() => setPreferences({ ...preferences, locale: "th" })}>TH</button>
          </div>
        </div>
      </div>

      <header className="main-header">
        <Link className="brand-mark" href="/" aria-label="PUCYCLES home">
          <Image src="/pucycles-logo.jpg" alt="PUCYCLES" width={62} height={62} priority />
          <span>PUCYCLES<small>Custom Bike Parts</small></span>
        </Link>
        <nav className="desktop-nav" aria-label="Main navigation">
          <Link href="/products">{labels.shop}</Link>
          <Link href="/products?view=models">{labels.models}</Link>
          <Link href="/products?view=brands">{labels.brands}</Link>
          <Link href="/#contact">{labels.contact}</Link>
          <Link href="/orders">{labels.orders}</Link>
        </nav>
        <div className="header-actions">
          {user ? (
            <div className="signed-in-user">
              <span title={user.email}>{user.name}</span>
              <form action="/auth/signout" method="post"><button className="icon-button account-button" aria-label={labels.signOut} title={`${labels.signOut} ${user.email}`}><LogOut /></button></form>
            </div>
          ) : <Link className="icon-button account-button" href="/login" aria-label={labels.signIn} title={labels.signIn}><CircleUserRound /></Link>}
          <Link className="cart-button" href="/cart" aria-label={`${labels.cart}, ${cartCount}`}><ShoppingBag aria-hidden="true" /><span>{cartCount}</span></Link>
          <button className="icon-button mobile-menu" onClick={() => setMenuOpen((open) => !open)} aria-label={menuOpen ? labels.closeMenu : labels.openMenu} aria-expanded={menuOpen}>{menuOpen ? <X /> : <Menu />}</button>
        </div>
      </header>
      {menuOpen && <nav className="mobile-nav" aria-label="Mobile navigation">
        <Link href="/products" onClick={() => setMenuOpen(false)}>{labels.shop}</Link>
        <Link href="/products?view=models" onClick={() => setMenuOpen(false)}>{labels.models}</Link>
        <Link href="/products?view=brands" onClick={() => setMenuOpen(false)}>{labels.brands}</Link>
        <Link href="/#contact" onClick={() => setMenuOpen(false)}>{labels.contact}</Link>
        <Link href="/orders" onClick={() => setMenuOpen(false)}>{labels.orders}</Link>
        {!user && <Link href="/login">{labels.signIn}</Link>}
      </nav>}

      {children}

      <footer className="site-footer" id="contact">
        <div className="site-footer-main">
          <div className="site-footer-brand">
            <Image src="/pucycles-logo.jpg" alt="PUCYCLES" width={64} height={64} />
            <div><strong>PUCYCLES</strong><span>LIVE TO RIDE · RIDE TO LIVE</span></div>
          </div>
          <nav className="footer-contact" aria-label={labels.contact}>
            <span>{labels.contact}</span>
            <a href="https://www.instagram.com/pucycles" target="_blank" rel="noopener noreferrer"><Camera aria-hidden="true" /><div><strong>Instagram</strong><small>@pucycles</small></div><ExternalLink aria-hidden="true" /></a>
            <a href="https://www.facebook.com/Pucyclescustom" target="_blank" rel="noopener noreferrer"><span className="footer-facebook-icon" aria-hidden="true">f</span><div><strong>Facebook</strong><small>PUCYCLES Custom</small></div><ExternalLink aria-hidden="true" /></a>
          </nav>
          <address className="footer-address"><span>{labels.addressLabel}</span><div><MapPin aria-hidden="true" /><p>14/6 หมู่ที่ 5 ตำบลเบิกไพร<br />อำเภอบ้านโป่ง จังหวัดราชบุรี 70110</p></div></address>
          <nav className="footer-policies" aria-label="Shop policies"><span>{preferences.locale === "th" ? "ข้อมูลร้านค้า" : "Shop information"}</span><Link href="/policies#shipping">{preferences.locale === "th" ? "การจัดส่ง" : "Shipping"}</Link><Link href="/policies#returns">{preferences.locale === "th" ? "การคืนสินค้า" : "Returns"}</Link><Link href="/policies#warranty">{preferences.locale === "th" ? "การรับประกัน" : "Warranty"}</Link><Link href="/policies#privacy">{preferences.locale === "th" ? "ความเป็นส่วนตัว" : "Privacy"}</Link><Link href="/policies#terms">{preferences.locale === "th" ? "เงื่อนไขการขาย" : "Terms"}</Link></nav>
        </div>
        <div className="site-footer-bottom"><span>© PUCYCLES Custom Bike Parts</span><span><small>{labels.market}</small>{preferences.locale === "th" ? country.nameTh : country.name}</span></div>
      </footer>
    </div>
  );
}
