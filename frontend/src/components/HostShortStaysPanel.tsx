"use client";

import { useState, useEffect, useCallback } from "react";
import { shortStaysApi, type ShortStayBooking } from "@/lib/api/shortStays";
import { useAuth } from "@/context/AuthContext";

export default function HostShortStaysPanel() {
  const { token } = useAuth();
  const [bookings, setBookings]   = useState<ShortStayBooking[]>([]);
  const [loading, setLoading]     = useState(true);
  const [updating, setUpdating]   = useState<string | null>(null);
  const [filter, setFilter]       = useState<"all"|"pending"|"confirmed"|"cancelled">("all");

  const fetchBookings = useCallback(() => {
    if (!token) return;
    void shortStaysApi.getHosted(token)
      .then(data => setBookings(data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  const handleStatus = async (id: string, status: "confirmed"|"cancelled"|"completed") => {
    if (!token) return;
    setUpdating(id);
    try { await shortStaysApi.updateStatus(id, status, token); await fetchBookings(); }
    catch (err: unknown) { alert(err instanceof Error ? err.message : "Failed to update"); }
    finally { setUpdating(null); }
  };

  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  const fmtMoney = (amount: number, currency = "UGX") =>
    `${currency} ${Number(amount).toLocaleString()}`;
  const nights = (b: ShortStayBooking) =>
    Math.round((new Date(b.check_out).getTime() - new Date(b.check_in).getTime()) / 86400000);
  const statusColor = (s: string) =>
    ({ confirmed: "#22c55e", pending: "#f59e0b", cancelled: "#f87171", completed: "var(--text-muted)" }[s] || "var(--text-muted)");

  const filtered = filter === "all" ? bookings : bookings.filter(b => b.status === filter);

  const tabStyle = (f: string): React.CSSProperties => ({
    background: filter === f ? "var(--gold)" : "transparent",
    border: filter === f ? "1px solid var(--gold)" : "1px solid var(--border)",
    color: filter === f ? "#000" : "var(--text-muted)",
    padding: "6px 14px", fontSize: 11, cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif", borderRadius: 2,
    textTransform: "uppercase", letterSpacing: "0.08em",
  });

  return (
    <div style={{ background: "var(--card-bg)", border: "1px solid var(--border)", padding: 24 }}>
      <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--gold)", marginBottom: 4 }}>Short Stays</p>
      <h3 className="font-serif" style={{ fontSize: 24, fontWeight: 400, marginBottom: 20 }}>Incoming Bookings</h3>

      <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
        {(["all","pending","confirmed","cancelled"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} style={tabStyle(f)}>
            {f === "all" ? `All (${bookings.length})` : `${f} (${bookings.filter(b => b.status === f).length})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "32px 0", color: "var(--text-muted)", fontSize: 14 }}>Loading...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "32px 0", color: "var(--text-muted)", fontSize: 14 }}>
          {filter === "all" ? "No bookings yet on your short stay properties." : `No ${filter} bookings.`}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filtered.map(b => (
            <div key={b.id} style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: 16, borderRadius: 2 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 12, flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontWeight: 500, fontSize: 14, marginBottom: 2 }}>{b.property_title}</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{b.property_location}</div>
                </div>
                <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 10, background: `${statusColor(b.status)}22`, color: statusColor(b.status), fontWeight: 600, textTransform: "capitalize" }}>{b.status}</span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 10, marginBottom: 12, fontSize: 12 }}>
                {[
                  { label: "Check-in", value: fmtDate(b.check_in) },
                  { label: "Check-out", value: fmtDate(b.check_out) },
                  { label: "Duration", value: `${nights(b)} nights · ${b.guests} guests` },
                  { label: "Total", value: fmtMoney(b.total_amount, b.currency), gold: true },
                ].map(({ label, value, gold }) => (
                  <div key={label} style={{ background: "var(--card-bg)", padding: "8px 10px", borderRadius: 2, border: "1px solid var(--border)" }}>
                    <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 2 }}>{label}</div>
                    <div style={{ fontWeight: gold ? 600 : 500, color: gold ? "var(--gold)" : "var(--text)" }}>{value}</div>
                  </div>
                ))}
              </div>

              <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: b.message ? 10 : 0 }}>
                <span style={{ color: "var(--text)" }}>{b.guest_first_name} {b.guest_last_name}</span>
                {b.guest_email && <> · <a href={`mailto:${b.guest_email}`} style={{ color: "var(--gold)" }}>{b.guest_email}</a></>}
                {b.guest_phone && <> · {b.guest_phone}</>}
              </div>

              {b.message && (
                <div style={{ background: "var(--card-bg)", border: "1px solid var(--border)", padding: "8px 12px", borderRadius: 2, fontSize: 12, color: "var(--text-muted)", marginBottom: 12 }}>
                  <span style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em" }}>Note: </span>{b.message}
                </div>
              )}

              {b.status === "pending" && (
                <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", paddingTop: 10, borderTop: "1px solid var(--border)" }}>
                  <button onClick={() => handleStatus(b.id, "cancelled")} disabled={updating === b.id}
                    style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171", padding: "7px 16px", fontSize: 11, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", borderRadius: 2 }}>
                    Decline
                  </button>
                  <button onClick={() => handleStatus(b.id, "confirmed")} disabled={updating === b.id}
                    style={{ background: "#22c55e", border: "none", color: "#000", padding: "7px 20px", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", borderRadius: 2 }}>
                    {updating === b.id ? "Saving..." : "Confirm"}
                  </button>
                </div>
              )}

              {b.status === "confirmed" && (
                <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", paddingTop: 10, borderTop: "1px solid var(--border)" }}>
                  <button onClick={() => handleStatus(b.id, "cancelled")} disabled={updating === b.id}
                    style={{ background: "transparent", border: "1px solid var(--border)", color: "var(--text-muted)", padding: "7px 16px", fontSize: 11, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", borderRadius: 2 }}>
                    Cancel
                  </button>
                  <button onClick={() => handleStatus(b.id, "completed")} disabled={updating === b.id}
                    style={{ background: "rgba(201,168,76,0.15)", border: "1px solid var(--gold)", color: "var(--gold)", padding: "7px 20px", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", borderRadius: 2 }}>
                    {updating === b.id ? "Saving..." : "Mark Completed"}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}