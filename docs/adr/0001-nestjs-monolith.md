# ADR-0001: NestJS Monolith for POC Runtime

_Status:_ Accepted

_Date:_ 2026-04-19

_Deciders:_ Engineering Team, CTO

## Context

SENTINEL needs a backend to support CRUD operations for client onboarding records, CSV import, real-time risk classification, audit trail persistence, and FCA webhook integration. The system currently serves 4 branches with ~46 records and will scale to 15 branches.

We need to choose between a monolithic application, a modular monolith, or a microservices architecture for the POC phase. The team is small and the primary goal is proving the concept with a working end-to-end flow before investing in distributed infrastructure.

## Decision

We will build a **modular monolith using NestJS** (Node.js / TypeScript) for the POC phase.

- NestJS's module system naturally enforces bounded context boundaries, making future extraction to microservices straightforward.
- A single deployable unit reduces operational overhead during POC — one CI pipeline, one deployment target, one set of logs.
- NestJS provides first-class support for RabbitMQ consumers, WebSocket gateways, and guard-based RBAC — all required by the system — without additional frameworks.
- TypeScript gives us type safety across the rules engine, DTOs, and domain entities.

The monolith will be structured internally using DDD bounded contexts (see ADR-0002) so that module boundaries are clean extraction points when scaling demands it.

## Consequences

### Positive

- Single deployment simplifies POC iteration and debugging.
- NestJS module system enforces separation between bounded contexts at compile time.
- Shared database transactions are straightforward (e.g. record insert + audit log in one transaction).
- The team can move fast without managing inter-service communication, distributed tracing, or service discovery.

### Negative

- All modules share a single process — a bug in the RMQ consumer could affect API availability.
- Horizontal scaling is all-or-nothing; cannot scale the webhook worker independently of the API layer.
- Risk of coupling if module boundaries are not enforced through code review discipline.

### Neutral

- When branch count exceeds ~10 and team grows, we should revisit this decision and consider extracting the RulesEngine and Audit modules as independent services (see ADR-0002 for extraction boundaries).
- Load testing at 15 branches (~500 records/day) should be conducted before deciding on extraction.
