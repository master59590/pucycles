"use client";

import { PackageMinus, PackagePlus, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { AdminProduct } from "@/lib/admin-products";
import { createClient } from "@/lib/supabase/client";

const presets = [1, 5, 10];

export function AdminStockPanel({ products }: { products: AdminProduct[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [busyProductId, setBusyProductId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const activeProducts = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return products.filter((product) => product.isActive && (
      !needle || `${product.sku} ${product.nameEn} ${product.nameTh} ${product.brandName}`.toLowerCase().includes(needle)
    ));
  }, [products, query]);

  const receiveStock = async (product: AdminProduct) => {
    const quantity = quantities[product.id] ?? 0;
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100000) {
      setError("กรุณากรอกจำนวนเต็มระหว่าง 1 ถึง 100,000");
      return;
    }
    if (!window.confirm(`ยืนยันรับ ${product.nameEn} เข้าสต็อกจำนวน ${quantity} ชิ้นหรือไม่?`)) return;

    setBusyProductId(product.id);
    setMessage("");
    setError("");
    const { error: receiveError } = await createClient().rpc("admin_receive_stock", {
      p_product_id: product.id,
      p_quantity: quantity,
    });
    if (receiveError) {
      setError(receiveError.message);
    } else {
      setQuantities((current) => ({ ...current, [product.id]: 0 }));
      setMessage(`รับ ${product.nameEn} เข้าสต็อกแล้ว ${quantity} ชิ้น`);
      router.refresh();
    }
    setBusyProductId(null);
  };

  const issueStock = async (product: AdminProduct) => {
    const quantity = quantities[product.id] ?? 0;
    const available = Math.max(0, product.stockQuantity - product.reservedQuantity);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > available) {
      setError(`เบิกได้ไม่เกินจำนวนพร้อมขาย ${available} ชิ้น`);
      return;
    }
    if (!window.confirm(`ยืนยันเบิก ${product.nameEn} จำนวน ${quantity} ชิ้น สำหรับลูกค้าหน้าร้านหรือไม่?`)) return;

    setBusyProductId(product.id);
    setMessage("");
    setError("");
    const { error: issueError } = await createClient().rpc("admin_issue_stock", {
      p_product_id: product.id,
      p_quantity: quantity,
    });
    if (issueError) {
      setError(issueError.message);
    } else {
      setQuantities((current) => ({ ...current, [product.id]: 0 }));
      setMessage(`เบิก ${product.nameEn} ใช้หน้าร้านแล้ว ${quantity} ชิ้น`);
      router.refresh();
    }
    setBusyProductId(null);
  };

  return <main>
    <div className="admin-page-heading"><div><span>คลังสินค้า</span><h1>จัดการสต็อก</h1><p>รับสินค้าเข้า หรือเบิกใช้กับลูกค้าหน้าร้าน โดยไม่กระทบยอดจองออนไลน์</p></div></div>
    {message && <p className="admin-action-message success" role="status">{message}</p>}
    {error && <p className="admin-action-message error" role="alert">{error}</p>}
    <div className="admin-toolbar admin-stock-toolbar"><label><Search /><input aria-label="ค้นหาสต็อก" placeholder="ค้นหาชื่อ แบรนด์ หรือ SKU" value={query} onChange={(event) => setQuery(event.target.value)} /></label></div>
    <div className="admin-table-wrap"><table className="admin-table admin-stock-table"><thead><tr><th>สินค้า</th><th>ทั้งหมด</th><th>จองแล้ว</th><th>พร้อมขาย</th><th>สถานะ</th><th>ปรับสต็อก</th></tr></thead><tbody>
      {activeProducts.map((product) => {
        const quantity = quantities[product.id] ?? 0;
        const status = { in_stock: "มีสินค้า", low_stock: "เหลือน้อย", out_of_stock: "สินค้าหมด" }[product.status];
        const available = Math.max(0, product.stockQuantity - product.reservedQuantity);
        return <tr key={product.id}><td><strong>{product.sku}</strong><span>{product.nameEn}</span><small>{product.brandName}</small></td><td>{product.stockQuantity}</td><td>{product.reservedQuantity}</td><td><strong>{available}</strong></td><td><span className={`admin-status ${product.status}`}>{status}</span></td><td><div className="admin-stock-receive"><div>{presets.map((preset) => <button type="button" key={preset} disabled={busyProductId !== null} onClick={() => setQuantities((current) => ({ ...current, [product.id]: preset }))}>{preset}</button>)}</div><input type="number" min="1" max="100000" step="1" aria-label={`จำนวนปรับสต็อกของ ${product.nameEn}`} value={quantity || ""} placeholder="จำนวน" onChange={(event) => setQuantities((current) => ({ ...current, [product.id]: Number(event.target.value) }))} /><button className="admin-primary-button" disabled={busyProductId !== null || quantity < 1} onClick={() => void receiveStock(product)}><PackagePlus />{busyProductId === product.id ? "กำลังบันทึก..." : "รับเข้า"}</button><button className="admin-secondary-button admin-stock-issue" disabled={busyProductId !== null || quantity < 1 || quantity > available} onClick={() => void issueStock(product)}><PackageMinus />เบิกหน้าร้าน</button></div></td></tr>;
      })}
    </tbody></table>{!activeProducts.length && <div className="admin-empty-state">ไม่พบสินค้าที่ตรงกับการค้นหา</div>}</div>
  </main>;
}
