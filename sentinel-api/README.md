# SENTINEL API

NestJS modular monolith — risk classification, KYC, and audit backend for Halcyon Capital Partners.

**Status:** Phase 1–2 (foundation + Risk Classification context).

## Quick start

```bash
# 1. Install deps
npm install

# 2. Copy env
cp .env.example .env

# 3. Start Postgres + RabbitMQ + pgAdmin
docker compose up -d

# 4. Run migrations (creates rules_config + seeds v1.0.0-2024)
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

## Project layout

See [../docs/lld.md §1](../docs/lld.md) for the full bounded-context tree. Currently implemented:

```
src/
├── main.ts
├── app.module.ts
├── shared/                     ← cross-cutting kernel
│   ├── domain/                 (base entity, aggregate root, VO, events, repo port)
│   ├── application/            (use-case, pagination)
│   ├── infrastructure/         (global filter, roles guard, typeorm data source)
│   └── constants/              (roles enum)
└── risk-classification/        ← bounded context: pure rules engine + rules admin storage
    ├── domain/                 (RuleSet, RiskTier, ClassificationResult, RulesEngine)
    ├── application/            (ClassifyRecord command, GetActiveRules / GetRulesVersion queries)
    └── infrastructure/         (TypeORM repo, mapper, cache, seed payload)
```

Coming next: Onboarding → Audit → KYC → Rules Admin (FCA webhook + outbox).
