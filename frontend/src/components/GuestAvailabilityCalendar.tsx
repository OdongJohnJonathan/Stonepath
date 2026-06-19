"use client";
// Read-only calendar showing blocked/booked dates for a short stay property

import { useState, useEffect } from "react";
import { shortStaysApi } from "@/lib/api/shortStays";

interface Props {
  propertyId: string;
}

const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAY_NAMES = ["Su","Mo","Tu","We","Th","Fr","Sa"];

export default function GuestAvailabilityCalendar({ propertyId }: Props) {
  const [currentDate, setCurrentDate]   = useState(new Date());
  const [blockedDates, setBlockedDates] = useState<Set<string>>(new Set());
  const [loading, setLoading]           = useState(true);

  useEffect(() => {
    setLoading(true);
    shortStaysApi.getBlockedDates(propertyId)
      .then(res => setBlockedDates(new Set(res.blocked)))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [propertyId]);

  const year        = currentDate.getFullYear();
  const month       = currentDate.getMonth();
  const firstDay    = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today       = new Date().toISOString().split("T")[0];

  const dateStr = (day: number) =>
    `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 2, marginBottom: 28 }}>
      <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', fontSize: 12, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
        Availability
      </div>
      <div style={{ padding: 16 }}>
        {/* Legend */}
        <div style={{ display: "flex", gap: 16, marginBottom: 14, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 12, height: 12, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 2 }} />
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Available</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 12, height: 12, background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.4)", borderRadius: 2 }} />
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Booked / Unavailable</span>
          </div>
        </div>

        {/* Month nav */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <button onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
            style={{ background: "none", border: "1px solid var(--border)", color: "var(--text)", padding: "4px 12px", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", borderRadius: 2 }}>
            ‹
          </button>
          <span style={{ fontSize: 14, fontWeight: 500 }}>{MONTH_NAMES[month]} {year}</span>
          <button onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
            style={{ background: "none", border: "1px solid var(--border)", color: "var(--text)", padding: "4px 12px", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", borderRadius: 2 }}>
            ›
          </button>
        </div>

        {/* Day headers */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 3, marginBottom: 3 }}>
          {DAY_NAMES.map(d => (
            <div key={d} style={{ textAlign: "center", fontSize: 10, color: "var(--text-muted)", padding: "3px 0" }}>{d}</div>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "30px 0", color: "var(--text-muted)", fontSize: 13 }}>Loading...</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 3 }}>
            {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
              const date     = dateStr(day);
              const isPast   = date < today;
              const isBlock  = blockedDates.has(date);

              let bg = "var(--surface)", border = "1px solid var(--border)", color = "var(--text)";
              if (isPast) { color = "var(--text-muted)"; border = "1px solid transparent"; }
              else if (isBlock) { bg = "rgba(239,68,68,0.12)"; border = "1px solid rgba(239,68,68,0.35)"; color = "#f87171"; }

              return (
                <div key={day} style={{ padding: "7px 0", textAlign: "center", fontSize: 12, background: bg, border, color, borderRadius: 2, opacity: isPast ? 0.35 : 1 }}>
                  {day}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}