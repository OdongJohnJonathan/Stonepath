"use client";

import { useState, useEffect, useCallback } from "react";
import { inspectionsApi, Inspection } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

interface InspectionsPanelProps {
  isAdmin?: boolean;
}

export default function InspectionsPanel({ isAdmin = false }: InspectionsPanelProps) {
  const { token } = useAuth();
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  const PREVIEW_COUNT = 4;

  const fetchInspections = useCallback(async () => {
    if (!token) return;
    try {
      const data = await inspectionsApi.getForAgent(token);
      setInspections(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    const load = async () => { await fetchInspections(); };
    load();
  }, [fetchInspections]);

  const handleStatus = async (id: string, status: string) => {
    if (!token) return;
    try {
      await inspectionsApi.updateStatus(id, status, token);
      fetchInspections();
    } catch (err) { console.error(err); }
  };

  const statusColor = (status: string) => {
    if (status === 'confirmed') return '#22c55e';
    if (status === 'cancelled') return '#f87171';
    if (status === 'completed') return 'var(--text-muted)';
    return '#f59e0b';
  };

  const statusBg = (status: string) => {
    if (status === 'confirmed') return 'rgba(34,197,94,0.1)';
    if (status === 'cancelled') return 'rgba(239,68,68,0.1)';
    if (status === 'completed') return 'rgba(107,114,128,0.1)';
    return 'rgba(245,158,11,0.1)';
  };

  const thumbnail = (images?: string[]) =>
    images?.[0] || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80';

  const visibleInspections = expanded ? inspections : inspections.slice(0, PREVIEW_COUNT);
  const hasMore = inspections.length > PREVIEW_COUNT;

  const pendingCount = inspections.filter(i => i.status === 'pending').length;
  const confirmedCount = inspections.filter(i => i.status === 'confirmed').length;

  if (loading) return (
    <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
      Loading inspections...
    </div>
  );

  return (
    <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', padding: 24 }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h3 className="font-serif" style={{ fontSize: 22, fontWeight: 400, marginBottom: 6 }}>
            {isAdmin ? 'All Inspection Requests' : 'Inspection Requests'}
          </h3>
          <div style={{ display: 'flex', gap: 12, fontSize: 12 }}>
            <span style={{ color: '#f59e0b' }}>● {pendingCount} pending</span>
            <span style={{ color: '#22c55e' }}>● {confirmedCount} confirmed</span>
            <span style={{ color: 'var(--text-muted)' }}>{inspections.length} total</span>
          </div>
        </div>
      </div>

      {inspections.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)', fontSize: 14 }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🏠</div>
          No inspection requests yet.
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {visibleInspections.map(i => (
              <div key={i.id} style={{ border: '1px solid var(--border)', borderRadius: 2, overflow: 'hidden' }}>

                {/* Status bar */}
                <div style={{ background: statusBg(i.status), padding: '6px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: statusColor(i.status), fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    ● {i.status}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {new Date(i.created_at).toLocaleDateString()}
                  </span>
                </div>

                <div style={{ padding: 16 }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <img src={thumbnail(i.property_images)} alt=""
                      style={{ width: 56, height: 56, objectFit: 'cover', flexShrink: 0, borderRadius: 2 }} />

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 500, fontSize: 14, marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {i.property_title}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
                        {isAdmin ? `Agent listing · ` : ''}{i.property_location}
                      </div>

                      {/* Buyer / Agent info */}
                      <div style={{ background: 'var(--surface)', padding: '8px 12px', borderRadius: 2, marginBottom: 10, fontSize: 12 }}>
                        <div style={{ color: 'var(--text-muted)', marginBottom: 2 }}>
                          {isAdmin ? 'Buyer' : 'From'}:{' '}
                          <span style={{ color: 'var(--text)', fontWeight: 500 }}>
                            {i.buyer_name}
                          </span>
                          {' · '}
                          <a href={`mailto:${i.buyer_email}`} style={{ color: 'var(--gold)', textDecoration: 'none' }}>
                            {i.buyer_email}
                          </a>
                        </div>
                        {i.buyer_phone && (
                          <div style={{ color: 'var(--text-muted)' }}>
                            Phone:{' '}
                            <a href={`tel:${i.buyer_phone}`} style={{ color: 'var(--text)', textDecoration: 'none' }}>
                              {i.buyer_phone}
                            </a>
                          </div>
                        )}
                      </div>

                      {/* Date + Time + Payment */}
                      <div style={{ display: 'flex', gap: 12, fontSize: 12, flexWrap: 'wrap', marginBottom: 10 }}>
                        <span style={{ background: 'var(--surface)', padding: '4px 8px', borderRadius: 2 }}>
                          📅 {new Date(i.preferred_date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                        <span style={{ background: 'var(--surface)', padding: '4px 8px', borderRadius: 2 }}>
                          🕐 {i.preferred_time}
                        </span>
                        <span style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', padding: '4px 8px', borderRadius: 2, color: '#22c55e' }}>
                          ✓ UGX {i.amount?.toLocaleString() || '2,000'} paid
                        </span>
                      </div>

                      {i.message && (
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: 10 }}>
                          "{i.message}"
                        </div>
                      )}

                      {/* Actions */}
                      {!isAdmin && (
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          {i.status === 'pending' && (
                            <>
                              <button onClick={() => handleStatus(i.id, 'confirmed')}
                                style={{ background: '#22c55e', border: 'none', color: '#000', padding: '6px 16px', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", borderRadius: 2, letterSpacing: '0.05em' }}>
                                ✓ Confirm
                              </button>
                              <button onClick={() => handleStatus(i.id, 'cancelled')}
                                style={{ background: 'transparent', border: '1px solid rgba(239,68,68,0.4)', color: '#f87171', padding: '6px 16px', fontSize: 11, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", borderRadius: 2 }}>
                                ✕ Cancel
                              </button>
                            </>
                          )}
                          {i.status === 'confirmed' && (
                            <button onClick={() => handleStatus(i.id, 'completed')}
                              style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-muted)', padding: '6px 16px', fontSize: 11, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", borderRadius: 2 }}>
                              Mark Completed
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Show more / less toggle */}
          {hasMore && (
            <button
              onClick={() => setExpanded(!expanded)}
              style={{ width: '100%', marginTop: 16, background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-muted)', padding: '10px', fontSize: 12, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", borderRadius: 2, transition: 'all 0.2s' }}
            >
              {expanded
                ? '▲ Show less'
                : `▼ Show ${inspections.length - PREVIEW_COUNT} more inspection${inspections.length - PREVIEW_COUNT > 1 ? 's' : ''}`}
            </button>
          )}
        </>
      )}
    </div>
  );
}