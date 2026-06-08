"use client";

import { useState, useEffect, useCallback } from "react";
import { enquiriesApi, Enquiry } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export default function MyEnquiriesPanel() {
  const { token } = useAuth();
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEnquiries = useCallback(async () => {
    if (!token) return;
    try {
      const data = await enquiriesApi.getMine(token);
      setEnquiries(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
  const load = async () => { await fetchEnquiries(); };
  load();
}, [fetchEnquiries]);

  const statusColor = (status: string) => {
    if (status === 'responded') return '#22c55e';
    if (status === 'closed') return 'var(--text-muted)';
    return '#f59e0b';
  };

  const thumbnail = (images?: string[]) =>
    images?.[0] || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80';

  if (loading) return (
    <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
      Loading your enquiries...
    </div>
  );

  return (
    <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h3 className="font-serif" style={{ fontSize: 22, fontWeight: 400 }}>My Enquiries</h3>
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{enquiries.length} sent</span>
      </div>

      {enquiries.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)', fontSize: 14 }}>
          You haven&apos;t sent any enquiries yet. Browse listings and contact an agent!
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {enquiries.map(e => (
            <div key={e.id} style={{ border: '1px solid var(--border)', padding: 16, borderRadius: 2 }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <img src={thumbnail(e.property_images)} alt="" style={{ width: 56, height: 56, objectFit: 'cover', flexShrink: 0, borderRadius: 2 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6, flexWrap: 'wrap', gap: 8 }}>
                    <div>
                      <div style={{ fontWeight: 500, fontSize: 14 }}>{e.property_title}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>📍 {e.property_location}</div>
                    </div>
                    <span style={{ fontSize: 11, color: statusColor(e.status), textTransform: 'capitalize' }}>
                      ● {e.status}
                    </span>
                  </div>

                  {/* Your message */}
                  <div style={{ background: 'var(--surface)', padding: '8px 10px', borderRadius: 2, fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>
                    <span style={{ color: 'var(--text)', fontWeight: 500 }}>You: </span>{e.message}
                  </div>

                  {/* Agent reply */}
                  {e.reply ? (
                    <div style={{ background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.15)', padding: '8px 10px', borderRadius: 2, fontSize: 13, color: 'var(--text-muted)' }}>
                      <span style={{ color: '#22c55e', fontWeight: 500 }}>Agent replied: </span>{e.reply}
                    </div>
                  ) : (
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                      Awaiting agent reply...
                    </div>
                  )}

                  {/* Agent contact info — shown after they reply */}
                  {e.reply && e.agent_email && (
                    <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-muted)', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                      <span>📧 <a href={`mailto:${e.agent_email}`} style={{ color: 'var(--gold)', textDecoration: 'none' }}>{e.agent_email}</a></span>
                      {e.agent_phone && (
                        <span>📞 <a href={`tel:${e.agent_phone}`} style={{ color: 'var(--gold)', textDecoration: 'none' }}>{e.agent_phone}</a></span>
                      )}
                    </div>
                  )}

                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>
                    Sent {new Date(e.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}