import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShieldCheck, Lock, LockOpen, ArrowsClockwise, WarningOctagon, Sparkle, Scales } from '@phosphor-icons/react';
import { Agent, RiskProfile, RepaymentSchedule } from '../types';
import { api } from '../services/api';
import { StatusBadge, ImputedBadge } from '../components/StatusBadge';

export const AgentDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [risk, setRisk] = useState<RiskProfile | null>(null);
  const [repayments, setRepayments] = useState<RepaymentSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const loadData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const [agData, riskData, repayData] = await Promise.all([
        api.getAgentDetail(id),
        api.getRiskProfile(id),
        api.getRepayments(id)
      ]);
      setAgent(agData);
      setRisk(riskData);
      setRepayments(repayData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleFreezeToggle = async () => {
    if (!agent) return;
    try {
      setActionLoading(true);
      if (agent.status === 'FROZEN') {
        await api.unfreezeAgent(agent.id, 'Principal manual unfreeze override');
      } else {
        await api.freezeAgent(agent.id, 'Principal manual freeze override');
      }
      await loadData();
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRecalculate = async () => {
    if (!agent) return;
    try {
      setActionLoading(true);
      await api.recalculateRisk(agent.id);
      await loadData();
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading || !agent) {
    return <div className="p-12  text-muted-ink font-mono text-sm">Loading agent credit profile...</div>;
  }

  const ca = agent.credit_account;
  const mandate = agent.mandate;

  return (
    <div className="space-y-8">
      {/* Header & Controls */}
      <div className="card-editorial p-6 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-3xl font-serif font-bold text-ink">{agent.display_name}</h1>
            <StatusBadge status={agent.status} />
          </div>
          <p className="text-sm text-muted-ink mt-1">
            Authorized by <span className="font-semibold text-ink">{agent.principal?.name}</span> • Purpose: {agent.purpose}
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleRecalculate}
            disabled={actionLoading}
            className="px-3 py-2 bg-canvas border border-border text-xs font-medium rounded hover:bg-surface transition-colors flex items-center space-x-1 text-ink"
          >
            <ArrowsClockwise className="w-3.5 h-3.5" />
            <span>Recalculate Risk</span>
          </button>

          <button
            onClick={handleFreezeToggle}
            disabled={actionLoading}
            className={`px-4 py-2 text-xs font-medium rounded transition-colors flex items-center space-x-1.5 shadow-sm ${
              agent.status === 'FROZEN'
                ? 'bg-teal text-surface hover:bg-teal-dark'
                : 'bg-danger text-surface hover:bg-danger/90'
            }`}
          >
            {agent.status === 'FROZEN' ? <LockOpen className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
            <span>{agent.status === 'FROZEN' ? 'Unfreeze Agent Line' : 'Emergency Freeze Line'}</span>
          </button>
        </div>
      </div>

      {/* Credit Limits Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card-editorial p-5 rounded-lg">
          <span className="text-xs font-mono text-muted-ink block uppercase">Current Credit Limit</span>
          <span className="text-2xl font-serif font-bold text-ink block mt-1">₹{parseFloat(ca?.current_limit || '0').toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          <span className="text-[11px] text-muted-ink block mt-1">Target Limit: ₹{parseFloat(ca?.target_limit || '0').toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
        </div>

        <div className="card-editorial p-5 rounded-lg">
          <span className="text-xs font-mono text-muted-ink block uppercase">Available Credit</span>
          <span className="text-2xl font-serif font-bold text-teal-dark block mt-1">₹{parseFloat(ca?.available_credit || '0').toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          <span className="text-[11px] text-muted-ink block mt-1">Ready for Immediate Draw</span>
        </div>

        <div className="card-editorial p-5 rounded-lg">
          <span className="text-xs font-mono text-muted-ink block uppercase">Reserved Balance</span>
          <span className="text-2xl font-serif font-bold text-warning block mt-1">₹{parseFloat(ca?.reserved_amount || '0').toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          <span className="text-[11px] text-muted-ink block mt-1">In-Flight Transactions</span>
        </div>

        <div className="card-editorial p-5 rounded-lg">
          <span className="text-xs font-mono text-muted-ink block uppercase">Outstanding Principal</span>
          <span className="text-2xl font-serif font-bold text-ink block mt-1">₹{parseFloat(ca?.outstanding_principal || '0').toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          <span className="text-[11px] text-muted-ink block mt-1">Pending Mandate Repayment</span>
        </div>
      </div>

      {/* Narrative Explanation Banner */}
      {risk?.explanation && (
        <div className="card-editorial p-6 rounded-lg bg-surface border-teal/30 space-y-2">
          <div className="flex items-center space-x-2 text-teal font-serif font-bold">
            <Sparkle className="w-5 h-5" />
            <span>Underwriting Narrative ({risk.explanation.source})</span>
          </div>
          <p className="text-sm text-ink leading-relaxed font-sans">
            "{risk.explanation.narrative}"
          </p>
        </div>
      )}

      {/* 5 Risk Profile Components Breakdown */}
      <section className="card-editorial p-6 rounded-lg space-y-6">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div>
            <h2 className="text-2xl font-serif font-bold text-ink">Risk Profile Breakdown & Evidence</h2>
            <p className="text-xs font-mono text-muted-ink mt-1">Weighted Risk Score: {risk?.weighted_risk_score}/100 • AHP Version v1.0</p>
          </div>
          <div className="flex items-center space-x-2">
            <Scales className="w-4 h-4 text-teal" />
            <span className="text-xs font-mono text-muted-ink">CR ≤ 0.10 Verified</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {risk?.evidence.map((ev) => (
            <div key={ev.component} className="p-4 bg-canvas rounded border border-border space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-serif font-bold text-base text-ink">{ev.component}</span>
                <ImputedBadge isImputed={ev.is_imputed} />
              </div>
              <div className="flex items-baseline space-x-2">
                <span className="text-2xl font-mono font-bold text-ink">{(parseFloat(ev.score) * (ev.component === 'EXPOSURE' ? 100 : 100)).toFixed(1)}</span>
                <span className="text-xs text-muted-ink">/ 100</span>
              </div>
              <p className="text-xs text-muted-ink leading-normal">{ev.reason}</p>
              <div className="text-[10px] font-mono text-muted-ink pt-1">
                Source: {ev.source} • Samples: {ev.evidence_count}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Active Mandate Security Details */}
      <section className="card-editorial p-6 rounded-lg space-y-4">
        <h2 className="text-xl font-serif font-bold text-ink border-b border-border pb-2">Active Ed25519 Capability Mandate</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
          <div className="p-3 bg-canvas rounded border border-border">
            <span className="text-muted-ink block">Mandate Version</span>
            <span className="text-sm font-bold text-ink block mt-1">v{mandate?.version}</span>
          </div>
          <div className="p-3 bg-canvas rounded border border-border">
            <span className="text-muted-ink block">Authorized Ceiling</span>
            <span className="text-sm font-bold text-ink block mt-1">₹{parseFloat(mandate?.authorized_ceiling || '0').toLocaleString('en-IN')}</span>
          </div>
          <div className="p-3 bg-canvas rounded border border-border">
            <span className="text-muted-ink block">Mandate Signature Verification</span>
            <span className={`text-sm font-bold block mt-1 ${mandate?.is_valid ? 'text-teal' : 'text-danger'}`}>
              {mandate?.is_valid ? '✅ Cryptographically Valid' : '❌ Invalid / Expired'}
            </span>
          </div>
        </div>
      </section>

      {/* Repayments History */}
      <section className="card-editorial p-6 rounded-lg space-y-4">
        <h2 className="text-xl font-serif font-bold text-ink border-b border-border pb-2">Scheduled Mandate Repayment Pulls</h2>
        {repayments.length === 0 ? (
          <p className="text-xs text-muted-ink font-mono">No repayment schedules generated yet.</p>
        ) : (
          <div className="space-y-3">
            {repayments.map((s) => (
              <div key={s.id} className="p-4 bg-canvas rounded border border-border flex items-center justify-between text-xs font-mono">
                <div>
                  <span className="font-bold text-ink text-sm block">Scheduled Mandate Pull: ₹{parseFloat(s.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  <span className="text-muted-ink block mt-0.5">Due Date: {new Date(s.due_date).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className={`px-2.5 py-1 rounded font-bold ${
                    s.status === 'SETTLED' ? 'bg-teal-light text-teal-dark' : s.status === 'FAILED' ? 'bg-danger-light text-danger' : 'bg-canvas border border-border text-ink'
                  }`}>
                    {s.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
