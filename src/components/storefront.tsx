"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowUp, Bike, Check, ChevronDown, CreditCard, Filter, Gauge, Globe2, PackageCheck, Search, ShieldCheck, ShoppingBag, SlidersHorizontal, Sparkles, Truck, Wrench, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { CustomerShell } from "@/components/customer-shell";
import { useShop } from "@/components/shop-provider";
import { formatMoney, getCountry } from "@/data/commerce";
import { type Product, type ProductFitment, type StockStatus } from "@/data/catalog";
import type { CustomerUser } from "@/lib/auth/customer";

const copy = {
  en: { search: "Search parts, brands or models", allParts: "All parts", results: "parts", showing: "Showing", of: "of", loadMore: "Load more", backToTop: "Back to top", filters: "Filters", clear: "Clear all", all: "All", vehicle: "Motorcycle", category: "Part category", brand: "Brand", year: "Vehicle year", stock: "Stock status", add: "Add to cart", added: "Added", soldOut: "Sold out", emptyTitle: "No parts found", emptyText: "Try another model, year, category, or brand.", curated: "Built for modern classics", title: "Parts that fit. Details that matter.", intro: "Performance and custom parts selected for Triumph modern classics.", browse: "Browse collection", trustTitle: "Shop with confidence", trustText: "A clear order flow for local and international riders, with payment proof reviewed by the store before dispatch.", orderKicker: "How to order", orderTitle: "Clear steps before your bike gets the part.", localTitle: "Thailand orders", globalTitle: "International orders", shippingTitle: "Shipping & payment", shippingText: "Thai delivery is free. International shipping is quoted by the store before payment, so you confirm the final amount first." },
  th: { search: "ค้นหาอะไหล่ แบรนด์ หรือรุ่นรถ", allParts: "อะไหล่ทั้งหมด", results: "รายการ", showing: "แสดง", of: "จาก", loadMore: "โหลดสินค้าเพิ่ม", backToTop: "กลับขึ้นด้านบน", filters: "ตัวกรอง", clear: "ล้างทั้งหมด", all: "ทั้งหมด", vehicle: "รุ่นรถ", category: "หมวดอะไหล่", brand: "แบรนด์", year: "ปีรถ", stock: "สถานะสินค้า", add: "เพิ่มลงตะกร้า", added: "เพิ่มแล้ว", soldOut: "สินค้าหมด", emptyTitle: "ไม่พบสินค้า", emptyText: "ลองเปลี่ยนรุ่นรถ ปีรถ หมวดหมู่ หรือแบรนด์", curated: "คัดสรรเพื่อ Modern Classic", title: "อะไหล่ที่ใช่ รายละเอียดที่ลงตัว", intro: "อะไหล่แต่งและอุปกรณ์สมรรถนะสำหรับ Triumph Modern Classic", browse: "เลือกดูสินค้า", trustTitle: "สั่งซื้อได้อย่างมั่นใจ", trustText: "ขั้นตอนชัดเจนสำหรับลูกค้าไทยและต่างประเทศ พร้อมตรวจสอบหลักฐานชำระเงินก่อนจัดส่งทุกออเดอร์", orderKicker: "วิธีสั่งซื้อ", orderTitle: "เช็กของ เลือกรุ่นรถ แล้วรออะไหล่ถึงมือ", localTitle: "ลูกค้าในไทย", globalTitle: "ลูกค้าต่างประเทศ", shippingTitle: "การจัดส่งและชำระเงิน", shippingText: "ลูกค้าไทยส่งฟรี ส่วนต่างประเทศร้านจะเช็กค่าส่งและแจ้งยอดสุดท้ายให้ยืนยันก่อนชำระเงิน" },
};

const trustBadges = {
  en: [
    { icon: ShieldCheck, title: "Google sign-in only", text: "Customer accounts use Google authentication." },
    { icon: Truck, title: "Thailand free shipping", text: "Domestic orders show a final payable total right away." },
    { icon: Globe2, title: "Worldwide quote first", text: "International freight is confirmed before payment." },
    { icon: PackageCheck, title: "Tracking after dispatch", text: "Tracking is shown on the order page after shipping." },
  ],
  th: [
    { icon: ShieldCheck, title: "เข้าสู่ระบบด้วย Google", text: "บัญชีลูกค้าใช้ Google เท่านั้น ลดความยุ่งยากและปลอดภัยขึ้น" },
    { icon: Truck, title: "ไทยส่งฟรี", text: "ออเดอร์ในไทยเห็นยอดชำระสุดท้ายได้ทันที" },
    { icon: Globe2, title: "ต่างประเทศเช็กค่าส่งก่อน", text: "ร้านยืนยันค่าขนส่งก่อนเปิดให้ชำระเงิน" },
    { icon: PackageCheck, title: "มีเลข Tracking", text: "หลังจัดส่งแล้วลูกค้าดูเลขพัสดุได้ในหน้าคำสั่งซื้อ" },
  ],
};

const orderSteps = {
  en: {
    local: ["Choose parts matched to your model and year", "Fill in delivery details", "Transfer payment and upload the receipt", "Store verifies payment and ships with tracking"],
    global: ["Choose parts and send the order", "Store checks international shipping", "Confirm the final total", "Pay by Western Union or approved method and upload proof"],
  },
  th: {
    local: ["เลือกอะไหล่ตามรุ่นรถและปีรถ", "กรอกข้อมูลจัดส่ง", "โอนเงินและแนบรูปใบเสร็จ", "ร้านตรวจสอบแล้วจัดส่งพร้อมเลข Tracking"],
    global: ["เลือกอะไหล่และส่งคำสั่งซื้อ", "ร้านเช็กค่าขนส่งต่างประเทศ", "ลูกค้ายืนยันยอดสุดท้าย", "ชำระเงินผ่าน Western Union หรือวิธีที่ร้านแจ้ง แล้วแนบหลักฐาน"],
  },
};

const shippingPoints = {
  en: [
    { icon: Truck, title: "Thailand", text: "Free shipping for Thai delivery addresses." },
    { icon: Globe2, title: "International", text: "Austria, Australia, Philippines, Dubai/UAE, India and more by manual quote." },
    { icon: CreditCard, title: "Payment proof", text: "Every order requires a receipt image for store verification." },
  ],
  th: [
    { icon: Truck, title: "ประเทศไทย", text: "จัดส่งฟรีสำหรับที่อยู่ในไทย" },
    { icon: Globe2, title: "ต่างประเทศ", text: "รองรับออสเตรีย ออสเตรเลีย ฟิลิปปินส์ ดูไบ/UAE อินเดีย และประเทศอื่นโดยเช็กค่าส่งก่อน" },
    { icon: CreditCard, title: "หลักฐานชำระเงิน", text: "ทุกออเดอร์ต้องแนบรูปใบเสร็จเพื่อให้ร้านตรวจสอบ" },
  ],
};

const PAGE_SIZE = 12;

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
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const [model, setModel] = useState("");
  const [category, setCategory] = useState("");
  const [brand, setBrand] = useState("");
  const [year, setYear] = useState("");
  const [stock, setStock] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [addedProductId, setAddedProductId] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const addedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const t = copy[preferences.locale];
  const country = getCountry(preferences.countryCode);
  const modelOptions = useMemo(() => [...new Set(products.flatMap((product) => product.models))].sort(), [products]);
  const featuredModels = useMemo(() => modelOptions
    .map((name) => ({ name, productCount: products.filter((product) => product.models.includes(name)).length }))
    .sort((left, right) => right.productCount - left.productCount || left.name.localeCompare(right.name))
    .slice(0, 3)
    .map((item) => item.name), [modelOptions, products]);
  const categoryOptions = useMemo(() => [...new Set(products.map((product) => product.category))].sort(), [products]);
  const brandOptions = useMemo(() => [...new Set(products.map((product) => product.brand))].sort(), [products]);
  const yearOptions = useMemo(() => {
    const fitments = products.flatMap((product) => product.fitments?.length ? product.fitments : [{ model: "", yearFrom: product.yearFrom, yearTo: product.yearTo }]);
    if (!fitments.length) return [];
    const first = Math.min(...fitments.map((fitment) => fitment.yearFrom));
    const last = Math.max(...fitments.map((fitment) => fitment.yearTo));
    return Array.from({ length: last - first + 1 }, (_, index) => String(last - index));
  }, [products]);
  const browse = searchParams.get("view");
  const browseOptions = browse === "models" ? modelOptions : browse === "brands" ? brandOptions : [];

  const filteredProducts = useMemo(() => {
    const search = query.trim().toLowerCase();
    const selectedYear = Number(year);
    return products.filter((product) => {
      const matchesSearch = !search || [product.name, product.nameTh, product.brand, product.category, product.sku, ...product.models].join(" ").toLowerCase().includes(search);
      const fitments: ProductFitment[] = product.fitments?.length ? product.fitments : product.models.map((item) => ({ model: item, yearFrom: product.yearFrom, yearTo: product.yearTo }));
      const matchesFitment = (!model && !year) || fitments.some((fitment) => (!model || fitment.model === model) && (!year || (selectedYear >= fitment.yearFrom && selectedYear <= fitment.yearTo)));
      return matchesSearch && matchesFitment && (!category || product.category === category) && (!brand || product.brand === brand) && (!stock || product.stockStatus === stock);
    });
  }, [brand, category, model, products, query, stock, year]);
  const visibleProducts = filteredProducts.slice(0, visibleCount);

  const resetFilters = () => { setQuery(""); setModel(""); setCategory(""); setBrand(""); setYear(""); setStock(""); setVisibleCount(PAGE_SIZE); };
  const addProduct = async (productId: string) => {
    await addToCart(productId);
    setAddedProductId(productId);
    if (addedTimer.current) clearTimeout(addedTimer.current);
    addedTimer.current = setTimeout(() => setAddedProductId(null), 1600);
  };

  useEffect(() => () => {
    if (addedTimer.current) clearTimeout(addedTimer.current);
  }, []);

  useEffect(() => {
    const updateBackToTop = () => setShowBackToTop(window.scrollY > 700);
    window.addEventListener("scroll", updateBackToTop, { passive: true });
    return () => window.removeEventListener("scroll", updateBackToTop);
  }, []);

  return (
    <CustomerShell user={user}>
      <main id="top">
        {showHero && <section className="intro-band">
          <div className="intro-copy"><span className="eyebrow"><Bike aria-hidden="true" />{t.curated}</span><h1>{t.title}</h1><p>{t.intro}</p><a className="primary-link" href="#catalog">{t.browse}<ChevronDown aria-hidden="true" /></a></div>
          <div className="model-panel" id="models">{featuredModels.map((item, index) => <button key={item} onClick={() => { setModel(item); setVisibleCount(PAGE_SIZE); document.getElementById("catalog")?.scrollIntoView({ behavior: "smooth" }); }}><span>{String(index + 1).padStart(2, "0")}</span>{item}<ChevronDown aria-hidden="true" /></button>)}</div>
        </section>}

        {showHero && <section className="trust-section" aria-labelledby="trust-heading">
          <div className="trust-heading"><span className="section-kicker">PUCYCLES SERVICE</span><h2 id="trust-heading">{t.trustTitle}</h2><p>{t.trustText}</p></div>
          <div className="trust-grid">{trustBadges[preferences.locale].map((item) => {
            const Icon = item.icon;
            return <article key={item.title}><Icon aria-hidden="true" /><strong>{item.title}</strong><p>{item.text}</p></article>;
          })}</div>
        </section>}

        {showHero && <section className="order-guide" aria-labelledby="order-guide-heading">
          <div className="order-guide-copy"><span className="section-kicker">{t.orderKicker}</span><h2 id="order-guide-heading">{t.orderTitle}</h2></div>
          <div className="order-guide-columns">
            <article><h3>{t.localTitle}</h3><ol>{orderSteps[preferences.locale].local.map((step) => <li key={step}>{step}</li>)}</ol></article>
            <article><h3>{t.globalTitle}</h3><ol>{orderSteps[preferences.locale].global.map((step) => <li key={step}>{step}</li>)}</ol></article>
          </div>
        </section>}

        {showHero && <section className="shipping-payment" aria-labelledby="shipping-payment-heading">
          <div><span className="section-kicker">PAYMENT & DELIVERY</span><h2 id="shipping-payment-heading">{t.shippingTitle}</h2><p>{t.shippingText}</p></div>
          <div>{shippingPoints[preferences.locale].map((item) => {
            const Icon = item.icon;
            return <article key={item.title}><Icon aria-hidden="true" /><span><strong>{item.title}</strong><p>{item.text}</p></span></article>;
          })}</div>
        </section>}

        <section className={`catalog ${showHero ? "" : "catalog-page"}`} id="catalog">
          <div className="catalog-heading"><div><span className="section-kicker">PUCYCLES COLLECTION</span><h2>{t.allParts}</h2></div><div className="search-box"><Search aria-hidden="true" /><input value={query} onChange={(event) => { setQuery(event.target.value); setVisibleCount(PAGE_SIZE); }} placeholder={t.search} aria-label={t.search} />{query && <button onClick={() => { setQuery(""); setVisibleCount(PAGE_SIZE); }} aria-label={t.clear}><X /></button>}</div><button className="filter-trigger" onClick={() => setFiltersOpen(!filtersOpen)} aria-expanded={filtersOpen}><Filter aria-hidden="true" />{t.filters}</button></div>
          {browseOptions.length > 0 && <div className="catalog-browse"><strong>{browse === "models" ? (preferences.locale === "th" ? "เลือกตามรุ่นรถ" : "Browse by motorcycle") : (preferences.locale === "th" ? "เลือกตามแบรนด์" : "Browse by brand")}</strong><div>{browseOptions.map((option) => <button key={option} className={(browse === "models" ? model : brand) === option ? "active" : ""} onClick={() => { if (browse === "models") setModel(option); else setBrand(option); setVisibleCount(PAGE_SIZE); }}>{option}</button>)}</div></div>}
          <div className="catalog-layout">
            <aside className={filtersOpen ? "filters open" : "filters"}>
              <div className="filter-title"><span><SlidersHorizontal />{t.filters}</span><button onClick={resetFilters}>{t.clear}</button></div>
              <FilterSelect allLabel={t.all} label={t.vehicle} value={model} options={modelOptions} onChange={(value) => { setModel(value); setVisibleCount(PAGE_SIZE); }} />
              <FilterSelect allLabel={t.all} label={t.year} value={year} options={yearOptions} onChange={(value) => { setYear(value); setVisibleCount(PAGE_SIZE); }} />
              <FilterSelect allLabel={t.all} label={t.category} value={category} options={categoryOptions} onChange={(value) => { setCategory(value); setVisibleCount(PAGE_SIZE); }} />
              <FilterSelect allLabel={t.all} label={t.brand} value={brand} options={brandOptions} onChange={(value) => { setBrand(value); setVisibleCount(PAGE_SIZE); }} />
              <FilterSelect allLabel={t.all} label={t.stock} value={stock} options={Object.keys(stockCopy)} optionLabel={(value) => stockCopy[value as StockStatus][preferences.locale]} onChange={(value) => { setStock(value); setVisibleCount(PAGE_SIZE); }} />
            </aside>
            <div className="product-region">
              <div className="result-row"><span>{t.showing} {Math.min(visibleCount, filteredProducts.length)} {t.of} {filteredProducts.length} {t.results}</span><span>{preferences.locale === "th" ? country.nameTh : country.name} · THB</span></div>
              {filteredProducts.length ? <><div className="product-grid">{visibleProducts.map((product) => {
                const canBuy = product.stockStatus === "in_stock" || product.stockStatus === "low_stock";
                const added = addedProductId === product.id;
                return <article className={`product-card ${added ? "product-card-added" : ""}`} key={product.id}>
                  <Link href={`/products/${product.slug}`} className="product-card-link"><ProductVisual product={product} /></Link>
                  <div className="product-info"><div className={`stock-status ${product.stockStatus}`}><span />{stockCopy[product.stockStatus][preferences.locale]}</div><p className="product-brand">{product.brand}</p><h3><Link href={`/products/${product.slug}`}>{preferences.locale === "th" ? product.nameTh : product.name}</Link></h3><p className="fitment">{(product.fitments?.length ? product.fitments.map((fitment) => `${fitment.model} ${fitment.yearFrom}-${fitment.yearTo}`) : [`${product.models.join(" · ")} ${product.yearFrom}-${product.yearTo}`]).join(" · ")}</p><div className="product-footer"><strong>{formatMoney(product.priceThb, preferences.countryCode, preferences.locale)}</strong><button className={added ? "added" : ""} disabled={!canBuy} onClick={() => void addProduct(product.id)} aria-label={`${t.add}: ${product.name}`}>{canBuy ? added ? <><Check aria-hidden="true" />{t.added}</> : <><ShoppingBag aria-hidden="true" />{t.add}</> : t.soldOut}</button></div></div>
                </article>;
              })}</div>{visibleCount < filteredProducts.length && <button className="catalog-load-more" onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}>{t.loadMore}<ChevronDown aria-hidden="true" /></button>}</> : <div className="empty-state"><Search /><h3>{t.emptyTitle}</h3><p>{t.emptyText}</p><button onClick={resetFilters}>{t.clear}</button></div>}
            </div>
          </div>
        </section>
        {showBackToTop && <button className="back-to-top" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} aria-label={t.backToTop} title={t.backToTop}><ArrowUp aria-hidden="true" /></button>}
        {addedProductId && <div className="cart-toast" role="status"><Check aria-hidden="true" />{t.added}</div>}
      </main>
    </CustomerShell>
  );
}

function FilterSelect({ allLabel, label, value, options, onChange, optionLabel = (option) => option }: { allLabel: string; label: string; value: string; options: string[]; onChange: (value: string) => void; optionLabel?: (value: string) => string }) {
  return <label className="filter-field"><span>{label}</span><select value={value} onChange={(event) => onChange(event.target.value)}><option value="">{allLabel}</option>{options.map((option) => <option key={option} value={option}>{optionLabel(option)}</option>)}</select></label>;
}
