"use client";

import Image from "next/image";
import Papa from "papaparse";
import { Archive, ChevronLeft, ChevronRight, Copy, Download, GripVertical, ImagePlus, Plus, RotateCcw, Search, SquarePen, Star, Trash2, Upload, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { StockStatus } from "@/data/catalog";
import { optimizeProductImage } from "@/lib/client-image";
import type { AdminProduct, AdminProductData } from "@/lib/admin-products";
import { createClient } from "@/lib/supabase/client";

type FitmentDraft = { vehicleModelId: number; yearFrom: number; yearTo: number };
type ProductDraft = { id: string | null; nameEn: string; nameTh: string; descriptionEn: string; descriptionTh: string; priceThb: number; weightGrams: number; stockQuantity: number; reservedQuantity: number; categoryId: number; brandId: number; fitments: FitmentDraft[] };
type CsvProduct = { name_en?: string; name_th?: string; description_en?: string; description_th?: string; price_thb?: string; weight_grams?: string; stock_quantity?: string; category?: string; brand?: string; vehicle_model?: string; year_from?: string; year_to?: string };

const statusLabels: Record<StockStatus, string> = { in_stock: "มีสินค้า", low_stock: "เหลือน้อย", out_of_stock: "สินค้าหมด" };
const statusOptions: Array<{ value: StockStatus; label: string }> = [{ value: "in_stock", label: "มีสินค้า" }, { value: "low_stock", label: "เหลือน้อย" }, { value: "out_of_stock", label: "สินค้าหมด" }];
const pageSize = 20;
const draftKey = "pucycles-admin-product-draft-v1";

function draftFromProduct(product: AdminProduct, duplicate = false): ProductDraft {
  return { id: duplicate ? null : product.id, nameEn: duplicate ? `${product.nameEn} Copy` : product.nameEn, nameTh: product.nameTh, descriptionEn: product.descriptionEn, descriptionTh: product.descriptionTh, priceThb: product.priceThb, weightGrams: product.weightGrams, stockQuantity: duplicate ? 0 : product.stockQuantity, reservedQuantity: duplicate ? 0 : product.reservedQuantity, categoryId: product.categoryId, brandId: product.brandId, fitments: product.fitments.map((fitment) => ({ vehicleModelId: fitment.vehicleModelId, yearFrom: fitment.yearFrom, yearTo: fitment.yearTo })) };
}

function PendingImage({ file }: { file: File }) {
  const src = useMemo(() => URL.createObjectURL(file), [file]);
  useEffect(() => () => URL.revokeObjectURL(src), [src]);
  return <Image src={src} alt="รูปใหม่" fill sizes="120px" unoptimized />;
}

export function AdminProductsPanel({ data }: { data: AdminProductData }) {
  const router = useRouter();
  const importRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeFilter, setActiveFilter] = useState("active");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<AdminProduct | null>(null);
  const [draft, setDraft] = useState<ProductDraft | null>(null);
  const [baseline, setBaseline] = useState("");
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [imageOrder, setImageOrder] = useState<string[]>([]);
  const [draggedImageId, setDraggedImageId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const result = data.products.filter((product) => {
      const matchesQuery = !needle || `${product.sku} ${product.nameEn} ${product.nameTh} ${product.brandName}`.toLowerCase().includes(needle);
      return matchesQuery && (statusFilter === "all" || product.status === statusFilter) && (activeFilter === "all" || (activeFilter === "active" ? product.isActive : !product.isActive));
    });
    return result.sort((a, b) => sort === "name" ? a.nameEn.localeCompare(b.nameEn) : sort === "stock_low" ? (a.stockQuantity - a.reservedQuantity) - (b.stockQuantity - b.reservedQuantity) : sort === "price_high" ? b.priceThb - a.priceThb : 0);
  }, [activeFilter, data.products, query, sort, statusFilter]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const visibleProducts = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);
  const isDirty = Boolean(draft && (JSON.stringify(draft) !== baseline || newFiles.length || (editing && imageOrder.join() !== editing.images.map((image) => image.id).join())));

  useEffect(() => {
    if (!isDirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [isDirty]);
  useEffect(() => {
    if (!draft || draft.id) return;
    const timer = window.setTimeout(() => localStorage.setItem(draftKey, JSON.stringify({ draft, savedAt: new Date().toISOString() })), 400);
    return () => window.clearTimeout(timer);
  }, [draft]);

  const newDraft = (): ProductDraft => ({ id: null, nameEn: "", nameTh: "", descriptionEn: "", descriptionTh: "", priceThb: 0, weightGrams: 0, stockQuantity: 0, reservedQuantity: 0, categoryId: data.categories[0]?.id ?? 0, brandId: data.brands[0]?.id ?? 0, fitments: [{ vehicleModelId: data.vehicleModels[0]?.id ?? 0, yearFrom: 2016, yearTo: new Date().getFullYear() }] });
  const beginEditor = (nextDraft: ProductDraft, product: AdminProduct | null, images: string[] = []) => { setEditing(product); setDraft(nextDraft); setBaseline(JSON.stringify(nextDraft)); setImageOrder(images); setNewFiles([]); setError(""); setMessage(""); };
  const openCreate = () => {
    let next = newDraft();
    const saved = localStorage.getItem(draftKey);
    if (saved && window.confirm("พบแบบร่างสินค้าที่ยังไม่ได้บันทึก ต้องการกู้คืนหรือไม่?")) { try { next = JSON.parse(saved).draft as ProductDraft; } catch { localStorage.removeItem(draftKey); } }
    beginEditor(next, null);
  };
  const openEdit = (product: AdminProduct) => beginEditor(draftFromProduct(product), product, product.images.map((image) => image.id));
  const duplicateProduct = (product: AdminProduct) => beginEditor(draftFromProduct(product, true), null);
  const closeEditor = () => { if (busy || (isDirty && !window.confirm("ข้อมูลที่แก้ไขยังไม่ได้บันทึก ต้องการปิดหรือไม่? แบบร่างสินค้าใหม่จะยังเก็บไว้ในเครื่อง"))) return; if (!isDirty && !draft?.id) localStorage.removeItem(draftKey); setDraft(null); setEditing(null); setNewFiles([]); setError(""); };

  const selectFiles = async (files: FileList | null) => {
    setError("");
    if (!files) return;
    const selected = Array.from(files);
    const invalid = selected.find((file) => !["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 15 * 1024 * 1024);
    if (invalid) return setError("รูปต้องเป็น JPG, PNG หรือ WEBP และมีขนาดไม่เกิน 15 MB ต่อรูป");
    if ((editing?.images.length ?? 0) + newFiles.length + selected.length > 5) return setError("สินค้าแต่ละรายการเพิ่มรูปได้สูงสุด 5 รูป");
    setBusy(true);
    try {
      const optimized = await Promise.all(selected.map(optimizeProductImage));
      setNewFiles((current) => [...current, ...optimized]);
    }
    catch (imageError) { setError(imageError instanceof Error ? imageError.message : "ไม่สามารถย่อรูปได้"); }
    finally { setBusy(false); }
  };

  const moveImage = (sourceId: string, targetId: string) => setImageOrder((current) => { const next = [...current]; const from = next.indexOf(sourceId); const to = next.indexOf(targetId); if (from < 0 || to < 0) return current; next.splice(from, 1); next.splice(to, 0, sourceId); return next; });

  const saveProduct = async (event: React.FormEvent) => {
    event.preventDefault(); if (!draft) return;
    setBusy(true); setError(""); setMessage("");
    const supabase = createClient(); let savedProductId: string | null = null;
    try {
      if (!draft.fitments.length) throw new Error("กรุณาเลือกรุ่นรถที่รองรับอย่างน้อย 1 รุ่น");
      if (draft.fitments.some((fitment) => fitment.yearFrom > fitment.yearTo)) throw new Error("ปีเริ่มต้นต้องไม่มากกว่าปีสิ้นสุด");
      if (draft.stockQuantity < draft.reservedQuantity) throw new Error(`จำนวนสต็อกต้องไม่น้อยกว่ายอดจอง ${draft.reservedQuantity} ชิ้น`);
      const { data: productId, error: saveError } = await supabase.rpc("admin_save_product_v2", { p_product_id: draft.id, p_name_en: draft.nameEn, p_name_th: draft.nameTh, p_description_en: draft.descriptionEn, p_description_th: draft.descriptionTh, p_price_thb: draft.priceThb, p_weight_grams: draft.weightGrams, p_stock_quantity: draft.stockQuantity, p_category_id: draft.categoryId, p_brand_id: draft.brandId, p_fitments: draft.fitments.map((fitment) => ({ vehicle_model_id: fitment.vehicleModelId, year_from: fitment.yearFrom, year_to: fitment.yearTo })) });
      if (saveError) throw saveError; if (!productId) throw new Error("บันทึกสินค้าไม่สำเร็จ"); savedProductId = String(productId);
      const finalIds = [...imageOrder];
      for (const [index, file] of newFiles.entries()) {
        const storagePath = `${savedProductId}/${crypto.randomUUID()}.webp`;
        const { error: uploadError } = await supabase.storage.from("product-images").upload(storagePath, file, { contentType: file.type, upsert: false }); if (uploadError) throw uploadError;
        const { data: imageRow, error: imageError } = await supabase.from("product_images").insert({ product_id: savedProductId, storage_path: storagePath, sort_order: imageOrder.length + index + 1 }).select("id").single();
        if (imageError) { await supabase.storage.from("product-images").remove([storagePath]); throw imageError; }
        finalIds.push(imageRow.id);
      }
      if (finalIds.length) { const { error: reorderError } = await supabase.rpc("admin_reorder_product_images", { p_product_id: savedProductId, p_image_ids: finalIds }); if (reorderError) throw reorderError; }
      localStorage.removeItem(draftKey); setMessage(draft.id ? "บันทึกการแก้ไขสินค้าแล้ว" : "เพิ่มสินค้าแล้ว"); setDraft(null); setEditing(null); setNewFiles([]); router.refresh();
    } catch (saveFailure) { setError(saveFailure instanceof Error ? saveFailure.message : "ไม่สามารถบันทึกสินค้าได้"); if (savedProductId) router.refresh(); }
    finally { setBusy(false); }
  };

  const removeImage = async (imageId: string, storagePath: string) => {
    if (!editing || !window.confirm("ยืนยันลบรูปสินค้านี้หรือไม่?")) return;
    setBusy(true); setError(""); const supabase = createClient();
    try { const { error: rowError } = await supabase.from("product_images").delete().eq("id", imageId).eq("product_id", editing.id); if (rowError) throw rowError; await supabase.storage.from("product-images").remove([storagePath]); const remainingIds = imageOrder.filter((id) => id !== imageId); if (remainingIds.length) { const { error: reorderError } = await supabase.rpc("admin_reorder_product_images", { p_product_id: editing.id, p_image_ids: remainingIds }); if (reorderError) throw reorderError; } setEditing({ ...editing, images: editing.images.filter((image) => image.id !== imageId) }); setImageOrder(remainingIds); router.refresh(); }
    catch (removeFailure) { setError(removeFailure instanceof Error ? removeFailure.message : "ไม่สามารถลบรูปได้"); }
    finally { setBusy(false); }
  };

  const setProductActive = async (product: AdminProduct, isActive: boolean) => { if (!window.confirm(`${isActive ? "นำสินค้ากลับมาแสดง" : "ซ่อนสินค้า"} ${product.nameEn} หรือไม่?`)) return; setBusy(true); setError(""); const { error: actionError } = await createClient().rpc("admin_set_product_active", { p_product_id: product.id, p_is_active: isActive }); if (actionError) setError(actionError.message); else { setMessage(isActive ? "นำสินค้ากลับมาแสดงแล้ว" : "ซ่อนสินค้าจากหน้าร้านแล้ว"); router.refresh(); } setBusy(false); };
  const addFitment = () => { if (!draft || draft.fitments.length >= data.vehicleModels.length) return; const used = new Set(draft.fitments.map((fitment) => fitment.vehicleModelId)); const model = data.vehicleModels.find((item) => !used.has(item.id)); if (model) setDraft({ ...draft, fitments: [...draft.fitments, { vehicleModelId: model.id, yearFrom: 2016, yearTo: new Date().getFullYear() }] }); };

  const exportCsv = () => {
    const csv = Papa.unparse(filtered.map((product) => ({ sku: product.sku, name_en: product.nameEn, name_th: product.nameTh, description_en: product.descriptionEn, description_th: product.descriptionTh, price_thb: product.priceThb, weight_grams: product.weightGrams, stock_quantity: product.stockQuantity, category: product.categoryName, brand: product.brandName, vehicle_model: product.fitments[0]?.vehicleModelName ?? "", year_from: product.fitments[0]?.yearFrom ?? "", year_to: product.fitments[0]?.yearTo ?? "", active: product.isActive })), { header: true });
    const url = URL.createObjectURL(new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8" })); const anchor = document.createElement("a"); anchor.href = url; anchor.download = `pucycles-products-${new Date().toISOString().slice(0, 10)}.csv`; anchor.click(); URL.revokeObjectURL(url);
  };
  const importCsv = (file: File | undefined) => {
    if (!file) return;
    Papa.parse<CsvProduct>(file, { header: true, skipEmptyLines: true, complete: async ({ data: rows, errors }) => {
      if (errors.length) return setError(`CSV ไม่ถูกต้อง: ${errors[0].message}`); if (!rows.length) return setError("CSV ไม่มีข้อมูลสินค้า");
      if (!window.confirm(`นำเข้าสินค้าใหม่ ${rows.length} รายการหรือไม่? รูปสินค้าต้องเพิ่มภายหลัง`)) return;
      setBusy(true); setError(""); let imported = 0;
      try { const supabase = createClient(); for (const row of rows) { const category = data.categories.find((item) => item.name.toLowerCase() === row.category?.trim().toLowerCase()) ?? data.categories[0]; const brand = data.brands.find((item) => item.name.toLowerCase() === row.brand?.trim().toLowerCase()) ?? data.brands[0]; const model = data.vehicleModels.find((item) => item.name.toLowerCase() === row.vehicle_model?.trim().toLowerCase()) ?? data.vehicleModels[0]; if (!row.name_en?.trim() || !row.name_th?.trim() || !category || !brand || !model) throw new Error(`ข้อมูลไม่ครบที่รายการ ${imported + 1}`); const { error: rowError } = await supabase.rpc("admin_save_product_v2", { p_product_id: null, p_name_en: row.name_en.trim(), p_name_th: row.name_th.trim(), p_description_en: row.description_en ?? "", p_description_th: row.description_th ?? "", p_price_thb: Number(row.price_thb ?? 0), p_weight_grams: Number(row.weight_grams ?? 0), p_stock_quantity: Number(row.stock_quantity ?? 0), p_category_id: category.id, p_brand_id: brand.id, p_fitments: [{ vehicle_model_id: model.id, year_from: Number(row.year_from || 2016), year_to: Number(row.year_to || new Date().getFullYear()) }] }); if (rowError) throw rowError; imported += 1; } setMessage(`นำเข้าสินค้าแล้ว ${imported} รายการ`); router.refresh(); }
      catch (importError) { setError(`นำเข้าได้ ${imported} รายการก่อนพบข้อผิดพลาด: ${importError instanceof Error ? importError.message : "ไม่ทราบสาเหตุ"}`); }
      finally { setBusy(false); if (importRef.current) importRef.current.value = ""; }
    } });
  };

  const orderedImages = editing ? imageOrder.map((id) => editing.images.find((image) => image.id === id)).filter(Boolean) as AdminProduct["images"] : [];
  return <>
    <div className="admin-page-heading admin-heading-actions"><div><span>ข้อมูลสินค้า</span><h1>สินค้า</h1><p>กำลังแสดง {data.products.filter((product) => product.isActive).length} รายการ</p></div><div className="admin-heading-button-group"><input ref={importRef} type="file" accept=".csv,text/csv" hidden onChange={(event) => importCsv(event.target.files?.[0])} /><button className="admin-secondary-button" onClick={() => importRef.current?.click()} disabled={busy}><Upload />นำเข้า CSV</button><button className="admin-secondary-button" onClick={exportCsv}><Download />ส่งออก CSV</button><button className="admin-primary-button" onClick={openCreate}><Plus />เพิ่มสินค้า</button></div></div>
    {message && <p className="admin-action-message success" role="status">{message}</p>}{error && !draft && <p className="admin-action-message error" role="alert">{error}</p>}
    <div className="admin-toolbar admin-product-toolbar"><label><Search /><input aria-label="ค้นหาสินค้า" placeholder="ค้นหาชื่อ แบรนด์ หรือ SKU" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} /></label><select aria-label="กรองสถานะสต็อก" value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setPage(1); }}><option value="all">สถานะสต็อกทั้งหมด</option>{statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select><select aria-label="กรองการแสดงสินค้า" value={activeFilter} onChange={(event) => { setActiveFilter(event.target.value); setPage(1); }}><option value="active">สินค้าที่แสดงอยู่</option><option value="archived">สินค้าที่ซ่อน</option><option value="all">ทั้งหมด</option></select><select aria-label="เรียงสินค้า" value={sort} onChange={(event) => { setSort(event.target.value); setPage(1); }}><option value="newest">ใหม่ล่าสุด</option><option value="name">ชื่อ A-Z</option><option value="stock_low">สต็อกน้อยก่อน</option><option value="price_high">ราคาสูงก่อน</option></select></div>
    <div className="admin-table-wrap"><table className="admin-table product-admin-table"><thead><tr><th>สินค้า</th><th>แบรนด์</th><th>หมวดหมู่</th><th>ราคา</th><th>พร้อมขาย</th><th>สถานะ</th><th><span className="sr-only">จัดการ</span></th></tr></thead><tbody>{visibleProducts.map((product) => <tr key={product.id} className={!product.isActive ? "archived" : ""}><td><strong>{product.sku}</strong><span>{product.nameEn}</span>{!product.isActive && <small>ซ่อนอยู่</small>}</td><td>{product.brandName}</td><td>{product.categoryName}</td><td>THB {product.priceThb.toLocaleString("th-TH")}</td><td>{Math.max(0, product.stockQuantity - product.reservedQuantity)}<small>{product.reservedQuantity ? `จองแล้ว ${product.reservedQuantity}` : ""}</small></td><td><span className={`admin-status ${product.status}`}>{statusLabels[product.status]}</span></td><td><div className="admin-product-row-actions"><button className="table-icon-button" onClick={() => openEdit(product)} aria-label={`แก้ไข ${product.nameEn}`} title="แก้ไขสินค้า"><SquarePen /></button><button className="table-icon-button" onClick={() => duplicateProduct(product)} aria-label={`ทำสำเนา ${product.nameEn}`} title="ทำสำเนาสินค้า"><Copy /></button><button className="table-icon-button" disabled={busy} onClick={() => void setProductActive(product, !product.isActive)} aria-label={`${product.isActive ? "ซ่อน" : "นำกลับมาแสดง"} ${product.nameEn}`} title={product.isActive ? "ซ่อนสินค้า" : "นำสินค้ากลับมาแสดง"}>{product.isActive ? <Archive /> : <RotateCcw />}</button></div></td></tr>)}</tbody></table>{!filtered.length && <div className="admin-empty-state">ไม่พบสินค้าที่ตรงกับตัวกรอง</div>}</div>
    {filtered.length > pageSize && <nav className="admin-pagination" aria-label="แบ่งหน้าสินค้า"><button disabled={safePage === 1} onClick={() => setPage(safePage - 1)}><ChevronLeft /></button><span>หน้า {safePage} / {totalPages} · {filtered.length} รายการ</span><button disabled={safePage === totalPages} onClick={() => setPage(safePage + 1)}><ChevronRight /></button></nav>}

    {draft && <div className="admin-product-editor-backdrop"><section className="admin-product-editor" role="dialog" aria-modal="true" aria-labelledby="product-editor-title"><header><div><span>{draft.id ? "แก้ไขสินค้า" : "สินค้าใหม่"}</span><h2 id="product-editor-title">{draft.id ? draft.nameEn : "เพิ่มสินค้า"}</h2>{!draft.id && <small className="admin-draft-status">บันทึกแบบร่างในเครื่องอัตโนมัติ</small>}</div><button onClick={closeEditor} aria-label="ปิดหน้าต่างแก้ไขสินค้า"><X /></button></header><form onSubmit={saveProduct}>
      <div className="admin-product-form-grid">{editing && <div className="admin-generated-identifiers full"><span>SKU <strong>{editing.sku}</strong></span><span>URL <strong>/{editing.slug}</strong></span></div>}<label className="full">ชื่อภาษาอังกฤษ<input required maxLength={200} value={draft.nameEn} onChange={(event) => setDraft({ ...draft, nameEn: event.target.value })} /></label><label className="full">ชื่อภาษาไทย<input required maxLength={200} value={draft.nameTh} onChange={(event) => setDraft({ ...draft, nameTh: event.target.value })} /></label><label className="full">รายละเอียดภาษาอังกฤษ<textarea maxLength={5000} value={draft.descriptionEn} onChange={(event) => setDraft({ ...draft, descriptionEn: event.target.value })} /></label><label className="full">รายละเอียดภาษาไทย<textarea maxLength={5000} value={draft.descriptionTh} onChange={(event) => setDraft({ ...draft, descriptionTh: event.target.value })} /></label><label>ราคา (บาท)<input required min="0" step="0.01" type="number" value={draft.priceThb} onChange={(event) => setDraft({ ...draft, priceThb: Number(event.target.value) })} /></label><label>น้ำหนัก (กรัม)<input required min="0" step="1" type="number" value={draft.weightGrams} onChange={(event) => setDraft({ ...draft, weightGrams: Number(event.target.value) })} /></label><label>สต็อกทั้งหมด<input required min={draft.reservedQuantity} step="1" type="number" value={draft.stockQuantity} onChange={(event) => setDraft({ ...draft, stockQuantity: Number(event.target.value) })} /><small>จองแล้ว {draft.reservedQuantity} ชิ้น · สถานะคำนวณอัตโนมัติ</small></label><label>หมวดหมู่<select value={draft.categoryId} onChange={(event) => setDraft({ ...draft, categoryId: Number(event.target.value) })}>{data.categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label><label>แบรนด์<select value={draft.brandId} onChange={(event) => setDraft({ ...draft, brandId: Number(event.target.value) })}>{data.brands.map((brand) => <option key={brand.id} value={brand.id}>{brand.name}</option>)}</select></label></div>
      <section className="admin-product-subsection"><div><h3>รุ่นรถที่รองรับ</h3><button type="button" className="admin-secondary-button" disabled={draft.fitments.length >= data.vehicleModels.length} onClick={addFitment}><Plus />เพิ่มรุ่นรถ</button></div>{draft.fitments.map((fitment, index) => <div className="admin-fitment-row" key={`${fitment.vehicleModelId}-${index}`}><select aria-label={`รุ่นรถ ${index + 1}`} value={fitment.vehicleModelId} onChange={(event) => setDraft({ ...draft, fitments: draft.fitments.map((item, itemIndex) => itemIndex === index ? { ...item, vehicleModelId: Number(event.target.value) } : item) })}>{data.vehicleModels.map((model) => <option key={model.id} value={model.id} disabled={draft.fitments.some((item, itemIndex) => itemIndex !== index && item.vehicleModelId === model.id)}>{model.name}</option>)}</select><input aria-label={`ปีเริ่มต้น ${index + 1}`} type="number" min="1900" max="2100" value={fitment.yearFrom} onChange={(event) => setDraft({ ...draft, fitments: draft.fitments.map((item, itemIndex) => itemIndex === index ? { ...item, yearFrom: Number(event.target.value) } : item) })} /><span>ถึง</span><input aria-label={`ปีสิ้นสุด ${index + 1}`} type="number" min="1900" max="2100" value={fitment.yearTo} onChange={(event) => setDraft({ ...draft, fitments: draft.fitments.map((item, itemIndex) => itemIndex === index ? { ...item, yearTo: Number(event.target.value) } : item) })} /><button type="button" disabled={draft.fitments.length === 1} onClick={() => setDraft({ ...draft, fitments: draft.fitments.filter((_, itemIndex) => itemIndex !== index) })} aria-label={`ลบรุ่นรถ ${index + 1}`}><Trash2 /></button></div>)}</section>
      <section className="admin-product-subsection"><div><h3>รูปสินค้า <small>{(editing?.images.length ?? 0) + newFiles.length}/5</small></h3><label className="admin-image-upload"><ImagePlus />เลือกรูป<input type="file" multiple accept="image/jpeg,image/png,image/webp" disabled={busy || (editing?.images.length ?? 0) + newFiles.length >= 5} onChange={(event) => void selectFiles(event.target.files)} /></label></div><p className="admin-image-hint">ลากรูปเพื่อเรียงลำดับ รูปแรกจะเป็นรูปหน้าปก ระบบย่อรูปก่อนอัปโหลดอัตโนมัติ</p><div className="admin-product-images">{orderedImages.map((image, index) => <div key={image.id} draggable onDragStart={() => setDraggedImageId(image.id)} onDragOver={(event) => event.preventDefault()} onDrop={() => { if (draggedImageId) moveImage(draggedImageId, image.id); setDraggedImageId(null); }}><Image src={image.publicUrl} alt="" fill sizes="120px" /><span className="admin-image-grip"><GripVertical /></span>{index === 0 && <span className="admin-cover-badge"><Star />หน้าปก</span>}<button type="button" disabled={busy} onClick={() => void removeImage(image.id, image.storagePath)} aria-label="ลบรูปสินค้า"><Trash2 /></button></div>)}{newFiles.map((file, index) => <div className="pending" key={`${file.name}-${file.lastModified}-${index}`}><PendingImage file={file} />{!orderedImages.length && index === 0 && <span className="admin-cover-badge"><Star />หน้าปก</span>}<span className="admin-pending-name">{file.name}</span><button type="button" onClick={() => setNewFiles((current) => current.filter((_, itemIndex) => itemIndex !== index))} aria-label={`ลบ ${file.name}`}><X /></button></div>)}</div></section>
      {error && <p className="admin-action-message error" role="alert">{error}</p>}<footer><button type="button" className="admin-secondary-button" disabled={busy} onClick={closeEditor}>ยกเลิก</button><button className="admin-primary-button" disabled={busy}>{busy ? "กำลังบันทึก..." : draft.id ? "บันทึกการแก้ไข" : "เพิ่มสินค้า"}</button></footer>
    </form></section></div>}
  </>;
}
