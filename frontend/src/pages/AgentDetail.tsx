import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Lock, Unlock, RefreshCw, Sparkles, Scale, ShieldCheck, ShieldAlert, ArrowLeft } from 'lucide-react';
import { Agent, RiskProfile, RepaymentSchedule, CreditLimitChange, TaskReceipt } from '../types';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { StatCard } from '../components/StatCard';
import { LoadingState } from '../components/LoadingState';
import { LimitTrajectory } from '../components/charts/LimitTrajectory';
import { RiskComponents } from '../components/charts/RiskComponents';
import { formatINR } from '../lib/format';
import { cn } from '../lib/cn';

const repaymentChip = (status: string) => {
  switch (status) {
    case 'SETTLED':
      return 'bg-teal-light text-teal-dark border-teal/30';
    case 'FAILED':
      return 'bg-danger-light text-danger border-danger/30';
    default:
      return 'bg-canvas text-ink border-border';
  }
};

export const AgentDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [risk, setRisk] = useState<RiskProfile | null>(null);
  const [repayments, setRepayments] = useState<RepaymentSchedule[]>([]);
  const [limitHistory, setLimitHistory] = useState<CreditLimitChange[]>([]);
  const [receipts, setReceipts] = useState<TaskReceipt[]>([]);
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
    }
    // Read-only story endpoints degrade to empty states if not yet deployed.
    try {
      const [history, receiptData] = await Promise.all([
        api.getLimitHistory(id).catch(() => []),
        api.getReceipts(id).catch(() => []),
      ]);
      setLimitHistory(history);
      setReceipts(receiptData);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
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
    return (
      <div className="card-editorial rounded-sm">
        <LoadingState label="Loading agent credit profile…" />
      </div>
    );
  }

  const ca = agent.credit_account;
  const mandate = agent.mandate;

  return (
    <div className="space-y-10">
      {/* Back link */}
      <Link to="/agents" className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-muted-ink hover:text-teal-dark transition-colors">
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
        Back to Inventory
      </Link>

      {/* Header & Controls */}
      <section className="pb-6 border-b border-border">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <p className="flex items-center gap-3">
              <span aria-hidden="true" className="h-px w-8 bg-accent" />
              <span className="kicker text-muted-ink">Credit Profile</span>
            </p>
            <h1 className="mt-3 flex flex-wrap items-center gap-3 font-display text-3xl md:text-4xl font-semibold tracking-tight text-ink">
              {agent.display_name}
              <StatusBadge status={agent.status} />
            </h1>
            <p className="mt-2 text-sm text-muted-ink">
              Authorized by <span className="font-semibold text-ink">{agent.principal?.name}</span>
              <span aria-hidden="true" className="mx-2 text-border-dark">•</span>
              Purpose: {agent.purpose}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleRecalculate}
              disabled={actionLoading}
              className="inline-flex items-center gap-2 rounded-[2px] bg-canvas border border-border px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-surface active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Recalculate Risk
            </button>
            <button
              onClick={handleFreezeToggle}
              disabled={actionLoading}
              className={`inline-flex items-center gap-2 rounded-[2px] px-4 py-2 text-sm font-medium text-surface transition-colors active:translate-y-px shadow-card disabled:cursor-not-allowed disabled:opacity-50 ${
                agent.status === 'FROZEN' ? 'bg-teal hover:bg-teal-dark' : 'bg-danger hover:bg-danger/90'
              }`}
            >
              {agent.status === 'FROZEN' ? <Unlock className="h-4 w-4" aria-hidden="true" /> : <Lock className="h-4 w-4" aria-hidden="true" />}
              {agent.status === 'FROZEN' ? 'Unfreeze Agent Line' : 'Emergency Freeze Line'}
            </button>
          </div>
        </div>
      </section>

      {/* Credit Limits Summary */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Current Credit Limit" value={formatINR(ca?.current_limit)} caption={`Target Limit: ${formatINR(ca?.target_limit)}`} accent="ink" />
        <StatCard label="Available Credit" value={formatINR(ca?.available_credit)} caption="Ready for Immediate Draw" accent="teal" />
        <StatCard label="Reserved Balance" value={formatINR(ca?.reserved_amount)} caption="In-Flight Transactions" accent="warning" />
        <StatCard label="Outstanding Principal" value={formatINR(ca?.outstanding_principal)} caption="Pending Mandate Repayment" accent="default" />
      </section>

      {/* Credit Limit Trajectory — the "earned slowly, lost fast" story */}
      <section className="card-editorial rounded-sm">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-border px-6 pt-6 pb-4">
          <div>
            <p className="flex items-center gap-3">
              <span aria-hidden="true" className="h-px w-8 bg-accent" />
              <span className="kicker text-muted-ink">Asymmetric EMA</span>
            </p>
            <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight text-ink">Credit Limit Trajectory</h2>
          </div>
          <p className="font-mono text-xs text-muted-ink">earned slowly (α↑ 0.15) · lost fast (α↓ 0.65)</p>
        </div>
        <div className="p-5 md:p-6">
          {limitHistory.length === 0 ? (
            <p className="py-6 text-center font-mono text-xs text-muted-ink">
              No limit changes recorded yet — run a draw or repayment to move the line.
            </p>
          ) : (
            <LimitTrajectory changes={limitHistory} />
          )}
        </div>
      </section>

      {/* Narrative Explanation */}
      {risk?.explanation && (
        <figure className="card-editorial rounded-sm border-l-4 border-l-accent p-7">
          <figcaption className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-accent" aria-hidden="true" />
            <span className="kicker text-muted-ink">Underwriting Narrative ({risk.explanation.source})</span>
          </figcaption>
          <blockquote className="mt-3 font-display text-lg md:text-xl italic text-walnut leading-relaxed">
            “{risk.explanation.narrative}”
          </blockquote>
        </figure>
      )}

      {/* Risk Profile Scoreboard */}
      <section>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 pb-4 border-b border-border">
          <div>
            <p className="flex items-center gap-3">
              <span aria-hidden="true" className="h-px w-8 bg-accent" />
              <span className="kicker text-muted-ink">AHP Breakdown</span>
            </p>
            <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight text-ink">Risk Profile Breakdown &amp; Evidence</h2>
          </div>
          <div className="flex items-center gap-2 font-mono text-xs text-muted-ink">
            <Scale className="h-4 w-4 text-teal" aria-hidden="true" />
            Weighted: <span className="font-semibold text-ink">{risk?.weighted_risk_score}/100</span> • CR ≤ 0.10 Verified
          </div>
        </div>

        <div className="mt-5">
          {risk?.evidence && <RiskComponents evidence={risk.evidence} weighted={risk.weighted_risk_score} />}
        </div>
      </section>

      {/* Verified Task Receipts — Ed25519 proof of work */}
      <section>
        <div className="pb-4 border-b border-border">
          <p className="flex items-center gap-3">
            <span aria-hidden="true" className="h-px w-8 bg-accent" />
            <span className="kicker text-muted-ink">Attestation</span>
          </p>
          <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight text-ink">Verified Ed25519 Task Receipts</h2>
        </div>
        {receipts.length === 0 ? (
          <p className="mt-5 font-mono text-xs text-muted-ink">No verified task receipts yet — they accrue as the agent completes attested work.</p>
        ) : (
          <ul className="mt-5 divide-y divide-border border border-border rounded-sm bg-surface shadow-card">
            {receipts.map((r) => (
              <li key={r.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4">
                <div className="min-w-0">
                  <span className="block font-display text-base font-semibold text-ink">{r.issuer}</span>
                  <span className="mt-0.5 block font-mono text-xs text-muted-ink">
                    {r.value != null ? formatINR(r.value) : 'No value'} • {new Date(r.issued_at).toLocaleString()}
                  </span>
                  <span className="mt-1 block break-all font-mono text-[10px] text-muted-ink" title="Ed25519 signature (truncated)">
                    {r.signature_short}
                  </span>
                </div>
                <span
                  className={cn(
                    'inline-flex w-fit items-center rounded-[2px] border px-2.5 py-1 font-mono text-xs font-semibold',
                    r.outcome === 'SUCCESS' ? 'bg-teal-light text-teal-dark border-teal/30' : 'bg-danger-light text-danger border-danger/30',
                  )}
                >
                  {r.outcome}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Active Mandate Security Details */}
      <section>
        <div className="pb-4 border-b border-border">
          <p className="flex items-center gap-3">
            <span aria-hidden="true" className="h-px w-8 bg-accent" />
            <span className="kicker text-muted-ink">Security</span>
          </p>
          <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight text-ink">Active Ed25519 Capability Mandate</h2>
        </div>
        <div className="mt-5 grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border border border-border rounded-sm overflow-hidden bg-surface shadow-card">
          <div className="p-5">
            <span className="kicker text-muted-ink">Mandate Version</span>
            <span className="mt-2 block font-mono text-lg font-semibold text-ink">v{mandate?.version}</span>
          </div>
          <div className="p-5">
            <span className="kicker text-muted-ink">Authorized Ceiling</span>
            <span className="mt-2 block font-mono text-lg font-semibold text-ink">{formatINR(mandate?.authorized_ceiling, 0)}</span>
          </div>
          <div className="p-5">
            <span className="kicker text-muted-ink">Mandate Signature</span>
            <span className={`mt-2 inline-flex items-center gap-2 font-mono text-sm font-semibold ${mandate?.is_valid ? 'text-teal-dark' : 'text-danger'}`}>
              {mandate?.is_valid ? (
                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              ) : (
                <ShieldAlert className="h-4 w-4" aria-hidden="true" />
              )}
              {mandate?.is_valid ? 'Cryptographically Valid' : 'Invalid / Expired'}
            </span>
          </div>
        </div>
      </section>

      {/* Repayments History */}
      <section>
        <div className="pb-4 border-b border-border">
          <p className="flex items-center gap-3">
            <span aria-hidden="true" className="h-px w-8 bg-accent" />
            <span className="kicker text-muted-ink">Collections</span>
          </p>
          <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight text-ink">Scheduled Mandate Repayment Pulls</h2>
        </div>
        {repayments.length === 0 ? (
          <p className="mt-5 font-mono text-xs text-muted-ink">No repayment schedules generated yet.</p>
        ) : (
          <div className="mt-5 space-y-3">
            {repayments.map((s) => (
              <div key={s.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-[2px] border border-border bg-surface px-5 py-4 shadow-card">
                <div>
                  <span className="block font-display text-base font-semibold text-ink">{formatINR(s.amount)}</span>
                  <span className="mt-0.5 block font-mono text-xs text-muted-ink">
                    Scheduled Mandate Pull • Due {new Date(s.due_date).toLocaleDateString()}
                  </span>
                </div>
                <span className={`inline-flex w-fit items-center rounded-[2px] border px-2.5 py-1 font-mono text-xs font-semibold ${repaymentChip(s.status)}`}>
                  {s.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
