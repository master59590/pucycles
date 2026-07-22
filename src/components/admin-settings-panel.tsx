"use client";

import { Clock3, Landmark, LogOut, Pencil, Plus, RefreshCw, Save, ShieldCheck, Trash2, Truck, WalletCards, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ShippingCarrier } from "@/lib/admin-convenience-types";
import type { PaymentSettings } from "@/lib/admin-operations";
import { createClient } from "@/lib/supabase/client";

type Props = {
  thaiShippingFeeThb: number;
  payment: PaymentSettings;
  cronConfigured: boolean;
  lastLoginAt: string | null;
  lastLoginUserAgent: string | null;
  carriers: ShippingCarrier[];
};

export function AdminSettingsPanel(props: Props) {
  const router = useRouter();
  const [fee, setFee] = useState(props.thaiShippingFeeThb);
  const [payment, setPayment] = useState(props.payment);
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [carrierId, setCarrierId] = useState<number | null>(null);
  const [carrierName, setCarrierName] = useState("");
  const [carrierUrl, setCarrierUrl] = useState("");

  const run = async (key: string, action: () => Promise<void>, success: string) => {
    setBusy(key);
    setMessage("");
    setError("");
    try {
      await action();
      setMessage(success);
      router.refresh();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "ไม่สามารถดำเนินการได้");
    } finally {
      setBusy("");
    }
  };

  const saveShipping = (event: React.FormEvent) => {
    event.preventDefault();
    if (!Number.isFinite(fee) || fee < 0 || fee > 100000) return setError("กรุณากรอกค่าจัดส่งระหว่าง 0 ถึง 100,000 บาท");
    void run("shipping", async () => {
      const { error: saveError } = await createClient().rpc("admin_set_thai_shipping_fee", { p_fee_thb: fee });
      if (saveError) throw saveError;
    }, "บันทึกค่าจัดส่งภายในประเทศไทยแล้ว");
  };

  const savePayment = (event: React.FormEvent) => {
    event.preventDefault();
    void run("payment", async () => {
      const { error: saveError } = await createClient().rpc("admin_set_payment_settings", {
        p_bank_name: payment.bankName,
        p_bank_account_name: payment.bankAccountName,
        p_bank_account_number: payment.bankAccountNumber,
        p_wu_receiver_name: payment.westernUnionReceiverName,
        p_wu_country: payment.westernUnionCountry,
        p_wu_city: payment.westernUnionCity,
        p_wu_phone: payment.westernUnionPhone,
        p_wu_instructions: payment.westernUnionInstructions,
      });
      if (saveError) throw saveError;
    }, "บันทึกข้อมูลการชำระเงินแล้ว ออเดอร์ใหม่จะใช้ข้อมูลชุดนี้");
  };

  const releaseExpired = () => void run("expiry", async () => {
    const { data, error: releaseError } = await createClient().rpc("admin_run_expired_reservations");
    if (releaseError) throw releaseError;
    setMessage(`ตรวจสอบแล้ว ยกเลิกออเดอร์หมดอายุ ${Number(data ?? 0)} รายการ`);
  }, "ตรวจสอบออเดอร์หมดอายุแล้ว");

  const signOutAll = async () => {
    if (!window.confirm("ออกจากระบบ Admin ทุกอุปกรณ์หรือไม่?")) return;
    setBusy("signout");
    const { error: signOutError } = await createClient().auth.signOut({ scope: "global" });
    if (signOutError) {
      setError(signOutError.message);
      setBusy("");
      return;
    }
    window.location.assign("/admin");
  };

  const resetCarrier = () => {
    setCarrierId(null);
    setCarrierName("");
    setCarrierUrl("");
  };

  const saveCarrier = (event: React.FormEvent) => {
    event.preventDefault();
    void run("carrier", async () => {
      const { error: saveError } = await createClient().rpc("admin_save_shipping_carrier", {
        p_id: carrierId,
        p_name: carrierName,
        p_tracking_url_template: carrierUrl,
      });
      if (saveError) throw saveError;
      resetCarrier();
    }, carrierId ? "บันทึกบริษัทขนส่งแล้ว" : "เพิ่มบริษัทขนส่งแล้ว");
  };

  const removeCarrier = (carrier: ShippingCarrier) => {
    if (!window.confirm(`ลบบริษัทขนส่ง ${carrier.name} หรือไม่?`)) return;
    void run("carrier", async () => {
      const { error: removeError } = await createClient().rpc("admin_delete_shipping_carrier", { p_id: carrier.id });
      if (removeError) throw removeError;
      if (carrierId === carrier.id) resetCarrier();
    }, "ลบบริษัทขนส่งแล้ว");
  };

  return <main>
    <div className="admin-page-heading"><div><span>การตั้งค่า</span><h1>ตั้งค่าร้านค้า</h1><p>ข้อมูลจัดส่ง การรับชำระเงิน และความปลอดภัยของผู้ดูแล</p></div></div>
    {message && <p className="admin-action-message success" role="status">{message}</p>}
    {error && <p className="admin-action-message error" role="alert">{error}</p>}

    <section className="admin-settings-grid">
      <form onSubmit={saveShipping}>
        <div className="admin-setting-heading"><Truck /><div><h2>ค่าจัดส่งประเทศไทย</h2><p>รวมในยอดชำระของลูกค้าไทยโดยอัตโนมัติ</p></div></div>
        <label>ค่าจัดส่ง (บาท)<input required type="number" min="0" max="100000" step="1" value={fee} onChange={(event) => setFee(Number(event.target.value))} /></label>
        <button className="admin-primary-button" disabled={Boolean(busy)}><Save />{busy === "shipping" ? "กำลังบันทึก..." : "บันทึกค่าจัดส่ง"}</button>
      </form>

      <div>
        <div className="admin-setting-heading"><Clock3 /><div><h2>การคืนสต็อกอัตโนมัติ</h2><p>ตรวจออเดอร์ที่ยังไม่ชำระและหมดเวลาจองทุก 15 นาที</p></div></div>
        <div className={`admin-system-status ${props.cronConfigured ? "ready" : "warning"}`}><ShieldCheck /><div><strong>{props.cronConfigured ? "Cron ทำงานอยู่" : "ยังไม่พบ Cron ในฐานข้อมูล"}</strong><span>{props.cronConfigured ? "ระบบจะคืนสต็อกโดยไม่ต้องเปิดหน้า Admin" : "ยังสามารถกดตรวจสอบด้วยตัวเองได้"}</span></div></div>
        <button type="button" className="admin-secondary-button" disabled={Boolean(busy)} onClick={releaseExpired}><RefreshCw />{busy === "expiry" ? "กำลังตรวจสอบ..." : "ตรวจสอบออเดอร์หมดอายุตอนนี้"}</button>
      </div>

      <form className="admin-setting-wide" onSubmit={savePayment}>
        <div className="admin-setting-heading"><WalletCards /><div><h2>ข้อมูลรับชำระเงิน</h2><p>การแก้ไขจะมีผลกับออเดอร์ใหม่เท่านั้น ออเดอร์เดิมเก็บข้อมูลบัญชีของวันสั่งซื้อไว้</p></div></div>
        <div className="admin-payment-settings-columns">
          <fieldset><legend><Landmark />ลูกค้าประเทศไทย</legend>
            <label>ธนาคาร<input required maxLength={120} value={payment.bankName} onChange={(event) => setPayment({ ...payment, bankName: event.target.value })} /></label>
            <label>ชื่อบัญชี<input required maxLength={160} value={payment.bankAccountName} onChange={(event) => setPayment({ ...payment, bankAccountName: event.target.value })} /></label>
            <label>เลขบัญชี<input required maxLength={40} inputMode="numeric" value={payment.bankAccountNumber} onChange={(event) => setPayment({ ...payment, bankAccountNumber: event.target.value })} /></label>
          </fieldset>
          <fieldset><legend>Western Union</legend>
            <label>ชื่อผู้รับ<input maxLength={160} value={payment.westernUnionReceiverName} onChange={(event) => setPayment({ ...payment, westernUnionReceiverName: event.target.value })} /></label>
            <div className="admin-setting-row"><label>ประเทศ<input maxLength={120} value={payment.westernUnionCountry} onChange={(event) => setPayment({ ...payment, westernUnionCountry: event.target.value })} /></label><label>เมือง<input maxLength={120} value={payment.westernUnionCity} onChange={(event) => setPayment({ ...payment, westernUnionCity: event.target.value })} /></label></div>
            <label>เบอร์โทร<input maxLength={40} value={payment.westernUnionPhone} onChange={(event) => setPayment({ ...payment, westernUnionPhone: event.target.value })} /></label>
            <label>คำแนะนำเพิ่มเติม<textarea maxLength={1000} value={payment.westernUnionInstructions} onChange={(event) => setPayment({ ...payment, westernUnionInstructions: event.target.value })} /></label>
          </fieldset>
        </div>
        <button className="admin-primary-button" disabled={Boolean(busy)}><Save />{busy === "payment" ? "กำลังบันทึก..." : "บันทึกข้อมูลชำระเงิน"}</button>
      </form>

      <form className="admin-setting-wide admin-carrier-settings" onSubmit={saveCarrier}>
        <div className="admin-setting-heading"><Truck /><div><h2>บริษัทขนส่งที่ใช้ประจำ</h2><p>ใช้เป็นตัวเลือกตอนกรอก Tracking โดยใส่ <code>{"{tracking}"}</code> ในตำแหน่งเลขพัสดุ</p></div></div>
        <div className="admin-carrier-editor">
          <label>ชื่อบริษัทขนส่ง<input required maxLength={120} value={carrierName} onChange={(event) => setCarrierName(event.target.value)} placeholder="เช่น Thailand Post" /></label>
          <label>ลิงก์ตรวจสอบพัสดุ<input maxLength={500} value={carrierUrl} onChange={(event) => setCarrierUrl(event.target.value)} placeholder="https://example.com/track/{tracking}" /></label>
          <div>{carrierId && <button type="button" className="admin-secondary-button" onClick={resetCarrier}><X />ยกเลิก</button>}<button className="admin-primary-button" disabled={Boolean(busy)}>{carrierId ? <><Save />บันทึก</> : <><Plus />เพิ่มบริษัท</>}</button></div>
        </div>
        <div className="admin-carrier-list">
          {props.carriers.map((carrier) => <article key={carrier.id}><div><strong>{carrier.name}</strong><small>{carrier.trackingUrlTemplate || "ไม่ได้ตั้งลิงก์ Tracking"}</small></div><div><button type="button" onClick={() => { setCarrierId(carrier.id); setCarrierName(carrier.name); setCarrierUrl(carrier.trackingUrlTemplate); }} aria-label={`แก้ไข ${carrier.name}`} title="แก้ไข"><Pencil /></button><button type="button" onClick={() => removeCarrier(carrier)} aria-label={`ลบ ${carrier.name}`} title="ลบ"><Trash2 /></button></div></article>)}
          {!props.carriers.length && <p className="admin-empty-state">ยังไม่มีบริษัทขนส่ง</p>}
        </div>
      </form>

      <div>
        <div className="admin-setting-heading"><ShieldCheck /><div><h2>เซสชันผู้ดูแล</h2><p>ตรวจสอบและยกเลิกการเข้าสู่ระบบจากอุปกรณ์อื่น</p></div></div>
        <dl className="admin-security-facts"><div><dt>เข้าสู่ระบบล่าสุด</dt><dd>{props.lastLoginAt ? new Date(props.lastLoginAt).toLocaleString("th-TH") : "ยังไม่มีข้อมูลหลังอัปเดตระบบ"}</dd></div><div><dt>อุปกรณ์</dt><dd>{props.lastLoginUserAgent || "ไม่ทราบ"}</dd></div></dl>
        <button type="button" className="admin-reject-button" disabled={Boolean(busy)} onClick={() => void signOutAll()}><LogOut />{busy === "signout" ? "กำลังออกจากระบบ..." : "ออกจากระบบทุกอุปกรณ์"}</button>
      </div>
    </section>
  </main>;
}
