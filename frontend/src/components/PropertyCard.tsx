"use client";

import { Icons } from '@/components/Icons';
import { useState } from "react";
import { Property } from '@/lib/api';

interface PropertyCardProps {
  property: Property;
  onView: (property: Property) => void;
  onSave: (id: string) => void;
  saved: boolean;
}

export default function PropertyCard({ property, onView, onSave, saved }: PropertyCardProps) {
  const [hovered, setHovered] = useState(false);

  const isShortStay = property.transaction_type_id === 3;
  const currency = property.currency || 'UGX';

  const formatPrice = (amenities?: Record<string, unknown>) => {
    const price = isShortStay
      ? (amenities?.daily_rate as number | undefined)
      : (amenities?.price as number | undefined);

    if (!price) return "Price on Request";

    const formatted = price >= 1000000
      ? `${currency} ${(price / 1000000).toFixed(1)}M`
      : `${currency} ${(price / 1000).toFixed(0)}K`;

    return isShortStay ? `${formatted}/day` : formatted;
  };

  const thumbnail = property.images?.[0] || "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80";

  return (
    <div
      className="property-card fade-up"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="card-img-wrap">
        <img src={thumbnail} alt={property.title} loading="lazy" />
        <div className="quick-view-overlay" onClick={() => onView(property)}>
          <button className="luxe-btn" style={{ letterSpacing: '0.15em' }}>
            Quick View
          </button>
        </div>

        {/* Badges */}
        <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', gap: 6, flexDirection: 'column' }}>
          {property.is_featured && (
            <div style={{ background: 'var(--gold)', color: '#000', padding: '3px 8px', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              ⭐ Featured
            </div>
          )}
          {isShortStay && (
            <div style={{ background: '#22c55e', color: '#000', padding: '3px 8px', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              🏨 Short Stay
            </div>
          )}
          <div className="badge badge-gold">
            <Icons.Check />
            {property.status || 'Active'}
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={(e) => { e.stopPropagation(); onSave(property.id); }}
          style={{
            position: 'absolute', top: 12, right: 12,
            background: 'rgba(10,10,11,0.6)', border: 'none',
            borderRadius: '50%', width: 32, height: 32,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: saved ? '#ef4444' : 'white',
            backdropFilter: 'blur(8px)',
          }}
        >
          <Icons.Heart filled={saved} />
        </button>
      </div>

      <div style={{ padding: '18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <p style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gold)', margin: 0 }}>
                {property.location}{property.district ? `, ${property.district}` : ''}
              </p>
              {property.agent_verified && (
                <span title="Verified Agent" style={{ background: 'rgba(201,168,76,0.15)', color: 'var(--gold)', fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 2, letterSpacing: '0.08em', textTransform: 'uppercase', border: '1px solid rgba(201,168,76,0.3)' }}>
                  ✓ Verified
                </span>
              )}
            </div>
            <h3 className="font-serif" style={{ fontSize: 18, fontWeight: 400, color: 'var(--text)', lineHeight: 1.2 }}>
              {property.title}
            </h3>
          </div>
          <span style={{ fontSize: 18, fontWeight: 600, color: 'var(--text)', fontFamily: 'Cormorant Garamond, serif', whiteSpace: 'nowrap', marginLeft: 8 }}>
            {formatPrice(property.amenities)}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 14, color: 'var(--text-muted)', fontSize: 12 }}>
          <Icons.MapPin />
          <span>{property.address || property.location}</span>
        </div>

        <div style={{ display: 'flex', gap: 16, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
          {[
            { icon: <Icons.Bed />, val: property.bedrooms ?? '—', label: 'Beds' },
            { icon: <Icons.Bath />, val: property.bathrooms ?? '—', label: 'Baths' },
            { icon: <Icons.Sqft />, val: property.square_footage ? `${(property.square_footage / 1000).toFixed(1)}K` : '—', label: 'Sqft' },
          ].map(({ icon, val, label }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--text-muted)', fontSize: 12 }}>
              {icon}
              <span style={{ fontWeight: 500, color: 'var(--text)' }}>{val}</span>
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}