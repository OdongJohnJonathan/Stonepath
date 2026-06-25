"use client";

import { useState } from "react";

export default function NewsletterSignup() {
  const [email, setEmail]     = useState("");
  const [name, setName]       = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone]       = useState(false);
  const [error, setError]     = useState("");

  const handleSubmit = async () => {
    if (!email.trim() || !email.includes("@")) { setError("Enter a valid email."); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/newsletter/subscribe`,
        { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, first_name: name || undefined }) }
      );
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      setDone(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div style={{ textAlign: "center", padding: "40px 24px", background: "var(--card-bg)", border: "1px solid var(--border)" }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>✅</div>
        <h3 className="font-serif" style={{ fontSize: 22, fontWeight: 400, marginBottom: 8 }}>You&apos;re subscribed!</h3>
        <p style={{ color: "var(--text-muted)", fontSize: 13 }}>You&apos;ll receive alerts when new properties match your interests.</p>
      </div>
    );
  }

  return (
    <div style={{ background: "var(--card-bg)", border: "1px solid var(--border)", padding: "40px 32px", textAlign: "center" }}>
      <p style={{ fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--gold)", marginBottom: 8 }}>
        Stay Ahead
      </p>
      <h3 className="font-serif" style={{ fontSize: 28, fontWeight: 300, marginBottom: 8 }}>
        New Property Alerts
      </h3>
      <p style={{ color: "var(--text-muted)", fontSize: 14, marginBottom: 28, maxWidth: 400, margin: "0 auto 28px" }}>
        Be the first to know when new listings and short stays are added to Stonepath.
      </p>

      {error && (
        <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171", padding: "10px 14px", fontSize: 13, marginBottom: 16, maxWidth: 420, margin: "0 auto 16px" }}>
          {error}
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 420, margin: "0 auto" }}>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="First name (optional)"
          style={{ width: "100%", background: "var(--surface)", border: "1px solid var(--border)", padding: "12px 16px", color: "var(--text)", fontSize: 14, outline: "none", fontFamily: "'DM Sans', sans-serif", borderRadius: 2, boxSizing: "border-box" }}
        />
        <div style={{ display: "flex", gap: 8 }}>
          <input
            type="email"
            value={email}
            onChange={e => { setEmail(e.target.value); setError(""); }}
            placeholder="your@email.com"
            onKeyDown={e => e.key === "Enter" && handleSubmit()}
            style={{ flex: 1, background: "var(--surface)", border: "1px solid var(--border)", padding: "12px 16px", color: "var(--text)", fontSize: 14, outline: "none", fontFamily: "'DM Sans', sans-serif", borderRadius: 2 }}
          />
          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{ background: loading ? "rgba(201,168,76,0.4)" : "var(--gold)", border: "none", color: "#000", padding: "12px 24px", fontSize: 12, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", cursor: loading ? "not-allowed" : "pointer", fontFamily: "'DM Sans', sans-serif", borderRadius: 2, whiteSpace: "nowrap" }}>
            {loading ? "..." : "Subscribe"}
          </button>
        </div>
        <p style={{ fontSize: 11, color: "var(--text-muted)" }}>No spam. Unsubscribe any time.</p>
      </div>
    </div>
  );
}