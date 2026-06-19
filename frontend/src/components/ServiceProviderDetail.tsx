"use client";

import { Icons } from '@/components/Icons';
import type { ServiceProvider } from "@/lib/api/serviceProviders";

interface Props {
  provider: ServiceProvider;
  onBack: () => void;
}

export default function ServiceProviderDetail({ provider, onBack }: Props) {
  const thumbnail = provider.logo_url || provider.images?.[0] || "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&q=80";

  return (
    <div className="page-enter" style={{ maxWidth: 800, margin: "0 auto", padding: "120px 24px 80px" }}>
      <button onClick={onBack} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 13, marginBottom: 24, padding: 0 }}>
        <Icons.ChevronLeft />
        <span>Back to Services</span>
      </button>

      <div style={{ height: 240, marginBottom: 24, background: "#111" }}>
        <img src={thumbnail} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 8, flexWrap: "wrap" }}>
        <h1 className="font-serif" style={{ fontSize: 32, fontWeight: 300 }}>{provider.business_name}</h1>
        {provider.is_verified && (
          <span style={{ background: "rgba(201,168,76,0.15)", color: "var(--gold)", fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 2, letterSpacing: "0.08em", textTransform: "uppercase", border: "1px solid rgba(201,168,76,0.3)" }}>
            ✓ Verified by Stonepath
          </span>
        )}
      </div>

      <p style={{ color: "var(--text-muted)", fontSize: 13, marginBottom: 20 }}>
        📍 {[provider.location, provider.district, provider.country].filter(Boolean).join(', ')}
        {provider.years_experience ? ` · ${provider.years_experience} years experience` : ''}
      </p>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 28 }}>
        {provider.categories.map(c => (
          <span key={c.id} style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: "6px 14px", fontSize: 12, borderRadius: 2 }}>
            {c.name}
          </span>
        ))}
      </div>

      <div style={{ border: "1px solid var(--border)", borderRadius: 2, marginBottom: 28 }}>
        <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--border)", fontSize: 12, color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
          About
        </div>
        <p style={{ padding: 16, color: "var(--text-muted)", lineHeight: 1.7 }}>{provider.description}</p>
      </div>

      {/* Contact card */}
      <div style={{ background: "var(--card-bg)", border: "1px solid var(--border)", padding: 24 }}>
        <h3 className="font-serif" style={{ fontSize: 18, fontWeight: 400, marginBottom: 16 }}>Get in Touch</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <a href={`tel:${provider.phone_number}`} style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--text)", textDecoration: "none", fontSize: 14 }}>
            <span style={{ color: "var(--gold)" }}>📞</span> {provider.phone_number}
          </a>
          {provider.whatsapp && (
            <a href={`https://wa.me/${provider.whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer"
              style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--text)", textDecoration: "none", fontSize: 14 }}>
              <span style={{ color: "#22c55e" }}>💬</span> WhatsApp: {provider.whatsapp}
            </a>
          )}
          {provider.email && (
            <a href={`mailto:${provider.email}`} style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--text)", textDecoration: "none", fontSize: 14 }}>
              <span style={{ color: "var(--gold)" }}>✉️</span> {provider.email}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}