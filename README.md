# TrustLine — Autonomous Agent Credit Infrastructure

[![Build & Test](https://img.shields.io/badge/pytest-passing-brightgreen.svg)](docs/execution-status.md)
[![TypeScript](https://img.shields.io/badge/TypeScript-0%20errors-blue.svg)](docs/execution-status.md)
[![Docker Stack](https://img.shields.io/badge/Docker-3%20containers%20ready-blue.svg)](docker-compose.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**TrustLine** is an autonomous credit infrastructure built specifically for AI agents. Autonomous agents lack independent legal identity, bank accounts, collateral, and contractual accountability. TrustLine solves this by establishing a cryptographic, risk-underwritten bridge extending temporary, bounded credit lines directly to autonomous agents under principal-bound mandates.

---

## Technical Problem Statement & Architecture Highlights

1. **Cryptographic Identity & Principal Binding:** Agents operate under Ed25519-signed Capability Mandates issued by accountable principals (humans or registered entities). Every spend request presents a cryptographic mandate verification proof.
2. **Analytic Hierarchy Process (AHP) Underwriting:** Credit lines are underwritten using a multi-factor AHP pairwise comparison matrix ($CR = 0.0341 \le 0.10$) over 5 component factors (Identity Confidence, Task Reliability, Repayment Reliability, Spending Regularity, and Current Exposure).
3. **Cold-Start Priors & Bounded Limit Dynamics:** New agents start with explicit `is_imputed` cold-start priors ($\text{TaskReliability}=0$). Limits interpolate boundedly between $\text{ColdStartFloor}$ (₹1,000) and $\text{AuthorizedCeiling}$. Trust updates follow asymmetric exponential moving averages ($\alpha_{\text{up}}=0.15, \alpha_{\text{down}}=0.65$).
4. **Transaction Gateway Spend Isolation:** All spend requests execute outside the agent's LLM context via an isolated 15-step Transaction Gateway enforcing PostgreSQL `select_for_update()` row locking, merchant category policies, single transaction velocity limits, and daily velocity caps.
5. **Programmatic Repayment & instant Line Freeze:** Settlement creates automated repayment schedules executed via simulated bank pulls. Debit failures trigger instant state transitions to `FROZEN` and generate security escalations.
6. **Tamper-Evident SHA-256 Audit Ledger:** Every state transition, draw, repayment, and limit calculation is recorded into an append-only, SHA-256 hash-chained audit log ($Hash_N = \text{SHA256}(N + EventID + EventType + PayloadHash + Hash_{N-1})$).

---

## Project Structure

```text
TrustLine/
├── backend/                  # Django REST Modular Monolith
│   ├── apps/
│   │   ├── identity/         # Principals, Agents, Ed25519 Mandates
│   │   ├── risk/             # AHP Underwriting & Task Receipts
│   │   ├── credit/           # Bounded Limit & Asymmetric EMA Engine
│   │   ├── gateway/          # 15-Step Spend Gateway (select_for_update)
│   │   ├── repayment/        # Repayment Pulls & Bank Adapter
│   │   ├── monitoring/       # Authority State Machine & Escalations
│   │   ├── audit/            # SHA-256 Hash-Chained Audit Ledger
│   │   └── demo/             # Judge Demo Lab & LLM Explainer
│   └── config/               # DRF API routing & settings
├── frontend/                 # Mid-Century Modern Control Console (React + Vite + Tailwind)
│   ├── src/
│   │   ├── pages/            # Overview, Agents, DemoLab, Audit, Health
│   │   └── components/       # UI Components & Data Visualizers
├── docs/                     # Full Technical & Mathematical Documentation
│   ├── architecture.md       # Mermaid Diagrams (Component, Sequence, State)
│   ├── decisions.md          # Architectural Decision Records (ADRs 001-006)
│   ├── execution-status.md   # Live Module Readiness Matrix
│   ├── references.md         # Industry Citations (Google AP2, Visa Trusted Agent)
│   ├── risk-methodology.md   # AHP Eigenvector & Limit Formula Derivations
│   ├── scope-boundaries.md   # Implementation Scope Classification
│   └── threat-model.md       # Security Matrix & Threat Mitigations
├── scripts/                  # Automated Test & Verification Tools
│   ├── seed_demo.py          # Deterministic Demo Database Seeder
│   ├── demo_smoke.py         # End-to-End Smoke Test Suite
│   └── demo_concurrency.py   # Parallel Thread Race Condition Proof
├── docker-compose.yml        # Production-disciplined Docker Compose Stack
├── .env.example              # Environment Configuration Template
├── .gitignore                # Version Control Exclusions
├── Makefile                  # Local Development Shorthands
└── README.md                 # Project Overview & Quickstart Guide
```

---

## Quickstart

### Option 1: Docker Desktop (Recommended)

1. **Start the Stack:**
   ```bash
   docker compose up --build -d
   ```
2. **Seed Initial Demo Data:**
   ```bash
   docker compose exec backend python scripts/seed_demo.py
   ```
3. **Access Interfaces:**
   - **Frontend Dashboard:** [http://localhost:3000](http://localhost:3000)
   - **Backend API:** [http://localhost:8000/api/v1/health](http://localhost:8000/api/v1/health)
   - **PostgreSQL Database:** `localhost:5433` (`trustline` / `postgres`)

### Option 2: Local Python & Node Environment

1. **Backend Setup:**
   ```bash
   pip install -r backend/requirements.txt
   $env:PYTHONPATH="."
   $env:USE_SQLITE_TEST="true"
   python backend/manage.py migrate
   python scripts/seed_demo.py
   python backend/manage.py runserver 0.0.0.0:8000
   ```
2. **Frontend Setup:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
3. **Access Interface:** Open [http://localhost:5173](http://localhost:5173).

---

## Verification & Testing Suite

### 1. Pytest Backend Suite
Executes unit tests covering AHP matrix consistency ratio ($CR \le 0.10$), bounded credit limits, asymmetric EMA constants, and SHA-256 audit hash-chaining:
```bash
make test
# OR
pytest backend/tests
```

### 2. End-to-End Automated Smoke Test
Validates all 8 core lifecycle steps (Health Check, Seed Reset, Cold Start, Gateway Reservation, Settlement, Repayment Failure, Line Freeze, and Audit Validation):
```bash
python scripts/demo_smoke.py http://localhost:3000
```

### 3. PostgreSQL Concurrency Race Proof
Fires simultaneous parallel threads attempting to overspend a credit line, proving PostgreSQL `select_for_update()` double-spend prevention:
```bash
python scripts/demo_concurrency.py http://localhost:8000
```

---

## Documentation Index

- [Architecture & Diagrams](docs/architecture.md)
- [AHP Underwriting Risk Methodology](docs/risk-methodology.md)
- [Security Threat Model](docs/threat-model.md)
- [Architectural Decision Records (ADRs)](docs/decisions.md)
- [Implementation Scope Classification](docs/scope-boundaries.md)
- [Industry References & Protocol Comparison](docs/references.md)
- [Execution Status Matrix](docs/execution-status.md)

---

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
