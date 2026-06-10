"use client";

import { Icons } from '@/components/Icons';
import { useState } from "react";
import { Property, apiRequest, propertiesApi } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import SubmitPropertyForm from '@/components/SubmitPropertyForm';
import AdminUsersPanel from '@/components/AdminUsersPanel';
import EnquiriesPanel from '@/components/EnquiriesPanel';
import MyEnquiriesPanel from '@/components/MyEnquiriesPanel';

interface DashboardProps {
  properties: Property[];
  saved: string[];
  onPropertySubmitted: () => void;
}

export default function Dashboard({ properties, saved, onPropertySubmitted }: DashboardProps) {
  const { user, token } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [previewProp, setPreviewProp] = useState<Property | null>(null);

  const role = Number(user?.role);
  const isAdmin = role === 1;
  const isAgent = role === 2;
  const isBuyer = role === 3;

  const myListings = isAdmin
    ? properties
    : properties.filter(p => p.created_by === user?.id);

  const savedProps = properties.filter(p => saved.includes(p.id));

  const formatPrice = (amenities?: Record<string, unknown>) => {
    const price = amenities?.price as number | undefined;
    if (!price) return "POA";
    return price >= 1000000 ? `$${(price / 1000000).toFixed(1)}M` : `$${(price / 1000).toFixed(0)}K`;
  };

  const thumbnail = (images: string[]) =>
    images?.[0] || "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80";

  const handleSuccess = () => {
    setShowForm(false);
    onPropertySubmitted();
  };

  const approveProperty = async (id: string) => {
    if (!token) return;
    try {
      await apiRequest(`/properties/${id}/approve`, { method: 'PUT', token });
      setPreviewProp(null);
      onPropertySubmitted();
    } catch (err) {
      console.error(err);
    }
  };

  const toggleAvailability = async (id: string, availability: "available" | "taken") => {
    if (!token) return;
    try {
      await propertiesApi.toggleAvailability(id, availability, token);
      onPropertySubmitted();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteProperty = async (id: string) => {
    if (!token) return;
    const confirmed = window.confirm("Are you sure you want to delete this property? This cannot be undone.");
    if (!confirmed) return;
    try {
      await propertiesApi.delete(id, token);
      onPropertySubmitted();
    } catch (err) {
      console.error(err);
    }
  };

  const adminStats = [
    { label: "Total Listings", value: String(properties.length) },
    { label: "Approved", value: String(properties.filter(p => p.status === 'approved').length) },
    { label: "Pending Review", value: String(properties.filter(p => p.status === 'pending').length) },
  ];

  const agentStats = [
    { label: "My Listings", value: String(myListings.length) },
    { label: "Approved", value: String(myListings.filter(p => p.status === 'approved').length) },
    { label: "Pending", value: String(myListings.filter(p => p.status === 'pending').length) },
  ];

  const buyerStats = [
    { label: "Saved Properties", value: String(savedProps.length) },
  ];

  const stats = isAdmin ? adminStats : isAgent ? agentStats : buyerStats;

  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradePlan, setUpgradePlan] = useState<'monthly' | 'yearly'>('monthly');
  const [upgradePhone, setUpgradePhone] = useState('');
  const [upgradeProvider, setUpgradeProvider] = useState('mtn');
  const [upgradeLoading, setUpgradeLoading] = useState(false);
  const [upgradeError, setUpgradeError] = useState('');
  const [upgradeSuccess, setUpgradeSuccess] = useState(false);

  const handleUpgrade = (plan: 'monthly' | 'yearly') => {
    setUpgradePlan(plan);
    setShowUpgradeModal(true);
  };

  const submitUpgrade = async () => {
    if (!token || !upgradePhone) return;
    setUpgradeLoading(true);
    setUpgradeError('');
    try {
      const res = await apiRequest<{ message: string }>('/payments/premium', {
        method: 'POST',
        body: { plan: upgradePlan, phone_number: upgradePhone, provider: upgradeProvider },
        token,
      });
      setUpgradeSuccess(true);
      setTimeout(() => {
        setShowUpgradeModal(false);
        setUpgradeSuccess(false);
        onPropertySubmitted(); // refresh
      }, 2000);
    } catch (err: unknown) {
      setUpgradeError(err instanceof Error ? err.message : 'Payment failed');
    } finally {
      setUpgradeLoading(false);
    }
  };

  return (
    <div className="page-enter" style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px 120px' }}>

      {/* Submit Form Modal */}
      {showForm && (
        <SubmitPropertyForm onSuccess={handleSuccess} onCancel={() => setShowForm(false)} />
      )}

      {/* Property Preview Modal */}
      {previewProp && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div className="modal-card" style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', width: '100%', maxWidth: 640, maxHeight: '90vh', overflowY: 'auto', padding: 32 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <p style={{ fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--gold)' }}>Property Preview</p>
              <button onClick={() => setPreviewProp(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 20 }}>✕</button>
            </div>
            <img src={thumbnail(previewProp.images)} alt={previewProp.title} style={{ width: '100%', height: 220, objectFit: 'cover', marginBottom: 20 }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <h2 className="font-serif" style={{ fontSize: 26, fontWeight: 300, color: 'var(--text)' }}>{previewProp.title}</h2>
              <span style={{ padding: '4px 10px', fontSize: 11, borderRadius: 2, fontWeight: 600, background: previewProp.status === 'approved' ? 'rgba(34,197,94,0.15)' : 'rgba(245,158,11,0.15)', color: previewProp.status === 'approved' ? '#22c55e' : '#f59e0b', textTransform: 'capitalize', whiteSpace: 'nowrap', marginLeft: 12 }}>
                {previewProp.status}
              </span>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 16 }}>
              📍 {previewProp.address || previewProp.location}
            </p>
            <div style={{ display: 'flex', gap: 24, padding: '16px 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', marginBottom: 16, flexWrap: 'wrap' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 600, color: 'var(--text)' }}>{previewProp.bedrooms ?? '—'}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Beds</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 600, color: 'var(--text)' }}>{previewProp.bathrooms ?? '—'}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Baths</div>
              </div>
              {previewProp.square_footage && (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 600, color: 'var(--text)' }}>{previewProp.square_footage.toLocaleString()}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Sqft</div>
                </div>
              )}
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 600, color: 'var(--gold)' }}>{formatPrice(previewProp.amenities)}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Price</div>
              </div>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.7, marginBottom: 24 }}>
              {previewProp.description}
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => setPreviewProp(null)} style={{ flex: 1, background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-muted)', padding: '12px', fontSize: 12, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
                Close
              </button>
              {isAdmin && previewProp.status === 'pending' && (
                <button onClick={() => approveProperty(previewProp.id)} style={{ flex: 2, background: '#22c55e', border: 'none', color: 'white', padding: '12px', fontSize: 12, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
                  ✓ Approve Property
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── HEADER ── */}
      <div className="dashboard-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 32 }}>
        <div>
          <p style={{ fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 6 }}>
            {isAdmin ? 'Admin Portal' : isAgent ? 'Agent Portal' : 'My Account'}
          </p>
          <h2 className="font-serif" style={{ fontSize: 36, fontWeight: 300 }}>
            Welcome, {user?.first_name || 'User'}
          </h2>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
            {isAdmin ? 'You have full platform access' : isAgent ? 'Manage your property listings' : 'Browse and save your favourite properties'}
          </p>
        </div>
        {isAgent && (
          <button onClick={() => setShowForm(true)} style={{ background: 'var(--gold)', border: 'none', color: '#0a0a0b', padding: '12px 24px', fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", whiteSpace: 'nowrap' }}>
            + List a Property
          </button>
        )}
      </div>

      {/* ── STATS ── */}
      <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: `repeat(${stats.length}, 1fr)`, gap: 1, marginBottom: 32, border: '1px solid var(--border)' }}>
        {stats.map((s, i) => (
          <div key={s.label} className="stat-card fade-up" style={{ animationDelay: `${i * 0.1}s` }}>
            <div style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>{s.label}</div>
            <div className="font-serif" style={{ fontSize: 32, fontWeight: 300, color: 'var(--text)', lineHeight: 1 }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gap: 24 }}>

        {/* ── SAVED PROPERTIES (buyers + agents) ── */}
        {(isBuyer || isAgent) && (
          <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 className="font-serif" style={{ fontSize: 22, fontWeight: 400 }}>Saved Properties</h3>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{savedProps.length} saved</span>
            </div>
            {savedProps.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)', fontSize: 14 }}>
                <Icons.Heart filled={false} />
                <p style={{ marginTop: 8 }}>No saved properties yet. Browse listings and click the heart icon to save.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 16 }}>
                {savedProps.map(p => (
                  <div
                    key={p.id}
                    onClick={() => setPreviewProp(p)}
                    style={{ display: 'flex', gap: 12, padding: 12, border: '1px solid var(--border)', borderRadius: 2, cursor: 'pointer', transition: 'border-color 0.2s', }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--gold)')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                  >
                    <img src={thumbnail(p.images)} alt="" style={{ width: 64, height: 64, objectFit: 'cover', flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 500, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.title}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{p.location}</div>
                      <div style={{ color: 'var(--gold)', fontWeight: 600, fontSize: 14, marginTop: 4 }}>{formatPrice(p.amenities)}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>Click to view details →</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Free listing limit warning */}
        {isAgent && (() => {
          const activeCount = myListings.filter(p => !p.status?.includes('deleted')).length;
          const atLimit = activeCount >= 3;
          if (activeCount >= 2) {
            return (
              <div style={{ background: atLimit ? 'rgba(239,68,68,0.08)' : 'rgba(245,158,11,0.08)', border: `1px solid ${atLimit ? 'rgba(239,68,68,0.3)' : 'rgba(245,158,11,0.3)'}`, padding: '20px', borderRadius: 2 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                  <div>
                    <div style={{ color: atLimit ? '#f87171' : '#f59e0b', fontWeight: 600, fontSize: 14, marginBottom: 6 }}>
                      {atLimit ? '🚫 Free listing limit reached' : '⚠️ Approaching your free limit'}
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 4 }}>
                      {atLimit
                        ? 'You have used all 3 free listings. Upgrade to premium for unlimited listings.'
                        : `You have used ${activeCount} of 3 free listings.`}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      Premium: <span style={{ color: '#a855f7' }}>UGX 50,000/month</span> · <span style={{ color: '#a855f7' }}>UGX 480,000/year</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button
                      onClick={() => handleUpgrade('monthly')}
                      style={{ background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.3)', color: '#a855f7', padding: '8px 16px', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", borderRadius: 2, letterSpacing: '0.05em' }}>
                      ⭐ Monthly — UGX 50k
                    </button>
                    <button
                      onClick={() => handleUpgrade('yearly')}
                      style={{ background: '#a855f7', border: 'none', color: 'white', padding: '8px 16px', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", borderRadius: 2, letterSpacing: '0.05em' }}>
                      ⭐ Yearly — UGX 480k
                    </button>
                  </div>
                </div>
              </div>
            );
          }
          return null;
        })()}

        {/* ── LISTINGS TABLE (agents + admins) ── */}
        {(isAgent || isAdmin) && (
          <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', padding: 24 }}>
            <h3 className="font-serif" style={{ fontSize: 22, fontWeight: 400, marginBottom: 16 }}>
              {isAdmin ? 'All Listings' : 'My Listings'}
            </h3>
            {myListings.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)', fontSize: 14 }}>
                {isAgent
                  ? <><span>No listings yet. </span><span style={{ color: 'var(--gold)', cursor: 'pointer' }} onClick={() => setShowForm(true)}>Submit your first property →</span></>
                  : 'No properties have been submitted yet.'
                }
              </div>
            ) : (
              <div className="table-wrapper" style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                      {['Property', 'Location', 'Price', 'Beds', 'Status', 'Actions'].map(h => (
                        <th key={h} style={{ textAlign: 'left', padding: '8px 12px', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 500 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {myListings.map(p => (
                      <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>

                        <td style={{ padding: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <img src={thumbnail(p.images)} alt="" style={{ width: 36, height: 36, objectFit: 'cover', flexShrink: 0 }} />
                            <div style={{ fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 160 }}>{p.title}</div>
                          </div>
                        </td>

                        <td style={{ padding: '12px', color: 'var(--text-muted)' }}>{p.location}</td>
                        <td style={{ padding: '12px', color: 'var(--gold)' }}>{formatPrice(p.amenities)}</td>
                        <td style={{ padding: '12px' }}>{p.bedrooms ?? '—'}</td>

                        <td style={{ padding: '12px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <span style={{ color: p.status === 'approved' ? '#22c55e' : p.status === 'pending' ? '#f59e0b' : 'var(--text-muted)', textTransform: 'capitalize' }}>
                              {p.status || 'Unknown'}
                            </span>
                            {p.status === 'approved' && (
                              <span style={{ fontSize: 10, color: (p.amenities?.availability as string) === 'taken' ? '#f87171' : '#22c55e' }}>
                                {(p.amenities?.availability as string) === 'taken' ? 'Taken' : 'Available'}
                              </span>
                            )}
                          </div>
                        </td>

                        <td style={{ padding: '12px' }}>
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>

                            <button onClick={() => setPreviewProp(p)}
                              style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-muted)', padding: '4px 10px', fontSize: 10, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", borderRadius: 2 }}>
                              View
                            </button>

                            {isAdmin && p.status === 'pending' && (
                              <button onClick={() => approveProperty(p.id)}
                                style={{ background: '#22c55e', border: 'none', color: 'white', padding: '4px 10px', fontSize: 10, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", borderRadius: 2 }}>
                                Approve
                              </button>
                            )}

                            {(isAdmin || p.created_by === user?.id) && p.status === 'approved' && (
                              <button
                                onClick={() => toggleAvailability(
                                  p.id,
                                  (p.amenities?.availability as string) === 'taken' ? 'available' : 'taken'
                                )}
                                style={{
                                  background: (p.amenities?.availability as string) === 'taken' ? 'rgba(239,68,68,0.15)' : 'rgba(34,197,94,0.15)',
                                  border: 'none',
                                  color: (p.amenities?.availability as string) === 'taken' ? '#f87171' : '#22c55e',
                                  padding: '4px 10px', fontSize: 10, cursor: 'pointer',
                                  fontFamily: "'DM Sans', sans-serif", borderRadius: 2,
                                }}>
                                {(p.amenities?.availability as string) === 'taken' ? 'Mark Available' : 'Mark Taken'}
                              </button>
                            )}

                            {(isAdmin || p.created_by === user?.id) && (
                              <button onClick={() => deleteProperty(p.id)}
                                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', padding: '4px 10px', fontSize: 10, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", borderRadius: 2 }}>
                                Delete
                              </button>
                            )}

                          </div>
                        </td>

                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Upgrade Modal */}
        {showUpgradeModal && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
            <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', width: '100%', maxWidth: 440, padding: 32 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h3 className="font-serif" style={{ fontSize: 24, fontWeight: 300 }}>Upgrade to Premium</h3>
                <button onClick={() => setShowUpgradeModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 20 }}>✕</button>
              </div>

              {upgradeSuccess ? (
                <div style={{ textAlign: 'center', padding: '24px 0' }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
                  <div style={{ color: '#22c55e', fontSize: 16, fontWeight: 500 }}>Premium Activated!</div>
                </div>
              ) : (
                <>
                  {/* Plan summary */}
                  <div style={{ background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.2)', padding: 16, marginBottom: 20, borderRadius: 2 }}>
                    <div style={{ color: '#a855f7', fontWeight: 600, marginBottom: 4 }}>
                      {upgradePlan === 'yearly' ? '⭐ Yearly Plan' : '⭐ Monthly Plan'}
                    </div>
                    <div style={{ fontSize: 24, color: 'var(--text)', fontFamily: 'Cormorant Garamond, serif' }}>
                      UGX {upgradePlan === 'yearly' ? '480,000' : '50,000'}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                      Unlimited property listings · Verified agent badge eligibility
                    </div>
                  </div>

                  {upgradeError && (
                    <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', padding: '10px 14px', fontSize: 13, marginBottom: 16 }}>
                      {upgradeError}
                    </div>
                  )}

                  {/* Phone number */}
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>
                      Mobile Money Number
                    </label>
                    <input
                      type="tel"
                      value={upgradePhone}
                      onChange={e => setUpgradePhone(e.target.value)}
                      placeholder="+256 700 000 000"
                      style={{ width: '100%', background: 'var(--surface)', border: '1px solid var(--border)', padding: '10px 14px', color: 'var(--text)', fontSize: 14, outline: 'none', fontFamily: "'DM Sans', sans-serif", boxSizing: 'border-box' }}
                    />
                  </div>

                  {/* Provider */}
                  <div style={{ marginBottom: 24 }}>
                    <label style={{ display: 'block', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>
                      Payment Provider
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                      {[
                        { id: 'mtn', label: 'MTN MoMo', color: '#f59e0b' },
                        { id: 'airtel', label: 'Airtel Money', color: '#ef4444' },
                        { id: 'mpesa', label: 'M-Pesa', color: '#22c55e' },
                      ].map(p => (
                        <div
                          key={p.id}
                          onClick={() => setUpgradeProvider(p.id)}
                          style={{ padding: '10px 8px', textAlign: 'center', border: `1px solid ${upgradeProvider === p.id ? p.color : 'var(--border)'}`, background: upgradeProvider === p.id ? `${p.color}15` : 'transparent', cursor: 'pointer', borderRadius: 2, transition: 'all 0.15s' }}
                        >
                          <div style={{ fontSize: 11, fontWeight: 600, color: upgradeProvider === p.id ? p.color : 'var(--text-muted)' }}>
                            {p.label}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={submitUpgrade}
                    disabled={upgradeLoading || !upgradePhone}
                    style={{ width: '100%', background: upgradeLoading || !upgradePhone ? 'rgba(168,85,247,0.3)' : '#a855f7', border: 'none', color: 'white', padding: '14px', fontSize: 12, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: upgradeLoading || !upgradePhone ? 'not-allowed' : 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
                    {upgradeLoading ? 'Processing...' : `Pay UGX ${upgradePlan === 'yearly' ? '480,000' : '50,000'}`}
                  </button>

                  <p style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', marginTop: 12 }}>
                    In development mode, premium is activated instantly for testing.
                  </p>
                </>
              )}
            </div>
          </div>
        )}

        {/* ── ENQUIRIES — agent sees incoming ── */}
        {isAgent && <EnquiriesPanel />}

        {/* ── MY ENQUIRIES — buyer sees sent enquiries ── */}
        {isBuyer && <MyEnquiriesPanel />}

        {/* ── ADMIN: enquiries + user management ── */}
        {isAdmin && <EnquiriesPanel />}
        {isAdmin && <AdminUsersPanel />}

      </div>
    </div>
  );
}