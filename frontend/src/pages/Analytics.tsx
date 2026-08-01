import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BezierCurve,
  Calculator,
  CheckCircle,
  Database,
  ShieldWarning,
  TrendUp,
} from "@phosphor-icons/react";
import { Link } from "react-router-dom";
import { api, APIRequestError } from "../services/api";
import { AgentAnalytics, PortfolioAnalytics, SimulationResult } from "../types";
import { BarChart, DonutChart, LineChart } from "../components/Charts";
import {
  DoubleBezel,
  InlineError,
  PageHeader,
  SkeletonBlock,
} from "../components/ui";
import { StatusBadge } from "../components/StatusBadge";

const rupees = (value: string | number) =>
  `₹${Number(value).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
const date = (value: string) =>
  new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
  });

export const Analytics = () => {
  const [portfolio, setPortfolio] = useState<PortfolioAnalytics>();
  const [detail, setDetail] = useState<AgentAnalytics>();
  const [selected, setSelected] = useState("");
  const [window, setWindow] = useState("30d");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState(900);
  const [category, setCategory] = useState("API_SERVICES");
  const [outcome, setOutcome] = useState<"SUCCESS" | "FAIL">("SUCCESS");
  const [simulation, setSimulation] = useState<SimulationResult>();
  const [simBusy, setSimBusy] = useState(false);
  const loadPortfolio = async () => {
    try {
      setError("");
      setLoading(true);
      const p = await api.getPortfolioAnalytics();
      setPortfolio(p);
      setSelected((s) => s || p.exposure_by_bot[0]?.agent_id || "");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    loadPortfolio();
  }, []);
  useEffect(() => {
    if (!selected) return;
    api
      .getAgentAnalytics(selected, window)
      .then(setDetail)
      .catch((e: any) => setError(e.message));
  }, [selected, window]);
  const risk = useMemo(
    () =>
      detail?.risk_history.map((x) => ({
        label: date(x.at),
        value: Number(x.score),
      })) || [],
    [detail],
  );
  const credit = useMemo(() => {
    const limits = detail?.limit_history || [];
    return limits.map((x, i) => ({
      label: date(x.at),
      value: Number(x.limit),
      secondary: Number(detail?.exposure_history[i]?.balance || 0),
    }));
  }, [detail]);
  const runSim = async () => {
    if (!selected) return;
    try {
      setSimBusy(true);
      setSimulation(
        await api.simulateAgent(selected, {
          amount,
          merchant_category: category,
          repayment_outcome: outcome,
        }),
      );
    } catch (e: any) {
      setError(
        e instanceof APIRequestError ? `${e.code}: ${e.message}` : e.message,
      );
    } finally {
      setSimBusy(false);
    }
  };
  return (
    <div className="space-y-12">
      <PageHeader
        label="Evidence analytics"
        title="Trust, exposure, and control"
        body="Every chart resolves to seeded backend records. These are deterministic demonstration histories—not statistical forecasts."
      />
      {error && <InlineError message={error} onRetry={loadPortfolio} />}{" "}
      {loading ? (
        <SkeletonBlock className="h-80" />
      ) : (
        portfolio && (
          <>
            <section className="card-editorial flex flex-wrap items-center gap-4 px-5 py-4">
              <span className="eyebrow">Active scope</span>
              <select
                aria-label="Bot"
                className="control w-auto min-w-64"
                value={selected}
                onChange={(e) => setSelected(e.target.value)}
              >
                {portfolio.exposure_by_bot.map((x) => (
                  <option key={x.agent_id} value={x.agent_id}>
                    {x.agent_name}
                  </option>
                ))}
              </select>
              <select
                aria-label="Time window"
                className="control w-auto"
                value={window}
                onChange={(e) => setWindow(e.target.value)}
              >
                <option value="7d">7 days</option>
                <option value="30d">30 days</option>
                <option value="all">All evidence</option>
              </select>
              <span className="ml-auto flex items-center gap-2 text-xs text-muted-ink">
                <Database />
                Seeded demo evidence ·{" "}
                {new Date(portfolio.as_of).toLocaleTimeString()}
              </span>
            </section>
            <section className="grid gap-4 lg:grid-cols-12">
              <DoubleBezel
                className="lg:col-span-5"
                innerClassName="h-full bg-teal p-7 text-surface"
              >
                <p className="font-mono text-[10px] uppercase tracking-[.18em] text-surface/70">
                  Authorized capital
                </p>
                <strong className="metric mt-7 block text-6xl">
                  {rupees(portfolio.summary.authorized_capital)}
                </strong>
                <p className="mt-5 max-w-sm text-sm leading-relaxed text-surface/75">
                  Capital Northstar permits across every bounded line. It is not
                  the amount currently exposed.
                </p>
              </DoubleBezel>
              <Metric
                span="lg:col-span-2"
                label="Current limits"
                value={rupees(portfolio.summary.current_limits)}
                icon={<TrendUp />}
              />
              <Metric
                span="lg:col-span-2"
                label="Available now"
                value={rupees(portfolio.summary.available_credit)}
                icon={<CheckCircle />}
              />
              <Metric
                span="lg:col-span-3"
                label="Outstanding"
                value={rupees(portfolio.summary.outstanding_principal)}
                icon={<ShieldWarning />}
              />
            </section>
            {detail && (
              <>
                <section className="grid gap-6 lg:grid-cols-12">
                  <DoubleBezel
                    className="lg:col-span-7"
                    innerClassName="p-6 md:p-8"
                  >
                    <div className="mb-7 flex items-start justify-between">
                      <div>
                        <p className="eyebrow">Underwriting trajectory</p>
                        <h2 className="mt-2 text-3xl font-semibold">
                          Risk evidence over time
                        </h2>
                      </div>
                      <StatusBadge status={detail.summary.authority as any} />
                    </div>
                    <LineChart data={risk} label="Risk score" />
                  </DoubleBezel>
                  <DoubleBezel
                    className="lg:col-span-5"
                    innerClassName="p-6 md:p-8"
                  >
                    <p className="eyebrow">Merchant mix</p>
                    <h2 className="mb-7 mt-2 text-3xl font-semibold">
                      Where authority was used
                    </h2>
                    <DonutChart
                      data={detail.merchant_categories.map((x) => ({
                        label: x.category,
                        value: Number(x.amount),
                      }))}
                    />
                  </DoubleBezel>
                </section>
                <section className="grid gap-6 lg:grid-cols-12">
                  <DoubleBezel
                    className="lg:col-span-8"
                    innerClassName="p-6 md:p-8"
                  >
                    <p className="eyebrow">Bounded exposure</p>
                    <h2 className="mt-2 text-3xl font-semibold">
                      Credit line versus principal exposure
                    </h2>
                    <div className="my-5 flex flex-wrap gap-3 font-mono text-[10px]">
                      <span className="rounded-full bg-teal-light px-3 py-2">
                        Floor {rupees(detail.summary.floor)}
                      </span>
                      <span className="rounded-full bg-warning-light px-3 py-2">
                        Ceiling {rupees(detail.summary.ceiling)}
                      </span>
                    </div>
                    <LineChart
                      data={credit}
                      label="Credit limit"
                      secondaryLabel="Exposure"
                    />
                  </DoubleBezel>
                  <DoubleBezel
                    className="lg:col-span-4"
                    innerClassName="p-6 md:p-8"
                  >
                    <p className="eyebrow">Recorded outcomes</p>
                    <h2 className="mb-7 mt-2 text-3xl font-semibold">
                      Gateway decisions
                    </h2>
                    <BarChart
                      data={detail.draw_outcomes.map((x) => ({
                        label: x.status,
                        value: x.count,
                      }))}
                    />
                    <h3 className="mb-4 mt-9 text-xl font-semibold">
                      Authority transitions
                    </h3>
                    {detail.authority_transitions.length ? (
                      <div className="grid gap-3">
                        {detail.authority_transitions.map((x, i) => (
                          <div
                            key={i}
                            className="border-l-2 border-teal pl-4 text-xs"
                          >
                            <strong>
                              {x.from} → {x.to}
                            </strong>
                            <p className="mt-1 text-muted-ink">{x.trigger}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-ink">
                        No authority changes in this window.
                      </p>
                    )}
                  </DoubleBezel>
                </section>
                <DoubleBezel innerClassName="grid overflow-hidden lg:grid-cols-12">
                  <div className="bg-ink p-7 text-surface lg:col-span-4">
                    <Calculator size={32} weight="light" />
                    <p className="eyebrow mt-8 text-teal-light">
                      Deterministic what-if
                    </p>
                    <h2 className="mt-2 text-4xl font-semibold">
                      Ask the gateway without moving money
                    </h2>
                    <p className="mt-4 text-sm leading-relaxed text-surface/65">
                      This projection runs the current manifest, authority,
                      velocity, credit, and principal-pool checks. It writes
                      nothing.
                    </p>
                  </div>
                  <div className="p-7 lg:col-span-8">
                    <div className="grid gap-4 md:grid-cols-3">
                      <label className="text-sm font-semibold">
                        Amount
                        <input
                          className="control mt-2"
                          type="number"
                          min="1"
                          value={amount}
                          onChange={(e) => setAmount(Number(e.target.value))}
                        />
                      </label>
                      <label className="text-sm font-semibold">
                        Merchant category
                        <select
                          className="control mt-2"
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                        >
                          <option>API_SERVICES</option>
                          <option>CLOUD_SERVICES</option>
                          <option>CRYPTO_EXCHANGE</option>
                          <option>P2P_TRANSFER</option>
                        </select>
                      </label>
                      <label className="text-sm font-semibold">
                        Repayment outcome
                        <select
                          className="control mt-2"
                          value={outcome}
                          onChange={(e) => setOutcome(e.target.value as any)}
                        >
                          <option value="SUCCESS">Successful pull</option>
                          <option value="FAIL">Insufficient funds</option>
                        </select>
                      </label>
                    </div>
                    <button
                      className="btn-primary mt-5"
                      onClick={runSim}
                      disabled={simBusy}
                    >
                      {simBusy ? "Checking…" : "Run non-mutating check"}
                      <ArrowRight />
                    </button>
                    {simulation && (
                      <div
                        className={`mt-6 rounded-2xl p-5 ${simulation.decision === "ACCEPTED" ? "bg-teal-light" : "bg-danger-light"}`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <strong className="text-2xl">
                            {simulation.decision}
                          </strong>
                          <code>{simulation.code}</code>
                        </div>
                        <div className="mt-5 grid gap-2 sm:grid-cols-2">
                          {simulation.checks.map((x) => (
                            <div
                              key={x.name}
                              className="flex items-center gap-2 text-xs"
                            >
                              {x.passed ? (
                                <CheckCircle className="text-teal" />
                              ) : (
                                <ShieldWarning className="text-danger" />
                              )}
                              <span>{x.name}</span>
                            </div>
                          ))}
                        </div>
                        <p className="mt-5 font-mono text-[10px] uppercase tracking-wider">
                          Database mutated: no
                        </p>
                      </div>
                    )}
                  </div>
                </DoubleBezel>
                <DoubleBezel innerClassName="overflow-hidden">
                  <div className="flex items-center justify-between p-6">
                    <div>
                      <p className="eyebrow">Expandable evidence</p>
                      <h2 className="mt-2 text-3xl font-semibold">
                        Transactions and enforcement
                      </h2>
                    </div>
                    <BezierCurve size={30} weight="light" />
                  </div>
                  <div className="divide-y divide-border">
                    {detail.transactions.map((x) => (
                      <details key={x.id} className="group px-6 py-4">
                        <summary className="flex cursor-pointer list-none flex-wrap items-center gap-4">
                          <span className="font-semibold">{x.merchant}</span>
                          <span className="font-mono text-xs text-muted-ink">
                            {rupees(x.amount)}
                          </span>
                          <span className="ml-auto text-xs">{x.status}</span>
                        </summary>
                        <div className="mt-4 grid gap-2 rounded-xl bg-canvas p-4 font-mono text-[10px] md:grid-cols-3">
                          <span>{x.category}</span>
                          <span>{new Date(x.at).toLocaleString()}</span>
                          <span className="truncate">{x.id}</span>
                        </div>
                      </details>
                    ))}
                  </div>
                </DoubleBezel>
              </>
            )}
          </>
        )
      )}
    </div>
  );
};
const Metric = ({
  label,
  value,
  icon,
  span,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  span: string;
}) => (
  <div
    className={`card-editorial flex min-h-48 flex-col justify-between p-6 ${span}`}
  >
    <span className="text-teal [&>svg]:h-6 [&>svg]:w-6">{icon}</span>
    <div>
      <p className="text-xs text-muted-ink">{label}</p>
      <strong className="metric mt-2 block text-3xl">{value}</strong>
    </div>
  </div>
);
