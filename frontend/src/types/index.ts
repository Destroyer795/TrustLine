export type AgentStatus = "NORMAL" | "RESTRICTED" | "FROZEN" | "HUMAN_REVIEW";

export interface Principal {
  id: string;
  name: string;
  email: string;
  credit_pool_ceiling?: string;
  verification?: {
    level: string;
    status: string;
  };
}

export interface CreditAccount {
  current_limit: string;
  target_limit: string;
  cold_start_floor: string;
  authorized_ceiling: string;
  reserved_amount: string;
  outstanding_principal: string;
  available_credit: string;
}

export interface Mandate {
  id: string;
  version: number;
  authorized_ceiling: string;
  expires_at: string;
  is_valid: boolean;
}

export interface Agent {
  id: string;
  principal_id?: string;
  principal_name?: string;
  principal?: {
    id: string;
    name: string;
  };
  display_name: string;
  purpose: string;
  status: AgentStatus;
  created_at?: string;
  current_limit?: string;
  available_credit?: string;
  reserved_amount?: string;
  outstanding_principal?: string;
  credit_account?: CreditAccount;
  mandate?: Mandate;
  latest_risk_score?: string;
  raw_api_key?: string;
}

export interface RiskEvidence {
  component: "IDENTITY" | "TASK" | "REPAYMENT" | "SPENDING" | "EXPOSURE";
  score: string;
  evidence_count: number;
  source: string;
  is_imputed: boolean;
  reason: string;
}

export interface RiskProfile {
  agent_id: string;
  weighted_risk_score: string;
  components: {
    identity_confidence: { score: string; is_imputed: boolean };
    task_reliability: { score: string; is_imputed: boolean };
    repayment_reliability: { score: string; is_imputed: boolean };
    spending_regularity: { score: string; is_imputed: boolean };
    current_exposure: { amount: string; utilization_pct: string };
  };
  evidence: RiskEvidence[];
  explanation: {
    narrative: string;
    source: string;
    is_llm_generated: boolean;
  };
}

export interface DrawRequest {
  draw_id: string;
  status: string;
  amount: string;
  merchant_name: string;
  merchant_category: string;
  reserved_amount: string;
  available_credit: string;
  rejection_reason?: string;
}

export interface RepaymentAttempt {
  id: string;
  status: string;
  ref: string;
  reason: string;
}

export interface RepaymentSchedule {
  id: string;
  draw_id: string;
  amount: string;
  due_date: string;
  status: string;
  attempts: RepaymentAttempt[];
}

export interface AuditEvent {
  sequence: number;
  event_id: string;
  event_type: string;
  actor: string;
  entity: string;
  previous_hash: string;
  current_hash: string;
  created_at: string;
  payload: any;
}

export interface DemoScenario {
  key: string;
  title: string;
  agent_name: string;
  lesson: string;
  step_count: number;
  agent?: {
    id: string;
    name: string;
    purpose: string;
    authority: AgentStatus;
    limit: string;
    available: string;
  };
}
export interface DemoStep {
  sequence: number;
  actor: string;
  action: string;
  endpoint: string;
  transport_status: number;
  semantic_result: string;
  plain_language: string;
  proof: string;
  request: Record<string, unknown>;
  response: Record<string, any>;
  before: Record<string, string>;
  after: Record<string, string>;
  gateway_checks: string[];
  audit_sequence?: number;
  created_at: string;
}
export interface DemoSession {
  id: string;
  scenario_key: string;
  title: string;
  lesson: string;
  status: string;
  current_step: number;
  total_steps: number;
  initial_state: Record<string, string>;
  current_state: Record<string, string>;
  steps: DemoStep[];
}
export interface PortfolioAnalytics {
  seeded_demo: boolean;
  as_of: string;
  summary: {
    authorized_capital: string;
    current_limits: string;
    available_credit: string;
    reserved_exposure: string;
    outstanding_principal: string;
    utilization_pct: string;
  };
  authority_states: { state: string; count: number }[];
  exposure_by_bot: {
    agent_id: string;
    agent_name: string;
    principal_name: string;
    authority: string;
    limit: string;
    available: string;
    reserved: string;
    outstanding: string;
    utilization_pct: string;
  }[];
  merchant_categories: { category: string; amount: string; count: number }[];
  recent_events: {
    sequence: number;
    type: string;
    entity: string;
    created_at: string;
  }[];
}
export interface AgentAnalytics {
  seeded_demo: boolean;
  agent_id: string;
  agent_name: string;
  principal_name: string;
  window: string;
  as_of: string;
  summary: {
    authority: string;
    limit: string;
    available: string;
    reserved: string;
    outstanding: string;
    floor: string;
    ceiling: string;
  };
  risk_history: {
    at: string;
    score: string;
    identity: string;
    task: string;
    repayment: string;
    spending: string;
    exposure_utilization: string;
  }[];
  limit_history: {
    at: string;
    previous: string;
    target: string;
    limit: string;
    trigger: string;
  }[];
  exposure_history: {
    at: string;
    balance: string;
    amount: string;
    type: string;
  }[];
  merchant_categories: { category: string; amount: string; count: number }[];
  draw_outcomes: { status: string; count: number; amount: string }[];
  repayment_outcomes: { status: string; count: number; amount: string }[];
  authority_transitions: {
    at: string;
    from: string;
    to: string;
    trigger: string;
    reason: string;
  }[];
  transactions: {
    id: string;
    at: string;
    merchant: string;
    category: string;
    amount: string;
    status: string;
    reason: string;
  }[];
}
export interface SimulationResult {
  decision: string;
  code: string;
  checks: { name: string; passed: boolean; detail: string }[];
  projected: {
    authority?: string;
    available_after_reservation?: string;
    outstanding_after_settlement?: string;
    limit_effect?: string;
  };
  mutated: false;
}
