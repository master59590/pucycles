"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, LoaderCircle, LockKeyhole, ShieldCheck } from "lucide-react";
import { useActionState } from "react";
import { loginAdmin, type AdminLoginState } from "@/app/admin/actions";

const initialState: AdminLoginState = { error: "" };

export function AdminLogin() {
  const [state, formAction, pending] = useActionState(loginAdmin, initialState);

  return <main className="admin-login-page">
    <section className="admin-login-brand">
      <Link href="/" aria-label="กลับหน้าร้าน"><ArrowLeft aria-hidden="true" />กลับหน้าร้าน</Link>
      <div><Image src="/pucycles-logo.jpg" alt="PUCYCLES" width={104} height={104} priority /><span>PUCYCLES</span><small>ระบบจัดการร้านค้า</small></div>
      <p>สำหรับเจ้าของร้านเท่านั้น</p>
    </section>
    <section className="admin-login-form-wrap">
      <form action={formAction} className="admin-login-form">
        <ShieldCheck aria-hidden="true" />
        <span>ADMIN ACCESS</span>
        <h1>เข้าสู่ระบบหลังบ้าน</h1>
        <p>กรอกรหัสผ่านเฉพาะสำหรับผู้ดูแลระบบ</p>
        <label>รหัสผ่านผู้ดูแล<div><LockKeyhole aria-hidden="true" /><input name="password" type="password" required minLength={8} maxLength={128} autoComplete="current-password" autoFocus /></div></label>
        {state.error && <p className="login-error" role="alert">{state.error}</p>}
        <button className="admin-primary-button" disabled={pending}>{pending ? <><LoaderCircle className="spin" />กำลังตรวจสอบ...</> : <>เข้าสู่ระบบ</>}</button>
        <small>ระบบจะจำสถานะการเข้าสู่ระบบด้วยคุกกี้ที่ปลอดภัย</small>
      </form>
    </section>
  </main>;
}
