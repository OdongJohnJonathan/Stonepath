"use client";

import { useState, useEffect } from "react";
import { adminApi, AdminUser } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export default function AdminUsersPanel() {
  const { token } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const roleLabels: Record<number, string> = {
    1: "Admin",
    2: "Agent",
    3: "Buyer",
  };

  const fetchUsers = async () => {
    if (!token) return;
    try {
      const data = await adminApi.getUsers(token);
      setUsers(data);
    } catch (err) {
      setError("Failed to load users");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, [token]);

  const handleChangeRole = async (id: string, currentRole: number) => {
    if (!token) return;
    const newRole = currentRole === 2 ? 3 : 2; // toggle between agent and buyer
    try {
      await adminApi.changeRole(id, newRole, token);
      fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleActive = async (id: string) => {
    if (!token) return;
    try {
      await adminApi.toggleActive(id, token);
      fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  const handleVerify = async (id: string) => {
    if (!token) return;
    try {
      await adminApi.verifyUser(id, token);
      fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return (
    <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
      Loading users...
    </div>
  );

  if (error) return (
    <div style={{ textAlign: 'center', padding: 40, color: '#f87171' }}>{error}</div>
  );

  return (
    <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h3 className="font-serif" style={{ fontSize: 22, fontWeight: 400 }}>User Management</h3>
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{users.length} users total</span>
      </div>

      <div className="table-wrapper" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['Name', 'Email', 'Role', 'Verified', 'Status', 'Joined', 'Actions'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '8px 12px', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 500 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} style={{ borderBottom: '1px solid var(--border)', opacity: u.is_active ? 1 : 0.5 }}>

                {/* Name */}
                <td style={{ padding: '12px', fontWeight: 500 }}>
                  {u.first_name} {u.last_name}
                </td>

                {/* Email */}
                <td style={{ padding: '12px', color: 'var(--text-muted)', fontSize: 12 }}>
                  {u.email}
                </td>

                {/* Role */}
                <td style={{ padding: '12px' }}>
                  <span style={{
                    padding: '2px 8px', borderRadius: 2, fontSize: 11,
                    background: u.role === 1 ? 'rgba(201,168,76,0.15)' : u.role === 2 ? 'rgba(59,130,246,0.15)' : 'rgba(107,114,128,0.15)',
                    color: u.role === 1 ? '#c9a84c' : u.role === 2 ? '#60a5fa' : 'var(--text-muted)',
                  }}>
                    {roleLabels[u.role] || 'Unknown'}
                  </span>
                </td>

                {/* Verified */}
                <td style={{ padding: '12px' }}>
                  <span style={{ color: u.is_verified ? '#22c55e' : '#f59e0b', fontSize: 12 }}>
                    {u.is_verified ? '✓ Verified' : '✗ Unverified'}
                  </span>
                </td>

                {/* Active status */}
                <td style={{ padding: '12px' }}>
                  <span style={{ color: u.is_active ? '#22c55e' : '#f87171', fontSize: 12 }}>
                    {u.is_active ? 'Active' : 'Banned'}
                  </span>
                </td>

                {/* Joined */}
                <td style={{ padding: '12px', color: 'var(--text-muted)', fontSize: 12 }}>
                  {new Date(u.created_at).toLocaleDateString()}
                </td>

                {/* Actions */}
                <td style={{ padding: '12px' }}>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>

                    {/* Verify — only if not yet verified */}
                    {!u.is_verified && (
                      <button onClick={() => handleVerify(u.id)}
                        style={{ background: 'rgba(34,197,94,0.15)', border: 'none', color: '#22c55e', padding: '4px 8px', fontSize: 10, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", borderRadius: 2 }}>
                        Verify
                      </button>
                    )}

                    {/* Change role — only for non-admins */}
                    {u.role !== 1 && (
                      <button onClick={() => handleChangeRole(u.id, u.role)}
                        style={{ background: 'rgba(59,130,246,0.15)', border: 'none', color: '#60a5fa', padding: '4px 8px', fontSize: 10, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", borderRadius: 2 }}>
                        Make {u.role === 2 ? 'Buyer' : 'Agent'}
                      </button>
                    )}

                    {/* Ban/Unban — only for non-admins */}
                    {u.role !== 1 && (
                      <button onClick={() => handleToggleActive(u.id)}
                        style={{
                          background: u.is_active ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)',
                          border: u.is_active ? '1px solid rgba(239,68,68,0.3)' : '1px solid rgba(34,197,94,0.3)',
                          color: u.is_active ? '#f87171' : '#22c55e',
                          padding: '4px 8px', fontSize: 10, cursor: 'pointer',
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
  );
}