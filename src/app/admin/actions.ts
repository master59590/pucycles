"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export type AdminLoginState = { error: string };

export async function loginAdmin(_state: AdminLoginState, formData: FormData): Promise<AdminLoginState> {
  const password = formData.get("password");
  if (typeof password !== "string" || password.length < 8 || password.length > 128) {
    return { error: "กรุณากรอกรหัสผ่านผู้ดูแลให้ถูกต้อง" };
  }

  const email = process.env.ADMIN_LOGIN_EMAIL?.trim();
  if (!email) return { error: "ยังไม่ได้ตั้งค่าบัญชีผู้ดูแลบนเซิร์ฟเวอร์" };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) return { error: "รหัสผ่านไม่ถูกต้อง หรือไม่สามารถเข้าสู่ระบบได้" };

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", data.user.id).single();
  if (profile?.role !== "admin") {
    await supabase.auth.signOut();
    return { error: "บัญชีนี้ไม่ได้รับสิทธิ์ผู้ดูแลระบบ" };
  }

  const requestHeaders = await headers();
  await supabase.rpc("admin_record_login", {
    p_user_agent: requestHeaders.get("user-agent")?.slice(0, 500) ?? "",
  });

  redirect("/admin");
}
