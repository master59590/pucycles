"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Check, CircleAlert, CircleDollarSign, Clock3, Copy, MapPin, PackageCheck, Pencil, Receipt, Save, Trash2, Truck, Upload } from "lucide-react";
import { useEffect, useState } from "react";
import { CustomerShell } from "@/components/customer-shell";
import { useShop } from "@/components/shop-provider";
import { formatMoney, orderStatusCopy } from "@/data/commerce";
import { westernUnionPaymentDetails } from "@/data/payment";
import type { CustomerUser } from "@/lib/auth/customer";
import { customerErrorMessage } from "@/lib/customer-error";
import type { CheckoutAddress, OrderStatus } from "@/types/shop";

const orderDetailCopy = {
  en: {
    loading: "Loading order...", notFound: "Order not found", unavailable: "This order is not available for this account.", back: "Back to orders",
    imageType: "Choose a JPG, PNG, or WEBP image.", imageSize: "Image must be 5 MB or smaller.", confirmCancel: "Cancel this order and release the reserved stock?",
    created: "Created", cancelOrder: "Cancel order", reservationExpired: "Reservation expired", reservationDeadline: "Stock reservation deadline",
    refundProgress: "Refund in progress", refundProgressText: "The store is processing the refund manually. Please contact the store if you need an update.",
    refundComplete: "Refund completed", refundCompleteText: "The store has recorded this order as refunded.",
    timelinePayment: "Payment", timelineReview: "Review", timelinePreparing: "Preparing", timelineShipped: "Shipped",
    items: "Items", itemUnit: "items", quantity: "Quantity", quoteProgress: "Shipping quote in progress",
    quoteProgressText: "The store is checking Thailand Post rates using the order weight and destination. Payment will open after the final total is confirmed.",
    quoteKicker: "SHIPPING QUOTE", quoteTitle: "Review the final delivery cost", itemSubtotal: "Items", thailandPostShipping: "Thailand Post shipping",
    totalEstimate: "Total estimate", quoteNote: "Final payment is made in THB. Import duties and destination charges are not included.",
    declineCancel: "Decline and cancel", confirming: "Confirming...", acceptQuote: "Accept shipping quote",
    proofRejected: "Payment proof was not accepted", proofRejectedText: "Please check the payment details and upload a new receipt below.",
    paymentKicker: "PAYMENT", bankTransfer: "Bank transfer", amountToTransfer: "Amount to transfer", bank: "Bank", accountName: "Account name",
    accountNumber: "Account number", contactStore: "Please contact the store", copyAccount: "Copy account number", amountToSend: "AMOUNT TO SEND",
    approx: "Approx.", copied: "Copied", copyAll: "Copy all details", westernNote: "Enter these recipient details in Western Union exactly as shown.",
    paymentMethod: "Payment method", receiverName: "Receiver name", receiverAddress: "Receiver address", phone: "Phone", additional: "Additional instructions",
    chooseReceipt: "Choose receipt image", receiptHint: "JPG, PNG or WEBP - Max 5 MB", uploading: "Uploading...", submitProof: "Submit payment proof",
    receiptSubmitted: "Receipt submitted", receiptReview: "The store will review it manually.", trackingKicker: "TRACKING", carrier: "Carrier",
    trackingPending: "Tracking number pending", copyTracking: "Copy tracking number", summary: "Summary", subtotal: "Subtotal", shipping: "Shipping",
    pending: "Pending", total: "Total", pendingQuote: "Pending quote", rateSnapshot: "Rate snapshot", delivery: "Delivery", edit: "Edit",
    name: "Name", address: "Address", saving: "Saving...", saveAddress: "Save address",
  },
  th: {
    loading: "กำลังโหลดคำสั่งซื้อ...", notFound: "ไม่พบคำสั่งซื้อ", unavailable: "คำสั่งซื้อนี้ไม่พร้อมใช้งานสำหรับบัญชีนี้", back: "กลับไปคำสั่งซื้อ",
    imageType: "กรุณาเลือกรูป JPG, PNG หรือ WEBP", imageSize: "รูปภาพต้องมีขนาดไม่เกิน 5 MB", confirmCancel: "ยกเลิกคำสั่งซื้อและคืนสินค้าที่จองไว้เข้าสู่สต็อกหรือไม่?",
    created: "สร้างเมื่อ", cancelOrder: "ยกเลิกคำสั่งซื้อ", reservationExpired: "หมดเวลาจองสินค้าแล้ว", reservationDeadline: "กำหนดเวลาจองสินค้า",
    refundProgress: "กำลังดำเนินการคืนเงิน", refundProgressText: "ร้านค้ากำลังดำเนินการคืนเงินด้วยตนเอง กรุณาติดต่อร้านหากต้องการสอบถามความคืบหน้า",
    refundComplete: "คืนเงินเรียบร้อยแล้ว", refundCompleteText: "ร้านค้าบันทึกการคืนเงินสำหรับคำสั่งซื้อนี้แล้ว",
    timelinePayment: "ชำระเงิน", timelineReview: "ตรวจสอบ", timelinePreparing: "จัดเตรียม", timelineShipped: "จัดส่งแล้ว",
    items: "สินค้า", itemUnit: "รายการ", quantity: "จำนวน", quoteProgress: "กำลังตรวจสอบค่าจัดส่ง",
    quoteProgressText: "ร้านกำลังตรวจสอบค่าจัดส่งไปรษณีย์ไทยจากน้ำหนักและประเทศปลายทาง ระบบจะเปิดให้ชำระหลังยืนยันยอดแล้ว",
    quoteKicker: "ค่าจัดส่ง", quoteTitle: "ตรวจสอบค่าจัดส่งและยอดสุดท้าย", itemSubtotal: "ค่าสินค้า", thailandPostShipping: "ค่าจัดส่งไปรษณีย์ไทย",
    totalEstimate: "ยอดรวมโดยประมาณ", quoteNote: "ชำระเงินจริงเป็นเงินบาท โดยยอดนี้ยังไม่รวมภาษีนำเข้าและค่าธรรมเนียมของประเทศปลายทาง",
    declineCancel: "ไม่ยอมรับและยกเลิก", confirming: "กำลังยืนยัน...", acceptQuote: "ยอมรับค่าจัดส่ง",
    proofRejected: "หลักฐานการชำระเงินไม่ผ่านการตรวจสอบ", proofRejectedText: "กรุณาตรวจสอบข้อมูลการชำระเงินและแนบรูปใบเสร็จใหม่ด้านล่าง",
    paymentKicker: "การชำระเงิน", bankTransfer: "โอนผ่านธนาคาร", amountToTransfer: "ยอดที่ต้องโอน", bank: "ธนาคาร", accountName: "ชื่อบัญชี",
    accountNumber: "เลขบัญชี", contactStore: "กรุณาติดต่อร้านค้า", copyAccount: "คัดลอกเลขบัญชี", amountToSend: "ยอดที่ต้องชำระ",
    approx: "ประมาณ", copied: "คัดลอกแล้ว", copyAll: "คัดลอกข้อมูลทั้งหมด", westernNote: "กรอกข้อมูลผู้รับใน Western Union ให้ตรงตามที่แสดงด้านล่าง",
    paymentMethod: "วิธีชำระเงิน", receiverName: "ชื่อผู้รับ", receiverAddress: "ที่อยู่ผู้รับ", phone: "เบอร์โทร", additional: "คำแนะนำเพิ่มเติม",
    chooseReceipt: "เลือกรูปใบเสร็จ", receiptHint: "JPG, PNG หรือ WEBP - ไม่เกิน 5 MB", uploading: "กำลังอัปโหลด...", submitProof: "ส่งหลักฐานการชำระเงิน",
    receiptSubmitted: "ส่งใบเสร็จแล้ว", receiptReview: "ร้านค้าจะตรวจสอบหลักฐานด้วยตนเอง", trackingKicker: "ติดตามพัสดุ", carrier: "บริษัทขนส่ง",
    trackingPending: "รอเลขติดตามพัสดุ", copyTracking: "คัดลอกเลขติดตาม", summary: "สรุปยอด", subtotal: "ค่าสินค้า", shipping: "ค่าจัดส่ง",
    pending: "รอยืนยัน", total: "ยอดรวม", pendingQuote: "รอตรวจสอบค่าจัดส่ง", rateSnapshot: "อัตราแลกเปลี่ยนที่บันทึกไว้", delivery: "ที่อยู่จัดส่ง", edit: "แก้ไข",
    name: "ชื่อ", address: "ที่อยู่", saving: "กำลังบันทึก...", saveAddress: "บันทึกที่อยู่",
  },
} as const;

export function OrderDetail({ orderNumber, user, isAdmin }: { orderNumber: string; user: CustomerUser; isAdmin: boolean }) {
  const { orders, preferences, hydrated, submitPayment, cancelOrder, updateOrderAddress, acceptShippingQuote, products } = useShop();
  const order = orders.find((item) => item.orderNumber === orderNumber);
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState("");
  const [actionError, setActionError] = useState("");
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [address, setAddress] = useState<CheckoutAddress | null>(order?.address ?? null);
  const [copiedTracking, setCopiedTracking] = useState(false);
  const [copiedBankAccount, setCopiedBankAccount] = useState(false);
  const [copiedWesternUnion, setCopiedWesternUnion] = useState(false);
  const [openedAt] = useState(() => Date.now());
  const t = orderDetailCopy[preferences.locale];
  const timeline: Array<{ status: OrderStatus; label: string; icon: typeof Clock3 }> = [
    { status: "waiting_payment", label: t.timelinePayment, icon: CircleDollarSign },
    { status: "payment_submitted", label: t.timelineReview, icon: Receipt },
    { status: "preparing", label: t.timelinePreparing, icon: PackageCheck },
    { status: "shipped", label: t.timelineShipped, icon: Truck },
  ];

  useEffect(() => {
    if (order?.status !== "waiting_payment" || window.location.hash !== "#payment") return;
    const timer = window.setTimeout(() => document.querySelector(".payment-panel")?.scrollIntoView({ behavior: "smooth", block: "center" }), 50);
    return () => window.clearTimeout(timer);
  }, [order?.status]);

  if (!hydrated) {
    return <CustomerShell user={user} isAdmin={isAdmin}><main className="shop-page"><div className="shop-loading">{t.loading}</div></main></CustomerShell>;
  }
  if (!order) {
    return <CustomerShell user={user} isAdmin={isAdmin}><main className="shop-page"><div className="shop-empty"><Receipt /><h1>{t.notFound}</h1><p>{t.unavailable}</p><Link className="shop-primary-button" href="/orders">{t.back}</Link></div></main></CustomerShell>;
  }

  const canChange = ["waiting_payment", "shipping_quote"].includes(order.status);
  const totalThb = order.subtotalThb + (order.shippingFeeThb ?? 0);
  const isThaiBankTransfer = order.address.countryCode === "TH" && order.paymentMethod === "bank_transfer";
  const quoteNeedsAcceptance = order.address.countryCode !== "TH" && order.status === "waiting_payment" && order.shippingFeeThb !== null && order.shippingQuoteAcceptedAt === null;
  const reservationExpired = order.reservationExpiresAt ? new Date(order.reservationExpiresAt).getTime() <= openedAt : false;
  const payment = order.paymentInstructions;
  const westernUnion = {
    bankName: payment.bank_name || westernUnionPaymentDetails.bank_name,
    accountNumber: payment.account_number || westernUnionPaymentDetails.account_number,
    receiverName: payment.receiver_name || westernUnionPaymentDetails.receiver_name,
    receiverAddress: payment.receiver_address || westernUnionPaymentDetails.receiver_address,
    country: payment.country || westernUnionPaymentDetails.country,
  };
  const selectFile = (selected?: File) => {
    setFileError("");
    if (!selected) return setFile(null);
    if (!selected.type.startsWith("image/")) return setFileError(t.imageType);
    if (selected.size > 5 * 1024 * 1024) return setFileError(t.imageSize);
    setFile(selected);
  };
  const runAction = async (action: () => Promise<void>) => {
    setActionError("");
    setBusy(true);
    try {
      await action();
    } catch (error) {
      setActionError(customerErrorMessage(error, preferences.locale));
    } finally {
      setBusy(false);
    }
  };
  const uploadProof = () => {
    if (file) void runAction(async () => { await submitPayment(order.orderNumber, file); setFile(null); });
  };
  const saveAddress = () => {
    if (address) void runAction(async () => { await updateOrderAddress(order.orderNumber, address); setEditing(false); });
  };
  const cancel = () => {
    if (window.confirm(t.confirmCancel)) void runAction(() => cancelOrder(order.orderNumber));
  };
  const acceptQuote = () => void runAction(() => acceptShippingQuote(order.orderNumber));
  const copyTracking = async () => {
    if (!order.trackingNumber) return;
    await navigator.clipboard.writeText(order.trackingNumber);
    setCopiedTracking(true);
    window.setTimeout(() => setCopiedTracking(false), 1400);
  };
  const copyBankAccount = async (accountNumber: string) => {
    if (!accountNumber) return;
    await navigator.clipboard.writeText(accountNumber);
    setCopiedBankAccount(true);
    window.setTimeout(() => setCopiedBankAccount(false), 1400);
  };
  const copyWesternUnionDetails = async () => {
    await navigator.clipboard.writeText([
      `${t.paymentMethod}: Western Union`,
      westernUnion.bankName,
      `${t.accountNumber}: ${westernUnion.accountNumber}`,
      westernUnion.receiverName,
      t.receiverAddress,
      westernUnion.receiverAddress,
      westernUnion.country,
    ].join("\n"));
    setCopiedWesternUnion(true);
    window.setTimeout(() => setCopiedWesternUnion(false), 1400);
  };

  return <CustomerShell user={user} isAdmin={isAdmin}>
    <main className="shop-page order-detail-page">
      <Link className="back-link" href="/orders"><ArrowLeft />{t.back}</Link>
      <div className="order-detail-heading">
        <div><span className={`order-status ${order.status}`}>{orderStatusCopy[order.status][preferences.locale]}</span><h1>{order.orderNumber}</h1><p>{t.created} {new Date(order.createdAt).toLocaleString(preferences.locale === "th" ? "th-TH" : "en-GB", { dateStyle: "medium", timeStyle: "short" })}</p></div>
        {canChange && <button className="danger-text-button" disabled={busy} onClick={cancel}><Trash2 />{t.cancelOrder}</button>}
      </div>
      {actionError && <p className="field-error" role="alert">{actionError}</p>}
      {order.reservationExpiresAt && (["shipping_quote", "waiting_payment"] as OrderStatus[]).includes(order.status) && <div className={`reservation-deadline ${reservationExpired ? "expired" : ""}`}><Clock3 /><span><strong>{reservationExpired ? t.reservationExpired : t.reservationDeadline}</strong>{new Date(order.reservationExpiresAt).toLocaleString(preferences.locale === "th" ? "th-TH" : "en-GB", { dateStyle: "medium", timeStyle: "short" })}</span></div>}

      {order.status === "refund_pending" && <section className="action-panel waiting"><Clock3 /><div><h2>{t.refundProgress}</h2><p>{t.refundProgressText}</p></div></section>}
      {order.status === "refunded" && <section className="action-panel success"><Check /><div><h2>{t.refundComplete}</h2><p>{t.refundCompleteText}</p></div></section>}

      {!(["cancelled", "refund_pending", "refunded"] as OrderStatus[]).includes(order.status) && <div className="order-timeline">{timeline.map(({ status, label, icon: Icon }, index) => {
        const currentIndex = timeline.findIndex((item) => item.status === order.status);
        const active = order.status === "paid" ? index <= 1 : currentIndex >= index;
        return <div className={active ? "active" : ""} key={status}><span><Icon /></span><strong>{label}</strong></div>;
      })}</div>}

      <div className="order-detail-grid">
        <div className="order-main-column">
          <section className="order-panel">
            <div className="panel-heading"><h2>{t.items}</h2><span>{order.lines.reduce((sum, line) => sum + line.quantity, 0)} {t.itemUnit}</span></div>
            {order.lines.map((line) => {
              const product = products.find((item) => item.id === line.productId);
              const productName = preferences.locale === "th" && product ? product.nameTh : line.name;
              return <div className="order-line" key={line.productId}><div className="order-line-thumb">{product?.imageUrls?.[0] ? <Image src={product.imageUrls[0]} alt={productName} fill sizes="54px" /> : <Receipt />}</div><div className="order-line-copy"><span>{line.sku}</span><strong>{productName}</strong><small>{t.quantity} {line.quantity}</small></div><strong>{formatMoney(line.unitPriceThb * line.quantity, order.address.countryCode, preferences.locale, order.exchangeRate)}</strong></div>;
            })}
          </section>

          {order.status === "shipping_quote" && <section className="action-panel waiting"><Clock3 /><div><h2>{t.quoteProgress}</h2><p>{t.quoteProgressText}</p></div></section>}

          {quoteNeedsAcceptance && <section className="order-panel shipping-quote-panel">
            <div className="panel-heading"><div><span>{t.quoteKicker}</span><h2>{t.quoteTitle}</h2></div></div>
            <div className="shipping-quote-total"><div><span>{t.itemSubtotal}</span><strong>{formatMoney(order.subtotalThb, order.address.countryCode, preferences.locale, order.exchangeRate)}</strong></div><div><span>{t.thailandPostShipping}</span><strong>{formatMoney(order.shippingFeeThb ?? 0, order.address.countryCode, preferences.locale, order.exchangeRate)}</strong></div><div><span>{t.totalEstimate}</span><strong>{formatMoney(totalThb, order.address.countryCode, preferences.locale, order.exchangeRate)}</strong></div><small>{t.quoteNote}</small></div>
            <div className="shipping-quote-actions"><button className="shop-secondary-button" disabled={busy} onClick={cancel}>{t.declineCancel}</button><button className="shop-primary-button" disabled={busy || reservationExpired} onClick={acceptQuote}>{busy ? t.confirming : t.acceptQuote}</button></div>
          </section>}

          {order.paymentProofStatus === "rejected" && order.paymentRejectionReason && <section className="action-panel rejected" role="alert"><CircleAlert /><div><h2>{t.proofRejected}</h2><p>{order.paymentRejectionReason}</p><small>{t.proofRejectedText}</small></div></section>}

          {order.status === "waiting_payment" && !quoteNeedsAcceptance && <section id="payment" className="order-panel payment-panel">
            <div className="panel-heading"><div><span>{t.paymentKicker}</span><h2>{order.paymentMethod === "bank_transfer" ? t.bankTransfer : "Western Union"}</h2></div></div>
            {isThaiBankTransfer ? <div className="thai-bank-details">
              <div><span>{t.amountToTransfer}</span><strong>{formatMoney(totalThb, "TH", preferences.locale)}</strong></div>
              <dl>
                <div><dt>{t.bank}</dt><dd>{payment.bank_name || t.contactStore}</dd></div>
                <div><dt>{t.accountName}</dt><dd>{payment.account_name || t.contactStore}</dd></div>
                <div className="bank-account-number"><dt>{t.accountNumber}</dt><dd><strong>{payment.account_number || t.contactStore}</strong>{payment.account_number && <button type="button" onClick={() => void copyBankAccount(payment.account_number!)} aria-label={t.copyAccount} title={t.copyAccount}>{copiedBankAccount ? <Check /> : <Copy />}</button>}</dd></div>
              </dl>
            </div> : <div className="western-union-details">
              <div className="western-union-heading"><div><span>{t.amountToSend}</span><strong>{formatMoney(totalThb, "TH", preferences.locale, 1)}</strong><small>{t.approx} {formatMoney(totalThb, order.address.countryCode, preferences.locale, order.exchangeRate)}</small></div><button type="button" onClick={() => void copyWesternUnionDetails()}>{copiedWesternUnion ? <Check /> : <Copy />}{copiedWesternUnion ? t.copied : t.copyAll}</button></div>
              <p className="western-union-note">{t.westernNote}</p>
              <dl>
                <div><dt>{t.paymentMethod}</dt><dd>Western Union</dd></div>
                <div><dt>{t.bank}</dt><dd>{westernUnion.bankName}</dd></div>
                <div className="bank-account-number"><dt>{t.accountNumber}</dt><dd><strong>{westernUnion.accountNumber}</strong><button type="button" onClick={() => void copyBankAccount(westernUnion.accountNumber)} aria-label={t.copyAccount} title={t.copyAccount}>{copiedBankAccount ? <Check /> : <Copy />}</button></dd></div>
                <div><dt>{t.receiverName}</dt><dd>{westernUnion.receiverName}</dd></div>
                <div><dt>{t.receiverAddress}</dt><dd>{westernUnion.receiverAddress}<small>{westernUnion.country}</small></dd></div>
              </dl>
              {payment.phone && <p className="western-union-extra"><strong>{t.phone}</strong>{payment.phone}</p>}
              {payment.instructions && <p className="western-union-extra"><strong>{t.additional}</strong>{payment.instructions}</p>}
            </div>}
            <label className="proof-upload"><Upload /><span>{file ? file.name : t.chooseReceipt}<small>{t.receiptHint}</small></span><input type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={(event) => selectFile(event.target.files?.[0])} /></label>
            {fileError && <p className="field-error">{fileError}</p>}
            <button className="shop-primary-button" disabled={!file || busy} onClick={uploadProof}>{busy ? t.uploading : t.submitProof}</button>
          </section>}

          {order.paymentProofName && <section className="action-panel success"><Check /><div><h2>{t.receiptSubmitted}</h2><p>{t.receiptReview}</p></div></section>}

          {order.status === "shipped" && <section className="order-panel tracking-panel">
            <div className="tracking-copy"><Truck /><span>{t.trackingKicker}</span><h2>{order.shippingCompany ?? t.carrier}</h2><div><strong>{order.trackingNumber ?? t.trackingPending}</strong>{order.trackingNumber && <button onClick={() => void copyTracking()} aria-label={t.copyTracking} title={t.copyTracking}>{copiedTracking ? <Check /> : <Copy />}</button>}</div></div>
          </section>}
        </div>

        <aside className="order-side-column">
          <section className="order-panel">
            <div className="panel-heading"><h2>{t.summary}</h2></div>
            <div className="summary-row"><span>{t.subtotal}</span><strong>{formatMoney(order.subtotalThb, order.address.countryCode, preferences.locale, order.exchangeRate)}</strong></div>
            <div className="summary-row"><span>{t.shipping}</span><strong>{order.shippingFeeThb === null ? t.pending : formatMoney(order.shippingFeeThb, order.address.countryCode, preferences.locale, order.exchangeRate)}</strong></div>
            <div className="summary-row total"><span>{t.total}</span><strong>{order.shippingFeeThb === null ? t.pendingQuote : formatMoney(totalThb, order.address.countryCode, preferences.locale, order.exchangeRate)}</strong></div>
            <small>{t.rateSnapshot}: 1 THB = {order.exchangeRate} {order.currency}</small>
          </section>

          <section className="order-panel">
            <div className="panel-heading"><h2>{t.delivery}</h2>{canChange && !editing && <button disabled={busy} onClick={() => { setAddress(order.address); setEditing(true); }}><Pencil />{t.edit}</button>}</div>
            {editing && address ? <div className="compact-address-form">
              <label>{t.name}<input maxLength={120} value={address.name} onChange={(event) => setAddress({ ...address, name: event.target.value })} /></label>
              <label>{t.phone}<input maxLength={40} value={address.phone} onChange={(event) => setAddress({ ...address, phone: event.target.value })} /></label>
              <label>{t.address}<textarea maxLength={500} value={address.address} onChange={(event) => setAddress({ ...address, address: event.target.value })} /></label>
              <button className="shop-secondary-button" disabled={busy} onClick={saveAddress}><Save />{busy ? t.saving : t.saveAddress}</button>
            </div> : <address><MapPin /><span><strong>{order.address.name}</strong>{order.address.address}<br />{order.address.city}, {order.address.postalCode}<br />{order.address.phone}</span></address>}
          </section>
        </aside>
      </div>
    </main>
  </CustomerShell>;
}
