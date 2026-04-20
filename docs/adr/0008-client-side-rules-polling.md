# ADR-0008: Client-Side Rules Polling over Server Push

_Status:_ Accepted

_Date:_ 2026-04-19

_Deciders:_ Engineering Team, CTO, Head of Compliance

## Context

Offline operation is a first-class requirement (NFR-04, NFR-05). Branch connectivity is unreliable. When an RM's device loses connectivity:

- WebSocket connections drop immediately.
- Any push-based mechanism for delivering updated classification rules (e.g. `rules.updated` WebSocket event) stops working.
- The RM may continue filling in assessment forms offline for an unknown duration.

If rule updates are only delivered via push, offline users silently classify clients against a potentially stale rule set — with no way of knowing the rules have changed and no warning in the UI. This is an FCA compliance risk: a classification computed with outdated rules is still recorded as authoritative.

We considered two options:

| Option                 | Description                                                                                                     | Offline behaviour                                                                          |
| ---------------------- | --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| **Push (WebSocket)**   | Server emits `rules.updated` event when a new version is activated                                              | Rules never reach offline clients; device stays on stale version silently                  |
| **Poll (hourly HTTP)** | Client polls `GET /api/rules/version` every hour; downloads new payload if version changed; stores in IndexedDB | Works offline for up to 1 hour after last successful poll; UI warns RM when cache is stale |

## Decision

We will use **hourly client-side polling** as the primary mechanism for distributing rule set updates to the browser client. Server-push (WebSocket) is **not used** for rule distribution.

### Polling Protocol

1. On application start, the client fetches the current rules version from `GET /api/rules/version` and compares against the locally cached version in IndexedDB.
2. A `setInterval` runs every **60 minutes** (`RULES_POLL_INTERVAL_MS = 3_600_000`).
3. Each poll calls `GET /api/rules/version` (lightweight — returns only `{ version, valid_from }`, not the full payload).
4. If the returned `version` differs from the cached version, the client fetches the full payload via `GET /api/rules/current` and writes it to IndexedDB under the key `sentinel_rules_cache`.
5. If the poll fails (offline), the error is swallowed silently. The existing cached version continues to be used.

### Client Cache Structure (IndexedDB)

```json
{
  "key": "sentinel_rules_cache",
  "version": "2026-04-19T14:30:00Z",
  "valid_from": "2026-04-19T14:30:00Z",
  "payload": { ... },
  "cached_at": "2026-04-19T15:00:00Z"   ← wall-clock time the cache was written
}
```

### Stale Cache Warning

If the device is **offline** AND `cached_at` is more than **1 hour** ago, the UI renders a non-blocking warning banner:

> "Classification rules were last updated X hours ago. Connect to the network to check for regulatory updates."

This satisfies the FCA requirement to surface the possibility of outdated classification to the RM without blocking the workflow.

### Stale-Cache Flag on Sync

When a pending-sync record reaches the server, the `sync/batch` endpoint compares the `rules_version` embedded in the record against the currently active server-side version. If they differ, the server:

1. Re-classifies the record using the current server-side rules.
2. Records both the client-computed tier (from the offline record) and the server-recomputed tier.
3. If they differ, treats it as a classification mismatch (FR-09) and creates an audit entry with `action: RULE_VERSION_MISMATCH`.

### Server-Side Endpoint for Polling

`GET /api/rules/version` — public to authenticated clients, lightweight, cacheable by CDN:

```json
{
  "version": "2026-04-19T14:30:00Z",
  "valid_from": "2026-04-19T14:30:00Z"
}
```

The `ETag` header is set to the `version` value. Clients should send `If-None-Match` to avoid downloading the same version twice. The server returns `304 Not Modified` if the version is unchanged.

## Consequences

### Positive

- Rule updates reach offline clients as soon as they reconnect — the first poll after reconnection picks up any missed version.
- No WebSocket dependency for rule distribution — reduces infrastructure complexity and eliminates a whole class of push-delivery failures.
- The 1-hour polling window is a known, bounded window of potential staleness — the RM is warned when it exceeds this threshold.
- Stale-version detection on sync ensures the server always has the final say on classification — the client's offline computation is a convenience, not the authoritative value.
- `GET /api/rules/version` is a tiny, CDN-cacheable response — negligible server load even with many clients polling.

### Negative

- A rule update (e.g. a sanctions list change) may not reach an online client for up to 1 hour after the server activates it. This is an accepted bounded risk.
- If the FCA publishes a rule update and an RM submits a record within the 1-hour poll window, the record will be re-classified on sync — the RM will not have seen the correct tier in real time.
- The 1-hour interval is a product decision, not a technical constraint. Compliance must formally accept the bounded staleness window.

### Neutral

- The `rules.updated` WebSocket event is removed from the client-side architecture. The WebSocket gateway is retained only for `edd.escalation` and `rescan.progress` notifications to the compliance dashboard.
- The poll interval can be made configurable (`RULES_POLL_INTERVAL_MS`) without a code deployment.
- If the bounded staleness window becomes unacceptable (e.g. FCA mandates immediate propagation), the polling interval can be shortened or replaced with Server-Sent Events (SSE) — the IndexedDB cache structure does not change.
