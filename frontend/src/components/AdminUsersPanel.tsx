"use client";

import { useState, useEffect, useCallback } from "react";
import { adminApi, AdminUser, propertiesApi, Property } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export default function AdminUsersPanel() {
  const { token } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [featuredDays, setFeaturedDays] = useState<Record<string, number>>({});

  const roleLabels: Record<number, string> = {
    1: "User",
    2: "Agent",
    3: "Moderator",
    4: "Super Admin",
  };

  const isAdminRole = (role: number) => role === 3 || role === 4;

  const fetchData = useCallback(async () => {
    if (!token) return;
    try {
      const [usersData, propsData] = await Promise.all([
        adminApi.getUsers(token),
        propertiesApi.getAllForDashboard(token),
      ]);
      setUsers(usersData);
      setProperties(propsData);
    } catch (err) {
      setError("Failed to load data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    const load = async () => { await fetchData(); };
    load();
  }, [fetchData]);

  // Cycles a user between User <-> Agent. Moderator/Super Admin are managed
  // separately (deliberately, not via a casual toggle) since they're privileged roles.
  const handleChangeRole = async (id: string, currentRole: number) => {
    if (!token) return;
    const newRole = currentRole === 2 ? 1 : 2;
    try {
      await adminApi.changeRole(id, newRole, token);
      fetchData();
    } catch (err) { console.error(err); }
  };

  const handleToggleActive = async (id: string) => {
    if (!token) return;
    try {
      await adminApi.toggleActive(id, token);
      fetchData();
    } catch (err) { console.error(err); }
  };

  const handleVerify = async (id: string) => {
    if (!token) return;
    try {
      await adminApi.verifyUser(id, token);
      fetchData();
    } catch (err) { console.error(err); }
  };

  const handleToggleAgentVerified = async (id: string) => {
    if (!token) return;
    try {
      await adminApi.toggleAgentVerified(id, token);
      fetchData();
    } catch (err) { console.error(err); }
  };

  const handleTogglePremium = async (id: string) => {
    if (!token) return;
    try {
      await adminApi.togglePremium(id, token);
      fetchData();
    } catch (err) { console.error(err); }
  };

  const handleFeature = async (propId: string) => {
    if (!token) return;
    const days = featuredDays[propId] || 30;
    try {
      await propertiesApi.feature(propId, days, token);
      fetchData();
    } catch (err) { console.error(err); }
  };

  const handleUnfeature = async (propId: string) => {
    if (!token) return;
    try {
      await propertiesApi.unfeature(propId, token);
      fetchData();
    } catch (err) { console.error(err); }
  };

  if (loading) return (
    <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Loading...</div>
  );

  if (error) return (
    <div style={{ textAlign: 'center', padding: 40, color: '#f87171' }}>{error}</div>
  );

  const approvedProps = properties.filter(p => p.status === 'approved');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* ── FEATURED LISTINGS PANEL ── */}
      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h3 className="font-serif" style={{ fontSize: 22, fontWeight: 400 }}>Featured Listings</h3>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
              Featured properties appear at the top of all listings
            </p>
          </div>
          <span style={{ fontSize: 12, color: 'var(--gold)' }}>
            {approvedProps.filter(p => p.is_featured).length} featured
          </span>
        </div>

        {approvedProps.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: 14 }}>
            No approved properties yet.
          </div>
        ) : (
          <div className="table-wrapper" style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Property', 'Location', 'Status', 'Featured Until', 'Days', 'Action'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '8px 12px', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 500 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {approvedProps.map(p => (
                  <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {p.is_featured && <span style={{ color: 'var(--gold)', fontSize: 14 }}>⭐</span>}
                        <span style={{ fontWeight: 500, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px', color: 'var(--text-muted)' }}>{p.location}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ color: p.is_featured ? 'var(--gold)' : 'var(--text-muted)', fontSize: 12 }}>
                        {p.is_featured ? '⭐ Featured' : 'Normal'}
                      </span>
                    </td>
                    <td style={{ padding: '12px', color: 'var(--text-muted)', fontSize: 12 }}>
                      {p.featured_until
                        ? new Date(p.featured_until).toLocaleDateString()
                        : '—'}
                    </td>
                    <td style={{ padding: '12px' }}>
                      {!p.is_featured && (
                        <select
                          value={featuredDays[p.id] || 30}
                          onChange={e => setFeaturedDays(d => ({ ...d, [p.id]: Number(e.target.value) }))}
                          style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', padding: '4px 8px', fontSize: 12, fontFamily: "'DM Sans', sans-serif" }}
                        >
                          <option value={7}>7 days</option>
                          <option value={14}>14 days</option>
                          <option value={30}>30 days</option>
                          <option value={60}>60 days</option>
                          <option value={90}>90 days</option>
                        </select>
                      )}
                    </td>
                    <td style={{ padding: '12px' }}>
                      {p.is_featured ? (
                        <button onClick={() => handleUnfeature(p.id)}
                          style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', padding: '4px 10px', fontSize: 10, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", borderRadius: 2 }}>
                          Remove Feature
                        </button>
                      ) : (
                        <button onClick={() => handleFeature(p.id)}
                          style={{ background: 'rgba(201,168,76,0.15)', border: 'none', color: 'var(--gold)', padding: '4px 10px', fontSize: 10, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", borderRadius: 2 }}>
                          ⭐ Feature
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── USER MANAGEMENT PANEL ── */}
      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 className="font-serif" style={{ fontSize: 22, fontWeight: 400 }}>User Management</h3>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{users.length} users total</span>
        </div>

        <div className="table-wrapper" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Name', 'Email', 'Role', 'Listings', 'Badges', 'Status', 'Actions'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '8px 12px', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 500 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} style={{ borderBottom: '1px solid var(--border)', opacity: u.is_active ? 1 : 0.5 }}>

                  <td style={{ padding: '12px', fontWeight: 500 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {u.is_agent_verified && <span title="Verified Agent" style={{ color: 'var(--gold)' }}>✓</span>}
                      {u.first_name} {u.last_name}
                    </div>
                  </td>

                  <td style={{ padding: '12px', color: 'var(--text-muted)', fontSize: 12 }}>{u.email}</td>

                  <td style={{ padding: '12px' }}>
                    <span style={{
                      padding: '2px 8px', borderRadius: 2, fontSize: 11,
                      background: u.role === 4 ? 'rgba(239,68,68,0.15)' : u.role === 3 ? 'rgba(201,168,76,0.15)' : u.role === 2 ? 'rgba(59,130,246,0.15)' : 'rgba(107,114,128,0.15)',
                      color: u.role === 4 ? '#f87171' : u.role === 3 ? '#c9a84c' : u.role === 2 ? '#60a5fa' : 'var(--text-muted)',
                    }}>
                      {roleLabels[u.role] || 'Unknown'}
                    </span>
                  </td>

                  <td style={{ padding: '12px', fontSize: 12, color: 'var(--text-muted)' }}>
                    {u.role === 2 ? (
                      <span style={{ color: u.listing_count >= 3 && !u.is_premium ? '#f59e0b' : 'var(--text)' }}>
                        {u.listing_count}/3 {u.is_premium ? '(Premium)' : ''}
                      </span>
                    ) : '—'}
                  </td>

                  <td style={{ padding: '12px' }}>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {u.is_verified && (
                        <span style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e', padding: '2px 6px', fontSize: 10, borderRadius: 2 }}>
                          ✓ Email
                        </span>
                      )}
                      {u.is_agent_verified && (
                        <span style={{ background: 'rgba(201,168,76,0.1)', color: 'var(--gold)', padding: '2px 6px', fontSize: 10, borderRadius: 2 }}>
                          ✓ Agent
                        </span>
                      )}
                      {u.is_premium && (
                        <span style={{ background: 'rgba(168,85,247,0.1)', color: '#a855f7', padding: '2px 6px', fontSize: 10, borderRadius: 2 }}>
                          ⭐ Premium
                        </span>
                      )}
                    </div>
                  </td>

                  <td style={{ padding: '12px' }}>
                    <span style={{ color: u.is_active ? '#22c55e' : '#f87171', fontSize: 12 }}>
                      {u.is_active ? 'Active' : 'Banned'}
                    </span>
                  </td>

                  <td style={{ padding: '12px' }}>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>

                      {!u.is_verified && (
                        <button onClick={() => handleVerify(u.id)}
                          style={{ background: 'rgba(34,197,94,0.15)', border: 'none', color: '#22c55e', padding: '3px 7px', fontSize: 10, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", borderRadius: 2 }}>
                          Verify
                        </button>
                      )}

                      {u.role === 2 && (
                        <button onClick={() => handleToggleAgentVerified(u.id)}
                          style={{ background: u.is_agent_verified ? 'rgba(239,68,68,0.1)' : 'rgba(201,168,76,0.15)', border: 'none', color: u.is_agent_verified ? '#f87171' : 'var(--gold)', padding: '3px 7px', fontSize: 10, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", borderRadius: 2 }}>
                          {u.is_agent_verified ? 'Unverify' : '✓ Verify Agent'}
                        </button>
                      )}

                      {!isAdminRole(u.role) && (
                        <button onClick={() => handleTogglePremium(u.id)}
                          style={{ background: u.is_premium ? 'rgba(239,68,68,0.1)' : 'rgba(168,85,247,0.1)', border: 'none', color: u.is_premium ? '#f87171' : '#a855f7', padding: '3px 7px', fontSize: 10, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", borderRadius: 2 }}>
                          {u.is_premium ? 'Remove Premium' : '⭐ Premium'}
                        </button>
                      )}

                      {!isAdminRole(u.role) && (
                        <button onClick={() => handleChangeRole(u.id, u.role)}
                          style={{ background: 'rgba(59,130,246,0.15)', border: 'none', color: '#60a5fa', padding: '3px 7px', fontSize: 10, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", borderRadius: 2 }}>
                          Make {u.role === 2 ? 'User' : 'Agent'}
                        </button>
                      )}

                      {!isAdminRole(u.role) && (
                        <button onClick={() => handleToggleActive(u.id)}
                          style={{
                            background: u.is_active ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)',
                            border: u.is_active ? '1px solid rgba(239,68,68,0.3)' : '1px solid rgba(34,197,94,0.3)',
                            color: u.is_active ? '#f87171' : '#22c55e',
                            padding: '3px 7px', fontSize: 10, cursor: 'pointer',
                            fontFamily: "'DM Sans', sans-serif", borderRadius: 2,
                          }}>
                          {u.is_active ? 'Ban' : 'Unban'}
                        </button>
                      )}

                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}