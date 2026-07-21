"use client";

import { LoaderCircle } from "lucide-react";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function GoogleSignIn({ next = "/" }: { next?: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const signIn = async () => {
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });

    if (signInError) {
      setError("Google sign-in could not be started. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="login-actions">
      <button className="google-button" onClick={signIn} disabled={loading}>
        {loading ? <LoaderCircle className="spin" aria-hidden="true" /> : <span className="google-g" aria-hidden="true">G</span>}
        {loading ? "Connecting to Google..." : "Continue with Google"}
      </button>
      {error && <p className="login-error" role="alert">{error}</p>}
    </div>
  );
}
