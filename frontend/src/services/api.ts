import {
  Agent,
  Principal,
  RiskProfile,
  DrawRequest,
  RepaymentSchedule,
  AuditEvent,
  DemoScenario,
  DemoSession,
  PortfolioAnalytics,
  AgentAnalytics,
  SimulationResult,
} from "../types";

const configuredBase = (import.meta.env.VITE_API_BASE_URL || "/api/v1").replace(
  /\/$/,
  "",
);
const API_BASE = configuredBase.endsWith("/api/v1")
  ? configuredBase
  : `${configuredBase}/api/v1`;

export class APIRequestError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status: number,
    public readonly details: Record<string, unknown> = {},
    public readonly requestId?: string,
  ) {
    super(message);
    this.name = "APIRequestError";
  }
}

async function fetchJSON<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const error = data.error || {};
    throw new APIRequestError(
      error.message ||
        error.code ||
        `API request failed with HTTP ${res.status}`,
      error.code || `HTTP_${res.status}`,
      res.status,
      error.details || {},
      error.request_id,
    );
  }
  return data as T;
}

export const api = {
  getHealth: () => fetchJSON<{ status: string; service: string }>("/health"),
  getDemoStatus: () =>
    fetchJSON<{
      principals: number;
      agents: number;
      audit_chain_valid: boolean;
    }>("/demo/status"),
  seedDemo: () =>
    fetchJSON<{ status: string; message: string }>("/demo/seed", {
      method: "POST",
    }),
  resetDemo: () =>
    fetchJSON<{ status: string; message: string }>("/demo/reset", {
      method: "POST",
    }),
  getDemoScenarios: () =>
    fetchJSON<{ story: string; scenarios: DemoScenario[] }>("/demo/scenarios"),
  createDemoSession: (scenarioKey: string) =>
    fetchJSON<DemoSession>("/demo/sessions", {
      method: "POST",
      body: JSON.stringify({ scenario_key: scenarioKey }),
    }),
  getDemoSession: (id: string) =>
    fetchJSON<DemoSession>(`/demo/sessions/${id}`),
  advanceDemoSession: (id: string) =>
    fetchJSON<DemoSession>(`/demo/sessions/${id}/advance`, { method: "POST" }),
  replayDemoSession: (id: string) =>
    fetchJSON<DemoSession>(`/demo/sessions/${id}/replay`, { method: "POST" }),

  getPrincipals: () => fetchJSON<Principal[]>("/principals"),
  createPrincipal: (name: string, email: string) =>
    fetchJSON<Principal>("/principals", {
      method: "POST",
      body: JSON.stringify({ name, email }),
    }),

  getAgents: () => fetchJSON<Agent[]>("/agents"),
  getAgentDetail: (id: string) => fetchJSON<Agent>(`/agents/${id}`),
  createAgent: (data: any) =>
    fetchJSON<Agent>("/agents", { method: "POST", body: JSON.stringify(data) }),
  freezeAgent: (id: string, reason?: string) =>
    fetchJSON<any>(`/agents/${id}/freeze`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    }),
  unfreezeAgent: (id: string, reason?: string) =>
    fetchJSON<any>(`/agents/${id}/unfreeze`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    }),
  restrictAgent: (id: string, reason?: string) =>
    fetchJSON<any>(`/agents/${id}/restrict`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    }),

  getRiskProfile: (agentId: string) =>
    fetchJSON<RiskProfile>(`/agents/${agentId}/risk-profile`),
  recalculateRisk: (agentId: string) =>
    fetchJSON<any>(`/agents/${agentId}/risk/recalculate`, { method: "POST" }),
  getPortfolioAnalytics: () =>
    fetchJSON<PortfolioAnalytics>("/analytics/portfolio"),
  getAgentAnalytics: (agentId: string, window = "30d") =>
    fetchJSON<AgentAnalytics>(`/agents/${agentId}/analytics?window=${window}`),
  simulateAgent: (
    agentId: string,
    data: {
      amount: number;
      merchant_category: string;
      repayment_outcome: "SUCCESS" | "FAIL";
    },
  ) =>
    fetchJSON<SimulationResult>(`/agents/${agentId}/simulate`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  createDraw: (data: {
    agent_id: string;
    amount: number;
    merchant_name: string;
    merchant_category: string;
    idempotency_key: string;
  }) =>
    fetchJSON<DrawRequest>("/draws", {
      method: "POST",
      body: JSON.stringify(data),
      headers: { "Idempotency-Key": data.idempotency_key },
    }),
  advanceDraw: (drawId: string) =>
    fetchJSON<DrawRequest>(`/draws/${drawId}/advance`, { method: "POST" }),

  getRepayments: (agentId: string) =>
    fetchJSON<RepaymentSchedule[]>(`/agents/${agentId}/repayments`),
  attemptRepayment: (scheduleId: string, forceStatus?: string) =>
    fetchJSON<any>(`/repayments/${scheduleId}/attempt`, {
      method: "POST",
      body: JSON.stringify({ force_status: forceStatus }),
    }),

  getAuditEvents: () => fetchJSON<AuditEvent[]>("/audit/events"),
  verifyAuditChain: () =>
    fetchJSON<{ status: string; total_events: number }>("/audit/verify"),
  tamperAuditLog: () =>
    fetchJSON<any>("/demo/audit/tamper", { method: "POST" }),
};
