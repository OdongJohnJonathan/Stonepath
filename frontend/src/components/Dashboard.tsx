"use client";

import { Icons } from '@/components/Icons';
import { useState } from "react";
import { Property } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import SubmitPropertyForm from '@/components/SubmitPropertyForm';

interface DashboardProps {
  properties: Property[];
  saved: string[];
  onPropertySubmitted: () => void;
}

export default function Dashboard({ properties, saved, onPropertySubmitted }: DashboardProps) {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);

  const savedProps = properties.filter(p => saved.includes(p.id));

  const stats = [
    { label: "Total Listings", value: String(properties.length), change: "+0", up: true },
    { label: "Saved Properties", value: String(savedProps.length), change: "+0", up: true },
    { label: "Active", value: String(properties.filter(p => p.status === 'approved').length), change: "+0", up: true },
    { label: "Pending", value: String(properties.filter(p => p.status === 'pending').length), change: "+0", up: false },
  ];

  const formatPrice = (amenities?: Record<string, unknown>) => {
    const price = amenities?.price as number | undefined;
    if (!price) return "POA";
    return price >= 1000000 ? `$${(price / 1000000).toFixed(1)}M` : `$${(price / 1000).toFixed(0)}K`;
  };

  const thumbnail = (images: string[]) =>
    images?.[0] || "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80";

  const handleSuccess = () => {
    setShowForm(false);
    onPropertySubmitted(); // refresh properties list in parent
  };

  return (
    <div className="page-enter" style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px 120px' }}>

      {showForm && (
        <SubmitPropertyForm
          onSuccess={handleSuccess}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 32 }}>
        <div>
          <p style={{ fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 6 }}>Member Portal</p>
          <h2 className="font-serif" style={{ fontSize: 36, fontWeight: 300 }}>
            Welcome, {user?.first_name || 'Agent'}
          </h2>
        </div>
        <button
          onClick={() => setShowForm(true)}
          style={{
            background: 'var(--gold)', border: 'none', color: '#0a0a0b',
            padding: '12px 24px', fontSize: 11, fontWeight: 600,
            letterSpacing: '0.1em', textTransform: 'uppercase',
            cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
          }}
        >
          + List a Property
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 1, marginBottom: 32, border: '1px solid var(--border)' }}>
        {stats.map((s, i) => (
          <div key={s.label} className="stat-card fade-up" style={{ animationDelay: `${i * 0.1}s` }}>
            <div style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>{s.label}</div>
            <div className="font-serif" style={{ fontSize: 32, fontWeight: 300, color: 'var(--text)', lineHeight: 1 }}>{s.value}</div>
            <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: s.up ? '#22c55e' : '#f59e0b' }}>
              <Icons.TrendUp />
              <span>{s.change} this month</span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gap: 24 }}>
        {/* Saved Properties */}
        <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 className="font-serif" style={{ fontSize: 22, fontWeight: 400 }}>Saved Properties</h3>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{savedProps.length} properties</span>
          </div>
          {savedProps.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)', fontSize: 14 }}>
              <Icons.Heart filled={false} />
              <p style={{ marginTop: 8 }}>No saved properties yet. Browse listings and click the heart icon to save.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 16 }}>
              {savedProps.map(p => (
                <div key={p.id} style={{ display: 'flex', gap: 12, padding: 12, border: '1px solid var(--border)', borderRadius: 2 }}>
                  <img src={thumbnail(p.images)} alt="" style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 1, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 500, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{p.location}</div>
                    <div style={{ color: 'var(--gold)', fontWeight: 600, fontSize: 14, marginTop: 4 }}>{formatPrice(p.amenities)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* All Listings Table */}
        <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', padding: 24 }}>
          <h3 className="font-serif" style={{ fontSize: 22, fontWeight: 400, marginBottom: 16 }}>All Listings</h3>
          {properties.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)', fontSize: 14 }}>
              No listings yet.{" "}
              <span style={{ color: 'var(--gold)', cursor: 'pointer' }} onClick={() => setShowForm(true)}>
                Submit your first property →
              </span>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Property', 'Location', 'Price', 'Bedrooms', 'Status'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '8px 12px', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 500 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {properties.map(p => (
                    <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <img src={thumbnail(p.images)} alt="" style={{ width: 36, height: 36, objectFit: 'cover', flexShrink: 0 }} />
                          <div style={{ fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 180 }}>{p.title}</div>
                        </div>
                      </td>
                      <td style={{ padding: '12px', color: 'var(--text-muted)' }}>{p.location}</td>
                      <td style={{ padding: '12px', color: 'var(--gold)' }}>{formatPrice(p.amenities)}</td>
                      <td style={{ padding: '12px' }}>{p.bedrooms ?? '—'}</td>
                      <td style={{ padding: '12px' }}>
                        <span style={{ color: p.status === 'approved' ? '#22c55e' : p.status === 'pending' ? '#f59e0b' : 'var(--text-muted)', textTransform: 'capitalize' }}>
                          {p.status || 'Unknown'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}