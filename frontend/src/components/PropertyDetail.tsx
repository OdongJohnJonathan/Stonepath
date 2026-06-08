"use client";

import { Icons } from '@/components/Icons';
import { useState } from "react";
import { Property, enquiriesApi } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

interface ChatMessage {
  role: 'bot' | 'user';
  text: string;
}

interface PropertyDetailProps {
  property: Property;
  onBack: () => void;
  dark?: boolean;
}

export default function PropertyDetail({ property, onBack }: PropertyDetailProps) {
  const { user, token } = useAuth();
  const router = useRouter();

  const [activeImg, setActiveImg] = useState(0);
  const [tour360, setTour360] = useState(false);
  const [tourOffset, setTourOffset] = useState(0);
  const [dragStart, setDragStart] = useState<number | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { role: 'bot', text: `Welcome! I'm your AI concierge for ${property.title}. Ask me anything about this property.` }
  ]);
  const [chatLoading, setChatLoading] = useState(false);
  const [downPayment, setDownPayment] = useState(20);
  const [loanTerm, setLoanTerm] = useState(30);
  const [rate, setRate] = useState(6.5);

  // Enquiry state
  const [showEnquiry, setShowEnquiry] = useState(false);
  const [enquiryMessage, setEnquiryMessage] = useState('');
  const [enquiryLoading, setEnquiryLoading] = useState(false);
  const [enquirySent, setEnquirySent] = useState(false);
  const [enquiryError, setEnquiryError] = useState('');

  const galleryImages = property.images?.length > 0
    ? property.images
    : ['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80'];

  const price = (property.amenities?.price as number) || 0;

  const monthlyPayment = (() => {
    if (!price) return 0;
    const principal = price * (1 - downPayment / 100);
    const monthlyRate = rate / 100 / 12;
    const n = loanTerm * 12;
    if (monthlyRate === 0) return Math.round(principal / n);
    return Math.round(principal * monthlyRate * Math.pow(1 + monthlyRate, n) / (Math.pow(1 + monthlyRate, n) - 1));
  })();

  const handleChat = async () => {
    if (!chatInput.trim()) return;
    const userMsg = chatInput;
    setChatInput('');
    setChatMessages(m => [...m, { role: 'user', text: userMsg }]);
    setChatLoading(true);
    setTimeout(() => {
      setChatMessages(m => [...m, { role: 'bot', text: "I'd be happy to arrange a private viewing or provide more details about this property." }]);
      setChatLoading(false);
    }, 1500);
  };

  const handleEnquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) { router.push('/login'); return; }
    if (!enquiryMessage.trim()) return;

    setEnquiryLoading(true);
    setEnquiryError('');

    try {
      await enquiriesApi.send({ property_id: property.id, message: enquiryMessage }, token);
      setEnquirySent(true);
      setEnquiryMessage('');
    } catch (err: unknown) {
      setEnquiryError(err instanceof Error ? err.message : 'Failed to send enquiry');
    } finally {
      setEnquiryLoading(false);
    }
  };

  const availability = property.amenities?.availability as string | undefined;

  return (
    <div className="page-enter" style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px 120px' }}>
      <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 13, marginBottom: 24, padding: 0 }}>
        <Icons.ChevronLeft />
        <span>Back to Listings</span>
      </button>

      {/* Availability banner */}
      {availability === 'taken' && (
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', padding: '12px 16px', marginBottom: 20, fontSize: 13, textAlign: 'center' }}>
          ⚠️ This property has been marked as <strong>taken</strong> and may no longer be available.
        </div>
      )}

      <div className="detail-layout" style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 580px' }}>

          {/* Gallery */}
          <div className="gallery-main" style={{ marginBottom: 8, position: 'relative', height: 400, background: '#111' }}>
            {tour360 ? (
              <div
                onMouseDown={e => setDragStart(e.clientX)}
                onMouseMove={e => { if (dragStart !== null) { setTourOffset(o => o + (e.clientX - dragStart) * 0.3); setDragStart(e.clientX); } }}
                onMouseUp={() => setDragStart(null)}
                style={{ cursor: 'grab', height: '100%', overflow: 'hidden', position: 'relative' }}
              >
                <div style={{ transform: `translateX(${tourOffset}px)`, height: '100%', width: '300%', background: 'linear-gradient(90deg, #1a1a1a, #333, #1a1a1a)' }} />
                <div style={{ position: 'absolute', top: 16, left: 16, background: 'rgba(0,0,0,0.6)', padding: '6px 12px', color: 'var(--gold)', fontSize: 11 }}>360° TOUR — DRAG TO EXPLORE</div>
              </div>
            ) : (
              <img src={galleryImages[activeImg]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            )}
            <button onClick={() => setTour360(!tour360)} style={{ position: 'absolute', bottom: 16, right: 16, background: 'rgba(0,0,0,0.7)', border: '1px solid var(--gold)', color: 'var(--gold)', padding: '6px 14px', cursor: 'pointer' }}>
              {tour360 ? 'Photo Gallery' : '360° Tour'}
            </button>
          </div>

          {/* Thumbnails */}
          <div className="gallery-thumbs" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginBottom: 28 }}>
            {galleryImages.slice(0, 5).map((img, i) => (
              <div key={i} onClick={() => { setActiveImg(i); setTour360(false); }}
                style={{ height: 60, cursor: 'pointer', border: activeImg === i && !tour360 ? '2px solid var(--gold)' : '2px solid transparent', overflow: 'hidden' }}>
                <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            ))}
          </div>

          {/* Info */}
          <h2 className="font-serif" style={{ fontSize: 36, fontWeight: 300 }}>{property.title}</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4, marginBottom: 20 }}>
            📍 {property.address || property.location}
          </p>

          <div style={{ display: 'flex', gap: 24, borderBottom: '1px solid var(--border)', paddingBottom: 20, marginBottom: 20 }}>
            <span>{property.bedrooms ?? '—'} Beds</span>
            <span>{property.bathrooms ?? '—'} Baths</span>
            {property.square_footage && <span>{property.square_footage.toLocaleString()} Sqft</span>}
          </div>

          <p style={{ color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: 28 }}>{property.description}</p>

          {/* AI Chat */}
          <div style={{ border: '1px solid var(--border)', borderRadius: 2, marginBottom: 28 }}>
            <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', fontSize: 12, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              AI Property Concierge
            </div>
            <div style={{ padding: 14, background: 'var(--surface)', height: 150, overflowY: 'auto' }}>
              {chatMessages.map((m, i) => (
                <div key={i} style={{ textAlign: m.role === 'user' ? 'right' : 'left', margin: '5px 0' }}>
                  <span style={{ background: m.role === 'user' ? 'var(--gold)' : '#333', color: m.role === 'user' ? '#000' : '#fff', padding: '6px 10px', borderRadius: 4, fontSize: 13, display: 'inline-block', maxWidth: '80%' }}>{m.text}</span>
                </div>
              ))}
              {chatLoading && <div style={{ color: 'var(--text-muted)', fontSize: 13, padding: '5px 0' }}>Thinking...</div>}
            </div>
            <div style={{ display: 'flex', padding: 10, gap: 8, borderTop: '1px solid var(--border)' }}>
              <input className="luxe-input" style={{ flex: 1 }} value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleChat()} placeholder="Ask about this property..." />
              <button onClick={handleChat} className="luxe-btn">Send</button>
            </div>
          </div>

        </div>

        {/* Sidebar */}
        <div className="detail-sidebar" style={{ flex: '0 0 300px' }}>

          {/* Price */}
          {price > 0 && (
          <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', padding: 20, marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              {property.transaction_type_id === 2 ? 'Monthly Rent' : 'Asking Price'}
            </div>
            <div style={{ fontSize: 28, color: 'var(--gold)', fontFamily: 'Cormorant Garamond, serif' }}>
              {property.currency || 'UGX'} {price.toLocaleString()}
            </div>
            {property.transaction_type_id === 2 && (
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>per month</div>
            )}
          </div>
        )}

          {/* Contact Agent / Enquiry Form */}
          <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', padding: 20, marginBottom: 16 }}>
            <h3 className="font-serif" style={{ fontSize: 18, fontWeight: 400, marginBottom: 16 }}>Contact Agent</h3>

            {!user ? (
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
                  Sign in to contact the agent about this property.
                </p>
                <button onClick={() => router.push('/login')}
                  style={{ width: '100%', background: 'var(--gold)', border: 'none', color: '#0a0a0b', padding: '12px', fontSize: 12, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
                  Sign In to Enquire
                </button>
              </div>
            ) : enquirySent ? (
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
                <p style={{ color: '#22c55e', fontSize: 14, fontWeight: 500, marginBottom: 4 }}>Enquiry Sent!</p>
                <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>The agent will get back to you shortly.</p>
                <button onClick={() => { setEnquirySent(false); setShowEnquiry(false); }}
                  style={{ marginTop: 12, background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-muted)', padding: '8px 16px', fontSize: 11, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
                  Send Another
                </button>
              </div>
            ) : showEnquiry ? (
              <form onSubmit={handleEnquiry} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {enquiryError && (
                  <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', padding: '8px 12px', fontSize: 12 }}>
                    {enquiryError}
                  </div>
                )}
                <textarea
                  value={enquiryMessage}
                  onChange={e => setEnquiryMessage(e.target.value)}
                  required
                  rows={4}
                  placeholder={`Hi, I'm interested in ${property.title}. Could you provide more details?`}
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', padding: '10px 12px', fontSize: 13, resize: 'vertical', fontFamily: "'DM Sans', sans-serif", outline: 'none' }}
                />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" onClick={() => setShowEnquiry(false)}
                    style={{ flex: 1, background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-muted)', padding: '10px', fontSize: 11, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
                    Cancel
                  </button>
                  <button type="submit" disabled={enquiryLoading}
                    style={{ flex: 2, background: enquiryLoading ? 'rgba(201,168,76,0.5)' : 'var(--gold)', border: 'none', color: '#0a0a0b', padding: '10px', fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: enquiryLoading ? 'not-allowed' : 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
                    {enquiryLoading ? 'Sending...' : 'Send Enquiry'}
                  </button>
                </div>
              </form>
            ) : (
              <button onClick={() => setShowEnquiry(true)}
                style={{ width: '100%', background: 'var(--gold)', border: 'none', color: '#0a0a0b', padding: '12px', fontSize: 12, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
                📩 Send Enquiry
              </button>
            )}
          </div>

          {/* Mortgage Calculator */}
          {/* Mortgage Calculator — only if agent enabled it */}
          {property.mortgage_available && price > 0 && (
            <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', padding: 20, marginBottom: 16 }}>
              <h3 className="font-serif" style={{ fontSize: 18, fontWeight: 400, marginBottom: 16 }}>
                Mortgage Calculator
              </h3>
              {monthlyPayment > 0 && (
                <div style={{ fontSize: 24, color: 'var(--gold)', marginBottom: 16 }}>
                  {property.currency || 'UGX'} {monthlyPayment.toLocaleString()}/mo
                </div>
              )}
              <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>Down Payment: {downPayment}%</label>
              <input type="range" min="5" max="50" step="5" value={downPayment} onChange={e => setDownPayment(Number(e.target.value))} style={{ width: '100%', marginBottom: 12 }} />
              <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Interest Rate: {property.mortgage_rate || rate}%
              </label>
              <input type="range" min="3" max="30" step="0.5"
                value={property.mortgage_rate || rate}
                onChange={e => setRate(Number(e.target.value))}
                style={{ width: '100%', marginBottom: 12 }} />
              <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Loan Term: {property.mortgage_term || loanTerm} years
              </label>
              <input type="range" min="5" max="30" step="5"
                value={property.mortgage_term || loanTerm}
                onChange={e => setLoanTerm(Number(e.target.value))}
                style={{ width: '100%' }} />
            </div>
          )}

          {/* Property Details */}
          <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', padding: 20 }}>
            <h3 className="font-serif" style={{ fontSize: 18, fontWeight: 400, marginBottom: 12 }}>Property Details</h3>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Status</span>
                <span style={{ color: availability === 'taken' ? '#f87171' : '#22c55e', textTransform: 'capitalize' }}>
                  {availability === 'taken' ? 'Taken' : 'Available'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Location</span>
                <span style={{ color: 'var(--text)' }}>{property.location}</span>
              </div>
              {property.bedrooms !== undefined && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Bedrooms</span>
                  <span style={{ color: 'var(--text)' }}>{property.bedrooms}</span>
                </div>
              )}
              {property.bathrooms !== undefined && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Bathrooms</span>
                  <span style={{ color: 'var(--text)' }}>{property.bathrooms}</span>
                </div>
              )}
              {property.square_footage && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Area</span>
                  <span style={{ color: 'var(--text)' }}>{property.square_footage.toLocaleString()} sqft</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Listing Type</span>
                <span style={{ color: 'var(--text)' }}>{property.transaction_type_id === 2 ? 'For Rent' : 'For Sale'}</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}