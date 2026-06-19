"use client";

import { Icons } from '@/components/Icons';
import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import HeroSection from '@/components/HeroSection';
import type { HeroSearchParams } from '@/components/HeroSection';
import PropertyCard from '@/components/PropertyCard';
import MapView from '@/components/MapView';
import PropertyDetail from '@/components/PropertyDetail';
import Dashboard from '@/components/Dashboard';
import { propertiesApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import type { Property } from "@/lib/api";
import ServicesDirectory from '@/components/ServicesDirectory';
import ServiceProviderDetail from '@/components/ServiceProviderDetail';
import type { ServiceProvider } from '@/lib/api/serviceProviders';

export default function LuxeEstate() {
  const router = useRouter();
  const { user, logout, token } = useAuth();

  const [dark, setDark] = useState(false);
  const [page, setPage] = useState('home');
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [dashboardProperties, setDashboardProperties] = useState<Property[]>([]);
  const [loadingProps, setLoadingProps] = useState(true);
  const [activePin, setActivePin] = useState<string | null>(null);
  const [selectedProp, setSelectedProp] = useState<Property | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<ServiceProvider | null>(null);
  const [filterType, setFilterType] = useState('All');
  const [heroSearch, setHeroSearch] = useState<HeroSearchParams | null>(null);

  // Public listings — approved only
  useEffect(() => {
    propertiesApi.getAll()
      .then(setProperties)
      .catch(console.error)
      .finally(() => setLoadingProps(false));
  }, []);

  // Dashboard — all properties including pending (agents, moderators, admins only)
  useEffect(() => {
    if (token && [2, 3, 4].includes(Number(user?.role))) {
      propertiesApi.getAllForDashboard(token)
        .then(setDashboardProperties)
        .catch(console.error);
    }
  }, [token, user]);

  const refreshDashboard = () => {
    propertiesApi.getAll().then(setProperties).catch(console.error);
    if (token && [2, 3, 4].includes(Number(user?.role))) {
      propertiesApi.getAllForDashboard(token).then(setDashboardProperties).catch(console.error);
    }
  };

  const toggleSave = useCallback((id: string) => {
    setSavedIds(ids => ids.includes(id) ? ids.filter(i => i !== id) : [...ids, id]);
  }, []);

  const typeFilters = ['All', 'Residential', 'Commercial', 'Land', 'Short Stay'];

  const propertyTypeMap: Record<string, number> = {
    'Residential': 1,
    'Commercial': 2,
    'Land': 3,
  };

  const filteredProps = (filterType === 'All'
    ? properties
    : filterType === 'Short Stay'
    ? properties.filter(p => p.transaction_type_id === 3)
    : properties.filter(p => p.property_type_id === propertyTypeMap[filterType] && p.transaction_type_id !== 3)
  ).filter(p => {
    if (!heroSearch) return true;
    if (heroSearch.location && !p.location.toLowerCase().includes(heroSearch.location.toLowerCase())) return false;
    if (heroSearch.propertyTypeId && p.property_type_id !== heroSearch.propertyTypeId) return false;
    if (heroSearch.transactionTypeId && p.transaction_type_id !== heroSearch.transactionTypeId) return false;
    if (heroSearch.maxPrice) {
      const price = (p.transaction_type_id === 3
        ? (p.amenities?.daily_rate as number)
        : (p.amenities?.price as number)) || 0;
      if (price > heroSearch.maxPrice) return false;
    }
    return true;
  });

  const handleView = (property: Property) => {
    setSelectedProp(property);
    setPage('detail');
  };
  

  // ── FEATURED ROTATION FOR HOMEPAGE ──
  const shuffle = <T,>(arr: T[]): T[] => {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };

  const featured = properties.filter(p => p.is_featured);
  const nonFeatured = properties.filter(p => !p.is_featured);
  const homepageProps = [
    ...shuffle(featured),
    ...shuffle(nonFeatured),
  ].slice(0, 3);

  return (
    <div className={`luxe-root ${dark ? 'dark-mode' : ''}`}>

      {/* ── NAVBAR ── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: page === 'home' ? 'rgba(0,0,0,0.2)' : 'var(--card-bg)',
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
            <span className="font-serif" style={{ fontSize: 22, color: page === 'home' ? 'white' : 'var(--text)' }}>Stonepath™</span>
          </div>

          {/* Nav Links — hidden on mobile */}
          <div style={{ display: 'flex', gap: 28 }} className="hide-mobile">
            {['listings', 'services', 'map', 'dashboard'].map(id => (
              <span
                key={id}
                onClick={() => setPage(id)}
                style={{
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                  fontSize: 14,
                  color: page === 'home' ? 'rgba(255,255,255,0.8)' : 'var(--text-muted)',
                  fontWeight: page === id ? '600' : '400',
                  borderBottom: page === id ? '1px solid var(--gold)' : 'none',
                  paddingBottom: 2,
                }}
              >
                {id}
              </span>
            ))}
          </div>

          {/* Right side: auth + dark mode */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {user ? (
              <>
                <span className="hide-mobile" style={{ fontSize: 13, color: page === 'home' ? 'rgba(255,255,255,0.7)' : 'var(--text-muted)' }}>
                  {user.first_name}
                </span>
                <button onClick={logout} style={{ background: 'transparent', border: '1px solid var(--gold)', color: 'var(--gold)', padding: '6px 14px', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <button onClick={() => router.push('/login')} className="hide-mobile" style={{ background: 'transparent', border: 'none', color: page === 'home' ? 'rgba(255,255,255,0.7)' : 'var(--text-muted)', fontSize: 13, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
                  Sign In
                </button>
                <button onClick={() => router.push('/register')} style={{ background: 'var(--gold)', border: 'none', color: '#0a0a0b', padding: '8px 18px', fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
                  Register
                </button>
              </>
            )}
            <div onClick={() => setDark(!dark)} style={{ cursor: 'pointer', padding: '8px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.1)', color: page === 'home' ? '#fff' : 'var(--text)' }}>
              {dark ? <Icons.Moon size={20} /> : <Icons.Sun size={20} />}
            </div>
          </div>
        </div>
      </nav>

      <main>
        {/* ── HOME ── */}
        {page === 'home' && (
          <>
            <HeroSection
              onSearch={(params) => {
                setHeroSearch(params);
                setFilterType('All');
                setPage('listings');
              }}
              dark={dark}
            />
            <section style={{ padding: '80px 24px', maxWidth: 1200, margin: '0 auto' }}>
              <p style={{ fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 8 }}>
                Featured Listings
              </p>
              <h2 className="font-serif" style={{ fontSize: 32, fontWeight: 300, marginBottom: 32 }}>
                Recently Added
              </h2>
              {loadingProps ? (
                <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                  Loading properties...
                </div>
              ) : properties.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                  No properties yet. Check back soon.
                </div>
              ) : (
                <div className="property-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
                  {homepageProps.map(p => (
                    <PropertyCard key={p.id} property={p} onView={handleView} onSave={toggleSave} saved={savedIds.includes(p.id)} />
                  ))}
                </div>
              )}
            </section>
          </>
        )}

        {/* ── LISTINGS ── */}
        {page === 'listings' && (
          <div className="listings-page" style={{ maxWidth: 1200, margin: '0 auto', padding: '120px 24px' }}>
            <div className="filter-bar" style={{ display: 'flex', gap: 8, marginBottom: 32, flexWrap: 'wrap' }}>
              {typeFilters.map(t => (
                <button
                  key={t}
                  onClick={() => setFilterType(t)}
                  style={{
                    padding: '8px 16px',
                    background: filterType === t ? 'var(--gold)' : 'transparent',
                    border: '1px solid var(--border)',
                    color: filterType === t ? '#000' : 'var(--text)',
                    cursor: 'pointer',
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
            {loadingProps ? (
              <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                Loading properties...
              </div>
            ) : filteredProps.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                No properties found.
              </div>
            ) : (
              <div className="property-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
                {filteredProps.map(p => (
                  <PropertyCard key={p.id} property={p} onView={handleView} onSave={toggleSave} saved={savedIds.includes(p.id)} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── MAP ── */}
        {page === 'map' && (
          <div style={{ paddingTop: 72, height: '100vh' }}>
            <MapView
              activePin={activePin}
              setActivePin={setActivePin}
              properties={properties}
              onSelectProperty={handleView}
            />
          </div>
        )}

        {/* ── DETAIL ── */}
        {page === 'detail' && selectedProp && (
          <div style={{ paddingTop: 72 }}>
            <PropertyDetail property={selectedProp} onBack={() => setPage('listings')} dark={dark} />
          </div>
        )}

        {/* ── SERVICES ── */}
        {page === 'services' && (
          <ServicesDirectory onSelectProvider={(p) => { setSelectedProvider(p); setPage('service-detail'); }} />
        )}

        {/* ── SERVICE DETAIL ── */}
        {page === 'service-detail' && selectedProvider && (
          <ServiceProviderDetail provider={selectedProvider} onBack={() => setPage('services')} />
        )}

        {/* ── DASHBOARD ── */}
        {page === 'dashboard' && (
          <div style={{ paddingTop: 72 }}>
            <Dashboard
              properties={[2, 3, 4].includes(Number(user?.role))
                ? dashboardProperties
                : properties}
              saved={savedIds}
              onPropertySubmitted={refreshDashboard}
            />
          </div>
        )}
      </main>

      {/* ── MOBILE BOTTOM NAV ── */}
      <div className="show-mobile-only" style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        height: 64, background: 'var(--card-bg)',
        borderTop: '1px solid var(--border)',
        justifyContent: 'space-around', alignItems: 'center',
        zIndex: 100
      }}>
        <div onClick={() => setPage('home')} style={{ opacity: page === 'home' ? 1 : 0.5, cursor: 'pointer', padding: 12 }}><Icons.Home /></div>
        <div onClick={() => setPage('listings')} style={{ opacity: page === 'listings' ? 1 : 0.5, cursor: 'pointer', padding: 12 }}><Icons.Search /></div>
        <div onClick={() => setPage('map')} style={{ opacity: page === 'map' ? 1 : 0.5, cursor: 'pointer', padding: 12 }}><Icons.Map /></div>
        <div onClick={() => setPage('dashboard')} style={{ opacity: page === 'dashboard' ? 1 : 0.5, cursor: 'pointer', padding: 12 }}><Icons.User /></div>
      </div>

    </div>
  );
}