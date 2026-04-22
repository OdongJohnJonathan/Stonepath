"use client";

import { Icons } from '@/components/Icons';
import { MAP_PINS } from '@/lib/constants';

// Define the shape of a Pin
interface MapPin {
  id: number;
  lat: number;
  lng: number;
  title: string;
  price: string;
}

interface MapViewProps {
  activePin: number | null;
  setActivePin: (id: number | null) => void;
  properties?: any[]; // Kept for prop consistency
}

export default function MapView({ activePin, setActivePin }: MapViewProps) {
  return (
    <div className="map-container" style={{ height: '100%', minHeight: 400, position: 'relative' }}>
      {/* Fake map terrain */}
      <div style={{ position: 'absolute', inset: 0, opacity: 0.3 }}>
        {[...Array(8)].map((_, i) => (
          <div key={`h-line-${i}`} style={{
            position: 'absolute',
            top: `${10 + i * 12}%`, left: 0, right: 0,
            height: 1,
            background: 'var(--gold)',
            opacity: 0.15,
          }} />
        ))}
        {[...Array(6)].map((_, i) => (
          <div key={`v-line-${i}`} style={{
            position: 'absolute',
            left: `${8 + i * 16}%`, top: 0, bottom: 0,
            width: 1,
            background: 'var(--gold)',
            opacity: 0.15,
          }} />
        ))}
      </div>

      {/* Road-like lines */}
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.15 }}>
        <path d="M 0 40% Q 30% 35% 60% 50% T 100% 45%" stroke="var(--gold)" fill="none" strokeWidth="2"/>
        <path d="M 20% 0 Q 25% 40% 30% 100%" stroke="var(--gold)" fill="none" strokeWidth="1.5"/>
        <path d="M 70% 0 Q 65% 50% 75% 100%" stroke="var(--gold)" fill="none" strokeWidth="1.5"/>
        <path d="M 0 70% Q 50% 60% 100% 75%" stroke="var(--gold)" fill="none" strokeWidth="1"/>
      </svg>

      {/* Compass */}
      <div style={{ position: 'absolute', top: 12, right: 12, width: 40, height: 40, borderRadius: '50%', border: '1px solid var(--border)', background: 'var(--card-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: 'var(--gold)', fontWeight: 600 }}>N</div>

      {/* Scale */}
      <div style={{ position: 'absolute', bottom: 12, left: 12, display: 'flex', alignItems: 'flex-end', gap: 4 }}>
        <div style={{ width: 40, height: 2, background: 'var(--gold)', opacity: 0.5 }} />
        <span style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.08em' }}>1 MI</span>
      </div>

      {/* Pins */}
      {(MAP_PINS as MapPin[]).map(pin => (
        <div
          key={pin.id}
          className="map-pin"
          style={{ top: `${pin.lat}%`, left: `${pin.lng}%`, position: 'absolute' }}
          onClick={() => setActivePin(activePin === pin.id ? null : pin.id)}
        >
          <div className={`pin-bubble ${activePin === pin.id ? 'expanded' : ''}`}>
            {activePin === pin.id ? (
              <span>{pin.title} · {pin.price}</span>
            ) : pin.price}
          </div>
          <div className="pin-tip" />
        </div>
      ))}
    </div>
  );
}