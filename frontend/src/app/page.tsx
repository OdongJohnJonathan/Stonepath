"use client";

import { Icons } from '@/components/Icons';
import { PROPERTIES } from '@/lib/constants';
import { useState, useCallback } from "react";
import HeroSection from '@/components/HeroSection';
import PropertyCard from '@/components/PropertyCard';
import MapView from '@/components/MapView';
import PropertyDetail from '@/components/PropertyDetail';
import Dashboard from '@/components/Dashboard';
import { Property } from '@/types';

// ─── MAIN APP ─────────────────────────────────────────────────────────────

export default function LuxeEstate() {
  const [dark, setDark] = useState(false);
  const [page, setPage] = useState('home');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [savedIds, setSavedIds] = useState<number[]>([]);
  const [properties] = useState<Property[]>(PROPERTIES as Property[]);
  const [activePin, setActivePin] = useState<number | null>(null);
  const [selectedProp, setSelectedProp] = useState<Property | null>(null);
  const [filterType, setFilterType] = useState('All');

  const toggleSave = useCallback((id: number) => {
    setSavedIds(ids => ids.includes(id) ? ids.filter(i => i !== id) : [...ids, id]);
  }, []);

  const filteredProps = filterType === 'All'
    ? properties
    : properties.filter(p => p.type === filterType);

  const typeFilters = ['All', 'Penthouse', 'Loft', 'Estate', 'Condo', 'Townhouse'];

  const handleView = (property: Property) => {
    setSelectedProp(property);
    setPage('detail');
  };

  return (
    <div className={`luxe-root ${dark ? 'dark-mode' : ''}`}>
      
      {/* ── NAVBAR ── */}
      {/* ── NAVBAR ── */}
<nav style={{ 
  position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, // Increased z-index
  background: page === 'home' ? 'rgba(0,0,0,0.2)' : 'var(--card-bg)', // Added slight tint for home
  borderBottom: page === 'home' ? 'none' : '1px solid var(--border)', 
  backdropFilter: 'blur(20px)', 
  padding: '0 24px' 
}}>
  <div style={{ maxWidth: 1200, margin: '0 auto', height: 72, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
    
    {/* Logo */}
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }} onClick={() => setPage('home')}>
       <div style={{ width: 28, height: 28, border: '1px solid var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 12, height: 12, background: 'var(--gold)', transform: 'rotate(45deg)' }} />
        </div>
       <span className="font-serif" style={{ fontSize: 22, color: page === 'home' ? 'white' : 'var(--text)' }}>LuxeEstate™</span>
    </div>
    
    {/* Navigation Links */}
    <div style={{ display: 'flex', gap: 28 }} className="hide-mobile">
      {['listings', 'map', 'dashboard'].map(id => (
        <span 
          key={id} 
          onClick={() => setPage(id)} 
          className={`nav-link ${page === id ? 'active' : ''}`} 
          style={{ 
            cursor: 'pointer', 
            textTransform: 'capitalize', 
            color: page === 'home' ? 'white' : 'var(--text-muted)',
            fontWeight: page === id ? '600' : '400'
          }}
        >
          {id}
        </span>
      ))}
    </div>

    {/* Dark Mode Toggle - ENSURE THIS IS VISIBLE */}
    <div 
      onClick={() => setDark(!dark)} 
      style={{ 
        cursor: 'pointer', 
        padding: '8px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(255,255,255,0.1)', // Subtle background to see the hit area
        color: page === 'home' ? '#fff' : 'var(--text)',
        transition: 'all 0.2s ease'
      }}
    >
      {dark ? <Icons.Moon size={20} /> : <Icons.Sun size={20} />}
    </div>
  </div>
</nav>

      <main>
        {/* ── HOME PAGE ── */}
        {page === 'home' && (
          <>
            <HeroSection onSearch={() => setPage('listings')} dark={dark} />
            <section style={{ padding: '80px 24px', maxWidth: 1200, margin: '0 auto' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
                {properties.slice(0, 3).map(p => (
                  <PropertyCard 
                    key={p.id} 
                    property={p} 
                    onView={handleView} 
                    onSave={toggleSave} 
                    saved={savedIds.includes(p.id)} 
                    // dark={dark}
                  />
                ))}
              </div>
            </section>
          </>
        )}

        {/* ── LISTINGS PAGE ── */}
        {page === 'listings' && (
          <div style={{ paddingTop: 120, maxWidth: 1200, margin: '0 auto', padding: '120px 24px' }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 32, flexWrap: 'wrap' }}>
              {typeFilters.map(t => (
                <button 
                  key={t} 
                  onClick={() => setFilterType(t)} 
                  style={{ 
                    padding: '8px 16px', 
                    background: filterType === t ? 'var(--gold)' : 'transparent', 
                    border: '1px solid var(--border)', 
                    color: filterType === t ? '#000' : 'var(--text)',
                    cursor: 'pointer' 
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: viewMode === 'grid' ? 'repeat(auto-fill, minmax(300px, 1fr))' : '1fr', gap: 24 }}>
              {filteredProps.map(p => (
                <PropertyCard 
                  key={p.id} 
                  property={p} 
                  onView={handleView} 
                  onSave={toggleSave} 
                  saved={savedIds.includes(p.id)} 
                  // dark={dark}
                />
              ))}
            </div>
          </div>
        )}

        {/* ── MAP VIEW ── */}
        {page === 'map' && (
          <div style={{ paddingTop: 72, height: '100vh' }}>
            <MapView 
              activePin={activePin} 
              setActivePin={setActivePin} 
              properties={properties} 
            />
          </div>
        )}

        {/* ── PROPERTY DETAIL ── */}
        {page === 'detail' && selectedProp && (
          <div style={{ paddingTop: 72 }}>
            <PropertyDetail 
              property={selectedProp} 
              onBack={() => setPage('listings')} 
              dark={dark}
            />
          </div>
        )}

        {/* ── DASHBOARD ── */}
        {page === 'dashboard' && (
          <div style={{ paddingTop: 72 }}>
            <Dashboard 
              properties={properties} 
              saved={savedIds} 
            />
          </div>
        )}
      </main>

      {/* ── MOBILE NAV ── */}
      <div className="bottom-nav show-mobile-only" style={{ 
        position: 'fixed', bottom: 0, left: 0, right: 0, 
        height: 64, background: 'var(--card-bg)', 
        borderTop: '1px solid var(--border)', 
        display: 'flex', justifyContent: 'space-around', alignItems: 'center',
        zIndex: 100
      }}>
        <div onClick={() => setPage('home')} style={{ opacity: page === 'home' ? 1 : 0.5 }}><Icons.Home /></div>
        <div onClick={() => setPage('listings')} style={{ opacity: page === 'listings' ? 1 : 0.5 }}><Icons.Search /></div>
        <div onClick={() => setPage('map')} style={{ opacity: page === 'map' ? 1 : 0.5 }}><Icons.Map /></div>
        <div onClick={() => setPage('dashboard')} style={{ opacity: page === 'dashboard' ? 1 : 0.5 }}><Icons.User /></div>
      </div>

    </div>
  );
}