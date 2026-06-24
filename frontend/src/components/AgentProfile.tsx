"use client";

import { useState, useEffect } from "react";
import { Icons } from "@/components/Icons";
import { propertiesApi, type Property } from "@/lib/api";
import PropertyCard from "@/components/PropertyCard";

interface Props {
  agentId: string;
  agentName: string;
  agentVerified: boolean;
  onBack: () => void;
  onView: (property: Property) => void;
  onSave: (id: string) => void;
  savedIds: string[];
}

export default function AgentProfile({ agentId, agentName, agentVerified, onBack, onView, onSave, savedIds }: Props) {
  const [listings, setListings] = useState<Property[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    propertiesApi.getAll({ created_by: agentId } as never)
      .then(setListings)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [agentId]);

  return (
    <div className="page-enter" style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 16px 80px" }}>
      <button onClick={onBack} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 13, marginBottom: 24, padding: 0 }}>
        <Icons.ChevronLeft />
        <span>Back</span>
      </button>

      {/* Agent header */}
      <div style={{ background: "var(--card-bg)", border: "1px solid var(--border)", padding: 28, marginBottom: 28, display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ width: 72, height: 72, borderRadius: "50%", background: "var(--surface)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <span style={{ fontSize: 28, color: "var(--text-muted)" }}>{agentName[0]?.toUpperCase()}</span>
        </div>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <h2 className="font-serif" style={{ fontSize: 26, fontWeight: 300 }}>{agentName}</h2>
            {agentVerified && (
              <span style={{ background: "rgba(201,168,76,0.15)", color: "var(--gold)", fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 2, letterSpacing: "0.08em", textTransform: "uppercase", border: "1px solid rgba(201,168,76,0.3)" }}>
                ✓ Verified Agent
              </span>
            )}
          </div>
          <p style={{ color: "var(--text-muted)", fontSize: 13 }}>
            {listings.length} active listing{listings.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Listings */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 40, color: "var(--text-muted)" }}>Loading listings...</div>
      ) : listings.length === 0 ? (
        <div style={{ textAlign: "center", padding: 40, color: "var(--text-muted)" }}>No active listings from this agent.</div>
      ) : (
        <div className="property-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 24 }}>
          {listings.map(p => (
            <PropertyCard key={p.id} property={p} onView={onView} onSave={onSave} saved={savedIds.includes(p.id)} />
          ))}
        </div>
      )}
    </div>
  );
}