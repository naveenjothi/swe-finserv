# SENTINEL — Low-Level Design (LLD)

_Version:_ 1.1  
_Date:_ 2026-04-19  
_Status:_ Accepted  
_Parent:_ [HLD](./hld.md)

### Changelog

| Version | Date       | Change                                                                                                                                                                                                                         |
| ------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1.1     | 2026-04-19 | Added §5.5 rules version endpoint, §5.6 client-side rules cache (ADR-0008); `client_rules_version` + `client_computed_tier` in sync DTO; `RULE_VERSION_MISMATCH` audit action; `get-rules-version` query files in project tree |
| 1.0     | 2026-04-19 | Initial LLD                                                                                                                                                                                                                    |

---

## 1. Project Structure (DDD + Clean Architecture)

```
sentinel-api/
├── docker-compose.yml
├── .env.example
├── nest-cli.json
├── tsconfig.json
├── package.json
│
├── src/
│   ├── main.ts                          # Bootstrap, global pipes, Swagger
│   ├── app.module.ts                    # Root module — imports all bounded contexts
│   │
│   ├── shared/                          # Cross-cutting kernel
│   │   ├── domain/
│   │   │   ├── base.entity.ts           # Abstract base: id (UUID), createdAt
│   │   │   ├── aggregate-root.ts        # Base aggregate with domain event collection
│   │   │   ├── value-object.ts          # Abstract value object with equality
│   │   │   ├── domain-event.ts          # Base domain event interface
│   │   │   └── repository.port.ts       # Generic IRepository<T> interface
│   │   ├── application/
│   │   │   ├── use-case.ts              # IUseCase<TInput, TOutput> interface
│   │   │   └── pagination.dto.ts        # Shared pagination DTO
│   │   ├── infrastructure/
│   │   │   ├── filters/
│   │   │   │   └── global-exception.filter.ts
│   │   │   ├── guards/
│   │   │   │   ├── roles.guard.ts
│   │   │   │   └── roles.decorator.ts
│   │   │   ├── interceptors/
│   │   │   │   └── audit.interceptor.ts  # Auto-emit audit events on mutations
│   │   │   └── outbox/
│   │   │       ├── outbox.entity.ts
│   │   │       ├── outbox.service.ts
│   │   │       └── outbox-poller.service.ts
│   │   └── constants/
│   │       └── roles.enum.ts            # RM, COMPLIANCE_OFFICER, AUDITOR
│   │
│   ├── onboarding/                      # ── Bounded Context: Onboarding ──
│   │   ├── onboarding.module.ts
│   │   ├── domain/
│   │   │   ├── entities/
│   │   │   │   └── onboarding-record.entity.ts
│   │   │   ├── value-objects/
│   │   │   │   ├── client-id.vo.ts
│   │   │   │   ├── branch.vo.ts
│   │   │   │   ├── client-type.vo.ts     # INDIVIDUAL | ENTITY
│   │   │   │   ├── source-of-funds.vo.ts
│   │   │   │   └── record-type.vo.ts     # INITIAL | CORRECTION | REVIEW
│   │   │   ├── events/
│   │   │   │   ├── onboarding-record-submitted.event.ts
│   │   │   │   ├── csv-import-completed.event.ts
│   │   │   │   └── mismatch-detected.event.ts
│   │   │   └── ports/
│   │   │       └── onboarding-record.repository.port.ts
│   │   ├── application/
│   │   │   ├── commands/
│   │   │   │   ├── submit-onboarding.command.ts
│   │   │   │   ├── submit-onboarding.handler.ts
│   │   │   │   ├── import-csv.command.ts
│   │   │   │   ├── import-csv.handler.ts
│   │   │   │   ├── submit-correction.command.ts
│   │   │   │   └── submit-correction.handler.ts
│   │   │   ├── queries/
│   │   │   │   ├── get-clients.query.ts
│   │   │   │   ├── get-clients.handler.ts
│   │   │   │   ├── get-client-detail.query.ts
│   │   │   │   └── get-client-detail.handler.ts
│   │   │   └── dto/
│   │   │       ├── create-onboarding.dto.ts
│   │   │       ├── onboarding-response.dto.ts
│   │   │       ├── client-list-filter.dto.ts
│   │   │       └── csv-import-result.dto.ts
│   │   └── infrastructure/
│   │       ├── http/
│   │       │   ├── onboarding.controller.ts
│   │       │   └── import.controller.ts
│   │       ├── persistence/
│   │       │   ├── onboarding-record.orm-entity.ts
│   │       │   ├── onboarding-record.repository.ts   # Implements port
│   │       │   └── onboarding-record.mapper.ts        # ORM ↔ Domain
│   │       └── sync/
│   │           ├── sync.controller.ts
│   │           ├── sync-batch.dto.ts              # includes client_rules_version + client_computed_tier
│   │           └── sync-batch-result.dto.ts       # includes rules_mismatch flag + server_computed_tier
│   │
│   ├── risk-classification/             # ── Bounded Context: Risk Classification ──
│   │   ├── risk-classification.module.ts
│   │   ├── domain/
│   │   │   ├── entities/
│   │   │   │   └── rule-set.entity.ts
│   │   │   ├── value-objects/
│   │   │   │   ├── classification-result.vo.ts
│   │   │   │   ├── risk-tier.vo.ts       # HIGH | MEDIUM | LOW
│   │   │   │   └── triggered-rule.vo.ts
│   │   │   ├── services/
│   │   │   │   └── rules-engine.service.ts  # Pure function — the core
│   │   │   ├── events/
│   │   │   │   ├── classification-computed.event.ts
│   │   │   │   ├── classification-mismatch-detected.event.ts
│   │   │   │   └── bulk-reclassification-completed.event.ts
│   │   │   └── ports/
│   │   │       └── rules-config.repository.port.ts
│   │   ├── application/
│   │   │   ├── commands/
│   │   │   │   ├── classify-record.command.ts
│   │   │   │   ├── classify-record.handler.ts
│   │   │   │   ├── bulk-reclassify.command.ts
│   │   │   │   └── bulk-reclassify.handler.ts
│   │   │   └── queries/
│   │   │       ├── get-active-rules.query.ts
│   │   │       ├── get-active-rules.handler.ts
│   │   │       ├── get-rules-version.query.ts       # Lightweight poll — version + valid_from only
│   │   │       └── get-rules-version.handler.ts
│   │   └── infrastructure/
│   │       ├── persistence/
│   │       │   ├── rules-config.orm-entity.ts
│   │       │   ├── rules-config.repository.ts
│   │       │   └── rules-config.mapper.ts
│   │       └── cache/
│   │           └── rules-cache.service.ts     # In-memory → Redis
│   │
│   ├── kyc/                             # ── Bounded Context: KYC Management ──
│   │   ├── kyc.module.ts
│   │   ├── domain/
│   │   │   ├── entities/
│   │   │   │   └── kyc-case.entity.ts
│   │   │   ├── value-objects/
│   │   │   │   └── kyc-status.vo.ts      # APPROVED | PENDING | REJECTED | EDD
│   │   │   ├── events/
│   │   │   │   ├── kyc-status-updated.event.ts
│   │   │   │   └── edd-escalation-created.event.ts
│   │   │   └── ports/
│   │   │       └── kyc-case.repository.port.ts
│   │   ├── application/
│   │   │   ├── commands/
│   │   │   │   ├── update-kyc-status.command.ts
│   │   │   │   ├── update-kyc-status.handler.ts
│   │   │   │   ├── escalate-to-edd.command.ts
│   │   │   │   └── escalate-to-edd.handler.ts
│   │   │   └── dto/
│   │   │       ├── update-kyc-status.dto.ts
│   │   │       └── kyc-case-response.dto.ts
│   │   └── infrastructure/
│   │       ├── http/
│   │       │   └── kyc.controller.ts
│   │       └── persistence/
│   │           ├── kyc-case.orm-entity.ts
│   │           ├── kyc-case.repository.ts
│   │           └── kyc-case.mapper.ts
│   │
│   ├── audit/                           # ── Bounded Context: Audit ──
│   │   ├── audit.module.ts
│   │   ├── domain/
│   │   │   ├── entities/
│   │   │   │   └── audit-entry.entity.ts
│   │   │   ├── value-objects/
│   │   │   │   └── audit-action.vo.ts
│   │   │   └── ports/
│   │   │       └── audit-entry.repository.port.ts
│   │   ├── application/
│   │   │   ├── commands/
│   │   │   │   ├── record-audit-entry.command.ts
│   │   │   │   └── record-audit-entry.handler.ts
│   │   │   ├── queries/
│   │   │   │   ├── query-audit-trail.query.ts
│   │   │   │   └── query-audit-trail.handler.ts
│   │   │   ├── dto/
│   │   │   │   ├── audit-entry-response.dto.ts
│   │   │   │   └── audit-filter.dto.ts
│   │   │   └── event-handlers/
│   │   │       └── domain-event-audit.handler.ts  # Consumes all domain events
│   │   └── infrastructure/
│   │       ├── http/
│   │       │   └── audit.controller.ts
│   │       └── persistence/
│   │           ├── audit-entry.orm-entity.ts
│   │           ├── audit-entry.repository.ts
│   │           └── audit-entry.mapper.ts
│   │
│   └── rules-admin/                     # ── Bounded Context: Rules Administration ──
│       ├── rules-admin.module.ts
│       ├── domain/
│       │   ├── entities/
│       │   │   └── rules-config.entity.ts
│       │   ├── value-objects/
│       │   │   └── rules-payload.vo.ts
│       │   ├── events/
│       │   │   └── rules-config-updated.event.ts
│       │   └── ports/
│       │       └── rules-config-admin.repository.port.ts
│       ├── application/
│       │   ├── commands/
│       │   │   ├── process-fca-webhook.command.ts
│       │   │   ├── process-fca-webhook.handler.ts
│       │   │   ├── upload-rules-manually.command.ts
│       │   │   └── upload-rules-manually.handler.ts
│       │   └── dto/
│       │       ├── fca-webhook-payload.dto.ts
│       │       └── upload-rules.dto.ts
│       └── infrastructure/
│           ├── http/
│           │   ├── fca-webhook.controller.ts
│           │   └── rules-admin.controller.ts   # GET /rules/version (ETag), GET /rules/current, GET /rules/versions
│           ├── messaging/
│           │   └── rules-update.consumer.ts    # RMQ consumer
│           └── guards/
│               └── hmac-signature.guard.ts     # HMAC-SHA256 verification
│
├── database/
│   ├── migrations/
│   │   ├── 001_create_onboarding_records.ts
│   │   ├── 002_create_audit_log.ts
│   │   ├── 003_create_rules_config.ts
│   │   ├── 004_create_kyc_cases.ts
│   │   ├── 005_create_pending_events.ts
│   │   ├── 006_create_branches.ts
│   │   ├── 007_create_users.ts
│   │   └── 008_add_immutability_triggers.ts
│   └── seeds/
│       ├── seed-rules-config.ts              # v1.0.0 rule set from requirements
│       ├── seed-branches.ts                  # Mayfair, Edinburgh, Manchester, Canary Wharf
│       └── seed-csv-import.ts                # Import client_onboarding.csv
│
└── test/
    ├── unit/
    │   ├── rules-engine.spec.ts              # Pure function tests — no DB, no framework
    │   ├── onboarding-record.entity.spec.ts
    │   └── classification-result.spec.ts
    ├── integration/
    │   ├── onboarding.controller.spec.ts
    │   ├── csv-import.spec.ts
    │   └── rules-update-worker.spec.ts
    └── e2e/
        ├── onboarding-flow.e2e-spec.ts
        └── fca-webhook-flow.e2e-spec.ts
```

---

## 2. Database Schema (Detailed)

### 2.1 Entity Relationship Diagram

```
┌──────────────────────────────────────────────────────────────────────┐
│                                                                      │
│  branches ◄──────────── onboarding_records ──────────► rules_config  │
│     │                        │        │                    │         │
│     │                        │        │                    │         │
│     │                   parent_id     │                    │         │
│     │                   (self-ref)    │                    │         │
│     │                        │        │                    │         │
│     │                        ▼        ▼                    │         │
│     │                    audit_log ◄───────────────────────┘         │
│     │                        ▲                                       │
│     │                        │                                       │
│     └──────── users          │                                       │
│                │             │                                       │
│                └─────────────┘                                       │
│                                                                      │
│  pending_events                kyc_cases ──────► audit_log           │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

### 2.2 Table Definitions

#### `branches`

```sql
CREATE TABLE branches (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(100) NOT NULL UNIQUE,    -- 'Mayfair', 'Edinburgh', etc.
    code            VARCHAR(10) NOT NULL UNIQUE,     -- 'MF', 'ED', 'MC', 'CW'
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### `users`

```sql
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name       VARCHAR(200) NOT NULL,
    email           VARCHAR(255) NOT NULL UNIQUE,
    role            VARCHAR(30) NOT NULL CHECK (role IN ('RM', 'COMPLIANCE_OFFICER', 'AUDITOR')),
    branch_id       UUID REFERENCES branches(id),
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### `rules_config`

```sql
CREATE TABLE rules_config (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version         VARCHAR(50) NOT NULL UNIQUE,     -- '1.0.0' or timestamp-based
    valid_from      TIMESTAMPTZ NOT NULL,
    valid_to        TIMESTAMPTZ,                     -- NULL = currently active
    payload         JSONB NOT NULL,                  -- Full rule set snapshot
    source          VARCHAR(30) NOT NULL CHECK (source IN ('SEED', 'FCA_WEBHOOK', 'MANUAL_UPLOAD')),
    created_by      VARCHAR(200) NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT one_active_version CHECK (
        valid_to IS NOT NULL OR
        id = (SELECT rc.id FROM rules_config rc WHERE rc.valid_to IS NULL ORDER BY rc.valid_from DESC LIMIT 1)
    )
);

CREATE INDEX idx_rules_config_active ON rules_config (valid_from DESC) WHERE valid_to IS NULL;
```

#### `onboarding_records` (Append-Only)

```sql
CREATE TABLE onboarding_records (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id                   UUID REFERENCES onboarding_records(id),  -- NULL for originals
    record_type                 VARCHAR(20) NOT NULL DEFAULT 'INITIAL'
                                CHECK (record_type IN ('INITIAL', 'CORRECTION', 'REVIEW', 'IMPORT')),

    -- Client fields (16 from CSV)
    client_id                   VARCHAR(20) NOT NULL,
    branch                      VARCHAR(100) NOT NULL,
    onboarding_date             DATE NOT NULL,
    client_name                 VARCHAR(300) NOT NULL,
    client_type                 VARCHAR(20) NOT NULL CHECK (client_type IN ('INDIVIDUAL', 'ENTITY')),
    country_of_tax_residence    VARCHAR(100) NOT NULL,
    annual_income               NUMERIC(15,2) NOT NULL,
    source_of_funds             VARCHAR(50) NOT NULL,
    pep_status                  BOOLEAN NOT NULL DEFAULT FALSE,
    sanctions_screening_match   BOOLEAN NOT NULL DEFAULT FALSE,
    adverse_media_flag          BOOLEAN NOT NULL DEFAULT FALSE,
    risk_classification         VARCHAR(10) NOT NULL CHECK (risk_classification IN ('LOW', 'MEDIUM', 'HIGH')),
    kyc_status                  VARCHAR(30) NOT NULL
                                CHECK (kyc_status IN ('APPROVED', 'PENDING', 'REJECTED', 'ENHANCED_DUE_DILIGENCE')),
    id_verification_date        DATE,             -- Nullable — missing = open finding
    relationship_manager        VARCHAR(200) NOT NULL,
    documentation_complete      BOOLEAN NOT NULL DEFAULT FALSE,

    -- Computed metadata
    computed_tier               VARCHAR(10) NOT NULL CHECK (computed_tier IN ('LOW', 'MEDIUM', 'HIGH')),
    rules_version               UUID NOT NULL REFERENCES rules_config(id),
    triggered_rules             JSONB NOT NULL DEFAULT '[]',  -- Array of rule identifiers
    has_mismatch                BOOLEAN NOT NULL DEFAULT FALSE,
    is_critical_mismatch        BOOLEAN NOT NULL DEFAULT FALSE,  -- stored LOW/MED but computed HIGH

    -- Sync metadata
    offline_uuid                UUID UNIQUE,       -- Client-generated UUID for idempotency
    sync_status                 VARCHAR(20) DEFAULT 'SYNCED'
                                CHECK (sync_status IN ('SYNCED', 'PENDING_SYNC')),

    -- Timestamps
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT correction_has_parent CHECK (
        (record_type = 'INITIAL' AND parent_id IS NULL) OR
        (record_type = 'IMPORT' AND parent_id IS NULL) OR
        (record_type IN ('CORRECTION', 'REVIEW') AND parent_id IS NOT NULL)
    )
);

-- Indexes
CREATE INDEX idx_onboarding_branch ON onboarding_records (branch);
CREATE INDEX idx_onboarding_client ON onboarding_records (client_id);
CREATE INDEX idx_onboarding_risk ON onboarding_records (computed_tier);
CREATE INDEX idx_onboarding_kyc ON onboarding_records (kyc_status);
CREATE INDEX idx_onboarding_rm ON onboarding_records (relationship_manager);
CREATE INDEX idx_onboarding_mismatch ON onboarding_records (has_mismatch) WHERE has_mismatch = TRUE;
CREATE INDEX idx_onboarding_offline ON onboarding_records (offline_uuid) WHERE offline_uuid IS NOT NULL;

-- Immutability triggers
CREATE OR REPLACE FUNCTION prevent_record_mutation() RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'onboarding_records is append-only. Create a CORRECTION record instead.';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_no_update_onboarding
    BEFORE UPDATE ON onboarding_records
    FOR EACH ROW EXECUTE FUNCTION prevent_record_mutation();

CREATE TRIGGER trg_no_delete_onboarding
    BEFORE DELETE ON onboarding_records
    FOR EACH ROW EXECUTE FUNCTION prevent_record_mutation();
```

#### `kyc_cases`

```sql
CREATE TABLE kyc_cases (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    record_id           UUID NOT NULL REFERENCES onboarding_records(id),
    previous_status     VARCHAR(30) NOT NULL,
    new_status          VARCHAR(30) NOT NULL
                        CHECK (new_status IN ('APPROVED', 'PENDING', 'REJECTED', 'ENHANCED_DUE_DILIGENCE')),
    reason              TEXT NOT NULL,             -- Required justification
    updated_by          VARCHAR(200) NOT NULL,     -- Compliance officer name
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_kyc_record ON kyc_cases (record_id);
```

#### `audit_log`

```sql
CREATE TABLE audit_log (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    record_id       UUID,                          -- FK to affected record (nullable for system events)
    entity_type     VARCHAR(30) NOT NULL
                    CHECK (entity_type IN ('ONBOARDING_RECORD', 'KYC_CASE', 'RULES_CONFIG', 'SYSTEM')),
    action          VARCHAR(40) NOT NULL
                    CHECK (action IN (
                        'SUBMIT', 'IMPORT', 'CORRECTION', 'REVIEW',
                        'KYC_UPDATE', 'EDD_ESCALATE',
                        'RULE_CHANGE', 'RULE_CHANGE_RESCAN', 'RULE_VERSION_MISMATCH',
                        'MISMATCH_ACKNOWLEDGED', 'SYNC_BATCH',
                        'WEBHOOK_RECEIVED', 'WEBHOOK_REJECTED'
                    )),
    actor           VARCHAR(200) NOT NULL,         -- RM name, CO name, or 'SYSTEM'
    diff            JSONB,                         -- Before/after snapshot
    notes           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_record ON audit_log (record_id);
CREATE INDEX idx_audit_action ON audit_log (action);
CREATE INDEX idx_audit_actor ON audit_log (actor);
CREATE INDEX idx_audit_date ON audit_log (created_at DESC);
CREATE INDEX idx_audit_entity ON audit_log (entity_type);
```

#### `pending_events` (Transactional Outbox)

```sql
CREATE TABLE pending_events (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type      VARCHAR(50) NOT NULL,          -- 'fca.rules.updated'
    payload         JSONB NOT NULL,
    idempotency_key VARCHAR(100) UNIQUE,           -- FCA event_id for dedup
    status          VARCHAR(20) NOT NULL DEFAULT 'PENDING'
                    CHECK (status IN ('PENDING', 'PUBLISHED', 'FAILED')),
    retry_count     INT NOT NULL DEFAULT 0,
    max_retries     INT NOT NULL DEFAULT 5,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    published_at    TIMESTAMPTZ,
    error_message   TEXT
);

CREATE INDEX idx_outbox_pending ON pending_events (status, created_at) WHERE status = 'PENDING';
```

---

## 3. Domain Layer — Key Implementations

### 3.1 Rules Engine (Pure Function)

```typescript
// src/risk-classification/domain/services/rules-engine.service.ts

import { RiskTier } from "../value-objects/risk-tier.vo";
import { ClassificationResult } from "../value-objects/classification-result.vo";
import { TriggeredRule } from "../value-objects/triggered-rule.vo";

export interface RulesPayload {
  high_risk: {
    countries: string[];
    boolean_flags: string[];
  };
  medium_risk: {
    countries: string[];
    client_types: string[];
    income_threshold: number;
    income_source_of_funds: string[];
  };
}

export interface ClassifiableRecord {
  pep_status: boolean;
  sanctions_screening_match: boolean;
  adverse_media_flag: boolean;
  country_of_tax_residence: string;
  client_type: string;
  annual_income: number;
  source_of_funds: string;
}

/**
 * Pure function — no side effects, no dependencies.
 * Same inputs ALWAYS produce the same output.
 * This is an FCA audit requirement.
 */
export function classify(
  record: ClassifiableRecord,
  rules: RulesPayload,
): ClassificationResult {
  const triggeredRules: TriggeredRule[] = [];
  const country = record.country_of_tax_residence.trim();

  // ── HIGH risk evaluation ──
  if (record.pep_status === true) {
    triggeredRules.push({
      tier: "HIGH",
      rule: "PEP_STATUS",
      field: "pep_status",
      value: "TRUE",
    });
  }
  if (record.sanctions_screening_match === true) {
    triggeredRules.push({
      tier: "HIGH",
      rule: "SANCTIONS_MATCH",
      field: "sanctions_screening_match",
      value: "TRUE",
    });
  }
  if (record.adverse_media_flag === true) {
    triggeredRules.push({
      tier: "HIGH",
      rule: "ADVERSE_MEDIA",
      field: "adverse_media_flag",
      value: "TRUE",
    });
  }
  if (
    rules.high_risk.countries.some(
      (c) => c.toLowerCase() === country.toLowerCase(),
    )
  ) {
    triggeredRules.push({
      tier: "HIGH",
      rule: "HIGH_RISK_COUNTRY",
      field: "country_of_tax_residence",
      value: country,
    });
  }

  const hasHighTrigger = triggeredRules.some((r) => r.tier === "HIGH");
  if (hasHighTrigger) {
    return {
      computed_tier: RiskTier.HIGH,
      triggered_rules: triggeredRules,
      requires_edd: true,
    };
  }

  // ── MEDIUM risk evaluation ──
  if (
    rules.medium_risk.client_types.some(
      (t) => t.toLowerCase() === record.client_type.toLowerCase(),
    )
  ) {
    triggeredRules.push({
      tier: "MEDIUM",
      rule: "ENTITY_TYPE",
      field: "client_type",
      value: record.client_type,
    });
  }
  if (
    rules.medium_risk.countries.some(
      (c) => c.toLowerCase() === country.toLowerCase(),
    )
  ) {
    triggeredRules.push({
      tier: "MEDIUM",
      rule: "MEDIUM_RISK_COUNTRY",
      field: "country_of_tax_residence",
      value: country,
    });
  }
  if (
    record.annual_income > rules.medium_risk.income_threshold &&
    rules.medium_risk.income_source_of_funds.some(
      (s) => s.toLowerCase() === record.source_of_funds.toLowerCase(),
    )
  ) {
    triggeredRules.push({
      tier: "MEDIUM",
      rule: "HIGH_INCOME_RISKY_SOURCE",
      field: "annual_income + source_of_funds",
      value: `${record.annual_income} / ${record.source_of_funds}`,
    });
  }

  const hasMediumTrigger = triggeredRules.some((r) => r.tier === "MEDIUM");
  if (hasMediumTrigger) {
    return {
      computed_tier: RiskTier.MEDIUM,
      triggered_rules: triggeredRules,
      requires_edd: false,
    };
  }

  // ── LOW risk (default) ──
  return {
    computed_tier: RiskTier.LOW,
    triggered_rules: [],
    requires_edd: false,
  };
}
```

### 3.2 Onboarding Record Aggregate

```typescript
// src/onboarding/domain/entities/onboarding-record.entity.ts

import { AggregateRoot } from "../../../shared/domain/aggregate-root";
import { RecordType } from "../value-objects/record-type.vo";
import { ClassificationResult } from "../../../risk-classification/domain/value-objects/classification-result.vo";
import { OnboardingRecordSubmitted } from "../events/onboarding-record-submitted.event";
import { MismatchDetected } from "../events/mismatch-detected.event";

export class OnboardingRecord extends AggregateRoot {
  readonly clientId: string;
  readonly branch: string;
  readonly onboardingDate: Date;
  readonly clientName: string;
  readonly clientType: string;
  readonly countryOfTaxResidence: string;
  readonly annualIncome: number;
  readonly sourceOfFunds: string;
  readonly pepStatus: boolean;
  readonly sanctionsScreeningMatch: boolean;
  readonly adverseMediaFlag: boolean;
  readonly riskClassification: string; // RM-recorded value
  readonly kycStatus: string;
  readonly idVerificationDate: Date | null;
  readonly relationshipManager: string;
  readonly documentationComplete: boolean;

  // Computed
  readonly computedTier: string;
  readonly rulesVersion: string;
  readonly triggeredRules: object[];
  readonly hasMismatch: boolean;
  readonly isCriticalMismatch: boolean;

  // Lineage
  readonly parentId: string | null;
  readonly recordType: RecordType;

  private constructor(props: Partial<OnboardingRecord>) {
    super();
    Object.assign(this, props);
  }

  static createNew(
    fields: Record<string, any>,
    classification: ClassificationResult,
    rulesVersionId: string,
  ): OnboardingRecord {
    const computedTier = classification.computed_tier;
    const kycStatus = classification.requires_edd
      ? "ENHANCED_DUE_DILIGENCE"
      : "PENDING";

    const record = new OnboardingRecord({
      ...fields,
      computedTier,
      kycStatus,
      rulesVersion: rulesVersionId,
      triggeredRules: classification.triggered_rules,
      hasMismatch: false, // New record — no prior value to compare
      isCriticalMismatch: false,
      parentId: null,
      recordType: RecordType.INITIAL,
    });

    record.addDomainEvent(new OnboardingRecordSubmitted(record));
    return record;
  }

  static createFromImport(
    fields: Record<string, any>,
    classification: ClassificationResult,
    rulesVersionId: string,
  ): OnboardingRecord {
    const computedTier = classification.computed_tier;
    const storedTier = fields.riskClassification?.toUpperCase();
    const hasMismatch = storedTier && storedTier !== computedTier;
    const isCriticalMismatch =
      hasMismatch &&
      ["LOW", "MEDIUM"].includes(storedTier) &&
      computedTier === "HIGH";

    const record = new OnboardingRecord({
      ...fields,
      computedTier,
      rulesVersion: rulesVersionId,
      triggeredRules: classification.triggered_rules,
      hasMismatch,
      isCriticalMismatch,
      parentId: null,
      recordType: RecordType.IMPORT,
    });

    if (hasMismatch) {
      record.addDomainEvent(
        new MismatchDetected(record, storedTier, computedTier),
      );
    }
    return record;
  }

  static createCorrection(
    originalRecordId: string,
    fields: Record<string, any>,
    classification: ClassificationResult,
    rulesVersionId: string,
  ): OnboardingRecord {
    return new OnboardingRecord({
      ...fields,
      computedTier: classification.computed_tier,
      rulesVersion: rulesVersionId,
      triggeredRules: classification.triggered_rules,
      hasMismatch: false,
      isCriticalMismatch: false,
      parentId: originalRecordId,
      recordType: RecordType.CORRECTION,
    });
  }

  get isOpenFinding(): boolean {
    return !this.documentationComplete || this.idVerificationDate === null;
  }
}
```

### 3.3 Value Objects

```typescript
// src/risk-classification/domain/value-objects/risk-tier.vo.ts
export enum RiskTier {
  HIGH = "HIGH",
  MEDIUM = "MEDIUM",
  LOW = "LOW",
}

// src/risk-classification/domain/value-objects/classification-result.vo.ts
import { TriggeredRule } from "./triggered-rule.vo";
import { RiskTier } from "./risk-tier.vo";

export interface ClassificationResult {
  computed_tier: RiskTier;
  triggered_rules: TriggeredRule[];
  requires_edd: boolean;
}

// src/risk-classification/domain/value-objects/triggered-rule.vo.ts
export interface TriggeredRule {
  tier: string;
  rule: string;
  field: string;
  value: string;
}

// src/onboarding/domain/value-objects/record-type.vo.ts
export enum RecordType {
  INITIAL = "INITIAL",
  CORRECTION = "CORRECTION",
  REVIEW = "REVIEW",
  IMPORT = "IMPORT",
}

// src/audit/domain/value-objects/audit-action.vo.ts
export enum AuditAction {
  SUBMIT = "SUBMIT",
  IMPORT = "IMPORT",
  CORRECTION = "CORRECTION",
  REVIEW = "REVIEW",
  KYC_UPDATE = "KYC_UPDATE",
  EDD_ESCALATE = "EDD_ESCALATE",
  RULE_CHANGE = "RULE_CHANGE",
  RULE_CHANGE_RESCAN = "RULE_CHANGE_RESCAN",
  RULE_VERSION_MISMATCH = "RULE_VERSION_MISMATCH", // Offline record classified with stale client rules
  MISMATCH_ACKNOWLEDGED = "MISMATCH_ACKNOWLEDGED",
  SYNC_BATCH = "SYNC_BATCH",
  WEBHOOK_RECEIVED = "WEBHOOK_RECEIVED",
  WEBHOOK_REJECTED = "WEBHOOK_REJECTED",
}
```

---

## 4. Application Layer — Key Use Cases

### 4.1 Submit Onboarding Command

```typescript
// src/onboarding/application/commands/submit-onboarding.handler.ts

@CommandHandler(SubmitOnboardingCommand)
export class SubmitOnboardingHandler implements ICommandHandler<SubmitOnboardingCommand> {
  constructor(
    @Inject(ONBOARDING_RECORD_REPOSITORY)
    private readonly recordRepo: IOnboardingRecordRepository,
    @Inject(RULES_CONFIG_REPOSITORY)
    private readonly rulesRepo: IRulesConfigRepository,
    @Inject(AUDIT_ENTRY_REPOSITORY)
    private readonly auditRepo: IAuditEntryRepository,
    private readonly eventBus: EventBus,
    private readonly dataSource: DataSource,
  ) {}

  async execute(
    command: SubmitOnboardingCommand,
  ): Promise<OnboardingResponseDto> {
    // 1. Load active rules
    const activeRules = await this.rulesRepo.findActive();

    // 2. Classify (pure function call)
    const classification = classify(
      command.toClassifiableRecord(),
      activeRules.payload,
    );

    // 3. Create domain entity
    const record = OnboardingRecord.createNew(
      command.toFields(),
      classification,
      activeRules.id,
    );

    // 4. Persist atomically: record + audit entry
    await this.dataSource.transaction(async (manager) => {
      await this.recordRepo.save(record, manager);
      await this.auditRepo.save(
        AuditEntry.create({
          recordId: record.id,
          entityType: "ONBOARDING_RECORD",
          action: AuditAction.SUBMIT,
          actor: command.relationshipManager,
          diff: { after: record },
        }),
        manager,
      );
    });

    // 5. Publish domain events
    record.domainEvents.forEach((event) => this.eventBus.publish(event));

    return OnboardingResponseDto.from(record);
  }
}
```

### 4.2 Bulk Re-classification (After Rules Update)

```typescript
// src/risk-classification/application/commands/bulk-reclassify.handler.ts

@CommandHandler(BulkReclassifyCommand)
export class BulkReclassifyHandler implements ICommandHandler<BulkReclassifyCommand> {
  constructor(
    @Inject(ONBOARDING_RECORD_REPOSITORY)
    private readonly recordRepo: IOnboardingRecordRepository,
    @Inject(RULES_CONFIG_REPOSITORY)
    private readonly rulesRepo: IRulesConfigRepository,
    @Inject(AUDIT_ENTRY_REPOSITORY)
    private readonly auditRepo: IAuditEntryRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: BulkReclassifyCommand): Promise<void> {
    const newRules = await this.rulesRepo.findById(command.newRulesVersionId);
    const allRecords = await this.recordRepo.findLatestPerClient();

    const escalations: OnboardingRecord[] = [];

    for (const record of allRecords) {
      const newClassification = classify(
        record.toClassifiableRecord(),
        newRules.payload,
      );

      if (newClassification.computed_tier !== record.computedTier) {
        const isCritical =
          ["LOW", "MEDIUM"].includes(record.computedTier) &&
          newClassification.computed_tier === "HIGH";

        await this.auditRepo.save(
          AuditEntry.create({
            recordId: record.id,
            entityType: "ONBOARDING_RECORD",
            action: AuditAction.RULE_CHANGE_RESCAN,
            actor: "SYSTEM",
            diff: {
              before: {
                computed_tier: record.computedTier,
                rules_version: record.rulesVersion,
              },
              after: {
                computed_tier: newClassification.computed_tier,
                rules_version: newRules.id,
              },
            },
            notes: `Rules updated: ${record.rulesVersion} → ${newRules.version}`,
          }),
        );

        if (isCritical) {
          escalations.push(record);
          this.eventBus.publish(
            new EddEscalationRequired(record, newClassification),
          );
        }
      }
    }

    this.eventBus.publish(
      new BulkReclassificationCompleted({
        rulesVersion: newRules.version,
        totalScanned: allRecords.length,
        mismatches: escalations.length,
      }),
    );
  }
}
```

### 4.3 CSV Import

```typescript
// src/onboarding/application/commands/import-csv.handler.ts

@CommandHandler(ImportCsvCommand)
export class ImportCsvHandler implements ICommandHandler<ImportCsvCommand> {
  constructor(
    @Inject(ONBOARDING_RECORD_REPOSITORY)
    private readonly recordRepo: IOnboardingRecordRepository,
    @Inject(RULES_CONFIG_REPOSITORY)
    private readonly rulesRepo: IRulesConfigRepository,
    @Inject(AUDIT_ENTRY_REPOSITORY)
    private readonly auditRepo: IAuditEntryRepository,
    private readonly eventBus: EventBus,
    private readonly dataSource: DataSource,
  ) {}

  async execute(command: ImportCsvCommand): Promise<CsvImportResultDto> {
    const activeRules = await this.rulesRepo.findActive();
    const results: CsvImportResultDto = {
      total: 0,
      imported: 0,
      mismatches: 0,
      criticalMismatches: 0,
      errors: [],
      openFindings: 0,
    };

    const rows = this.parseCsv(command.csvContent);
    results.total = rows.length;

    for (const [index, row] of rows.entries()) {
      try {
        const normalized = this.normalizeRow(row);
        const classification = classify(
          normalized.toClassifiableRecord(),
          activeRules.payload,
        );

        const record = OnboardingRecord.createFromImport(
          normalized.toFields(),
          classification,
          activeRules.id,
        );

        await this.dataSource.transaction(async (manager) => {
          await this.recordRepo.save(record, manager);
          await this.auditRepo.save(
            AuditEntry.create({
              recordId: record.id,
              entityType: "ONBOARDING_RECORD",
              action: AuditAction.IMPORT,
              actor: "SYSTEM",
              diff: { after: record, csvRowIndex: index + 1 },
            }),
            manager,
          );
        });

        results.imported++;
        if (record.hasMismatch) results.mismatches++;
        if (record.isCriticalMismatch) results.criticalMismatches++;
        if (record.isOpenFinding) results.openFindings++;

        record.domainEvents.forEach((e) => this.eventBus.publish(e));
      } catch (error) {
        results.errors.push({ row: index + 1, message: error.message });
      }
    }

    this.eventBus.publish(new CsvImportCompleted(results));
    return results;
  }

  private normalizeRow(row: Record<string, string>): NormalizedCsvRow {
    // Handle inconsistent casing, missing values, boolean parsing
    return {
      clientId: row.client_id?.trim(),
      branch: row.branch?.trim(),
      clientName: row.client_name?.trim(),
      clientType: row.client_type?.trim().toUpperCase(),
      countryOfTaxResidence: row.country_of_tax_residence?.trim(),
      annualIncome: parseFloat(row.annual_income) || 0,
      sourceOfFunds: row.source_of_funds?.trim(),
      pepStatus: row.pep_status?.trim().toUpperCase() === "TRUE",
      sanctionsScreeningMatch:
        row.sanctions_screening_match?.trim().toUpperCase() === "TRUE",
      adverseMediaFlag: row.adverse_media_flag?.trim().toUpperCase() === "TRUE",
      riskClassification: row.risk_classification?.trim().toUpperCase(),
      kycStatus: row.kyc_status?.trim().toUpperCase().replace(/ /g, "_"),
      onboardingDate: new Date(row.onboarding_date),
      idVerificationDate: row.id_verification_date
        ? new Date(row.id_verification_date)
        : null,
      relationshipManager: row.relationship_manager?.trim(),
      documentationComplete:
        row.documentation_complete?.trim().toUpperCase() === "TRUE",
    };
  }
}
```

---

## 5. Infrastructure Layer — Key Implementations

### 5.1 HMAC Signature Guard

```typescript
// src/rules-admin/infrastructure/guards/hmac-signature.guard.ts

@Injectable()
export class HmacSignatureGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const signature = request.headers["x-fca-signature"] as string;
    const secret = this.configService.get<string>("FCA_WEBHOOK_SECRET");

    if (!signature || !secret) {
      throw new UnauthorizedException("Missing webhook signature");
    }

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(JSON.stringify(request.body))
      .digest("hex");

    const isValid = crypto.timingSafeEqual(
      Buffer.from(signature, "hex"),
      Buffer.from(expectedSignature, "hex"),
    );

    if (!isValid) {
      // Log security event — do not expose details in response
      throw new UnauthorizedException("Invalid webhook signature");
    }

    return true;
  }
}
```

### 5.2 Outbox Poller

```typescript
// src/shared/infrastructure/outbox/outbox-poller.service.ts

@Injectable()
export class OutboxPollerService implements OnModuleInit {
  private readonly POLL_INTERVAL_MS = 5000;
  private readonly BATCH_SIZE = 10;

  constructor(
    @InjectRepository(OutboxEvent)
    private readonly outboxRepo: Repository<OutboxEvent>,
    @Inject("RMQ_CLIENT")
    private readonly rmqClient: ClientProxy,
  ) {}

  onModuleInit() {
    this.startPolling();
  }

  private async startPolling() {
    setInterval(async () => {
      const pending = await this.outboxRepo.find({
        where: {
          status: "PENDING",
          retryCount: LessThan(Raw((alias) => `${alias}.max_retries`)),
        },
        order: { createdAt: "ASC" },
        take: this.BATCH_SIZE,
      });

      for (const event of pending) {
        try {
          await this.rmqClient.emit(event.eventType, event.payload).toPromise();
          event.status = "PUBLISHED";
          event.publishedAt = new Date();
        } catch (error) {
          event.retryCount++;
          event.errorMessage = error.message;
          if (event.retryCount >= event.maxRetries) {
            event.status = "FAILED";
          }
        }
        await this.outboxRepo.save(event);
      }
    }, this.POLL_INTERVAL_MS);
  }
}
```

### 5.3 RMQ Rules Update Consumer

```typescript
// src/rules-admin/infrastructure/messaging/rules-update.consumer.ts

@Controller()
export class RulesUpdateConsumer {
  constructor(private readonly commandBus: CommandBus) {}

  @EventPattern("fca.rules.updated")
  async handleRulesUpdate(
    @Payload() data: FcaRulesUpdatedPayload,
    @Ctx() context: RmqContext,
  ) {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();

    try {
      // 1. Insert new rules version
      const newRulesId = await this.commandBus.execute(
        new UploadRulesCommand({
          payload: data.rules,
          source: "FCA_WEBHOOK",
          createdBy: "SYSTEM",
          version: data.version,
        }),
      );

      // 2. Trigger bulk re-classification
      await this.commandBus.execute(
        new BulkReclassifyCommand({ newRulesVersionId: newRulesId }),
      );

      // 3. ACK
      channel.ack(originalMsg);
    } catch (error) {
      // NACK — message goes to DLQ after max retries
      channel.nack(originalMsg, false, false);
    }
  }
}
```

### 5.4 FCA Webhook Controller

```typescript
// src/rules-admin/infrastructure/http/fca-webhook.controller.ts

@Controller("api/fca")
export class FcaWebhookController {
  constructor(
    private readonly commandBus: CommandBus,
    @InjectRepository(OutboxEvent)
    private readonly outboxRepo: Repository<OutboxEvent>,
    @InjectRepository(AuditEntryOrmEntity)
    private readonly auditRepo: Repository<AuditEntryOrmEntity>,
    private readonly dataSource: DataSource,
  ) {}

  @Post("webhook")
  @UseGuards(HmacSignatureGuard)
  @HttpCode(HttpStatus.ACCEPTED)
  async receiveWebhook(
    @Body() payload: FcaWebhookPayloadDto,
  ): Promise<{ status: string }> {
    // Idempotency check
    const existing = await this.outboxRepo.findOne({
      where: { idempotencyKey: payload.event_id },
    });
    if (existing) {
      return { status: "already_processed" };
    }

    // Atomic: outbox entry + audit log
    await this.dataSource.transaction(async (manager) => {
      await manager.save(OutboxEvent, {
        eventType: "fca.rules.updated",
        payload: payload,
        idempotencyKey: payload.event_id,
        status: "PENDING",
      });

      await manager.save(AuditEntryOrmEntity, {
        entityType: "RULES_CONFIG",
        action: "WEBHOOK_RECEIVED",
        actor: "FCA_WEBHOOK",
        diff: { payload },
        notes: `FCA event ${payload.event_id} received`,
      });
    });

    return { status: "accepted" };
  }
}
```

### 5.5 Rules Version Endpoint (Server-Side)

```typescript
// src/rules-admin/infrastructure/http/rules-admin.controller.ts

@Controller("api/rules")
export class RulesAdminController {
  constructor(private readonly queryBus: QueryBus) {}

  /**
   * Lightweight version check — clients poll every 60 min.
   * Returns 304 Not Modified when the ETag matches (no payload sent).
   * Full rule payload is only fetched if the version differs.
   */
  @Get("version")
  @HttpCode(HttpStatus.OK)
  async getVersion(
    @Headers("if-none-match") etag: string,
    @Res() res: Response,
  ) {
    const active = await this.queryBus.execute(new GetActiveRulesQuery());
    if (etag && etag === active.version) {
      return res.status(304).send();
    }
    return res
      .setHeader("ETag", active.version)
      .setHeader("Cache-Control", "no-store")
      .json({ version: active.version, valid_from: active.valid_from });
  }

  /**
   * Full rule payload — only fetched when version differs from client cache.
   */
  @Get("current")
  @HttpCode(HttpStatus.OK)
  async getCurrent() {
    const active = await this.queryBus.execute(new GetActiveRulesQuery());
    return {
      version: active.version,
      valid_from: active.valid_from,
      payload: active.payload,
    };
  }
}
```

### 5.6 Client-Side Rules Cache (Frontend / PWA)

> **Context:** Branch iPad app — offline-first. Rules are cached in IndexedDB and refreshed by polling. No WebSocket push for rules (see ADR-0008).

```typescript
// src/frontend/services/rules-cache.service.ts

const RULES_POLL_INTERVAL_MS = 3_600_000; // 1 hour
const RULES_DB_KEY = "sentinel_rules_cache";

interface RulesCache {
  version: string;
  valid_from: string;
  payload: RulesConfigPayload;
  cached_at: string; // ISO 8601
}

/**
 * Start rules polling on app boot.
 * - Polls immediately, then every 60 min.
 * - Also polls on reconnection (window 'online' event).
 */
export async function startRulesPolling(): Promise<void> {
  await pollRules();
  setInterval(pollRules, RULES_POLL_INTERVAL_MS);
  window.addEventListener("online", pollRules);
}

async function pollRules(): Promise<void> {
  const cached = await getRulesFromIndexedDB();
  try {
    const res = await fetch("/api/rules/version", {
      headers: cached ? { "If-None-Match": cached.version } : {},
    });
    if (res.status === 304) return; // ETag match — cache is current
    if (!res.ok) return; // Server error or offline — keep existing cache
    const { version, valid_from } = await res.json();
    if (!cached || version !== cached.version) {
      // Version changed: fetch full payload
      const full = await fetch("/api/rules/current").then((r) => r.json());
      await writeRulesToIndexedDB({
        version,
        valid_from,
        payload: full.payload,
        cached_at: new Date().toISOString(),
      });
    }
  } catch {
    // Offline or network error — silently keep using cached version
  }
}

/** Returns true if the cache is older than the poll interval while the user is offline. */
export function isRulesCacheStale(cache: RulesCache): boolean {
  const ageMs = Date.now() - new Date(cache.cached_at).getTime();
  return ageMs > RULES_POLL_INTERVAL_MS;
}

/**
 * Call before every offline classification.
 * Returns a stale-cache warning string if the cache should be treated as advisory,
 * or null if the cache is fresh.
 */
export function staleCacheWarning(cache: RulesCache | null): string | null {
  if (!cache) return "No rules loaded — classification unavailable offline.";
  if (!isRulesCacheStale(cache)) return null;
  const ageHours = Math.round(
    (Date.now() - new Date(cache.cached_at).getTime()) / 3_600_000,
  );
  return `Classification based on rules cached ${ageHours}h ago. Connect to refresh.`;
}
```

**IndexedDB schema for the rules cache:**

```
Object store: "rules_cache"
  keyPath:  "version"          (string — ISO timestamp)
  Indexes:  none required
  Fields:
    version    : string   — matches server rules_config.version
    valid_from : string   — ISO 8601
    payload    : object   — full JSONB rule set (HIGH/MEDIUM thresholds, country lists)
    cached_at  : string   — ISO 8601, time of local write
```

**Stale-cache UI behaviour (RM iPad):**

| Condition                              | Rendered indicator                                                 |
| -------------------------------------- | ------------------------------------------------------------------ |
| Cache fresh (`age < 1h`)               | No indicator                                                       |
| Cache stale (`age ≥ 1h`) + **online**  | Silent — next poll fires immediately via `online` event            |
| Cache stale (`age ≥ 1h`) + **offline** | Warning banner: _"Rules last updated Xh ago — connect to refresh"_ |
| Cache missing + offline                | Error banner: _"No rule set loaded — classification unavailable"_  |

---

## 6. NestJS Module Wiring

### 6.1 Root Module

```typescript
// src/app.module.ts

@Module({
  imports: [
    // Infrastructure
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      useFactory: (config: ConfigService) => ({
        type: "postgres",
        host: config.get("DB_HOST"),
        port: config.get("DB_PORT"),
        username: config.get("DB_USER"),
        password: config.get("DB_PASSWORD"),
        database: config.get("DB_NAME"),
        autoLoadEntities: true,
        synchronize: false, // Migrations only — never sync in production
      }),
      inject: [ConfigService],
    }),
    EventEmitterModule.forRoot(),
    CqrsModule,

    // Bounded Contexts
    OnboardingModule,
    RiskClassificationModule,
    KycModule,
    AuditModule,
    RulesAdminModule,

    // Shared
    OutboxModule,
  ],
})
export class AppModule {}
```

### 6.2 Context Module Example

```typescript
// src/onboarding/onboarding.module.ts

@Module({
  imports: [TypeOrmModule.forFeature([OnboardingRecordOrmEntity]), CqrsModule],
  controllers: [OnboardingController, ImportController, SyncController],
  providers: [
    // Use case handlers
    SubmitOnboardingHandler,
    ImportCsvHandler,
    SubmitCorrectionHandler,
    GetClientsHandler,
    GetClientDetailHandler,

    // Port → Adapter binding
    {
      provide: ONBOARDING_RECORD_REPOSITORY,
      useClass: OnboardingRecordTypeOrmRepository,
    },
  ],
  exports: [ONBOARDING_RECORD_REPOSITORY],
})
export class OnboardingModule {}
```

---

## 7. API Contracts (DTOs)

### 7.1 Create Onboarding Request

```typescript
// src/onboarding/application/dto/create-onboarding.dto.ts

export class CreateOnboardingDto {
  @IsNotEmpty()
  @IsString()
  client_id: string;

  @IsNotEmpty()
  @IsString()
  branch: string;

  @IsNotEmpty()
  @IsDateString()
  onboarding_date: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(300)
  client_name: string;

  @IsNotEmpty()
  @IsIn(["INDIVIDUAL", "ENTITY"])
  client_type: string;

  @IsNotEmpty()
  @IsString()
  country_of_tax_residence: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  annual_income: number;

  @IsNotEmpty()
  @IsIn([
    "Employment",
    "Business Income",
    "Investment Returns",
    "Inheritance",
    "Property Sale",
    "Pension",
    "Gift",
    "Other",
  ])
  source_of_funds: string;

  @IsBoolean()
  pep_status: boolean;

  @IsBoolean()
  sanctions_screening_match: boolean;

  @IsBoolean()
  adverse_media_flag: boolean;

  @IsOptional()
  @IsDateString()
  id_verification_date?: string;

  @IsNotEmpty()
  @IsString()
  relationship_manager: string;

  @IsBoolean()
  documentation_complete: boolean;

  @IsOptional()
  @IsUUID()
  offline_uuid?: string; // Client-generated for offline sync idempotency

  @IsOptional()
  @IsString()
  client_rules_version?: string; // Version of rule set used during offline classification

  @IsOptional()
  @IsIn(["LOW", "MEDIUM", "HIGH"])
  client_computed_tier?: string; // Tier computed offline — server re-classifies and compares
}
```

### 7.2 Onboarding Response

```typescript
// src/onboarding/application/dto/onboarding-response.dto.ts

export class OnboardingResponseDto {
  id: string;
  client_id: string;
  client_name: string;
  branch: string;
  record_type: string;
  computed_tier: string;
  triggered_rules: TriggeredRule[];
  kyc_status: string;
  has_mismatch: boolean;
  is_critical_mismatch: boolean;
  requires_edd: boolean;
  is_open_finding: boolean;
  rules_version: string;
  created_at: string;
}

// Sync batch result per record
export class SyncBatchItemResultDto {
  uuid: string;
  status: "synced" | "duplicate" | "error";
  server_computed_tier?: string; // The tier the server classified at sync time
  rules_mismatch?: boolean; // true if client_rules_version !== server active version
  error?: string;
}

// Rules version check response (lightweight poll endpoint)
export class RulesVersionDto {
  version: string; // e.g. '2026-04-19T14:30:00Z'
  valid_from: string; // ISO 8601
  // No payload — client fetches GET /rules/current only when version differs
}
```

### 7.3 KYC Status Update Request

```typescript
// src/kyc/application/dto/update-kyc-status.dto.ts

export class UpdateKycStatusDto {
  @IsNotEmpty()
  @IsIn(["APPROVED", "PENDING", "REJECTED", "ENHANCED_DUE_DILIGENCE"])
  new_status: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(10)
  reason: string; // Required justification — compliance requirement

  @IsNotEmpty()
  @IsString()
  updated_by: string; // Compliance officer name
}
```

---

## 8. Testing Strategy

### 8.1 Test Pyramid

```
        ╱╲
       ╱ E2E ╲          2-3 critical flows (onboarding + webhook + re-scan)
      ╱────────╲
     ╱Integration╲      Controller + DB tests per bounded context
    ╱──────────────╲
   ╱   Unit Tests    ╲   Rules engine (exhaustive), entities, value objects
  ╱────────────────────╲
```

### 8.2 Rules Engine Unit Tests (Critical)

```typescript
// test/unit/rules-engine.spec.ts

describe("RulesEngine.classify", () => {
  const defaultRules: RulesPayload = {
    high_risk: {
      countries: ["Russia", "Belarus", "Venezuela"],
      boolean_flags: [
        "pep_status",
        "sanctions_screening_match",
        "adverse_media_flag",
      ],
    },
    medium_risk: {
      countries: ["Brazil", "Turkey", "South Africa", "Mexico", "UAE", "China"],
      client_types: ["ENTITY"],
      income_threshold: 500000,
      income_source_of_funds: ["Inheritance", "Gift", "Other"],
    },
  };

  // HIGH triggers
  it("classifies PEP as HIGH", () => {
    /* ... */
  });
  it("classifies sanctions match as HIGH", () => {
    /* ... */
  });
  it("classifies adverse media as HIGH", () => {
    /* ... */
  });
  it("classifies Russia residence as HIGH", () => {
    /* ... */
  });
  it("classifies Belarus residence as HIGH", () => {
    /* ... */
  });
  it("classifies Venezuela residence as HIGH", () => {
    /* ... */
  });
  it("HIGH requires EDD", () => {
    /* ... */
  });
  it("HIGH overrides MEDIUM triggers", () => {
    /* ... */
  });

  // MEDIUM triggers
  it("classifies ENTITY as MEDIUM", () => {
    /* ... */
  });
  it("classifies Brazil residence as MEDIUM", () => {
    /* ... */
  });
  it("classifies high income + Inheritance as MEDIUM", () => {
    /* ... */
  });
  it("classifies high income + Gift as MEDIUM", () => {
    /* ... */
  });
  it("does NOT classify high income + Employment as MEDIUM", () => {
    /* ... */
  });
  it("does NOT classify 500000 exactly as MEDIUM (must be >)", () => {
    /* ... */
  });
  it("MEDIUM does not require EDD", () => {
    /* ... */
  });

  // LOW
  it("classifies clean individual as LOW", () => {
    /* ... */
  });
  it("LOW returns empty triggered_rules", () => {
    /* ... */
  });

  // Edge cases
  it("handles case-insensitive country matching", () => {
    /* ... */
  });
  it("handles case-insensitive client_type matching", () => {
    /* ... */
  });
  it("returns all triggered rules when multiple HIGH triggers apply", () => {
    /* ... */
  });

  // Config-driven (no hardcoding)
  it("respects custom country list from config", () => {
    /* ... */
  });
  it("respects custom income threshold from config", () => {
    /* ... */
  });
});
```

### 8.3 Integration Test Categories

| Context     | Tests                                                                                                                                                                   |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Onboarding  | Submit record → verify DB + audit log; Submit with missing field → 400                                                                                                  |
| Import      | CSV parse → mismatch detection → correct counts                                                                                                                         |
| KYC         | Status update → audit entry; EDD escalation on HIGH                                                                                                                     |
| Rules Admin | Webhook → outbox → RMQ → new version; HMAC rejection; `GET /rules/version` returns 304 when unchanged                                                                   |
| Audit       | Query trail by record, branch, date range; verify immutability                                                                                                          |
| Sync        | Batch sync with idempotency; duplicate UUID returns 409; stale `client_rules_version` → `rules_mismatch: true` in response; `RULE_VERSION_MISMATCH` audit entry created |

---

## 9. Docker Compose (Local Development)

```yaml
# docker-compose.yml
version: "3.8"

services:
  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_USER=sentinel
      - DB_PASSWORD=${DB_PASSWORD}
      - DB_NAME=sentinel
      - RMQ_URL=amqp://guest:guest@rabbitmq:5672
      - FCA_WEBHOOK_SECRET=${FCA_WEBHOOK_SECRET}
    depends_on:
      postgres:
        condition: service_healthy
      rabbitmq:
        condition: service_healthy

  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: sentinel
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: sentinel
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U sentinel"]
      interval: 5s
      timeout: 5s
      retries: 5

  rabbitmq:
    image: rabbitmq:3.13-management-alpine
    ports:
      - "5672:5672"
      - "15672:15672"
    healthcheck:
      test: ["CMD", "rabbitmq-diagnostics", "-q", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  pgadmin:
    image: dpage/pgadmin4
    ports:
      - "5050:80"
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@sentinel.local
      PGADMIN_DEFAULT_PASSWORD: ${PGADMIN_PASSWORD}

volumes:
  pgdata:
```

---

## 10. Seed Data — Initial Rules Config

```json
{
  "version": "1.0.0",
  "valid_from": "2026-04-19T00:00:00Z",
  "source": "SEED",
  "created_by": "SYSTEM",
  "payload": {
    "high_risk": {
      "countries": ["Russia", "Belarus", "Venezuela"],
      "boolean_flags": [
        "pep_status",
        "sanctions_screening_match",
        "adverse_media_flag"
      ]
    },
    "medium_risk": {
      "countries": [
        "Brazil",
        "Turkey",
        "South Africa",
        "Mexico",
        "UAE",
        "China"
      ],
      "client_types": ["ENTITY"],
      "income_threshold": 500000,
      "income_source_of_funds": ["Inheritance", "Gift", "Other"]
    }
  }
}
```
