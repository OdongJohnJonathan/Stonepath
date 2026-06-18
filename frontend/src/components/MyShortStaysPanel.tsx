"use client";

import { useState, useEffect, useCallback } from "react";
import { shortStaysApi, type ShortStayBooking } from "@/lib/api/shortStays";
import { useAuth } from "@/context/AuthContext";

export default function MyShortStaysPanel() {
  const { token } = useAuth();
  const [bookings, setBookings]     = useState<ShortStayBooking[]>([]);
  const [loading, setLoading]       = useState(true);
  const [cancelling, setCancelling] = useState<string | null>(null);

  const fetchBookings = useCallback(() => {
    if (!token) return;
    void shortStaysApi.getMine(token)
      .then(data => setBookings(data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  const handleCancel = async (id: string) => {
    if (!token || !window.confirm("Cancel this booking?")) return;
    setCancelling(id);
    try { await shortStaysApi.delete(id, token); await fetchBookings(); }
    catch (err: unknown) { alert(err instanceof Error ? err.message : "Failed to cancel"); }
    finally { setCancelling(null); }
  };

  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  const fmtMoney = (amount: number, currency = "UGX") =>
    `${currency} ${Number(amount).toLocaleString()}`;
  const nights = (b: ShortStayBooking) =>
    Math.round((new Date(b.check_out).getTime() - new Date(b.check_in).getTime()) / 86400000);
  const statusColor = (s: string) =>
    ({ confirmed: "#22c55e", pending: "#f59e0b", cancelled: "#f87171", completed: "var(--text-muted)" }[s] || "var(--text-muted)");

  return (
    <div style={{ background: "var(--card-bg)", border: "1px solid var(--border)", padding: 24 }}>
      <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--gold)", marginBottom: 4 }}>Short Stays</p>
      <h3 className="font-serif" style={{ fontSize: 24, fontWeight: 400, marginBottom: 20 }}>My Bookings</h3>

      {loading ? (
        <div style={{ textAlign: "center", padding: "32px 0", color: "var(--text-muted)", fontSize: 14 }}>Loading...</div>
      ) : bookings.length === 0 ? (
        <div style={{ textAlign: "center", padding: "32px 0", color: "var(--text-muted)", fontSize: 14 }}>No short stay bookings yet.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {bookings.map(b => (
            <div key={b.id} style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: 16, borderRadius: 2 }}>
              <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                <img
                  src={b.property_images?.[0] || "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=200&q=60"}
                  alt="" style={{ width: 72, height: 72, objectFit: "cover", borderRadius: 2, flexShrink: 0 }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 6 }}>
                    <div style={{ fontWeight: 500, fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.property_title}</div>
                    <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 10, background: `${statusColor(b.status)}22`, color: statusColor(b.status), fontWeight: 600, textTransform: "capitalize", flexShrink: 0 }}>{b.status}</span>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 8 }}>{b.property_location}</div>
                  <div style={{ display: "flex", gap: 16, fontSize: 12, flexWrap: "wrap" }}>
                    <div><span style={{ color: "var(--text-muted)" }}>In: </span>{fmtDate(b.check_in)}</div>
                    <div><span style={{ color: "var(--text-muted)" }}>Out: </span>{fmtDate(b.check_out)}</div>
                    <div><span style={{ color: "var(--text-muted)" }}>{nights(b)} night{nights(b) !== 1 ? "s" : ""} · </span>{b.guests} guest{b.guests !== 1 ? "s" : ""}</div>
                    <div style={{ color: "var(--gold)", fontWeight: 600 }}>{fmtMoney(b.total_amount, b.currency)}</div>
                  </div>
                  {b.status === "confirmed" && b.host_email && (
                    <div style={{ marginTop: 8, fontSize: 12, color: "var(--text-muted)" }}>
                      Host: <a href={`mailto:${b.host_email}`} style={{ color: "var(--gold)" }}>{b.host_email}</a>
                      {b.host_phone && <> · {b.host_phone}</>}
                    </div>
                  )}
                </div>
              </div>
              {b.status === "pending" && (
                <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px solid var(--border)", display: "flex", justifyContent: "flex-end" }}>
                  <button onClick={() => handleCancel(b.id)} disabled={cancelling === b.id}
                    style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171", padding: "6px 16px", fontSize: 11, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", borderRadius: 2 }}>
                    {cancelling === b.id ? "Cancelling..." : "Cancel Booking"}
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