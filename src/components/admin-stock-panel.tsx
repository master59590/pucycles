"use client";

import { ChevronDown, ChevronLeft, ChevronRight, Clock3, PackageMinus, PackagePlus, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { StockMovement } from "@/lib/admin-convenience-types";
import type { AdminProduct } from "@/lib/admin-products";
import { createClient } from "@/lib/supabase/client";

const presets = [1, 5, 10];
const pageSize = 15;
const reasons = [
  { value: "online_order", label: "ออเดอร์ออนไลน์" },
  { value: "product_edit", label: "แก้ไขจากข้อมูลสินค้า" },
  { value: "stock_received", label: "รับสินค้าจากผู้ขาย" },
  { value: "walk_in_service", label: "ขาย/ใช้กับลูกค้าหน้าร้าน" },
  { value: "customer_return", label: "ลูกค้าคืนสินค้า" },
  { value: "damaged", label: "สินค้าเสียหาย" },
  { value: "supplier_return", label: "ส่งคืนผู้ขาย" },
  { value: "stock_correction", label: "แก้ไขยอดตรวจนับ" },
];

const reasonLabel = (value: string) => reasons.find((reason) => reason.value === value)?.label ?? value.replaceAll("_", " ");

export function AdminStockPanel({ products, movements }: { products: AdminProduct[]; movements: StockMovement[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [reasonByProduct, setReasonByProduct] = useState<Record<string, string>>({});
  const [noteByProduct, setNoteByProduct] = useState<Record<string, string>>({});
  const [historyProductId, setHistoryProductId] = useState<string | null>(null);
  const [busyProductId, setBusyProductId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const activeProducts = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return products.filter((product) => product.isActive && (!needle || `${product.sku} ${product.nameEn} ${product.nameTh} ${product.brandName}`.toLowerCase().includes(needle)));
  }, [products, query]);
  const totalPages = Math.max(1, Math.ceil(activeProducts.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const visibleProducts = activeProducts.slice((safePage - 1) * pageSize, safePage * pageSize);

  const adjustStock = async (product: AdminProduct, direction: "in" | "out") => {
    const quantity = quantities[product.id] ?? 0;
    const available = Math.max(0, product.stockQuantity - product.reservedQuantity);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100000) return setError("กรุณากรอกจำนวนเต็มระหว่าง 1 ถึง 100,000");
    if (direction === "out" && quantity > available) return setError(`เบิกได้ไม่เกินจำนวนพร้อมขาย ${available} ชิ้น`);
    const reason = reasonByProduct[product.id] || (direction === "in" ? "stock_received" : "walk_in_service");
    const note = noteByProduct[product.id]?.trim() ?? "";
    const action = direction === "in" ? "รับเข้า" : "เบิกออก";
    if (!window.confirm(`${action} ${product.nameEn} จำนวน ${quantity} ชิ้น\nเหตุผล: ${reasonLabel(reason)}${note ? `\nหมายเหตุ: ${note}` : ""}`)) return;

    setBusyProductId(product.id);
    setMessage("");
    setError("");
    const { error: adjustError } = await createClient().rpc("admin_adjust_stock", {
      p_product_id: product.id,
      p_quantity: quantity,
      p_direction: direction,
      p_reason: reason,
      p_note: note,
    });
    if (adjustError) setError(adjustError.message);
    else {
      setQuantities((current) => ({ ...current, [product.id]: 0 }));
      setNoteByProduct((current) => ({ ...current, [product.id]: "" }));
      setMessage(`${action} ${product.nameEn} แล้ว ${quantity} ชิ้น`);
      router.refresh();
    }
    setBusyProductId(null);
  };

  return <main>
    <div className="admin-page-heading"><div><span>คลังสินค้า</span><h1>จัดการสต็อก</h1><p>รับเข้า เบิกหน้าร้าน และตรวจสอบประวัติการเคลื่อนไหว</p></div></div>
    {message && <p className="admin-action-message success" role="status">{message}</p>}
    {error && <p className="admin-action-message error" role="alert">{error}</p>}
    <div className="admin-toolbar admin-stock-toolbar"><label><Search /><input aria-label="ค้นหาสต็อก" placeholder="ค้นหาชื่อ แบรนด์ หรือ SKU" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} /></label></div>
    <div className="admin-table-wrap"><table className="admin-table admin-stock-table"><thead><tr><th>สินค้า</th><th>ทั้งหมด</th><th>จองแล้ว</th><th>พร้อมขาย</th><th>สถานะ</th><th>ปรับสต็อก</th></tr></thead><tbody>
      {visibleProducts.map((product) => {
        const quantity = quantities[product.id] ?? 0;
        const status = { in_stock: "มีสินค้า", low_stock: "เหลือน้อย", out_of_stock: "สินค้าหมด" }[product.status];
        const available = Math.max(0, product.stockQuantity - product.reservedQuantity);
        const productMovements = movements.filter((movement) => movement.productId === product.id);
        return <tr key={product.id}><td><strong>{product.sku}</strong><span>{product.nameEn}</span><small>{product.brandName}</small><button type="button" className="admin-stock-history-toggle" aria-expanded={historyProductId === product.id} onClick={() => setHistoryProductId((current) => current === product.id ? null : product.id)}><Clock3 />ประวัติ {productMovements.length}<ChevronDown /></button>{historyProductId === product.id && <div className="admin-stock-history">{productMovements.slice(0, 20).map((movement) => <article key={movement.id}><strong className={movement.quantityDelta > 0 ? "positive" : "negative"}>{movement.quantityDelta > 0 ? "+" : ""}{movement.quantityDelta}</strong><span>{reasonLabel(movement.reason)}<small>{movement.note || `${movement.quantityBefore} → ${movement.quantityAfter}`} · {new Date(movement.createdAt).toLocaleString("th-TH", { dateStyle: "short", timeStyle: "short" })}</small></span></article>)}{!productMovements.length && <small>ยังไม่มีประวัติการปรับสต็อก</small>}</div>}</td><td>{product.stockQuantity}</td><td>{product.reservedQuantity}</td><td><strong>{available}</strong></td><td><span className={`admin-status ${product.status}`}>{status}</span></td><td><div className="admin-stock-receive"><div>{presets.map((preset) => <button type="button" key={preset} disabled={busyProductId !== null} onClick={() => setQuantities((current) => ({ ...current, [product.id]: preset }))}>{preset}</button>)}</div><input type="number" min="1" max="100000" step="1" aria-label={`จำนวนปรับสต็อกของ ${product.nameEn}`} value={quantity || ""} placeholder="จำนวน" onChange={(event) => setQuantities((current) => ({ ...current, [product.id]: Number(event.target.value) }))} /><select aria-label={`เหตุผลปรับสต็อก ${product.nameEn}`} value={reasonByProduct[product.id] ?? "stock_received"} onChange={(event) => setReasonByProduct((current) => ({ ...current, [product.id]: event.target.value }))}>{reasons.map((reason) => <option key={reason.value} value={reason.value}>{reason.label}</option>)}</select><input className="admin-stock-note" maxLength={300} aria-label={`หมายเหตุปรับสต็อก ${product.nameEn}`} value={noteByProduct[product.id] ?? ""} placeholder="หมายเหตุ (ถ้ามี)" onChange={(event) => setNoteByProduct((current) => ({ ...current, [product.id]: event.target.value }))} /><button className="admin-primary-button" disabled={busyProductId !== null || quantity < 1} onClick={() => void adjustStock(product, "in")}><PackagePlus />{busyProductId === product.id ? "กำลังบันทึก..." : "รับเข้า"}</button><button className="admin-secondary-button admin-stock-issue" disabled={busyProductId !== null || quantity < 1 || quantity > available} onClick={() => void adjustStock(product, "out")}><PackageMinus />เบิกออก</button></div></td></tr>;
      })}
    </tbody></table>{!activeProducts.length && <div className="admin-empty-state">ไม่พบสินค้าที่ตรงกับการค้นหา</div>}</div>
    {activeProducts.length > pageSize && <nav className="admin-pagination" aria-label="แบ่งหน้าสต็อก"><button disabled={safePage === 1} onClick={() => setPage(safePage - 1)} aria-label="หน้าก่อนหน้า"><ChevronLeft /></button><span>หน้า {safePage} / {totalPages} · {activeProducts.length} รายการ</span><button disabled={safePage === totalPages} onClick={() => setPage(safePage + 1)} aria-label="หน้าถัดไป"><ChevronRight /></button></nav>}
  </main>;
}
