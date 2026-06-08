"use client";

import { useState, useEffect, useCallback } from "react";
import { enquiriesApi, Enquiry } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export default function EnquiriesPanel() {
  const { token } = useAuth();
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Enquiry | null>(null);
  const [reply, setReply] = useState('');
  const [replying, setReplying] = useState(false);
  const [error, setError] = useState('');

  const fetchEnquiries = useCallback(async () => {
    if (!token) return;
    try {
      const data = await enquiriesApi.getForAgent(token);
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

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selected || !reply.trim()) return;
    setReplying(true);
    setError('');
    try {
      await enquiriesApi.reply(selected.id, reply, token);
      setReply('');
      setSelected(null);
      fetchEnquiries();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to send reply');
    } finally {
      setReplying(false);
    }
  };

  const handleClose = async (id: string) => {
    if (!token) return;
    try {
      await enquiriesApi.updateStatus(id, 'closed', token);
      fetchEnquiries();
    } catch (err) {
      console.error(err);
    }
  };

  const statusColor = (status: string) => {
    if (status === 'responded') return '#22c55e';
    if (status === 'closed') return 'var(--text-muted)';
    return '#f59e0b';
  };

  const thumbnail = (images?: string[]) =>
    images?.[0] || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80';

  if (loading) return (
    <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
      Loading enquiries...
    </div>
  );

  return (
    <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', padding: 24 }}>

      {/* Reply Modal */}
      {selected && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', width: '100%', maxWidth: 520, padding: 32 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 className="font-serif" style={{ fontSize: 20, fontWeight: 400 }}>Reply to Enquiry</h3>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 20 }}>✕</button>
            </div>

            {/* Property */}
            <div style={{ display: 'flex', gap: 12, padding: 12, background: 'var(--surface)', marginBottom: 16, borderRadius: 2 }}>
              <img src={thumbnail(selected.property_images)} alt="" style={{ width: 48, height: 48, objectFit: 'cover', flexShrink: 0 }} />
              <div>
                <div style={{ fontWeight: 500, fontSize: 13 }}>{selected.property_title}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{selected.property_location}</div>
              </div>
            </div>

            {/* Buyer info */}
            <div style={{ marginBottom: 16, fontSize: 13 }}>
              <div style={{ color: 'var(--text-muted)', marginBottom: 4 }}>
                From: <span style={{ color: 'var(--text)' }}>{selected.buyer_name}</span>
              </div>
              <div style={{ color: 'var(--text-muted)', marginBottom: 4 }}>
                Email: <span style={{ color: 'var(--gold)' }}>{selected.buyer_email}</span>
              </div>
              {selected.buyer_phone && (
                <div style={{ color: 'var(--text-muted)' }}>
                  Phone: <span style={{ color: 'var(--text)' }}>{selected.buyer_phone}</span>
                </div>
              )}
            </div>

            {/* Original message */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '12px 14px', marginBottom: 16, borderRadius: 2 }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Their message</div>
              <p style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.6 }}>{selected.message}</p>
            </div>

            {/* Previous reply */}
            {selected.reply && (
              <div style={{ background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.2)', padding: '12px 14px', marginBottom: 16, borderRadius: 2 }}>
                <div style={{ fontSize: 11, color: '#22c55e', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Your previous reply</div>
                <p style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.6 }}>{selected.reply}</p>
              </div>
            )}

            {error && (
              <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', padding: '8px 12px', fontSize: 12, marginBottom: 12 }}>
                {error}
              </div>
            )}

            <form onSubmit={handleReply} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <textarea
                value={reply}
                onChange={e => setReply(e.target.value)}
                required
                rows={4}
                placeholder="Write your reply..."
                style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', padding: '10px 12px', fontSize: 13, resize: 'vertical', fontFamily: "'DM Sans', sans-serif", outline: 'none' }}
              />
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" onClick={() => setSelected(null)}
                  style={{ flex: 1, background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-muted)', padding: '10px', fontSize: 11, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
                  Cancel
                </button>
                <button type="submit" disabled={replying}
                  style={{ flex: 2, background: replying ? 'rgba(201,168,76,0.5)' : 'var(--gold)', border: 'none', color: '#0a0a0b', padding: '10px', fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: replying ? 'not-allowed' : 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
                  {replying ? 'Sending...' : 'Send Reply'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h3 className="font-serif" style={{ fontSize: 22, fontWeight: 400 }}>Enquiries</h3>
        <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--text-muted)' }}>
          <span style={{ color: '#f59e0b' }}>● {enquiries.filter(e => e.status === 'pending').length} pending</span>
          <span style={{ color: '#22c55e' }}>● {enquiries.filter(e => e.status === 'responded').length} responded</span>
        </div>
      </div>

      {enquiries.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)', fontSize: 14 }}>
          No enquiries yet. They will appear here when buyers contact you.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {enquiries.map(e => (
            <div key={e.id} style={{ border: '1px solid var(--border)', padding: 16, borderRadius: 2, opacity: e.status === 'closed' ? 0.6 : 1 }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <img src={thumbnail(e.property_images)} alt="" style={{ width: 48, height: 48, objectFit: 'cover', flexShrink: 0, borderRadius: 2 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4, flexWrap: 'wrap', gap: 8 }}>
                    <div>
                      <div style={{ fontWeight: 500, fontSize: 13 }}>{e.property_title}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        From: {e.buyer_name} · {e.buyer_email}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 11, color: statusColor(e.status), textTransform: 'capitalize' }}>
                        ● {e.status}
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {new Date(e.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 8 }}>
                    {e.message}
                  </p>
                  {e.reply && (
                    <div style={{ background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.15)', padding: '8px 10px', borderRadius: 2, fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
                      <span style={{ color: '#22c55e', fontWeight: 500 }}>Your reply: </span>{e.reply}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 8 }}>
                    {e.status !== 'closed' && (
                      <button onClick={() => { setSelected(e); setReply(''); }}
                        style={{ background: 'var(--gold)', border: 'none', color: '#0a0a0b', padding: '5px 12px', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", borderRadius: 2 }}>
                        {e.reply ? 'Reply Again' : 'Reply'}
                      </button>
                    )}
                    {e.status !== 'closed' && (
                      <button onClick={() => handleClose(e.id)}
                        style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-muted)', padding: '5px 12px', fontSize: 11, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", borderRadius: 2 }}>
                        Close
                      </button>
                    )}
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