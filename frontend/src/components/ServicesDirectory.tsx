"use client";

import { useState, useEffect, useCallback } from "react";
import { serviceProvidersApi, type ServiceProvider, type ServiceCategory } from "@/lib/api/serviceProviders";

interface Props {
  onSelectProvider: (provider: ServiceProvider) => void;
}

export default function ServicesDirectory({ onSelectProvider }: Props) {
  const [providers, setProviders] = useState<ServiceProvider[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    serviceProvidersApi.getCategories().then(setCategories).catch(console.error);
  }, []);

  const fetchProviders = useCallback(() => {
    setLoading(true);
    serviceProvidersApi.getAll({
      category_id: activeCategory || undefined,
      q: search || undefined,
    })
      .then(setProviders)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [activeCategory, search]);

  useEffect(() => {
    const t = setTimeout(fetchProviders, 300); // debounce search
    return () => clearTimeout(t);
  }, [fetchProviders]);

  const tiers = [...new Set(categories.map(c => c.tier))];

  const thumbnail = (p: ServiceProvider) =>
    p.logo_url || p.images?.[0] || "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&q=70";

  return (
    <div className="page-enter" style={{ maxWidth: 1100, margin: "0 auto", padding: "120px 24px 80px" }}>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <p style={{ fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--gold)", marginBottom: 8 }}>
          Stonepath Services
        </p>
        <h1 className="font-serif" style={{ fontSize: 36, fontWeight: 300, marginBottom: 8 }}>
          Trusted Home Professionals
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: 14, maxWidth: 560 }}>
          From legal paperwork to landscaping, find vetted professionals to help with every stage of your property journey.
        </p>
      </div>

      {/* Search */}
      <div style={{ marginBottom: 24 }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search services, e.g. 'solar', 'plumber', 'movers'..."
          style={{
            width: "100%", maxWidth: 480, background: "var(--surface)", border: "1px solid var(--border)",
            padding: "12px 16px", color: "var(--text)", fontSize: 14, outline: "none",
            fontFamily: "'DM Sans', sans-serif", borderRadius: 2, boxSizing: "border-box",
          }}
        />
      </div>

      {/* Category filters by tier */}
      <div style={{ marginBottom: 32 }}>
        <button
          onClick={() => setActiveCategory(null)}
          style={{
            padding: "8px 16px", marginRight: 8, marginBottom: 8,
            background: activeCategory === null ? "var(--gold)" : "transparent",
            border: "1px solid var(--border)", color: activeCategory === null ? "#000" : "var(--text)",
            cursor: "pointer", fontFamily: "'DM Sans', sans-serif", borderRadius: 2,
          }}>
          All Services
        </button>
        {tiers.map(tier => (
          <div key={tier} style={{ marginTop: 12 }}>
            <p style={{ fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>{tier}</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {categories.filter(c => c.tier === tier).map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id === activeCategory ? null : cat.id)}
                  style={{
                    padding: "6px 14px", fontSize: 12,
                    background: activeCategory === cat.id ? "var(--gold)" : "transparent",
                    border: "1px solid var(--border)", color: activeCategory === cat.id ? "#000" : "var(--text-muted)",
                    cursor: "pointer", fontFamily: "'DM Sans', sans-serif", borderRadius: 2,
                  }}>
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Results */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 60, color: "var(--text-muted)" }}>Loading providers...</div>
      ) : providers.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60, color: "var(--text-muted)" }}>
          No service providers found{search ? ` for "${search}"` : ""}.
        </div>
      ) : (
        <div className="services-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 20 }}>
          {providers.map(p => (
            <div
              key={p.id}
              onClick={() => onSelectProvider(p)}
              style={{ background: "var(--card-bg)", border: "1px solid var(--border)", cursor: "pointer", overflow: "hidden", borderRadius: 2 }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--gold)")}
              onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--border)")}>
              <img src={thumbnail(p)} alt="" style={{ width: "100%", height: 140, objectFit: "cover" }} />
              <div style={{ padding: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 6 }}>
                  <h3 className="font-serif" style={{ fontSize: 17, fontWeight: 400, lineHeight: 1.2 }}>{p.business_name}</h3>
                  {p.is_verified && (
                    <span title="Verified by Stonepath" style={{ color: "var(--gold)", fontSize: 12, flexShrink: 0 }}>✓</span>
                  )}
                </div>
                <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 10, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                  {p.description}
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 10 }}>
                  {p.categories.slice(0, 2).map(c => (
                    <span key={c.id} style={{ fontSize: 10, background: "var(--surface)", border: "1px solid var(--border)", padding: "2px 8px", borderRadius: 10 }}>
                      {c.name}
                    </span>
                  ))}
                  {p.categories.length > 2 && (
                    <span style={{ fontSize: 10, color: "var(--text-muted)" }}>+{p.categories.length - 2} more</span>
                  )}
                </div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", display: "flex", justifyContent: "space-between" }}>
                  <span>📍 {p.district || p.location || p.country}</span>
                  {p.years_experience ? <span>{p.years_experience}y exp</span> : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}