import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, ShieldAlert, ArrowRight, Zap, Scale, Lock, RefreshCw } from 'lucide-react';
import { api } from '../services/api';
import { StatCard } from '../components/StatCard';
import { Orbit } from '../components/Geometrics';
import { cn } from '../lib/cn';

const pillars = [
  {
    icon: Lock,
    title: 'Ed25519 Signed Mandates',
    body: 'Every agent draw is verified against a canonical Ed25519-signed capability mandate bound to an accountable human or enterprise principal.',
  },
  {
    icon: Scale,
    title: 'AHP Policy Priors & Asymmetric Limits',
    body: 'Scores 5 risk components separately. Provisional priors are explicitly tagged. Credit grows slowly (α↑ = 0.15) and drops rapidly (α↓ = 0.65).',
  },
  {
    icon: Zap,
    title: 'Outside-Agent Enforcement',
    body: 'Enforcement lives in the backend API Gateway outside the agent’s LLM context. Atomic checks via PostgreSQL select_for_update eliminate double-spend race conditions.',
  },
];

export const Overview: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadStats = async () => {
    try {
      const res = await api.getDemoStatus();
      setStats(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const chainValid = stats?.audit_chain_valid;

  return (
    <div className="space-y-14">
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="card-editorial rounded-sm overflow-hidden">
        <div className="grid lg:grid-cols-[1fr_380px]">
          <div className="p-8 md:p-12 animate-rise">
            <p className="flex items-center gap-3">
              <span aria-hidden="true" className="h-px w-10 bg-accent" />
              <span className="kicker text-muted-ink">FinTech Hackathon Solution</span>
            </p>
            <h1 className="mt-6 font-display text-4xl md:text-5xl font-semibold tracking-tight leading-[1.05] text-ink">
              TrustLine
              <span className="mt-2 block font-medium text-walnut">
                Autonomous Agent Credit <em className="italic">Infrastructure</em>
              </span>
            </h1>
            <p className="mt-6 max-w-xl text-base md:text-lg text-muted-ink leading-relaxed">
              How can temporary working capital be extended to an AI agent when the agent itself lacks legal identity, collateral, and contractual accountability?
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                to="/demo-lab"
                className="inline-flex items-center gap-2 rounded-[2px] bg-ink px-5 py-2.5 text-sm font-medium text-canvas transition-colors hover:bg-walnut active:translate-y-px shadow-card"
              >
                Launch 3-Minute Demo Lab
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                to="/agents"
                className="link-underline text-sm font-medium text-teal-dark hover:text-ink transition-colors py-1"
              >
                View Agents Inventory
              </Link>
            </div>
          </div>

          {/* Geometric credit dial */}
          <div className="hidden lg:flex relative items-center justify-center border-l border-border bg-canvas px-10 py-12 animate-fade-in">
            <Orbit className="h-72 w-72 text-teal" />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center">
              {chainValid === false ? (
                <ShieldAlert aria-hidden="true" className="h-8 w-8 text-danger" />
              ) : (
                <ShieldCheck aria-hidden="true" className={cn('h-8 w-8', chainValid ? 'text-teal' : 'text-muted-ink')} />
              )}
              <span className="kicker text-muted-ink">Audit Chain</span>
              <span className={cn('font-mono text-sm font-semibold uppercase tracking-widest', chainValid === false ? 'text-danger' : chainValid ? 'text-teal-dark' : 'text-muted-ink')}>
                {loading ? 'Loading' : chainValid ? 'Valid' : 'Corrupted'}
              </span>
            </div>
          </div>
        </div>

        {/* Metadata strip */}
        <div className="border-t border-border bg-surface px-8 md:px-12 py-3 flex flex-wrap gap-x-8 gap-y-2">
          {['AHP Underwriting v1.0', 'Ed25519 Mandates', 'SHA-256 Hash Chain', 'PostgreSQL Row Locking'].map((item) => (
            <span key={item} className="font-mono text-[11px] uppercase tracking-widest text-muted-ink">{item}</span>
          ))}
        </div>
      </section>

      {/* ── Core Architectural Pillars ───────────────────────── */}
      <section>
        <div className="pb-4 border-b border-border">
          <p className="flex items-center gap-3">
            <span aria-hidden="true" className="h-px w-8 bg-accent" />
            <span className="kicker text-muted-ink">Foundation</span>
          </p>
          <h2 className="mt-3 font-display text-2xl md:text-3xl font-semibold tracking-tight text-ink">Core Architectural Pillars</h2>
        </div>

        <div className="mt-6 grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border border border-border rounded-sm overflow-hidden bg-surface shadow-card">
          {pillars.map((pillar, i) => (
            <article key={pillar.title} className="p-7 md:p-8">
              <span aria-hidden="true" className="font-mono text-xs font-semibold text-accent">0{i + 1}</span>
              <div className="mt-6 flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[2px] border border-border bg-canvas text-teal">
                  <pillar.icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <h3 className="font-display text-lg font-semibold leading-snug text-ink">{pillar.title}</h3>
              </div>
              <p className="mt-3 text-sm text-muted-ink leading-relaxed">{pillar.body}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ── System Live Metrics ─────────────────────────────── */}
      <section className="card-editorial rounded-sm overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-5 border-b border-border">
          <div>
            <p className="flex items-center gap-3">
              <span aria-hidden="true" className="h-px w-8 bg-accent" />
              <span className="kicker text-muted-ink">Operational Telemetry</span>
            </p>
            <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight text-ink">System Real-Time Summary</h2>
          </div>
          <button
            onClick={loadStats}
            className="inline-flex items-center gap-2 self-start sm:self-auto rounded-[2px] bg-canvas border border-border px-3 py-2 text-sm font-medium text-ink transition-colors hover:bg-surface active:translate-y-px"
          >
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
            Refresh
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-px bg-border">
          <StatCard variant="flat" label="Principals" value={loading ? '—' : stats?.principals} />
          <StatCard variant="flat" label="Active Agents" value={loading ? '—' : stats?.agents} />
          <StatCard variant="flat" label="Draw Requests" value={loading ? '—' : stats?.draws} />
          <StatCard variant="flat" label="Repayments" value={loading ? '—' : stats?.repayments} />
          <StatCard
            variant="flat"
            label="Audit Chain"
            value={
              loading ? (
                '—'
              ) : (
                <span className={cn('font-mono text-base font-semibold uppercase tracking-widest', chainValid ? 'text-teal-dark' : 'text-danger')}>
                  {chainValid ? 'Valid' : 'Corrupted'}
                </span>
              )
            }
            accent={loading ? 'default' : chainValid ? 'teal' : 'danger'}
            icon={<ShieldCheck className="h-5 w-5" aria-hidden="true" />}
          />
        </div>
      </section>
    </div>
  );
};
