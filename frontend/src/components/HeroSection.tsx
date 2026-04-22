"use client";

import { Icons } from '@/components/Icons';
import { useState } from "react";

// Define the props for the Hero Section
interface HeroSectionProps {
  onSearch: () => void; // This tells TS that onSearch is a function that returns nothing
  dark?: boolean;       // The '?' means this prop is optional
}

export default function HeroSection({ onSearch, dark }: HeroSectionProps) {
  const [searchMode, setSearchMode] = useState('buy');
  const [aiInput, setAiInput] = useState('');
  const [propType, setPropType] = useState('');
  const [priceRange, setPriceRange] = useState('');
  const [thinking, setThinking] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState('');

  const handleAiSearch = async () => {
    if (!aiInput.trim()) return;
    setThinking(true);
    setAiSuggestion('');
    
    // Simulate AI response delay
    await new Promise(r => setTimeout(r, 1400));
    setThinking(false);
    setAiSuggestion(`Curating properties that match your lifestyle: "${aiInput}" — waterfront estates, private gardens & concierge services.`);
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
        <div className="glass fade-up stagger-2" style={{ borderRadius: 4, padding: '0', overflow: 'hidden' }}>
          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            {['Buy', 'Rent', 'Invest'].map(t => (
              <button key={t} className={`search-tab ${searchMode === t.toLowerCase() ? 'active' : ''}`}
                onClick={() => setSearchMode(t.toLowerCase())}>{t}</button>
            ))}
          </div>

          {/* Main search */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 0 }}>
            {/* Location input */}
            <div style={{ flex: '2 1 200px', padding: '16px 20px', borderRight: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <Icons.MapPin />
              <input className="search-input" placeholder="Neighborhood, address, or landmark…" />
            </div>

            {/* Property type */}
            <div style={{ flex: '1 1 120px', padding: '16px 20px', borderRight: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,0.5)' }}>
              <Icons.Building />
              <select style={{ color: 'rgba(255,255,255,0.5)' }} value={propType} onChange={e => setPropType(e.target.value)}>
                <option value="">Type</option>
                <option value="penthouse">Penthouse</option>
                <option value="condo">Condo</option>
                <option value="townhouse">Townhouse</option>
                <option value="estate">Estate</option>
              </select>
            </div>

            {/* Price range */}
            <div style={{ flex: '1 1 120px', padding: '16px 20px', borderRight: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,0.5)' }}>
              <Icons.DollarSign />
              <select style={{ color: 'rgba(255,255,255,0.5)' }} value={priceRange} onChange={e => setPriceRange(e.target.value)}>
                <option value="">Price</option>
                <option value="0-2M">Under $2M</option>
                <option value="2M-5M">$2M – $5M</option>
                <option value="5M-10M">$5M – $10M</option>
                <option value="10M+">$10M+</option>
              </select>
            </div>

            {/* Search btn */}
            <div style={{ flex: '0 0 auto', display: 'flex', alignItems: 'center', padding: '12px' }}>
              <button className="luxe-btn" onClick={onSearch} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 24px' }}>
                <Icons.Search />
                <span className="hide-mobile">Search</span>
              </button>
            </div>
          </div>

          {/* AI Search row */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', padding: '14px 20px', display: 'flex', gap: 10, alignItems: 'center' }}>
            <div style={{ color: 'var(--gold)', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
              <Icons.Sparkle />
              <span style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 500 }}>AI Lifestyle Search</span>
            </div>
            <input
              className="search-input"
              placeholder="e.g. 'Waterfront home with a private chef\'s kitchen and wine cellar...'"
              value={aiInput}
              onChange={e => setAiInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAiSearch()}
            />
            <button onClick={handleAiSearch} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gold)', flexShrink: 0 }}>
              {thinking ? <div style={{ width: 18, height: 18, border: '2px solid var(--gold)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> : <Icons.Send />}
            </button>
          </div>

          {/* AI result */}
          {aiSuggestion && (
            <div style={{ background: 'rgba(201,168,76,0.08)', borderTop: '1px solid rgba(201,168,76,0.15)', padding: '12px 20px', display: 'flex', gap: 10, alignItems: 'center' }}>
              <Icons.Sparkle />
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', fontStyle: 'italic' }}>{aiSuggestion}</p>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="fade-up stagger-3" style={{ display: 'flex', gap: 32, marginTop: 32, paddingTop: 24 }}>
          {[['2,400+', 'Premium Listings'], ['$4.2B', 'Properties Sold'], ['98%', 'Client Satisfaction']].map(([val, label]) => (
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