import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Plus,
  ShieldCheck,
  ShieldWarning,
} from "@phosphor-icons/react";
import { api } from "../services/api";
import { Agent, AgentAnalytics } from "../types";
import { StatusBadge } from "../components/StatusBadge";
import {
  DoubleBezel,
  EmptyState,
  InlineError,
  PageHeader,
  SkeletonBlock,
} from "../components/ui";

export const AgentList = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [history, setHistory] = useState<Record<string, AgentAnalytics>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = async () => {
    try {
      setLoading(true);
      setError("");
      const rows = await api.getAgents();
      setAgents(rows);
      const details = await Promise.all(
        rows.map((a) => api.getAgentAnalytics(a.id).catch(() => null)),
      );
      setHistory(
        Object.fromEntries(
          details
            .filter(Boolean)
            .map((x) => [(x as AgentAnalytics).agent_id, x]),
        ) as Record<string, AgentAnalytics>,
      );
    } catch (e: any) {
      setError(e.message || "Could not load agents.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, []);
  const atlas = agents.find((a) => a.display_name === "Atlas Procurement Bot");
  const vector = agents.find((a) => a.display_name === "Vector Arbitrage Bot");
  return (
    <div className="space-y-20">
      <PageHeader
        label="Principal portfolio"
        title="Bots under authority"
        body="Compare bounded lines, evidence direction, utilization, and authority across every deterministic bot actor."
        actions={
          <Link className="btn-primary" to="/agents/new">
            <Plus />
            Register agent
          </Link>
        }
      />
      {error && <InlineError message={error} onRetry={load} />}
      <section>
        <p className="eyebrow">Asymmetric trust in practice</p>
        <h2 className="mt-3 text-4xl font-semibold">
          Trust rises slowly. Control responds quickly.
        </h2>
        {loading ? (
          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <SkeletonBlock className="h-72" />
            <SkeletonBlock className="h-72" />
          </div>
        ) : agents.length === 0 ? (
          <DoubleBezel className="mt-6" innerClassName="p-6">
            <EmptyState
              title="No bots registered"
              body="Register an agent to create its principal-bound mandate and cold-start line."
              action={
                <Link className="btn-primary" to="/agents/new">
                  Register first agent
                </Link>
              }
            />
          </DoubleBezel>
        ) : (
          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <Comparison
              agent={atlas}
              analytics={atlas && history[atlas.id]}
              tone="verified"
            />
            <Comparison
              agent={vector}
              analytics={vector && history[vector.id]}
              tone="risk"
            />
          </div>
        )}
      </section>
      {agents.length > 0 && (
        <section>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="eyebrow">Complete inventory</p>
              <h2 className="mt-2 text-4xl font-semibold">
                Every active mandate
              </h2>
            </div>
            <Link to="/analytics" className="font-semibold text-teal-dark">
              Open portfolio analytics →
            </Link>
          </div>
          <div className="mt-6 hidden overflow-hidden rounded-[1.5rem] bg-surface ring-1 ring-ink/[0.06] md:block">
            <table className="w-full text-left">
              <thead className="bg-ink text-canvas">
                <tr>
                  {[
                    "Bot",
                    "Principal",
                    "Authority",
                    "Limit direction",
                    "Utilization",
                    "Available",
                    "",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-5 py-4 font-mono text-[10px] font-medium uppercase tracking-[.15em]"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {agents.map((a) => (
                  <tr
                    key={a.id}
                    className="border-b border-ink/[0.06] last:border-0"
                  >
                    <td className="px-5 py-5">
                      <strong>{a.display_name}</strong>
                      <span className="block max-w-xs truncate text-xs text-muted-ink">
                        {a.purpose}
                      </span>
                    </td>
                    <td className="px-5 py-5 text-sm text-muted-ink">
                      {a.principal_name}
                    </td>
                    <td className="px-5 py-5">
                      <StatusBadge status={a.status} />
                    </td>
                    <td className="w-36 px-5 py-5">
                      <Spark
                        values={(history[a.id]?.limit_history || []).map((x) =>
                          Number(x.limit),
                        )}
                      />
                    </td>
                    <td className="metric px-5 py-5 text-sm">
                      {utilization(a)}%
                    </td>
                    <Money value={a.available_credit} />
                    <td className="px-5 py-5">
                      <Link
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-canvas"
                        to={`/agents/${a.id}`}
                        aria-label={`Inspect ${a.display_name}`}
                      >
                        <ArrowRight />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-6 grid gap-4 md:hidden">
            {agents.map((a) => (
              <DoubleBezel key={a.id} innerClassName="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-2xl font-semibold">{a.display_name}</h3>
                    <p className="mt-1 text-xs text-muted-ink">
                      {a.principal_name}
                    </p>
                  </div>
                  <StatusBadge status={a.status} />
                </div>
                <div className="mt-6 grid grid-cols-2 gap-4">
                  <Mini label="Available" value={a.available_credit} />
                  <div>
                    <p className="font-mono text-[9px] uppercase tracking-wider text-muted-ink">
                      Limit direction
                    </p>
                    <Spark
                      values={(history[a.id]?.limit_history || []).map((x) =>
                        Number(x.limit),
                      )}
                    />
                  </div>
                </div>
                <Link
                  className="btn-secondary mt-5 w-full"
                  to={`/agents/${a.id}`}
                >
                  Inspect evidence <ArrowRight />
                </Link>
              </DoubleBezel>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
const Comparison = ({
  agent,
  analytics,
  tone,
}: {
  agent?: Agent;
  analytics?: AgentAnalytics;
  tone: "verified" | "risk";
}) => (
  <DoubleBezel
    innerClassName={`overflow-hidden ${tone === "risk" ? "bg-warning-light" : ""}`}
  >
    <div className="p-7 md:p-9">
      <div className="flex items-center justify-between">
        <span
          className={`flex h-12 w-12 items-center justify-center rounded-2xl ${tone === "verified" ? "bg-teal-light text-teal" : "bg-danger-light text-danger"}`}
        >
          {tone === "verified" ? (
            <ShieldCheck size={25} />
          ) : (
            <ShieldWarning size={25} />
          )}
        </span>
        {agent && <StatusBadge status={agent.status} />}
      </div>
      <p className="eyebrow mt-10">
        {tone === "verified" ? "Verified performer" : "Risk under observation"}
      </p>
      <h3 className="mt-2 text-4xl font-semibold">
        {agent?.display_name || "Reset demo to seed bot"}
      </h3>
      <p className="mt-2 text-sm text-muted-ink">{agent?.principal_name}</p>
      <div className="mt-7 grid grid-cols-[1fr_9rem] items-end gap-5">
        <div className="grid grid-cols-2 gap-3">
          <Mini label="Limit" value={agent?.current_limit} />
          <Mini label="Exposure" value={agent?.outstanding_principal} />
        </div>
        <Spark
          values={(analytics?.limit_history || []).map((x) => Number(x.limit))}
        />
      </div>
      {agent && (
        <Link
          to={`/agents/${agent.id}`}
          className="mt-7 inline-flex items-center gap-2 font-semibold text-teal-dark"
        >
          Inspect evidence <ArrowRight />
        </Link>
      )}
    </div>
  </DoubleBezel>
);
const Spark = ({ values }: { values: number[] }) => {
  if (values.length < 2)
    return <span className="text-xs text-muted-ink">Cold start</span>;
  const min = Math.min(...values),
    max = Math.max(...values),
    spread = max - min || 1;
  return (
    <svg
      viewBox="0 0 100 32"
      className="h-10 w-full"
      role="img"
      aria-label={`Limit changed from ${values[0]} to ${values[values.length - 1]}`}
    >
      <polyline
        points={values
          .map(
            (v, i) =>
              `${(i / (values.length - 1)) * 100},${28 - ((v - min) / spread) * 24}`,
          )
          .join(" ")}
        fill="none"
        stroke="#2F6F68"
        strokeWidth="2"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
};
const utilization = (a: Agent) => {
  const limit = Number(a.current_limit || 0);
  return limit
    ? Math.round(
        ((Number(a.reserved_amount || 0) +
          Number(a.outstanding_principal || 0)) /
          limit) *
          100,
      )
    : 0;
};
const Mini = ({ label, value }: { label: string; value?: string }) => (
  <div>
    <p className="font-mono text-[9px] uppercase tracking-[.13em] text-muted-ink">
      {label}
    </p>
    <p className="metric mt-1 text-lg font-semibold">
      ₹{Number(value || 0).toLocaleString("en-IN")}
    </p>
  </div>
);
const Money = ({ value }: { value?: string }) => (
  <td className="metric px-5 py-5 text-sm">
    ₹{Number(value || 0).toLocaleString("en-IN")}
  </td>
);
