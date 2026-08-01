import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShieldCheck, ShieldAlert, Menu, X, RefreshCw } from 'lucide-react';
import { api } from '../services/api';
import { LogoMark } from './Logo';
import { cn } from '../lib/cn';

const navItems = [
  { label: 'Overview', path: '/' },
  { label: 'Agents Inventory', path: '/agents' },
  { label: 'Register Agent', path: '/agents/new' },
  { label: 'Demo Lab', path: '/demo-lab' },
  { label: 'Audit Chain', path: '/audit' },
  { label: 'System Health', path: '/system' },
];

export const Navbar: React.FC = () => {
  const location = useLocation();
  const [chainValid, setChainValid] = useState<boolean | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  const checkChain = async () => {
    try {
      const res = await api.getDemoStatus();
      setChainValid(res.audit_chain_valid);
    } catch {
      setChainValid(false);
    }
  };

  useEffect(() => {
    checkChain();
  }, [location.pathname]);

  // Close the mobile menu on navigation and on Escape.
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [menuOpen]);

  const chainLabel =
    chainValid === null ? 'Checking' : chainValid ? 'Chain Valid' : 'Chain Corrupted';

  return (
    <header className="bg-surface border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between gap-4">
        {/* Wordmark — bridge mark + tagline */}
        <Link
          to="/"
          aria-label="TrustLine — credit, extended to machines"
          className="flex items-center gap-3 text-ink shrink-0 group"
        >
          <LogoMark className="h-9 w-9 text-teal transition-colors group-hover:text-teal-dark" />
          <span className="flex flex-col leading-none">
            <span className="font-display font-semibold text-lg tracking-tight leading-none">TrustLine</span>
            <span className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-ink">Credit, extended to machines.</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav aria-label="Primary" className="hidden lg:flex items-center gap-1 ml-6">
          {navItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'group relative px-3 py-2 text-sm transition-colors',
                  active ? 'text-ink font-semibold' : 'text-muted-ink hover:text-ink',
                )}
              >
                {item.label}
                <span
                  aria-hidden="true"
                  className={cn(
                    'absolute left-3 right-3 -bottom-0.5 h-[2px] transition-all duration-200 ease-out-quart',
                    active ? 'bg-accent' : 'bg-teal scale-x-0 group-hover:scale-x-100',
                  )}
                />
              </Link>
            );
          })}
        </nav>

        {/* Right cluster */}
        <div className="flex items-center gap-3 ml-auto">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-canvas border border-border rounded-[2px]">
            {chainValid === false ? (
              <ShieldAlert aria-hidden="true" className="h-3.5 w-3.5 text-danger" />
            ) : (
              <ShieldCheck aria-hidden="true" className={cn('h-3.5 w-3.5', chainValid === null ? 'text-muted-ink' : 'text-teal')} />
            )}
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-ink">
              Audit: <span className={chainValid === false ? 'text-danger font-semibold' : chainValid ? 'text-teal-dark font-semibold' : ''}>{chainLabel}</span>
            </span>
          </div>

          <button
            onClick={checkChain}
            aria-label="Refresh audit chain integrity"
            title="Refresh Audit Integrity"
            className="hidden sm:flex p-2 text-muted-ink hover:text-ink hover:bg-canvas rounded-[2px] transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
          </button>

          {/* Mobile menu toggle */}
          <button
            ref={menuButtonRef}
            onClick={() => setMenuOpen((o) => !o)}
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            className="lg:hidden p-2 text-ink hover:bg-canvas rounded-[2px] transition-colors"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile nav panel */}
      {menuOpen && (
        <nav
          id="mobile-nav"
          aria-label="Mobile"
          className="lg:hidden border-t border-border bg-surface"
        >
          <ul className="max-w-7xl mx-auto px-4 py-3">
            {navItems.map((item) => {
              const active = location.pathname === item.path;
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'flex items-center justify-between py-3 px-2 min-h-[44px] text-sm transition-colors',
                      active ? 'text-teal-dark font-semibold' : 'text-ink hover:text-teal-dark',
                    )}
                  >
                    {item.label}
                    {active && <span aria-hidden="true" className="h-2 w-2 bg-accent" />}
                  </Link>
                </li>
              );
            })}
          </ul>
          <div className="max-w-7xl mx-auto px-4 pb-4">
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-ink">
              Audit Chain: {chainLabel}
            </p>
          </div>
        </nav>
      )}
    </header>
  );
};
