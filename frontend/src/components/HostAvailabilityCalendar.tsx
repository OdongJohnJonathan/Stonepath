"use client";

import { useState, useEffect, useCallback } from "react";
import { shortStaysApi } from "@/lib/api/shortStays";
import { useAuth } from "@/context/AuthContext";
import type { Property } from "@/lib/api";

interface Props {
  properties: Property[];
}

const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAY_NAMES = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

export default function HostAvailabilityCalendar({ properties }: Props) {
  const { token } = useAuth();
  const shortStayProps = properties.filter(p => p.transaction_type_id === 3);

  const [selectedPropertyId, setSelectedPropertyId] = useState<string>(shortStayProps[0]?.id ?? "");
  const [currentDate, setCurrentDate]   = useState(new Date());
  const [blockedDates, setBlockedDates] = useState<Set<string>>(new Set());
  const [selected, setSelected]         = useState<Set<string>>(new Set());
  const [loading, setLoading]           = useState(false);
  const [saving, setSaving]             = useState(false);
  const [statusMsg, setStatusMsg]       = useState("");

  const fetchBlocked = useCallback(() => {
    if (!selectedPropertyId) return;
    setLoading(true);
    void shortStaysApi.getBlockedDates(selectedPropertyId)
      .then(res => setBlockedDates(new Set(res.blocked)))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [selectedPropertyId]);

  useEffect(() => {
    fetchBlocked();
    setSelected(new Set());
    setStatusMsg("");
  }, [fetchBlocked]);

  const year        = currentDate.getFullYear();
  const month       = currentDate.getMonth();
  const firstDay    = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today       = new Date().toISOString().split("T")[0];

  const dateStr = (day: number) =>
    `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  const toggleDate = (date: string) => {
    if (date < today) return;
    const next = new Set(selected);
    next.has(date) ? next.delete(date) : next.add(date);
    setSelected(next);
    setStatusMsg("");
  };

  const handleSave = async (action: "block" | "unblock") => {
    if (!token || selected.size === 0) return;
    setSaving(true);
    try {
      const res = await shortStaysApi.blockDates(selectedPropertyId, [...selected], action, token);
      setStatusMsg(`✓ ${res.count} date${res.count !== 1 ? "s" : ""} ${action}ed`);
      setSelected(new Set());
      fetchBlocked();
    } catch (err: unknown) {
      setStatusMsg(`✗ ${err instanceof Error ? err.message : "Failed to save"}`);
    } finally {
      setSaving(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", background: "var(--surface)", border: "1px solid var(--border)",
    padding: "10px 14px", color: "var(--text)", fontSize: 13, outline: "none",
    fontFamily: "'DM Sans', sans-serif", borderRadius: 2,
  };

  if (shortStayProps.length === 0) {
    return (
      <div style={{ background: "var(--card-bg)", border: "1px solid var(--border)", padding: 24 }}>
        <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--gold)", marginBottom: 4 }}>Short Stays</p>
        <h3 className="font-serif" style={{ fontSize: 22, fontWeight: 400, marginBottom: 8 }}>Availability Calendar</h3>
        <p style={{ color: "var(--text-muted)", fontSize: 13 }}>
          No Short Stay listings yet. Submit a property with listing type &quot;Short Stay&quot; to manage availability.
        </p>
      </div>
    );
  }

  return (
    <div style={{ background: "var(--card-bg)", border: "1px solid var(--border)", padding: 24 }}>
      <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--gold)", marginBottom: 4 }}>Short Stays</p>
      <h3 className="font-serif" style={{ fontSize: 24, fontWeight: 400, marginBottom: 4 }}>Availability Calendar</h3>
      <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 20 }}>
        Click dates to select, then block or unblock in bulk.
      </p>

      {/* Property selector */}
      {shortStayProps.length > 1 && (
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", display: "block", marginBottom: 6 }}>
            Property
          </label>
          <select value={selectedPropertyId} onChange={e => setSelectedPropertyId(e.target.value)} style={inputStyle}>
            {shortStayProps.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
          </select>
        </div>
      )}

      {/* Legend */}
      <div style={{ display: "flex", gap: 16, marginBottom: 16, flexWrap: "wrap" }}>
        {[
          { color: "var(--surface)", border: "1px solid var(--border)", label: "Available" },
          { color: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.4)", label: "Blocked / Booked" },
          { color: "rgba(201,168,76,0.2)", border: "1px solid var(--gold)", label: "Selected" },
        ].map(({ color, border, label }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 14, height: 14, background: color, border, borderRadius: 2 }} />
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{label}</span>
          </div>
        ))}
      </div>

      {/* Month nav */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <button
          onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
          style={{ background: "none", border: "1px solid var(--border)", color: "var(--text)", padding: "6px 14px", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", borderRadius: 2 }}>
          ‹
        </button>
        <span style={{ fontSize: 15, fontWeight: 500 }}>{MONTH_NAMES[month]} {year}</span>
        <button
          onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
          style={{ background: "none", border: "1px solid var(--border)", color: "var(--text)", padding: "6px 14px", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", borderRadius: 2 }}>
          ›
        </button>
      </div>

      {/* Day headers */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 4 }}>
        {DAY_NAMES.map(d => (
          <div key={d} style={{ textAlign: "center", fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)", padding: "4px 0" }}>
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-muted)", fontSize: 13 }}>
          Loading...
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
          {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
            const date     = dateStr(day);
            const isPast   = date < today;
            const isBlock  = blockedDates.has(date);
            const isSel    = selected.has(date);
            const isToday  = date === today;

            let bg = "var(--surface)";
            let border = "1px solid var(--border)";
            let color = "var(--text)";
            let cursor = "pointer";

            if (isPast) {
              color = "var(--text-muted)"; cursor = "default"; border = "1px solid transparent";
            } else if (isSel) {
              bg = "rgba(201,168,76,0.2)"; border = "1px solid var(--gold)"; color = "var(--gold)";
            } else if (isBlock) {
              bg = "rgba(239,68,68,0.12)"; border = "1px solid rgba(239,68,68,0.35)"; color = "#f87171";
            }

            return (
              <div
                key={day}
                onClick={() => toggleDate(date)}
                style={{
                  padding: "6px 0", textAlign: "center", fontSize: 13,
                  background: bg, border, color, borderRadius: 2, cursor,
                  opacity: isPast ? 0.35 : 1,
                  fontWeight: isToday ? 700 : 400,
                  transition: "all 0.12s ease",
                  userSelect: "none",
                }}>
                {day}
                {isBlock && !isSel && (
                  <div style={{ width: 4, height: 4, background: "#f87171", borderRadius: "50%", margin: "2px auto 0" }} />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Action buttons */}
      <div style={{ marginTop: 16, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
          {selected.size > 0
            ? `${selected.size} date${selected.size !== 1 ? "s" : ""} selected`
            : "No dates selected"}
        </span>
        <div style={{ display: "flex", gap: 8, marginLeft: "auto" }}>
          <button
            onClick={() => setSelected(new Set())}
            disabled={selected.size === 0}
            style={{
              background: "transparent", border: "1px solid var(--border)",
              color: "var(--text-muted)", padding: "8px 16px", fontSize: 11,
              cursor: selected.size === 0 ? "not-allowed" : "pointer",
              fontFamily: "'DM Sans', sans-serif", borderRadius: 2,
              opacity: selected.size === 0 ? 0.4 : 1,
            }}>
            Clear
          </button>
          <button
            onClick={() => handleSave("unblock")}
            disabled={saving || selected.size === 0}
            style={{
              background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.4)",
              color: "#22c55e", padding: "8px 16px", fontSize: 11,
              cursor: saving || selected.size === 0 ? "not-allowed" : "pointer",
              fontFamily: "'DM Sans', sans-serif", borderRadius: 2,
              opacity: selected.size === 0 ? 0.4 : 1,
            }}>
            {saving ? "Saving..." : "Mark Available"}
          </button>
          <button
            onClick={() => handleSave("block")}
            disabled={saving || selected.size === 0}
            style={{
              background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.4)",
              color: "#f87171", padding: "8px 16px", fontSize: 11,
              cursor: saving || selected.size === 0 ? "not-allowed" : "pointer",
              fontFamily: "'DM Sans', sans-serif", borderRadius: 2,
              opacity: selected.size === 0 ? 0.4 : 1,
            }}>
            {saving ? "Saving..." : "Block Dates"}
          </button>
        </div>
      </div>

      {statusMsg && (
        <div style={{
          marginTop: 12, padding: "10px 14px", fontSize: 13,
          background: statusMsg.startsWith("✓") ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
          border: `1px solid ${statusMsg.startsWith("✓") ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}`,
          color: statusMsg.startsWith("✓") ? "#22c55e" : "#f87171",
          borderRadius: 2,
        }}>
          {statusMsg}
        </div>
      )}
    </div>
  );
}