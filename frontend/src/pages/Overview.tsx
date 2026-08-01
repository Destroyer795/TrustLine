import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, ArrowRight, Lightning, Scales, Lock, ArrowsClockwise } from '@phosphor-icons/react';
import { api } from '../services/api';

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

  return (
    <div className="space-y-10">
      {/* Hero Section */}
      <section className="card-editorial p-10 rounded-lg relative overflow-hidden">
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1 bg-teal-light text-teal-dark rounded text-xs font-mono font-semibold uppercase tracking-wider">
            <span>FinTech Hackathon Solution</span>
          </div>
          <h1 className="text-4xl font-serif font-bold text-ink leading-tight">
            TrustLine — Autonomous Agent Credit Infrastructure
          </h1>
          <p className="text-muted-ink text-lg leading-relaxed font-sans">
            How can temporary working capital be extended to an AI agent when the agent itself lacks legal identity, collateral, and contractual accountability?
          </p>
          <div className="pt-4 flex items-center space-x-4">
            <Link
              to="/demo-lab"
              className="px-5 py-2.5 bg-teal text-surface font-medium rounded hover:bg-teal-dark transition-colors flex items-center space-x-2 shadow-sm"
            >
              <span>Launch 3-Minute Demo Lab</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/agents"
              className="px-5 py-2.5 bg-canvas border border-border text-ink font-medium rounded hover:bg-surface transition-colors"
            >
              View Agents Inventory
            </Link>
          </div>
        </div>
      </section>

      {/* Core Architectural Pillars */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card-editorial p-6 rounded-lg space-y-3">
          <div className="w-10 h-10 rounded bg-teal/10 text-teal flex items-center justify-center font-serif font-bold">
            <Lock className="w-5 h-5" />
          </div>
          <h3 className="font-serif font-bold text-xl text-ink">Ed25519 Signed Mandates</h3>
          <p className="text-sm text-muted-ink leading-relaxed">
            Every agent draw is verified against a canonical Ed25519-signed capability mandate bound to an accountable human or enterprise principal.
          </p>
        </div>

        <div className="card-editorial p-6 rounded-lg space-y-3">
          <div className="w-10 h-10 rounded bg-warning/10 text-warning flex items-center justify-center font-serif font-bold">
            <Scales className="w-5 h-5" />
          </div>
          <h3 className="font-serif font-bold text-xl text-ink">AHP Policy Priors & Asymmetric Limits</h3>
          <p className="text-sm text-muted-ink leading-relaxed">
            Scores 5 risk components separately. Provisional priors are explicitly tagged. Credit grows slowly (&alpha;<sub>up</sub> = 0.15) and drops rapidly (&alpha;<sub>down</sub> = 0.65).
          </p>
        </div>

        <div className="card-editorial p-6 rounded-lg space-y-3">
          <div className="w-10 h-10 rounded bg-olive/10 text-olive flex items-center justify-center font-serif font-bold">
            <Lightning className="w-5 h-5" />
          </div>
          <h3 className="font-serif font-bold text-xl text-ink">Outside-Agent Enforcement</h3>
          <p className="text-sm text-muted-ink leading-relaxed">
            Enforcement lives in the backend API Gateway outside the agent's LLM context. Atomic checks via PostgreSQL <code className="font-mono text-xs bg-canvas px-1 rounded">select_for_update</code> eliminate double-spend race conditions.
          </p>
        </div>
      </section>

      {/* System Live Metrics */}
      <section className="card-editorial p-8 rounded-lg space-y-6">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div>
            <h2 className="text-2xl font-serif font-bold text-ink">System Real-Time Summary</h2>
            <p className="text-xs font-mono text-muted-ink mt-1">OPERATIONAL DATABASE STATE</p>
          </div>
          <button
            onClick={loadStats}
            className="px-3 py-1.5 bg-canvas border border-border text-xs font-medium rounded hover:bg-surface transition-colors flex items-center space-x-1"
          >
            <ArrowsClockwise className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="p-4 bg-canvas rounded border border-border">
            <span className="text-xs font-mono text-muted-ink block uppercase">Principals</span>
            <span className="text-2xl font-serif font-bold text-ink block mt-1">{loading ? '...' : stats?.principals}</span>
          </div>
          <div className="p-4 bg-canvas rounded border border-border">
            <span className="text-xs font-mono text-muted-ink block uppercase">Active Agents</span>
            <span className="text-2xl font-serif font-bold text-ink block mt-1">{loading ? '...' : stats?.agents}</span>
          </div>
          <div className="p-4 bg-canvas rounded border border-border">
            <span className="text-xs font-mono text-muted-ink block uppercase">Draw Requests</span>
            <span className="text-2xl font-serif font-bold text-ink block mt-1">{loading ? '...' : stats?.draws}</span>
          </div>
          <div className="p-4 bg-canvas rounded border border-border">
            <span className="text-xs font-mono text-muted-ink block uppercase">Repayments</span>
            <span className="text-2xl font-serif font-bold text-ink block mt-1">{loading ? '...' : stats?.repayments}</span>
          </div>
          <div className="p-4 bg-canvas rounded border border-border">
            <span className="text-xs font-mono text-muted-ink block uppercase">Audit Chain</span>
            <span className={`text-sm font-mono font-bold block mt-2 ${stats?.audit_chain_valid ? 'text-teal' : 'text-danger'}`}>
              {loading ? '...' : stats?.audit_chain_valid ? '✅ VALID' : '❌ CORRUPTED'}
            </span>
          </div>
        </div>
      </section>
    </div>
  );
};
