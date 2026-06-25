"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";

interface Subscriber {
  id: string;
  email: string;
  first_name?: string;
  is_active: boolean;
  created_at: string;
}

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function AdminNewsletterPanel() {
  const { token } = useAuth();
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading]         = useState(true);
  const [subject, setSubject]         = useState("");
  const [body, setBody]               = useState("");
  const [sending, setSending]         = useState(false);
  const [result, setResult]           = useState("");

  const fetchSubscribers = useCallback(() => {
    if (!token) return;
    setLoading(true);
    void fetch(`${API}/newsletter/subscribers`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(setSubscribers)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => { fetchSubscribers(); }, [fetchSubscribers]);

  const handleSend = async () => {
    if (!token || !subject.trim() || !body.trim()) {
      setResult("Subject and body are required.");
      return;
    }
    const activeCount = subscribers.filter(s => s.is_active).length;
    if (!window.confirm(`Send to ${activeCount} active subscribers?`)) return;
    setSending(true);
    setResult("");
    try {
      const res = await fetch(`${API}/newsletter/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ subject, html_body: body }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Send failed");
      setResult(`✓ Sent to ${data.sent} subscribers${data.failed ? ` (${data.failed} failed)` : ""}`);
      setSubject("");
      setBody("");
    } catch (err: unknown) {
      setResult(`✗ ${err instanceof Error ? err.message : "Send failed"}`);
    } finally {
      setSending(false);
    }
  };

  const active = subscribers.filter(s => s.is_active).length;

  const inputStyle: React.CSSProperties = {
    width: "100%", background: "var(--surface)", border: "1px solid var(--border)",
    padding: "10px 14px", color: "var(--text)", fontSize: 13, outline: "none",
    fontFamily: "'DM Sans', sans-serif", borderRadius: 2, boxSizing: "border-box",
  };
  const labelStyle: React.CSSProperties = {
    display: "block", fontSize: 11, letterSpacing: "0.1em",
    textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 6,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: 20, borderRadius: 2, textAlign: "center" }}>
          <div className="font-serif" style={{ fontSize: 36, fontWeight: 300, color: "var(--gold)" }}>{active}</div>
          <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 4 }}>Active Subscribers</div>
        </div>
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: 20, borderRadius: 2, textAlign: "center" }}>
          <div className="font-serif" style={{ fontSize: 36, fontWeight: 300, color: "var(--text)" }}>{subscribers.length}</div>
          <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 4 }}>Total Signups</div>
        </div>
      </div>

      {/* Broadcast composer */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: 20, borderRadius: 2 }}>
        <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Send Broadcast Email</h4>
        <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 16 }}>
          Your message will be wrapped in the Stonepath email template automatically.
        </p>

        {result && (
          <div style={{
            background: result.startsWith("✓") ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
            border: `1px solid ${result.startsWith("✓") ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}`,
            color: result.startsWith("✓") ? "#22c55e" : "#f87171",
            padding: "10px 14px", fontSize: 13, marginBottom: 16, borderRadius: 2,
          }}>
            {result}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={labelStyle}>Subject Line</label>
            <input
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="e.g. New listings in Kampala this week"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Email Body (plain text or basic HTML)</label>
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              rows={6}
              placeholder={`<p>We have exciting new properties available...</p>\n<p>Browse the latest listings on Stonepath Estates.</p>`}
              style={{ ...inputStyle, resize: "vertical" }}
            />
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              onClick={handleSend}
              disabled={sending || active === 0}
              style={{
                background: sending || active === 0 ? "rgba(201,168,76,0.4)" : "var(--gold)",
                border: "none", color: "#000", padding: "10px 28px",
                fontSize: 11, fontWeight: 600, letterSpacing: "0.1em",
                textTransform: "uppercase",
                cursor: sending || active === 0 ? "not-allowed" : "pointer",
                fontFamily: "'DM Sans', sans-serif", borderRadius: 2,
              }}>
              {sending ? "Sending..." : active === 0 ? "No subscribers yet" : `Send to ${active} subscriber${active !== 1 ? "s" : ""}`}
            </button>
          </div>
        </div>
      </div>

      {/* Subscriber list */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: 20, borderRadius: 2 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h4 style={{ fontSize: 14, fontWeight: 600 }}>Subscribers</h4>
          <button
            onClick={fetchSubscribers}
            style={{ background: "transparent", border: "1px solid var(--border)", color: "var(--text-muted)", padding: "4px 12px", fontSize: 11, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", borderRadius: 2 }}>
            ↻ Refresh
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "24px 0", color: "var(--text-muted)", fontSize: 13 }}>Loading...</div>
        ) : subscribers.length === 0 ? (
          <div style={{ textAlign: "center", padding: "24px 0", color: "var(--text-muted)", fontSize: 13 }}>
            No subscribers yet. The signup form is live on the homepage.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  {["Email", "Name", "Status", "Subscribed"].map(h => (
                    <th key={h} style={{ textAlign: "left", padding: "8px 12px", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 500 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {subscribers.map(s => (
                  <tr key={s.id} style={{ borderBottom: "1px solid var(--border)", opacity: s.is_active ? 1 : 0.5 }}>
                    <td style={{ padding: "10px 12px" }}>{s.email}</td>
                    <td style={{ padding: "10px 12px", color: "var(--text-muted)" }}>{s.first_name || "—"}</td>
                    <td style={{ padding: "10px 12px" }}>
                      <span style={{ fontSize: 11, color: s.is_active ? "#22c55e" : "#f87171" }}>
                        {s.is_active ? "Active" : "Unsubscribed"}
                      </span>
                    </td>
                    <td style={{ padding: "10px 12px", color: "var(--text-muted)", fontSize: 12 }}>
                      {new Date(s.created_at).toLocaleDateString("en-GB", {
                        day: "numeric", month: "short", year: "numeric",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}