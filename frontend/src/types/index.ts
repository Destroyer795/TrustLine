export type AgentStatus = 'NORMAL' | 'RESTRICTED' | 'FROZEN' | 'HUMAN_REVIEW';

export interface Principal {
  id: string;
  name: string;
  email: string;
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
  component: 'IDENTITY' | 'TASK' | 'REPAYMENT' | 'SPENDING' | 'EXPOSURE';
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

export interface CreditLimitChange {
  previous_limit: string;
  new_limit: string;
  target_limit: string;
  alpha: string;
  trigger: string;
  reason: string;
  created_at: string;
}

export interface TaskReceipt {
  id: string;
  issuer: string;
  outcome: 'SUCCESS' | 'FAILED';
  value: string | null;
  issued_at: string;
  signature_short: string;
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
