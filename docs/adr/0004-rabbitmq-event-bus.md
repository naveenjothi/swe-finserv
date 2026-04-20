# ADR-0004: RabbitMQ as Event Bus

_Status:_ Accepted

_Date:_ 2026-04-19

_Deciders:_ Engineering Team, CTO

## Context

SENTINEL has two distinct event-driven requirements:

1. **FCA webhook → rules engine update**: When the FCA publishes regulatory changes via webhook, the system must reliably process the update — insert a new versioned rule set, run a re-classification scan over all existing records, and escalate any newly-detected HIGH-risk mismatches. This is a **critical compliance pathway** — a lost event means silently operating under outdated rules.

2. **Internal domain events**: Cross-bounded-context communication (e.g. `OnboardingRecordSubmitted` → audit log, `RulesConfigUpdated` → bulk re-scan). In the monolith, most of these can use in-process event dispatch, but the re-classification scan is long-running and must not block the API.

We need a message broker that provides durability (no lost messages), dead-letter handling (failed processing is visible), and can scale the worker independently in a future microservices split.

## Decision

We will use **RabbitMQ** as the external event bus for asynchronous, durable workloads.

### Exchange / Queue Topology

| Exchange          | Type   | Routing Key                 | Queue              | Consumer             |
| ----------------- | ------ | --------------------------- | ------------------ | -------------------- |
| `sentinel.events` | topic  | `fca.rules.updated`         | `q.rules-update`   | RulesUpdateWorker    |
| `sentinel.events` | topic  | `sentinel.rescan.completed` | `q.rescan-results` | EscalationHandler    |
| `sentinel.dlx`    | fanout | —                           | `q.dead-letter`    | Alert + manual retry |

### In-Process vs RMQ Decision Matrix

| Event                                       | Dispatch Method          | Why                                          |
| ------------------------------------------- | ------------------------ | -------------------------------------------- |
| Real-time risk classification (form submit) | Direct service call      | < 200 ms latency requirement (NFR-03)        |
| Audit log write                             | In-process EventEmitter2 | Must be transactional with record insert     |
| FCA webhook → rules update                  | RMQ                      | Durability required; long-running re-scan    |
| Bulk re-classification scan                 | RMQ                      | CPU-intensive; must not block API            |
| EDD escalation notifications                | RMQ                      | Decoupled from scan; can retry independently |

### Reliability: Transactional Outbox

To prevent message loss when the FCA webhook writes to RMQ, we implement the **transactional outbox pattern**:

1. The webhook controller writes the event payload to a `pending_events` table in the same DB transaction as any acknowledgment record.
2. A poller (or CDC-based) process reads `pending_events`, publishes to RMQ, and marks delivered.
3. If the RMQ publish fails, the poller retries — the event is never lost.

## Consequences

### Positive

- Durable message delivery — FCA rule update events survive broker restarts and consumer crashes.
- Dead-letter queue provides visibility into failed processing — critical for compliance (a silently dropped rule update is a regulatory breach).
- RMQ consumers can be scaled independently of the API in a future microservices split.
- The outbox pattern guarantees exactly-once delivery semantics from the application's perspective.

### Negative

- Adds operational dependency — RMQ must be monitored, backed up, and maintained.
- Outbox pattern adds complexity (poller, `pending_events` table, delivery tracking).
- Local development requires a running RMQ instance (mitigated by Docker Compose).

### Neutral

- NestJS has first-class RMQ support via `@nestjs/microservices` — minimal integration code.
- In the POC, a single RMQ instance is sufficient. Production should use a clustered deployment with mirrored queues.
- Consider migrating to Amazon SQS or Azure Service Bus if the firm moves to a managed cloud infrastructure.
