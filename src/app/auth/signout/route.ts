import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  await supabase.auth.signOut();

  const requestOrigin = new URL(request.url).origin;
  const siteOrigin = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? requestOrigin;
  return NextResponse.redirect(new URL("/login", siteOrigin), { status: 303 });
}
