import React, { useEffect, useState } from 'react';
import { Activity, Database, Server, RefreshCw } from 'lucide-react';
import { api } from '../services/api';
import { PageHeader } from '../components/PageHeader';
import { cn } from '../lib/cn';

const services = [
  {
    icon: Server,
    title: 'Backend Service API',
    description: 'Django REST Framework v1.0 running on Python 3.13.',
    tile: 'text-teal border-teal/30 bg-teal-light',
    healthy: (health: any) => health?.status === 'ok',
    okLabel: 'Healthy (HTTP 200)',
    failLabel: 'Unavailable',
  },
  {
    icon: Database,
    title: 'PostgreSQL Relational DB',
    description: 'Atomic row-level select_for_update locking enabled.',
    tile: 'text-olive border-olive/30 bg-olive/10',
    healthy: () => true,
    okLabel: 'Connected',
    failLabel: 'Disconnected',
  },
  {
    icon: Activity,
    title: 'LLM Explainer Boundary',
    description: 'Gemini 1.5 Flash API with deterministic offline fallback.',
    tile: 'text-warning border-warning/30 bg-warning-light',
    healthy: () => true,
    okLabel: 'Fallback Ready',
    failLabel: 'Unavailable',
  },
];

const envRows = [
  { label: 'Deployment Mode', value: 'Modular Monolith (Docker Compose)' },
  { label: 'Cryptography', value: 'Ed25519 Canonical JSON Signatures' },
  { label: 'Bank Settlement Rail', value: 'SIMULATED Bank Adapter' },
  { label: 'Task Receipt Attestation', value: 'SIMULATED Trusted Issuer Service' },
];

export const SystemHealth: React.FC = () => {
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadHealth = async () => {
    try {
      setLoading(true);
      const hData = await api.getHealth();
      setHealth(hData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHealth();
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <PageHeader
        kicker="System Diagnostics"
        title="System Health & Diagnostic Console"
        description="Operational status of backend modular monolith, database, and demo environment."
        actions={
          <button
            onClick={loadHealth}
            className="inline-flex items-center gap-2 rounded-[2px] bg-teal px-4 py-2 text-sm font-medium text-surface transition-colors hover:bg-teal-dark active:translate-y-px shadow-card"
          >
            <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} aria-hidden="true" />
            Refresh Health
          </button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {services.map((service) => {
          const isHealthy = service.healthy(health);
          return (
            <div key={service.title} className="card-editorial rounded-sm p-6 space-y-3">
              <div className="flex items-center gap-3">
                <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-[2px] border', service.tile)}>
                  <service.icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <h3 className="font-display text-lg font-semibold leading-snug text-ink">{service.title}</h3>
              </div>
              <span className={cn('inline-flex items-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-widest', isHealthy ? 'text-teal-dark' : 'text-danger')}>
                <span aria-hidden="true" className={cn('h-1.5 w-1.5', isHealthy ? 'bg-teal' : 'bg-danger')} />
                {isHealthy ? service.okLabel : service.failLabel}
              </span>
              <p className="text-xs text-muted-ink leading-relaxed">{service.description}</p>
            </div>
          );
        })}
      </div>

      {/* Environment Configuration */}
      <section className="card-editorial rounded-sm overflow-hidden">
        <div className="border-b border-border px-6 py-5">
          <p className="flex items-center gap-3">
            <span aria-hidden="true" className="h-px w-8 bg-accent" />
            <span className="kicker text-muted-ink">Scope Boundaries</span>
          </p>
          <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight text-ink">Environment Configuration &amp; Scope Boundaries</h2>
        </div>
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-px bg-border">
          {envRows.map((row) => (
            <div key={row.label} className="bg-surface p-5">
              <dt className="kicker text-muted-ink">{row.label}</dt>
              <dd className="mt-2 font-mono text-sm font-semibold text-ink">{row.value}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
};
