"use client";

import { Icons } from '@/components/Icons';
import { useState } from "react";
import { Property } from '@/lib/api';

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

  // Use real images from API, fall back to placeholders
  const galleryImages = property.images?.length > 0
    ? property.images
    : [
        'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80',
        'https://images.unsplash.com/photo-1618219908412-a29a1bb7b86e?w=800&q=80',
        'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80',
        'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800&q=80',
        'https://images.unsplash.com/photo-1560185007-cde436f6a4d0?w=800&q=80',
      ];

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

  return (
    <div className="page-enter" style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px 120px' }}>
      <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 13, marginBottom: 24, padding: 0 }}>
        <Icons.ChevronLeft />
        <span>Back to Listings</span>
      </button>

      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 580px' }}>
          {/* Gallery */}
          <div className="gallery-main" style={{ marginBottom: 8, position: 'relative', height: 400, background: '#111' }}>
            {tour360 ? (
              <div
                className="tour-360"
                onMouseDown={e => setDragStart(e.clientX)}
                onMouseMove={e => { if (dragStart !== null) { setTourOffset(o => o + (e.clientX - dragStart) * 0.3); setDragStart(e.clientX); } }}
                onMouseUp={() => setDragStart(null)}
                style={{ cursor: 'grab', height: '100%', overflow: 'hidden', position: 'relative' }}
              >
                <div className="tour-room" style={{ transform: `translateX(${tourOffset}px)`, height: '100%', width: '300%', background: 'linear-gradient(90deg, #1a1a1a, #333, #1a1a1a)' }} />
                <div style={{ position: 'absolute', top: 16, left: 16, background: 'rgba(0,0,0,0.6)', padding: '6px 12px', color: 'var(--gold)', fontSize: 11 }}>360° TOUR — DRAG TO EXPLORE</div>
              </div>
            ) : (
              <img src={galleryImages[activeImg]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            )}
            <button onClick={() => setTour360(!tour360)} style={{ position: 'absolute', bottom: 16, right: 16, background: 'rgba(0,0,0,0.7)', border: '1px solid var(--gold)', color: 'var(--gold)', padding: '6px 14px', cursor: 'pointer' }}>
              {tour360 ? 'Photo Gallery' : '360° Tour'}
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
            {galleryImages.slice(0, 5).map((img, i) => (
              <div key={i} className={`gallery-thumb ${!tour360 && activeImg === i ? 'active' : ''}`} onClick={() => { setActiveImg(i); setTour360(false); }} style={{ height: 60, cursor: 'pointer', border: activeImg === i ? '2px solid var(--gold)' : 'none' }}>
                <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            ))}
          </div>

          {/* Property Info */}
          <div style={{ marginTop: 28 }}>
            <h2 className="font-serif" style={{ fontSize: 36, fontWeight: 300 }}>{property.title}</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>{property.address || property.location}</p>

            <div style={{ display: 'flex', gap: 24, margin: '20px 0', borderBottom: '1px solid var(--border)', paddingBottom: 20 }}>
              <span>{property.bedrooms ?? '—'} Beds</span>
              <span>{property.bathrooms ?? '—'} Baths</span>
              {property.square_footage && <span>{property.square_footage.toLocaleString()} Sqft</span>}
            </div>

            <p style={{ color: 'var(--text-muted)', lineHeight: 1.7 }}>{property.description}</p>

            {/* AI Chat */}
            <div style={{ marginTop: 28, border: '1px solid var(--border)', borderRadius: 2 }}>
              <div style={{ padding: 14, background: 'var(--surface)', height: 150, overflowY: 'auto' }}>
                {chatMessages.map((m, i) => (
                  <div key={i} style={{ textAlign: m.role === 'user' ? 'right' : 'left', margin: '5px 0' }}>
                    <span style={{ background: m.role === 'user' ? 'var(--gold)' : '#333', padding: '4px 8px', borderRadius: 4, fontSize: 13 }}>{m.text}</span>
                  </div>
                ))}
                {chatLoading && <div style={{ textAlign: 'left', margin: '5px 0', color: 'var(--text-muted)', fontSize: 13 }}>Thinking...</div>}
              </div>
              <div style={{ display: 'flex', padding: 10, gap: 8 }}>
                <input
                  className="luxe-input"
                  style={{ flex: 1 }}
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleChat()}
                  placeholder="Ask about this property..."
                />
                <button onClick={handleChat} className="luxe-btn">Send</button>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div style={{ flex: '0 0 300px' }}>
          <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', padding: 20, marginBottom: 16 }}>
            {price > 0 && (
              <div style={{ fontSize: 28, color: 'var(--gold)', marginBottom: 16, fontFamily: 'Cormorant Garamond, serif' }}>
                ${price >= 1000000 ? `${(price / 1000000).toFixed(1)}M` : `${(price / 1000).toFixed(0)}K`}
              </div>
            )}
            <h3 className="font-serif" style={{ marginBottom: 16 }}>Mortgage Calculator</h3>
            {monthlyPayment > 0 && (
              <div style={{ fontSize: 24, color: 'var(--gold)', margin: '8px 0' }}>${monthlyPayment.toLocaleString()}/mo</div>
            )}
            <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>Down Payment: {downPayment}%</label>
            <input type="range" min="5" max="50" step="5" value={downPayment} onChange={e => setDownPayment(Number(e.target.value))} style={{ width: '100%', marginBottom: 12 }} />
            <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>Interest Rate: {rate}%</label>
            <input type="range" min="3" max="12" step="0.5" value={rate} onChange={e => setRate(Number(e.target.value))} style={{ width: '100%', marginBottom: 12 }} />
            <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>Loan Term: {loanTerm} years</label>
            <input type="range" min="10" max="30" step="5" value={loanTerm} onChange={e => setLoanTerm(Number(e.target.value))} style={{ width: '100%' }} />
          </div>

          <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', padding: 20 }}>
            <h3 className="font-serif" style={{ marginBottom: 12 }}>Property Details</h3>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Status</span>
                <span style={{ color: 'var(--gold)', textTransform: 'capitalize' }}>{property.status || 'Available'}</span>
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}