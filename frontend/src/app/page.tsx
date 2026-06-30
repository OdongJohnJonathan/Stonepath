"use client";

import { Icons } from '@/components/Icons';
import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import HeroSection from '@/components/HeroSection';
import type { HeroSearchParams } from '@/components/HeroSection';
import PropertyCard from '@/components/PropertyCard';
import MapView from '@/components/MapView';
import PropertyDetail from '@/components/PropertyDetail';
import Dashboard from '@/components/Dashboard';
import ProfileSettingsPanel from '@/components/ProfileSettingsPanel';
import { propertiesApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import type { Property } from "@/lib/api";
import ServicesDirectory from '@/components/ServicesDirectory';
import ServiceProviderDetail from '@/components/ServiceProviderDetail';
import type { ServiceProvider } from '@/lib/api/serviceProviders';
import AgentProfile from '@/components/AgentProfile';
import NewsletterSignup from '@/components/NewsletterSignup';
import Footer from '@/components/Footer';

// ── FEATURED ROTATION FOR HOMEPAGE ──
const shuffle = <T,>(arr: T[]): T[] => {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

export default function LuxeEstate() {
  const router = useRouter();
  const { user, logout, token } = useAuth();

  const [dark, setDark] = useState(false);
  const [page, setPage] = useState('home');
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [dashboardProperties, setDashboardProperties] = useState<Property[]>([]);
  const [loadingProps, setLoadingProps] = useState(true);
  const [activePin, setActivePin] = useState<string | null>(null);
  const [selectedProp, setSelectedProp] = useState<Property | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<ServiceProvider | null>(null);
  const [filterType, setFilterType] = useState('All');
  const [heroSearch, setHeroSearch] = useState<HeroSearchParams | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<{id: string; name: string; verified: boolean} | null>(null);

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

  const goToProfileSettings = () => {
    setPage('profile');
    setMenuOpen(false);
  };

  useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  // Memoize homepage properties to avoid recalculating on every render
  const homepageProps = useMemo(() => {
    const featured = properties.filter(p => p.is_featured);
    const nonFeatured = properties.filter(p => !p.is_featured);
    return [
      ...shuffle(featured),
      ...shuffle(nonFeatured),
    ].slice(0, 3);
  }, [properties]);

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
            <img src="/logo.png" alt="Stonepath Estates" style={{ height: 36, width: 36, borderRadius: '50%', objectFit: 'cover' }} />
            <span className="font-serif" style={{ fontSize: 22, color: page === 'home' ? 'white' : 'var(--text)' }}>Stonepath Estates</span>
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

          {/* Right side: hamburger user menu */}
          <div ref={menuRef} style={{ position: 'relative' }}>
            <div
              onClick={() => setMenuOpen(o => !o)}
              title="Menu"
              style={{ cursor: 'pointer', padding: '8px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.1)', color: page === 'home' ? '#fff' : 'var(--text)' }}>
              <Icons.Menu size={20} />
            </div>

            {menuOpen && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 12px)', right: 0, width: 260,
                background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 4,
                boxShadow: '0 12px 32px rgba(0,0,0,0.35)', overflow: 'hidden', zIndex: 200,
              }}>
                {user ? (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 16, borderBottom: '1px solid var(--border)' }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: '50%', overflow: 'hidden', flexShrink: 0,
                        border: '1px solid var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'rgba(201,168,76,0.15)', color: 'var(--gold)', fontSize: 13, fontWeight: 600,
                      }}>
                        {user.profile_image_url ? (
                          <img src={user.profile_image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase() || <Icons.User size={16} />
                        )}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {user.first_name} {user.last_name}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {user.email}
                        </div>
                      </div>
                    </div>

                    <button onClick={goToProfileSettings}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', padding: '12px 16px', fontSize: 13, color: 'var(--text)', cursor: 'pointer', textAlign: 'left', fontFamily: "'DM Sans', sans-serif" }}>
                      <Icons.User size={16} /> Profile Settings
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderTop: '1px solid var(--border)' }}>
                      <span style={{ fontSize: 13, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 8 }}>
                        {dark ? <Icons.Moon size={15} /> : <Icons.Sun size={15} />} {dark ? 'Dark Mode' : 'Light Mode'}
                      </span>
                      <div onClick={() => setDark(!dark)} style={{ width: 36, height: 20, borderRadius: 10, background: dark ? 'var(--gold)' : 'var(--border)', position: 'relative', cursor: 'pointer', transition: 'background 0.2s ease', flexShrink: 0 }}>
                        <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#fff', position: 'absolute', top: 2, left: dark ? 18 : 2, transition: 'left 0.2s ease' }} />
                      </div>
                    </div>

                    <button onClick={() => { logout(); setMenuOpen(false); }}
                      style={{ width: '100%', background: 'none', border: 'none', borderTop: '1px solid var(--border)', padding: '12px 16px', fontSize: 13, color: '#f87171', cursor: 'pointer', textAlign: 'left', fontFamily: "'DM Sans', sans-serif" }}>
                      Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={() => { router.push('/login'); setMenuOpen(false); }}
                      style={{ width: '100%', background: 'none', border: 'none', padding: '12px 16px', fontSize: 13, color: 'var(--text)', cursor: 'pointer', textAlign: 'left', fontFamily: "'DM Sans', sans-serif" }}>
                      Sign In
                    </button>
                    <button onClick={() => { router.push('/register'); setMenuOpen(false); }}
                      style={{ width: '100%', background: 'none', border: 'none', borderTop: '1px solid var(--border)', padding: '12px 16px', fontSize: 13, color: 'var(--gold)', fontWeight: 600, cursor: 'pointer', textAlign: 'left', fontFamily: "'DM Sans', sans-serif" }}>
                      Register
                    </button>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderTop: '1px solid var(--border)' }}>
                      <span style={{ fontSize: 13, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 8 }}>
                        {dark ? <Icons.Moon size={15} /> : <Icons.Sun size={15} />} {dark ? 'Dark Mode' : 'Light Mode'}
                      </span>
                      <div onClick={() => setDark(!dark)} style={{ width: 36, height: 20, borderRadius: 10, background: dark ? 'var(--gold)' : 'var(--border)', position: 'relative', cursor: 'pointer', transition: 'background 0.2s ease', flexShrink: 0 }}>
                        <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#fff', position: 'absolute', top: 2, left: dark ? 18 : 2, transition: 'left 0.2s ease' }} />
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
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
            {/* Newsletter signup */}
            <section style={{ padding: '0 24px 80px', maxWidth: 1200, margin: '0 auto' }}>
              <NewsletterSignup />
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
            <PropertyDetail
              property={selectedProp}
              onBack={() => setPage('listings')}
              dark={dark}
              onViewAgent={(id, name, verified) => {
                setSelectedAgent({ id, name, verified });
                setPage('agent-profile');
              }}
            />
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

        {/* ── PROFILE SETTINGS ── */}
        {page === 'profile' && (
          <div style={{ paddingTop: 72 }}>
            <div style={{ maxWidth: 640, margin: '0 auto', padding: '24px 16px 120px' }}>
              <button onClick={() => setPage('dashboard')} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer', marginBottom: 20, fontFamily: "'DM Sans', sans-serif" }}>
                <Icons.ChevronLeft size={16} /> Back to Dashboard
              </button>
              <p style={{ fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 6 }}>My Account</p>
              <h2 className="font-serif" style={{ fontSize: 32, fontWeight: 300, marginBottom: 24 }}>Profile Settings</h2>
              <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', padding: 24 }}>
                <ProfileSettingsPanel />
              </div>
            </div>
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
        <div onClick={() => setPage('services')} style={{ opacity: page === 'services' ? 1 : 0.5, cursor: 'pointer', padding: 12 }}><Icons.Briefcase /></div>
        <div onClick={() => setPage('map')} style={{ opacity: page === 'map' ? 1 : 0.5, cursor: 'pointer', padding: 12 }}><Icons.Map /></div>
        <div onClick={() => setPage('dashboard')} style={{ opacity: page === 'dashboard' ? 1 : 0.5, cursor: 'pointer', padding: 12 }}><Icons.User /></div>
      </div>

      {/* ── AGENT PROFILE ── */}
        {page === 'agent-profile' && selectedAgent && (
          <div style={{ paddingTop: 72 }}>
            <AgentProfile
              agentId={selectedAgent.id}
              agentName={selectedAgent.name}
              agentVerified={selectedAgent.verified}
              onBack={() => setPage('listings')}
              onView={handleView}
              onSave={toggleSave}
              savedIds={savedIds}
            />
          </div>
        )}

      <Footer onNavigate={setPage} />

    </div>
  );
}