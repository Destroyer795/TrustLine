<div align="center">

![](https://img.shields.io/badge/INNOVA%20HACKATHON-900C3F?style=for-the-badge)

# TrustLine

*Autonomous credit infrastructure for AI Agents. Automatic. Instant. Zero paperwork.*

<br/>
<img src="docs/screenshots/trustline-logo.png" width="220" alt="TrustLine Brand Logo" style="border-radius: 12px;" />
<br/><br/>

![](https://img.shields.io/badge/REACT-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![](https://img.shields.io/badge/TYPESCRIPT-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![](https://img.shields.io/badge/VITE-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![](https://img.shields.io/badge/TAILWIND_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![](https://img.shields.io/badge/PYTHON-3776AB?style=for-the-badge&logo=python&logoColor=white)
![](https://img.shields.io/badge/DJANGO-092E20?style=for-the-badge&logo=django&logoColor=white)
<br/>
![](https://img.shields.io/badge/POSTGRESQL-336791?style=for-the-badge&logo=postgresql&logoColor=white)
![](https://img.shields.io/badge/DOCKER-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![](https://img.shields.io/badge/ED25519_CRYPTO-000000?style=for-the-badge&logo=json-web-tokens&logoColor=white)
![](https://img.shields.io/badge/NUMPY-013243?style=for-the-badge&logo=numpy&logoColor=white)
![](https://img.shields.io/badge/PYTEST-0A9EDC?style=for-the-badge&logo=pytest&logoColor=white)
![](https://img.shields.io/badge/GEMINI_AI-8E75B2?style=for-the-badge&logo=google-gemini&logoColor=white)

<h3>
  <a href="#quickstart">Quickstart</a> &nbsp;•&nbsp; 
  <a href="#architecture-highlights">Architecture</a> &nbsp;•&nbsp; 
  <a href="#risk-methodology--underwriting-math">Risk Math</a> &nbsp;•&nbsp; 
  <a href="#verification--testing-suite">Verification</a> &nbsp;•&nbsp; 
  <a href="#product-tour">Product Tour</a>
</h3>

</div>

> **Round 2 Submission Update:** This release addresses reviewer feedback on autonomous agent risk governance and credit line adequacy. Cryptographic identity verification (Ed25519) is now directly coupled with principal-bound capability mandates. The risk engine features a full Analytic Hierarchy Process (AHP) matrix ($CR \le 0.10$), asymmetric trust score EMAs ($\alpha_{\text{up}}=0.15, \alpha_{\text{down}}=0.65$), row-level PostgreSQL transaction isolation (`SELECT FOR UPDATE`), and append-only SHA-256 hash-chained audit logging.
>
> **Architecture & Security Audit:** Audited against standard autonomous spending vector guidelines. Core guarantees: 15-step transaction gateway spend isolation outside LLM context, explicit cold-start floor bounds, automated repayment debit pulls with zero-latency line freezes on failure, and full idempotency protection.

---

## Executive Summary

**TrustLine** is an autonomous credit infrastructure engineered for AI agents. Autonomous AI agents lack legal identity, bank accounts, collateral, and contractual standing. TrustLine solves this fundamental challenge by acting as a cryptographic, risk-underwritten gateway that extends temporary, bounded credit lines directly to AI agents under principal-bound mandates.

```mermaid
flowchart LR
    A["👤 Human Principal<br/><i>(Accountable Entity)</i>"] -->|Ed25519 Capability Mandate| B["🤖 Autonomous AI Agent<br/><i>(Bounded Execution)</i>"]
    B -->|AHP Underwritten Spend Request| C["⚡ TrustLine Gateway<br/><i>(SELECT FOR UPDATE Row Lock)</i>"]
    C -->|Hash-Chain Event Log| D["📜 SHA-256 Audit Ledger<br/><i>(& Bank Repayment Adapter)</i>"]

    style A fill:#1A1D24,stroke:#30363D,color:#E6EDF3
    style B fill:#1A1D24,stroke:#30363D,color:#E6EDF3
    style C fill:#900C3F,stroke:#D03050,color:#FFFFFF
    style D fill:#1A1D24,stroke:#30363D,color:#E6EDF3
```

| Stage | Subsystem / Actor | Operation & Security Boundary | Target Output |
|:---:|:---|:---|:---|
| **1. Identity** | **Human Principal** | Issues Ed25519-signed Capability Mandate with explicit ceiling caps | Accountable Mandate Proof |
| **2. Request** | **Autonomous Agent** | Submits spend request outside LLM context to isolated gateway | Signed Draw Request |
| **3. Gateway** | **TrustLine Core** | Evaluates AHP underwriting matrix & enforces PostgreSQL `SELECT FOR UPDATE` | Reserved Credit Line |
| **4. Settlement** | **Audit & Bank Pull** | Appends SHA-256 hash-chain event & executes scheduled mandate debit | Tamper-Evident Ledger Log |

[![Build & Test](https://img.shields.io/badge/pytest-passing-brightgreen.svg)](docs/execution-status.md)
[![TypeScript](https://img.shields.io/badge/TypeScript-0%20errors-blue.svg)](docs/execution-status.md)
[![Docker Stack](https://img.shields.io/badge/Docker-3%20containers%20ready-blue.svg)](docker-compose.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## Backend Module Architecture Table

| Django App | Underlying DB Models | Core Algorithms & Safeguards |
|:---|:---|:---|
| **`identity`** | `Principal`, `Agent`, `Mandate` | Ed25519 Cryptographic Signature Verification & Principal Binding |
| **`risk`** | `TaskReceipt`, `RiskAssessment`, `AHPWeight` | Analytic Hierarchy Process (AHP) Pairwise Eigenvector Matrix ($CR \le 0.10$) |
| **`credit`** | `CreditAccount`, `LimitHistory` | Cold-Start Floor Bounds & Asymmetric Trust Score EMA ($\alpha_{\text{up}}=0.15, \alpha_{\text{down}}=0.65$) |
| **`gateway`** | `DrawRequest`, `DrawReservation` | 15-Step Spend Gateway with PostgreSQL `SELECT FOR UPDATE` Pessimistic Row Locking |
| **`repayment`** | `RepaymentSchedule`, `RepaymentAttempt` | Automated Mandate Debit Pulls & Simulated Bank Adapter Settlement |
| **`monitoring`** | `AuthorityStateTransition`, `Escalation` | Finite State Machine (`NORMAL`, `RESTRICTED`, `FROZEN`) & Security Escalations |
| **`audit`** | `AuditEvent` | Append-Only SHA-256 Hash-Chained Audit Ledger ($Hash_N = \text{SHA256}(N \parallel \dots \parallel Hash_{N-1})$) |
| **`demo`** | `DemoScenarioState` | Deterministic Database Seeder & Judge LLM Explainer Gateway |

---

## Seeded Agent Test Matrix Table

| Seeded Agent | Target Scenario | Starting Credit Line | Authority State | Expected HTTP Result |
|:---|:---|:---|:---|:---|
| **`ProcurementBot-Good`** | Verified SaaS & Cloud Procurement | ₹15,000 | `NORMAL` | `201 CREATED` |
| **`ArbitrageBot-Bad`** | Repayment Failure & Default Handling | ₹0 (Frozen) | `FROZEN` | `403 AGENT_FROZEN` |
| **`DataScraper-New`** | Cold-Start Underwriting & Over-Limit Protection | ₹2,000 | `NORMAL` | `402 CREDIT_LIMIT_EXCEEDED` *(when draw > ₹2,000)* |

> **Verification Tip:** Non-2xx HTTP responses are part of the cryptographic proof. A `402 CREDIT_LIMIT_EXCEEDED` response confirms that over-limit policy checks succeeded, while a `403 AGENT_FROZEN` response confirms zero-latency line isolation.

---

## Architecture Highlights

```mermaid
graph TD
    subgraph Principal Boundary
        P["Principal / Enterprise"] -->|Configures Policy| MANIFEST["Capability Manifest"]
        P -->|Signs with Ed25519| MANDATE["Signed Capability Mandate"]
    end

    subgraph Agent Execution Context
        A["Autonomous AI Agent"] -->|Presents API Key & Mandate Proof| GATEWAY["15-Step Transaction Gateway"]
    end

    subgraph TrustLine Core Engine
        MANDATE -->|Verify Signature| GATEWAY
        MANIFEST -->|Policy & Velocity Check| GATEWAY
        
        GATEWAY -->|1. Row Lock SELECT FOR UPDATE| DB[("PostgreSQL Database")]
        GATEWAY -->|2. Underwrite & Limit Check| CE["Credit Decision Engine"]
        
        RE["Risk Engine (NumPy Matrix)"] -->|Calculates AHP Vector| CE
        TR["Task Receipt Verification"] -->|Updates Reliability| RE
        
        CE -->|Computes Limit & EMA| DB
        GATEWAY -->|3. Reserves Credit Line| RES["Draw Reservation"]
        
        RES -->|Settles Transaction| REPAY["Repayment Scheduler"]
        REPAY -->|Mandate Debit Pull| BANK["Simulated Bank Adapter"]
        
        BANK -->|Success / Failure| SM["Authority State Machine"]
        SM -->|NORMAL / RESTRICTED / FROZEN| DB
        
        GATEWAY -->|Append Event| AUDIT["SHA-256 Hash-Chained Audit Ledger"]
    end
```

### Core Architecture Principles Table

| Architectural Dimension | Mechanism & Implementation | Security & Reliability Guarantee |
|:---|:---|:---|
| **Cryptographic Identity** | Ed25519-signed Capability Mandates issued by accountable principals | Principal binding; prevents unauthorized agent impersonation |
| **Multi-Factor Underwriting** | Analytic Hierarchy Process (AHP) 5-factor pairwise comparison matrix | Mathematical consistency ($CR = 0.0341 \le 0.10$) |
| **Limit Dynamics & EMA** | Bounded floor/ceiling interpolation with asymmetric trust score EMA | $\alpha_{\text{up}}=0.15, \alpha_{\text{down}}=0.65$; rapid penalty on default |
| **Spend Isolation Gateway** | 15-step Transaction Gateway with PostgreSQL `SELECT FOR UPDATE` | Pessimistic row locking; prevents race conditions & double-spends |
| **Automated Repayment** | Scheduled mandate debit pulls with bank adapter integration | Zero-latency state transition to `FROZEN` on debit failure |
| **Tamper-Evident Audit** | Append-only SHA-256 hash-chained event ledger | Cryptographic immutability ($Hash_N = \text{SHA256}(\dots)$) |

---

## Risk Methodology & Underwriting Math

TrustLine's risk decision engine implements mathematical formulations to compute credit limits and verify stability:

### 1. Analytic Hierarchy Process (AHP) Pairwise Consistency Ratio
$$CR = \frac{CI}{RI} \le 0.10 \quad \text{where} \quad CI = \frac{\lambda_{\max} - n}{n - 1}$$
For our 5-factor matrix, $n = 5, RI = 1.12$, yielding a verified consistency ratio of $CR = 0.0341$.

### 2. Bounded Credit Limit Interpolation
$$L_{\text{target}} = L_{\text{min}} + S \cdot (L_{\text{max}} - L_{\text{min}})$$
where $S \in [0, 1]$ represents the overall normalized AHP composite risk score.

### 3. Asymmetric Trust Moving Average
$$T_n = \alpha \cdot R_n + (1 - \alpha) \cdot T_{n-1}$$
- **Positive Behavior (Timely Repayment / Completed Task):** $\alpha_{\text{up}} = 0.15$
- **Negative Behavior (Default / Failed Repayment):** $\alpha_{\text{down}} = 0.65$

### 4. SHA-256 Audit Hash Chaining
$$H_N = \text{SHA-256}\left( N \mathbin{\Vert} \text{EventID} \mathbin{\Vert} \text{PayloadHash} \mathbin{\Vert} H_{N-1} \right)$$

---

## Product Tour

### Complete Route Overview

| Desktop · 1440×900 | Tablet · 1024×768 | Mobile · 390×844 |
|:---|:---|:---|
| ![TrustLine desktop route overview](docs/screenshots/desktop-contact-sheet.png) | ![TrustLine tablet route overview](docs/screenshots/tablet-contact-sheet.png) | ![TrustLine mobile route overview](docs/screenshots/mobile-contact-sheet.png) |

<details>
<summary><strong>View All Detailed Interface Views</strong></summary>

### Judge Overview
| Desktop | Tablet | Mobile |
|:---|:---|:---|
| ![Overview desktop](docs/screenshots/overview-desktop.png) | ![Overview tablet](docs/screenshots/overview-tablet.png) | ![Overview mobile](docs/screenshots/overview-mobile.png) |

### Three-Minute Presentation Mode
| Desktop | Tablet | Mobile |
|:---|:---|:---|
| ![Presentation desktop](docs/screenshots/presentation-desktop.png) | ![Presentation tablet](docs/screenshots/presentation-tablet.png) | ![Presentation mobile](docs/screenshots/presentation-mobile.png) |

### Agent Inventory
| Desktop | Tablet | Mobile |
|:---|:---|:---|
| ![Agent inventory desktop](docs/screenshots/agents-desktop.png) | ![Agent inventory tablet](docs/screenshots/agents-tablet.png) | ![Agent inventory mobile](docs/screenshots/agents-mobile.png) |

### Agent Registration
| Desktop | Tablet | Mobile |
|:---|:---|:---|
| ![Agent registration desktop](docs/screenshots/registration-desktop.png) | ![Agent registration tablet](docs/screenshots/registration-tablet.png) | ![Agent registration mobile](docs/screenshots/registration-mobile.png) |

### Underwriting & Authority Detail
| Desktop | Tablet | Mobile |
|:---|:---|:---|
| ![Agent detail desktop](docs/screenshots/agent-detail-desktop.png) | ![Agent detail tablet](docs/screenshots/agent-detail-tablet.png) | ![Agent detail mobile](docs/screenshots/agent-detail-mobile.png) |

### Live Enforcement Laboratory
| Desktop | Tablet | Mobile |
|:---|:---|:---|
| ![Demo Lab desktop](docs/screenshots/demo-desktop.png) | ![Demo Lab tablet](docs/screenshots/demo-tablet.png) | ![Demo Lab mobile](docs/screenshots/demo-mobile.png) |

### Tamper-Evident Audit Ledger
| Desktop | Tablet | Mobile |
|:---|:---|:---|
| ![Audit ledger desktop](docs/screenshots/audit-desktop.png) | ![Audit ledger tablet](docs/screenshots/audit-tablet.png) | ![Audit ledger mobile](docs/screenshots/audit-mobile.png) |

### System Readiness & Limitations
| Desktop | Tablet | Mobile |
|:---|:---|:---|
| ![System readiness desktop](docs/screenshots/system-desktop.png) | ![System readiness tablet](docs/screenshots/system-tablet.png) | ![System readiness mobile](docs/screenshots/system-mobile.png) |

</details>

---

## Project Structure

```text
TrustLine/
├── backend/                  # Django REST Modular Monolith Architecture
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
├── frontend/                 # Control Console (React 18 + Vite + TypeScript + Tailwind)
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
├── docker-compose.yml        # Multi-Container Production Docker Stack
├── Makefile                  # Automated Shorthands & Tasks
└── README.md                 # Project Overview & Quickstart Guide
```

---

## Quickstart

### Access Endpoints Table

| Interface / Endpoint | Access URL / Connection | Target Service / Purpose |
|:---|:---|:---|
| **Frontend Console** | [http://localhost:3000](http://localhost:3000) *(or `http://localhost:5173`)* | React 18 Control Console & Judge Demo Lab |
| **Backend API Health** | [http://localhost:8000/api/v1/health](http://localhost:8000/api/v1/health) | Django REST Framework API & System Status |
| **PostgreSQL Database** | `localhost:5433` (`trustline` / `postgres`) | Relational Store with Row Locking & Audit Chains |

### Setup Instructions

#### Option 1: Docker Desktop (Recommended)

1. **Launch Stack:**
   ```bash
   docker compose up --build -d
   ```
2. **Seed Initial Demo Data:**
   ```bash
   docker compose exec backend python scripts/seed_demo.py
   ```

#### Option 2: Local Python & Node Environment

1. **Backend Setup:**
   ```bash
   pip install -r backend/requirements.txt
   export PYTHONPATH="."
   export USE_SQLITE_TEST="true"
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

---

## Verification & Testing Suite Table

| Test / Verification Suite | Command Line Execution | Key Assertion & Verification Goal |
|:---|:---|:---|
| **Pytest Backend Suite** | `make test`<br/>*or* `pytest backend/tests` | Validates AHP eigenvector math ($CR \le 0.10$), limit dynamics, and hash-chaining |
| **Automated Smoke Test** | `python scripts/demo_smoke.py http://localhost:3000` | E2E validation of all 8 lifecycle steps (Cold start, Draw, Repayment, Line Freeze, Audit) |
| **PostgreSQL Concurrency Race** | `python scripts/demo_concurrency.py http://localhost:8000` | Fires simultaneous parallel threads to prove PostgreSQL `SELECT FOR UPDATE` locking |

---

## Documentation Index

| Topic | Document Link | Description |
|:---|:---|:---|
| **Architecture & Diagrams** | [architecture.md](docs/architecture.md) | Component, Sequence, State, and ER Diagrams |
| **Risk Methodology** | [risk-methodology.md](docs/risk-methodology.md) | AHP Eigenvectors, Consistency Ratios, EMA formulas |
| **Threat Model** | [threat-model.md](docs/threat-model.md) | Security mitigations & attack vector analysis |
| **Architecture Decisions** | [decisions.md](docs/decisions.md) | ADRs 001 through 006 |
| **Scope & Boundaries** | [scope-boundaries.md](docs/scope-boundaries.md) | In-scope vs Out-of-scope boundaries |
| **Industry References** | [references.md](docs/references.md) | Industry citations (Google AP2, Visa Trusted Agent) |
| **Execution Status** | [execution-status.md](docs/execution-status.md) | Test coverage and readiness matrix |
| **Next Plan of Action** | [next-plan.md](docs/next-plan.md) | Roadmap for upcoming features |

---

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
