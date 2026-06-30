"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Something went wrong");
      }

      setSent(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg, #0a0a0b 0%, #1a1410 40%, #0d1520 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ width: "100%", maxWidth: 420 }}>

        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 40, justifyContent: "center", cursor: "pointer" }} onClick={() => router.push("/")}>
          <img src="/logo.png" alt="Stonepath Estates" style={{ height: 36, width: 36, borderRadius: "50%", objectFit: "cover" }} />
          <span style={{ fontSize: 22, color: "white", fontFamily: "Cormorant Garamond, serif" }}>Stonepath Estates</span>
        </div>

        <div style={{ background: "rgba(13,15,26,0.85)", border: "1px solid rgba(201,168,76,0.2)", backdropFilter: "blur(24px)", padding: "40px 36px" }}>
          {sent ? (
            <>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>📬</div>
                <h1 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: 28, fontWeight: 300, color: "white", marginBottom: 12 }}>Reset Link Sent</h1>
                <p style={{ color: "#8892a4", fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
                  If an account exists for <strong style={{ color: "white" }}>{email}</strong>, you will receive a reset link shortly.
                </p>
                <Link href="/login" style={{ display: "block", background: "#c9a84c", color: "#0a0a0b", padding: "14px", fontSize: 12, fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", textDecoration: "none", textAlign: "center" }}>
                  Back to Sign In
                </Link>
              </div>
            </>
          ) : (
            <>
              <p style={{ fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", color: "#c9a84c", marginBottom: 8 }}>Account Recovery</p>
              <h1 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: 32, fontWeight: 300, color: "white", marginBottom: 8 }}>Forgot Password</h1>
              <p style={{ color: "#8892a4", fontSize: 13, marginBottom: 28 }}>Enter your email and we will send you a reset link.</p>

              {error && (
                <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171", padding: "12px 16px", fontSize: 13, marginBottom: 20 }}>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <div>
                  <label style={{ display: "block", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "#8892a4", marginBottom: 8 }}>Email Address</label>
                  <input
                    type="email" value={email} onChange={e => setEmail(e.target.value)} required
                    placeholder="you@example.com"
                    style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(201,168,76,0.2)", padding: "12px 16px", color: "white", fontSize: 14, outline: "none", fontFamily: "'DM Sans', sans-serif" }}
                  />
                </div>
                <button type="submit" disabled={loading}
                  style={{ width: "100%", background: loading ? "rgba(201,168,76,0.5)" : "#c9a84c", border: "none", color: "#0a0a0b", padding: "14px", fontSize: 12, fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", cursor: loading ? "not-allowed" : "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                  {loading ? "Sending..." : "Send Reset Link"}
                </button>
              </form>

              <p style={{ textAlign: "center", marginTop: 24, fontSize: 13, color: "#8892a4" }}>
                Remember your password?{" "}
                <Link href="/login" style={{ color: "#c9a84c", textDecoration: "none" }}>Sign in</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}