"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authApi } from "@/lib/api";
import { UGANDA_DISTRICTS, SUPPORTED_COUNTRIES } from "@/lib/ugandaDistricts";
import { uploadImage } from "@/lib/uploadImage";

interface ServiceCategory {
  id: number;
  tier: string;
  name: string;
}

// Static for now — mirrors the seed data in service_categories.
// (Once the directory backend is live we can fetch this instead, but
// keeping it static here means registration never breaks if that API is down.)
const SERVICE_CATEGORIES: ServiceCategory[] = [
  { id: 1, tier: "Legal & Financial", name: "Land Title Surveyors" },
  { id: 2, tier: "Legal & Financial", name: "Real Estate Attorneys" },
  { id: 3, tier: "Legal & Financial", name: "Valuation Experts" },
  { id: 4, tier: "Legal & Financial", name: "Mortgage/Loan Brokers" },
  { id: 5, tier: "Legal & Financial", name: "Home Insurance Brokers" },
  { id: 6, tier: "Home Maintenance & Trades", name: "Solar/Inverter Technicians" },
  { id: 7, tier: "Home Maintenance & Trades", name: "Water Pump/Borehole Specialists" },
  { id: 8, tier: "Home Maintenance & Trades", name: "CCTV & Intercom Installers" },
  { id: 9, tier: "Home Maintenance & Trades", name: "Generator Maintenance" },
  { id: 10, tier: "Home Maintenance & Trades", name: "General Plumbers" },
  { id: 11, tier: "Home Maintenance & Trades", name: "General Electricians" },
  { id: 12, tier: "Home Maintenance & Trades", name: "Waste/Junk Removal" },
  { id: 13, tier: "Home Maintenance & Trades", name: "Fumigation/Pest Control" },
  { id: 14, tier: "Home Maintenance & Trades", name: "Professional Deep Cleaners" },
  { id: 15, tier: "Home Maintenance & Trades", name: "Movers & Transport" },
  { id: 16, tier: "Design & Renovation", name: "Cabinetry & Joinery" },
  { id: 17, tier: "Design & Renovation", name: "Curtain & Blind Installers" },
  { id: 18, tier: "Design & Renovation", name: "Landscaping & Hardscape Designers" },
  { id: 19, tier: "Design & Renovation", name: "Professional Home Stagers" },
  { id: 20, tier: "Design & Renovation", name: "Smart Home Integrators" },
];

export default function RegisterPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone_number: "",
    password: "",
    confirm_password: "",
    role: 1, // default to User (regular buyer)
    // Service Provider fields
    business_name: "",
    business_description: "",
    whatsapp: "",
    country: "Uganda",
    district: "",
    location: "",
    years_experience: "",
    logo_url: "",
  });
  const [categoryIds, setCategoryIds] = useState<number[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [oauthMessage, setOauthMessage] = useState("");

  const isServiceProvider = form.role === 5;

  const handleLogoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) { setError("Please choose an image file."); return; }
    if (file.size > 5 * 1024 * 1024) { setError("Image must be under 5MB."); return; }

    setLogoUploading(true);
    setError("");
    try {
      const url = await uploadImage(file);
      setForm(f => ({ ...f, logo_url: url }));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to upload photo.");
    } finally {
      setLogoUploading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'country') {
      setForm(f => ({ ...f, country: value, district: "" }));
    } else {
      setForm(f => ({ ...f, [name]: value }));
    }
    setError("");
  };

  const handleOAuth = async (provider: "google" | "apple") => {
    setOauthMessage("");
    try {
      await authApi.oauthStub(provider);
    } catch (err: unknown) {
      setOauthMessage(err instanceof Error ? err.message : `${provider} sign-in is not available yet.`);
    }
  };

  const toggleCategory = (id: number) => {
    setCategoryIds(ids => ids.includes(id) ? ids.filter(c => c !== id) : [...ids, id]);
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirm_password) { setError("Passwords do not match."); return; }
    if (form.password.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (!form.phone_number.trim()) { setError("Phone number is required."); return; }
    if (isServiceProvider) {
      if (!form.business_name.trim()) { setError("Business name is required."); return; }
      if (!form.business_description.trim()) { setError("Please describe your service."); return; }
      if (categoryIds.length === 0) { setError("Select at least one service category."); return; }
    }
    setLoading(true);
    try {
      await authApi.register({
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        password: form.password,
        phone_number: form.phone_number,
        role: form.role,
        ...(isServiceProvider ? {
          business_name: form.business_name,
          business_description: form.business_description,
          category_ids: categoryIds,
          country: form.country,
          district: form.district || undefined,
          location: form.location || undefined,
          whatsapp: form.whatsapp || undefined,
          years_experience: form.years_experience ? parseInt(form.years_experience) : undefined,
          logo_url: form.logo_url || undefined,
        } : {}),
      });
      setRegistered(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(201,168,76,0.2)", padding: "12px 16px",
    color: "white", fontSize: 14, outline: "none", fontFamily: "'DM Sans', sans-serif",
    boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    display: "block", fontSize: 11, letterSpacing: "0.1em",
    textTransform: "uppercase", color: "#8892a4", marginBottom: 8,
  };

  const tiers = [...new Set(SERVICE_CATEGORIES.map(c => c.tier))];

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg, #0a0a0b 0%, #1a1410 40%, #0d1520 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px", fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ position: "fixed", inset: 0, backgroundImage: "url('https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1600&q=85')", backgroundSize: "cover", backgroundPosition: "center", opacity: 0.15, pointerEvents: "none" }} />

      <div style={{ width: "100%", maxWidth: 520, position: "relative", zIndex: 1 }}>

        {/* Logo */}
        <div onClick={() => router.push("/")} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 40, cursor: "pointer", justifyContent: "center" }}>
          <img src="/logo.png" alt="Stonepath Estates" style={{ height: 36, width: 36, borderRadius: "50%", objectFit: "cover" }} />
          <span style={{ fontSize: 22, color: "white", fontFamily: "Cormorant Garamond, serif" }}>Stonepath Estates</span>
        </div>

        <div style={{ background: "rgba(13,15,26,0.85)", border: "1px solid rgba(201,168,76,0.2)", backdropFilter: "blur(24px)", padding: "40px 36px" }}>
          {registered ? (
            <>
              <p style={{ fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", color: "#c9a84c", marginBottom: 8 }}>Almost There</p>
              <h1 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: 32, fontWeight: 300, color: "white", marginBottom: 16 }}>Verify Your Email</h1>
              <p style={{ fontSize: 14, color: "#8892a4", lineHeight: 1.7, marginBottom: 28 }}>
                We&apos;ve sent a verification link to <strong style={{ color: "white" }}>{form.email}</strong>. Please check your inbox and click the link to activate your account before signing in.
              </p>
              <button onClick={() => router.push("/login")}
                style={{ width: "100%", background: "#c9a84c", border: "none", color: "#0a0a0b", padding: "14px", fontSize: 12, fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                Go to Sign In
              </button>
            </>
          ) : (
          <>
          <p style={{ fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", color: "#c9a84c", marginBottom: 8 }}>Get Started</p>
          <h1 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: 32, fontWeight: 300, color: "white", marginBottom: 32 }}>Create Account</h1>

          {error && (
            <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171", padding: "12px 16px", fontSize: 13, marginBottom: 24 }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>

            {/* Role Selection */}
            <div>
              <label style={labelStyle}>I am a</label>
              <div className="role-picker-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                {[
                  { role: 1, label: "Buyer", desc: "Browse & save properties", icon: "🏠" },
                  { role: 2, label: "Agent", desc: "List & manage properties", icon: "🏢" },
                  { role: 5, label: "Service Provider", desc: "List your service", icon: "🛠️" },
                ].map(opt => (
                  <div
                    key={opt.role}
                    onClick={() => setForm(f => ({ ...f, role: opt.role }))}
                    style={{
                      padding: "14px 8px", cursor: "pointer", textAlign: "center",
                      border: form.role === opt.role ? "1px solid #c9a84c" : "1px solid rgba(201,168,76,0.2)",
                      background: form.role === opt.role ? "rgba(201,168,76,0.1)" : "transparent",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <div style={{ fontSize: 20, marginBottom: 6 }}>{opt.icon}</div>
                    <div style={{ color: form.role === opt.role ? "#c9a84c" : "white", fontWeight: 600, fontSize: 12, marginBottom: 4 }}>{opt.label}</div>
                    <div style={{ color: "#8892a4", fontSize: 10 }}>{opt.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Name row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <label style={labelStyle}>First Name</label>
                <input name="first_name" type="text" value={form.first_name} onChange={handleChange} required placeholder="Jonathan" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Last Name</label>
                <input name="last_name" type="text" value={form.last_name} onChange={handleChange} required placeholder="Doe" style={inputStyle} />
              </div>
            </div>

            <div>
              <label style={labelStyle}>Email Address</label>
              <input name="email" type="email" value={form.email} onChange={handleChange} required placeholder="you@example.com" style={inputStyle} />
            </div>

            <div>
              <label style={labelStyle}>Phone Number</label>
              <input name="phone_number" type="tel" value={form.phone_number} onChange={handleChange}
                required placeholder="+256 700 000 000" style={inputStyle} />
            </div>

            {/* ── SERVICE PROVIDER SPECIFIC FIELDS ── */}
            {isServiceProvider && (
              <>
                <div style={{ borderTop: "1px solid rgba(201,168,76,0.15)", paddingTop: 20, marginTop: 4 }}>
                  <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "#c9a84c", marginBottom: 16 }}>
                    Business Details
                  </p>
                </div>

                <div>
                  <label style={labelStyle}>Profile Picture / Logo <span style={{ color: "rgba(136,146,164,0.6)", textTransform: "none" }}>(optional)</span></label>
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{ width: 56, height: 56, borderRadius: "50%", overflow: "hidden", border: "1px solid rgba(201,168,76,0.2)", background: "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {form.logo_url ? (
                        <img src={form.logo_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <span style={{ fontSize: 20 }}>🛠️</span>
                      )}
                    </div>
                    <label style={{ fontSize: 12, color: "#c9a84c", border: "1px solid rgba(201,168,76,0.3)", padding: "8px 14px", cursor: logoUploading ? "wait" : "pointer" }}>
                      {logoUploading ? "Uploading…" : form.logo_url ? "Change photo" : "Upload photo"}
                      <input type="file" accept="image/*" onChange={handleLogoSelect} disabled={logoUploading} style={{ display: "none" }} />
                    </label>
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Business / Service Name</label>
                  <input name="business_name" type="text" value={form.business_name} onChange={handleChange}
                    required placeholder="e.g. Kampala Solar Solutions" style={inputStyle} />
                </div>

                <div>
                  <label style={labelStyle}>Describe Your Service</label>
                  <textarea name="business_description" value={form.business_description} onChange={handleChange}
                    required rows={3} placeholder="What do you offer, and why should clients trust you?"
                    style={{ ...inputStyle, resize: "vertical" }} />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div>
                    <label style={labelStyle}>WhatsApp <span style={{ color: "rgba(136,146,164,0.6)", textTransform: "none" }}>(optional)</span></label>
                    <input name="whatsapp" type="tel" value={form.whatsapp} onChange={handleChange} placeholder="+256 700 000 000" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Years of Experience <span style={{ color: "rgba(136,146,164,0.6)", textTransform: "none" }}>(optional)</span></label>
                    <input name="years_experience" type="number" min="0" value={form.years_experience} onChange={handleChange} placeholder="e.g. 5" style={inputStyle} />
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
                    {form.country === 'Uganda' ? (
                      <select name="district" value={form.district} onChange={handleChange} style={inputStyle}>
                        <option value="">Select district</option>
                        {UGANDA_DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    ) : (
                      <input name="district" type="text" value={form.district} onChange={handleChange} placeholder="e.g. Nairobi" style={inputStyle} />
                    )}
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>City / Area <span style={{ color: "rgba(136,146,164,0.6)", textTransform: "none" }}>(optional)</span></label>
                  <input name="location" type="text" value={form.location} onChange={handleChange} placeholder="e.g. Kololo, Kampala" style={inputStyle} />
                </div>

                <div>
                  <label style={labelStyle}>Services You Offer</label>
                  <div style={{ maxHeight: 220, overflowY: "auto", border: "1px solid rgba(201,168,76,0.15)", padding: 12 }}>
                    {tiers.map(tier => (
                      <div key={tier} style={{ marginBottom: 14 }}>
                        <p style={{ fontSize: 10, color: "#8892a4", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>{tier}</p>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                          {SERVICE_CATEGORIES.filter(c => c.tier === tier).map(cat => (
                            <button
                              type="button"
                              key={cat.id}
                              onClick={() => toggleCategory(cat.id)}
                              style={{
                                padding: "6px 12px", fontSize: 11, cursor: "pointer",
                                border: categoryIds.includes(cat.id) ? "1px solid #c9a84c" : "1px solid rgba(201,168,76,0.2)",
                                background: categoryIds.includes(cat.id) ? "rgba(201,168,76,0.15)" : "transparent",
                                color: categoryIds.includes(cat.id) ? "#c9a84c" : "#8892a4",
                                fontFamily: "'DM Sans', sans-serif",
                              }}>
                              {cat.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  <p style={{ fontSize: 11, color: "#8892a4", marginTop: 6 }}>
                    {categoryIds.length === 0 ? "Select at least one service" : `${categoryIds.length} selected`}
                  </p>
                </div>
              </>
            )}

            <div>
              <label style={labelStyle}>Password</label>
              <input name="password" type="password" value={form.password} onChange={handleChange} required placeholder="Min. 8 characters" style={inputStyle} />
            </div>

            <div>
              <label style={labelStyle}>Confirm Password</label>
              <input name="confirm_password" type="password" value={form.confirm_password} onChange={handleChange} required placeholder="Repeat your password"
                style={{ ...inputStyle, borderColor: form.confirm_password && form.password !== form.confirm_password ? "rgba(239,68,68,0.5)" : "rgba(201,168,76,0.2)" }} />
              {form.confirm_password && form.password !== form.confirm_password && (
                <p style={{ fontSize: 11, color: "#f87171", marginTop: 6 }}>Passwords do not match</p>
              )}
            </div>

            {isServiceProvider && (
              <div style={{ background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.2)", padding: "12px 16px", fontSize: 12, color: "#8892a4" }}>
                ℹ️ Your service listing will be reviewed by our team before it appears publicly. This usually takes 1-2 business days.
              </div>
            )}

            <button type="submit" disabled={loading}
              style={{ width: "100%", background: loading ? "rgba(201,168,76,0.5)" : "#c9a84c", border: "none", color: "#0a0a0b", padding: "14px", fontSize: 12, fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", cursor: loading ? "not-allowed" : "pointer", marginTop: 8, fontFamily: "'DM Sans', sans-serif" }}>
              {loading ? "Creating Account..." : "Create Account"}
            </button>
          </form>

          <div style={{ display: "flex", alignItems: "center", gap: 16, margin: "28px 0" }}>
            <div style={{ flex: 1, height: 1, background: "rgba(201,168,76,0.2)" }} />
            <span style={{ fontSize: 11, color: "#8892a4", letterSpacing: "0.1em" }}>OR</span>
            <div style={{ flex: 1, height: 1, background: "rgba(201,168,76,0.2)" }} />
          </div>

          <div style={{ display: "flex", gap: 10, marginBottom: oauthMessage ? 12 : 24 }}>
            <button type="button" onClick={() => handleOAuth("google")}
              style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(201,168,76,0.2)", color: "white", padding: "11px", fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
              <span style={{ fontWeight: 700, color: "#c9a84c" }}>G</span> Google
            </button>
            <button type="button" onClick={() => handleOAuth("apple")}
              style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(201,168,76,0.2)", color: "white", padding: "11px", fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
              <span style={{ fontWeight: 700, color: "#c9a84c" }}></span> Apple
            </button>
          </div>
          {oauthMessage && (
            <p style={{ textAlign: "center", fontSize: 12, color: "#8892a4", marginBottom: 24 }}>{oauthMessage}</p>
          )}

          <p style={{ textAlign: "center", fontSize: 13, color: "#8892a4" }}>
            Already have an account?{" "}
            <Link href="/login" style={{ color: "#c9a84c", textDecoration: "none", fontWeight: 500 }}>Sign in</Link>
          </p>
          </>
          )}
        </div>

        <p style={{ textAlign: "center", marginTop: 24, fontSize: 12 }}>
          <Link href="/" style={{ color: "rgba(255,255,255,0.4)", textDecoration: "none" }}>← Back to listings</Link>
        </p>
      </div>
    </div>
  );
}