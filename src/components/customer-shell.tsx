"use client";

import Image from "next/image";
import Link from "next/link";
import { Camera, CircleUserRound, ExternalLink, LogOut, Menu, MessageCircle, ShoppingBag, X } from "lucide-react";
import { useState } from "react";
import { countries, getCountry } from "@/data/commerce";
import type { CustomerUser } from "@/lib/auth/customer";
import { useShop } from "@/components/shop-provider";

export function CustomerShell({ children, user }: { children: React.ReactNode; user: CustomerUser | null; isAdmin?: boolean }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { preferences, setPreferences, cartCount } = useShop();
  const country = getCountry(preferences.countryCode);
  const labels = preferences.locale === "th"
    ? { shop: "สินค้า", models: "รุ่นรถ", brands: "แบรนด์", orders: "คำสั่งซื้อ", contact: "ช่องทางติดต่อ", market: "ประเทศและสกุลเงิน" }
    : { shop: "Shop", models: "Motorcycles", brands: "Brands", orders: "My orders", contact: "Contact", market: "Country and currency" };

  return (
    <div className="site-shell">
      <div className="utility-bar">
        <span>Worldwide parts shop · Shipping quote confirmed before payment</span>
        <div className="locale-controls">
          <label className="sr-only" htmlFor="site-country">Country</label>
          <select id="site-country" value={preferences.countryCode} onChange={(event) => setPreferences({ ...preferences, countryCode: event.target.value as typeof preferences.countryCode })}>
            {countries.map((item) => <option key={item.code} value={item.code}>{item.name} · {item.currency}</option>)}
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
          <Link href="/orders">{labels.orders}</Link>
        </nav>
        <div className="header-actions">
          {user ? (
            <div className="signed-in-user">
              <span title={user.email}>{user.name}</span>
              <form action="/auth/signout" method="post"><button className="icon-button account-button" aria-label="Sign out" title={`Sign out ${user.email}`}><LogOut /></button></form>
            </div>
          ) : <Link className="icon-button account-button" href="/login" aria-label="Sign in with Google" title="Sign in with Google"><CircleUserRound /></Link>}
          <Link className="cart-button" href="/cart" aria-label={`Cart, ${cartCount} items`}><ShoppingBag aria-hidden="true" /><span>{cartCount}</span></Link>
          <button className="icon-button mobile-menu" onClick={() => setMenuOpen((open) => !open)} aria-label={menuOpen ? "Close menu" : "Open menu"} aria-expanded={menuOpen}>{menuOpen ? <X /> : <Menu />}</button>
        </div>
      </header>
      {menuOpen && <nav className="mobile-nav" aria-label="Mobile navigation">
        <Link href="/products" onClick={() => setMenuOpen(false)}>{labels.shop}</Link>
        <Link href="/products?view=models" onClick={() => setMenuOpen(false)}>{labels.models}</Link>
        <Link href="/products?view=brands" onClick={() => setMenuOpen(false)}>{labels.brands}</Link>
        <Link href="/orders" onClick={() => setMenuOpen(false)}>{labels.orders}</Link>
        {!user && <Link href="/login">Sign in with Google</Link>}
      </nav>}

      {children}

      <footer className="site-footer">
        <div className="site-footer-main">
          <div className="site-footer-brand">
            <Image src="/pucycles-logo.jpg" alt="PUCYCLES" width={64} height={64} />
            <div><strong>PUCYCLES</strong><span>LIVE TO RIDE · RIDE TO LIVE</span></div>
          </div>
          <nav className="footer-contact" aria-label={labels.contact}>
            <span>{labels.contact}</span>
            <a href="https://www.instagram.com/pucycles" target="_blank" rel="noopener noreferrer"><Camera aria-hidden="true" /><div><strong>Instagram</strong><small>@pucycles</small></div><ExternalLink aria-hidden="true" /></a>
            <a href="https://www.facebook.com/Pucyclescustom" target="_blank" rel="noopener noreferrer"><MessageCircle aria-hidden="true" /><div><strong>Facebook</strong><small>PUCYCLES Custom</small></div><ExternalLink aria-hidden="true" /></a>
          </nav>
        </div>
        <div className="site-footer-bottom"><span>© PUCYCLES Custom Bike Parts</span><span><small>{labels.market}</small>{country.name} · {country.currency}</span></div>
      </footer>
    </div>
  );
}
