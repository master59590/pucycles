"use client";

import { Save, Truck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function AdminSettingsPanel({ thaiShippingFeeThb }: { thaiShippingFeeThb: number }) {
  const router = useRouter();
  const [fee, setFee] = useState(thaiShippingFeeThb);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!Number.isFinite(fee) || fee < 0 || fee > 100000) {
      setError("กรุณากรอกค่าจัดส่งระหว่าง 0 ถึง 100,000 บาท");
      return;
    }
    setBusy(true);
    setMessage("");
    setError("");
    const { error: saveError } = await createClient().rpc("admin_set_thai_shipping_fee", { p_fee_thb: fee });
    if (saveError) setError(saveError.message);
    else {
      setMessage("บันทึกค่าจัดส่งภายในประเทศไทยแล้ว");
      router.refresh();
    }
    setBusy(false);
  };

  return <main>
    <div className="admin-page-heading"><div><span>การตั้งค่า</span><h1>ตั้งค่าร้านค้า</h1><p>กำหนดค่าที่ใช้กับคำสั่งซื้อของลูกค้า</p></div></div>
    {message && <p className="admin-action-message success" role="status">{message}</p>}
    {error && <p className="admin-action-message error" role="alert">{error}</p>}
    <section className="admin-settings-grid">
      <form onSubmit={save}>
        <div className="admin-setting-heading"><Truck /><div><h2>ค่าจัดส่งประเทศไทย</h2><p>แสดงในตะกร้าและรวมในยอดชำระโดยอัตโนมัติ</p></div></div>
        <label>ค่าจัดส่ง (บาท)<input required type="number" min="0" max="100000" step="1" value={fee} onChange={(event) => setFee(Number(event.target.value))} /></label>
        <button className="admin-primary-button" disabled={busy}><Save />{busy ? "กำลังบันทึก..." : "บันทึกค่าจัดส่ง"}</button>
      </form>
    </section>
  </main>;
}
