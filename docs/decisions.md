# Architectural Decision Records (ADRs)

## ADR-001: Modular Monolith vs. Microservices Architecture

- **Status:** Approved
- **Context:** TrustLine requires strict transaction correctness, atomic concurrency control across account lines and principal limits, low operational complexity, and rapid 31-hour delivery.
- **Decision:** Build a single Django 5 backend application containing strict domain modules (`identity`, `risk`, `credit`, `gateway`, `repayment`, `monitoring`, `audit`, `demo`) backed by PostgreSQL.
- **Rationale:** Microservice separation introduces distributed lock complexity (two-phase commits, saga patterns) that risks non-atomic draw overspends during race conditions. PostgreSQL `select_for_update()` in a modular monolith provides row-level isolation guarantees for concurrent reservations.

---

## ADR-002: Bounded Credit Limit Formula & Utilization Exclusion from Risk Score

- **Status:** Approved
- **Context:** Unbounded credit formulas ($Floor + Score \times Ceiling$) can exceed the principal's authorized ceiling. Additionally, including current exposure as a positive signal in underwriting creates circular risk inflation.
- **Decision:**
  1. The Risk Profile AHP score uses 4 underwriting factors (Identity Confidence, Task Reliability, Repayment Reliability, Spending Regularity). Current Exposure is strictly excluded from AHP weighting.
  2. Bounded Credit Limit interpolation:
     $$\text{TargetCreditLimit} = \text{ColdStartFloor} + \left(\frac{\text{WeightedRiskScore}}{100}\right) \times (\text{PrincipalAuthorizedCeiling} - \text{ColdStartFloor})$$
     Enforced strictly: $0 \le \text{ColdStartFloor} \le \text{TargetCreditLimit} \le \text{PrincipalAuthorizedCeiling}$.

---

## ADR-003: Asymmetric Trust Dynamics (EMA Policy Parameters)

- **Status:** Approved
- **Context:** In credit risk, establishing creditworthiness requires consistent evidence over time, whereas failure or policy breaches indicate immediate risk.
- **Decision:**
  - $\alpha_{\text{up}} = 0.15$ (Slow upward adjustment on good outcomes)
  - $\alpha_{\text{down}} = 0.65$ (Fast downward adjustment on adverse outcomes)
  - Immediate freeze triggers bypass EMA entirely on critical security/repayment events.

---

## ADR-004: Ed25519 Mandate & Task Receipt Cryptography

- **Status:** Approved
- **Context:** Agents cannot be trusted to self-report task outcomes or claim pre-authorized credit limits without verifiable proof from principals and third-party receipt issuers.
- **Decision:**
  - Mandates are signed using Ed25519 keypairs held by the Principal/Signing Authority over canonical JSON payloads (mandate ID, principal ID, agent ID, capability manifest digest, ceiling, expiry, nonce).
  - Task receipts are signed using Ed25519 keypairs held by trusted receipt issuers (verifying receipt ID, task ID, agent ID, outcome, nonce).
  - Verification strictly uses public keys; private keys are never exposed to agents or stored in unencrypted memory.

---

## ADR-005: LLM Scope & Non-Blocking Isolation

- **Status:** Approved
- **Context:** LLM responses are non-deterministic and subject to prompt injection or API outages.
- **Decision:**
  - LLMs are strictly isolated to narrative generation from pre-calculated deterministic decision objects.
  - LLMs never decide risk scores, credit limits, transaction approvals, or authority state transitions.
  - A fallback static narrative is provided if LLM call times out (>2s) or API key is missing.

---

## ADR-006: Hexadecimal SHA-256 Hash-Chained Audit Ledger

- **Status:** Approved
- **Context:** To ensure auditability without requiring complex blockchain infrastructure during the hackathon, event integrity must be verifiable.
- **Decision:**
  - Every system mutation creates an append-only `AuditEvent` record with sequence $N$, timestamp, canonical JSON payload, $Hash_{N-1}$, and $Hash_N = \text{SHA256}(N + Timestamp + Payload + Hash_{N-1})$.
  - Any alteration of payload or sequence breaks chain verification.
