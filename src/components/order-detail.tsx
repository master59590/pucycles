"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Check, CircleAlert, CircleDollarSign, Clock3, Copy, MapPin, PackageCheck, Pencil, Receipt, Save, Trash2, Truck, Upload } from "lucide-react";
import { useEffect, useState } from "react";
import { CustomerShell } from "@/components/customer-shell";
import { useShop } from "@/components/shop-provider";
import { formatMoney, orderStatusCopy } from "@/data/commerce";
import type { CustomerUser } from "@/lib/auth/customer";
import type { CheckoutAddress, OrderStatus } from "@/types/shop";

const timeline: Array<{ status: OrderStatus; label: string; icon: typeof Clock3 }> = [
  { status: "waiting_payment", label: "Payment", icon: CircleDollarSign },
  { status: "payment_submitted", label: "Review", icon: Receipt },
  { status: "preparing", label: "Preparing", icon: PackageCheck },
  { status: "shipped", label: "Shipped", icon: Truck },
];

const thaiBankAccount = {
  bank: "ธนาคารกสิกรไทย",
  accountName: "จุฑารัตน์ อินทรณรงค์",
  accountNumber: "0348696793",
  formattedAccountNumber: "034-8-69679-3",
};

export function OrderDetail({ orderNumber, user, isAdmin }: { orderNumber: string; user: CustomerUser; isAdmin: boolean }) {
  const { orders, preferences, hydrated, submitPayment, cancelOrder, updateOrderAddress, products } = useShop();
  const order = orders.find((item) => item.orderNumber === orderNumber);
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState("");
  const [actionError, setActionError] = useState("");
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [address, setAddress] = useState<CheckoutAddress | null>(order?.address ?? null);
  const [copiedTracking, setCopiedTracking] = useState(false);
  const [copiedBankAccount, setCopiedBankAccount] = useState(false);

  useEffect(() => {
    if (order?.status !== "waiting_payment" || window.location.hash !== "#payment") return;
    const timer = window.setTimeout(() => document.querySelector(".payment-panel")?.scrollIntoView({ behavior: "smooth", block: "center" }), 50);
    return () => window.clearTimeout(timer);
  }, [order?.status]);

  if (!hydrated) {
    return <CustomerShell user={user} isAdmin={isAdmin}><main className="shop-page"><div className="shop-loading">Loading order...</div></main></CustomerShell>;
  }
  if (!order) {
    return <CustomerShell user={user} isAdmin={isAdmin}><main className="shop-page"><div className="shop-empty"><Receipt /><h1>Order not found</h1><p>This order is not available in this browser.</p><Link className="shop-primary-button" href="/orders">Back to orders</Link></div></main></CustomerShell>;
  }

  const canChange = ["waiting_payment", "shipping_quote"].includes(order.status);
  const totalThb = order.subtotalThb + (order.shippingFeeThb ?? 0);
  const isThaiBankTransfer = order.address.countryCode === "TH" && order.paymentMethod === "bank_transfer";
  const selectFile = (selected?: File) => {
    setFileError("");
    if (!selected) return setFile(null);
    if (!selected.type.startsWith("image/")) return setFileError("Choose a JPG, PNG, or WEBP image.");
    if (selected.size > 5 * 1024 * 1024) return setFileError("Image must be 5 MB or smaller.");
    setFile(selected);
  };
  const runAction = async (action: () => Promise<void>) => {
    setActionError("");
    setBusy(true);
    try {
      await action();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "The action could not be completed.");
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
    if (window.confirm("Cancel this order and release the reserved stock?")) void runAction(() => cancelOrder(order.orderNumber));
  };
  const copyTracking = async () => {
    if (!order.trackingNumber) return;
    await navigator.clipboard.writeText(order.trackingNumber);
    setCopiedTracking(true);
    window.setTimeout(() => setCopiedTracking(false), 1400);
  };
  const copyBankAccount = async () => {
    await navigator.clipboard.writeText(thaiBankAccount.accountNumber);
    setCopiedBankAccount(true);
    window.setTimeout(() => setCopiedBankAccount(false), 1400);
  };

  return <CustomerShell user={user} isAdmin={isAdmin}>
    <main className="shop-page order-detail-page">
      <Link className="back-link" href="/orders"><ArrowLeft />Back to orders</Link>
      <div className="order-detail-heading">
        <div><span className={`order-status ${order.status}`}>{orderStatusCopy[order.status][preferences.locale]}</span><h1>{order.orderNumber}</h1><p>Created {new Date(order.createdAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}</p></div>
        {canChange && <button className="danger-text-button" disabled={busy} onClick={cancel}><Trash2 />Cancel order</button>}
      </div>
      {actionError && <p className="field-error" role="alert">{actionError}</p>}

      {order.status !== "cancelled" && <div className="order-timeline">{timeline.map(({ status, label, icon: Icon }, index) => {
        const currentIndex = timeline.findIndex((item) => item.status === order.status);
        const active = order.status === "paid" ? index <= 1 : currentIndex >= index;
        return <div className={active ? "active" : ""} key={status}><span><Icon /></span><strong>{label}</strong></div>;
      })}</div>}

      <div className="order-detail-grid">
        <div className="order-main-column">
          <section className="order-panel">
            <div className="panel-heading"><h2>Items</h2><span>{order.lines.reduce((sum, line) => sum + line.quantity, 0)} items</span></div>
            {order.lines.map((line) => {
              const product = products.find((item) => item.id === line.productId);
              return <div className="order-line" key={line.productId}><div className="order-line-thumb">{product?.imageUrls?.[0] ? <Image src={product.imageUrls[0]} alt={line.name} fill sizes="54px" /> : <Receipt />}</div><div className="order-line-copy"><span>{line.sku}</span><strong>{line.name}</strong><small>Quantity {line.quantity}</small></div><strong>{formatMoney(line.unitPriceThb * line.quantity, order.address.countryCode, preferences.locale)}</strong></div>;
            })}
          </section>

          {order.status === "shipping_quote" && <section className="action-panel waiting"><Clock3 /><div><h2>Shipping quote in progress</h2><p>The store is checking Thailand Post rates using the order weight and destination. Payment will open after the final total is confirmed.</p></div></section>}

          {order.paymentProofStatus === "rejected" && order.paymentRejectionReason && <section className="action-panel rejected" role="alert"><CircleAlert /><div><h2>Payment proof was not accepted</h2><p>{order.paymentRejectionReason}</p><small>Please check the payment details and upload a new receipt below.</small></div></section>}

          {order.status === "waiting_payment" && <section id="payment" className="order-panel payment-panel">
            <div className="panel-heading"><div><span>PAYMENT</span><h2>{order.paymentMethod === "bank_transfer" ? "Bank transfer" : "Western Union"}</h2></div></div>
            {isThaiBankTransfer ? <div className="thai-bank-details">
              <div><span>ยอดที่ต้องโอน</span><strong>{formatMoney(totalThb, "TH", "th")}</strong></div>
              <dl>
                <div><dt>ธนาคาร</dt><dd>{thaiBankAccount.bank}</dd></div>
                <div><dt>ชื่อบัญชี</dt><dd>{thaiBankAccount.accountName}</dd></div>
                <div className="bank-account-number"><dt>เลขบัญชี</dt><dd><strong>{thaiBankAccount.formattedAccountNumber}</strong><button type="button" onClick={() => void copyBankAccount()} aria-label="คัดลอกเลขบัญชี" title="คัดลอกเลขบัญชี">{copiedBankAccount ? <Check /> : <Copy />}</button></dd></div>
              </dl>
            </div> : <div className="payment-instructions"><strong>PUCYCLES receiver details</strong><p>Contact the store if you need the Western Union receiver information again.</p></div>}
            <label className="proof-upload"><Upload /><span>{file ? file.name : "Choose receipt image"}<small>JPG, PNG or WEBP - Max 5 MB</small></span><input type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={(event) => selectFile(event.target.files?.[0])} /></label>
            {fileError && <p className="field-error">{fileError}</p>}
            <button className="shop-primary-button" disabled={!file || busy} onClick={uploadProof}>{busy ? "Uploading..." : "Submit payment proof"}</button>
          </section>}

          {order.paymentProofName && <section className="action-panel success"><Check /><div><h2>Receipt submitted</h2><p>{order.paymentProofName} - The store will review it manually.</p></div></section>}

          {order.status === "shipped" && <section className="order-panel tracking-panel">
            <div className="tracking-copy"><Truck /><span>TRACKING</span><h2>{order.shippingCompany ?? "Carrier"}</h2><div><strong>{order.trackingNumber ?? "Tracking number pending"}</strong>{order.trackingNumber && <button onClick={() => void copyTracking()} aria-label="Copy tracking number" title="Copy tracking number">{copiedTracking ? <Check /> : <Copy />}</button>}</div></div>
          </section>}
        </div>

        <aside className="order-side-column">
          <section className="order-panel">
            <div className="panel-heading"><h2>Summary</h2></div>
            <div className="summary-row"><span>Subtotal</span><strong>{formatMoney(order.subtotalThb, order.address.countryCode, preferences.locale)}</strong></div>
            <div className="summary-row"><span>Shipping</span><strong>{order.shippingFeeThb === null ? "Pending" : formatMoney(order.shippingFeeThb, order.address.countryCode, preferences.locale)}</strong></div>
            <div className="summary-row total"><span>Total</span><strong>{order.shippingFeeThb === null ? "Pending quote" : formatMoney(totalThb, order.address.countryCode, preferences.locale)}</strong></div>
            <small>Rate snapshot: 1 THB = {order.exchangeRate} {order.currency}</small>
          </section>

          <section className="order-panel">
            <div className="panel-heading"><h2>Delivery</h2>{canChange && !editing && <button disabled={busy} onClick={() => { setAddress(order.address); setEditing(true); }}><Pencil />Edit</button>}</div>
            {editing && address ? <div className="compact-address-form">
              <label>Name<input maxLength={120} value={address.name} onChange={(event) => setAddress({ ...address, name: event.target.value })} /></label>
              <label>Phone<input maxLength={40} value={address.phone} onChange={(event) => setAddress({ ...address, phone: event.target.value })} /></label>
              <label>Address<textarea maxLength={500} value={address.address} onChange={(event) => setAddress({ ...address, address: event.target.value })} /></label>
              <button className="shop-secondary-button" disabled={busy} onClick={saveAddress}><Save />{busy ? "Saving..." : "Save address"}</button>
            </div> : <address><MapPin /><span><strong>{order.address.name}</strong>{order.address.address}<br />{order.address.city}, {order.address.postalCode}<br />{order.address.phone}</span></address>}
          </section>
        </aside>
      </div>
    </main>
  </CustomerShell>;
}
