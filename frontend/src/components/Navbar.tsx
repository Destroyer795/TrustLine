import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShieldCheck, Cpu, Terminal, Heartbeat, ArrowsClockwise } from '@phosphor-icons/react';
import { api } from '../services/api';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const [chainValid, setChainValid] = useState<boolean | null>(null);

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

  const navItems = [
    { label: 'Overview', path: '/' },
    { label: 'Agents Inventory', path: '/agents' },
    { label: 'Register Agent', path: '/agents/new' },
    { label: 'Demo Lab', path: '/demo-lab' },
    { label: 'Audit Chain', path: '/audit' },
    { label: 'System Health', path: '/system' },
  ];

  return (
    <header className="bg-surface border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-8">
          <Link to="/" className="flex items-center space-x-3 text-ink group">
            <div className="w-8 h-8 rounded bg-teal flex items-center justify-center text-surface font-serif font-bold text-lg">
              T
            </div>
            <div>
              <span className="font-serif font-bold text-lg tracking-tight text-ink block leading-none">TrustLine</span>
              <span className="text-[10px] font-mono uppercase tracking-widest text-muted-ink block mt-0.5">Agent Credit Infrastructure</span>
            </div>
          </Link>

          <nav className="hidden md:flex space-x-1">
            {navItems.map((item) => {
              const active = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                    active
                      ? 'bg-teal-light text-teal-dark font-semibold'
                      : 'text-muted-ink hover:text-ink hover:bg-canvas'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 px-3 py-1 bg-canvas rounded border border-border text-xs font-mono">
            <ShieldCheck className={`w-4 h-4 ${chainValid ? 'text-teal' : 'text-danger'}`} />
            <span>Audit Chain:</span>
            <span className={chainValid ? 'text-teal font-semibold' : 'text-danger font-semibold'}>
              {chainValid === null ? 'Checking...' : chainValid ? 'VALID' : 'CORRUPTED'}
            </span>
          </div>

          <button
            onClick={checkChain}
            title="Refresh Audit Integrity"
            className="p-1.5 text-muted-ink hover:text-ink rounded hover:bg-canvas transition-colors"
          >
            <ArrowsClockwise className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
