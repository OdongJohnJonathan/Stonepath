"use client";

import { useState, useEffect, useCallback } from "react";
import { serviceProvidersApi, type ServiceProvider, type ServiceCategory } from "@/lib/api/serviceProviders";
import { useAuth } from "@/context/AuthContext";
import { UGANDA_DISTRICTS, SUPPORTED_COUNTRIES } from "@/lib/ugandaDistricts";

const ALL_CATEGORIES: ServiceCategory[] = [
  { id: 1,  tier: "Legal & Financial",          name: "Land Title Surveyors" },
  { id: 2,  tier: "Legal & Financial",          name: "Real Estate Attorneys" },
  { id: 3,  tier: "Legal & Financial",          name: "Valuation Experts" },
  { id: 4,  tier: "Legal & Financial",          name: "Mortgage/Loan Brokers" },
  { id: 5,  tier: "Legal & Financial",          name: "Home Insurance Brokers" },
  { id: 6,  tier: "Home Maintenance & Trades",  name: "Solar/Inverter Technicians" },
  { id: 7,  tier: "Home Maintenance & Trades",  name: "Water Pump/Borehole Specialists" },
  { id: 8,  tier: "Home Maintenance & Trades",  name: "CCTV & Intercom Installers" },
  { id: 9,  tier: "Home Maintenance & Trades",  name: "Generator Maintenance" },
  { id: 10, tier: "Home Maintenance & Trades",  name: "General Plumbers" },
  { id: 11, tier: "Home Maintenance & Trades",  name: "General Electricians" },
  { id: 12, tier: "Home Maintenance & Trades",  name: "Waste/Junk Removal" },
  { id: 13, tier: "Home Maintenance & Trades",  name: "Fumigation/Pest Control" },
  { id: 14, tier: "Home Maintenance & Trades",  name: "Professional Deep Cleaners" },
  { id: 15, tier: "Home Maintenance & Trades",  name: "Movers & Transport" },
  { id: 16, tier: "Design & Renovation",        name: "Cabinetry & Joinery" },
  { id: 17, tier: "Design & Renovation",        name: "Curtain & Blind Installers" },
  { id: 18, tier: "Design & Renovation",        name: "Landscaping & Hardscape Designers" },
  { id: 19, tier: "Design & Renovation",        name: "Professional Home Stagers" },
  { id: 20, tier: "Design & Renovation",        name: "Smart Home Integrators" },
];

export default function MyServiceProviderPanel() {
  const { token } = useAuth();
  const [provider, setProvider]     = useState<ServiceProvider | null>(null);
  const [loading, setLoading]       = useState(true);
  const [editing, setEditing]       = useState(false);
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState("");
  const [success, setSuccess]       = useState("");

  const [form, setForm] = useState({
    business_name: "",
    description: "",
    phone_number: "",
    email: "",
    whatsapp: "",
    country: "Uganda",
    district: "",
    location: "",
    years_experience: "",
  });
  const [categoryIds, setCategoryIds] = useState<number[]>([]);

  const fetchProvider = useCallback(() => {
    if (!token) return;
    setLoading(true);
    serviceProvidersApi.getMine(token)
      .then(p => {
        setProvider(p);
        setForm({
          business_name: p.business_name,
          description: p.description,
          phone_number: p.phone_number,
          email: p.email || "",
          whatsapp: p.whatsapp || "",
          country: p.country,
          district: p.district || "",
          location: p.location || "",
          years_experience: p.years_experience ? String(p.years_experience) : "",
        });
        setCategoryIds((p.categories ?? []).map(c => c.id));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => { fetchProvider(); }, [fetchProvider]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === "country") {
      setForm(f => ({ ...f, country: value, district: "" }));
    } else {
      setForm(f => ({ ...f, [name]: value }));
    }
    setError("");
  };

  const toggleCategory = (id: number) => {
    setCategoryIds(ids => ids.includes(id) ? ids.filter(c => c !== id) : [...ids, id]);
  };

  const handleSave = async () => {
    if (!token) return;
    if (!form.business_name.trim()) { setError("Business name is required."); return; }
    if (!form.description.trim())   { setError("Description is required."); return; }
    if (!form.phone_number.trim())  { setError("Phone number is required."); return; }
    if (categoryIds.length === 0)   { setError("Select at least one category."); return; }

    setSaving(true);
    setError("");
    try {
      const updated = await serviceProvidersApi.updateMine({
        ...form,
        years_experience: form.years_experience ? parseInt(form.years_experience) : undefined,
        category_ids: categoryIds,
      }, token);
      setProvider(updated);
      setEditing(false);
      setSuccess("Your listing has been updated and is pending re-approval.");
      setTimeout(() => setSuccess(""), 5000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", background: "var(--surface)", border: "1px solid var(--border)",
    padding: "10px 14px", color: "var(--text)", fontSize: 13, outline: "none",
    fontFamily: "'DM Sans', sans-serif", borderRadius: 2, boxSizing: "border-box",
  };
  const labelStyle: React.CSSProperties = {
    display: "block", fontSize: 11, letterSpacing: "0.1em",
    textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 6,
  };

  const tiers = [...new Set(ALL_CATEGORIES.map(c => c.tier))];
  const statusColor = (s: string) => ({
    approved: "#22c55e", pending: "#f59e0b", rejected: "#f87171",
  }[s] || "var(--text-muted)");

  if (loading) return (
    <div style={{ background: "var(--card-bg)", border: "1px solid var(--border)", padding: 24 }}>
      <div style={{ textAlign: "center", padding: "32px 0", color: "var(--text-muted)" }}>Loading...</div>
    </div>
  );

  if (!provider) return (
    <div style={{ background: "var(--card-bg)", border: "1px solid var(--border)", padding: 24 }}>
      <p style={{ color: "var(--text-muted)", fontSize: 13 }}>No service provider profile found.</p>
    </div>
  );

  return (
    <div style={{ background: "var(--card-bg)", border: "1px solid var(--border)", padding: 24 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--gold)", marginBottom: 4 }}>Stonepath Services</p>
          <h3 className="font-serif" style={{ fontSize: 24, fontWeight: 400 }}>My Service Listing</h3>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 10, background: `${statusColor(provider.status)}22`, color: statusColor(provider.status), fontWeight: 600, textTransform: "capitalize" }}>
            {provider.status}
          </span>
          {provider.is_verified && (
            <span style={{ background: "rgba(201,168,76,0.15)", color: "var(--gold)", fontSize: 11, padding: "3px 8px", borderRadius: 2, fontWeight: 600 }}>
              ✓ Verified
            </span>
          )}
        </div>
      </div>

      {/* Status notice */}
      {provider.status === "pending" && (
        <div style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)", padding: "10px 14px", fontSize: 13, color: "#f59e0b", marginBottom: 16, borderRadius: 2 }}>
          ⏳ Your listing is under review. It will appear publicly once approved by our team.
        </div>
      )}
      {provider.status === "rejected" && (
        <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", padding: "10px 14px", fontSize: 13, color: "#f87171", marginBottom: 16, borderRadius: 2 }}>
          ✗ Your listing was not approved. Edit your details and save to resubmit for review.
        </div>
      )}
      {success && (
        <div style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.25)", padding: "10px 14px", fontSize: 13, color: "#22c55e", marginBottom: 16, borderRadius: 2 }}>
          {success}
        </div>
      )}
      {error && (
        <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)", padding: "10px 14px", fontSize: 13, color: "#f87171", marginBottom: 16, borderRadius: 2 }}>
          {error}
        </div>
      )}

      {/* View mode */}
      {!editing ? (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, fontSize: 13, marginBottom: 20 }}>
            <div>
              <span style={{ color: "var(--text-muted)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em" }}>Business Name</span>
              <p style={{ marginTop: 4 }}>{provider.business_name}</p>
            </div>
            <div>
              <span style={{ color: "var(--text-muted)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em" }}>Description</span>
              <p style={{ marginTop: 4, color: "var(--text-muted)", lineHeight: 1.6 }}>{provider.description}</p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <span style={{ color: "var(--text-muted)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em" }}>Phone</span>
                <p style={{ marginTop: 4 }}>{provider.phone_number}</p>
              </div>
              {provider.whatsapp && (
                <div>
                  <span style={{ color: "var(--text-muted)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em" }}>WhatsApp</span>
                  <p style={{ marginTop: 4 }}>{provider.whatsapp}</p>
                </div>
              )}
              {provider.email && (
                <div>
                  <span style={{ color: "var(--text-muted)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em" }}>Email</span>
                  <p style={{ marginTop: 4 }}>{provider.email}</p>
                </div>
              )}
              <div>
                <span style={{ color: "var(--text-muted)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em" }}>Location</span>
                <p style={{ marginTop: 4 }}>{[provider.location, provider.district, provider.country].filter(Boolean).join(", ")}</p>
              </div>
              {provider.years_experience && (
                <div>
                  <span style={{ color: "var(--text-muted)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em" }}>Experience</span>
                  <p style={{ marginTop: 4 }}>{provider.years_experience} years</p>
                </div>
              )}
            </div>
            <div>
              <span style={{ color: "var(--text-muted)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em" }}>Services</span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                {(provider.categories ?? []).map(c => (
                  <span key={c.id} style={{ fontSize: 11, background: "var(--surface)", border: "1px solid var(--border)", padding: "3px 10px", borderRadius: 10 }}>
                    {c.name}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={fetchProvider}
              style={{ background: "transparent", border: "1px solid var(--border)", color: "var(--text-muted)", padding: "10px 18px", fontSize: 11, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", borderRadius: 2 }}>
              ↻ Refresh Status
            </button>
            <button onClick={() => setEditing(true)}
              style={{ background: "var(--gold)", border: "none", color: "#000", padding: "10px 24px", fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", borderRadius: 2 }}>
              Edit Listing
            </button>
          </div>
        </>
      ) : (
        /* Edit mode */
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          <div>
            <label style={labelStyle}>Business / Service Name *</label>
            <input name="business_name" value={form.business_name} onChange={handleChange} style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle}>Description *</label>
            <textarea name="description" value={form.description} onChange={handleChange} rows={4} style={{ ...inputStyle, resize: "vertical" }} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <label style={labelStyle}>Phone *</label>
              <input name="phone_number" type="tel" value={form.phone_number} onChange={handleChange} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>WhatsApp</label>
              <input name="whatsapp" type="tel" value={form.whatsapp} onChange={handleChange} style={inputStyle} />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <label style={labelStyle}>Email</label>
              <input name="email" type="email" value={form.email} onChange={handleChange} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Years of Experience</label>
              <input name="years_experience" type="number" min="0" value={form.years_experience} onChange={handleChange} style={inputStyle} />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <label style={labelStyle}>Country</label>
              <select name="country" value={form.country} onChange={handleChange} style={inputStyle}>
                {SUPPORTED_COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>District</label>
              {form.country === "Uganda" ? (
                <select name="district" value={form.district} onChange={handleChange} style={inputStyle}>
                  <option value="">Select district</option>
                  {UGANDA_DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              ) : (
                <input name="district" value={form.district} onChange={handleChange} placeholder="e.g. Nairobi" style={inputStyle} />
              )}
            </div>
          </div>

          <div>
            <label style={labelStyle}>City / Area</label>
            <input name="location" value={form.location} onChange={handleChange} placeholder="e.g. Kololo, Kampala" style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle}>Services You Offer *</label>
            <div style={{ maxHeight: 200, overflowY: "auto", border: "1px solid var(--border)", padding: 12, borderRadius: 2 }}>
              {tiers.map(tier => (
                <div key={tier} style={{ marginBottom: 12 }}>
                  <p style={{ fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>{tier}</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {ALL_CATEGORIES.filter(c => c.tier === tier).map(cat => (
                      <button type="button" key={cat.id} onClick={() => toggleCategory(cat.id)}
                        style={{ padding: "5px 10px", fontSize: 11, cursor: "pointer", borderRadius: 2, fontFamily: "'DM Sans', sans-serif", border: categoryIds.includes(cat.id) ? "1px solid var(--gold)" : "1px solid var(--border)", background: categoryIds.includes(cat.id) ? "rgba(201,168,76,0.12)" : "transparent", color: categoryIds.includes(cat.id) ? "var(--gold)" : "var(--text-muted)" }}>
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 6 }}>{categoryIds.length} selected</p>
          </div>

          <div style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", padding: "10px 14px", fontSize: 12, color: "#f59e0b", borderRadius: 2 }}>
            ℹ️ Saving changes will resubmit your listing for admin review before it appears publicly again.
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => { setEditing(false); setError(""); }}
              style={{ flex: 1, background: "transparent", border: "1px solid var(--border)", color: "var(--text-muted)", padding: "10px", fontSize: 11, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", borderRadius: 2 }}>
              Cancel
            </button>
            <button onClick={handleSave} disabled={saving}
              style={{ flex: 2, background: saving ? "rgba(201,168,76,0.4)" : "var(--gold)", border: "none", color: "#000", padding: "10px", fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", cursor: saving ? "not-allowed" : "pointer", fontFamily: "'DM Sans', sans-serif", borderRadius: 2 }}>
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>

        </div>
      )}
    </div>
  );
}