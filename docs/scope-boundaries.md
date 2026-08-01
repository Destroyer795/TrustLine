# Scope Boundaries — Feature Classification

This document explicitly classifies all components and capabilities of **TrustLine — Autonomous Agent Credit Infrastructure** into three categories to ensure complete honesty and transparency during evaluation:

- **IMPLEMENTED:** Working code fully tested by automated unit, integration, and end-to-end tests.
- **SIMULATED:** Functionally realistic sandbox implementations explicitly isolated from external live networks for demo reliability.
- **FUTURE:** Architectural designs planned for production evolution beyond the hackathon scope.

---

## Feature Classification Table

| Component / Capability | Category | Implementation Details & Boundaries |
|---|---|---|
| **Identity & Authority** | | |
| Principal Google OAuth / Mock Anchor | `IMPLEMENTED` | Mock / OAuth provider anchor storing verified state and provider ID. |
| Agent API Credential Hashing | `IMPLEMENTED` | SHA-256 hashed API keys for agent authentication. |
| Capability Manifest Validation | `IMPLEMENTED` | Validates merchant categories, transaction ceilings, daily ceilings, currency, and validity dates. |
| Ed25519 Mandate Signature Verification | `IMPLEMENTED` | Cryptographic signature validation over canonical JSON payloads using `cryptography`. |
| Principal-Wide Cold-Start Pool | `IMPLEMENTED` | Pooled exposure cap across all new agents linked to a principal. |
| Production KYC / Sanctions Screening | `FUTURE` | Integration with identity verification providers (e.g. Persona, SumSub, Aadhaar e-KYC). |
| **Risk & Underwriting** | | |
| 5 Risk Component Decomposition | `IMPLEMENTED` | Identity Confidence, Task Reliability, Repayment Reliability, Spending Regularity, Current Exposure. |
| Analytic Hierarchy Process (AHP) Matrix | `IMPLEMENTED` | Pairwise comparison matrix with consistency ratio ($CR \le 0.10$) calculation. |
| Imputed vs. Earned Signal Tracking | `IMPLEMENTED` | Explicit `is_imputed` flags, zero cold-start Task Reliability prior. |
| Signed Task Receipt Verification | `IMPLEMENTED` | Ed25519 verification over receipts from trusted issuer public keys. |
| Mock Receipt Issuer | `SIMULATED` | Team-controlled service signing task outcomes with an Ed25519 private key. |
| Empirical ML Default Weight Tuning | `FUTURE` | Retrospective statistical weight fitting on historical agent default datasets once available. |
| **Credit Engine** | | |
| Bounded Credit Limit Interpolation | `IMPLEMENTED` | Target limit bounded between Cold-Start Floor and Principal Authorized Ceiling. |
| Asymmetric Exponential Moving Average | `IMPLEMENTED` | Trust growth ($\alpha_{\text{up}}=0.15$) vs fast reduction ($\alpha_{\text{down}}=0.65$). |
| Outstanding Obligation Floor Protection | `IMPLEMENTED` | Limit reduction cannot drop below outstanding balances without shifting account to restricted state. |
| **Transaction Gateway** | | |
| 15-Step Atomic Reservation | `IMPLEMENTED` | PostgreSQL `select_for_update()` transaction locking agent and principal rows. |
| Idempotency Protection Header | `IMPLEMENTED` | `Idempotency-Key` header with database uniqueness constraint and cached response return. |
| In-Flight Draw Revocation | `IMPLEMENTED` | Revocation between `RESERVED` and `SETTLING` releases reservation and marks draw `REVOKED`. |
| Real Card Network / Payment Rail Integration | `SIMULATED` | Simulated ledger settlement replacing card network auth/capture. |
| **Repayment Enforcement** | | |
| Mandate-Bound Repayment Scheduler | `IMPLEMENTED` | Automatically creates repayment schedule on draw settlement. |
| Deterministic Bank Adapter | `SIMULATED` | Mock bank rail with controllable state (Sufficient, Insufficient Funds, Account Blocked). |
| Failed Pull Instant Freeze & Escalation | `IMPLEMENTED` | Failure transitions account immediately to `FROZEN` and creates escalation record. |
| Revenue-Based Auto-Split Repayment | `FUTURE` | Automatic interception of incoming client payouts via payment gateway webhooks. |
| **Monitoring & Audit** | | |
| Authority State Machine | `IMPLEMENTED` | State transitions (`NORMAL`, `RESTRICTED`, `FROZEN`, `HUMAN_REVIEW`) with audit triggers. |
| SHA-256 Hash-Chained Audit Log | `IMPLEMENTED` | Monotonic event sequence, prev_hash linking, canonical JSON hashing. |
| Audit Integrity & Tamper Detection | `IMPLEMENTED` | Verification engine detecting payload, sequence, or hash alterations. |
| WORM / Decentralized Immutable Anchoring | `FUTURE` | Periodic anchoring of local audit root hashes to timestamping services or public ledgers. |
| **LLM Explanation Boundary** | | |
| Deterministic Fact Transformation | `IMPLEMENTED` | Gemini API transforms pre-computed decision payloads into readable text narratives. |
| Service Fallback | `IMPLEMENTED` | Graceful fallback string displayed when LLM API key is absent or request times out. |
