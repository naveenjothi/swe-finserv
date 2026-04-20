# ADR-0002: Domain-Driven Design with Clean Architecture

_Status:_ Accepted

_Date:_ 2026-04-19

_Deciders:_ Engineering Team, CTO

## Context

SENTINEL operates in a regulated financial services domain where business rules are complex, auditable, and change with FCA guidance. The risk classification engine, KYC status management, and audit trail are distinct business capabilities with different change drivers:

- The **rules engine** changes when FCA publishes new guidance or the HMT sanctions list is amended.
- The **onboarding workflow** changes when the firm adds new intake fields or the RM process evolves.
- The **audit and compliance** requirements are driven by MLR 2017 and SYSC — these change infrequently but are non-negotiable.

A poorly structured codebase would mix FCA rule logic with HTTP handling and database queries, making it impossible to test rules in isolation or swap infrastructure without rewriting business logic.

## Decision

We will structure the application using **Domain-Driven Design (DDD)** tactical patterns within a **Clean Architecture** (Hexagonal / Ports & Adapters) layered structure.

### Bounded Contexts

| Bounded Context          | Responsibility                                     | Key Aggregates                                     |
| ------------------------ | -------------------------------------------------- | -------------------------------------------------- |
| **Onboarding**           | Client intake, record creation, field validation   | `OnboardingRecord` (aggregate root), `Client`      |
| **Risk Classification**  | Rules engine, tier computation, mismatch detection | `RuleSet` (aggregate root), `ClassificationResult` |
| **KYC Management**       | KYC status lifecycle, EDD escalation               | `KycCase` (aggregate root)                         |
| **Audit**                | Immutable event log, compliance reporting          | `AuditEntry` (aggregate root)                      |
| **Rules Administration** | FCA webhook ingestion, rule versioning             | `RulesConfig` (aggregate root)                     |

### Layer Structure (per bounded context)

```
src/<context>/
├── domain/           ← Entities, Value Objects, Domain Events, Repository interfaces (ports)
│   ├── entities/
│   ├── value-objects/
│   ├── events/
│   └── ports/        ← Repository & service interfaces (no implementations)
├── application/      ← Use Cases / Application Services, DTOs, Command/Query handlers
│   ├── commands/
│   ├── queries/
│   └── dto/
└── infrastructure/   ← Adapters: DB repos, HTTP controllers, RMQ consumers, external APIs
    ├── persistence/
    ├── http/
    └── messaging/
```

### Dependency Rule

Dependencies point **inward only**:

```
Infrastructure → Application → Domain
```

- **Domain** has zero dependencies on frameworks, databases, or HTTP. Pure TypeScript.
- **Application** depends on Domain only. Uses interfaces (ports) to interact with infrastructure.
- **Infrastructure** implements the ports defined in Domain and orchestrates framework-specific concerns (NestJS controllers, TypeORM repositories, RMQ consumers).

### Domain Events

Cross-context communication uses domain events, not direct method calls:

- `OnboardingRecordSubmitted` → triggers `AuditEntryCreated`
- `RulesConfigUpdated` → triggers `BulkReclassificationRequested`
- `ClassificationMismatchDetected` → triggers `EddEscalationRequired` (if HIGH)

In the monolith, these are dispatched via NestJS's built-in `EventEmitter2`. In a future microservices split, the same events route through RabbitMQ without changing domain code.

## Consequences

### Positive

- The rules engine is a **pure function** in the Domain layer — testable without any framework, database, or HTTP dependency.
- FCA rule changes affect only the `RulesConfig` aggregate and the rules engine — no cascading changes to controllers or persistence.
- Bounded contexts are natural microservice extraction boundaries when scaling demands it.
- Audit requirements are satisfied by a dedicated context that cannot be bypassed — every state change emits a domain event that the Audit context consumes.

### Negative

- More boilerplate than a flat NestJS structure — ports, adapters, DTOs, and mappers for each context.
- Developers unfamiliar with DDD may find the indirection confusing initially.
- Over-engineering risk if bounded context boundaries are drawn too granularly for the POC.

### Neutral

- The `RulesEngine` must remain a pure function with no side effects — this is both a DDD constraint and an FCA compliance requirement (same inputs must always produce the same output for audit reconstruction).
- Event-driven cross-context communication adds eventual consistency within the monolith — acceptable for audit logging but not for synchronous classification during form submission (the RulesEngine is called directly for real-time classification).
