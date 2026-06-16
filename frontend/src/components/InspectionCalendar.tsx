"use client";

import { useState, useEffect, useCallback } from "react";
import { inspectionsApi, Inspection } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export default function InspectionCalendar() {
  const { token } = useAuth();
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const fetchInspections = useCallback(async () => {
    if (!token) return;
    try {
      const data = await inspectionsApi.getForAgent(token);
      setInspections(data);
    } catch (err) { console.error(err); }
  }, [token]);

  useEffect(() => {
    const load = async () => { await fetchInspections(); };
    load();
  }, [fetchInspections]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Build a map of date → inspections
  const inspectionsByDate = inspections.reduce((acc, inspection) => {
    const date = inspection.preferred_date?.split('T')[0];
    if (!date) return acc;
    if (!acc[date]) acc[date] = [];
    acc[date].push(inspection);
    return acc;
  }, {} as Record<string, Inspection[]>);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const today = new Date().toISOString().split('T')[0];

  const getDateString = (day: number) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const selectedInspections = selectedDay ? (inspectionsByDate[selectedDay] || []) : [];

  const statusColor = (status: string) => {
    if (status === 'confirmed') return '#22c55e';
    if (status === 'cancelled') return '#f87171';
    if (status === 'completed') return 'var(--text-muted)';
    return '#f59e0b';
  };

  return (
    <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', padding: 24 }}>
      <h3 className="font-serif" style={{ fontSize: 22, fontWeight: 400, marginBottom: 20 }}>
        Inspection Calendar
      </h3>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>

        {/* Calendar */}
        <div>
          {/* Month navigation */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <button onClick={prevMonth}
              style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text)', padding: '6px 12px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", borderRadius: 2 }}>
              ‹
            </button>
            <span style={{ fontWeight: 500, fontSize: 14 }}>
              {monthNames[month]} {year}
            </span>
            <button onClick={nextMonth}
              style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text)', padding: '6px 12px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", borderRadius: 2 }}>
              ›
            </button>
          </div>

          {/* Day headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 4 }}>
            {dayNames.map(d => (
              <div key={d} style={{ textAlign: 'center', fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.05em', padding: '4px 0' }}>
                {d}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
            {/* Empty cells for first week */}
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}

            {/* Day cells */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = getDateString(day);
              const dayInspections = inspectionsByDate[dateStr] || [];
              const isToday = dateStr === today;
              const isSelected = dateStr === selectedDay;
              const hasInspections = dayInspections.length > 0;
              const hasConfirmed = dayInspections.some(i => i.status === 'confirmed');
              const hasPending = dayInspections.some(i => i.status === 'pending');

              return (
                <div key={day}
                  onClick={() => setSelectedDay(isSelected ? null : dateStr)}
                  style={{
                    padding: '6px 4px',
                    textAlign: 'center',
                    fontSize: 13,
                    cursor: hasInspections ? 'pointer' : 'default',
                    borderRadius: 2,
                    border: isSelected ? '1px solid var(--gold)' : isToday ? '1px solid rgba(201,168,76,0.4)' : '1px solid transparent',
                    background: isSelected ? 'rgba(201,168,76,0.1)' : hasInspections ? 'var(--surface)' : 'transparent',
                    color: isToday ? 'var(--gold)' : 'var(--text)',
                    position: 'relative',
                    transition: 'all 0.15s',
                  }}>
                  {day}
                  {/* Dots for inspections */}
                  {hasInspections && (
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 2, marginTop: 2 }}>
                      {hasConfirmed && <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#22c55e' }} />}
                      {hasPending && <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#f59e0b' }} />}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', gap: 16, marginTop: 16, fontSize: 11, color: 'var(--text-muted)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e' }} />
              Confirmed
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b' }} />
              Pending
            </div>
          </div>
        </div>

        {/* Selected day details */}
        <div>
          {selectedDay ? (
            <>
              <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 12, color: 'var(--gold)' }}>
                📅 {new Date(selectedDay + 'T12:00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
              {selectedInspections.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>No inspections on this day.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {selectedInspections.map(insp => (
                    <div key={insp.id} style={{ border: '1px solid var(--border)', padding: 12, borderRadius: 2 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontWeight: 500, fontSize: 13 }}>{insp.property_title}</span>
                        <span style={{ fontSize: 11, color: statusColor(insp.status), textTransform: 'capitalize' }}>● {insp.status}</span>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>🕐 {insp.preferred_time}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {insp.buyer_name} · {insp.buyer_email}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', paddingTop: 40 }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>📅</div>
              Click a day on the calendar to see inspection details
            </div>
          )}
        </div>

      </div>
    </div>
  );
}