import { Agent, Principal, RiskProfile, DrawRequest, RepaymentSchedule, AuditEvent, CreditLimitChange, TaskReceipt } from '../types';

const API_BASE = '/api/v1';

async function fetchJSON<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {})
    }
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error?.message || data.error?.code || 'API Request Failed');
  }
  return data as T;
}

export const api = {
  getHealth: () => fetchJSON<{ status: string; service: string }>('/health'),
  getDemoStatus: () => fetchJSON<{ principals: number; agents: number; audit_chain_valid: boolean }>('/demo/status'),
  seedDemo: () => fetchJSON<{ status: string; message: string }>('/demo/seed', { method: 'POST' }),
  resetDemo: () => fetchJSON<{ status: string; message: string }>('/demo/reset', { method: 'POST' }),
  
  getPrincipals: () => fetchJSON<Principal[]>('/principals'),
  createPrincipal: (name: string, email: string) => fetchJSON<Principal>('/principals', { method: 'POST', body: JSON.stringify({ name, email }) }),
  
  getAgents: () => fetchJSON<Agent[]>('/agents'),
  getAgentDetail: (id: string) => fetchJSON<Agent>(`/agents/${id}`),
  createAgent: (data: any) => fetchJSON<Agent>('/agents', { method: 'POST', body: JSON.stringify(data) }),
  freezeAgent: (id: string, reason?: string) => fetchJSON<any>(`/agents/${id}/freeze`, { method: 'POST', body: JSON.stringify({ reason }) }),
  unfreezeAgent: (id: string, reason?: string) => fetchJSON<any>(`/agents/${id}/unfreeze`, { method: 'POST', body: JSON.stringify({ reason }) }),
  
  getRiskProfile: (agentId: string) => fetchJSON<RiskProfile>(`/agents/${agentId}/risk-profile`),
  getLimitHistory: (agentId: string) => fetchJSON<CreditLimitChange[]>(`/agents/${agentId}/limit-history`),
  getReceipts: (agentId: string) => fetchJSON<TaskReceipt[]>(`/agents/${agentId}/receipts`),
  recalculateRisk: (agentId: string) => fetchJSON<any>(`/agents/${agentId}/risk/recalculate`, { method: 'POST' }),
  
  createDraw: (data: { agent_id: string; amount: number; merchant_name: string; merchant_category: string; idempotency_key: string }) =>
    fetchJSON<DrawRequest>('/draws', { method: 'POST', body: JSON.stringify(data), headers: { 'Idempotency-Key': data.idempotency_key } }),
  advanceDraw: (drawId: string) => fetchJSON<DrawRequest>(`/draws/${drawId}/advance`, { method: 'POST' }),
  
  getRepayments: (agentId: string) => fetchJSON<RepaymentSchedule[]>(`/agents/${agentId}/repayments`),
  attemptRepayment: (scheduleId: string, forceStatus?: string) =>
    fetchJSON<any>(`/repayments/${scheduleId}/attempt`, { method: 'POST', body: JSON.stringify({ force_status: forceStatus }) }),
    
  getAuditEvents: () => fetchJSON<AuditEvent[]>('/audit/events'),
  verifyAuditChain: () => fetchJSON<{ status: string; total_events: number }>('/audit/verify'),
  tamperAuditLog: () => fetchJSON<any>('/demo/audit/tamper', { method: 'POST' }),
};
