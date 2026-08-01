# Threat Model & Vulnerability Analysis

This document details threat scenarios, attack vectors, mitigations, and verification methods implemented in **TrustLine — Autonomous Agent Credit Infrastructure**.

---

## Threat Matrix

| Threat Vector | Attack Scenario | Implemented Mitigation | Verification Method |
|---|---|---|---|
| **Sybil Attack (Multiple Agents)** | A single principal registers 50 agents to exploit multiple cold-start floors. | Principal-wide shared cold-start pool caps aggregated exposure across all agents under one principal. | Unit test verifying pool depletion across agents. |
| **Agent Credential Theft** | An attacker steals an agent's API key. | Scoped API credentials hashed with SHA-256; instant freeze trigger; Gateway merchant category filtering. | Auth test with invalid key and frozen status test. |
| **Mandate Tampering / Replay** | Agent alters authorized ceiling or reuses expired mandate. | Mandate signed with principal Ed25519 key over canonical JSON + nonce + expiry. Checked on every draw. | Signature payload modification test. |
| **Task Receipt Forge / Replay** | Agent invents task success or submits old receipt twice. | Receipt requires Ed25519 signature from trusted issuer; receipt IDs & nonces tracked for single-use. | Replay receipt test. |
| **Concurrent Draw Race Condition** | Agent sends 2 simultaneous ₹7,000 draws against ₹10,000 limit to double-spend. | PostgreSQL `select_for_update()` transaction locking agent and principal rows atomically. | Automated race script (`scripts/demo_concurrency.py`). |
| **Duplicate Transaction Retry** | Network retry submits draw twice. | Mandatory `Idempotency-Key` header with database uniqueness constraint returns cached response. | Idempotent retry integration test. |
| **Linked Account Swap Evasion** | Principal changes bank account to avoid scheduled repayment pull. | Account change invalidates active mandate, freezing credit line until re-signed. | Account swap lifecycle test. |
| **Stale Authorization Cache** | Agent draws funds after principal issues freeze. | No authorization decisions cached; live DB lookup and mandate version check on every draw. | In-flight draw revocation test. |
| **Audit Ledger Modification** | Attacker or rogue admin alters historic draw record in DB. | Monotonic SHA-256 hash-chain ($Hash_N = \text{SHA256}(N + Payload + Hash_{N-1})$). Audit verification detects discrepancy. | Audit tamper test script (`POST /api/v1/demo/audit/tamper`). |
| **LLM Prompt Injection / Hijack** | Malicious input to LLM tries to grant credit or alter decisions. | LLMs strictly restricted to generating narrative text from pre-calculated deterministic JSON payloads. | Architecture isolation audit. |
