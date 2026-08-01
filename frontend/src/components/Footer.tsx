import React from 'react';
import { Link } from 'react-router-dom';
import { StripeBand } from './Geometrics';
import { Logo } from './Logo';

/** Editorial footer — brand line, quick links, and a mono system-identity strip. */
export const Footer: React.FC = () => {
  const links = [
    { label: 'Overview', path: '/' },
    { label: 'Agents Inventory', path: '/agents' },
    { label: 'Register Agent', path: '/agents/new' },
    { label: 'Demo Lab', path: '/demo-lab' },
    { label: 'Audit Chain', path: '/audit' },
    { label: 'System Health', path: '/system' },
  ];

  return (
    <footer className="mt-16 bg-surface border-t border-border">
      <StripeBand className="block h-1.5 w-full text-border-dark/50" />
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div className="max-w-xs">
            <Logo markClassName="h-8 w-8" />
            <p className="mt-4 text-xs text-muted-ink leading-relaxed">
              The mark is a bridge: the deck is the credit line, the stay cables are the Ed25519-signed capability
              mandate, the tower is principal authority. It spans the trust gap between a human and a machine that
              holds no legal identity.
            </p>
          </div>

          <nav aria-label="Footer" className="md:justify-self-center">
            <p className="kicker text-muted-ink">Navigate</p>
            <ul className="mt-4 grid grid-cols-2 gap-x-8 gap-y-2.5">
              {links.map((item) => (
                <li key={item.path}>
                  <Link to={item.path} className="text-sm text-muted-ink hover:text-teal-dark transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="md:justify-self-end">
            <p className="kicker text-muted-ink">System Identity</p>
            <ul className="mt-4 space-y-2 font-mono text-[11px] text-muted-ink uppercase tracking-wider">
              <li>AHP Underwriting · CR ≤ 0.10</li>
              <li>Ed25519 Mandates</li>
              <li>SHA-256 Hash-Chained Ledger</li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-border flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
          <p className="font-mono text-[11px] text-muted-ink uppercase tracking-widest">
            TrustLine — Autonomous Agent Credit Infrastructure
          </p>
          <p className="font-mono text-[11px] text-muted-ink">31-Hour FinTech Hackathon Build · MIT License</p>
        </div>
      </div>
    </footer>
  );
};
