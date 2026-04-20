# SENTINEL — High-Level Design (HLD)

_Version:_ 1.1  
_Date:_ 2026-04-19  
_Status:_ Accepted  
_Related ADRs:_ [0001](../adr/0001-nestjs-monolith.md), [0002](../adr/0002-ddd-clean-architecture.md), [0003](../adr/0003-postgresql-persistence.md), [0004](../adr/0004-rabbitmq-event-bus.md), [0005](../adr/0005-fca-webhook-integration.md), [0006](../adr/0006-immutable-audit-trail.md), [0007](../adr/0007-rules-engine-versioning.md), [0008](../adr/0008-client-side-rules-polling.md)  
_Changelog:_ v1.1 — replaced WebSocket `rules.updated` push with hourly client-side polling (ADR-0008); updated offline sync flow to include `client_rules_version` and `RULE_VERSION_MISMATCH` audit action

---

## 1. System Overview

SENTINEL is a client onboarding risk assessment system for Halcyon Capital Partners. It enables Relationship Managers (RMs) to log client assessments, automatically computes FCA-compliant risk tiers, manages KYC lifecycle, and maintains an immutable audit trail satisfying MLR 2017 and SYSC requirements.

### 1.1 Business Goals

| Goal            | Measure                                                      |
| --------------- | ------------------------------------------------------------ |
| RM efficiency   | Onboarding assessment < 90 seconds at point of intake        |
| Data integrity  | Zero mismatch between recorded data and risk classification  |
| Risk accuracy   | Real-time classification against regulatory criteria         |
| Audit readiness | Timestamped, attributable records for quarterly file reviews |

### 1.2 Key Personas

| Persona                   | System Interaction                                     |
| ------------------------- | ------------------------------------------------------ |
| Relationship Manager (RM) | Submit new onboarding records, review existing records |
| Compliance Officer        | Update KYC status, resolve EDD cases, approve/reject   |
| Internal Auditor          | Read-only access to all records and audit log          |
| System (automated)        | FCA webhook ingestion, bulk re-classification scans    |

---

## 2. Architecture Style

**Modular Monolith** — a single NestJS deployable structured internally using DDD bounded contexts and Clean Architecture (Ports & Adapters). Module boundaries are designed as future microservice extraction points.

### 2.1 System Context Diagram (C4 Level 1)

```
┌─────────────┐         ┌─────────────────┐         ┌──────────────┐
│   Browser    │         │   FCA Webhook    │         │  RabbitMQ    │
│  (SPA/PWA)  │         │   Service        │         │  Broker      │
└──────┬───────┘         └────────┬─────────┘         └──────┬───────┘
       │ HTTPS                    │ HTTPS (HMAC)             │ AMQP
       ▼                          ▼                          ▼
┌──────────────────────────────────────────────────────────────────────┐
│                     SENTINEL NestJS Monolith                        │
│                                                                      │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌──────────────────┐  │
│  │ Onboarding │ │    Risk    │ │    KYC     │ │      Audit       │  │
│  │  Context   │ │Classification│ │ Management │ │     Context      │  │
│  └────────────┘ └────────────┘ └────────────┘ └──────────────────┘  │
│  ┌────────────┐ ┌────────────┐                                      │
│  │   Rules    │ │   Sync     │                                      │
│  │   Admin    │ │  Module    │                                      │
│  └────────────┘ └────────────┘                                      │
│                                                                      │
│                        ┌─────────────┐                               │
│                        │  RMQ Worker  │                              │
│                        │  (in-process)│                              │
│                        └─────────────┘                               │
└──────────────────────────────┬───────────────────────────────────────┘
                               │
                               ▼
                     ┌──────────────────┐
                     │   PostgreSQL     │
                     │   (Primary DB)   │
                     └──────────────────┘
```

### 2.2 Container Diagram (C4 Level 2)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            SENTINEL Platform                                │
│                                                                             │
│  ┌──────────────────────────────────────────┐  ┌──────────────────────┐    │
│  │        NestJS Application Server         │  │     RabbitMQ         │    │
│  │                                          │  │                      │    │
│  │  ┌──────────────────────────────────┐    │  │  sentinel.events     │    │
│  │  │         HTTP Layer               │    │  │  ├─ fca.rules.updated│    │
│  │  │  REST API + FCA Webhook          │    │  │  └─ rescan.completed │    │
│  │  └──────────────────────────────────┘    │  │                      │    │
│  │  ┌──────────────────────────────────┐    │  │  sentinel.dlx        │    │
│  │  │      Application Layer           │    │  │  └─ dead-letter      │    │
│  │  │  Use Cases / Command Handlers    │    │  └──────────────────────┘    │
│  │  └──────────────────────────────────┘    │                              │
│  │  ┌──────────────────────────────────┐    │  ┌──────────────────────┐    │
│  │  │        Domain Layer              │    │  │    PostgreSQL        │    │
│  │  │  Entities, Rules Engine,         │    │  │                      │    │
│  │  │  Domain Events                   │    │  │  onboarding_records  │    │
│  │  └──────────────────────────────────┘    │  │  audit_log           │    │
│  │  ┌──────────────────────────────────┐    │  │  rules_config        │    │
│  │  │     Infrastructure Layer         │    │  │  kyc_cases           │    │
│  │  │  TypeORM, RMQ, Controllers       │    │  │  pending_events      │    │
│  │  └──────────────────────────────────┘    │  │  branches            │    │
│  │  ┌──────────────────────────────────┐    │  │  users               │    │
│  │  │        RMQ Consumer              │    │  └──────────────────────┘    │
│  │  │  Rules Update Worker             │    │                              │
│  │  │  Re-classification Scanner       │    │                              │
│  │  └──────────────────────────────────┘    │                              │
│  └──────────────────────────────────────────┘                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Bounded Contexts

### 3.1 Onboarding Context

**Responsibility:** Client intake, record creation, CSV import, field validation, offline sync.

| Component                   | Type                | Description                                                           |
| --------------------------- | ------------------- | --------------------------------------------------------------------- |
| `OnboardingRecord`          | Aggregate Root      | The central entity — all 16 CSV fields + computed metadata            |
| `Client`                    | Entity              | Logical client identity (may have multiple records via corrections)   |
| `SubmitOnboardingUseCase`   | Application Service | Validates fields, calls rules engine, persists record + audit entry   |
| `ImportCsvUseCase`          | Application Service | Parses CSV, runs bulk mismatch scan (FR-09 UC-1), flags dirty records |
| `SyncOfflineRecordsUseCase` | Application Service | Idempotent batch sync from offline clients                            |

**Emits:** `OnboardingRecordSubmitted`, `CsvImportCompleted`, `MismatchDetected`

### 3.2 Risk Classification Context

**Responsibility:** Rules engine computation, mismatch detection, tier comparison.

| Component               | Type                | Description                                               |
| ----------------------- | ------------------- | --------------------------------------------------------- |
| `RuleSet`               | Aggregate Root      | Versioned snapshot of classification thresholds           |
| `ClassificationResult`  | Value Object        | `{ computed_tier, triggered_rules[], rules_version }`     |
| `RulesEngine`           | Domain Service      | Pure function: `(record, ruleSet) → ClassificationResult` |
| `ClassifyRecordUseCase` | Application Service | Orchestrates classification for a single record           |
| `BulkReclassifyUseCase` | Application Service | Re-runs rules over all records after a config update      |

**Emits:** `ClassificationComputed`, `ClassificationMismatchDetected`, `BulkReclassificationCompleted`

### 3.3 KYC Management Context

**Responsibility:** KYC status lifecycle, EDD escalation, compliance officer actions.

| Component                | Type                | Description                                                 |
| ------------------------ | ------------------- | ----------------------------------------------------------- |
| `KycCase`                | Aggregate Root      | Tracks KYC status per client record with state machine      |
| `UpdateKycStatusUseCase` | Application Service | Compliance officer updates status with audit-stamped reason |
| `EscalateToEddUseCase`   | Application Service | Auto-triggered when computed tier = HIGH                    |

**Emits:** `KycStatusUpdated`, `EddEscalationCreated`

### 3.4 Audit Context

**Responsibility:** Immutable event log, compliance reporting, audit reconstruction.

| Component                 | Type                | Description                                           |
| ------------------------- | ------------------- | ----------------------------------------------------- |
| `AuditEntry`              | Aggregate Root      | Single audit log row — action, actor, timestamp, diff |
| `RecordAuditEntryUseCase` | Application Service | Consumes domain events, writes audit log              |
| `QueryAuditTrailUseCase`  | Application Service | Filterable audit log for auditor view                 |

**Consumes:** All domain events from other contexts.

### 3.5 Rules Administration Context

**Responsibility:** FCA webhook ingestion, rule version management, manual uploads.

| Component                    | Type                | Description                                            |
| ---------------------------- | ------------------- | ------------------------------------------------------ |
| `RulesConfig`                | Aggregate Root      | Versioned rule set with validity window                |
| `ProcessFcaWebhookUseCase`   | Application Service | Validates HMAC, writes to outbox, acknowledges webhook |
| `UploadRulesManuallyUseCase` | Application Service | Fallback for manual rule updates                       |

**Emits:** `RulesConfigUpdated`

---

## 4. API Surface

### 4.1 REST Endpoints

| Method  | Path                        | Context     | Actor           | Description                                                                                              |
| ------- | --------------------------- | ----------- | --------------- | -------------------------------------------------------------------------------------------------------- |
| `POST`  | `/api/onboarding`           | Onboarding  | RM              | Submit a new onboarding record                                                                           |
| `GET`   | `/api/clients`              | Onboarding  | RM, CO, Auditor | List clients (filterable by branch, risk, KYC, RM)                                                       |
| `GET`   | `/api/clients/:id`          | Onboarding  | RM, CO, Auditor | Record detail + correction chain                                                                         |
| `POST`  | `/api/clients/:id/review`   | Onboarding  | RM              | Submit correction (creates new record, not overwrite)                                                    |
| `POST`  | `/api/import/csv`           | Onboarding  | System          | Bulk CSV import + mismatch scan                                                                          |
| `PATCH` | `/api/kyc/:recordId/status` | KYC         | CO              | Update KYC status with reason                                                                            |
| `GET`   | `/api/audit`                | Audit       | Auditor         | Full audit log (filterable by date, branch, actor)                                                       |
| `GET`   | `/api/audit/:recordId`      | Audit       | Auditor         | Audit trail for a specific record                                                                        |
| `GET`   | `/api/rules/version`        | Rules Admin | Any             | Lightweight version check — returns `{ version, valid_from }` only; supports `ETag` / `304 Not Modified` |
| `GET`   | `/api/rules/current`        | Rules Admin | Any             | Full active rule set payload (fetched only when version differs from cached)                             |
| `GET`   | `/api/rules/versions`       | Rules Admin | CO, Auditor     | All historical rule versions                                                                             |
| `POST`  | `/api/rules/upload`         | Rules Admin | CO              | Manual rule set upload                                                                                   |
| `POST`  | `/api/fca/webhook`          | Rules Admin | FCA (external)  | FCA regulatory update webhook                                                                            |
| `POST`  | `/api/sync/batch`           | Onboarding  | RM (offline)    | Idempotent batch sync of offline records                                                                 |

### 4.2 WebSocket Gateway (Optional — Production)

Rule set updates are **not** distributed via WebSocket push — see [ADR-0008](../adr/0008-client-side-rules-polling.md). The gateway is retained only for compliance-dashboard notifications.

| Event             | Direction       | Description                                            |
| ----------------- | --------------- | ------------------------------------------------------ |
| `edd.escalation`  | Server → Client | Real-time EDD escalation alert to compliance dashboard |
| `rescan.progress` | Server → Client | Bulk re-classification scan progress                   |

---

## 5. Data Flow Diagrams

### 5.1 New Onboarding Record (Happy Path)

```
RM (Browser)
  │
  │  POST /api/onboarding { ...16 fields }
  ▼
OnboardingController (Infrastructure)
  │
  │  validate DTO
  ▼
SubmitOnboardingUseCase (Application)
  │
  ├── 1. Validate required fields → reject if missing
  ├── 2. Load active RuleSet from RulesConfigRepository
  ├── 3. Call RulesEngine.classify(record, ruleSet) → ClassificationResult
  ├── 4. If computed_tier = HIGH → set kyc_status = EDD
  ├── 5. Create OnboardingRecord entity with computed_tier + rules_version
  ├── 6. BEGIN TRANSACTION
  │     ├── Insert onboarding_records row
  │     ├── Insert audit_log row (action: SUBMIT)
  │     └── COMMIT
  └── 7. Emit OnboardingRecordSubmitted domain event
  │
  ▼
Response: 201 Created { record_id, computed_tier, kyc_status }
```

### 5.2 FCA Webhook → Rules Update → Re-classification

```
FCA Service
  │
  │  POST /api/fca/webhook { event_id, payload, timestamp }
  │  Header: X-FCA-Signature: hmac-sha256(body, secret)
  ▼
FcaWebhookController (Infrastructure)
  │
  ├── 1. Verify HMAC-SHA256 signature → 401 if invalid
  ├── 2. Check event_id for idempotency → 200 if duplicate
  ├── 3. BEGIN TRANSACTION
  │     └── Insert into pending_events table
  │     └── COMMIT
  └── 4. Return 202 Accepted
  │
  ▼
Outbox Poller (Infrastructure)
  │
  ├── 1. Read undelivered rows from pending_events
  ├── 2. Publish to RMQ: sentinel.events / fca.rules.updated
  └── 3. Mark as delivered
  │
  ▼
RulesUpdateWorker (RMQ Consumer)
  │
  ├── 1. Parse and validate new rule set payload (JSON Schema)
  ├── 2. BEGIN TRANSACTION
  │     ├── Set valid_to on current active rules_config
  │     ├── Insert new rules_config row (valid_from = NOW())
  │     ├── Insert audit_log (action: RULE_CHANGE, actor: SYSTEM)
  │     └── COMMIT
  ├── 3. Invalidate in-memory rules cache
  ├── 4. Trigger BulkReclassifyUseCase
  │     │
  │     ├── For each onboarding_record:
  │     │     ├── Re-classify with new rules
  │     │     ├── Compare computed vs stored tier
  │     │     ├── If mismatch:
  │     │     │     ├── Insert audit_log (action: RULE_CHANGE_RESCAN)
  │     │     │     └── If now HIGH (was LOW/MEDIUM):
  │     │     │           ├── Insert audit_log (action: EDD_ESCALATE)
  │     │     │           └── Emit EddEscalationRequired event
  │     │     └── If no change: skip
  │     │
  │     └── Emit BulkReclassificationCompleted
  │
  └── ACK message
```

### 5.3 Client-Side Rules Cache Polling (Every 1 Hour)

```
Browser (online or offline)
  │
  │  setInterval — every 60 minutes (RULES_POLL_INTERVAL_MS)
  │  Also fires on: app start, connectivity restored
  │
  │  ── if online ──
  │
  │  GET /api/rules/version
  │  Header: If-None-Match: <cached_version>
  ▼
RulesAdminController
  │
  ├── If version unchanged → 304 Not Modified (no payload)
  └── If version changed   → 200 { version, valid_from }
  │
  ▼
Browser — version differs from IndexedDB cache?
  │
  ├── Yes → GET /api/rules/current → write to IndexedDB
  │           { version, payload, cached_at: NOW() }
  │           → Re-run classification on any pending offline records
  │             (update their computed_tier with the new rules)
  │
  └── No  → keep existing cache, update poll timer

  ── if offline ──
  │
  ├── Poll fails silently — use cached version
  └── If cached_at > 1 hour ago → render stale-cache warning banner:
      "Classification rules were last updated X hours ago.
       Connect to the network to check for regulatory updates."
```

### 5.4 Offline Sync Flow (With Rules-Version Check)

```
RM Device (Offline)
  │
  │  Records queued in IndexedDB with:
  │  { uuid, ...fields, client_rules_version, client_computed_tier }
  │  Status: "pending sync"
  │
  │  ── connectivity restored ──
  │
  │  POST /api/sync/batch [{ uuid, client_rules_version, ...fields }, ...]
  ▼
SyncController (Infrastructure)
  │
  ├── For each record:
  │     ├── Check UUID for idempotency (dedup)
  │     ├── Run SubmitOnboardingUseCase (server re-classifies with current rules)
  │     ├── If client_rules_version ≠ active server version:
  │     │     ├── Compare client_computed_tier vs server_computed_tier
  │     │     ├── If different → create audit entry (action: RULE_VERSION_MISMATCH)
  │     │     └── Flag in response so client can surface a review prompt
  │     └── Collect result (success/failure/mismatch)
  │
  └── Return 200 { results: [{ uuid, status, server_computed_tier, rules_mismatch?, error? }] }
  │
  ▼
RM Device
  ├── Clears successfully synced records from IndexedDB
  └── For records with rules_mismatch: prompt RM to review server-computed tier
```

---

## 6. Cross-Cutting Concerns

### 6.1 Authentication & Authorization (Production)

| Layer          | Mechanism                                            |
| -------------- | ---------------------------------------------------- |
| Authentication | JWT Bearer tokens (issued by corporate IdP / OAuth2) |
| Authorization  | NestJS Guards + `@Roles()` decorator                 |
| Database       | PostgreSQL Row-Level Security (RLS) per branch       |

| Role                 | Permissions                                                                                     |
| -------------------- | ----------------------------------------------------------------------------------------------- |
| `RM`                 | `POST /onboarding`, `POST /sync/batch`, `GET /clients` (own branch), `POST /clients/:id/review` |
| `COMPLIANCE_OFFICER` | All RM permissions + `PATCH /kyc/:id/status`, `POST /rules/upload`, `GET /audit`                |
| `AUDITOR`            | `GET *` — read-only access to all records, audit logs, and rule versions                        |

### 6.2 Error Handling Strategy

| Error Type                          | HTTP Status | Handling                                                 |
| ----------------------------------- | ----------- | -------------------------------------------------------- |
| Validation failure (missing fields) | 400         | Return field-level errors; never persist partial records |
| Unauthorized                        | 401         | Invalid/missing JWT or webhook HMAC                      |
| Forbidden                           | 403         | Role does not permit action                              |
| Conflict (duplicate UUID)           | 409         | Idempotency — return existing record                     |
| Internal error                      | 500         | Log, do not expose internals, return correlation ID      |

### 6.3 Observability

| Concern            | Tool                                   | Purpose                                                     |
| ------------------ | -------------------------------------- | ----------------------------------------------------------- |
| Structured logging | Pino (NestJS built-in)                 | JSON logs with correlation IDs                              |
| Metrics            | Prometheus + Grafana                   | API latency, RMQ queue depth, re-scan duration              |
| Health checks      | `/health`, `/health/db`, `/health/rmq` | Liveness and readiness probes                               |
| Alerting           | Grafana Alerts                         | Webhook signature failures, DLQ depth > 0, re-scan failures |

### 6.4 Security (OWASP Top 10)

| Risk                            | Mitigation                                                       |
| ------------------------------- | ---------------------------------------------------------------- |
| A01 — Broken Access Control     | RBAC guards on every route; RLS at DB level                      |
| A02 — Cryptographic Failures    | HMAC-SHA256 for webhook; TLS in transit; encryption at rest (PG) |
| A03 — Injection                 | TypeORM parameterized queries; DTO validation (class-validator)  |
| A04 — Insecure Design           | Append-only tables; DB triggers prevent mutation                 |
| A05 — Security Misconfiguration | Secrets in env vars; Helmet middleware; CORS restricted          |
| A07 — Auth Failures             | Rate limiting on webhook endpoint; JWT expiry enforcement        |
| A08 — Data Integrity Failures   | JSON Schema validation on rules payload; record hashing          |
| A09 — Logging Failures          | All security events logged (signature failures, auth denials)    |

---

## 7. Infrastructure Topology (POC)

```
┌───────────────────────────────────────────────────────────────┐
│                     Docker Compose (Local Dev)                │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐    │
│  │   NestJS     │  │  PostgreSQL  │  │    RabbitMQ       │    │
│  │   App        │  │  :5432       │  │    :5672 / :15672 │    │
│  │   :3000      │  │              │  │    (Management UI)│    │
│  └──────────────┘  └──────────────┘  └──────────────────┘    │
│                                                               │
│  ┌──────────────┐                                             │
│  │  pgAdmin     │                                             │
│  │  :5050       │                                             │
│  └──────────────┘                                             │
└───────────────────────────────────────────────────────────────┘
```

### 7.1 Production Topology (Target)

```
┌──────────────────────────────────────────────────────────────────────────┐
│                          Cloud (AWS / Azure)                             │
│                                                                          │
│  ┌────────────────┐     ┌────────────────────────────────────────┐      │
│  │  Load Balancer │────▶│  NestJS Instances (2+ replicas)        │      │
│  │  (ALB / APIM)  │     │  - API Server                         │      │
│  └────────────────┘     │  - RMQ Consumer (can be separate pod)  │      │
│                          └─────────────┬────────────────────────┘      │
│                                        │                                │
│              ┌─────────────────────────┼─────────────────────┐         │
│              ▼                         ▼                     ▼         │
│  ┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐   │
│  │  PostgreSQL      │   │   RabbitMQ       │   │   Redis          │   │
│  │  (RDS / Azure DB)│   │  (AmazonMQ /     │   │  (ElastiCache)   │   │
│  │  Multi-AZ        │   │   CloudAMQP)     │   │  Rules cache     │   │
│  └──────────────────┘   └──────────────────┘   └──────────────────┘   │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 8. Technology Stack Summary

| Layer             | Technology                              | Justification                                 |
| ----------------- | --------------------------------------- | --------------------------------------------- |
| Runtime           | Node.js 20 LTS                          | Non-blocking I/O, strong ecosystem            |
| Framework         | NestJS 10+                              | Modular, DI-first, first-class RMQ/WS support |
| Language          | TypeScript 5+                           | Type safety across domain, DTOs, and infra    |
| ORM               | TypeORM                                 | NestJS integration, migrations, query builder |
| Database          | PostgreSQL 16                           | JSONB, partitioning, RLS, ACID                |
| Message Broker    | RabbitMQ 3.13+                          | Durable messaging, DLQ, topic exchanges       |
| Validation        | class-validator + class-transformer     | DTO validation at API boundary                |
| Caching           | In-memory (POC) → Redis (prod)          | Active rules config cache                     |
| API Documentation | Swagger / OpenAPI (via @nestjs/swagger) | Auto-generated from decorators                |
| Testing           | Jest + Supertest                        | Unit (domain), integration (API), e2e         |
| Containerization  | Docker + Docker Compose                 | Local dev parity with production              |

---

## 9. Scaling Strategy (4 → 15 Branches)

| Concern                  | Current (4 branches)           | Target (15 branches)                                                    |
| ------------------------ | ------------------------------ | ----------------------------------------------------------------------- |
| Compute                  | Single monolith instance       | 2+ replicas behind LB; RMQ worker as separate pod                       |
| Database                 | Single PG instance             | PG with table partitioning by `branch`; read replicas for audit queries |
| Caching                  | In-memory singleton            | Redis cluster shared across instances                                   |
| Rules cache invalidation | In-process event               | Redis pub/sub or RMQ fanout to all instances                            |
| Branch isolation         | Query-level `WHERE branch = ?` | RLS policies per branch; branch-scoped JWT claims                       |
| RMQ                      | Single instance                | Clustered RMQ with mirrored queues                                      |
| Offline sync             | Single sync endpoint           | Per-branch sync queues with conflict resolution                         |

---

## 10. Key Design Decisions Index

| #   | Decision                                  | ADR                                                  |
| --- | ----------------------------------------- | ---------------------------------------------------- |
| 1   | NestJS modular monolith for POC           | [ADR-0001](../adr/0001-nestjs-monolith.md)           |
| 2   | DDD bounded contexts + Clean Architecture | [ADR-0002](../adr/0002-ddd-clean-architecture.md)    |
| 3   | PostgreSQL with append-only tables        | [ADR-0003](../adr/0003-postgresql-persistence.md)    |
| 4   | RabbitMQ with transactional outbox        | [ADR-0004](../adr/0004-rabbitmq-event-bus.md)        |
| 5   | HMAC-secured FCA webhook                  | [ADR-0005](../adr/0005-fca-webhook-integration.md)   |
| 6   | Immutable audit trail with DB triggers    | [ADR-0006](../adr/0006-immutable-audit-trail.md)     |
| 7   | Versioned rules engine configuration      | [ADR-0007](../adr/0007-rules-engine-versioning.md)   |
| 8   | Client-side rules polling over push       | [ADR-0008](../adr/0008-client-side-rules-polling.md) |
