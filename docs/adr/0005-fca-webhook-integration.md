# ADR-0005: FCA Webhook Integration for Regulatory Updates

_Status:_ Accepted

_Date:_ 2026-04-19

_Deciders:_ Engineering Team, Head of Compliance, CTO

## Context

The SENTINEL risk classification engine relies on configurable thresholds: HIGH-risk country lists (currently Russia, Belarus, Venezuela), MEDIUM-risk country lists, income thresholds, and source-of-funds categories. These thresholds change when:

- The FCA updates its guidance on client risk-tiering.
- HM Treasury / OFSI amends the UK sanctions list.
- The firm's own compliance policy evolves.

Currently, threshold changes require a code deployment (hardcoded values). The system must support **zero-downtime rule updates** where a config change is sufficient — no code deployment, no application restart.

We are assuming the FCA provides a webhook notification service for regulatory updates. The system must consume these events, update its rule configuration, and re-evaluate all existing records against the new rules.

## Decision

We will implement a **dedicated FCA webhook endpoint** (`POST /fca/webhook`) that receives regulatory update notifications, validates their authenticity, and publishes them to RabbitMQ for asynchronous processing.

### Webhook Security

- **HMAC-SHA256 signature verification**: Every incoming webhook payload must include an `X-FCA-Signature` header containing an HMAC-SHA256 digest of the request body, computed with a shared secret.
- The shared secret is stored as an environment variable (`FCA_WEBHOOK_SECRET`) — never in code or version control.
- Requests with missing or invalid signatures return `401 Unauthorized` and are logged as security events.
- IP allowlisting as an additional layer if FCA provides a known egress IP range.

### Webhook Payload Processing

```
POST /fca/webhook
  │
  ├── 1. Verify HMAC-SHA256 signature
  ├── 2. Parse and validate payload schema
  ├── 3. Write to `pending_events` table (transactional outbox)
  ├── 4. Return 202 Accepted (acknowledge receipt before processing)
  └── 5. Outbox poller publishes to RMQ → RulesUpdateWorker
```

### Idempotency

Each FCA webhook payload must include a unique `event_id`. The system deduplicates by checking `event_id` against processed events before inserting into the outbox. This prevents duplicate rule updates from retried webhook deliveries.

## Consequences

### Positive

- Rule updates are applied without code deployment or application restart.
- HMAC verification prevents unauthorized payloads from modifying the rules engine (OWASP A01:2021 — Broken Access Control).
- 202 Accepted response pattern ensures the webhook doesn't time out waiting for the re-classification scan to complete.
- Idempotency handling prevents duplicate rule versions from retried deliveries.

### Negative

- Dependency on FCA webhook availability — if the FCA webhook service is down, we miss updates until they retry.
- Must maintain the shared secret rotation process with FCA.
- Webhook endpoint is an attack surface — must be monitored for abuse (rate limiting, alerting on signature failures).

### Neutral

- A manual upload endpoint (`POST /rules/upload`) should exist as a fallback for rule updates when the webhook is unavailable or for firm-internal policy changes.
- Webhook signature failures should trigger security alerts to the operations team.
- Consider adding a scheduled poll of a public FCA API as a secondary sync mechanism (belt and braces).
