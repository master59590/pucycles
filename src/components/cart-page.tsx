"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { CustomerShell } from "@/components/customer-shell";
import { useShop } from "@/components/shop-provider";
import { formatMoney } from "@/data/commerce";
import type { CustomerUser } from "@/lib/auth/customer";

export function CartPage({ user, isAdmin, thaiShippingFeeThb }: { user: CustomerUser | null; isAdmin: boolean; thaiShippingFeeThb: number }) {
  const { cart, preferences, updateCart, removeFromCart, hydrated, shopError, products } = useShop();
  const lines = cart.flatMap((line) => { const product = products.find((item) => item.id === line.productId); return product ? [{ ...line, product }] : []; });
  const subtotal = lines.reduce((sum, line) => sum + line.product.priceThb * line.quantity, 0);
  const shipping = preferences.countryCode === "TH" ? thaiShippingFeeThb : null;

  return <CustomerShell user={user} isAdmin={isAdmin}><main className="shop-page"><div className="shop-page-heading"><span className="section-kicker">YOUR SELECTION</span><h1>Shopping cart</h1><p>{lines.length} product{lines.length === 1 ? "" : "s"}</p></div>{shopError && <p className="field-error" role="alert">{shopError}</p>}
    {!hydrated ? <div className="shop-loading">Loading cart...</div> : lines.length === 0 ? <div className="shop-empty"><ShoppingBag /><h2>Your cart is empty</h2><p>Find parts matched to your Triumph model.</p><Link className="shop-primary-button" href="/products">Browse products</Link></div> : <div className="cart-layout"><section className="cart-lines">{lines.map(({ product, quantity }) => <article key={product.id}><div className="cart-thumb">{product.imageUrls?.[0] ? <Image src={product.imageUrls[0]} alt={product.name} fill sizes="88px" /> : <ShoppingBag />}</div><div><p>{product.brand} · {product.sku}</p><h2><Link href={`/products/${product.slug}`}>{preferences.locale === "th" ? product.nameTh : product.name}</Link></h2><span>{product.models.join(" / ")}</span></div><div className="quantity-stepper"><button onClick={() => updateCart(product.id, quantity - 1)} aria-label="Decrease quantity"><Minus /></button><span>{quantity}</span><button onClick={() => updateCart(product.id, quantity + 1)} aria-label="Increase quantity"><Plus /></button></div><strong>{formatMoney(product.priceThb * quantity, preferences.countryCode, preferences.locale)}</strong><button className="remove-line" onClick={() => removeFromCart(product.id)} aria-label={`Remove ${product.name}`}><Trash2 /></button></article>)}</section><aside className="order-summary"><h2>Order summary</h2><div><span>Subtotal</span><strong>{formatMoney(subtotal, preferences.countryCode, preferences.locale)}</strong></div><div><span>Shipping</span><strong>{shipping === null ? "Pending quote" : formatMoney(shipping, preferences.countryCode, preferences.locale)}</strong></div><div className="summary-total"><span>Total</span><strong>{shipping === null ? "Confirmed later" : formatMoney(subtotal + shipping, preferences.countryCode, preferences.locale)}</strong></div><p>{shipping === null ? "International shipping is confirmed by the store before payment." : "Thai shipping is included in the payment total."}</p><Link className="shop-primary-button" href={user ? "/checkout" : "/login?next=/checkout"}>Continue to checkout <ArrowRight /></Link><Link className="text-link" href="/products">Continue shopping</Link></aside></div>}
  </main></CustomerShell>;
}
