"use client";

import { Icons } from '@/components/Icons';
import { AGENT_STATS } from '@/lib/constants';
import { Property } from '@/types';

interface AgentStat {
  label: string;
  value: string;
  change: string;
  up: boolean;
}

interface DashboardProps {
  properties: Property[];
  saved: number[];
}

export default function Dashboard({ properties, saved }: DashboardProps) {
  const savedProps = properties.filter(p => saved.includes(p.id));

  return (
    <div className="page-enter" style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px 120px' }}>
      <div style={{ marginBottom: 32 }}>
        <p style={{ fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 6 }}>Member Portal</p>
        <h2 className="font-serif" style={{ fontSize: 36, fontWeight: 300 }}>Your Dashboard</h2>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 1, marginBottom: 32, border: '1px solid var(--border)' }}>
        {(AGENT_STATS as AgentStat[]).map((s, i) => (
          <div key={s.label} className="stat-card fade-up" style={{ animationDelay: `${i * 0.1}s` }}>
            <div style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>{s.label}</div>
            <div className="font-serif" style={{ fontSize: 32, fontWeight: 300, color: 'var(--text)', lineHeight: 1 }}>{s.value}</div>
            <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: s.up ? '#22c55e' : '#ef4444' }}>
              <Icons.TrendUp />
              <span>{s.change} this month</span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Saved properties */}
        <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', padding: 24, gridColumn: 'span 2' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 className="font-serif" style={{ fontSize: 22, fontWeight: 400 }}>Saved Properties</h3>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{savedProps.length} properties</span>
          </div>
          {savedProps.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)', fontSize: 14 }}>
              <Icons.Heart filled={false} />
              <p style={{ marginTop: 8 }}>No saved properties yet.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 16 }}>
              {savedProps.map(p => (
                <div key={p.id} style={{ display: 'flex', gap: 12, padding: 12, border: '1px solid var(--border)', borderRadius: 2 }}>
                  <img src={p.image} alt="" style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 1, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 500, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.title}</div>
                    <div style={{ color: 'var(--gold)', fontWeight: 600, fontSize: 14, marginTop: 4 }}>${(p.price/1000000).toFixed(1)}M</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Active listings table */}
        <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', padding: 24, gridColumn: 'span 2' }}>
          <h3 className="font-serif" style={{ fontSize: 22, fontWeight: 400, marginBottom: 16 }}>Active Listings</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Property', 'Type', 'Price', 'Views', 'Rating', 'Status'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '8px 12px', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 500 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {properties.map(p => (
                  <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <img src={p.image} alt="" style={{ width: 36, height: 36, objectFit: 'cover' }} />
                        <div>
                          <div style={{ fontWeight: 500 }}>{p.title}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.agent}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '12px' }}>{p.type}</td>
                    <td style={{ padding: '12px', color: 'var(--gold)' }}>${(p.price/1000000).toFixed(1)}M</td>
                    <td style={{ padding: '12px' }}>{p.views.toLocaleString()}</td>
                    <td style={{ padding: '12px' }}>{p.rating}</td>
                    <td style={{ padding: '12px' }}><span style={{ color: '#22c55e' }}>Active</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}