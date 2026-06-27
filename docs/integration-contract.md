# Spot Pulse × EduSpots — Integration Contract

This document defines what a real EduSpots backend would need to provide for Spot Pulse to drop its local SQLite store and operate against live data. It is written for EduSpots engineering and does not require knowledge of Spot Pulse internals.

---

## Overview

Spot Pulse currently ships with a local Fastify + SQLite backend (`server/adapters/sqlite.js`) and an in-memory mock (`server/adapters/mock.js`). Both implement the three-function adapter interface below. Connecting to EduSpots means writing a third adapter — `server/adapters/eduspots.js` — that calls real EduSpots APIs while exposing the same interface.

The active adapter is selected at boot via `ADAPTER` env var:

```
ADAPTER=sqlite  node server/index.js   # default — local SQLite
ADAPTER=mock    node server/index.js   # in-memory, resets on restart
ADAPTER=eduspots node server/index.js  # real EduSpots (to be built)
```

---

## Adapter Interface

```js
// server/adapters/<name>.js must export these three functions:

saveCheckin(submission: CheckinSubmission): Promise<CheckinResult | IdempotentResult>
getNetwork():                               Promise<NetworkPayload>
getMe(rcId: string | null):                 Promise<SessionInfo>
```

---

## Type Definitions

### CheckinSubmission (sent by Spot Pulse → EduSpots)

```json
{
  "id":          "550e8400-e29b-41d4-a716-446655440000",
  "spotId":      "tamale",
  "month":       "2026-06",
  "submittedBy": "rc-003",
  "submittedAt": "2026-06-27T10:45:00.000Z",
  "source":      "app",
  "inputs": {
    "daysOpen":    18,
    "hoursPerDay": 3,
    "sessions":    8,
    "attendance":  142,
    "sparks":      6,
    "rcCheckins":  1,
    "trainings":   1,
    "committee":   true,
    "dataOnTime":  true,
    "challenge":   false,
    "books":       54,
    "achievement": "12 girls joined the new coding club"
  }
}
```

| Field | Type | Notes |
|---|---|---|
| `id` | UUID string | Client-generated. Also used as idempotency key. |
| `spotId` | string | Stable identifier matching EduSpots' Spot registry. |
| `month` | `YYYY-MM` | Reporting month. |
| `submittedBy` | string \| null | RC identifier. null in demo / unauthenticated mode. |
| `submittedAt` | ISO-8601 | Client-local time the RC pressed Save. |
| `source` | `"app"` \| `"sms"` \| `"whatsapp"` | Submission channel. |
| `inputs.*` | see above | Raw form values. Spot Pulse never sends pre-computed scores. |

### CheckinResult (EduSpots → Spot Pulse)

```json
{
  "id":      "550e8400-e29b-41d4-a716-446655440000",
  "score":   83,
  "pillars": { "access": 21, "engagement": 17, "support": 25, "governance": 20 },
  "updated": false
}
```

| Field | Type | Notes |
|---|---|---|
| `score` | 0-100 | **Server-computed.** Spot Pulse does not trust client-sent scores. |
| `pillars` | object | Per-pillar breakdown shown on the success screen. |
| `updated` | boolean | true if this supersedes an earlier submission for the same (spotId, month). |

### IdempotentResult

```json
{ "id": "550e8400-...", "idempotent": true }
```

Return this (HTTP 200) when the same `id` is submitted more than once. Do not insert a duplicate.

### NetworkPayload (EduSpots → Spot Pulse)

```json
{
  "months":    ["Apr 2026", "May 2026", "Jun 2026"],
  "reporting": "Jun 2026",
  "clusters": [ ...cluster objects with merged pillars and trends... ]
}
```

The `clusters` array should match the seed schema at `seed/clusters.json` with `pillars`, `score`, `trend`, and `induction` fields merged in per-Spot. See `shared/core/merge.js` for the reference merge algorithm (last-write-wins per `(spotId, month)`).

### SessionInfo

```json
{ "mode": "rc", "rcId": "rc-003", "clusterId": "rc-003" }
```

Return `{ "mode": "demo", "rcId": null, "clusterId": null }` for unauthenticated requests.

---

## Scoring Reference

Spot Pulse computes scores in `shared/core/scoring.js`. EduSpots should use the same weights or agree on authoritative weights — whichever side computes the score is the source of truth and must be consistent.

| Pillar | Weight | Key inputs |
|---|---|---|
| Access | 25 | daysOpen, hoursPerDay |
| Engagement | 20 | sessions, attendance, sparks |
| Support | 25 | rcCheckins, trainings |
| Governance | 30 | committee, dataOnTime, challenge |

RAG thresholds: **Green ≥ 75**, **Amber 50–74**, **Red < 50** (PRD §6.2).

---

## Error Handling

| HTTP status | Meaning |
|---|---|
| 200 | Success (new or idempotent) |
| 400 | Missing required fields |
| 403 | `submittedBy` doesn't own `spotId` (cross-cluster write attempt) |
| 409 | *(optional)* Conflict — server has a newer record for (spotId, month) |
| 5xx | Spot Pulse will retry the submission on next app-foreground / reconnect |

---

## Write-Through Pattern

When Spot Pulse checks in offline and syncs later, the sequence is:

1. Client saves to IndexedDB with `syncState: "pending"`.
2. On reconnect, client POSTs to `/api/checkins`.
3. EduSpots adapter calls EduSpots API.
4. On success, optionally mirror to local SQLite for offline reads.
5. Adapter returns `CheckinResult`; Spot Pulse updates IndexedDB to `syncState: "synced"`.

If EduSpots returns 5xx, Spot Pulse marks the submission `failed` and retries on the next visibility/online event. The `id` idempotency key makes retries safe.

---

## Implementation Checklist

- [ ] `POST /api/checkins` — accepts `CheckinSubmission`, returns `CheckinResult | IdempotentResult`
- [ ] `GET /api/network` — returns `NetworkPayload` with merged clusters
- [ ] `GET /api/me` — validates RC token, returns `SessionInfo`
- [ ] Idempotency on submission `id`
- [ ] Server-side score computation (do not trust client `score`/`pillars`)
- [ ] Cross-cluster scope enforcement (403 for mismatched `submittedBy`)
- [ ] 5xx retries handled by Spot Pulse automatically
