# SENTINEL — Requirements

---

## 1. Functional Requirements

### 1.1 Client Intake Form

- FR-01: The RM must be able to log a new client onboarding assessment via a single-page web application without navigating away from the form.
- FR-02: The form must capture all 16 fields present in `client_onboarding.csv`: `client_id`, `branch`, `onboarding_date`, `client_name`, `client_type`, `country_of_tax_residence`, `annual_income`, `source_of_funds`, `pep_status`, `sanctions_screening_match`, `adverse_media_flag`, `risk_classification`, `kyc_status`, `id_verification_date`, `relationship_manager`, `documentation_complete`.
- FR-03: The form must block submission if any required field is empty. Missing fields must be visually flagged before the record is written. A record with missing fields must never be saved (regulatory finding risk).
- FR-04: Onboarding date and ID verification date must be recorded at point of intake (contemporaneous), not editable retrospectively without an audit entry.

### 1.2 SENTINEL Risk Classification Engine

- FR-05: On form completion, the system must automatically compute the risk tier (HIGH / MEDIUM / LOW) from the recorded data using the SENTINEL rules. The RM must not manually select the tier.
- FR-06: HIGH risk must be assigned if **any** of the following are true: `pep_status = TRUE`, `sanctions_screening_match = TRUE`, `adverse_media_flag = TRUE`, `country_of_tax_residence` ∈ {Russia, Belarus, Venezuela}.
- FR-07: MEDIUM risk must be assigned if no HIGH trigger applies and **any** of the following are true: `client_type = ENTITY`, `country_of_tax_residence` ∈ {Brazil, Turkey, South Africa, Mexico, UAE, China}, `annual_income > 500,000` **and** `source_of_funds` ∈ {Inheritance, Gift, Other}.
- FR-08: LOW risk must be assigned only if neither HIGH nor MEDIUM triggers apply.
- FR-09: The computed risk tier must be shown to the RM immediately and must be compared against any pre-existing `risk_classification` in the loaded CSV. A mismatch must be surfaced as a data-quality flag.
- FR-10: HIGH-risk clients must automatically set `kyc_status = ENHANCED_DUE_DILIGENCE` and display an EDD notice requiring senior compliance sign-off before the account can be activated.

### 1.3 CSV Data Loading and Dashboard

- FR-11: On application load, the system must parse `client_onboarding.csv` (~46 records from four branches) and display existing onboarding records in a filterable list/table.
- FR-12: The CSV data is not clean — the application must handle missing values, inconsistent casing, and classification mismatches gracefully, flagging dirty records without crashing.
- FR-13: Records must be filterable by `branch`, `risk_classification`, `kyc_status`, and `relationship_manager`.
- FR-14: Each record in the list must show, at a glance: client name, branch, risk tier, KYC status, and whether documentation is complete.

### 1.4 Audit View

- FR-15: Every saved record must carry a timestamp (date + time) of when it was created or last modified, and the name of the RM who submitted it (`relationship_manager`).
- FR-16: The audit view must show, per record: who assessed the client, when, what data was recorded, and what risk tier was computed — matching FCA "attributable, contemporaneous, accurate" requirements.
- FR-17: Records with `documentation_complete = FALSE` or missing `id_verification_date` must be visually distinguished in the audit view as open findings.

### 1.5 KYC Status Tracking

- FR-18: The system must display KYC status (APPROVED, PENDING, REJECTED, ENHANCED_DUE_DILIGENCE) per client and allow the compliance officer to update it with an audit-stamped reason.

---

## 2. Non-Functional Requirements

### 2.1 Usability and Performance

- NFR-01: End-to-end onboarding assessment — from opening the form to a saved record — must be completable in under 90 seconds for a trained RM.
- NFR-02: The application must be optimised for tablet browser at 1024×768 (iPad landscape). All interactive elements must have a minimum tap target of 44×44 px.
- NFR-03: The risk classification must be computed and displayed in real time as the RM completes the form fields, with no perceivable delay (< 200 ms).

### 2.2 Offline-First Operation

- NFR-04: The application must be functional without a network connection. Branch connectivity is unreliable; records must be writable offline and queued for sync when connectivity is restored.
- NFR-05: Offline-created records must be clearly marked as "pending sync" and must not be lost on page reload (local persistence required, e.g. IndexedDB or localStorage).

### 2.3 Configurable Rules Engine

- NFR-06: Risk classification thresholds (HIGH/MEDIUM trigger lists, income threshold, source-of-funds categories) must be driven by a configuration artefact (e.g. JSON file or database table) — **not** hardcoded. A sanctions list or FCA threshold update must not require a code deployment.
- NFR-07: Changes to the rules configuration must be versioned and timestamped so that the rules in force at the time of any past assessment can be reconstructed during an audit.

### 2.4 FCA Record-Keeping Compliance

- NFR-08: All records must be immutable once submitted. Corrections must create a new audit entry referencing the original record, not overwrite it.
- NFR-09: The data model must support access control — RMs can submit records; only compliance officers can approve/reject EDD cases or amend KYC status.
- NFR-10: The system must retain full field-level history: what was recorded, by whom, and when — sufficient to satisfy FCA SYSC and MLR 2017 record-keeping requirements.

### 2.5 Scalability

- NFR-11: The architecture must support scaling from 4 branches to 15 without structural change. Branch-specific filtering, per-branch RM assignment, and centralised compliance oversight must be first-class concerns.
- NFR-12: The prototype is a static front-end; the production architecture must assume a central API and database with branch-level data partitioning and role-based access control.

### 2.6 Visual and Brand

- NFR-13: The UI must use the Halcyon Capital Partners brand palette (Primary `#1B2A4A`, Success `#2D6A4F`, Warning `#E09F3E`, Error `#9B2226`) and Inter typeface as specified in the brand guidelines.
- NFR-14: Cards must use 8px border-radius, `0 1px 3px rgba(0,0,0,0.08)` shadow, 16px card gap, and 24px page padding.

---

## 3. Out of Scope (Prototype)

- Full authentication and session management (noted as production concern)
- Live sanctions list API integration (screened field is RM-declared in prototype)
- Backend persistence layer (CSV used as seed data; localStorage/IndexedDB for new records)
- Senior compliance sign-off workflow beyond EDD flag display
