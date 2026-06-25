"use client";

import { useState } from 'react';
import { Icons } from '@/components/Icons';
import { useAuth } from '@/context/AuthContext';
import type { ServiceProvider } from "@/lib/api/serviceProviders";

interface Props {
  provider: ServiceProvider;
  onBack: () => void;
}

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function ServiceProviderDetail({ provider, onBack }: Props) {
  const { user } = useAuth();

  const [showEnquiry, setShowEnquiry]       = useState(false);
  const [enquiryMsg, setEnquiryMsg]         = useState("");
  const [senderName, setSenderName]         = useState(user ? `${user.first_name} ${user.last_name}` : "");
  const [senderEmail, setSenderEmail]       = useState(user?.email || "");
  const [senderPhone, setSenderPhone]       = useState(user?.phone_number || "");
  const [enquirySending, setEnquirySending] = useState(false);
  const [enquiryDone, setEnquiryDone]       = useState(false);
  const [enquiryError, setEnquiryError]     = useState("");

  const handleEnquiry = async () => {
    if (!enquiryMsg.trim())    { setEnquiryError("Please enter a message."); return; }
    if (!senderName.trim())    { setEnquiryError("Please enter your name."); return; }
    if (!senderEmail.trim())   { setEnquiryError("Please enter your email."); return; }
    setEnquirySending(true);
    setEnquiryError("");
    try {
      const res = await fetch(`${API}/service-providers/${provider.id}/enquiry`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sender_name:  senderName,
          sender_email: senderEmail,
          sender_phone: senderPhone || undefined,
          message:      enquiryMsg,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to send enquiry");
      }
      setEnquiryDone(true);
      setEnquiryMsg("");
      setShowEnquiry(false);
    } catch (err: unknown) {
      setEnquiryError(err instanceof Error ? err.message : "Failed to send. Please try again.");
    } finally {
      setEnquirySending(false);
    }
  };

  const thumbnail = provider.logo_url || provider.images?.[0] ||
    "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&q=80";

  const inputStyle: React.CSSProperties = {
    width: "100%", background: "var(--surface)", border: "1px solid var(--border)",
    padding: "10px 14px", color: "var(--text)", fontSize: 13, outline: "none",
    fontFamily: "'DM Sans', sans-serif", borderRadius: 2, boxSizing: "border-box",
  };
  const labelStyle: React.CSSProperties = {
    display: "block", fontSize: 11, letterSpacing: "0.1em",
    textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 6,
  };

  return (
    <div className="page-enter" style={{ maxWidth: 800, margin: "0 auto", padding: "120px 24px 80px" }}>

      <button onClick={onBack} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 13, marginBottom: 24, padding: 0 }}>
        <Icons.ChevronLeft />
        <span>Back to Services</span>
      </button>

      {/* Cover image */}
      <div style={{ height: 240, marginBottom: 24, background: "#111", overflow: "hidden" }}>
        <img src={thumbnail} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>

      {/* Title row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 8, flexWrap: "wrap" }}>
        <h1 className="font-serif" style={{ fontSize: 32, fontWeight: 300 }}>{provider.business_name}</h1>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {provider.is_verified && (
            <span style={{ background: "rgba(201,168,76,0.15)", color: "var(--gold)", fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 2, letterSpacing: "0.08em", textTransform: "uppercase", border: "1px solid rgba(201,168,76,0.3)" }}>
              ✓ Verified by Stonepath
            </span>
          )}
          {provider.tier && provider.tier !== "free" && (
            <span style={{ background: provider.tier === "featured" ? "rgba(201,168,76,0.15)" : "rgba(34,197,94,0.1)", color: provider.tier === "featured" ? "var(--gold)" : "#22c55e", fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 2, letterSpacing: "0.08em", textTransform: "uppercase", border: `1px solid ${provider.tier === "featured" ? "rgba(201,168,76,0.3)" : "rgba(34,197,94,0.3)"}` }}>
              {provider.tier === "featured" ? "⭐ Featured" : "✓ Standard"}
            </span>
          )}
        </div>
      </div>

      <p style={{ color: "var(--text-muted)", fontSize: 13, marginBottom: 20 }}>
        📍 {[provider.location, provider.district, provider.country].filter(Boolean).join(", ")}
        {provider.years_experience ? ` · ${provider.years_experience} years experience` : ""}
      </p>

      {/* Category tags */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 28 }}>
        {(provider.categories ?? []).map(c => (
          <span key={c.id} style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: "6px 14px", fontSize: 12, borderRadius: 2 }}>
            {c.name}
          </span>
        ))}
      </div>

      {/* About */}
      <div style={{ border: "1px solid var(--border)", borderRadius: 2, marginBottom: 28 }}>
        <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--border)", fontSize: 12, color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
          About
        </div>
        <p style={{ padding: 16, color: "var(--text-muted)", lineHeight: 1.7 }}>{provider.description}</p>
      </div>

      {/* Contact card */}
      <div style={{ background: "var(--card-bg)", border: "1px solid var(--border)", padding: 24 }}>
        <h3 className="font-serif" style={{ fontSize: 18, fontWeight: 400, marginBottom: 16 }}>Get in Touch</h3>

        {/* Success state */}
        {enquiryDone && (
          <div style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.25)", padding: 20, borderRadius: 2, textAlign: "center" }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
            <p style={{ color: "#22c55e", fontWeight: 500, marginBottom: 4 }}>Enquiry Sent!</p>
            <p style={{ color: "var(--text-muted)", fontSize: 13 }}>
              {provider.business_name} has been notified and will be in touch soon.
            </p>
          </div>
        )}

        {!enquiryDone && (
          <>
            {/* Free tier — contacts locked, enquiry form shown */}
            {(!provider.tier || provider.tier === "free") && (
              <div style={{ marginBottom: showEnquiry ? 20 : 0 }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 12, background: "var(--surface)", border: "1px solid var(--border)", padding: 16, borderRadius: 2, marginBottom: 16 }}>
                  <span style={{ fontSize: 20 }}>🔒</span>
                  <div>
                    <p style={{ fontWeight: 500, fontSize: 13, marginBottom: 4 }}>Contact details are private</p>
                    <p style={{ color: "var(--text-muted)", fontSize: 12, lineHeight: 1.5 }}>
                      Send an enquiry and {provider.business_name} will contact you directly with their details.
                    </p>
                  </div>
                </div>
                {!showEnquiry && (
                  <button onClick={() => setShowEnquiry(true)}
                    style={{ width: "100%", background: "var(--gold)", border: "none", color: "#000", padding: "12px", fontSize: 12, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", borderRadius: 2 }}>
                    Send Enquiry
                  </button>
                )}
              </div>
            )}

            {/* Standard / Featured tier — contacts visible */}
            {provider.tier && provider.tier !== "free" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
                <a href={`tel:${provider.phone_number}`} style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--text)", textDecoration: "none", fontSize: 14, padding: "12px 16px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 2 }}>
                  <span style={{ color: "var(--gold)", fontSize: 18 }}>📞</span>
                  <div>
                    <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 2 }}>Call</div>
                    <div>{provider.phone_number}</div>
                  </div>
                </a>
                {provider.whatsapp && (
                  <a href={`https://wa.me/${provider.whatsapp.replace(/[^0-9]/g, "")}`} target="_blank" rel="noopener noreferrer"
                    style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--text)", textDecoration: "none", fontSize: 14, padding: "12px 16px", background: "var(--surface)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: 2 }}>
                    <span style={{ color: "#22c55e", fontSize: 18 }}>💬</span>
                    <div>
                      <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 2 }}>WhatsApp</div>
                      <div>{provider.whatsapp}</div>
                    </div>
                  </a>
                )}
                {provider.email && (
                  <a href={`mailto:${provider.email}`}
                    style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--text)", textDecoration: "none", fontSize: 14, padding: "12px 16px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 2 }}>
                    <span style={{ color: "var(--gold)", fontSize: 18 }}>✉️</span>
                    <div>
                      <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 2 }}>Email</div>
                      <div>{provider.email}</div>
                    </div>
                  </a>
                )}
                {/* Also offer in-app enquiry for paid tiers */}
                {!showEnquiry && (
                  <button onClick={() => setShowEnquiry(true)}
                    style={{ background: "transparent", border: "1px solid var(--border)", color: "var(--text-muted)", padding: "10px", fontSize: 11, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", borderRadius: 2, marginTop: 4 }}>
                    Or send a message through Stonepath →
                  </button>
                )}
              </div>
            )}

            {/* Enquiry form */}
            {showEnquiry && (
              <div>
                {enquiryError && (
                  <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171", padding: "10px 14px", fontSize: 13, marginBottom: 14, borderRadius: 2 }}>
                    {enquiryError}
                  </div>
                )}

                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div>
                      <label style={labelStyle}>Your Name *</label>
                      <input value={senderName} onChange={e => setSenderName(e.target.value)} placeholder="Jonathan Doe" style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>Your Email *</label>
                      <input type="email" value={senderEmail} onChange={e => setSenderEmail(e.target.value)} placeholder="you@email.com" style={inputStyle} />
                    </div>
                  </div>
                  <div>
                    <label style={labelStyle}>Your Phone <span style={{ textTransform: "none", color: "var(--text-muted)", fontSize: 10 }}>(optional)</span></label>
                    <input type="tel" value={senderPhone} onChange={e => setSenderPhone(e.target.value)} placeholder="+256 700 000 000" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Message *</label>
                    <textarea
                      value={enquiryMsg}
                      onChange={e => { setEnquiryMsg(e.target.value); setEnquiryError(""); }}
                      rows={4}
                      placeholder={`Hi, I'm interested in your ${(provider.categories ?? [])[0]?.name || "services"}. Could you provide more details about pricing and availability?`}
                      style={{ ...inputStyle, resize: "vertical" }}
                    />
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => { setShowEnquiry(false); setEnquiryError(""); }}
                      style={{ flex: 1, background: "transparent", border: "1px solid var(--border)", color: "var(--text-muted)", padding: "10px", fontSize: 11, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", borderRadius: 2 }}>
                      Cancel
                    </button>
                    <button onClick={handleEnquiry} disabled={enquirySending}
                      style={{ flex: 2, background: enquirySending ? "rgba(201,168,76,0.4)" : "var(--gold)", border: "none", color: "#000", padding: "10px", fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", cursor: enquirySending ? "not-allowed" : "pointer", fontFamily: "'DM Sans', sans-serif", borderRadius: 2 }}>
                      {enquirySending ? "Sending..." : "Send Enquiry"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}