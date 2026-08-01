import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Bank,
  Fingerprint,
  Gauge,
  LockKey,
  Repeat,
  SealCheck,
} from "@phosphor-icons/react";
import { api } from "../services/api";
import { Agent, AgentAnalytics, PortfolioAnalytics } from "../types";
import { DoubleBezel, InlineError, SkeletonBlock } from "../components/ui";
import { StatusBadge } from "../components/StatusBadge";
import { LineChart } from "../components/Charts";

export const Overview: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [agent, setAgent] = useState<Agent | null>(null);
  const [portfolio, setPortfolio] = useState<PortfolioAnalytics | null>(null);
  const [history, setHistory] = useState<AgentAnalytics | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const load = async () => {
    try {
      setLoading(true);
      setError("");
      const [s, agents, p] = await Promise.all([
        api.getDemoStatus(),
        api.getAgents(),
        api.getPortfolioAnalytics(),
      ]);
      const preferred =
        agents.find((a) => a.display_name === "Atlas Procurement Bot") ||
        agents.find((a) => a.status === "NORMAL") ||
        agents[0] ||
        null;
      setStats(s);
      setAgent(preferred);
      setPortfolio(p);
      if (preferred) setHistory(await api.getAgentAnalytics(preferred.id));
    } catch (e: any) {
      setError(e.message || "Backend unavailable. Render may be waking up.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, []);
  const loop = [Fingerprint, Gauge, Bank, LockKey, Repeat, SealCheck];
  return (
    <div className="space-y-24 md:space-y-32">
      <section className="grid min-h-[72dvh] items-center gap-10 lg:grid-cols-[1.15fr_.85fr]">
        <div className="page-enter">
          <p className="eyebrow mb-5">Autonomous Agent Credit Infrastructure</p>
          <h1 className="hero-title max-w-4xl font-serif font-semibold">
            Credit for agents.
            <br />
            <em className="font-medium text-teal">Control for principals.</em>
          </h1>
          <p className="mt-7 max-w-[58ch] text-lg leading-relaxed text-muted-ink">
            Extend bounded working capital to autonomous agents through verified
            authority, behavioral underwriting, and repayment enforced outside
            the agent.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link to="/demo-lab" className="btn-primary">
              Run the proof{" "}
              <span className="icon-island">
                <ArrowRight size={17} />
              </span>
            </Link>
            <Link
              to="/presentation"
              className="font-semibold text-ink underline decoration-teal/40 underline-offset-8 hover:decoration-teal"
            >
              Inspect the argument
            </Link>
          </div>
          {error && (
            <div className="mt-6">
              <InlineError message={error} onRetry={load} />
            </div>
          )}
        </div>
        <DoubleBezel className="page-enter" innerClassName="overflow-hidden">
          <div className="bg-teal px-7 py-6 text-surface">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-[.18em] text-surface/70">
                Live credit instrument
              </span>
              {agent && <StatusBadge status={agent.status} />}
            </div>
            <p className="mt-10 font-serif text-4xl font-semibold">
              {loading
                ? "Loading agent…"
                : agent?.display_name || "No agent registered"}
            </p>
            <p className="mt-2 text-sm text-surface/70">
              Bound to {agent?.principal_name || "a verified principal"}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-px bg-ink/10">
            <div className="bg-surface p-6">
              <p className="eyebrow">Current limit</p>
              {loading ? (
                <SkeletonBlock className="mt-3 h-10" />
              ) : (
                <p className="metric mt-3 text-3xl font-semibold">
                  ₹{Number(agent?.current_limit || 0).toLocaleString("en-IN")}
                </p>
              )}
            </div>
            <div className="bg-surface p-6">
              <p className="eyebrow">Available</p>
              {loading ? (
                <SkeletonBlock className="mt-3 h-10" />
              ) : (
                <p className="metric mt-3 text-3xl font-semibold">
                  ₹
                  {Number(agent?.available_credit || 0).toLocaleString("en-IN")}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between px-7 py-5 font-mono text-xs">
            <span>Gateway enforcement</span>
            <span className="flex items-center gap-2 font-semibold text-teal-dark">
              <SealCheck size={18} weight="light" />
              ACTIVE
            </span>
          </div>
        </DoubleBezel>
      </section>

      {portfolio && (
        <section className="grid gap-5 lg:grid-cols-12">
          <div className="card-editorial grid grid-cols-2 gap-px overflow-hidden bg-border lg:col-span-5">
            <PortfolioMetric
              label="Authorized"
              value={portfolio.summary.authorized_capital}
            />
            <PortfolioMetric
              label="Current limits"
              value={portfolio.summary.current_limits}
            />
            <PortfolioMetric
              label="Available"
              value={portfolio.summary.available_credit}
            />
            <PortfolioMetric
              label="Outstanding"
              value={portfolio.summary.outstanding_principal}
            />
          </div>
          <DoubleBezel className="lg:col-span-7" innerClassName="p-6">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="eyebrow">Trust versus exposure</p>
                <h2 className="mt-2 text-3xl font-semibold">
                  Atlas earns room gradually
                </h2>
              </div>
              <Link
                to="/analytics"
                className="text-sm font-semibold text-teal-dark"
              >
                Explore analytics →
              </Link>
            </div>
            <div className="mt-4">
              <LineChart
                data={(history?.risk_history || []).map((x) => ({
                  label: new Date(x.at).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                  }),
                  value: Number(x.score),
                  secondary: Number(x.exposure_utilization),
                }))}
                label="Trust evidence"
                secondaryLabel="Exposure %"
              />
            </div>
          </DoubleBezel>
        </section>
      )}

      <section>
        <p className="eyebrow">The judge's three questions</p>
        <div className="stagger mt-7 grid gap-5 md:grid-cols-12">
          <article className="card-editorial p-7 md:col-span-5 md:p-9">
            <Fingerprint size={34} weight="light" className="text-teal" />
            <h2 className="mt-12 text-4xl font-semibold">Who authorized it?</h2>
            <p className="mt-4 max-w-[45ch] leading-relaxed text-muted-ink">
              A scoped Ed25519 mandate binds agent, principal, linked account,
              capabilities, limits, and expiry.
            </p>
          </article>
          <article className="rounded-[1.5rem] bg-olive p-7 text-surface md:col-span-3 md:p-9">
            <Gauge size={34} weight="light" />
            <h2 className="mt-12 text-3xl font-semibold">
              How is risk bounded?
            </h2>
            <p className="mt-4 leading-relaxed text-surface/75">
              Cold-start floors, principal-wide ceilings, asymmetric limit
              changes, and atomic reservations cap loss.
            </p>
          </article>
          <article className="card-editorial p-7 md:col-span-4 md:p-9">
            <Bank size={34} weight="light" className="text-warning" />
            <h2 className="mt-12 text-4xl font-semibold">Who repays?</h2>
            <p className="mt-4 leading-relaxed text-muted-ink">
              The principal-backed mandate pulls automatically. Failure freezes
              the line instead of silently accruing debt.
            </p>
          </article>
        </div>
      </section>

      <section className="grid gap-10 lg:grid-cols-[.72fr_1.28fr]">
        <div>
          <p className="eyebrow">Closed feedback loop</p>
          <h2 className="display-title mt-5 font-semibold">
            The weights are not the product.
          </h2>
          <p className="mt-6 max-w-[52ch] leading-relaxed text-muted-ink">
            The product is the loop: behavior, decision, outcome, and
            recalibration. Exposure stays bounded while evidence compounds.
          </p>
        </div>
        <DoubleBezel innerClassName="p-7 md:p-9">
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              "Verified mandate",
              "Risk profile",
              "Credit limit",
              "Atomic gateway",
              "Mandate pull",
              "Outcome history",
            ].map((label, i) => {
              const Icon = loop[i];
              return (
                <div
                  key={label}
                  className="flex items-center gap-4 rounded-2xl bg-canvas p-4"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-teal-light text-teal">
                    <Icon size={22} weight="light" />
                  </span>
                  <span className="font-semibold">{label}</span>
                  <span className="ml-auto font-mono text-[10px] text-muted-ink">
                    0{i + 1}
                  </span>
                </div>
              );
            })}
          </div>
        </DoubleBezel>
      </section>

      <section className="rounded-[2rem] bg-ink p-8 text-canvas md:p-14">
        <p className="eyebrow text-canvas/60">The honest claim</p>
        <blockquote className="mt-6 max-w-5xl font-serif text-3xl font-medium leading-tight md:text-5xl">
          There is no historical default data for autonomous agents. TrustLine
          uses documented expert priors while structurally bounding exposure,
          then recalibrates as real outcomes accumulate.
        </blockquote>
        <div className="mt-10 grid grid-cols-2 gap-6 border-t border-canvas/15 pt-8 md:grid-cols-4">
          {[
            ["Principals", stats?.principals],
            ["Agents", stats?.agents],
            ["Draws", stats?.draws],
            ["Audit events", stats?.audit_events],
          ].map(([k, v]) => (
            <div key={k}>
              <p className="metric text-3xl">{loading ? "—" : (v ?? 0)}</p>
              <p className="mt-1 text-xs text-canvas/55">{k}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
const PortfolioMetric = ({
  label,
  value,
}: {
  label: string;
  value: string;
}) => (
  <div className="bg-surface p-5">
    <p className="font-mono text-[9px] uppercase tracking-wider text-muted-ink">
      {label}
    </p>
    <strong className="metric mt-2 block text-2xl">
      ₹{Number(value).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
    </strong>
  </div>
);
