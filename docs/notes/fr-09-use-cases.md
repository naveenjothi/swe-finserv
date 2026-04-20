# FR-09 — Risk Classification Mismatch: Use Cases

> **FR-09:** The computed risk tier must be shown to the RM immediately and must be compared against any pre-existing `risk_classification` in the loaded CSV. A mismatch must be surfaced as a data-quality flag.

---

## UC-1: Bulk mismatch scan on CSV load

**Trigger:** App starts, CSV is parsed.

**What to do:**

- Run the rules engine over every row immediately after parse.
- Compare `computed_tier` vs `record.risk_classification` (the RM's manually recorded value).
- Store both values on the record object. Never mutate the original stored value — it is the historical RM entry.

**Output:** Records where they diverge get a `_mismatch: true` flag. The dashboard renders these with a warning badge.

**Edge case:** If `risk_classification` is missing or contains an unrecognised value in the CSV, treat it as a missing-field finding — not a mismatch.

---

## UC-2: Net-new record — no prior classification

**Trigger:** RM opens a blank intake form.

**What to do:**

- No comparison is needed. The rules engine computes the tier live as fields are completed; that computed value _is_ the authoritative classification.
- Do not show a mismatch state — there is nothing to compare against.

---

## UC-3: RM opens an existing record for review

**Trigger:** RM clicks into a CSV-loaded record.

**What to do:**

- Display the stored classification and the SENTINEL-computed value side by side.
- If they differ, surface a labelled callout: _"Recorded: MEDIUM — SENTINEL computes: HIGH"_.
- Require the RM to explicitly acknowledge the discrepancy before resubmitting.

**Audit implication:** The acknowledgement and resubmission must create a new audit entry referencing the original record. The original must not be silently overwritten (see NFR-08).

---

## UC-4: Field edit mid-review shifts the computed tier

**Trigger:** RM is reviewing an existing record and edits a field (e.g. toggles `pep_status` to TRUE).

**What to do:**

- Recompute the tier in real time on every field change (< 200 ms — see NFR-03).
- The stored-vs-computed comparison must update live:
  - If the edit resolves the mismatch, clear the warning immediately.
  - If the edit creates a new mismatch, surface it immediately.
- Do not wait for form submission to update the mismatch indicator.

---

## UC-5: Mismatch is a HIGH-risk downgrade — treat as critical

**Special case of UC-1 / UC-3:** The stored classification is LOW or MEDIUM but SENTINEL computes HIGH (e.g. a PEP that was recorded as LOW risk).

**What to do:**

- Render with the Error colour (`#9B2226`), not the Warning colour (`#E09F3E`).
- Show a distinct label: _"Potential compliance breach — EDD required."_
- Block KYC approval on this record until a compliance officer has reviewed and resolved the discrepancy.

**Why this matters:** A PEP or sanctions-matched client classified LOW is not a data quality issue — it is a material regulatory failure under MLR 2017.
