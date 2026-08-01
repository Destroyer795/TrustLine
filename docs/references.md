# Industry References & Architectural Parallels

This document details real-world payment standards, agent protocols, and regulatory frameworks that inform the design of **TrustLine — Autonomous Agent Credit Infrastructure**.

---

## 1. Google Agent Payments Protocol (AP2)

- **Overview:** AP2 introduces cryptographic mandates binding an autonomous AI agent's actions to human principal authority.
- **Architectural Parallel in TrustLine:** TrustLine implements Ed25519-signed Capability Mandates containing scoped spending categories, per-transaction limits, daily velocity caps, nonces, and expiration timestamps. The agent cannot modify or self-sign its own mandate.

---

## 2. Mastercard Agent Pay & Visa Trusted Agent Protocol

- **Overview:** Emerging card network specifications for non-human delegates (machines, IoT devices, AI assistants) requiring delegated authority tokens, programmatic merchant controls, and real-time spend delegation outside the agent's LLM context.
- **Architectural Parallel in TrustLine:** TrustLine's Transaction Gateway enforces spend controls outside the agent's execution loop. The agent holds an API credential to request credit draws, but settlement occurs through backend validation against principal-authorized mandates.

---

## 3. NPCI UPI AutoPay & NACH e-Mandates

- **Overview:** Reserve Bank of India (RBI) / National Payments Corporation of India (NPCI) frameworks for recurring automated debit mandates against bank accounts with pre-authorized ceilings and mandatory failure notification workflows.
- **Architectural Parallel in TrustLine:** TrustLine's Repayment Enforcement engine uses principal-authorized linked account mandates to execute programmatic repayment pulls. Failed pulls trigger instant line freezes and escalation records.

---

## 4. Analytic Hierarchy Process (AHP) in Credit Underwriting

- **Overview:** Developed by Thomas L. Saaty, AHP is a structured technique for organizing and analyzing complex decisions using pairwise comparison matrices and mathematical consistency validation ($CR \le 0.10$).
- **Architectural Parallel in TrustLine:** Given the absence of historical default datasets for autonomous AI agents, TrustLine utilizes AHP as a transparent policy prior framework to weigh underwriting factors (Identity Confidence, Task Reliability, Repayment Reliability, Spending Regularity) without claiming false empirical ML training.
