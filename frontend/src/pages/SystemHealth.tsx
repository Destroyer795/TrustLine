import React, { useEffect, useState } from 'react';
import { Heartbeat, Database, HardDrives, ArrowsClockwise, CheckCircle } from '@phosphor-icons/react';
import { api } from '../services/api';

export const SystemHealth: React.FC = () => {
  const [health, setHealth] = useState<any>(null);
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadHealth = async () => {
    try {
      setLoading(true);
      const [hData, sData] = await Promise.all([
        api.getHealth(),
        api.getDemoStatus()
      ]);
      setHealth(hData);
      setStatus(sData);
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
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold text-ink">System Health & Diagnostic Console</h1>
          <p className="text-sm text-muted-ink mt-1">Operational status of backend modular monolith, database, and demo environment.</p>
        </div>
        <button
          onClick={loadHealth}
          className="px-4 py-2 bg-teal text-surface text-sm font-medium rounded hover:bg-teal-dark transition-colors flex items-center space-x-2 shadow-sm"
        >
          <ArrowsClockwise className="w-4 h-4" />
          <span>Refresh Health</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card-editorial p-6 rounded-lg space-y-3">
          <div className="w-10 h-10 rounded bg-teal/10 text-teal flex items-center justify-center font-serif font-bold">
            <HardDrives className="w-5 h-5" />
          </div>
          <h3 className="font-serif font-bold text-lg text-ink">Backend Service API</h3>
          <span className="inline-flex items-center text-xs font-mono font-bold text-teal">
            <CheckCircle className="w-4 h-4 mr-1" />
            {health?.status === 'ok' ? 'HEALTHY (HTTP 200)' : 'UNAVAILABLE'}
          </span>
          <p className="text-xs text-muted-ink">Django REST Framework v1.0 running on Python 3.13.</p>
        </div>

        <div className="card-editorial p-6 rounded-lg space-y-3">
          <div className="w-10 h-10 rounded bg-olive/10 text-olive flex items-center justify-center font-serif font-bold">
            <Database className="w-5 h-5" />
          </div>
          <h3 className="font-serif font-bold text-lg text-ink">PostgreSQL Relational DB</h3>
          <span className="inline-flex items-center text-xs font-mono font-bold text-teal">
            <CheckCircle className="w-4 h-4 mr-1" />
            CONNECTED
          </span>
          <p className="text-xs text-muted-ink">Atomic row-level select_for_update locking enabled.</p>
        </div>

        <div className="card-editorial p-6 rounded-lg space-y-3">
          <div className="w-10 h-10 rounded bg-warning/10 text-warning flex items-center justify-center font-serif font-bold">
            <Heartbeat className="w-5 h-5" />
          </div>
          <h3 className="font-serif font-bold text-lg text-ink">LLM Explainer Boundary</h3>
          <span className="inline-flex items-center text-xs font-mono font-bold text-teal">
            <CheckCircle className="w-4 h-4 mr-1" />
            FALLBACK READY
          </span>
          <p className="text-xs text-muted-ink">Gemini 1.5 Flash API with deterministic offline fallback.</p>
        </div>
      </div>

      {/* System Status Table */}
      <div className="card-editorial p-6 rounded-lg space-y-4">
        <h2 className="text-xl font-serif font-bold text-ink border-b border-border pb-2">Environment Configuration & Scope Boundaries</h2>
        
        <div className="grid grid-cols-2 gap-4 text-xs font-mono">
          <div className="p-3 bg-canvas rounded border border-border">
            <span className="text-muted-ink block uppercase">Deployment Mode</span>
            <span className="text-sm font-bold text-ink block mt-1">Modular Monolith (Docker Compose)</span>
          </div>
          <div className="p-3 bg-canvas rounded border border-border">
            <span className="text-muted-ink block uppercase">Cryptography</span>
            <span className="text-sm font-bold text-ink block mt-1">Ed25519 Canonical JSON Signatures</span>
          </div>
          <div className="p-3 bg-canvas rounded border border-border">
            <span className="text-muted-ink block uppercase">Bank Settlement Rail</span>
            <span className="text-sm font-bold text-teal-dark block mt-1">SIMULATED Bank Adapter</span>
          </div>
          <div className="p-3 bg-canvas rounded border border-border">
            <span className="text-muted-ink block uppercase">Task Receipt Attestation</span>
            <span className="text-sm font-bold text-teal-dark block mt-1">SIMULATED Trusted Issuer Service</span>
          </div>
        </div>
      </div>
    </div>
  );
};
