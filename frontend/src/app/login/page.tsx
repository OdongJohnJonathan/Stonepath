"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { token } = await authApi.login(form);
      await login(token);
      router.push("/");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(160deg, #0a0a0b 0%, #1a1410 40%, #0d1520 100%)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "24px", fontFamily: "'DM Sans', sans-serif",
    }}>
      <div style={{ position: "fixed", inset: 0, backgroundImage: "url('https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1600&q=85')", backgroundSize: "cover", backgroundPosition: "center", opacity: 0.15, pointerEvents: "none" }} />

      <div style={{ width: "100%", maxWidth: 420, position: "relative", zIndex: 1 }}>

        <div onClick={() => router.push("/")} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 40, cursor: "pointer", justifyContent: "center" }}>
          <div style={{ width: 28, height: 28, border: "1px solid #c9a84c", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: 12, height: 12, background: "#c9a84c", transform: "rotate(45deg)" }} />
          </div>
          <span style={{ fontSize: 22, color: "white", fontFamily: "Cormorant Garamond, serif" }}>Stonepath™</span>
        </div>

        <div style={{ background: "rgba(13,15,26,0.85)", border: "1px solid rgba(201,168,76,0.2)", backdropFilter: "blur(24px)", padding: "40px 36px" }}>
          <p style={{ fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", color: "#c9a84c", marginBottom: 8 }}>Welcome Back</p>
          <h1 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: 32, fontWeight: 300, color: "white", marginBottom: 32 }}>Sign In</h1>

          {error && (
            <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171", padding: "12px 16px", fontSize: 13, marginBottom: 24 }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div>
              <label style={{ display: "block", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "#8892a4", marginBottom: 8 }}>Email Address</label>
              <input name="email" type="email" value={form.email} onChange={handleChange} required placeholder="you@example.com"
                style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(201,168,76,0.2)", padding: "12px 16px", color: "white", fontSize: 14, outline: "none", fontFamily: "'DM Sans', sans-serif" }} />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "#8892a4", marginBottom: 8 }}>Password</label>
              <input name="password" type="password" value={form.password} onChange={handleChange} required placeholder="••••••••"
                style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(201,168,76,0.2)", padding: "12px 16px", color: "white", fontSize: 14, outline: "none", fontFamily: "'DM Sans', sans-serif" }} />
            </div>

            <button type="submit" disabled={loading}
              style={{ width: "100%", background: loading ? "rgba(201,168,76,0.5)" : "#c9a84c", border: "none", color: "#0a0a0b", padding: "14px", fontSize: 12, fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", cursor: loading ? "not-allowed" : "pointer", marginTop: 8, fontFamily: "'DM Sans', sans-serif" }}>
              {loading ? "Signing In..." : "Sign In"}
            </button>
            <div style={{ textAlign: "right", marginTop: -12 }}>
            <Link href="/forgot-password" style={{ fontSize: 12, color: "#c9a84c", textDecoration: "none" }}>
              Forgot password?
            </Link>
</div>
          </form>

          <div style={{ display: "flex", alignItems: "center", gap: 16, margin: "28px 0" }}>
            <div style={{ flex: 1, height: 1, background: "rgba(201,168,76,0.2)" }} />
            <span style={{ fontSize: 11, color: "#8892a4", letterSpacing: "0.1em" }}>OR</span>
            <div style={{ flex: 1, height: 1, background: "rgba(201,168,76,0.2)" }} />
          </div>

          <p style={{ textAlign: "center", fontSize: 13, color: "#8892a4" }}>
            Don&apos;t have an account?{" "}
            <Link href="/register" style={{ color: "#c9a84c", textDecoration: "none", fontWeight: 500 }}>Create one</Link>
          </p>
        </div>

        <p style={{ textAlign: "center", marginTop: 24, fontSize: 12 }}>
          <Link href="/" style={{ color: "rgba(255,255,255,0.4)", textDecoration: "none" }}>← Back to listings</Link>
        </p>
      </div>
    </div>
  );
}