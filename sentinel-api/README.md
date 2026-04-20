# SENTINEL API

NestJS modular monolith — risk classification, KYC, and audit backend for Halcyon Capital Partners.

**Status:** Phase 1–6 complete (Foundation, Risk Classification, Onboarding, Audit, KYC, Rules Admin + FCA webhook + Outbox).

## Quick start

```bash
# 1. Install deps
npm install

# 2. Copy env
cp .env.example .env

# 3. Start Postgres + RabbitMQ + pgAdmin
docker compose up -d

# 4. Run migrations
npm run migration:run

# 5. Start the API
npm run start:dev
```

- API: http://localhost:3000
- Swagger: http://localhost:3000/docs
- pgAdmin: http://localhost:5050
- RabbitMQ UI: http://localhost:15672

## Tests

```bash
npm test              # unit tests (Jest)
npm run test:cov      # with coverage
```

The rules engine (`src/risk-classification/domain/services/rules-engine.service.ts`) is a pure function with 25+ unit tests covering all HIGH/MEDIUM/LOW paths and immutability invariants.

## API endpoints

### Onboarding
| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/onboarding` | Submit a new client record (auto-classifies) |
| `POST` | `/api/onboarding/import` | Bulk CSV import (multipart) |
| `GET` | `/api/clients` | List client records (paginated) |
| `GET` | `/api/clients/:id` | Get client record by ID |

### Rules Admin
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/rules/active` | Get the currently active rule set |
| `GET` | `/api/rules/version` | Get the active rules version |
| `POST` | `/api/rules` | Publish a new rule set (manual) |
| `POST` | `/api/rules/classify` | Classify a record (dry run) |
| `POST` | `/api/rules/fca-webhook` | Receive FCA regulatory update |

### KYC
| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/kyc` | Open a KYC case for a client |
| `PATCH` | `/api/kyc/:id/status` | Transition KYC case status |
| `GET` | `/api/kyc` | List KYC cases (paginated) |
| `GET` | `/api/kyc/:id` | Get KYC case by ID |

### Audit
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/audit` | List all audit entries (paginated) |
| `GET` | `/api/audit/:aggregateId` | Get audit trail for an aggregate |

## Project layout

```
src/
├── main.ts
├── app.module.ts
├── shared/                          ← cross-cutting kernel
│   ├── domain/                      (base entity, aggregate root, VO, events, repo port)
│   ├── application/                 (use-case, pagination)
│   ├── infrastructure/
│   │   ├── filters/                 (global exception filter)
│   │   ├── guards/                  (roles guard + decorator)
│   │   ├── typeorm/                 (data source, config, migrations)
│   │   └── outbox/                  (outbox entity, service, poller module)
│   └── constants/                   (roles enum)
├── risk-classification/             ← rules engine + rules admin
│   ├── domain/                      (RuleSet, RiskTier, ClassificationResult, RulesEngine)
│   ├── application/                 (ClassifyRecord, PublishRuleSet commands; queries)
│   └── infrastructure/              (TypeORM repo, mapper, cache, seed, rules-admin controller)
├── onboarding/                      ← client onboarding context
│   ├── domain/                      (ClientRecord aggregate, events)
│   ├── application/                 (SubmitOnboarding, ImportCsv commands; queries)
│   └── infrastructure/              (TypeORM repo, mapper, controller)
├── audit/                           ← append-only audit log
│   ├── domain/                      (AuditEntry, repository port)
│   ├── application/                 (event handlers, GetAuditLog query)
│   └── infrastructure/              (TypeORM repo, mapper, controller)
└── kyc/                             ← KYC case management
    ├── domain/                      (KycCase aggregate, status state machine, events)
    ├── application/                 (OpenKycCase, TransitionKyc commands; queries; audit handler)
    └── infrastructure/              (TypeORM repo, mapper, controller)
```

## Database migrations

| Timestamp | Table | Notes |
|-----------|-------|-------|
| `1713600000000` | `rules_config` | Rules engine seed data (v1.0.0-2024) |
| `1713700000000` | `client_records` | Append-only with immutability trigger |
| `1713800000000` | `audit_log` | Append-only with immutability trigger |
| `1713900000000` | `kyc_cases` | FK to `client_records`, unique on `client_record_id` |
| `1714000000000` | `outbox` | Transactional outbox with partial index on pending |

## Architecture highlights

- **DDD + CQRS**: Each bounded context has its own aggregate roots, value objects, commands/queries, and repository ports
- **Append-only tables**: `client_records` and `audit_log` use Postgres triggers to prevent UPDATE/DELETE
- **Transactional outbox**: Reliable event publishing via the outbox pattern (poller polls every 5s)
- **Rules engine**: Pure function — no side effects, fully unit-testable
- **FCA webhook**: External regulatory updates auto-publish new rule sets
- **KYC state machine**: Guards terminal states (`APPROVED`/`REJECTED`), emits domain events on transitions
