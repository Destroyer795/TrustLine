import React, { useEffect, useRef, useState } from "react";
import {
  ArrowClockwise,
  ArrowRight,
  Bank,
  CheckCircle,
  Clipboard,
  Database,
  HandPalm,
  Pause,
  Play,
  Robot,
  ShieldCheck,
  ShieldWarning,
  Storefront,
  UserCircle,
} from "@phosphor-icons/react";
import { Link, useSearchParams } from "react-router-dom";
import { DoubleBezel, InlineError, PageHeader } from "../components/ui";
import { StatusBadge } from "../components/StatusBadge";
import { api, APIRequestError } from "../services/api";
import { DemoScenario, DemoSession, DemoStep } from "../types";

const sleep = (ms: number) =>
  new Promise((resolve) => window.setTimeout(resolve, ms));
const money = (value?: string) =>
  `₹${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
const actors = [
  ["Northstar principal", UserCircle],
  ["Risk engine", ShieldCheck],
  ["Bot", Robot],
  ["Gateway", Database],
  ["Vendor", Storefront],
  ["Bank rail", Bank],
  ["Audit ledger", CheckCircle],
] as const;

export const DemoLab = () => {
  const [searchParams] = useSearchParams();
  const [story, setStory] = useState("");
  const [scenarios, setScenarios] = useState<DemoScenario[]>([]);
  const [selected, setSelected] = useState("success_cycle");
  const [session, setSession] = useState<DemoSession>();
  const [mode, setMode] = useState<"simple" | "technical">("simple");
  const [busy, setBusy] = useState(false);
  const [paused, setPaused] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const pauseRef = useRef(false);
  const current = scenarios.find((x) => x.key === selected);
  const state = session?.current_state || current?.agent;
  const load = async () => {
    try {
      setError("");
      const catalog = await api.getDemoScenarios();
      setStory(catalog.story);
      setScenarios(catalog.scenarios);
      const saved =
        searchParams.get("session") ||
        localStorage.getItem("trustline-demo-session");
      if (saved) {
        try {
          const recovered = await api.getDemoSession(saved);
          setSession(recovered);
          setSelected(recovered.scenario_key);
        } catch {
          localStorage.removeItem("trustline-demo-session");
        }
      }
    } catch (e: any) {
      setError(e.message);
    }
  };
  useEffect(() => {
    load();
  }, []);
  useEffect(() => {
    pauseRef.current = paused;
  }, [paused]);
  const begin = async () => {
    const created = await api.createDemoSession(selected);
    setSession(created);
    localStorage.setItem("trustline-demo-session", created.id);
    return created;
  };
  const next = async () => {
    try {
      setBusy(true);
      setError("");
      const active = session || (await begin());
      if (active.current_step >= active.total_steps) return;
      const advanced = await api.advanceDemoSession(active.id);
      setSession(advanced);
    } catch (e: any) {
      setError(
        e instanceof APIRequestError ? `${e.code}: ${e.message}` : e.message,
      );
    } finally {
      setBusy(false);
    }
  };
  const start = async () => {
    try {
      setBusy(true);
      setPaused(false);
      pauseRef.current = false;
      setError("");
      let active =
        session && session.scenario_key === selected ? session : await begin();
      while (active.current_step < active.total_steps && !pauseRef.current) {
        await sleep(700);
        active = await api.advanceDemoSession(active.id);
        setSession(active);
      }
    } catch (e: any) {
      setError(
        e instanceof APIRequestError ? `${e.code}: ${e.message}` : e.message,
      );
    } finally {
      setBusy(false);
    }
  };
  const reset = async () => {
    try {
      setBusy(true);
      await api.resetDemo();
      localStorage.removeItem("trustline-demo-session");
      setSession(undefined);
      setPaused(false);
      pauseRef.current = false;
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  const replay = async () => {
    try {
      setBusy(true);
      const created = session
        ? await api.replayDemoSession(session.id)
        : await api.createDemoSession(selected);
      setSession(created);
      localStorage.setItem("trustline-demo-session", created.id);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  const choose = (key: string) => {
    if (session && session.current_step > 0) {
      setError(
        "The current proof remains inspectable. Reset demo before changing a stateful story.",
      );
      return;
    }
    setSelected(key);
    setSession(undefined);
  };
  const apiBase = (
    import.meta.env.VITE_API_BASE_URL || window.location.origin + "/api/v1"
  ).replace(/\/$/, "");
  const agentId = current?.agent?.id || "";
  const curl = `curl -X POST '${apiBase}/draws' \\\n+  -H 'Content-Type: application/json' \\\n+  -H 'Idempotency-Key: judge-proof-001' \\\n+  -d '{"agent_id":"${agentId}","amount":2501,"merchant_name":"Judge API","merchant_category":"CLOUD_SERVICES"}'`;
  return (
    <div className="space-y-12">
      <PageHeader
        label="Bot-led proof laboratory"
        title="Watch authority become action"
        body="A guided story first. Real endpoints, database state, enforcement, and audit receipts underneath."
        actions={
          <button className="btn-secondary" onClick={reset} disabled={busy}>
            <ArrowClockwise />
            Reset demo
          </button>
        }
      />
      {error && <InlineError message={error} />}
      <DoubleBezel innerClassName="overflow-hidden">
        <div className="grid lg:grid-cols-[1fr_1.35fr]">
          <div className="bg-ink p-7 text-surface md:p-9">
            <p className="eyebrow text-teal-light">20-second orientation</p>
            <h2 className="mt-3 text-4xl font-semibold">
              TrustLine sits between intent and money.
            </h2>
            <p className="mt-5 max-w-lg leading-relaxed text-surface/70">
              The bot proposes a purchase. The accountable principal defines the
              boundary. TrustLine enforces it before funds move and controls
              repayment afterward.
            </p>
          </div>
          <div className="p-6 md:p-8">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
              {actors.map(([name, Icon], i) => (
                <React.Fragment key={name}>
                  <div className="relative text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-light text-teal">
                      <Icon size={23} weight="light" />
                    </div>
                    <p className="mt-2 text-[10px] font-semibold leading-tight">
                      {name}
                    </p>
                    {i < actors.length - 1 && (
                      <ArrowRight className="absolute -right-3 top-4 hidden text-border lg:block" />
                    )}
                  </div>
                </React.Fragment>
              ))}
            </div>
            <p className="mt-7 rounded-xl bg-canvas p-4 font-mono text-[10px] leading-relaxed text-muted-ink">
              {story}
            </p>
          </div>
        </div>
      </DoubleBezel>
      <section>
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Choose the lesson</p>
            <h2 className="mt-2 text-4xl font-semibold">
              Five deterministic stories
            </h2>
          </div>
          <div className="rounded-full bg-surface p-1 ring-1 ring-ink/10">
            <button
              onClick={() => setMode("simple")}
              className={`min-h-10 rounded-full px-4 text-xs font-semibold ${mode === "simple" ? "bg-ink text-surface" : ""}`}
            >
              Simple mode
            </button>
            <button
              onClick={() => setMode("technical")}
              className={`min-h-10 rounded-full px-4 text-xs font-semibold ${mode === "technical" ? "bg-ink text-surface" : ""}`}
            >
              Technical evidence
            </button>
          </div>
        </div>
        <div className="grid gap-3 lg:grid-cols-5">
          {scenarios.map((scenario, i) => (
            <button
              key={scenario.key}
              onClick={() => choose(scenario.key)}
              className={`min-h-48 rounded-[1.5rem] p-5 text-left ring-1 ${selected === scenario.key ? "bg-teal text-surface ring-teal" : "bg-surface ring-ink/10 hover:-translate-y-1"}`}
            >
              <span
                className={`font-mono text-[10px] ${selected === scenario.key ? "text-surface/65" : "text-teal"}`}
              >
                0{i + 1} · {scenario.step_count} steps
              </span>
              <strong className="mt-8 block font-serif text-2xl leading-none">
                {scenario.title}
              </strong>
              <small
                className={`mt-3 block leading-relaxed ${selected === scenario.key ? "text-surface/75" : "text-muted-ink"}`}
              >
                {scenario.agent_name}
              </small>
            </button>
          ))}
        </div>
      </section>
      {current && (
        <section className="grid gap-5 xl:grid-cols-12">
          <aside className="xl:col-span-3">
            <DoubleBezel innerClassName="overflow-hidden">
              <div className="bg-teal-light p-6">
                <BotPortrait name={current.agent_name} />
                <p className="eyebrow mt-5">Speaking bot</p>
                <h2 className="mt-2 text-3xl font-semibold">
                  {current.agent_name}
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-muted-ink">
                  {current.agent?.purpose}
                </p>
              </div>
              <div className="p-5">
                <p className="eyebrow">Story chapters</p>
                <ol className="mt-4 grid gap-2">
                  {Array.from({ length: current.step_count }).map((_, i) => (
                    <li
                      key={i}
                      className={`flex items-center gap-3 rounded-xl p-3 text-xs ${session && i < session.current_step ? "bg-teal-light text-teal-dark" : i === session?.current_step ? "bg-warning-light text-warning" : "text-muted-ink"}`}
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-current font-mono">
                        {i + 1}
                      </span>
                      {i < (session?.steps.length || 0)
                        ? session?.steps[i].action
                        : "Evidence step"}
                    </li>
                  ))}
                </ol>
              </div>
            </DoubleBezel>
          </aside>
          <div className="xl:col-span-6">
            <DoubleBezel innerClassName="min-h-[48rem] overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border p-5">
                <div>
                  <p className="eyebrow">Live actor timeline</p>
                  <h2 className="mt-1 text-2xl font-semibold">
                    {current.title}
                  </h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  {busy ? (
                    <button
                      className="btn-secondary"
                      onClick={() => setPaused(true)}
                    >
                      <Pause />
                      Pause
                    </button>
                  ) : (
                    <button
                      className="btn-primary"
                      onClick={start}
                      disabled={session?.status === "COMPLETED"}
                    >
                      <Play />
                      {session?.current_step ? "Resume story" : "Start story"}
                    </button>
                  )}
                  <button
                    className="btn-secondary"
                    onClick={next}
                    disabled={busy || session?.status === "COMPLETED"}
                  >
                    Next step
                    <ArrowRight />
                  </button>
                </div>
              </div>
              <div aria-live="polite" className="grid gap-4 p-5 md:p-7">
                {session?.steps.length ? (
                  session.steps.map((step) => (
                    <StepCard
                      key={step.sequence}
                      step={step}
                      technical={mode === "technical"}
                    />
                  ))
                ) : (
                  <div className="flex min-h-96 flex-col items-center justify-center text-center">
                    <Robot size={48} weight="light" className="text-teal" />
                    <h3 className="mt-5 text-3xl font-semibold">
                      Ready to run the story
                    </h3>
                    <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-ink">
                      {current.lesson}
                    </p>
                    <button className="btn-primary mt-6" onClick={start}>
                      <Play />
                      Start story
                    </button>
                  </div>
                )}
              </div>
              {session?.status === "COMPLETED" && (
                <div className="m-5 rounded-2xl bg-teal p-6 text-surface">
                  <p className="font-mono text-[10px] uppercase tracking-wider text-surface/65">
                    Proof complete
                  </p>
                  <h3 className="mt-2 text-3xl font-semibold">
                    {session.lesson}
                  </h3>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <Link
                      to={`/agents/${current.agent?.id}`}
                      className="btn-secondary"
                    >
                      Inspect agent
                    </Link>
                    <Link to="/analytics" className="btn-secondary">
                      Open analytics
                    </Link>
                    <Link to="/audit" className="btn-secondary">
                      Verify audit
                    </Link>
                    <button onClick={replay} className="btn-secondary">
                      <ArrowClockwise />
                      Replay
                    </button>
                  </div>
                </div>
              )}
            </DoubleBezel>
          </div>
          <aside className="xl:col-span-3">
            <DoubleBezel innerClassName="sticky top-28 overflow-hidden">
              <div className="bg-ink p-6 text-surface">
                <p className="eyebrow text-teal-light">
                  Live credit instrument
                </p>
                <div className="mt-6 flex items-center justify-between">
                  <span className="text-sm text-surface/60">Authority</span>
                  {state?.authority && (
                    <StatusBadge status={state.authority as any} />
                  )}
                </div>
                <strong className="metric mt-7 block text-4xl">
                  {money(
                    (state as any)?.available_credit ||
                      (state as any)?.available,
                  )}
                </strong>
                <span className="text-xs text-surface/60">
                  available credit
                </span>
              </div>
              <div className="grid grid-cols-2 divide-x divide-border border-b border-border">
                <Instrument
                  label="Limit"
                  value={money(
                    (state as any)?.current_limit || (state as any)?.limit,
                  )}
                />
                <Instrument
                  label="Reserved"
                  value={money((state as any)?.reserved)}
                />
              </div>
              <Instrument
                label="Outstanding principal"
                value={money((state as any)?.outstanding)}
              />
              <div className="border-t border-border p-5">
                <p className="eyebrow">Why this story</p>
                <p className="mt-3 text-sm leading-relaxed text-muted-ink">
                  {current.lesson}
                </p>
              </div>
            </DoubleBezel>
          </aside>
        </section>
      )}
      <section className="grid gap-5 lg:grid-cols-12">
        <DoubleBezel className="lg:col-span-7" innerClassName="p-6 md:p-8">
          <p className="eyebrow">Money movement</p>
          <h2 className="mt-2 text-3xl font-semibold">
            Who controls each handoff
          </h2>
          <div className="mt-7 grid gap-3 sm:grid-cols-4">
            {[
              ["Bot", "requests"],
              ["Gateway", "reserves"],
              ["Vendor", "receives"],
              ["Mandate", "repays"],
            ].map(([a, b], i) => (
              <div key={a} className="relative rounded-2xl bg-canvas p-4">
                <strong>{a}</strong>
                <p className="mt-1 text-xs text-muted-ink">{b}</p>
                {i < 3 && (
                  <ArrowRight className="absolute -right-3 top-6 z-10 hidden text-teal sm:block" />
                )}
              </div>
            ))}
          </div>
          <p className="mt-6 flex items-start gap-3 rounded-xl bg-warning-light p-4 text-xs leading-relaxed text-warning">
            <HandPalm size={20} className="shrink-0" />
            The bot never settles itself, changes its own line, or decides
            whether repayment failure matters.
          </p>
        </DoubleBezel>
        <DoubleBezel className="lg:col-span-5" innerClassName="p-6 md:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="eyebrow">Independent gateway proof</p>
              <h2 className="mt-2 text-3xl font-semibold">Run it yourself</h2>
            </div>
            <button
              className="btn-secondary"
              onClick={async () => {
                await navigator.clipboard.writeText(curl);
                setCopied(true);
                window.setTimeout(() => setCopied(false), 1200);
              }}
            >
              <Clipboard />
              {copied ? "Copied" : "Copy cURL"}
            </button>
          </div>
          <code className="mt-6 block overflow-x-auto whitespace-pre rounded-2xl bg-ink p-5 text-[10px] leading-relaxed text-surface">
            {curl}
          </code>
        </DoubleBezel>
      </section>
    </div>
  );
};

const BotPortrait = ({ name }: { name: string }) => (
  <div
    aria-hidden="true"
    className="relative flex h-24 w-24 items-center justify-center rounded-[2rem] bg-teal text-surface shadow-[inset_0_0_0_6px_rgba(255,255,255,.18)]"
  >
    <span className="font-serif text-4xl">
      {name
        .split(" ")
        .slice(0, 2)
        .map((x) => x[0])
        .join("")}
    </span>
    <i className="absolute -right-1 top-3 h-4 w-4 rounded-full bg-warning ring-4 ring-teal-light" />
  </div>
);
const Instrument = ({ label, value }: { label: string; value: string }) => (
  <div className="p-5">
    <span className="text-[10px] text-muted-ink">{label}</span>
    <strong className="metric mt-2 block text-xl">{value}</strong>
  </div>
);
const StepCard = ({
  step,
  technical,
}: {
  step: DemoStep;
  technical: boolean;
}) => {
  const rejected = ["REJECTED", "REVOKED", "FAILED_AND_FROZEN"].includes(
    step.semantic_result,
  );
  return (
    <article
      className={`page-enter rounded-[1.5rem] p-5 ring-1 ${rejected ? "bg-danger-light ring-danger/15" : "bg-surface ring-ink/10"}`}
    >
      <div className="flex items-start gap-4">
        <span
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl font-mono text-xs ${rejected ? "bg-danger text-surface" : "bg-teal-light text-teal-dark"}`}
        >
          {step.sequence}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="eyebrow">{step.actor}</span>
            <span className="rounded-full bg-canvas px-2 py-1 font-mono text-[9px]">
              {step.semantic_result}
            </span>
          </div>
          <h3 className="mt-2 text-2xl font-semibold">{step.action}</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-ink">
            {step.plain_language}
          </p>
          <div className="mt-4 rounded-xl bg-canvas p-4">
            <p className="font-mono text-[9px] uppercase tracking-wider text-teal">
              What this proves
            </p>
            <p className="mt-2 text-sm font-semibold">{step.proof}</p>
          </div>
          {technical && (
            <div className="mt-4 grid gap-3">
              <div className="grid gap-2 rounded-xl bg-ink p-4 font-mono text-[10px] text-surface sm:grid-cols-3">
                <span>{step.endpoint || "Read-only service"}</span>
                <span>HTTP {step.transport_status}</span>
                <span>Audit #{step.audit_sequence || "—"}</span>
              </div>
              {step.gateway_checks.length > 0 && (
                <details open>
                  <summary className="cursor-pointer text-xs font-semibold">
                    Gateway checks ({step.gateway_checks.length})
                  </summary>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {step.gateway_checks.map((x) => (
                      <span
                        key={x}
                        className="rounded-full bg-teal-light px-3 py-2 text-[10px] text-teal-dark"
                      >
                        <CheckCircle className="mr-1 inline" />
                        {x}
                      </span>
                    ))}
                  </div>
                </details>
              )}
              <details>
                <summary className="cursor-pointer text-xs font-semibold">
                  Request and response payload
                </summary>
                <pre className="mt-3 max-h-64 overflow-auto rounded-xl bg-canvas p-4 text-[10px]">
                  {JSON.stringify(
                    {
                      request: step.request,
                      response: step.response,
                      before: step.before,
                      after: step.after,
                    },
                    null,
                    2,
                  )}
                </pre>
              </details>
            </div>
          )}
        </div>
      </div>
    </article>
  );
};
