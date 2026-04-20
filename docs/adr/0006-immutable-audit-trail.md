# ADR-0006: Immutable Audit Trail Design

_Status:_ Accepted

_Date:_ 2026-04-19

_Deciders:_ Engineering Team, Head of Compliance, Internal Auditor

## Context

FCA regulations (MLR 2017, SYSC) require that all client onboarding records are **attributable** (who), **contemporaneous** (when), and **accurate** (what). Specifically:

- A record showing a PEP classified as LOW risk is a **material compliance failure**, not a data quality issue.
- Records with missing identity verification dates or incomplete documentation are **regulatory findings**.
- An auditor must be able to reconstruct the exact state of any record at any point in time, including which rules were in force.
- Corrections must never overwrite the original — they must create a new audit entry referencing it.

The audit trail is not a "nice to have" — it is a regulatory obligation that can result in FCA enforcement action if deficient.

## Decision

We will implement an **append-only, immutable audit trail** across two mechanisms:

### 1. Onboarding Records — Append-Only Table

The `onboarding_records` table permits only `INSERT` operations. No `UPDATE` or `DELETE` at the application level.

- **Corrections** create a new row with `record_type = 'CORRECTION'` and `parent_id` referencing the original record.
- **Reviews** create a new row with `record_type = 'REVIEW'` when an RM acknowledges a mismatch.
- Every row stores `rules_version` — the version of the rule set active at the time of assessment.
- `created_at` is set by the database (`DEFAULT NOW()`), not the application, to prevent clock manipulation.

Database-level enforcement:

```sql
-- Trigger to prevent UPDATE/DELETE on onboarding_records
CREATE OR REPLACE FUNCTION prevent_mutation() RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'onboarding_records is append-only. Use corrections.';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER no_update BEFORE UPDATE ON onboarding_records
  FOR EACH ROW EXECUTE FUNCTION prevent_mutation();
CREATE TRIGGER no_delete BEFORE DELETE ON onboarding_records
  FOR EACH ROW EXECUTE FUNCTION prevent_mutation();
```

### 2. Audit Log — Granular Action Log

The `audit_log` table captures every state-changing action across all bounded contexts:

| Field         | Purpose                                                                                             |
| ------------- | --------------------------------------------------------------------------------------------------- |
| `id`          | UUID primary key                                                                                    |
| `record_id`   | FK to the record affected                                                                           |
| `entity_type` | `ONBOARDING_RECORD`, `KYC_CASE`, `RULES_CONFIG`                                                     |
| `action`      | `SUBMIT`, `CORRECTION`, `KYC_UPDATE`, `EDD_ESCALATE`, `RULE_CHANGE_RESCAN`, `MISMATCH_ACKNOWLEDGED` |
| `actor`       | RM name, compliance officer, or `SYSTEM`                                                            |
| `timestamp`   | DB-generated `NOW()`                                                                                |
| `diff`        | JSONB before/after snapshot                                                                         |
| `notes`       | Free-text justification (required for KYC status changes)                                           |

### 3. Audit Reconstruction Guarantee

For any past assessment, an auditor can reconstruct:

- The exact field values recorded → `onboarding_records` row
- Who submitted it and when → `relationship_manager` + `created_at`
- Which rules were in force → `rules_version` → join to `rules_config.payload`
- What the system computed → `computed_tier` on the record
- Any subsequent corrections → `parent_id` chain
- KYC status changes → `audit_log` entries with `entity_type = KYC_CASE`

## Consequences

### Positive

- Full FCA compliance for record-keeping (MLR 2017, SYSC).
- Database-level triggers prevent accidental mutation even if application code has a bug.
- Audit reconstruction is a simple join — no log parsing or event sourcing replay required.
- `parent_id` chain provides clear lineage for corrections without losing the original.

### Negative

- Append-only tables grow without bound — requires a data retention and archival strategy.
- Corrections create duplicate-looking rows — the UI must clearly distinguish originals from corrections.
- DB triggers add a testing burden — integration tests must verify trigger behavior.

### Neutral

- Consider adding a `record_hash` (SHA-256 of all field values) to detect tampering at the application level.
- Archival policy should be defined with Compliance — FCA requires minimum 5-year retention for AML records.
- The audit log should be backed up separately and stored in a tamper-evident format for production.
