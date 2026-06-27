/**
 * Mock adapter — in-memory implementation of the storage interface.
 *
 * PURPOSE
 * -------
 * This file serves two roles:
 *
 *   1. Integration contract for EduSpots engineering.
 *      When Spot Pulse is connected to the real EduSpots backend, replace this
 *      file with an adapter that makes HTTP/gRPC calls to EduSpots APIs while
 *      implementing the same three exported functions.
 *
 *   2. Fast test double.
 *      Set ADAPTER=mock in your environment to run the full server against
 *      in-memory state — no SQLite file, no migrations, instant reset.
 *
 * CONTRACT
 * --------
 * Every adapter must export:
 *
 *   saveCheckin(submission: CheckinSubmission): Promise<CheckinResult | IdempotentResult>
 *   getNetwork():                               Promise<NetworkPayload>
 *   getMe(rcId: string | null):                 Promise<SessionInfo>
 *
 * TYPE DEFINITIONS
 * ----------------
 *
 * CheckinSubmission {
 *   id:          string   // UUID, client-generated, doubles as idempotency key
 *   spotId:      string   // e.g. "tamale"
 *   month:       string   // "YYYY-MM"
 *   submittedBy: string | null  // rcId when signed in, null in demo mode
 *   submittedAt: string   // ISO-8601 datetime
 *   source:      string   // "app" | "sms" | "whatsapp"
 *   inputs: {
 *     daysOpen:    number
 *     hoursPerDay: number  // 0.5-hour steps
 *     sessions:    number
 *     attendance:  number
 *     sparks:      number
 *     rcCheckins:  number
 *     trainings:   number
 *     committee:   boolean
 *     dataOnTime:  boolean
 *     challenge:   boolean
 *     books:       number
 *     achievement: string  // optional free-text
 *   }
 * }
 *
 * CheckinResult {
 *   id:      string
 *   score:   number   // 0-100, server-computed from inputs
 *   pillars: { access: number, engagement: number, support: number, governance: number }
 *   updated: boolean  // true if this supersedes an earlier submission for same (spotId, month)
 * }
 *
 * IdempotentResult {
 *   id:         string
 *   idempotent: true   // submission id was already stored; no-op
 * }
 *
 * NetworkPayload {
 *   months:    string[]  // ["Apr 2026", ...]
 *   reporting: string    // "Jun 2026"
 *   clusters:  Cluster[] // seed clusters with merged pillars/scores/trends
 * }
 *
 * SessionInfo {
 *   mode:      "demo" | "rc"
 *   rcId:      string | null
 *   clusterId: string | null
 * }
 *
 * EDUSPOTS INTEGRATION NOTES
 * --------------------------
 * When replacing this mock with a real EduSpots adapter:
 *
 *   saveCheckin:
 *     - POST the submission to the EduSpots checkins endpoint.
 *     - EduSpots should return the server-computed score/pillars so Spot Pulse
 *       can display the authoritative score without recomputing on the client.
 *     - Idempotency: EduSpots should treat the submission `id` as the
 *       idempotency key and return { idempotent: true } for duplicates.
 *     - Write-through: if a local SQLite cache is desired for offline reads,
 *       call the SQLite adapter's saveCheckin() after a successful EduSpots write.
 *
 *   getNetwork:
 *     - GET merged cluster/spot data from EduSpots for the reporting month.
 *     - EduSpots owns the canonical merge logic; Spot Pulse's shared/core/merge.js
 *       is only used locally when EduSpots is unavailable.
 *
 *   getMe:
 *     - Validate the RC's session token against EduSpots identity service.
 *     - Return { mode: "rc", rcId, clusterId } on success.
 *     - Return { mode: "demo", rcId: null, clusterId: null } on missing/invalid token.
 */

import { computePillars, scoreOf } from '../../shared/core/scoring.js';
import { mergeSubmissions } from '../../shared/core/merge.js';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const SEED = require('../../seed/clusters.json');

// In-memory store — resets on process restart
const store = new Map(); // id → submission row

// ---------------------------------------------------------------------------
// saveCheckin
// ---------------------------------------------------------------------------

export async function saveCheckin(sub) {
  if (store.has(sub.id)) {
    return { id: sub.id, idempotent: true };
  }

  const pillars = computePillars(sub.inputs);
  const score   = scoreOf(pillars);

  // Check whether a prior submission exists for this (spotId, month)
  const prior = [...store.values()].find(
    r => r.spotId === sub.spotId && r.month === sub.month
  );

  store.set(sub.id, {
    id:          sub.id,
    spotId:      sub.spotId,
    month:       sub.month,
    submittedBy: sub.submittedBy ?? null,
    submittedAt: sub.submittedAt,
    source:      sub.source ?? 'app',
    inputs:      sub.inputs,
    receivedAt:  new Date().toISOString(),
  });

  return { id: sub.id, score, pillars, updated: !!prior };
}

// ---------------------------------------------------------------------------
// getNetwork
// ---------------------------------------------------------------------------

export async function getNetwork() {
  const submissions = [...store.values()].sort(
    (a, b) => a.submittedAt.localeCompare(b.submittedAt)
  );

  const clusters = mergeSubmissions(SEED.clusters, submissions, SEED.months);

  return {
    months:    SEED.months,
    reporting: SEED.reportingMonth,
    clusters,
  };
}

// ---------------------------------------------------------------------------
// getMe  (stub — real adapter would validate a token against EduSpots identity)
// ---------------------------------------------------------------------------

export async function getMe(_rcId) {
  return { mode: 'demo', rcId: null, clusterId: null };
}

// ---------------------------------------------------------------------------
// Test helpers (not part of the public adapter contract)
// ---------------------------------------------------------------------------

/** Clear all in-memory state between tests. */
export function _reset() {
  store.clear();
}

/** Inspect stored submissions (for assertions). */
export function _getAll() {
  return [...store.values()];
}
