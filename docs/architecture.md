# TrustLine Architecture Documentation

## System Component Diagram

```mermaid
graph TD
    subgraph Principal Boundary
        P["Principal / Enterprise"] -->|Registers & Configures| MANIFEST["Capability Manifest"]
        P -->|Signs with Ed25519| MANDATE["Signed Mandate"]
    end

    subgraph Agent Environment
        A["Autonomous AI Agent"] -->|Presents API Credential & Idempotency Key| GATEWAY["Programmable Transaction Gateway"]
    end

    subgraph TrustLine Core Engine
        MANDATE -->|Verified on every draw| GATEWAY
        MANIFEST -->|Policy Check| GATEWAY
        
        GATEWAY -->|1. Row Lock select_for_update| DB[("PostgreSQL Database")]
        GATEWAY -->|2. Check Limits & Exposure| CE["Credit Decision Engine"]
        
        RE["Risk Engine"] -->|Calculates AHP Score| CE
        TR["Task Receipt Verification"] -->|Updates Task Reliability| RE
        
        CE -->|Computes Target & EMA Limit| DB
        GATEWAY -->|3. Reserves Balance| RES["Draw Reservation"]
        
        RES -->|Settles| REPAY["Repayment Scheduler"]
        REPAY -->|Executes Mandate Pull| BANK["Simulated Bank Adapter"]
        
        BANK -->|Success / Failure| SM["Authority State Machine"]
        SM -->|NORMAL / RESTRICTED / FROZEN| DB
        
        GATEWAY -->|Log Event| AUDIT["SHA-256 Hash-Chained Audit Log"]
    end
```

---

## Draw Lifecycle Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    actor Agent as Autonomous AI Agent
    participant GW as Transaction Gateway
    participant DB as PostgreSQL DB (select_for_update)
    participant Mandate as Mandate Validator
    participant Risk as Risk & Credit Engine
    participant Audit as Audit Log Service

    Agent->>GW: POST /api/v1/draws (Amount, Merchant, Idempotency-Key)
    GW->>DB: Begin DB Transaction & Lock Agent + Principal Rows
    GW->>DB: Check Idempotency-Key
    alt Duplicate Request
        GW-->>Agent: Return Cached Reservation Response
    end
    
    GW->>Mandate: Verify Ed25519 Signature, Expiry, Version & Binding
    alt Invalid Mandate / Expired / Revoked
        GW->>Audit: Log Violation Event
        GW-->>Agent: 403 Forbidden (MANDATE_INVALID)
    end

    GW->>GW: Check Capability Manifest (Merchant Category, Daily/Single Cap)
    GW->>Risk: Check Current Credit Limit & Principal Cold-Start Floor
    
    alt Requested Amount > Available Credit Limit
        GW->>Audit: Log Exceeded Limit Event
        GW-->>Agent: 402 Payment Required (CREDIT_LIMIT_EXCEEDED)
    end

    GW->>DB: Create DrawReservation (Status: RESERVED) & Update Balance
    GW->>Audit: Append Event Hash (prev_hash -> current_hash)
    GW->>DB: Commit Transaction
    GW-->>Agent: 201 Created (Draw ID, Reservation Reference)
```

---

## Repayment Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    participant Worker as Repayment Worker
    participant DB as PostgreSQL Database
    participant Bank as Simulated Bank Adapter
    participant State as Authority State Machine
    participant Risk as Risk Engine
    participant Audit as Hash-Chained Audit Log

    Worker->>DB: Poll Due RepaymentSchedules
    loop For each due repayment
        Worker->>Bank: Execute Mandate Debit (AccountRef, Amount)
        alt Debit Success (SUFFICIENT_FUNDS)
            Bank-->>Worker: Payment Settled (Transaction ID)
            Worker->>DB: Update Schedule (SETTLED) & Reduce Outstanding Balance
            Worker->>Risk: Record Repayment Success -> Recalculate Risk & EMA Limit
            Worker->>Audit: Log REPAYMENT_SUCCESS
        else Debit Failure (INSUFFICIENT_FUNDS / BLOCKED)
            Bank-->>Worker: Payment Failed (Reason Code)
            Worker->>DB: Update Schedule (FAILED)
            Worker->>State: Trigger State Transition -> FROZEN
            State->>DB: Set Agent State = FROZEN (Block all future draws)
            Worker->>DB: Create Escalation Record for Principal
            Worker->>Risk: Record Repayment Failure -> Drop Target Limit
            Worker->>Audit: Log REPAYMENT_FAILURE & STATE_FROZEN
        end
    end
```

---

## Authority State Machine Diagram

```mermaid
stateDiagram-v2
    [*] --> NORMAL: Agent Mandate Activated & Cold-Start Limit Granted
    
    NORMAL --> RESTRICTED: Spending Anomaly / High Velocity / Policy Near-Miss
    RESTRICTED --> NORMAL: Spending Regularity Normalized / Principal Clear
    
    NORMAL --> FROZEN: Repayment Failure / Mandate Revoked / Account Swapped / Security Alert
    RESTRICTED --> FROZEN: Repayment Failure / Mandate Revoked / Anomaly Escalate
    
    FROZEN --> HUMAN_REVIEW: Escalation Filed / Principal Dispute / Evidence Submitted
    HUMAN_REVIEW --> NORMAL: Principal & Admin Override Approval (Reason Recorded)
    HUMAN_REVIEW --> FROZEN: Review Rejected / Mandate Terminated
```

---

## Entity-Relationship (ER) Diagram

```mermaid
erDiagram
    PRINCIPAL ||--o{ AGENT : "owns & authorizes"
    PRINCIPAL ||--o{ LINKED_ACCOUNT : "manages"
    PRINCIPAL ||--o{ MANDATE : "issues & signs"
    
    AGENT ||--o{ CAPABILITY_MANIFEST : "bound to"
    AGENT ||--o{ MANDATE : "granted"
    AGENT ||--one CREDIT_ACCOUNT : "assigned"
    AGENT ||--o{ TASK_RECEIPT : "earns"
    
    CREDIT_ACCOUNT ||--o{ DRAW_REQUEST : "initiates"
    DRAW_REQUEST ||--one DRAW_RESERVATION : "reserves"
    DRAW_RESERVATION ||--one REPAYMENT_SCHEDULE : "generates"
    
    REPAYMENT_SCHEDULE ||--o{ REPAYMENT_ATTEMPT : "executes"
    AGENT ||--o{ AUTHORITY_STATE_TRANSITION : "undergoes"
    AGENT ||--o{ ESCALATION : "triggers"
    
    PRINCIPAL {
        uuid id PK
        string name
        string email
        string provider_subject_id
        timestamp verified_at
    }
    
    AGENT {
        uuid id PK
        uuid principal_id FK
        string display_name
        string api_key_hash
        string status
        uuid current_mandate_id FK
    }

    MANDATE {
        uuid id PK
        uuid principal_id FK
        uuid agent_id FK
        string ed25519_signature
        decimal authorized_ceiling
        timestamp expires_at
        integer version
    }

    CREDIT_ACCOUNT {
        uuid id PK
        uuid agent_id FK
        decimal current_credit_limit
        decimal target_credit_limit
        decimal cold_start_floor
        decimal principal_authorized_ceiling
        decimal reserved_amount
        decimal outstanding_principal
    }

    DRAW_REQUEST {
        uuid id PK
        uuid credit_account_id FK
        decimal amount
        string merchant_category
        string idempotency_key
        string status
    }

    AUDIT_EVENT {
        bigint sequence PK
        uuid event_id
        string event_type
        string payload_hash
        string previous_hash
        string current_hash
        timestamp created_at
    }
```
