"use client";

import { useState, useEffect, useCallback } from "react";
import { serviceProvidersApi, type ServiceProvider } from "@/lib/api/serviceProviders";
import { useAuth } from "@/context/AuthContext";

export default function AdminServiceProvidersPanel() {
  const { token } = useAuth();
  const [providers, setProviders]   = useState<ServiceProvider[]>([]);
  const [loading, setLoading]       = useState(true);
  const [updating, setUpdating]     = useState<string | null>(null);
  const [filter, setFilter]         = useState<"all" | "pending" | "approved" | "rejected">("pending");

  const fetchProviders = useCallback(() => {
    if (!token) return;
    setLoading(true);
    void serviceProvidersApi.getAllForAdmin(token)
      .then(setProviders)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => { fetchProviders(); }, [fetchProviders]);

  const handleApprove = async (id: string) => {
    if (!token) return;
    setUpdating(id);
    try { await serviceProvidersApi.approve(id, token); fetchProviders(); }
    catch (err) { console.error(err); }
    finally { setUpdating(null); }
  };

  const handleReject = async (id: string) => {
    if (!token) return;
    setUpdating(id);
    try { await serviceProvidersApi.reject(id, token); fetchProviders(); }
    catch (err) { console.error(err); }
    finally { setUpdating(null); }
  };

  const handleToggleVerified = async (id: string) => {
    if (!token) return;
    setUpdating(id);
    try { await serviceProvidersApi.toggleVerified(id, token); fetchProviders(); }
    catch (err) { console.error(err); }
    finally { setUpdating(null); }
  };

  const handleDelete = async (id: string) => {
    if (!token || !window.confirm("Permanently remove this listing?")) return;
    setUpdating(id);
    try { await serviceProvidersApi.delete(id, token); fetchProviders(); }
    catch (err) { console.error(err); }
    finally { setUpdating(null); }
  };

  const filtered = filter === "all"
    ? providers
    : providers.filter(p => p.status === filter);

  const statusColor = (s: string) => ({
    approved: "#22c55e", pending: "#f59e0b", rejected: "#f87171",
  }[s] || "var(--text-muted)");

  const tabStyle = (f: string): React.CSSProperties => ({
    background: filter === f ? "var(--gold)" : "transparent",
    border: filter === f ? "1px solid var(--gold)" : "1px solid var(--border)",
    color: filter === f ? "#000" : "var(--text-muted)",
    padding: "6px 14px", fontSize: 11, cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif", borderRadius: 2,
    textTransform: "uppercase", letterSpacing: "0.08em",
  });

  return (
    <div style={{ background: "var(--card-bg)", border: "1px solid var(--border)", padding: 24 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--gold)", marginBottom: 4 }}>
            Stonepath Services
          </p>
          <h3 className="font-serif" style={{ fontSize: 24, fontWeight: 400 }}>Service Provider Applications</h3>
        </div>
        <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
          {providers.filter(p => p.status === "pending").length} pending review
        </div>
      </div>

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
        {(["pending", "approved", "rejected", "all"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} style={tabStyle(f)}>
            {f === "all" ? `All (${providers.length})` : `${f} (${providers.filter(p => p.status === f).length})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "32px 0", color: "var(--text-muted)", fontSize: 14 }}>Loading...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "32px 0", color: "var(--text-muted)", fontSize: 14 }}>
          No {filter === "all" ? "" : filter} service providers.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filtered.map(p => (
            <div key={p.id} style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: 16, borderRadius: 2 }}>

              {/* Top row */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 10, flexWrap: "wrap" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                    <span style={{ fontWeight: 600, fontSize: 15 }}>{p.business_name}</span>
                    {p.is_verified && (
                      <span style={{ background: "rgba(201,168,76,0.15)", color: "var(--gold)", fontSize: 10, padding: "1px 6px", borderRadius: 2, fontWeight: 600 }}>
                        ✓ Verified
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                    {p.account_email || ""} · 📍 {[p.location, p.district, p.country].filter(Boolean).join(", ")}
                    {p.years_experience ? ` · ${p.years_experience}y exp` : ""}
                  </div>
                </div>
                <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 10, background: `${statusColor(p.status)}22`, color: statusColor(p.status), fontWeight: 600, textTransform: "capitalize", flexShrink: 0 }}>
                  {p.status}
                </span>
              </div>

              {/* Description */}
              <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6, marginBottom: 10 }}>
                {p.description}
              </p>

              {/* Categories */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
                {p.categories.map(c => (
                  <span key={c.id} style={{ fontSize: 10, background: "var(--card-bg)", border: "1px solid var(--border)", padding: "2px 8px", borderRadius: 10 }}>
                    {c.name}
                  </span>
                ))}
              </div>

              {/* Contact */}
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 12 }}>
                📞 {p.phone_number}
                {p.whatsapp && <> · 💬 {p.whatsapp}</>}
                {p.email && <> · ✉️ {p.email}</>}
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", paddingTop: 10, borderTop: "1px solid var(--border)" }}>
                {p.status === "pending" && (
                  <>
                    <button onClick={() => handleReject(p.id)} disabled={updating === p.id}
                      style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171", padding: "6px 16px", fontSize: 11, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", borderRadius: 2 }}>
                      Reject
                    </button>
                    <button onClick={() => handleApprove(p.id)} disabled={updating === p.id}
                      style={{ background: "#22c55e", border: "none", color: "#000", padding: "6px 20px", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", borderRadius: 2 }}>
                      {updating === p.id ? "Saving..." : "Approve"}
                    </button>
                  </>
                )}

                {p.status === "rejected" && (
                  <button onClick={() => handleApprove(p.id)} disabled={updating === p.id}
                    style={{ background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.4)", color: "#22c55e", padding: "6px 16px", fontSize: 11, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", borderRadius: 2 }}>
                    {updating === p.id ? "Saving..." : "Approve Anyway"}
                  </button>
                )}

                {p.status === "approved" && (
                  <button onClick={() => handleToggleVerified(p.id)} disabled={updating === p.id}
                    style={{ background: p.is_verified ? "rgba(239,68,68,0.1)" : "rgba(201,168,76,0.15)", border: p.is_verified ? "1px solid rgba(239,68,68,0.3)" : "1px solid var(--gold)", color: p.is_verified ? "#f87171" : "var(--gold)", padding: "6px 16px", fontSize: 11, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", borderRadius: 2 }}>
                    {updating === p.id ? "Saving..." : p.is_verified ? "Remove Verified Badge" : "✓ Mark as Verified"}
                  </button>
                )}

                {p.status === "rejected" && (
                  <button onClick={() => handleDelete(p.id)} disabled={updating === p.id}
                    style={{ background: "transparent", border: "1px solid var(--border)", color: "var(--text-muted)", padding: "6px 16px", fontSize: 11, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", borderRadius: 2 }}>
                    Remove
                  </button>
                )}
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}