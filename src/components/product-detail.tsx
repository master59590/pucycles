"use client";

import Image from "next/image";
import Link from "next/link";
import { Check, ChevronRight, Minus, Plus, Scale, ShoppingBag, Wrench } from "lucide-react";
import { useEffect, useState } from "react";
import { CustomerShell } from "@/components/customer-shell";
import { ProductVisual } from "@/components/storefront";
import { useShop } from "@/components/shop-provider";
import { formatMoney } from "@/data/commerce";
import type { Product } from "@/data/catalog";
import type { CustomerUser } from "@/lib/auth/customer";

export function ProductDetail({ product, user, isAdmin }: { product: Product; user: CustomerUser | null; isAdmin: boolean }) {
  const { preferences, addToCart } = useShop();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [selectedImage, setSelectedImage] = useState(product.imageUrls?.[0]);
  const canBuy = product.stockStatus === "in_stock" || product.stockStatus === "low_stock";
  const name = preferences.locale === "th" ? product.nameTh : product.name;
  const description = preferences.locale === "th" ? product.descriptionTh : product.description;
  const add = async () => { await addToCart(product.id, quantity); setAdded(true); };
  useEffect(() => {
    if (!added) return;
    const timer = window.setTimeout(() => setAdded(false), 1600);
    return () => window.clearTimeout(timer);
  }, [added]);

  return <CustomerShell user={user} isAdmin={isAdmin}><main className="detail-page">
    <nav className="breadcrumbs" aria-label="Breadcrumb"><Link href="/products">Products</Link><ChevronRight /><span>{product.brand}</span><ChevronRight /><strong>{product.sku}</strong></nav>
    <section className="product-detail-layout">
      <div className="detail-gallery"><ProductVisual product={product} imageUrl={selectedImage} />{product.imageUrls?.length ? <div className="detail-thumbnails">{product.imageUrls.map((imageUrl, index) => <button key={imageUrl} className={selectedImage === imageUrl ? "active" : ""} onClick={() => setSelectedImage(imageUrl)} aria-label={`Product image ${index + 1}`}><Image src={imageUrl} alt="" fill sizes="64px" /></button>)}</div> : <div className="detail-thumbnails"><button className="active" aria-label="Product image placeholder"><Wrench /></button></div>}</div>
      <div className="detail-copy"><span className={`stock-status ${product.stockStatus}`}><span />{product.stockStatus.replaceAll("_", " ")}</span><p className="product-brand">{product.brand} · {product.sku}</p><h1>{name}</h1><p className="detail-description">{description}</p><strong className="detail-price">{formatMoney(product.priceThb, preferences.countryCode, preferences.locale)}</strong>
        <div className="detail-specs"><div><Wrench /><span>Fitment<strong>{product.models.join(" / ")}</strong></span></div><div><Check /><span>Vehicle years<strong>{product.yearFrom}-{product.yearTo}</strong></span></div><div><Scale /><span>Weight<strong>{(product.weightGrams / 1000).toFixed(2)} kg</strong></span></div></div>
        <div className="detail-purchase"><div className="quantity-stepper"><button onClick={() => setQuantity((value) => Math.max(1, value - 1))} aria-label="Decrease quantity"><Minus /></button><span>{quantity}</span><button onClick={() => setQuantity((value) => Math.min(product.stock, value + 1))} aria-label="Increase quantity"><Plus /></button></div><button className={`shop-primary-button ${added ? "added" : ""}`} onClick={() => void add()} disabled={!canBuy}>{added ? <><Check />Added to cart</> : <><ShoppingBag />Add to cart</>}</button></div>
        <p className="detail-note">{canBuy ? `${product.stock} available · Stock is reserved when checkout is completed.` : "This item cannot be ordered right now."}</p>
      </div>
    </section>
  </main></CustomerShell>;
}
