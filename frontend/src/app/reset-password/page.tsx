"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [form, setForm] = useState({ password: "", confirm: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirm) { setError("Passwords do not match"); return; }
    if (form.password.length < 8) { setError("Password must be at least 8 characters"); return; }
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password: form.password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Reset failed");

      setSuccess(true);
      setTimeout(() => router.push("/login"), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Reset failed");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(201,168,76,0.2)", padding: "12px 16px",
    color: "white", fontSize: 14, outline: "none", fontFamily: "'DM Sans', sans-serif",
  };

  if (!token) {
    return (
      <div style={{ minHeight: "100vh", background: "#0a0a0b", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontFamily: "'DM Sans', sans-serif" }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ color: "#f87171", marginBottom: 16 }}>Invalid reset link.</p>
          <Link href="/forgot-password" style={{ color: "#c9a84c" }}>Request a new one →</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg, #0a0a0b 0%, #1a1410 40%, #0d1520 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ width: "100%", maxWidth: 420 }}>

        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 40, justifyContent: "center", cursor: "pointer" }} onClick={() => router.push("/")}>
          <div style={{ width: 28, height: 28, border: "1px solid #c9a84c", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: 12, height: 12, background: "#c9a84c", transform: "rotate(45deg)" }} />
          </div>
          <span style={{ fontSize: 22, color: "white", fontFamily: "Cormorant Garamond, serif" }}>Stonepath™</span>
        </div>

        <div style={{ background: "rgba(13,15,26,0.85)", border: "1px solid rgba(201,168,76,0.2)", backdropFilter: "blur(24px)", padding: "40px 36px" }}>
          {success ? (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
              <h1 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: 28, fontWeight: 300, color: "white", marginBottom: 12 }}>Password Reset!</h1>
              <p style={{ color: "#8892a4", fontSize: 14, marginBottom: 24 }}>Redirecting to login...</p>
            </div>
          ) : (
            <>
              <p style={{ fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", color: "#c9a84c", marginBottom: 8 }}>Account Recovery</p>
              <h1 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: 32, fontWeight: 300, color: "white", marginBottom: 28 }}>New Password</h1>

              {error && (
                <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171", padding: "12px 16px", fontSize: 13, marginBottom: 20 }}>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <div>
                  <label style={{ display: "block", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "#8892a4", marginBottom: 8 }}>New Password</label>
                  <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required placeholder="Min. 8 characters" style={inputStyle} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "#8892a4", marginBottom: 8 }}>Confirm Password</label>
                  <input type="password" value={form.confirm} onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))} required placeholder="Repeat your password"
                    style={{ ...inputStyle, borderColor: form.confirm && form.password !== form.confirm ? "rgba(239,68,68,0.5)" : "rgba(201,168,76,0.2)" }} />
                  {form.confirm && form.password !== form.confirm && (
                    <p style={{ fontSize: 11, color: "#f87171", marginTop: 6 }}>Passwords do not match</p>
                  )}
                </div>
                <button type="submit" disabled={loading}
                  style={{ width: "100%", background: loading ? "rgba(201,168,76,0.5)" : "#c9a84c", border: "none", color: "#0a0a0b", padding: "14px", fontSize: 12, fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", cursor: loading ? "not-allowed" : "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                  {loading ? "Resetting..." : "Reset Password"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}