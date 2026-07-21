"use client";

import { Bike, Plus, Save, SquarePen, Tags, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { AdminBrand, AdminCategory, AdminVehicleModel } from "@/lib/catalog-taxonomy";
import { createClient } from "@/lib/supabase/client";

export function AdminCatalogPanel({ categories, brands, vehicleModels }: { categories: AdminCategory[]; brands: AdminBrand[]; vehicleModels: AdminVehicleModel[] }) {
  const router = useRouter();
  const [tab, setTab] = useState<"categories" | "brands" | "models">("categories");
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [categoryNameEn, setCategoryNameEn] = useState("");
  const [categoryNameTh, setCategoryNameTh] = useState("");
  const [brandId, setBrandId] = useState<number | null>(null);
  const [brandName, setBrandName] = useState("");
  const [modelId, setModelId] = useState<number | null>(null);
  const [modelName, setModelName] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const resetCategory = () => {
    setCategoryId(null);
    setCategoryNameEn("");
    setCategoryNameTh("");
  };
  const resetBrand = () => {
    setBrandId(null);
    setBrandName("");
  };
  const resetModel = () => {
    setModelId(null);
    setModelName("");
  };
  const beginAction = () => {
    setBusy(true);
    setError("");
    setMessage("");
  };

  const saveCategory = async (event: React.FormEvent) => {
    event.preventDefault();
    beginAction();
    const { error: saveError } = await createClient().rpc("admin_save_category", {
      p_category_id: categoryId,
      p_name_en: categoryNameEn,
      p_name_th: categoryNameTh,
    });
    if (saveError) setError(saveError.message);
    else {
      setMessage(categoryId ? "บันทึกการแก้ไขหมวดหมู่แล้ว" : "เพิ่มหมวดหมู่แล้ว");
      resetCategory();
      router.refresh();
    }
    setBusy(false);
  };

  const saveBrand = async (event: React.FormEvent) => {
    event.preventDefault();
    beginAction();
    const { error: saveError } = await createClient().rpc("admin_save_brand", {
      p_brand_id: brandId,
      p_name: brandName,
    });
    if (saveError) setError(saveError.message);
    else {
      setMessage(brandId ? "บันทึกการแก้ไขแบรนด์แล้ว" : "เพิ่มแบรนด์แล้ว");
      resetBrand();
      router.refresh();
    }
    setBusy(false);
  };

  const saveModel = async (event: React.FormEvent) => {
    event.preventDefault();
    beginAction();
    const { error: saveError } = await createClient().rpc("admin_save_vehicle_model", {
      p_vehicle_model_id: modelId,
      p_name: modelName,
    });
    if (saveError) setError(saveError.message);
    else {
      setMessage(modelId ? "บันทึกการแก้ไขรุ่นรถแล้ว" : "เพิ่มรุ่นรถแล้ว");
      resetModel();
      router.refresh();
    }
    setBusy(false);
  };

  const removeCategory = async (category: AdminCategory) => {
    if (!window.confirm(`ยืนยันลบหมวดหมู่ ${category.nameEn} หรือไม่?`)) return;
    beginAction();
    const { error: removeError } = await createClient().rpc("admin_delete_category", { p_category_id: category.id });
    if (removeError) setError(removeError.message);
    else {
      setMessage("ลบหมวดหมู่แล้ว");
      router.refresh();
    }
    setBusy(false);
  };

  const removeBrand = async (brand: AdminBrand) => {
    if (!window.confirm(`ยืนยันลบแบรนด์ ${brand.name} หรือไม่?`)) return;
    beginAction();
    const { error: removeError } = await createClient().rpc("admin_delete_brand", { p_brand_id: brand.id });
    if (removeError) setError(removeError.message);
    else {
      setMessage("ลบแบรนด์แล้ว");
      router.refresh();
    }
    setBusy(false);
  };

  const removeModel = async (model: AdminVehicleModel) => {
    if (!window.confirm(`ยืนยันลบรุ่นรถ ${model.name} หรือไม่?`)) return;
    beginAction();
    const { error: removeError } = await createClient().rpc("admin_delete_vehicle_model", { p_vehicle_model_id: model.id });
    if (removeError) setError(removeError.message);
    else {
      setMessage("ลบรุ่นรถแล้ว");
      router.refresh();
    }
    setBusy(false);
  };

  return <main>
    <div className="admin-page-heading"><div><span>ข้อมูลสินค้า</span><h1>หมวดหมู่ แบรนด์ และรุ่นรถ</h1><p>จัดการตัวเลือกที่ใช้ตอนเพิ่มและแก้ไขสินค้า</p></div></div>
    <div className="admin-segmented-tabs" role="tablist">
      <button className={tab === "categories" ? "active" : ""} onClick={() => setTab("categories")} role="tab" aria-selected={tab === "categories"}>หมวดหมู่ <span>{categories.length}</span></button>
      <button className={tab === "brands" ? "active" : ""} onClick={() => setTab("brands")} role="tab" aria-selected={tab === "brands"}>แบรนด์ <span>{brands.length}</span></button>
      <button className={tab === "models" ? "active" : ""} onClick={() => setTab("models")} role="tab" aria-selected={tab === "models"}>รุ่นรถ <span>{vehicleModels.length}</span></button>
    </div>
    {message && <p className="admin-action-message success" role="status">{message}</p>}
    {error && <p className="admin-action-message error" role="alert">{error}</p>}

    {tab === "categories" ? <div className="admin-taxonomy-layout">
      <form className="admin-taxonomy-form" onSubmit={saveCategory}>
        <div><Tags /><h2>{categoryId ? "แก้ไขหมวดหมู่" : "เพิ่มหมวดหมู่"}</h2></div>
        <label>ชื่อภาษาอังกฤษ<input required maxLength={120} value={categoryNameEn} onChange={(event) => setCategoryNameEn(event.target.value)} /></label>
        <label>ชื่อภาษาไทย<input required maxLength={120} value={categoryNameTh} onChange={(event) => setCategoryNameTh(event.target.value)} /></label>
        <div>{categoryId && <button type="button" className="admin-secondary-button" onClick={resetCategory}><X />ยกเลิก</button>}<button className="admin-primary-button" disabled={busy}>{categoryId ? <><Save />บันทึก</> : <><Plus />เพิ่มหมวดหมู่</>}</button></div>
      </form>
      <div className="admin-taxonomy-list">
        {categories.map((category) => <article key={category.id}><div><strong>{category.nameEn}</strong><span>{category.nameTh}</span><small>สินค้า {category.productCount} รายการ | /{category.slug}</small></div><div><button onClick={() => { setCategoryId(category.id); setCategoryNameEn(category.nameEn); setCategoryNameTh(category.nameTh); }} aria-label={`แก้ไข ${category.nameEn}`}><SquarePen /></button><button disabled={busy || category.productCount > 0} onClick={() => void removeCategory(category)} aria-label={`ลบ ${category.nameEn}`} title={category.productCount ? "หมวดหมู่นี้กำลังถูกใช้งาน" : "ลบหมวดหมู่"}><Trash2 /></button></div></article>)}
        {!categories.length && <p className="admin-empty-state">ยังไม่มีหมวดหมู่</p>}
      </div>
    </div> : tab === "brands" ? <div className="admin-taxonomy-layout">
      <form className="admin-taxonomy-form" onSubmit={saveBrand}>
        <div><Tags /><h2>{brandId ? "แก้ไขแบรนด์" : "เพิ่มแบรนด์"}</h2></div>
        <label>ชื่อแบรนด์<input required maxLength={120} value={brandName} onChange={(event) => setBrandName(event.target.value)} /></label>
        <div>{brandId && <button type="button" className="admin-secondary-button" onClick={resetBrand}><X />ยกเลิก</button>}<button className="admin-primary-button" disabled={busy}>{brandId ? <><Save />บันทึก</> : <><Plus />เพิ่มแบรนด์</>}</button></div>
      </form>
      <div className="admin-taxonomy-list">
        {brands.map((brand) => <article key={brand.id}><div><strong>{brand.name}</strong><small>สินค้า {brand.productCount} รายการ | /{brand.slug}</small></div><div><button onClick={() => { setBrandId(brand.id); setBrandName(brand.name); }} aria-label={`แก้ไข ${brand.name}`}><SquarePen /></button><button disabled={busy || brand.productCount > 0} onClick={() => void removeBrand(brand)} aria-label={`ลบ ${brand.name}`} title={brand.productCount ? "แบรนด์นี้กำลังถูกใช้งาน" : "ลบแบรนด์"}><Trash2 /></button></div></article>)}
        {!brands.length && <p className="admin-empty-state">ยังไม่มีแบรนด์</p>}
      </div>
    </div> : <div className="admin-taxonomy-layout">
      <form className="admin-taxonomy-form" onSubmit={saveModel}>
        <div><Bike /><h2>{modelId ? "แก้ไขรุ่นรถ" : "เพิ่มรุ่นรถ"}</h2></div>
        <label>ชื่อรุ่นรถ<input required maxLength={120} placeholder="เช่น Triumph Speed Twin 1200" value={modelName} onChange={(event) => setModelName(event.target.value)} /></label>
        <div>{modelId && <button type="button" className="admin-secondary-button" onClick={resetModel}><X />ยกเลิก</button>}<button className="admin-primary-button" disabled={busy}>{modelId ? <><Save />บันทึก</> : <><Plus />เพิ่มรุ่นรถ</>}</button></div>
      </form>
      <div className="admin-taxonomy-list">
        {vehicleModels.map((model) => <article key={model.id}><div><strong>{model.name}</strong><small>สินค้า {model.productCount} รายการ | /{model.slug}</small></div><div><button onClick={() => { setModelId(model.id); setModelName(model.name); }} aria-label={`แก้ไข ${model.name}`}><SquarePen /></button><button disabled={busy || model.productCount > 0} onClick={() => void removeModel(model)} aria-label={`ลบ ${model.name}`} title={model.productCount ? "รุ่นรถนี้กำลังถูกใช้งาน" : "ลบรุ่นรถ"}><Trash2 /></button></div></article>)}
        {!vehicleModels.length && <p className="admin-empty-state">ยังไม่มีรุ่นรถ</p>}
      </div>
    </div>}
  </main>;
}
