"use client";

import { Banknote, Check, ChevronLeft, ChevronRight, CircleX, Copy, Download, ExternalLink, History, MapPinned, MessageSquarePlus, PackageCheck, Pencil, Printer, RotateCcw, Search, Trash2, Truck, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { adminOrderStatusCopy } from "@/data/admin";
import type { AdminOrder } from "@/lib/admin-orders";
import { getTrackingUrl, type ShippingCarrier } from "@/lib/admin-convenience-types";
import type { AdminOrderEvent, AdminOrderRefund } from "@/lib/admin-operations";
import { createClient } from "@/lib/supabase/client";
import type { OrderStatus } from "@/types/shop";

const statuses: Array<{ value: "all" | OrderStatus; label: string }> = [
  { value: "all", label: "ทุกสถานะ" },
  ...Object.entries(adminOrderStatusCopy).map(([value, label]) => ({ value: value as OrderStatus, label })),
];

type ActionResult = { error: { message: string } | null };
type DeliveryDraft = { name: string; phone: string; address: string; city: string; postalCode: string };
type Confirmation = { title: string; body: string; label: string; danger?: boolean; reasonLabel?: string; action: (reason: string) => void };
const pageSize = 15;

function displayTotal(order: AdminOrder) {
  if (order.totalThb === null) return "รอแจ้งค่าจัดส่ง";
  return `${order.currency} ${(order.totalThb * order.exchangeRate).toLocaleString("th-TH", { maximumFractionDigits: 2 })}`;
}

function deliveryFrom(order: AdminOrder): DeliveryDraft {
  return { name: order.customer, phone: order.phone, address: order.address, city: order.city, postalCode: order.postalCode };
}

function escapeHtml(value: string | number) {
  return String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[character] ?? character);
}

export function AdminOrdersPanel({ orders, events, refunds, carriers, initialOrderId, initialStatus }: { orders: AdminOrder[]; events: AdminOrderEvent[]; refunds: AdminOrderRefund[]; carriers: ShippingCarrier[]; initialOrderId?: string; initialStatus?: string }) {
  const router = useRouter();
  const initialOrder = orders.find((order) => order.id === initialOrderId) ?? orders[0] ?? null;
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | OrderStatus>(statuses.some((item) => item.value === initialStatus) ? initialStatus as OrderStatus : "all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sort, setSort] = useState<"newest" | "oldest">("newest");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState(initialOrder?.id ?? "");
  const [shippingFee, setShippingFee] = useState("");
  const [shippingCompany, setShippingCompany] = useState(initialOrder?.shippingCompany ?? "");
  const [trackingNumber, setTrackingNumber] = useState(initialOrder?.trackingNumber ?? "");
  const [delivery, setDelivery] = useState<DeliveryDraft>(initialOrder ? deliveryFrom(initialOrder) : { name: "", phone: "", address: "", city: "", postalCode: "" });
  const [editingDelivery, setEditingDelivery] = useState(false);
  const [editingTracking, setEditingTracking] = useState(false);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [confirmationReason, setConfirmationReason] = useState("");
  const [internalNote, setInternalNote] = useState("");
  const [refundReference, setRefundReference] = useState("");
  const [refundRestock, setRefundRestock] = useState(false);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return orders.filter((order) => {
      const matchesStatus = status === "all" || order.status === status;
      const matchesQuery = !needle || `${order.orderNumber} ${order.customer} ${order.phone} ${order.country}`.toLowerCase().includes(needle);
      const createdDate = order.createdAt.slice(0, 10);
      return matchesStatus && matchesQuery && (!dateFrom || createdDate >= dateFrom) && (!dateTo || createdDate <= dateTo);
    }).sort((a, b) => sort === "newest" ? b.createdAt.localeCompare(a.createdAt) : a.createdAt.localeCompare(b.createdAt));
  }, [dateFrom, dateTo, orders, query, sort, status]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const visibleOrders = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);
  const selected = filtered.find((order) => order.id === selectedId) ?? filtered[0] ?? null;
  const selectedEvents = selected ? events.filter((event) => event.orderId === selected.id) : [];
  const selectedRefund = selected ? refunds.find((refund) => refund.orderId === selected.id) ?? null : null;
  const selectedCarrier = carriers.find((carrier) => carrier.name === (selected?.shippingCompany ?? shippingCompany));
  const trackingUrl = selected?.trackingNumber && selectedCarrier ? getTrackingUrl(selectedCarrier.trackingUrlTemplate, selected.trackingNumber) : "";

  const chooseOrder = (order: AdminOrder) => {
    setSelectedId(order.id);
    setShippingFee("");
    setShippingCompany(order.shippingCompany ?? "");
    setTrackingNumber(order.trackingNumber ?? "");
    setDelivery(deliveryFrom(order));
    setEditingDelivery(false);
    setEditingTracking(false);
    setCopied(false);
    setMessage("");
    setError("");
    setInternalNote("");
    setRefundReference("");
    setRefundRestock(false);
  };

  const runAction = async (
    action: (supabase: ReturnType<typeof createClient>) => PromiseLike<ActionResult>,
    success: string,
    onSuccess?: () => void,
  ) => {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const result = await action(createClient());
      if (result.error) throw new Error(result.error.message);
      setMessage(success);
      onSuccess?.();
      router.refresh();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "ไม่สามารถดำเนินการได้");
    } finally {
      setBusy(false);
    }
  };

  const openConfirmation = (nextConfirmation: Confirmation) => {
    setConfirmationReason("");
    setConfirmation(nextConfirmation);
  };

  const quoteShipping = () => {
    const fee = Number(shippingFee);
    if (!selected || !Number.isFinite(fee) || fee < 0) return setError("กรุณากรอกค่าจัดส่งเป็นเงินบาทให้ถูกต้อง");
    void runAction(
      (supabase) => supabase.rpc("admin_set_shipping_quote", { p_order_id: selected.id, p_shipping_fee_thb: fee }),
      "บันทึกค่าจัดส่งแล้ว ลูกค้าสามารถชำระเงินได้",
    );
  };

  const askToConfirmPayment = () => {
    if (!selected) return;
    openConfirmation({
      title: "ยืนยันการชำระเงินหรือไม่?",
      body: `ยืนยันคำสั่งซื้อ ${selected.orderNumber} ระบบจะตัดยอดสินค้าที่จองไว้ออกจากสต็อก`,
      label: "ยืนยันการชำระเงิน",
      action: () => void runAction(
        (supabase) => supabase.rpc("admin_confirm_payment", { p_order_id: selected.id }),
        "ยืนยันการชำระเงินและตัดสต็อกแล้ว",
      ),
    });
  };

  const askToRejectPayment = () => {
    if (!selected) return;
    openConfirmation({
      title: "ปฏิเสธหลักฐานการชำระเงินหรือไม่?",
      body: `คำสั่งซื้อ ${selected.orderNumber} จะกลับไปเป็นสถานะรอชำระเงิน ลูกค้าจะเห็นเหตุผลและแนบสลิปใหม่ได้`,
      label: "ปฏิเสธสลิป",
      danger: true,
      reasonLabel: "เหตุผลที่แสดงให้ลูกค้าเห็น",
      action: (reason) => void runAction(
        (supabase) => supabase.rpc("admin_reject_payment", { p_order_id: selected.id, p_reason: reason.trim() }),
        "ปฏิเสธสลิปแล้ว ลูกค้าสามารถแนบสลิปใหม่ได้",
      ),
    });
  };

  const markPreparing = () => {
    if (!selected) return;
    void runAction(
      (supabase) => supabase.rpc("admin_set_order_stage", { p_order_id: selected.id, p_target_status: "preparing" }),
      "เปลี่ยนสถานะเป็นกำลังเตรียมสินค้าแล้ว",
    );
  };

  const askToRevertPreparing = () => {
    if (!selected) return;
    openConfirmation({
      title: "เปลี่ยนกลับเป็นชำระเงินแล้วหรือไม่?",
      body: `คำสั่งซื้อ ${selected.orderNumber} จะออกจากรายการกำลังเตรียมสินค้า โดยข้อมูลการชำระเงินและสต็อกไม่เปลี่ยนแปลง`,
      label: "เปลี่ยนกลับ",
      action: () => void runAction(
        (supabase) => supabase.rpc("admin_set_order_stage", { p_order_id: selected.id, p_target_status: "paid" }),
        "เปลี่ยนสถานะกลับเป็นชำระเงินแล้ว",
      ),
    });
  };

  const saveDelivery = () => {
    if (!selected || !delivery.name.trim() || !delivery.phone.trim() || !delivery.address.trim() || !delivery.city.trim() || !delivery.postalCode.trim()) {
      return setError("กรุณากรอกข้อมูลจัดส่งให้ครบทุกช่อง");
    }
    const execute = () => void runAction(
      (supabase) => supabase.rpc("admin_update_order_address", {
        p_order_id: selected.id,
        p_customer_name: delivery.name.trim(),
        p_customer_phone: delivery.phone.trim(),
        p_shipping_address: delivery.address.trim(),
        p_shipping_city: delivery.city.trim(),
        p_postal_code: delivery.postalCode.trim(),
      }),
      "แก้ไขข้อมูลจัดส่งแล้ว",
      () => setEditingDelivery(false),
    );
    if (selected.status === "paid" || selected.status === "preparing") {
      openConfirmation({
        title: "แก้ไขที่อยู่ของคำสั่งซื้อที่ชำระแล้วหรือไม่?",
        body: `ยืนยันข้อมูลจัดส่งใหม่ของคำสั่งซื้อ ${selected.orderNumber}`,
        label: "บันทึกที่อยู่",
        action: execute,
      });
    } else {
      execute();
    }
  };

  const askToMarkShipped = () => {
    if (!selected || !shippingCompany.trim() || !trackingNumber.trim()) return setError("กรุณากรอกบริษัทขนส่งและเลข Tracking");
    openConfirmation({
      title: "ยืนยันว่าจัดส่งสินค้าแล้วหรือไม่?",
      body: `คำสั่งซื้อ ${selected.orderNumber} จะใช้เลข Tracking ${trackingNumber.trim()} และลูกค้าจะเห็นข้อมูลทันที`,
      label: "ยืนยันการจัดส่ง",
      action: () => void runAction(
        (supabase) => supabase.rpc("admin_mark_shipped", { p_order_id: selected.id, p_shipping_company: shippingCompany.trim(), p_tracking_number: trackingNumber.trim() }),
        "บันทึก Tracking แล้ว ลูกค้าสามารถตรวจสอบได้",
      ),
    });
  };

  const askToUpdateTracking = () => {
    if (!selected || !shippingCompany.trim() || !trackingNumber.trim()) return setError("กรุณากรอกบริษัทขนส่งและเลข Tracking");
    openConfirmation({
      title: "แก้ไขข้อมูล Tracking หรือไม่?",
      body: `เลข Tracking ที่ลูกค้าเห็นจะเปลี่ยนเป็น ${trackingNumber.trim()}`,
      label: "บันทึก Tracking",
      action: () => void runAction(
        (supabase) => supabase.rpc("admin_update_tracking", { p_order_id: selected.id, p_shipping_company: shippingCompany.trim(), p_tracking_number: trackingNumber.trim() }),
        "แก้ไขข้อมูล Tracking แล้ว",
        () => setEditingTracking(false),
      ),
    });
  };

  const askToCancelUnpaid = () => {
    if (!selected) return;
    openConfirmation({
      title: "ยกเลิกคำสั่งซื้อที่ยังไม่ชำระหรือไม่?",
      body: `คำสั่งซื้อ ${selected.orderNumber} จะถูกยกเลิกและคืนยอดสินค้าที่จองไว้ทั้งหมด`,
      label: "ยกเลิกคำสั่งซื้อ",
      danger: true,
      action: () => void runAction(
        (supabase) => supabase.rpc("cancel_customer_order", { p_order_id: selected.id }),
        "ยกเลิกคำสั่งซื้อและคืนยอดจองสต็อกแล้ว",
      ),
    });
  };

  const addInternalNote = () => {
    if (!selected || internalNote.trim().length < 1) return;
    void runAction(
      (supabase) => supabase.rpc("admin_add_order_note", { p_order_id: selected.id, p_note: internalNote.trim() }),
      "เพิ่มหมายเหตุภายในแล้ว",
      () => setInternalNote(""),
    );
  };

  const askToStartRefund = () => {
    if (!selected) return;
    openConfirmation({
      title: "เริ่มดำเนินการคืนเงินหรือไม่?",
      body: `ออเดอร์ ${selected.orderNumber} จะถูกพักจากขั้นตอนจัดส่ง กรุณาคืนเงินให้ลูกค้าด้วยตนเองก่อนกดยืนยันว่าเสร็จแล้ว`,
      label: "เริ่มคืนเงิน",
      danger: true,
      reasonLabel: "เหตุผลการคืนเงิน (หมายเหตุภายใน)",
      action: (reason) => void runAction(
        (supabase) => supabase.rpc("admin_start_refund", { p_order_id: selected.id, p_reason: reason.trim() }),
        "เริ่มขั้นตอนคืนเงินแล้ว",
      ),
    });
  };

  const askToCancelRefund = () => {
    if (!selected) return;
    openConfirmation({
      title: "ยกเลิกขั้นตอนคืนเงินหรือไม่?",
      body: "สถานะออเดอร์จะกลับไปเป็นสถานะก่อนเริ่มคืนเงิน และยังไม่มีการเพิ่มสต็อก",
      label: "ยกเลิกการคืนเงิน",
      action: () => void runAction(
        (supabase) => supabase.rpc("admin_cancel_refund", { p_order_id: selected.id }),
        "ยกเลิกขั้นตอนคืนเงินแล้ว",
      ),
    });
  };

  const askToCompleteRefund = () => {
    if (!selected || refundReference.trim().length < 2) return setError("กรุณากรอกเลขอ้างอิงหรือรายละเอียดการคืนเงิน");
    openConfirmation({
      title: "ยืนยันว่าคืนเงินเรียบร้อยแล้วหรือไม่?",
      body: refundRestock
        ? "ระบบจะปิดออเดอร์และนำสินค้าทั้งหมดในออเดอร์กลับเข้าสู่สต็อก"
        : "ระบบจะปิดออเดอร์โดยไม่นำสินค้ากลับเข้าสู่สต็อก",
      label: "ยืนยันคืนเงินแล้ว",
      danger: true,
      action: () => void runAction(
        (supabase) => supabase.rpc("admin_complete_refund", {
          p_order_id: selected.id,
          p_transfer_reference: refundReference.trim(),
          p_restock: refundRestock,
        }),
        "บันทึกการคืนเงินเรียบร้อยแล้ว",
      ),
    });
  };

  const copyTracking = async () => {
    if (!selected?.trackingNumber) return;
    await navigator.clipboard.writeText(selected.trackingNumber);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  };

  const exportCsv = () => {
    const rows = [["คำสั่งซื้อ", "ลูกค้า", "ประเทศ", "สถานะ", "ยอดรวม THB", "วันที่สร้าง"], ...filtered.map((order) => [order.orderNumber, order.customer, order.country, adminOrderStatusCopy[order.status], String(order.totalThb ?? ""), order.createdAt])];
    const csv = rows.map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `pucycles-orders-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const printOrder = (type: "packing" | "label") => {
    if (!selected) return;
    const title = type === "packing" ? `ใบจัดสินค้า ${selected.orderNumber}` : `ใบปะหน้า ${selected.orderNumber}`;
    const items = selected.items.map((item) => `<tr><td>${escapeHtml(item.sku)}</td><td>${escapeHtml(item.name)}</td><td>${item.quantity}</td></tr>`).join("");
    const body = type === "packing" ? `<h1>PUCYCLES</h1><h2>${escapeHtml(selected.orderNumber)}</h2><p>${escapeHtml(selected.customer)} · ${escapeHtml(selected.phone)}</p><table><thead><tr><th>SKU</th><th>สินค้า</th><th>จำนวน</th></tr></thead><tbody>${items}</tbody></table><p class="note">ตรวจครบ ______ แพ็กแล้ว ______</p>` : `<div class="label"><h1>${escapeHtml(selected.customer)}</h1><p class="phone">${escapeHtml(selected.phone)}</p><p>${escapeHtml(selected.address)}<br>${escapeHtml(selected.city)} ${escapeHtml(selected.postalCode)}<br>${escapeHtml(selected.country)}</p><hr><strong>${escapeHtml(selected.orderNumber)}</strong>${selected.trackingNumber ? `<p>Tracking: ${escapeHtml(selected.trackingNumber)}</p>` : ""}</div>`;
    const popup = window.open("", "_blank", "width=800,height=900");
    if (!popup) return setError("เบราว์เซอร์ปิดกั้นหน้าต่างพิมพ์ กรุณาอนุญาต Pop-up สำหรับเว็บไซต์นี้");
    popup.document.write(`<!doctype html><html lang="th"><head><title>${escapeHtml(title)}</title><style>body{font-family:Arial,sans-serif;color:#111;padding:28px}h1{font-size:24px;margin:0 0 8px}h2{font-size:18px}table{width:100%;border-collapse:collapse;margin-top:24px}th,td{padding:10px;border:1px solid #bbb;text-align:left}.note{margin-top:40px}.label{border:2px solid #111;padding:28px;font-size:20px;line-height:1.5}.label h1{font-size:34px}.phone{font-weight:bold}@media print{body{padding:0}}</style></head><body>${body}<script>window.onload=()=>window.print()<\/script></body></html>`);
    popup.document.close();
  };

  return <>
    <div className="admin-task-tabs" role="tablist" aria-label="งานออเดอร์ด่วน">
      {([ ["all", "ทั้งหมด"], ["shipping_quote", "รอแจ้งค่าส่ง"], ["payment_submitted", "รอตรวจสลิป"], ["paid", "รอเริ่มแพ็ก"], ["preparing", "กำลังเตรียม"] ] as Array<["all" | OrderStatus, string]>).map(([value, label]) => <button key={value} role="tab" aria-selected={status === value} className={status === value ? "active" : ""} onClick={() => { setStatus(value); setPage(1); }}><span>{label}</span><strong>{value === "all" ? orders.length : orders.filter((order) => order.status === value).length}</strong></button>)}
    </div>
    <div className="admin-toolbar admin-orders-toolbar">
      <label><Search /><input aria-label="ค้นหาคำสั่งซื้อ" placeholder="ค้นหาเลขคำสั่งซื้อหรือลูกค้า" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} /></label>
      <select aria-label="กรองสถานะคำสั่งซื้อ" value={status} onChange={(event) => { setStatus(event.target.value as "all" | OrderStatus); setPage(1); }}>{statuses.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select>
      <label className="admin-date-filter">จากวันที่<input type="date" value={dateFrom} onChange={(event) => { setDateFrom(event.target.value); setPage(1); }} /></label>
      <label className="admin-date-filter">ถึงวันที่<input type="date" value={dateTo} min={dateFrom} onChange={(event) => { setDateTo(event.target.value); setPage(1); }} /></label>
      <select aria-label="เรียงคำสั่งซื้อ" value={sort} onChange={(event) => { setSort(event.target.value as "newest" | "oldest"); setPage(1); }}><option value="newest">ใหม่ล่าสุด</option><option value="oldest">เก่าสุด</option></select>
      <button className="admin-secondary-button" onClick={exportCsv}><Download />ส่งออก CSV</button>
    </div>

    <div className="admin-orders-layout">
      <div className="admin-table-wrap">
        <table className="admin-table admin-orders-table">
          <thead><tr><th>คำสั่งซื้อ</th><th>ลูกค้า</th><th>ประเทศ</th><th>ยอดรวม</th><th>สถานะ</th><th>วันที่</th></tr></thead>
          <tbody>{visibleOrders.map((order) => <tr key={order.id} className={selected?.id === order.id ? "selected" : ""} onClick={() => chooseOrder(order)}>
            <td><button className="admin-order-select"><strong>{order.orderNumber}</strong></button></td>
            <td>{order.customer}</td><td>{order.country}</td><td>{displayTotal(order)}</td>
            <td><span className={`admin-status ${order.status}`}>{adminOrderStatusCopy[order.status]}</span></td>
            <td>{new Date(order.createdAt).toLocaleDateString("th-TH")}</td>
          </tr>)}</tbody>
        </table>
        {!filtered.length && <div className="admin-empty-state">ไม่พบคำสั่งซื้อที่ตรงกับตัวกรอง</div>}
        {filtered.length > pageSize && <nav className="admin-pagination" aria-label="แบ่งหน้าคำสั่งซื้อ"><button disabled={safePage === 1} onClick={() => setPage(safePage - 1)}><ChevronLeft /></button><span>หน้า {safePage} / {totalPages} · {filtered.length} รายการ</span><button disabled={safePage === totalPages} onClick={() => setPage(safePage + 1)}><ChevronRight /></button></nav>}
      </div>

      {selected && <aside className="admin-order-detail" aria-live="polite">
        <div className="admin-order-detail-heading"><div><span>คำสั่งซื้อ</span><h2>{selected.orderNumber}</h2></div><span className={`admin-status ${selected.status}`}>{adminOrderStatusCopy[selected.status]}</span></div>
        <div className="admin-print-actions"><button onClick={() => printOrder("packing")}><Printer />ใบจัดสินค้า</button><button onClick={() => printOrder("label")}><MapPinned />ใบปะหน้า</button></div>

        <dl className="admin-order-facts">
          <div><dt>ลูกค้า</dt><dd>{selected.customer}<small>{selected.phone}</small></dd></div>
          <div><dt>จัดส่ง</dt><dd>{selected.address}<br />{selected.city}, {selected.postalCode}<small>{selected.country}</small></dd></div>
          <div><dt>ชำระเงิน</dt><dd>{selected.paymentMethod === "bank_transfer" ? "โอนผ่านธนาคาร" : "Western Union"}<small>{displayTotal(selected)}</small></dd></div>
        </dl>

        {selected.status !== "shipped" && selected.status !== "cancelled" && <button className="admin-inline-action" onClick={() => setEditingDelivery((current) => !current)}><Pencil />{editingDelivery ? "ปิดการแก้ไขที่อยู่" : "แก้ไขข้อมูลจัดส่ง"}</button>}
        {editingDelivery && <div className="admin-delivery-form">
          <label>ชื่อผู้รับ<input maxLength={120} value={delivery.name} onChange={(event) => setDelivery({ ...delivery, name: event.target.value })} /></label>
          <label>เบอร์โทร<input maxLength={40} value={delivery.phone} onChange={(event) => setDelivery({ ...delivery, phone: event.target.value })} /></label>
          <label className="full">ที่อยู่<textarea maxLength={500} value={delivery.address} onChange={(event) => setDelivery({ ...delivery, address: event.target.value })} /></label>
          <label>เมือง / รัฐ / จังหวัด<input maxLength={120} value={delivery.city} onChange={(event) => setDelivery({ ...delivery, city: event.target.value })} /></label>
          <label>รหัสไปรษณีย์<input maxLength={20} value={delivery.postalCode} onChange={(event) => setDelivery({ ...delivery, postalCode: event.target.value })} /></label>
          <button className="admin-primary-button full" disabled={busy} onClick={saveDelivery}><Check />บันทึกข้อมูลจัดส่ง</button>
        </div>}

        <div className="admin-order-items"><h3>รายการสินค้า</h3>{selected.items.map((item) => <div key={item.id}><span><strong>{item.name}</strong><small>{item.sku} x {item.quantity}</small></span><strong>THB {(item.unitPriceThb * item.quantity).toLocaleString("th-TH")}</strong></div>)}</div>
        {selected.proofUrl && <a className="admin-proof-link" href={selected.proofUrl} target="_blank" rel="noreferrer"><ExternalLink />เปิดรูปสลิป <small>ลิงก์ส่วนตัวหมดอายุใน 10 นาที</small></a>}

        {selected.status === "shipping_quote" && <div className="admin-order-action"><label>ค่าจัดส่ง (บาท)<input type="number" min="0" step="0.01" value={shippingFee} onChange={(event) => setShippingFee(event.target.value)} /></label><button className="admin-primary-button" disabled={busy} onClick={quoteShipping}><Check />บันทึกค่าจัดส่ง</button></div>}
        {selected.status === "payment_submitted" && <div className="admin-order-action"><p>ตรวจสอบสลิปก่อนยืนยัน เมื่อยืนยันแล้วระบบจะตัดสินค้าที่จองไว้ออกจากสต็อก</p><div className="admin-payment-review-actions"><button className="admin-primary-button" disabled={busy || !selected.proofUrl} onClick={askToConfirmPayment}><Check />ยืนยันการชำระเงิน</button><button className="admin-reject-button" disabled={busy || !selected.proofUrl} onClick={askToRejectPayment}><CircleX />ปฏิเสธสลิป</button></div></div>}
        {selected.status === "paid" && <div className="admin-order-action"><button className="admin-primary-button" disabled={busy} onClick={markPreparing}><PackageCheck />เริ่มเตรียมสินค้า</button></div>}
        {selected.status === "preparing" && <div className="admin-order-action"><button className="admin-secondary-button admin-wide-button" disabled={busy} onClick={askToRevertPreparing}><RotateCcw />เปลี่ยนกลับเป็นชำระแล้ว</button></div>}

        {(selected.status === "paid" || selected.status === "preparing") && <div className="admin-order-action admin-tracking-form">
          <label>บริษัทขนส่ง<input list="shipping-carrier-options" maxLength={120} value={shippingCompany} onChange={(event) => setShippingCompany(event.target.value)} /></label>
          <label>เลข Tracking<input maxLength={120} value={trackingNumber} onChange={(event) => setTrackingNumber(event.target.value)} /></label>
          <button className="admin-primary-button" disabled={busy} onClick={askToMarkShipped}><Truck />ยืนยันการจัดส่ง</button>
        </div>}

        {selected.status === "shipped" && <div className="admin-shipped-details">
          {!editingTracking ? <><span>{selected.shippingCompany}</span><div className="admin-tracking-value"><strong>{selected.trackingNumber}</strong><button onClick={() => void copyTracking()} aria-label="คัดลอกเลข Tracking" title="คัดลอกเลข Tracking">{copied ? <Check /> : <Copy />}</button>{trackingUrl && <a href={trackingUrl} target="_blank" rel="noreferrer" aria-label="เปิดหน้าตรวจสอบพัสดุ" title="เปิดหน้าตรวจสอบพัสดุ"><ExternalLink /></a>}</div><button className="admin-inline-action" onClick={() => setEditingTracking(true)}><Pencil />แก้ไข Tracking</button></> : <div className="admin-order-action">
            <label>บริษัทขนส่ง<input list="shipping-carrier-options" maxLength={120} value={shippingCompany} onChange={(event) => setShippingCompany(event.target.value)} /></label>
            <label>เลข Tracking<input maxLength={120} value={trackingNumber} onChange={(event) => setTrackingNumber(event.target.value)} /></label>
            <button className="admin-primary-button" disabled={busy} onClick={askToUpdateTracking}><Check />บันทึก Tracking</button>
          </div>}
        </div>}

        {(selected.status === "shipping_quote" || selected.status === "waiting_payment") && <div className="admin-order-action"><button className="admin-cancel-order-button" disabled={busy} onClick={askToCancelUnpaid}><Trash2 />ยกเลิกคำสั่งซื้อที่ยังไม่ชำระ</button></div>}

        {(["paid", "preparing", "shipped"] as OrderStatus[]).includes(selected.status) && (!selectedRefund || selectedRefund.status === "cancelled") && <div className="admin-order-action"><button className="admin-reject-button admin-wide-button" disabled={busy} onClick={askToStartRefund}><Banknote />เริ่มคืนเงินเต็มจำนวน</button></div>}

        {selected.status === "refund_pending" && selectedRefund?.status === "pending" && <div className="admin-refund-panel">
          <div><Banknote /><span><strong>กำลังดำเนินการคืนเงิน</strong><small>THB {selectedRefund.amountThb.toLocaleString("th-TH")} · {selectedRefund.reason}</small></span></div>
          <label>เลขอ้างอิง / รายละเอียดการคืนเงิน<input maxLength={160} value={refundReference} onChange={(event) => setRefundReference(event.target.value)} placeholder="เช่น เลขรายการโอน หรือ คืนเงินสด" /></label>
          <label className="admin-checkbox"><input type="checkbox" checked={refundRestock} onChange={(event) => setRefundRestock(event.target.checked)} /><span>ได้รับสินค้าคืนแล้วและให้นำกลับเข้าสต็อก</span></label>
          <button className="admin-primary-button" disabled={busy} onClick={askToCompleteRefund}><Check />ยืนยันคืนเงินเรียบร้อย</button>
          <button className="admin-inline-action" disabled={busy} onClick={askToCancelRefund}><RotateCcw />ยกเลิกขั้นตอนคืนเงิน</button>
        </div>}

        {selected.status === "refunded" && selectedRefund && <div className="admin-refund-panel complete"><div><Check /><span><strong>คืนเงินเรียบร้อยแล้ว</strong><small>{selectedRefund.transferReference}{selectedRefund.restocked ? " · คืนสินค้าเข้าสู่สต็อกแล้ว" : " · ไม่คืนสินค้าเข้าสู่สต็อก"}</small></span></div></div>}

        <section className="admin-order-notes"><h3><MessageSquarePlus />หมายเหตุภายใน</h3><textarea maxLength={1000} value={internalNote} onChange={(event) => setInternalNote(event.target.value)} placeholder="ข้อมูลสำหรับเจ้าของร้าน ลูกค้าจะไม่เห็นข้อความนี้" /><button className="admin-secondary-button" disabled={busy || !internalNote.trim()} onClick={addInternalNote}>เพิ่มหมายเหตุ</button></section>

        <section className="admin-order-history"><h3><History />ประวัติคำสั่งซื้อ</h3>{selectedEvents.map((event) => <article key={event.id}><span className={`actor-${event.actorType}`} /><div><strong>{event.title}</strong>{event.detail && <p>{event.detail}</p>}<small>{event.actorType === "admin" ? "ผู้ดูแล" : event.actorType === "customer" ? "ลูกค้า" : "ระบบ"} · {new Date(event.createdAt).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" })}</small></div></article>)}{!selectedEvents.length && <p className="admin-order-history-empty">ประวัติจะเริ่มบันทึกหลังติดตั้ง migration ล่าสุด</p>}</section>

        {message && <p className="admin-action-message success" role="status">{message}</p>}
        {error && <p className="admin-action-message error" role="alert">{error}</p>}
      </aside>}
    </div>
    <datalist id="shipping-carrier-options">{carriers.map((carrier) => <option key={carrier.id} value={carrier.name} />)}</datalist>

    {confirmation && <div className="admin-confirm-backdrop" role="presentation">
      <section className="admin-confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="admin-confirm-title">
        <button className="admin-confirm-close" onClick={() => setConfirmation(null)} aria-label="ปิดหน้าต่างยืนยัน"><X /></button>
        <span>ยืนยันการดำเนินการ</span>
        <h2 id="admin-confirm-title">{confirmation.title}</h2>
        <p>{confirmation.body}</p>
        {confirmation.reasonLabel && <label className="admin-confirm-reason">{confirmation.reasonLabel}<textarea maxLength={500} autoFocus value={confirmationReason} onChange={(event) => setConfirmationReason(event.target.value)} placeholder="ตัวอย่าง: ยอดเงินไม่ตรงกับยอดคำสั่งซื้อ" /><small>{confirmationReason.trim().length}/500</small></label>}
        <div><button className="admin-secondary-button" onClick={() => setConfirmation(null)}>ย้อนกลับ</button><button className={confirmation.danger ? "admin-danger-button" : "admin-primary-button"} disabled={Boolean(confirmation.reasonLabel && confirmationReason.trim().length < 3)} onClick={() => { const action = confirmation.action; const reason = confirmationReason; setConfirmation(null); action(reason); }}>{confirmation.label}</button></div>
      </section>
    </div>}
  </>;
}
