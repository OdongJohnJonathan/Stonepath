"use client";

import { Icons } from '@/components/Icons';
import { useState } from "react";
import dynamic from "next/dynamic";
import { Property, enquiriesApi, inspectionsApi } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import ShortStayBookingModal from '@/components/ShortStayBookingModal';
import GuestAvailabilityCalendar from '@/components/GuestAvailabilityCalendar';

const MapView = dynamic(() => import("@/components/MapView"), {
  ssr: false,
  loading: () => (
    <div style={{ height: 280, background: "var(--surface)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: 13 }}>
      Loading map...
    </div>
  ),
});

interface PropertyDetailProps {
  property: Property;
  onBack: () => void;
  dark?: boolean;
  onViewAgent?: (agentId: string, agentName: string, agentVerified: boolean) => void;
}

export default function PropertyDetail({ property, onBack, onViewAgent }: PropertyDetailProps) {
  const { user, token } = useAuth();
  const router = useRouter();

  const [activeImg, setActiveImg]   = useState(0);
  const [tour360, setTour360]       = useState(false);
  const [tourOffset, setTourOffset] = useState(0);
  const [dragStart, setDragStart]   = useState<number | null>(null);
  const [downPayment, setDownPayment] = useState(20);
  const [loanTerm, setLoanTerm]     = useState(property.mortgage_term || 20);
  const [rate, setRate]             = useState(property.mortgage_rate || 18);

  // Short stay
  const [showShortStay, setShowShortStay] = useState(false);

  // Inspection state
  const [showInspection, setShowInspection] = useState(false);
  const [inspectionForm, setInspectionForm] = useState({
    preferred_date: '', preferred_time: '', message: '', phone_number: '', provider: 'mtn',
  });
  const [inspectionLoading, setInspectionLoading] = useState(false);
  const [inspectionBooked, setInspectionBooked]   = useState(false);
  const [inspectionError, setInspectionError]     = useState('');

  // Enquiry state
  const [showEnquiry, setShowEnquiry]     = useState(false);
  const [enquiryMessage, setEnquiryMessage] = useState('');
  const [enquiryLoading, setEnquiryLoading] = useState(false);
  const [enquirySent, setEnquirySent]     = useState(false);
  const [enquiryError, setEnquiryError]   = useState('');

  const galleryImages = property.images?.length > 0
    ? property.images
    : ['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80'];

  const price       = (property.amenities?.price as number) || 0;
  const dailyRate   = (property.amenities?.daily_rate as number) || 0;
  const maxGuests   = (property.amenities?.max_guests as number) || 0;
  const minNights   = (property.amenities?.min_nights as number) || 1;
  const isShortStay = property.transaction_type_id === 3;

  const monthlyPayment = (() => {
    if (!price) return 0;
    const principal   = price * (1 - downPayment / 100);
    const monthlyRate = rate / 100 / 12;
    const n           = loanTerm * 12;
    if (monthlyRate === 0) return Math.round(principal / n);
    return Math.round(principal * monthlyRate * Math.pow(1 + monthlyRate, n) / (Math.pow(1 + monthlyRate, n) - 1));
  })();

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

  const handleInspection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) { router.push('/login'); return; }
    setInspectionLoading(true);
    setInspectionError('');
    try {
      await inspectionsApi.book({
        property_id:    property.id,
        preferred_date: inspectionForm.preferred_date,
        preferred_time: inspectionForm.preferred_time,
        message:        inspectionForm.message,
        phone_number:   inspectionForm.phone_number,
        provider:       inspectionForm.provider,
      }, token);
      setInspectionBooked(true);
    } catch (err: unknown) {
      setInspectionError(err instanceof Error ? err.message : 'Failed to book inspection');
    } finally {
      setInspectionLoading(false);
    }
  };

  const availability = property.amenities?.availability as string | undefined;

  const amenityTags = [
    { key: 'parking', label: '🚗 Parking' },
    { key: 'garage', label: '🏠 Garage' },
    { key: 'gated', label: '🔒 Gated' },
    { key: 'generator', label: '⚡ Generator' },
    { key: 'solar', label: '☀️ Solar' },
    { key: 'borehole', label: '💧 Borehole' },
    { key: 'security', label: '👮 Security' },
    { key: 'swimming_pool', label: '🏊 Pool' },
    { key: 'furnished', label: '🛋️ Furnished' },
    { key: 'internet', label: '📶 Internet' },
    { key: 'wifi', label: '📶 WiFi' },
    { key: 'cctv', label: '📹 CCTV' },
    { key: 'elevator', label: '🛗 Elevator' },
    { key: 'air_conditioning', label: '❄️ Air Conditioning' },
    { key: 'kitchen', label: '🍳 Kitchen' },
    { key: 'washer', label: '🫧 Washer' },
    { key: 'tv', label: '📺 TV' },
  ];

  return (
    <div className="page-enter" style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px 120px' }}>

      <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 13, marginBottom: 24, padding: 0 }}>
        <Icons.ChevronLeft />
        <span>Back to Listings</span>
      </button>

      {/* Availability banner */}
      {availability === 'taken' && !isShortStay && (
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', padding: '12px 16px', marginBottom: 20, fontSize: 13, textAlign: 'center' }}>
          ⚠️ This property has been marked as <strong>taken</strong> and may no longer be available.
        </div>
      )}

      <div className="detail-layout" style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>

        {/* ── LEFT COLUMN ── */}
        <div style={{ flex: '1 1 580px' }}>

          {/* Gallery */}
          <div className="gallery-main" style={{ marginBottom: 8, position: 'relative', height: 400, background: '#111' }}>
            {tour360 ? (
              <div
                onMouseDown={e => setDragStart(e.clientX)}
                onMouseMove={e => { if (dragStart !== null) { setTourOffset(o => o + (e.clientX - dragStart) * 0.3); setDragStart(e.clientX); } }}
                onMouseUp={() => setDragStart(null)}
                style={{ cursor: 'grab', height: '100%', overflow: 'hidden', position: 'relative' }}>
                <div style={{ transform: `translateX(${tourOffset}px)`, height: '100%', width: '300%', background: 'linear-gradient(90deg, #1a1a1a, #333, #1a1a1a)' }} />
                <div style={{ position: 'absolute', top: 16, left: 16, background: 'rgba(0,0,0,0.6)', padding: '6px 12px', color: 'var(--gold)', fontSize: 11 }}>
                  360° TOUR — DRAG TO EXPLORE
                </div>
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
            {galleryImages.slice(0, 5).map((img: string, i: number) => (
              <div key={i} onClick={() => { setActiveImg(i); setTour360(false); }}
                style={{ height: 60, cursor: 'pointer', border: activeImg === i && !tour360 ? '2px solid var(--gold)' : '2px solid transparent', overflow: 'hidden' }}>
                <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            ))}
          </div>

          {/* Title */}
          <h2 className="font-serif" style={{ fontSize: 36, fontWeight: 300 }}>{property.title}</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4, marginBottom: 20, flexWrap: 'wrap' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: 0 }}>
              📍 {property.address || property.location}
              {property.district ? `, ${property.district}` : ''}
              {property.country && property.country !== 'Uganda' ? `, ${property.country}` : ''}
            </p>
            {property.created_by && onViewAgent && (
              <button
                onClick={() => onViewAgent(
                  property.created_by!,
                  property.agent_name || "View Agent",
                  property.agent_verified || false
                )}
                style={{ background: "none", border: "none", color: "var(--gold)", fontSize: 12, cursor: "pointer", padding: 0, fontFamily: "'DM Sans', sans-serif', marginTop: 4" }}>
                View agent profile →
              </button>
            )}
            {isShortStay && (
              <span style={{ background: 'rgba(201,168,76,0.15)', color: 'var(--gold)', fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 2, letterSpacing: '0.08em', textTransform: 'uppercase', border: '1px solid rgba(201,168,76,0.3)' }}>
                🏨 Short Stay
              </span>
            )}
          </div>

          {/* Quick stats */}
          <div style={{ display: 'flex', gap: 24, borderBottom: '1px solid var(--border)', paddingBottom: 20, marginBottom: 28, flexWrap: 'wrap' }}>
            {property.bedrooms !== undefined && property.bedrooms > 0 && <span>🛏 {property.bedrooms} Beds</span>}
            {property.bathrooms !== undefined && property.bathrooms > 0 && <span>🚿 {property.bathrooms} Baths</span>}
            {property.square_footage && <span>📐 {property.square_footage.toLocaleString()} Sqft</span>}
            {isShortStay && maxGuests > 0 && <span>👥 Up to {maxGuests} guests</span>}
            {isShortStay && minNights > 1 && <span>🌙 Min {minNights} days</span>}
          </div>

          {/* ── LOCATION MAP ── (its own clean section) */}
          {property.latitude && property.longitude && (
            <div style={{ border: '1px solid var(--border)', borderRadius: 2, marginBottom: 28, overflow: 'hidden' }}>
              <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  📍 Location
                </span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <a
                    href={`https://maps.google.com/?q=${property.latitude},${property.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: 11, color: 'var(--gold)', border: '1px solid var(--border)', padding: '5px 10px', borderRadius: 2, textDecoration: 'none', whiteSpace: 'nowrap' }}
                  >
                    Open in Google Maps
                  </a>
                  <a
                    href={`https://maps.apple.com/?ll=${property.latitude},${property.longitude}&q=${encodeURIComponent(property.title)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: 11, color: 'var(--gold)', border: '1px solid var(--border)', padding: '5px 10px', borderRadius: 2, textDecoration: 'none', whiteSpace: 'nowrap' }}
                  >
                    Open in Apple Maps
                  </a>
                </div>
              </div>
              <div style={{ height: 320 }}>
                <MapView
                  properties={[property]}
                  activePin={property.id}
                  setActivePin={() => {}}
                />
              </div>
            </div>
          )}

          {/* Description */}
          <p style={{ color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: 28 }}>{property.description}</p>

          {/* ── GUEST AVAILABILITY CALENDAR (short stay only) ── */}
          {isShortStay && <GuestAvailabilityCalendar propertyId={property.id} />}

          {/* Highlights */}
          <div style={{ border: '1px solid var(--border)', borderRadius: 2, marginBottom: 28 }}>
            <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', fontSize: 12, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              {isShortStay ? 'What this place offers' : 'Property Highlights'}
            </div>
            <div style={{ padding: 16, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {amenityTags.filter(a => property.amenities?.[a.key]).map(a => (
                <span key={a.key} style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '6px 12px', fontSize: 12, borderRadius: 2 }}>
                  {a.label}
                </span>
              ))}
              {(property.amenities?.floors as number) > 0 && (
                <span style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '6px 12px', fontSize: 12, borderRadius: 2 }}>
                  🏢 {property.amenities?.floors as number} Floor{(property.amenities?.floors as number) > 1 ? 's' : ''}
                </span>
              )}
              {!!property.amenities?.office_units && (
                <span style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '6px 12px', fontSize: 12, borderRadius: 2 }}>
                  🚪 {property.amenities.office_units as number} Units
                </span>
              )}
              {Boolean(property.amenities?.zoning) && (
                <span style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '6px 12px', fontSize: 12, borderRadius: 2, textTransform: 'capitalize' }}>
                  🗺️ {String(property.amenities?.zoning)} Zoning
                </span>
              )}
              {!amenityTags.some(a => property.amenities?.[a.key]) && !property.amenities?.floors && !property.amenities?.zoning && (
                <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>No highlights listed for this property.</span>
              )}
            </div>
          </div>

        </div>

        {/* ── SIDEBAR ── */}
        <div className="detail-sidebar" style={{ flex: '0 0 300px' }}>

          {/* Price / Rate */}
          <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', padding: 20, marginBottom: 16 }}>
            {isShortStay ? (
              <>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  Daily Rate
                </div>
                <div style={{ fontSize: 28, color: 'var(--gold)', fontFamily: 'Cormorant Garamond, serif' }}>
                  {dailyRate > 0 ? `${property.currency || 'UGX'} ${dailyRate.toLocaleString()}` : 'Rate on request'}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>per day</div>
                {minNights > 1 && (
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                    Minimum stay: {minNights} days
                  </div>
                )}
              </>
            ) : price > 0 ? (
              <>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  {property.transaction_type_id === 2 ? 'Monthly Rent' : 'Asking Price'}
                </div>
                <div style={{ fontSize: 28, color: 'var(--gold)', fontFamily: 'Cormorant Garamond, serif' }}>
                  {property.currency || 'UGX'} {price.toLocaleString()}
                </div>
                {property.transaction_type_id === 2 && (
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>per month</div>
                )}
              </>
            ) : null}
          </div>

          {/* ── SHORT STAY BOOKING CARD ── */}
          {isShortStay && (
            <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', padding: 20, marginBottom: 16 }}>
              <h3 className="font-serif" style={{ fontSize: 18, fontWeight: 400, marginBottom: 8 }}>Book this Space</h3>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16, lineHeight: 1.6 }}>
                {dailyRate > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span>Daily rate</span>
                    <strong style={{ color: 'var(--gold)' }}>{property.currency || 'UGX'} {dailyRate.toLocaleString()}</strong>
                  </div>
                )}
                {maxGuests > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span>Max guests</span>
                    <span>{maxGuests}</span>
                  </div>
                )}
                {minNights > 1 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Min days</span>
                    <span>{minNights}</span>
                  </div>
                )}
              </div>
              {!user ? (
                <button onClick={() => router.push('/login')}
                  style={{ width: '100%', background: 'var(--gold)', border: 'none', color: '#000', padding: '12px', fontSize: 12, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
                  Sign In to Book
                </button>
              ) : (
                <button onClick={() => setShowShortStay(true)}
                  style={{ width: '100%', background: 'var(--gold)', border: 'none', color: '#000', padding: '12px', fontSize: 12, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
                  🏨 Check Availability & Book
                </button>
              )}
            </div>
          )}

          {/* ── CONTACT AGENT (non-short-stay) ── */}
          {!isShortStay && (
            <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', padding: 20, marginBottom: 16 }}>
              <h3 className="font-serif" style={{ fontSize: 18, fontWeight: 400, marginBottom: 16 }}>Contact Agent</h3>
              {!user ? (
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>Sign in to contact the agent about this property.</p>
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
                    <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', padding: '8px 12px', fontSize: 12 }}>{enquiryError}</div>
                  )}
                  <textarea value={enquiryMessage} onChange={e => setEnquiryMessage(e.target.value)} required rows={4}
                    placeholder={`Hi, I'm interested in ${property.title}. Could you provide more details?`}
                    style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', padding: '10px 12px', fontSize: 13, resize: 'vertical', fontFamily: "'DM Sans', sans-serif", outline: 'none' }} />
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
          )}

          {/* ── BOOK INSPECTION (non-short-stay only) ── */}
          {!isShortStay && user && availability !== 'taken' && (
            <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', padding: 20, marginBottom: 16 }}>
              <h3 className="font-serif" style={{ fontSize: 18, fontWeight: 400, marginBottom: 8 }}>Book Inspection</h3>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16, lineHeight: 1.5 }}>
                Visit this property in person. A fee of <strong style={{ color: 'var(--gold)' }}>UGX 2,000</strong> confirms your booking.
              </p>

              {inspectionBooked ? (
                <div style={{ textAlign: 'center', padding: '12px 0' }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
                  <p style={{ color: '#22c55e', fontSize: 14, fontWeight: 500, marginBottom: 4 }}>Inspection Booked!</p>
                  <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>Check your email for confirmation details.</p>
                </div>
              ) : showInspection ? (
                <form onSubmit={handleInspection} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {inspectionError && (
                    <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', padding: '8px 12px', fontSize: 12 }}>
                      {inspectionError}
                    </div>
                  )}
                  <div>
                    <label style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Preferred Date *</label>
                    <input type="date" required min={new Date().toISOString().split('T')[0]}
                      value={inspectionForm.preferred_date}
                      onChange={e => setInspectionForm(f => ({ ...f, preferred_date: e.target.value }))}
                      style={{ width: '100%', background: 'var(--surface)', border: '1px solid var(--border)', padding: '8px 12px', color: 'var(--text)', fontSize: 13, outline: 'none', fontFamily: "'DM Sans', sans-serif", boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Preferred Time *</label>
                    <select required value={inspectionForm.preferred_time}
                      onChange={e => setInspectionForm(f => ({ ...f, preferred_time: e.target.value }))}
                      style={{ width: '100%', background: 'var(--surface)', border: '1px solid var(--border)', padding: '8px 12px', color: 'var(--text)', fontSize: 13, outline: 'none', fontFamily: "'DM Sans', sans-serif" }}>
                      <option value="">Select a time</option>
                      {['8:00 AM','9:00 AM','10:00 AM','11:00 AM','12:00 PM','2:00 PM','3:00 PM','4:00 PM','5:00 PM'].map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Note (optional)</label>
                    <textarea rows={2} value={inspectionForm.message}
                      onChange={e => setInspectionForm(f => ({ ...f, message: e.target.value }))}
                      placeholder="Any specific requests..."
                      style={{ width: '100%', background: 'var(--surface)', border: '1px solid var(--border)', padding: '8px 12px', color: 'var(--text)', fontSize: 13, outline: 'none', fontFamily: "'DM Sans', sans-serif", resize: 'none', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Mobile Money Number *</label>
                    <input type="tel" required value={inspectionForm.phone_number}
                      onChange={e => setInspectionForm(f => ({ ...f, phone_number: e.target.value }))}
                      placeholder="+256 700 000 000"
                      style={{ width: '100%', background: 'var(--surface)', border: '1px solid var(--border)', padding: '8px 12px', color: 'var(--text)', fontSize: 13, outline: 'none', fontFamily: "'DM Sans', sans-serif", boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Pay With</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
                      {[{ id: 'mtn', label: 'MTN', color: '#f59e0b' }, { id: 'airtel', label: 'Airtel', color: '#ef4444' }, { id: 'mpesa', label: 'M-Pesa', color: '#22c55e' }].map(p => (
                        <div key={p.id} onClick={() => setInspectionForm(f => ({ ...f, provider: p.id }))}
                          style={{ padding: '6px 4px', textAlign: 'center', border: `1px solid ${inspectionForm.provider === p.id ? p.color : 'var(--border)'}`, background: inspectionForm.provider === p.id ? `${p.color}18` : 'transparent', cursor: 'pointer', borderRadius: 2 }}>
                          <div style={{ fontSize: 11, fontWeight: 600, color: inspectionForm.provider === p.id ? p.color : 'var(--text-muted)' }}>{p.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                    <button type="button" onClick={() => setShowInspection(false)}
                      style={{ flex: 1, background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-muted)', padding: '8px', fontSize: 11, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
                      Cancel
                    </button>
                    <button type="submit" disabled={inspectionLoading}
                      style={{ flex: 2, background: inspectionLoading ? 'rgba(34,197,94,0.3)' : '#22c55e', border: 'none', color: '#000', padding: '8px', fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: inspectionLoading ? 'not-allowed' : 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
                      {inspectionLoading ? 'Booking...' : 'Pay UGX 2,000 & Book'}
                    </button>
                  </div>
                  <p style={{ fontSize: 10, color: 'var(--text-muted)', textAlign: 'center' }}>
                    In development mode, payment is confirmed instantly.
                  </p>
                </form>
              ) : (
                <button onClick={() => setShowInspection(true)}
                  style={{ width: '100%', background: 'transparent', border: '1px solid #22c55e', color: '#22c55e', padding: '12px', fontSize: 12, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
                  🏠 Book an Inspection
                </button>
              )}
            </div>
          )}

          {/* ── MORTGAGE CALCULATOR ── */}
          {!isShortStay && property.mortgage_available && price > 0 && (
            <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', padding: 20, marginBottom: 16 }}>
              <h3 className="font-serif" style={{ fontSize: 18, fontWeight: 400, marginBottom: 16 }}>Mortgage Calculator</h3>
              {monthlyPayment > 0 && (
                <div style={{ fontSize: 24, color: 'var(--gold)', marginBottom: 16 }}>
                  {property.currency || 'UGX'} {monthlyPayment.toLocaleString()}/mo
                </div>
              )}
              <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>Down Payment: {downPayment}%</label>
              <input type="range" min="5" max="50" step="5" value={downPayment} onChange={e => setDownPayment(Number(e.target.value))} style={{ width: '100%', marginBottom: 12 }} />
              <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>Interest Rate: {rate}%</label>
              <input type="range" min="3" max="30" step="0.5" value={rate} onChange={e => setRate(Number(e.target.value))} style={{ width: '100%', marginBottom: 12 }} />
              <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>Loan Term: {loanTerm} years</label>
              <input type="range" min="5" max="30" step="5" value={loanTerm} onChange={e => setLoanTerm(Number(e.target.value))} style={{ width: '100%' }} />
            </div>
          )}

          {/* ── PROPERTY DETAILS ── */}
          <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', padding: 20 }}>
            <h3 className="font-serif" style={{ fontSize: 18, fontWeight: 400, marginBottom: 12 }}>Property Details</h3>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Type</span>
                <span style={{ color: 'var(--text)', textTransform: 'capitalize' }}>
                  {isShortStay ? 'Short Stay' : property.transaction_type_id === 2 ? 'For Rent' : 'For Sale'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Location</span>
                <span style={{ color: 'var(--text)' }}>{property.location}</span>
              </div>
              {property.district && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>District</span>
                  <span style={{ color: 'var(--text)' }}>{property.district}</span>
                </div>
              )}
              {property.country && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Country</span>
                  <span style={{ color: 'var(--text)' }}>{property.country}</span>
                </div>
              )}
              {property.bedrooms !== undefined && property.bedrooms > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Bedrooms</span><span style={{ color: 'var(--text)' }}>{property.bedrooms}</span>
                </div>
              )}
              {property.bathrooms !== undefined && property.bathrooms > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Bathrooms</span><span style={{ color: 'var(--text)' }}>{property.bathrooms}</span>
                </div>
              )}
              {property.square_footage && !isShortStay && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Area</span><span style={{ color: 'var(--text)' }}>{property.square_footage.toLocaleString()} sqft</span>
                </div>
              )}
              {isShortStay && maxGuests > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Max Guests</span><span style={{ color: 'var(--text)' }}>{maxGuests}</span>
                </div>
              )}
              {isShortStay && minNights > 1 && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Min Days</span><span style={{ color: 'var(--text)' }}>{minNights}</span>
                </div>
              )}
              {property.currency && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Currency</span><span style={{ color: 'var(--text)' }}>{property.currency}</span>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Short Stay Booking Modal */}
      {showShortStay && (
        <ShortStayBookingModal
          property={property}
          onClose={() => setShowShortStay(false)}
        />
      )}

    </div>
  );
}