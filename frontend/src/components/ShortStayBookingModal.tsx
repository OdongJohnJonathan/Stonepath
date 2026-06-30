"use client";

import { useState, useEffect } from "react";
import { shortStaysApi, type ShortStayBooking } from "@/lib/api/shortStays";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

interface Props {
  property: {
    id: string;
    title: string;
    currency?: string;
    amenities?: Record<string, unknown>;
  };
  onClose: () => void;
}

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
const DAY_NAMES = ["Su","Mo","Tu","We","Th","Fr","Sa"];

export default function ShortStayBookingModal({ property, onClose }: Props) {
  const { token } = useAuth();
  const router = useRouter();

  const dailyRate  = (property.amenities?.daily_rate as number) || 0;
  const maxGuests  = (property.amenities?.max_guests as number) || 10;
  const minNights  = (property.amenities?.min_nights as number) || 1;
  const currency   = property.currency || "UGX";

  const [currentDate, setCurrentDate]   = useState(new Date());
  const [blockedDates, setBlockedDates] = useState<Set<string>>(new Set());
  const [checkIn, setCheckIn]           = useState<string | null>(null);
  const [checkOut, setCheckOut]         = useState<string | null>(null);
  const [selectingCheckOut, setSelectingCheckOut] = useState(false);
  const [guests, setGuests]             = useState(1);
  const [phone, setPhone]               = useState("");
  const [provider, setProvider]         = useState("mtn");
  const [message, setMessage]           = useState("");
  const [loading, setLoading]           = useState(false);
  const [loadingDates, setLoadingDates] = useState(true);
  const [error, setError]               = useState("");
  const [booking, setBooking]           = useState<ShortStayBooking | null>(null);

  useEffect(() => {
    shortStaysApi.getBlockedDates(property.id)
      .then(res => setBlockedDates(new Set(res.blocked)))
      .catch(console.error)
      .finally(() => setLoadingDates(false));
  }, [property.id]);

  const year        = currentDate.getFullYear();
  const month       = currentDate.getMonth();
  const firstDay    = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today       = new Date().toISOString().split("T")[0];

  const dateStr = (day: number) =>
    `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  const nights      = checkIn && checkOut
    ? Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000)
    : 0;
  const SERVICE_FEE_RATE = 0.07; // 7% Stonepath service fee
  const subtotal     = nights * dailyRate;
  const serviceFee   = Math.round(subtotal * SERVICE_FEE_RATE);
  const totalAmount  = subtotal + serviceFee;

  const fmtMoney = (n: number) =>
    `${currency} ${n.toLocaleString()}`;

  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

  const handleDayClick = (date: string) => {
    if (date < today || blockedDates.has(date)) return;

    if (!selectingCheckOut) {
      setCheckIn(date);
      setCheckOut(null);
      setSelectingCheckOut(true);
      setError("");
      return;
    }

    if (date <= checkIn!) {
      setCheckIn(date);
      setCheckOut(null);
      return;
    }

    // Check no blocked dates in the range
    const cur = new Date(checkIn!);
    cur.setDate(cur.getDate() + 1);
    const end = new Date(date);
    while (cur < end) {
      if (blockedDates.has(cur.toISOString().split("T")[0])) {
        setError("That range includes unavailable dates. Please choose another period.");
        return;
      }
      cur.setDate(cur.getDate() + 1);
    }

    const n = Math.round((new Date(date).getTime() - new Date(checkIn!).getTime()) / 86400000);
    if (n < minNights) {
      setError(`Minimum stay is ${minNights} day${minNights !== 1 ? "s" : ""}.`);
      return;
    }

    setCheckOut(date);
    setSelectingCheckOut(false);
    setError("");
  };

  const getDayStyle = (date: string): React.CSSProperties => {
    const isPast    = date < today;
    const isBlocked = blockedDates.has(date);
    const isIn      = date === checkIn;
    const isOut     = date === checkOut;
    const inRange   = checkIn && checkOut && date > checkIn && date < checkOut;

    if (isPast || isBlocked)
      return { background: "var(--surface)", color: "var(--text-muted)", cursor: "not-allowed", opacity: 0.4, border: "1px solid transparent", borderRadius: 2 };
    if (isIn || isOut)
      return { background: "var(--gold)", color: "#000", fontWeight: 700, cursor: "pointer", border: "1px solid var(--gold)", borderRadius: 2 };
    if (inRange)
      return { background: "rgba(201,168,76,0.12)", color: "var(--text)", cursor: "pointer", border: "1px solid rgba(201,168,76,0.2)", borderRadius: 0 };
    return { background: "var(--surface)", color: "var(--text)", cursor: "pointer", border: "1px solid var(--border)", borderRadius: 2 };
  };

  const handleSubmit = async () => {
    if (!token) { router.push("/login"); return; }
    if (!checkIn || !checkOut) { setError("Please select check-in and check-out dates."); return; }
    if (!phone.trim()) { setError("Please enter your phone number for payment."); return; }
    setLoading(true);
    setError("");
    try {
      const res = await shortStaysApi.book(
        { property_id: property.id, check_in: checkIn, check_out: checkOut, guests, phone_number: phone, provider, message: message || undefined },
        token
      );
      setBooking(res.booking);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Booking failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

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
    <div style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, backdropFilter: "blur(4px)" }}>
      <div style={{ background: "var(--card-bg)", border: "1px solid var(--border)", padding: "36px 32px", width: "100%", maxWidth: 520, maxHeight: "95vh", overflowY: "auto", borderRadius: 2 }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
          <div>
            <p style={{ fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--gold)", marginBottom: 4 }}>Short Stay</p>
            <h2 className="font-serif" style={{ fontSize: 24, fontWeight: 300 }}>Book Your Stay</h2>
            <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>{property.title}</p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 20, padding: 4 }}>✕</button>
        </div>

        {booking ? (
          /* ── SUCCESS STATE ── */
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>🎉</div>
            <h3 className="font-serif" style={{ fontSize: 22, fontWeight: 400, marginBottom: 8 }}>Booking Received!</h3>
            <p style={{ color: "var(--text-muted)", fontSize: 13, lineHeight: 1.6, marginBottom: 20 }}>
              Your booking is <strong style={{ color: "#f59e0b" }}>pending confirmation</strong> from the host. A confirmation email has been sent to you.
            </p>
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: 16, textAlign: "left", marginBottom: 20, borderRadius: 2 }}>
              <div style={{ fontSize: 11, color: "var(--gold)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>Booking Summary</div>
              <div style={{ fontSize: 13, display: "flex", flexDirection: "column", gap: 6 }}>
                <div><span style={{ color: "var(--text-muted)" }}>Check-in:</span> {fmtDate(booking.check_in)}</div>
                <div><span style={{ color: "var(--text-muted)" }}>Check-out:</span> {fmtDate(booking.check_out)}</div>
                <div><span style={{ color: "var(--text-muted)" }}>Guests:</span> {booking.guests}</div>
                <div><span style={{ color: "var(--text-muted)" }}>Total:</span> <strong style={{ color: "var(--gold)" }}>{fmtMoney(booking.total_amount)}</strong></div>
                <div><span style={{ color: "var(--text-muted)" }}>Status:</span> <span style={{ color: "#f59e0b", textTransform: "capitalize" }}>{booking.status}</span></div>
              </div>
            </div>
            <button onClick={onClose} style={{ background: "var(--gold)", border: "none", color: "#000", padding: "12px 32px", fontSize: 12, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", borderRadius: 2 }}>
              Done
            </button>
          </div>
        ) : (
          <>
            {/* Daily rate banner */}
            {dailyRate > 0 && (
              <div style={{ background: "rgba(201,168,76,0.08)", border: "1px solid var(--border)", padding: "10px 14px", marginBottom: 20, borderRadius: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Rate per day</span>
                <span style={{ color: "var(--gold)", fontWeight: 600, fontSize: 16 }}>{fmtMoney(dailyRate)}</span>
              </div>
            )}

            {/* Instruction */}
            <div style={{ marginBottom: 12, fontSize: 12, color: "var(--text-muted)" }}>
              {!checkIn ? "👇 Click a date to set check-in" : !checkOut ? "👇 Now click your check-out date" : "✓ Dates selected — fill in details below"}
            </div>

            {/* Calendar */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <button onClick={() => setCurrentDate(new Date(year, month - 1, 1))} style={{ background: "none", border: "1px solid var(--border)", color: "var(--text)", padding: "4px 12px", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", borderRadius: 2 }}>‹</button>
                <span style={{ fontSize: 14, fontWeight: 500 }}>{MONTH_NAMES[month]} {year}</span>
                <button onClick={() => setCurrentDate(new Date(year, month + 1, 1))} style={{ background: "none", border: "1px solid var(--border)", color: "var(--text)", padding: "4px 12px", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", borderRadius: 2 }}>›</button>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 3, marginBottom: 3 }}>
                {DAY_NAMES.map(d => (
                  <div key={d} style={{ textAlign: "center", fontSize: 10, color: "var(--text-muted)", padding: "3px 0" }}>{d}</div>
                ))}
              </div>

              {loadingDates ? (
                <div style={{ textAlign: "center", padding: "30px 0", color: "var(--text-muted)", fontSize: 13 }}>Loading availability...</div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 3 }}>
                  {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
                  {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                    const date = dateStr(day);
                    return (
                      <div key={day} onClick={() => handleDayClick(date)}
                        style={{ padding: "7px 0", textAlign: "center", fontSize: 12, transition: "all 0.1s ease", ...getDayStyle(date) }}>
                        {day}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Selected range summary */}
            {checkIn && (
              <div style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: "10px 14px", marginBottom: 16, borderRadius: 2, fontSize: 13 }}>
                <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
                  <div>
                    <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 2 }}>Check-in</div>
                    <div style={{ color: "var(--gold)" }}>{fmtDate(checkIn)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 2 }}>Check-out</div>
                    <div style={{ color: checkOut ? "var(--gold)" : "var(--text-muted)" }}>{checkOut ? fmtDate(checkOut) : "—"}</div>
                  </div>
                {nights > 0 && (
                  <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--border)", fontSize: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, color: "var(--text-muted)" }}>
                      <span>{nights} day{nights !== 1 ? "s" : ""} × {fmtMoney(dailyRate)}</span>
                      <span>{fmtMoney(subtotal)}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, color: "var(--text-muted)" }}>
                      <span>Service fee (7%)</span>
                      <span>{fmtMoney(serviceFee)}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 600, color: "var(--gold)", fontSize: 14 }}>
                      <span>Total</span>
                      <span>{fmtMoney(totalAmount)}</span>
                    </div>
                  </div>
                )}
                </div>
              </div>
            )}

            {error && (
              <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171", padding: "10px 14px", fontSize: 13, marginBottom: 14, borderRadius: 2 }}>
                {error}
              </div>
            )}

            {/* Booking form */}
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={labelStyle}>Number of Guests</label>
                <select value={guests} onChange={e => setGuests(Number(e.target.value))} style={inputStyle}>
                  {Array.from({ length: maxGuests }, (_, i) => i + 1).map(n => (
                    <option key={n} value={n}>{n} guest{n !== 1 ? "s" : ""}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={labelStyle}>Phone (for payment)</label>
                  <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="e.g. 0771234567" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Provider</label>
                  <select value={provider} onChange={e => setProvider(e.target.value)} style={inputStyle}>
                    <option value="mtn">MTN MoMo</option>
                    <option value="airtel">Airtel Money</option>
                    <option value="mpesa">M-Pesa</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={labelStyle}>Message to Host (optional)</label>
                <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Any special requests..." rows={2} style={{ ...inputStyle, resize: "vertical" }} />
              </div>

              <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                <button onClick={onClose} style={{ flex: 1, background: "transparent", border: "1px solid var(--border)", color: "var(--text-muted)", padding: "12px", fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", borderRadius: 2 }}>
                  Cancel
                </button>
                <button onClick={handleSubmit} disabled={loading || !checkIn || !checkOut || !phone}
                  style={{ flex: 2, background: loading || !checkIn || !checkOut || !phone ? "rgba(201,168,76,0.4)" : "var(--gold)", border: "none", color: "#0a0a0b", padding: "12px", fontSize: 12, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", cursor: loading || !checkIn || !checkOut || !phone ? "not-allowed" : "pointer", fontFamily: "'DM Sans', sans-serif", borderRadius: 2 }}>
                  {loading ? "Booking..." : nights > 0 ? `Book — ${fmtMoney(totalAmount)}` : "Book Stay"}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}