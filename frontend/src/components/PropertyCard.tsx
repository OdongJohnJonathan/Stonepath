"use client";

import { Icons } from '@/components/Icons';
import { useState } from "react";
import { Property } from '@/types';

// Define the props the component expects
interface PropertyCardProps {
  property: Property;
  onView: (property: Property) => void;
  onSave: (id: number) => void;
  saved: boolean;
}

// KEEP THIS ONE - It is outside the function and has the Type definition
const tagColors: Record<string, string> = {
  Exclusive: "badge-gold",
  New: "badge-gold",
  Premium: "badge-gold",
  Verified: "badge-gold",
  "Price Drop": "badge-gold",
};

export default function PropertyCard({ property, onView, onSave, saved }: PropertyCardProps) {
  const [hovered, setHovered] = useState(false);
  
  // Added ': number' so TypeScript knows 'p' is a number
  const formatPrice = (p: number) => 
    p >= 1000000 ? `$${(p/1000000).toFixed(1)}M` : `$${(p/1000).toFixed(0)}K`;

  // I DELETED THE OLD 'tagColors' FROM HERE

  return (
    <div 
      className="property-card fade-up" 
      onMouseEnter={() => setHovered(true)} 
      onMouseLeave={() => setHovered(false)}
    >
      <div className="card-img-wrap">
        <img src={property.image} alt={property.title} loading="lazy" />
        <div className="quick-view-overlay" onClick={() => onView(property)}>
          <button className="luxe-btn" style={{ letterSpacing: '0.15em' }}>
            Quick View
          </button>
        </div>
        
        {/* Badges */}
        <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', gap: 6, alignItems: 'center' }}>
          {/* This now looks at the 'tagColors' outside the function */}
          <div className={`badge ${tagColors[property.tag] || 'badge-gold'} tooltip`}>
            <Icons.Check />
            {property.tag}
            <span className="tooltip-text">Verified by LuxeEstate™ agents</span>
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
            <p style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 4 }}>
              {property.type}
            </p>
            <h3 className="font-serif" style={{ fontSize: 18, fontWeight: 400, color: 'var(--text)', lineHeight: 1.2 }}>
              {property.title}
            </h3>
          </div>
          <span style={{ fontSize: 18, fontWeight: 600, color: 'var(--text)', fontFamily: 'Cormorant Garamond, serif' }}>
            {formatPrice(property.price)}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 14, color: 'var(--text-muted)', fontSize: 12 }}>
          <Icons.MapPin />
          <span>{property.address}</span>
        </div>

        <div style={{ display: 'flex', gap: 16, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
          {[
            { icon: <Icons.Bed />, val: property.beds, label: 'Beds' },
            { icon: <Icons.Bath />, val: property.baths, label: 'Baths' },
            { icon: <Icons.Sqft />, val: `${(property.sqft/1000).toFixed(1)}K`, label: 'Sqft' },
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