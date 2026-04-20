# ADR-0007: Versioned Rules Engine Configuration

_Status:_ Accepted

_Date:_ 2026-04-19

_Deciders:_ Engineering Team, Head of Compliance, CTO

## Context

The SENTINEL risk classification engine must compute risk tiers using configurable thresholds (NFR-06). These thresholds include:

- HIGH-risk country list (currently: Russia, Belarus, Venezuela)
- MEDIUM-risk country list (currently: Brazil, Turkey, South Africa, Mexico, UAE, China)
- Income threshold for MEDIUM trigger (currently: > £500,000)
- Source-of-funds categories that combine with income for MEDIUM (currently: Inheritance, Gift, Other)
- Boolean flags: PEP, sanctions match, adverse media

These values change when the FCA updates guidance, HMT amends sanctions lists, or the firm updates its internal risk appetite. Changes must:

1. Take effect without a code deployment (NFR-06).
2. Be versioned and timestamped so any past assessment can be reconstructed with the exact rules in force (NFR-07).
3. Not introduce downtime or inconsistency during the transition.

## Decision

We will implement a **versioned rules configuration store** backed by a PostgreSQL table, with the rules engine consuming the active version at runtime.

### Rules Config Schema

```
rules_config
├── id            (uuid, PK)
├── version       (string, e.g. "1.0.0" or "2026-04-19T14:30:00Z")
├── valid_from    (timestamptz — when this version takes effect)
├── valid_to      (timestamptz, nullable — NULL means currently active)
├── payload       (jsonb — full rule set snapshot)
├── source        (string — "FCA_WEBHOOK" | "MANUAL_UPLOAD" | "SEED")
├── created_by    (string — actor who created this version)
└── created_at    (timestamptz, DB default)
```

### Payload Structure (JSONB)

```json
{
  "high_risk": {
    "countries": ["Russia", "Belarus", "Venezuela"],
    "boolean_flags": [
      "pep_status",
      "sanctions_screening_match",
      "adverse_media_flag"
    ]
  },
  "medium_risk": {
    "countries": ["Brazil", "Turkey", "South Africa", "Mexico", "UAE", "China"],
    "client_types": ["ENTITY"],
    "income_threshold": 500000,
    "income_source_of_funds": ["Inheritance", "Gift", "Other"]
  }
}
```

### Version Lifecycle

1. **New version insertion**: The RMQ worker (or manual upload endpoint) inserts a new row. The previous active version gets its `valid_to` set to the new version's `valid_from`.
2. **Active version resolution**: `SELECT * FROM rules_config WHERE valid_from <= NOW() AND (valid_to IS NULL OR valid_to > NOW()) ORDER BY valid_from DESC LIMIT 1`.
3. **Assessment-time binding**: When a record is classified, the `rules_config.id` is stored as `rules_version` on the `onboarding_records` row. This creates an immutable link to the exact rules used.
4. **Audit reconstruction**: `SELECT rc.payload FROM rules_config rc JOIN onboarding_records r ON r.rules_version = rc.id WHERE r.id = :record_id`.

### Caching

The active rules config is cached in-memory (NestJS provider scope: singleton) and refreshed:

- On application startup
- When the RMQ worker processes a `fca.rules.updated` event
- Via a cache-invalidation event emitted after a new version is inserted

The rules engine function itself receives the config as a parameter — it never reads from the database directly. This keeps it pure and testable.

## Consequences

### Positive

- FCA threshold changes require zero code deployment — a config insert is sufficient.
- Every past assessment is fully reconstructable — the exact rules used are linked by `rules_version`.
- The rules engine remains a pure function — receives config as input, returns a tier. Fully unit-testable.
- Version history provides a complete timeline of regulatory changes for compliance reporting.

### Negative

- Cache invalidation across multiple monolith instances requires coordination (pub/sub or shared cache).
- JSONB payload validation must be enforced at the application level — PostgreSQL won't reject a malformed payload.
- Schema evolution of the payload structure requires careful migration of existing versions.

### Neutral

- A JSON Schema validator should validate the payload structure on insert to prevent malformed configs from entering the system.
- Consider signing the payload (e.g. with a compliance officer's key) to prevent unauthorized modifications in production.
- The seed rule set (from the problem statement) should be inserted as version "1.0.0" with `source = "SEED"` during database initialization.
