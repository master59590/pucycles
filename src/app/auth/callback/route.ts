import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { origin, searchParams } = new URL(request.url);
  const siteOrigin = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? origin;
  const code = searchParams.get("code");
  const requestedPath = searchParams.get("next") ?? "/";
  const next = requestedPath.startsWith("/") && !requestedPath.startsWith("//")
    ? requestedPath
    : "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(`${siteOrigin}${next}`);
    }
  }

  return NextResponse.redirect(`${siteOrigin}/login?error=oauth_callback`);
}
