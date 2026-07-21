"use client";

import Image from "next/image";
import { Archive, ImagePlus, Plus, RotateCcw, Search, SquarePen, Trash2, Upload, X } from "lucide-react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { StockStatus } from "@/data/catalog";
import type { AdminProduct, AdminProductData } from "@/lib/admin-products";
import { createClient } from "@/lib/supabase/client";

type FitmentDraft = { vehicleModelId: number; yearFrom: number; yearTo: number };
type ProductDraft = {
  id: string | null;
  nameEn: string;
  nameTh: string;
  descriptionEn: string;
  descriptionTh: string;
  priceThb: number;
  weightGrams: number;
  stockQuantity: number;
  reservedQuantity: number;
  categoryId: number;
  brandId: number;
  fitments: FitmentDraft[];
};

const statusLabels: Record<StockStatus, string> = {
  in_stock: "มีสินค้า",
  low_stock: "เหลือน้อย",
  out_of_stock: "สินค้าหมด",
};

const statusOptions: Array<{ value: StockStatus; label: string }> = [
  { value: "in_stock", label: "มีสินค้า" },
  { value: "low_stock", label: "เหลือน้อย" },
  { value: "out_of_stock", label: "สินค้าหมด" },
];

function draftFromProduct(product: AdminProduct): ProductDraft {
  return {
    id: product.id,
    nameEn: product.nameEn,
    nameTh: product.nameTh,
    descriptionEn: product.descriptionEn,
    descriptionTh: product.descriptionTh,
    priceThb: product.priceThb,
    weightGrams: product.weightGrams,
    stockQuantity: product.stockQuantity,
    reservedQuantity: product.reservedQuantity,
    categoryId: product.categoryId,
    brandId: product.brandId,
    fitments: product.fitments.map((fitment) => ({ vehicleModelId: fitment.vehicleModelId, yearFrom: fitment.yearFrom, yearTo: fitment.yearTo })),
  };
}

export function AdminProductsPanel({ data }: { data: AdminProductData }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeFilter, setActiveFilter] = useState("active");
  const [editing, setEditing] = useState<AdminProduct | null>(null);
  const [draft, setDraft] = useState<ProductDraft | null>(null);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return data.products.filter((product) => {
      const matchesQuery = !needle || `${product.sku} ${product.nameEn} ${product.nameTh} ${product.brandName}`.toLowerCase().includes(needle);
      const matchesStatus = statusFilter === "all" || product.status === statusFilter;
      const matchesActive = activeFilter === "all" || (activeFilter === "active" ? product.isActive : !product.isActive);
      return matchesQuery && matchesStatus && matchesActive;
    });
  }, [activeFilter, data.products, query, statusFilter]);

  const newDraft = (): ProductDraft => ({
    id: null,
    nameEn: "",
    nameTh: "",
    descriptionEn: "",
    descriptionTh: "",
    priceThb: 0,
    weightGrams: 0,
    stockQuantity: 0,
    reservedQuantity: 0,
    categoryId: data.categories[0]?.id ?? 0,
    brandId: data.brands[0]?.id ?? 0,
    fitments: [{ vehicleModelId: data.vehicleModels[0]?.id ?? 0, yearFrom: 2016, yearTo: new Date().getFullYear() }],
  });

  const openCreate = () => {
    setEditing(null);
    setDraft(newDraft());
    setNewFiles([]);
    setError("");
    setMessage("");
  };
  const openEdit = (product: AdminProduct) => {
    setEditing(product);
    setDraft(draftFromProduct(product));
    setNewFiles([]);
    setError("");
    setMessage("");
  };
  const closeEditor = () => {
    if (!busy) {
      setDraft(null);
      setEditing(null);
      setNewFiles([]);
      setError("");
    }
  };

  const selectFiles = (files: FileList | null) => {
    setError("");
    if (!files) return;
    const selected = Array.from(files);
    const invalid = selected.find((file) => !["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 10 * 1024 * 1024);
    if (invalid) return setError("รูปต้องเป็น JPG, PNG หรือ WEBP และมีขนาดไม่เกิน 10 MB ต่อรูป");
    const existingCount = editing?.images.length ?? 0;
    if (existingCount + newFiles.length + selected.length > 5) return setError("สินค้าแต่ละรายการเพิ่มรูปได้สูงสุด 5 รูป");
    setNewFiles((current) => [...current, ...selected]);
  };

  const saveProduct = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft) return;
    setBusy(true);
    setError("");
    setMessage("");
    const supabase = createClient();
    let savedProductId: string | null = null;
    try {
      if (!draft.fitments.length) throw new Error("กรุณาเลือกรุ่นรถที่รองรับอย่างน้อย 1 รุ่น");
      if (draft.fitments.some((fitment) => fitment.yearFrom > fitment.yearTo)) throw new Error("ปีเริ่มต้นต้องไม่มากกว่าปีสิ้นสุด");
      if (draft.stockQuantity < draft.reservedQuantity) throw new Error(`จำนวนสต็อกต้องไม่น้อยกว่ายอดจอง ${draft.reservedQuantity} ชิ้น`);

      const { data: productId, error: saveError } = await supabase.rpc("admin_save_product_v2", {
        p_product_id: draft.id,
        p_name_en: draft.nameEn,
        p_name_th: draft.nameTh,
        p_description_en: draft.descriptionEn,
        p_description_th: draft.descriptionTh,
        p_price_thb: draft.priceThb,
        p_weight_grams: draft.weightGrams,
        p_stock_quantity: draft.stockQuantity,
        p_category_id: draft.categoryId,
        p_brand_id: draft.brandId,
        p_fitments: draft.fitments.map((fitment) => ({ vehicle_model_id: fitment.vehicleModelId, year_from: fitment.yearFrom, year_to: fitment.yearTo })),
      });
      if (saveError) throw saveError;
      if (!productId) throw new Error("บันทึกสินค้าไม่สำเร็จ");
      savedProductId = String(productId);

      const usedSortOrders = new Set((editing?.images ?? []).map((image) => image.sortOrder));
      const availableSortOrders = [1, 2, 3, 4, 5].filter((sortOrder) => !usedSortOrders.has(sortOrder));
      for (const [index, file] of newFiles.entries()) {
        const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
        const storagePath = `${savedProductId}/${crypto.randomUUID()}.${extension}`;
        const { error: uploadError } = await supabase.storage.from("product-images").upload(storagePath, file, { contentType: file.type, upsert: false });
        if (uploadError) throw uploadError;
        const { error: imageError } = await supabase.from("product_images").insert({ product_id: savedProductId, storage_path: storagePath, sort_order: availableSortOrders[index] });
        if (imageError) {
          await supabase.storage.from("product-images").remove([storagePath]);
          throw imageError;
        }
      }

      setMessage(draft.id ? "บันทึกการแก้ไขสินค้าแล้ว" : "เพิ่มสินค้าแล้ว");
      setDraft(null);
      setEditing(null);
      setNewFiles([]);
      router.refresh();
    } catch (saveFailure) {
      const failureMessage = saveFailure instanceof Error ? saveFailure.message : "ไม่สามารถบันทึกสินค้าได้";
      if (savedProductId) {
        setDraft(null);
        setEditing(null);
        setNewFiles([]);
        setError(`บันทึกข้อมูลสินค้าแล้ว แต่อัปโหลดรูปไม่สำเร็จ: ${failureMessage}`);
        router.refresh();
      } else {
        setError(failureMessage);
      }
    } finally {
      setBusy(false);
    }
  };

  const removeImage = async (imageId: string, storagePath: string) => {
    if (!editing || !window.confirm("ยืนยันลบรูปสินค้านี้หรือไม่?")) return;
    setBusy(true);
    setError("");
    const supabase = createClient();
    try {
      const { error: rowError } = await supabase.from("product_images").delete().eq("id", imageId).eq("product_id", editing.id);
      if (rowError) throw rowError;
      const { error: storageError } = await supabase.storage.from("product-images").remove([storagePath]);
      if (storageError) throw storageError;
      setEditing({ ...editing, images: editing.images.filter((image) => image.id !== imageId) });
      setMessage("ลบรูปสินค้าแล้ว");
      router.refresh();
    } catch (removeFailure) {
      setError(removeFailure instanceof Error ? removeFailure.message : "ไม่สามารถลบรูปสินค้าได้");
    } finally {
      setBusy(false);
    }
  };

  const setProductActive = async (product: AdminProduct, isActive: boolean) => {
    if (!window.confirm(`${isActive ? "นำสินค้ากลับมาแสดง" : "ซ่อนสินค้า"} ${product.nameEn} หรือไม่?`)) return;
    setBusy(true);
    setError("");
    const { error: actionError } = await createClient().rpc("admin_set_product_active", { p_product_id: product.id, p_is_active: isActive });
    if (actionError) setError(actionError.message);
    else {
      setMessage(isActive ? "นำสินค้ากลับมาแสดงแล้ว" : "ซ่อนสินค้าจากหน้าร้านแล้ว โดยข้อมูลคำสั่งซื้อยังคงอยู่");
      router.refresh();
    }
    setBusy(false);
  };

  const addFitment = () => {
    if (!draft || draft.fitments.length >= data.vehicleModels.length) return;
    const used = new Set(draft.fitments.map((fitment) => fitment.vehicleModelId));
    const model = data.vehicleModels.find((item) => !used.has(item.id));
    if (model) setDraft({ ...draft, fitments: [...draft.fitments, { vehicleModelId: model.id, yearFrom: 2016, yearTo: new Date().getFullYear() }] });
  };

  return <>
    <div className="admin-page-heading admin-heading-actions"><div><span>ข้อมูลสินค้า</span><h1>สินค้า</h1><p>กำลังแสดง {data.products.filter((product) => product.isActive).length} รายการ</p></div><button className="admin-primary-button" onClick={openCreate}><Plus />เพิ่มสินค้า</button></div>
    {message && <p className="admin-action-message success" role="status">{message}</p>}
    {error && !draft && <p className="admin-action-message error" role="alert">{error}</p>}
    <div className="admin-toolbar admin-product-toolbar"><label><Search /><input aria-label="ค้นหาสินค้า" placeholder="ค้นหาชื่อ แบรนด์ หรือ SKU" value={query} onChange={(event) => setQuery(event.target.value)} /></label><select aria-label="กรองสถานะสต็อก" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="all">สถานะสต็อกทั้งหมด</option>{statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select><select aria-label="กรองการแสดงสินค้า" value={activeFilter} onChange={(event) => setActiveFilter(event.target.value)}><option value="active">สินค้าที่แสดงอยู่</option><option value="archived">สินค้าที่ซ่อน</option><option value="all">ทั้งหมด</option></select></div>

    <div className="admin-table-wrap"><table className="admin-table product-admin-table"><thead><tr><th>สินค้า</th><th>แบรนด์</th><th>หมวดหมู่</th><th>ราคา</th><th>พร้อมขาย</th><th>สถานะ</th><th><span className="sr-only">จัดการ</span></th></tr></thead><tbody>{filtered.map((product) => <tr key={product.id} className={!product.isActive ? "archived" : ""}><td><strong>{product.sku}</strong><span>{product.nameEn}</span>{!product.isActive && <small>ซ่อนอยู่</small>}</td><td>{product.brandName}</td><td>{product.categoryName}</td><td>THB {product.priceThb.toLocaleString("th-TH")}</td><td>{Math.max(0, product.stockQuantity - product.reservedQuantity)}<small>{product.reservedQuantity ? `จองแล้ว ${product.reservedQuantity}` : ""}</small></td><td><span className={`admin-status ${product.status}`}>{statusLabels[product.status]}</span></td><td><div className="admin-product-row-actions"><button className="table-icon-button" onClick={() => openEdit(product)} aria-label={`แก้ไข ${product.nameEn}`} title="แก้ไขสินค้า"><SquarePen /></button><button className="table-icon-button" disabled={busy} onClick={() => void setProductActive(product, !product.isActive)} aria-label={`${product.isActive ? "ซ่อน" : "นำกลับมาแสดง"} ${product.nameEn}`} title={product.isActive ? "ซ่อนสินค้า" : "นำสินค้ากลับมาแสดง"}>{product.isActive ? <Archive /> : <RotateCcw />}</button></div></td></tr>)}</tbody></table>{!filtered.length && <div className="admin-empty-state">ไม่พบสินค้าที่ตรงกับตัวกรอง</div>}</div>

    {draft && <div className="admin-product-editor-backdrop"><section className="admin-product-editor" role="dialog" aria-modal="true" aria-labelledby="product-editor-title"><header><div><span>{draft.id ? "แก้ไขสินค้า" : "สินค้าใหม่"}</span><h2 id="product-editor-title">{draft.id ? draft.nameEn : "เพิ่มสินค้า"}</h2></div><button onClick={closeEditor} aria-label="ปิดหน้าต่างแก้ไขสินค้า"><X /></button></header><form onSubmit={saveProduct}>
      <div className="admin-product-form-grid">
        {editing && <div className="admin-generated-identifiers full"><span>SKU <strong>{editing.sku}</strong></span><span>URL <strong>/{editing.slug}</strong></span></div>}
        <label className="full">ชื่อภาษาอังกฤษ<input required maxLength={200} value={draft.nameEn} onChange={(event) => setDraft({ ...draft, nameEn: event.target.value })} /></label>
        <label className="full">ชื่อภาษาไทย<input required maxLength={200} value={draft.nameTh} onChange={(event) => setDraft({ ...draft, nameTh: event.target.value })} /></label>
        <label className="full">รายละเอียดภาษาอังกฤษ<textarea maxLength={5000} value={draft.descriptionEn} onChange={(event) => setDraft({ ...draft, descriptionEn: event.target.value })} /></label>
        <label className="full">รายละเอียดภาษาไทย<textarea maxLength={5000} value={draft.descriptionTh} onChange={(event) => setDraft({ ...draft, descriptionTh: event.target.value })} /></label>
        <label>ราคา (บาท)<input required min="0" step="0.01" type="number" value={draft.priceThb} onChange={(event) => setDraft({ ...draft, priceThb: Number(event.target.value) })} /></label>
        <label>น้ำหนัก (กรัม)<input required min="0" step="1" type="number" value={draft.weightGrams} onChange={(event) => setDraft({ ...draft, weightGrams: Number(event.target.value) })} /></label>
        <label>สต็อกทั้งหมด<input required min={draft.reservedQuantity} step="1" type="number" value={draft.stockQuantity} onChange={(event) => setDraft({ ...draft, stockQuantity: Number(event.target.value) })} /><small>จองแล้ว {draft.reservedQuantity} ชิ้น · สถานะคำนวณจากจำนวนพร้อมขายอัตโนมัติ</small></label>
        <label>หมวดหมู่<select value={draft.categoryId} onChange={(event) => setDraft({ ...draft, categoryId: Number(event.target.value) })}>{data.categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
        <label>แบรนด์<select value={draft.brandId} onChange={(event) => setDraft({ ...draft, brandId: Number(event.target.value) })}>{data.brands.map((brand) => <option key={brand.id} value={brand.id}>{brand.name}</option>)}</select></label>
      </div>

      <section className="admin-product-subsection"><div><h3>รุ่นรถที่รองรับ</h3><button type="button" className="admin-secondary-button" disabled={draft.fitments.length >= data.vehicleModels.length} onClick={addFitment}><Plus />เพิ่มรุ่นรถ</button></div>{draft.fitments.map((fitment, index) => <div className="admin-fitment-row" key={`${fitment.vehicleModelId}-${index}`}><select aria-label={`รุ่นรถ ${index + 1}`} value={fitment.vehicleModelId} onChange={(event) => setDraft({ ...draft, fitments: draft.fitments.map((item, itemIndex) => itemIndex === index ? { ...item, vehicleModelId: Number(event.target.value) } : item) })}>{data.vehicleModels.map((model) => <option key={model.id} value={model.id} disabled={draft.fitments.some((item, itemIndex) => itemIndex !== index && item.vehicleModelId === model.id)}>{model.name}</option>)}</select><input aria-label={`ปีเริ่มต้น ${index + 1}`} type="number" min="1900" max="2100" value={fitment.yearFrom} onChange={(event) => setDraft({ ...draft, fitments: draft.fitments.map((item, itemIndex) => itemIndex === index ? { ...item, yearFrom: Number(event.target.value) } : item) })} /><span>ถึง</span><input aria-label={`ปีสิ้นสุด ${index + 1}`} type="number" min="1900" max="2100" value={fitment.yearTo} onChange={(event) => setDraft({ ...draft, fitments: draft.fitments.map((item, itemIndex) => itemIndex === index ? { ...item, yearTo: Number(event.target.value) } : item) })} /><button type="button" disabled={draft.fitments.length === 1} onClick={() => setDraft({ ...draft, fitments: draft.fitments.filter((_, itemIndex) => itemIndex !== index) })} aria-label={`ลบรุ่นรถ ${index + 1}`}><Trash2 /></button></div>)}</section>

      <section className="admin-product-subsection"><div><h3>รูปสินค้า <small>{(editing?.images.length ?? 0) + newFiles.length}/5</small></h3><label className="admin-image-upload"><ImagePlus />เลือกรูป<input type="file" multiple accept="image/jpeg,image/png,image/webp" disabled={(editing?.images.length ?? 0) + newFiles.length >= 5} onChange={(event) => selectFiles(event.target.files)} /></label></div><div className="admin-product-images">{editing?.images.map((image) => <div key={image.id}><Image src={image.publicUrl} alt="" fill sizes="100px" /><button type="button" disabled={busy} onClick={() => void removeImage(image.id, image.storagePath)} aria-label="ลบรูปสินค้า"><Trash2 /></button></div>)}{newFiles.map((file, index) => <div className="pending" key={`${file.name}-${file.lastModified}`}><Upload /><span>{file.name}</span><button type="button" onClick={() => setNewFiles((current) => current.filter((_, itemIndex) => itemIndex !== index))} aria-label={`ลบ ${file.name}`}><X /></button></div>)}</div></section>

      {error && <p className="admin-action-message error" role="alert">{error}</p>}
      <footer><button type="button" className="admin-secondary-button" disabled={busy} onClick={closeEditor}>ยกเลิก</button><button className="admin-primary-button" disabled={busy}>{busy ? "กำลังบันทึก..." : draft.id ? "บันทึกการแก้ไข" : "เพิ่มสินค้า"}</button></footer>
    </form></section></div>}
  </>;
}
