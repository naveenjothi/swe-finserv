# ADR-0003: PostgreSQL as Primary Data Store

_Status:_ Accepted

_Date:_ 2026-04-19

_Deciders:_ Engineering Team, CTO

## Context

SENTINEL requires a persistence layer that supports:

- Append-only immutable records (FCA compliance — NFR-08)
- JSONB storage for flexible rule set payloads (NFR-06)
- Relational integrity between onboarding records, audit entries, and rule versions
- Branch-level partitioning for multi-branch scale (NFR-11)
- ACID transactions for atomic record + audit log writes
- Full-text search across client records and audit logs

We need a database that can handle regulatory record-keeping requirements while remaining operationally simple for a small team.

## Decision

We will use **PostgreSQL** as the primary data store, accessed via **TypeORM** as the ORM layer within NestJS.

- PostgreSQL's JSONB support allows storing versioned rule set payloads without rigid schema changes when FCA updates criteria.
- Native table partitioning by `branch` supports the 4→15 branch scaling path.
- Row-level security (RLS) can enforce RBAC at the database level in production, complementing application-level guards.
- TypeORM integrates natively with NestJS and supports migrations, which are critical for auditable schema changes in a regulated environment.

### Key Schema Decisions

- `onboarding_records` table is **append-only** — no UPDATE or DELETE operations. Corrections insert a new row with `parent_id` referencing the original.
- `audit_log` table captures every state-changing action with `actor`, `timestamp`, `action`, and `diff` (JSONB).
- `rules_config` table stores versioned rule set snapshots — the worker inserts new rows, never overwrites.
- All tables include `created_at` (timestamptz) set by the database, not the application, to prevent clock manipulation.

## Consequences

### Positive

- ACID guarantees ensure a record and its audit entry are never out of sync.
- JSONB allows flexible rule set payloads without schema migrations for every FCA update.
- Table partitioning by branch is a native PostgreSQL feature — no application-level sharding logic needed.
- Mature ecosystem, excellent tooling, strong community support.

### Negative

- Operational overhead compared to SQLite or a managed NoSQL store for the POC phase.
- Append-only tables will grow without bound — a retention/archival strategy is needed before production.
- TypeORM's query builder can generate inefficient queries for complex audit log joins — may need raw SQL for reporting.

### Neutral

- A managed PostgreSQL instance (e.g. AWS RDS, Azure Database for PostgreSQL) is recommended for production to handle backups, failover, and encryption at rest.
- Database migrations must be version-controlled and applied through CI/CD — manual DDL changes are not acceptable in a regulated environment.
