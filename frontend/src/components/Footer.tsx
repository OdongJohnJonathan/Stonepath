"use client";

import { useRouter } from "next/navigation";
import { Icons } from "@/components/Icons";

// TODO: replace placeholders once real values are available
const SUPPORT_EMAIL = "support@stonepath.com";
const SOCIAL_LINKS = [
  { label: "Instagram", icon: Icons.Instagram, href: "#" },
  { label: "Facebook", icon: Icons.Facebook, href: "#" },
  { label: "Twitter", icon: Icons.Twitter, href: "#" },
  { label: "LinkedIn", icon: Icons.LinkedIn, href: "#" },
];

interface FooterProps {
  onNavigate: (page: string) => void;
}

export default function Footer({ onNavigate }: FooterProps) {
  const router = useRouter();
  const year = new Date().getFullYear();

  const exploreLinks = [
    { label: "Home", action: () => onNavigate('home') },
    { label: "Listings", action: () => onNavigate('listings') },
    { label: "Map", action: () => onNavigate('map') },
    { label: "Services", action: () => onNavigate('services') },
    { label: "Dashboard", action: () => onNavigate('dashboard') },
  ];

  const accountLinks = [
    { label: "Sign In", action: () => router.push('/login') },
    { label: "Register", action: () => router.push('/register') },
  ];

  return (
    <footer style={{ background: '#0a0a0b', borderTop: '1px solid var(--border)', color: 'rgba(255,255,255,0.7)' }}>
      <div className="footer-grid" style={{
        maxWidth: 1200, margin: '0 auto', padding: '64px 24px 32px',
        display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 1fr', gap: 32,
      }}>
        {/* Brand */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{ width: 28, height: 28, border: '1px solid var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: 12, height: 12, background: 'var(--gold)', transform: 'rotate(45deg)' }} />
            </div>
            <span className="font-serif" style={{ fontSize: 22, color: 'white' }}>Stonepath™</span>
          </div>
          <p style={{ fontSize: 13, lineHeight: 1.7, maxWidth: 280, color: 'rgba(255,255,255,0.55)' }}>
            Premium real estate listings across East Africa.
          </p>
        </div>

        {/* Explore */}
        <div>
          <p style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 18 }}>
            Explore
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {exploreLinks.map(l => (
              <span key={l.label} onClick={l.action} style={{ fontSize: 13, cursor: 'pointer', color: 'rgba(255,255,255,0.7)' }}>
                {l.label}
              </span>
            ))}
          </div>
        </div>

        {/* Account */}
        <div>
          <p style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 18 }}>
            Account
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {accountLinks.map(l => (
              <span key={l.label} onClick={l.action} style={{ fontSize: 13, cursor: 'pointer', color: 'rgba(255,255,255,0.7)' }}>
                {l.label}
              </span>
            ))}
          </div>
        </div>

        {/* Connect */}
        <div>
          <p style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 18 }}>
            Connect
          </p>
          <a href={`mailto:${SUPPORT_EMAIL}`} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'rgba(255,255,255,0.7)', textDecoration: 'none', marginBottom: 18 }}>
            <Icons.Mail size={15} /> {SUPPORT_EMAIL}
          </a>
          <div style={{ display: 'flex', gap: 14 }}>
            {SOCIAL_LINKS.map(s => (
              <a key={s.label} href={s.href} aria-label={s.label} style={{ color: 'rgba(255,255,255,0.7)' }}>
                <s.icon size={18} />
              </a>
            ))}
          </div>
        </div>
      </div>

      <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', padding: '20px 24px' }}>
        <p style={{ maxWidth: 1200, margin: '0 auto', fontSize: 12, color: 'rgba(255,255,255,0.45)', textAlign: 'center' }}>
          © {year} Stonepath. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
