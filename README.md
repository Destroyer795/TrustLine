<div align="center">

![](https://img.shields.io/badge/INNOVAHACK%20HACKATHON-900C3F?style=for-the-badge)

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
    P["Human Principal\n(Accountable)"]
    A["Autonomous AI Agent\n(Bounded Execution)"]
    G["TrustLine Gateway\n(PostgreSQL Row Lock)"]
    L["SHA-256 Audit Ledger\n& Bank Repayment Pull"]

    P -->|"Ed25519 Mandate"| A
    A -->|"AHP Underwrite"| G
    G -->|"Append & Settle"| L
```

[![Build & Test](https://img.shields.io/badge/pytest-passing-brightgreen.svg)](docs/execution-status.md)
[![TypeScript](https://img.shields.io/badge/TypeScript-0%20errors-blue.svg)](docs/execution-status.md)
[![Docker Stack](https://img.shields.io/badge/Docker-3%20containers%20ready-blue.svg)](docker-compose.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

<div align="center">
  <br/>
  <img src="assets/Enterprise AI Risk System Diagram.png" width="100%" alt="TrustLine Enterprise AI Risk System — full component architecture from principal through autonomous agent to cryptographic audit ledger" />
  <p><sub><em>Full system architecture: Human Principal → Ed25519 Mandate → Autonomous Agent → 15-Step Gateway → PostgreSQL Row Lock → SHA-256 Audit Ledger</em></sub></p>
</div>

---

## Backend Module Architecture Table

| Django App | Underlying DB Models | Core Algorithms & Safeguards |
|:---|:---|:---|
| **`identity`** | `Principal`, `Agent`, `Mandate` | Ed25519 Cryptographic Signature Verification & Principal Binding |
| **`risk`** | `TaskReceipt`, `RiskAssessment`, `AHPWeight` | Analytic Hierarchy Process (AHP) Pairwise Eigenvector Matrix ($CR \le 0.10$) |
| **`credit`** | `CreditAccount`, `LimitHistory` | Cold-Start Floor Bounds & Asymmetric Trust Score EMA ($\alpha_{\text{up}}=0.15, \alpha_{\text{down}}=0.65$) |
| **`gateway`** | `DrawRequest`, `DrawReservation` | 15-Step Spend Gateway with PostgreSQL `SELECT FOR UPDATE` Pessimistic Row Locking |
| **`repayment`** | `RepaymentSchedule`, `RepaymentAttempt` | Automated Mandate Debit Pulls & Simulated Bank Adapter Settlement |
| **`monitoring`** | `AuthorityStateTransition`, `Escalation` | Finite State Machine (`NORMAL`, `RESTRICTED`, `FROZEN`, `HUMAN_REVIEW`) & Security Escalations |
| **`audit`** | `AuditEvent` | Append-Only SHA-256 Hash-Chained Audit Ledger ($Hash_N = \text{SHA256}(N \parallel \dots \parallel Hash_{N-1})$) |
| **`demo`** | `DemoSession`, `DemoStepResult` | Persistent deterministic bot orchestration, step evidence, reset, replay, and narration boundary |

---

## Seeded Agent Test Matrix Table

| Seeded Agent | Target Scenario | Starting Authority | Expected Proof |
|:---|:---|:---|:---|
| **Atlas Procurement Bot** | Complete authorized purchase, settlement, and repayment | `NORMAL` | Reservation and settlement succeed; repayment increases trust gradually |
| **Scout Research Bot** | Cold-start boundary with a request one rupee above available credit | `NORMAL` | `402 CREDIT_LIMIT_EXCEEDED` with no reservation or exposure |
| **Vector Arbitrage Bot** | Capability restriction and failed repayment | `NORMAL` | Denied categories return `403`; repayment failure freezes authority |

> **Verification Tip:** Non-2xx HTTP responses are part of the cryptographic proof. A `402 CREDIT_LIMIT_EXCEEDED` response confirms that over-limit policy checks succeeded, while a `403 AGENT_FROZEN` response confirms zero-latency line isolation.

<details>
<summary><strong>🗺️ Judge Quick-Scan: All Diagrams at a Glance</strong></summary>
<br/>
<div align="center">
  <img src="assets/TrustLine_autonomous_credit_infr…_202608021112.jpeg" width="100%" alt="TrustLine all-in-one technical overview: system components, draw lifecycle, repayment lifecycle, authority state machine, and entity-relationship model" />
  <p><sub><em>One-page technical overview — system components, draw lifecycle, repayment, state machine, and data model</em></sub></p>
</div>
</details>

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
        SM -->|NORMAL / RESTRICTED / FROZEN / HUMAN_REVIEW| DB
        
        GATEWAY -->|Append Event| AUDIT["SHA-256 Hash-Chained Audit Ledger"]
    end
```

### Visual Architecture Diagrams

<table>
  <tr>
    <td align="center" width="50%">
      <strong>Draw Lifecycle — 15-Step Transaction Gateway</strong><br/><br/>
      <img src="assets/architecture-draw-lifecycle.png" width="100%" alt="Draw lifecycle: 15-step sequence from POST /draws through Ed25519 mandate verification, SELECT FOR UPDATE row lock, AHP underwriting, atomic reservation, and SHA-256 audit hash append" />
    </td>
    <td align="center" width="50%">
      <strong>Repayment Lifecycle — Automated Mandate Debit</strong><br/><br/>
      <img src="assets/architecture-repayment.png" width="100%" alt="Repayment lifecycle: worker polls due schedules, executes mandate debit pull against simulated bank adapter, triggers asymmetric EMA limit update on success or FROZEN state transition on failure" />
    </td>
  </tr>
  <tr>
    <td align="center" width="50%">
      <strong>Authority State Machine — NORMAL → FROZEN</strong><br/><br/>
      <img src="assets/architecture-authority-state.png" width="100%" alt="Authority state machine: NORMAL to RESTRICTED on anomaly, RESTRICTED to FROZEN on repayment failure, FROZEN to HUMAN_REVIEW on escalation, recovery only through principal-reviewed evidence" />
    </td>
    <td align="center" width="50%">
      <strong>Evidence Model — Entity-Relationship Diagram</strong><br/><br/>
      <img src="assets/architecture-er.png" width="100%" alt="Entity relationship model: Principal owns Agent, Agent signs Mandate, Mandate assigns CreditAccount, CreditAccount initiates DrawRequest, DrawRequest reserves via DrawReservation, settled by RepaymentSchedule, all events append to SHA-256 AuditEvent chain" />
    </td>
  </tr>
</table>

### Core Architecture Principles Table

| Architectural Dimension | Mechanism & Implementation | Security & Reliability Guarantee |
|:---|:---|:---|
| **Cryptographic Identity** | Ed25519-signed Capability Mandates issued by accountable principals | Principal binding; prevents unauthorized agent impersonation |
| **Multi-Factor Underwriting** | Analytic Hierarchy Process (AHP) 4-factor pairwise comparison matrix | Mathematical consistency ($CR = 0.0341 \le 0.10$) |
| **Limit Dynamics & EMA** | Bounded floor/ceiling interpolation with asymmetric trust score EMA | $\alpha_{\text{up}}=0.15, \alpha_{\text{down}}=0.65$; rapid penalty on default |
| **Spend Isolation Gateway** | 15-step Transaction Gateway with PostgreSQL `SELECT FOR UPDATE` | Pessimistic row locking; prevents race conditions & double-spends |
| **Automated Repayment** | Scheduled mandate debit pulls with bank adapter integration | Zero-latency state transition to `FROZEN` on debit failure |
| **Tamper-Evident Audit** | Append-only SHA-256 hash-chained event ledger | Cryptographic immutability ($Hash_N = \text{SHA256}(\dots)$) |

---

## Risk Methodology & Underwriting Math

TrustLine's risk decision engine implements mathematical formulations to compute credit limits and verify stability:

### 1. Analytic Hierarchy Process (AHP) Pairwise Consistency Ratio
$$CR = \frac{CI}{RI} \le 0.10 \quad \text{where} \quad CI = \frac{\lambda_{\max} - n}{n - 1}$$
For our 4-factor matrix, $n = 4, RI = 0.90$, yielding a verified consistency ratio of $CR = 0.0341$.

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

### Animated Proof

#### Atlas completes the full credit cycle

<div align="center">
  <a href="docs/screenshots/demo-desktop.png">
    <img src="docs/demos/trustline-success-cycle.gif" width="1100" alt="Desktop recording of Atlas Procurement Bot passing deterministic gateway checks, reserving and settling an authorized purchase, repaying successfully, and receiving a gradual credit-limit increase" />
  </a>
</div>

**Judge takeaway:** Atlas passes the deterministic gateway, receives vendor settlement, repays through the simulated mandate pull, and earns trust gradually. [Open the static Demo Lab view](docs/screenshots/demo-desktop.png).

#### The gateway contains failures outside the bot's control

<div align="center">
  <a href="docs/screenshots/demo-desktop.png">
    <img src="docs/demos/trustline-enforcement-proof.gif" width="1100" alt="Desktop recording of Scout Research Bot receiving a real over-limit rejection without exposure, followed by Vector Arbitrage Bot failing repayment and entering the frozen authority state" />
  </a>
</div>

**Judge takeaway:** Scout receives a real `402` without creating exposure; Vector's failed repayment freezes its authority and leaves the result available for inspection. [Open the static enforcement view](docs/screenshots/demo-desktop.png).

#### Analytics projects policy without mutating evidence

<div align="center">
  <a href="docs/screenshots/analytics-desktop.png">
    <img src="docs/demos/trustline-analytics-simulator.gif" width="1100" alt="Desktop recording of TrustLine analytics charts and a deterministic what-if simulation rejecting a denied merchant category while confirming that the database was not mutated" />
  </a>
</div>

**Judge takeaway:** The simulator exposes every deterministic gateway check, rejects a denied category, and confirms that the projection did not mutate the database. [Open the static Analytics view](docs/screenshots/analytics-desktop.png).

The animated recordings are desktop captures at 1440×900 for readable evidence. Tablet and mobile behavior is documented with the static route gallery below.

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

### Portfolio Analytics & What-If Simulator
| Desktop | Tablet | Mobile |
|:---|:---|:---|
| ![Portfolio analytics desktop with risk, exposure, merchant category, repayment, and authority evidence](docs/screenshots/analytics-desktop.png) | ![Portfolio analytics tablet with responsive evidence charts](docs/screenshots/analytics-tablet.png) | ![Portfolio analytics mobile with stacked evidence charts and simulator](docs/screenshots/analytics-mobile.png) |

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
│   ├── threat-model.md       # Security Matrix & Threat Mitigations
│   ├── next-plan.md          # Roadmap & Next Plan of Action
│   ├── release-handoff.md    # Submission Packaging & Deployment Checklist
│   └── screenshots/          # Responsive Product Screenshots
├── scripts/                  # Automated Test & Verification Tools
│   ├── seed_demo.py          # Deterministic Demo Database Seeder
│   ├── demo_smoke.py         # End-to-End Smoke Test Suite
│   ├── demo_concurrency.py   # Parallel Thread Race Condition Proof
│   └── demo_reset.py         # Demo State Reset & Database Reseed
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
| **Release Handoff** | [release-handoff.md](docs/release-handoff.md) | Submission packaging, deployment, and handoff checklist |

---

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
