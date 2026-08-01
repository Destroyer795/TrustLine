import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Bank,
  Fingerprint,
  Gauge,
  LockKey,
  Scales,
  X,
} from "@phosphor-icons/react";
import { api } from "../services/api";
import { Agent } from "../types";
import { DoubleBezel } from "../components/ui";
import { StatusBadge } from "../components/StatusBadge";

export const Presentation = () => {
  const [scene, setScene] = useState(0);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [offline, setOffline] = useState(false);
  useEffect(() => {
    api
      .getAgents()
      .then(setAgents)
      .catch(() => setOffline(true));
  }, []);
  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") setScene((s) => Math.min(4, s + 1));
      if (e.key === "ArrowLeft") setScene((s) => Math.max(0, s - 1));
    };
    document.addEventListener("keydown", fn);
    return () => document.removeEventListener("keydown", fn);
  }, []);
  const good =
    agents.find((a) => a.display_name === "Atlas Procurement Bot") ||
    agents.find((a) => a.status === "NORMAL");
  const bad =
    agents.find((a) => a.display_name === "Vector Arbitrage Bot") ||
    agents.find((a) => a.status === "RESTRICTED" || a.status === "FROZEN");
  const scenes = [
    <Scene
      label="The gap"
      title="The agent can create value. It cannot fund the work."
      icon={<Bank />}
    >
      <p>
        A ₹10,000 API and hosting bill arrives before the ₹15,000 client
        payment. Traditional lending has no borrower, collateral, or enforceable
        agent contract.
      </p>
    </Scene>,
    <Scene
      label="Trust construction"
      title="Authority first. Evidence second. Exposure always bounded."
      icon={<Fingerprint />}
    >
      <div className="grid gap-4 md:grid-cols-3">
        {[
          ["Mandate", "Principal-bound and scoped"],
          ["Risk profile", "Five visible components"],
          ["Cold start", "Principal-wide ceiling"],
        ].map(([a, b]) => (
          <div className="rounded-2xl bg-canvas p-5" key={a}>
            <strong>{a}</strong>
            <p className="mt-2 text-sm text-muted-ink">{b}</p>
          </div>
        ))}
      </div>
    </Scene>,
    <Scene
      label="Asymmetric trust"
      title="Good behavior climbs slowly. Failure falls fast."
      icon={<Gauge />}
    >
      <div className="grid gap-5 md:grid-cols-2">
        <AgentCard title="Verified performer" agent={good} />
        <AgentCard title="Contained failure" agent={bad} />
      </div>
    </Scene>,
    <Scene
      label="Enforcement"
      title="Bots act. TrustLine decides whether money moves."
      icon={<LockKey />}
    >
      <p className="mb-5">
        Atlas completes an allowed purchase and repays. Vector fails repayment
        and loses authority. Both stories call the same deterministic gateway.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <Proof text="Atlas success cycle" />
        <Proof text="Scout over-limit rejection" />
        <Proof text="In-flight principal revocation" />
        <Proof text="Vector repayment freeze" />
      </div>
      <Link to="/demo-lab" className="btn-primary mt-7">
        Run bot-led proof <ArrowRight />
      </Link>
    </Scene>,
    <Scene
      label="Plausibility"
      title="Built from real infrastructure patterns, with honest limits."
      icon={<Scales />}
    >
      <p>
        Signed mandates resemble authorization patterns in emerging
        agent-payment protocols. Infrastructure-level payment controls and
        mandate pulls validate the direction, not equivalence.
      </p>
      <div className="mt-6 rounded-2xl bg-warning-light p-5 text-sm text-warning">
        OAuth is a KYC proxy. Receipt attestation and per-principal Sybil
        controls narrow risk but do not eliminate it. AHP weights are documented
        priors, not fitted truth.
      </div>
    </Scene>,
  ];
  return (
    <div className="fixed inset-0 z-[55] overflow-y-auto bg-canvas p-4 md:p-8">
      <div className="mx-auto flex min-h-full max-w-7xl flex-col">
        <header className="flex items-center justify-between">
          <div>
            <p className="font-serif text-2xl font-semibold">TrustLine</p>
            <p className="font-mono text-[9px] uppercase tracking-[.18em] text-muted-ink">
              Three-minute judge mode
            </p>
          </div>
          <Link
            to="/"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-ink text-surface"
            aria-label="Exit presentation"
          >
            <X size={20} />
          </Link>
        </header>
        <main className="my-auto py-12">
          {offline && (
            <p className="mb-5 rounded-xl bg-warning-light p-3 text-sm text-warning">
              Live data unavailable. Deterministic presentation mode remains
              ready.
            </p>
          )}
          {scenes[scene]}
        </main>
        <footer className="flex items-center gap-4">
          <button
            className="btn-secondary"
            onClick={() => setScene((s) => Math.max(0, s - 1))}
            disabled={scene === 0}
          >
            <ArrowLeft /> Previous
          </button>
          <div className="flex flex-1 gap-2">
            {scenes.map((_, i) => (
              <button
                key={i}
                onClick={() => setScene(i)}
                aria-label={`Go to scene ${i + 1}`}
                className={`h-1.5 flex-1 rounded-full ${i <= scene ? "bg-teal" : "bg-ink/10"}`}
              />
            ))}
          </div>
          <button
            className="btn-primary"
            onClick={() => setScene((s) => Math.min(4, s + 1))}
            disabled={scene === 4}
          >
            Next <ArrowRight />
          </button>
        </footer>
      </div>
    </div>
  );
};
const Scene = ({
  label,
  title,
  icon,
  children,
}: {
  label: string;
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) => (
  <section className="page-enter grid gap-8 lg:grid-cols-[.32fr_.68fr]">
    <div>
      <span className="flex h-16 w-16 items-center justify-center rounded-[1.4rem] bg-teal text-surface [&>svg]:h-7 [&>svg]:w-7">
        {icon}
      </span>
      <p className="eyebrow mt-6">{label}</p>
    </div>
    <div>
      <h1 className="display-title max-w-5xl font-semibold">{title}</h1>
      <div className="mt-8 max-w-4xl text-xl leading-relaxed text-muted-ink">
        {children}
      </div>
    </div>
  </section>
);
const AgentCard = ({ title, agent }: { title: string; agent?: Agent }) => (
  <DoubleBezel innerClassName="p-6">
    <div className="flex items-center justify-between">
      <p className="eyebrow">{title}</p>
      {agent && <StatusBadge status={agent.status} />}
    </div>
    <h3 className="mt-8 text-3xl font-semibold">
      {agent?.display_name || "Demo agent"}
    </h3>
    <p className="metric mt-5 text-4xl">
      ₹{Number(agent?.current_limit || 0).toLocaleString("en-IN")}
    </p>
    <p className="mt-1 text-sm text-muted-ink">Current bounded limit</p>
  </DoubleBezel>
);
const Proof = ({ text }: { text: string }) => (
  <div className="flex items-center gap-3 rounded-2xl bg-canvas p-4 text-base font-semibold text-ink">
    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-light text-teal">
      <LockKey size={18} />
    </span>
    {text}
  </div>
);
