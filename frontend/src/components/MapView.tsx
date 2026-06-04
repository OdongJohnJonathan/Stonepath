"use client";

import { Icons } from '@/components/Icons';
import { Property } from '@/lib/api';

interface MapViewProps {
  activePin: string | null;
  setActivePin: (id: string | null) => void;
  properties: Property[];
}

export default function MapView({ activePin, setActivePin, properties }: MapViewProps) {
  // Generate pseudo-positions for pins since we don't have real lat/lng yet
  const pinPositions = [
    { top: 30, left: 25 },
    { top: 55, left: 60 },
    { top: 20, left: 70 },
    { top: 70, left: 35 },
    { top: 45, left: 80 },
    { top: 65, left: 55 },
  ];

  return (
    <div className="map-container" style={{ height: '100%', minHeight: 400, position: 'relative' }}>
      {/* Map grid lines */}
      <div style={{ position: 'absolute', inset: 0, opacity: 0.3 }}>
        {[...Array(8)].map((_, i) => (
          <div key={`h-${i}`} style={{ position: 'absolute', top: `${10 + i * 12}%`, left: 0, right: 0, height: 1, background: 'var(--gold)', opacity: 0.15 }} />
        ))}
        {[...Array(6)].map((_, i) => (
          <div key={`v-${i}`} style={{ position: 'absolute', left: `${8 + i * 16}%`, top: 0, bottom: 0, width: 1, background: 'var(--gold)', opacity: 0.15 }} />
        ))}
      </div>

      {/* Road lines */}
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.15 }}>
        <path d="M 0 40% Q 30% 35% 60% 50% T 100% 45%" stroke="var(--gold)" fill="none" strokeWidth="2" />
        <path d="M 20% 0 Q 25% 40% 30% 100%" stroke="var(--gold)" fill="none" strokeWidth="1.5" />
        <path d="M 70% 0 Q 65% 50% 75% 100%" stroke="var(--gold)" fill="none" strokeWidth="1.5" />
        <path d="M 0 70% Q 50% 60% 100% 75%" stroke="var(--gold)" fill="none" strokeWidth="1" />
      </svg>

      {/* Compass */}
      <div style={{ position: 'absolute', top: 12, right: 12, width: 40, height: 40, borderRadius: '50%', border: '1px solid var(--border)', background: 'var(--card-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: 'var(--gold)', fontWeight: 600 }}>N</div>

      {/* Scale */}
      <div style={{ position: 'absolute', bottom: 12, left: 12, display: 'flex', alignItems: 'flex-end', gap: 4 }}>
        <div style={{ width: 40, height: 2, background: 'var(--gold)', opacity: 0.5 }} />
        <span style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.08em' }}>1 KM</span>
      </div>

      {/* Property pins */}
      {properties.map((property, index) => {
        const pos = pinPositions[index % pinPositions.length];
        const price = property.amenities?.price as number | undefined;
        const priceLabel = price
          ? price >= 1000000 ? `$${(price / 1000000).toFixed(1)}M` : `$${(price / 1000).toFixed(0)}K`
          : 'POA';

        return (
          <div
            key={property.id}
            className="map-pin"
            style={{ top: `${pos.top}%`, left: `${pos.left}%`, position: 'absolute' }}
            onClick={() => setActivePin(activePin === property.id ? null : property.id)}
          >
            <div className={`pin-bubble ${activePin === property.id ? 'expanded' : ''}`}>
              {activePin === property.id
                ? `${property.title} · ${priceLabel}`
                : priceLabel}
            </div>
            <div className="pin-tip" />
          </div>
        );
      })}

      {/* Empty state */}
      {properties.length === 0 && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
          No properties to show on map yet.
        </div>
      )}
    </div>
  );
}