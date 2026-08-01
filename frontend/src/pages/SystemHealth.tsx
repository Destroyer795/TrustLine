import React, { useEffect, useState } from "react";
import {
  ArrowsClockwise,
  CheckCircle,
  Flask,
  LockKey,
  WarningCircle,
} from "@phosphor-icons/react";
import { api } from "../services/api";
import {
  DoubleBezel,
  InlineError,
  PageHeader,
  SkeletonBlock,
} from "../components/ui";
export const SystemHealth = () => {
  const [health, setHealth] = useState<any>(null);
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = async () => {
    try {
      setLoading(true);
      setError("");
      const [h, s] = await Promise.all([api.getHealth(), api.getDemoStatus()]);
      setHealth(h);
      setStatus(s);
    } catch (e: any) {
      setError(e.message || "System health unavailable.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, []);
  const groups = [
    {
      title: "Live components",
      icon: CheckCircle,
      tone: "bg-teal text-surface",
      items: [
        ["Django API", health?.status === "ok" ? "Healthy" : "Unavailable"],
        ["PostgreSQL enforcement", "Atomic row locks"],
        ["Audit verifier", status?.audit_chain_valid ? "Valid" : "Corrupted"],
      ],
    },
    {
      title: "Simulated components",
      icon: Flask,
      tone: "bg-olive text-surface",
      items: [
        ["Bank settlement rail", "Simulated adapter"],
        ["Task receipt issuer", "Controlled signer"],
        ["Principal onboarding", "Mock OAuth proxy"],
      ],
    },
    {
      title: "Deterministic safeguards",
      icon: LockKey,
      tone: "bg-ink text-canvas",
      items: [
        ["Bot story orchestration", "Deterministic, step-bound API calls"],
        ["Draw decisions", "No LLM involvement"],
        ["Authority transitions", "Explicit state machine"],
        ["Fallback explanations", "Always available"],
      ],
    },
    {
      title: "Production gaps",
      icon: WarningCircle,
      tone: "bg-warning text-surface",
      items: [
        ["Principal authentication", "Not production-grade"],
        ["Identity assurance", "KYC proxy only"],
        ["Receipt independence", "Third party required"],
      ],
    },
  ];
  return (
    <div className="space-y-14">
      <PageHeader
        label="Operational readiness"
        title="What is real. What is simulated."
        body="A credible financial system distinguishes running safeguards from hackathon adapters and production work still outstanding."
        actions={
          <button onClick={load} className="btn-primary">
            <ArrowsClockwise />
            Refresh health
          </button>
        }
      />
      {error && <InlineError message={error} onRetry={load} />}{" "}
      {loading ? (
        <div className="grid gap-5 md:grid-cols-2">
          <SkeletonBlock className="h-72" />
          <SkeletonBlock className="h-72" />
        </div>
      ) : (
        <section className="grid gap-5 md:grid-cols-2">
          {groups.map(({ title, icon: Icon, tone, items }) => (
            <DoubleBezel key={title} innerClassName={`${tone} p-7 md:p-9`}>
              <div className="flex items-center gap-3">
                <Icon size={28} weight="light" />
                <h2 className="text-3xl font-semibold">{title}</h2>
              </div>
              <div className="mt-8 grid gap-4">
                {items.map(([a, b]) => (
                  <div
                    key={a}
                    className="flex items-center justify-between gap-6 border-b border-current/15 pb-3"
                  >
                    <span className="text-sm opacity-65">{a}</span>
                    <strong className="text-right text-sm">{b}</strong>
                  </div>
                ))}
              </div>
            </DoubleBezel>
          ))}
        </section>
      )}
      <section className="rounded-[2rem] bg-surface p-8 ring-1 ring-ink/[0.06] md:p-12">
        <p className="eyebrow">Narration boundary</p>
        <h2 className="mt-4 text-4xl font-semibold">
          Gemini explains. It never decides.
        </h2>
        <p className="mt-5 max-w-[65ch] leading-relaxed text-muted-ink">
          Risk components, credit limits, gateway decisions, repayment attempts,
          and freezes are deterministic. If Gemini is missing, slow, or
          unavailable, TrustLine displays the deterministic explanation without
          interrupting the demo.
        </p>
      </section>
    </div>
  );
};
