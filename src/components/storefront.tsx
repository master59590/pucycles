"use client";

import Image from "next/image";
import Link from "next/link";
import { Bike, Check, ChevronDown, Filter, Gauge, Search, ShoppingBag, SlidersHorizontal, Sparkles, Wrench, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { CustomerShell } from "@/components/customer-shell";
import { useShop } from "@/components/shop-provider";
import { formatMoney, getCountry } from "@/data/commerce";
import { brands, categories, models, type Product, type StockStatus } from "@/data/catalog";
import type { CustomerUser } from "@/lib/auth/customer";

const copy = {
  en: { search: "Search parts, brands or models", allParts: "All parts", results: "parts", filters: "Filters", clear: "Clear all", vehicle: "Motorcycle", category: "Part category", brand: "Brand", year: "Vehicle year", stock: "Stock status", add: "Add to cart", soldOut: "Sold out", curated: "Built for modern classics", title: "Parts that fit. Details that matter.", intro: "Performance and custom parts selected for Triumph modern classics.", browse: "Browse collection" },
  th: { search: "ค้นหาอะไหล่ แบรนด์ หรือรุ่นรถ", allParts: "อะไหล่ทั้งหมด", results: "รายการ", filters: "ตัวกรอง", clear: "ล้างทั้งหมด", vehicle: "รุ่นรถ", category: "หมวดอะไหล่", brand: "แบรนด์", year: "ปีรถ", stock: "สถานะสินค้า", add: "เพิ่มลงตะกร้า", soldOut: "สินค้าหมด", curated: "คัดสรรเพื่อ Modern Classic", title: "อะไหล่ที่ใช่ รายละเอียดที่ลงตัว", intro: "อะไหล่แต่งและอุปกรณ์สมรรถนะสำหรับ Triumph Modern Classic", browse: "เลือกดูสินค้า" },
};

const stockCopy: Record<StockStatus, { en: string; th: string }> = {
  in_stock: { en: "In stock", th: "มีสินค้า" },
  low_stock: { en: "Low stock", th: "เหลือน้อย" },
  out_of_stock: { en: "Out of stock", th: "สินค้าหมด" },
};

export function ProductVisual({ product, imageUrl = product.imageUrls?.[0] }: { product: Product; imageUrl?: string }) {
  const Icon = product.category === "Lighting & Electrical" ? Sparkles : product.category === "Exhausts" ? Gauge : Wrench;
  if (imageUrl) return <div className="product-visual has-image"><Image src={imageUrl} alt={product.name} fill sizes="(max-width: 760px) 50vw, 25vw" /><span className="product-code">{product.sku}</span></div>;
  return <div className="product-visual" style={{ "--product-accent": product.accent } as React.CSSProperties}><span className="product-code">{product.sku}</span><Icon aria-hidden="true" /><span>{product.category}</span></div>;
}

export function Storefront({ user, showHero = true }: { user: CustomerUser | null; isAdmin?: boolean; showHero?: boolean }) {
  const { preferences, addToCart, products } = useShop();
  const [query, setQuery] = useState("");
  const [model, setModel] = useState("");
  const [category, setCategory] = useState("");
  const [brand, setBrand] = useState("");
  const [year, setYear] = useState("");
  const [stock, setStock] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [addedProductId, setAddedProductId] = useState<string | null>(null);
  const addedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const t = copy[preferences.locale];
  const country = getCountry(preferences.countryCode);

  const filteredProducts = useMemo(() => {
    const search = query.trim().toLowerCase();
    const selectedYear = Number(year);
    return products.filter((product) => {
      const matchesSearch = !search || [product.name, product.nameTh, product.brand, product.category, product.sku, ...product.models].join(" ").toLowerCase().includes(search);
      return matchesSearch && (!model || product.models.includes(model)) && (!category || product.category === category) && (!brand || product.brand === brand) && (!year || (selectedYear >= product.yearFrom && selectedYear <= product.yearTo)) && (!stock || product.stockStatus === stock);
    });
  }, [brand, category, model, products, query, stock, year]);

  const resetFilters = () => { setQuery(""); setModel(""); setCategory(""); setBrand(""); setYear(""); setStock(""); };
  const addProduct = async (productId: string) => {
    await addToCart(productId);
    setAddedProductId(productId);
    if (addedTimer.current) clearTimeout(addedTimer.current);
    addedTimer.current = setTimeout(() => setAddedProductId(null), 1600);
  };

  useEffect(() => () => {
    if (addedTimer.current) clearTimeout(addedTimer.current);
  }, []);

  return (
    <CustomerShell user={user}>
      <main id="top">
        {showHero && <section className="intro-band">
          <div className="intro-copy"><span className="eyebrow"><Bike aria-hidden="true" />{t.curated}</span><h1>{t.title}</h1><p>{t.intro}</p><a className="primary-link" href="#catalog">{t.browse}<ChevronDown aria-hidden="true" /></a></div>
          <div className="model-panel" id="models">{models.map((item, index) => <button key={item} onClick={() => { setModel(item); document.getElementById("catalog")?.scrollIntoView({ behavior: "smooth" }); }}><span>0{index + 1}</span>{item}<ChevronDown aria-hidden="true" /></button>)}</div>
        </section>}

        <section className={`catalog ${showHero ? "" : "catalog-page"}`} id="catalog">
          <div className="catalog-heading"><div><span className="section-kicker">PUCYCLES COLLECTION</span><h2>{t.allParts}</h2></div><div className="search-box"><Search aria-hidden="true" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t.search} aria-label={t.search} />{query && <button onClick={() => setQuery("")} aria-label="Clear search"><X /></button>}</div><button className="filter-trigger" onClick={() => setFiltersOpen(!filtersOpen)} aria-expanded={filtersOpen}><Filter aria-hidden="true" />{t.filters}</button></div>
          <div className="catalog-layout">
            <aside className={filtersOpen ? "filters open" : "filters"}>
              <div className="filter-title"><span><SlidersHorizontal />{t.filters}</span><button onClick={resetFilters}>{t.clear}</button></div>
              <FilterSelect label={t.vehicle} value={model} options={models} onChange={setModel} />
              <FilterSelect label={t.year} value={year} options={Array.from({ length: 11 }, (_, index) => String(2016 + index))} onChange={setYear} />
              <FilterSelect label={t.category} value={category} options={categories} onChange={setCategory} />
              <FilterSelect label={t.brand} value={brand} options={[...brands, "PUCYCLES"]} onChange={setBrand} />
              <FilterSelect label={t.stock} value={stock} options={Object.keys(stockCopy)} optionLabel={(value) => stockCopy[value as StockStatus][preferences.locale]} onChange={setStock} />
            </aside>
            <div className="product-region">
              <div className="result-row"><span>{filteredProducts.length} {t.results}</span><span>{country.name} · {country.currency}</span></div>
              {filteredProducts.length ? <div className="product-grid">{filteredProducts.map((product) => {
                const canBuy = product.stockStatus === "in_stock" || product.stockStatus === "low_stock";
                const added = addedProductId === product.id;
                return <article className={`product-card ${added ? "product-card-added" : ""}`} key={product.id}>
                  <Link href={`/products/${product.slug}`} className="product-card-link"><ProductVisual product={product} /></Link>
                  <div className="product-info"><div className={`stock-status ${product.stockStatus}`}><span />{stockCopy[product.stockStatus][preferences.locale]}</div><p className="product-brand">{product.brand}</p><h3><Link href={`/products/${product.slug}`}>{preferences.locale === "th" ? product.nameTh : product.name}</Link></h3><p className="fitment">{product.models.join(" · ")} · {product.yearFrom}-{product.yearTo}</p><div className="product-footer"><strong>{formatMoney(product.priceThb, preferences.countryCode, preferences.locale)}</strong><button className={added ? "added" : ""} disabled={!canBuy} onClick={() => void addProduct(product.id)} aria-label={`${t.add}: ${product.name}`}>{canBuy ? added ? <><Check aria-hidden="true" />Added</> : <><ShoppingBag aria-hidden="true" />{t.add}</> : t.soldOut}</button></div></div>
                </article>;
              })}</div> : <div className="empty-state"><Search /><h3>No parts found</h3><p>Try another model, year, category, or brand.</p><button onClick={resetFilters}>{t.clear}</button></div>}
            </div>
          </div>
        </section>
        {addedProductId && <div className="cart-toast" role="status"><Check aria-hidden="true" />Added to cart</div>}
      </main>
    </CustomerShell>
  );
}

function FilterSelect({ label, value, options, onChange, optionLabel = (option) => option }: { label: string; value: string; options: string[]; onChange: (value: string) => void; optionLabel?: (value: string) => string }) {
  return <label className="filter-field"><span>{label}</span><select value={value} onChange={(event) => onChange(event.target.value)}><option value="">All</option>{options.map((option) => <option key={option} value={option}>{optionLabel(option)}</option>)}</select></label>;
}
