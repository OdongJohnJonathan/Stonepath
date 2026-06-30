"use client";

import { Icons } from '@/components/Icons';
import { useState } from "react";

export interface HeroSearchParams {
  location: string;
  propertyTypeId: number | null;   // 1 Residential, 2 Commercial, 3 Land
  transactionTypeId: number | null; // 1 Sale, 2 Rent, 3 Short Stay
  maxPrice: number | null;
}

interface HeroSectionProps {
  onSearch: (params: HeroSearchParams) => void;
  dark?: boolean;
}

export default function HeroSection({ onSearch, dark }: HeroSectionProps) {
  const [location, setLocation] = useState('');
  const [propType, setPropType] = useState('');
  const [transactionType, setTransactionType] = useState('');
  const [priceRange, setPriceRange] = useState('');

  const propertyTypeMap: Record<string, number> = {
    residential: 1,
    commercial: 2,
    land: 3,
  };

  const transactionTypeMap: Record<string, number> = {
    sale: 1,
    rent: 2,
    short_stay: 3,
  };

  const priceMap: Record<string, number> = {
    '0-50M': 50_000_000,
    '50M-200M': 200_000_000,
    '200M-500M': 500_000_000,
    '500M+': Infinity,
  };

  const handleSearch = () => {
    onSearch({
      location: location.trim(),
      propertyTypeId: propType ? propertyTypeMap[propType] : null,
      transactionTypeId: transactionType ? transactionTypeMap[transactionType] : null,
      maxPrice: priceRange ? priceMap[priceRange] : null,
    });
  };

  return (
    <div style={{ position: 'relative', height: '100vh', minHeight: 600, display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
      <div className="hero-bg" />
      <div className="hero-img" />
      <div className="hero-grain" />

      {/* Decorative lines */}
      <div style={{ position: 'absolute', top: 0, left: '50%', width: 1, height: '30%', background: 'linear-gradient(to bottom, transparent, rgba(201,168,76,0.3))', transform: 'translateX(-50%)' }} />

      <div style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: 900, margin: '0 auto', padding: '0 24px', paddingTop: 80 }}>
        {/* Eyebrow */}
        <div className="fade-up" style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <span className="gold-line" />
          <span style={{ fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 500 }}>
            Exceptional Properties. Curated for You.
          </span>
        </div>

        {/* Headline */}
        <h1 className="font-serif fade-up stagger-1 hero-title" style={{ fontSize: '5.5rem', fontWeight: 300, color: 'white', lineHeight: 1.0, marginBottom: 32, letterSpacing: '-0.02em' }}>
          Where Luxury<br />
          <em style={{ color: 'var(--gold)', fontStyle: 'italic' }}>Finds Home</em>
        </h1>

        {/* Search Card */}
        <div className="glass fade-up stagger-2" style={{ borderRadius: 4, overflow: 'hidden' }}>
          <div className="hero-search-row" style={{ display: 'flex', flexWrap: 'wrap' }}>

            {/* Location input */}
            <div style={{
              flex: '2 0 220px',
              padding: '12px 16px',
              borderRight: '1px solid rgba(255,255,255,0.08)',
              display: 'flex', alignItems: 'center', gap: 10,
              minWidth: 0,
            }}>
              <Icons.MapPin />
              <input
                className="search-input"
                placeholder="City or area, e.g. Kampala…"
                value={location}
                onChange={e => setLocation(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                style={{ fontSize: 14, minWidth: 0 }}
              />
            </div>

            {/* Property type */}
            <div style={{ flex: '1 0 140px', padding: '12px 16px', borderRight: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,0.5)', minWidth: 0 }}>
              <Icons.Building />
              <select className="search-input" style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }} value={propType} onChange={e => setPropType(e.target.value)}>
                <option value="">Type</option>
                <option value="residential">Residential</option>
                <option value="commercial">Commercial</option>
                <option value="land">Land</option>
              </select>
            </div>

            {/* Listing type */}
            <div style={{ flex: '1 0 140px', padding: '12px 16px', borderRight: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,0.5)', minWidth: 0 }}>
              <Icons.Check />
              <select className="search-input" style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }} value={transactionType} onChange={e => setTransactionType(e.target.value)}>
                <option value="">Listing</option>
                <option value="sale">For Sale</option>
                <option value="rent">For Rent</option>
                <option value="short_stay">Short Stay</option>
              </select>
            </div>

            {/* Max price */}
            <div style={{ flex: '1 0 160px', padding: '12px 16px', borderRight: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,0.5)', minWidth: 0 }}>
              <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.02em' }}>UGX</span>
              <select className="search-input" style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }} value={priceRange} onChange={e => setPriceRange(e.target.value)}>
                <option value="">Max Price</option>
                <option value="0-50M">Under UGX 50M</option>
                <option value="50M-200M">UGX 50M – 200M</option>
                <option value="200M-500M">UGX 200M – 500M</option>
                <option value="500M+">UGX 500M+</option>
              </select>
            </div>

            {/* Search button */}
            <div style={{ flexShrink: 0, padding: '8px 12px', display: 'flex', alignItems: 'center' }}>
              <button className="luxe-btn" onClick={handleSearch} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', whiteSpace: 'nowrap' }}>
                <Icons.Search />
                <span>Search</span>
              </button>
            </div>

          </div>
        </div>

        {/* Stats */}
        <div className="hero-stats fade-up stagger-3" style={{ display: 'flex', gap: 32, marginTop: 32, paddingTop: 24 }}>
          {[['2,400+', 'Premium Listings'], ['UGX 4.2B+', 'Properties Sold'], ['98%', 'Client Satisfaction']].map(([val, label]) => (
            <div key={label}>
              <div className="font-serif" style={{ fontSize: 24, fontWeight: 400, color: 'white' }}>{val}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll indicator */}
      <div style={{ position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, animation: 'bounce 2s infinite' }}>
        <div style={{ width: 1, height: 40, background: 'linear-gradient(to bottom, transparent, rgba(201,168,76,0.6))' }} />
        <div style={{ fontSize: 10, letterSpacing: '0.15em', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' }}>Scroll</div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes bounce { 0%,100% { transform: translateX(-50%) translateY(0); } 50% { transform: translateX(-50%) translateY(-8px); } }
      `}</style>
    </div>
  );
}