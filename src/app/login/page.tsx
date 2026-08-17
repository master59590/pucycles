import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, LockKeyhole } from "lucide-react";
import { GoogleSignIn } from "@/components/google-sign-in";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Sign In",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error, next: requestedNext } = await searchParams;
  const next = requestedNext?.startsWith("/") && !requestedNext.startsWith("//")
    ? requestedNext
    : "/setup";

  if (user) redirect(next);

  return (
    <main className="login-page">
      <section className="login-brand-panel">
        <Link href="/" className="login-back"><ArrowLeft aria-hidden="true" />Back to shop</Link>
        <div className="login-brand-copy">
          <Image src="/pucycles-logo.jpg" alt="PUCYCLES" width={108} height={108} priority />
          <span>PUCYCLES</span>
          <h1>Your parts.<br />Your orders.<br />One account.</h1>
        </div>
        <small>LIVE TO RIDE · RIDE TO LIVE</small>
      </section>

      <section className="login-form-panel">
        <div className="login-form-content">
          <span className="login-kicker">CUSTOMER ACCOUNT</span>
          <h2>Sign in to PUCYCLES</h2>
          <p>Use your Google account to continue shopping and track your orders.</p>
          {error && <p className="login-error" role="alert">Sign-in was not completed. Please try again.</p>}
          <GoogleSignIn next={next} />
          <div className="login-privacy"><LockKeyhole aria-hidden="true" /><span>We only use your name and email to manage your account and orders.</span></div>
        </div>
      </section>
    </main>
  );
}
