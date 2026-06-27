/**
 * SQLite adapter — the reference (local-dev) implementation of the storage
 * interface. Extracted from server/index.js so the routes stay provider-agnostic.
 *
 * Interface contract — every adapter must export:
 *   saveCheckin(submission)  → CheckinResult | IdempotentResult
 *   getNetwork()             → NetworkPayload
 *   getMe(rcId)              → SessionInfo
 */

import db from '../db.js';
import { computePillars, scoreOf } from '../../shared/core/scoring.js';
import { mergeSubmissions } from '../../shared/core/merge.js';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const SEED = require('../../seed/clusters.json');

// ---------------------------------------------------------------------------
// saveCheckin
// ---------------------------------------------------------------------------

/**
 * @param {CheckinSubmission} sub
 * @returns {Promise<CheckinResult | IdempotentResult>}
 */
export async function saveCheckin(sub) {
  const existing = db.prepare('SELECT id FROM submissions WHERE id = ?').get(sub.id);
  if (existing) {
    return { id: sub.id, idempotent: true };
  }

  const pillars = computePillars(sub.inputs);
  const score   = scoreOf(pillars);

  const prior = db.prepare(
    'SELECT id FROM submissions WHERE spot_id = ? AND month = ? ORDER BY submitted_at DESC LIMIT 1'
  ).get(sub.spotId, sub.month);

  db.prepare(`
    INSERT INTO submissions (id, spot_id, month, submitted_by, submitted_at, source, inputs, received_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    sub.id,
    sub.spotId,
    sub.month,
    sub.submittedBy ?? null,
    sub.submittedAt,
    sub.source ?? 'app',
    JSON.stringify(sub.inputs),
    new Date().toISOString(),
  );

  return { id: sub.id, score, pillars, updated: !!prior };
}

// ---------------------------------------------------------------------------
// getNetwork
// ---------------------------------------------------------------------------

/**
 * @returns {Promise<NetworkPayload>}
 */
export async function getNetwork() {
  const rows = db.prepare('SELECT * FROM submissions ORDER BY submitted_at ASC').all();

  const submissions = rows.map(r => ({
    id:          r.id,
    spotId:      r.spot_id,
    month:       r.month,
    submittedBy: r.submitted_by,
    submittedAt: r.submitted_at,
    source:      r.source,
    inputs:      JSON.parse(r.inputs),
  }));

  const clusters = mergeSubmissions(SEED.clusters, submissions, SEED.months);

  return {
    months:    SEED.months,
    reporting: SEED.reportingMonth,
    clusters,
  };
}

// ---------------------------------------------------------------------------
// getMe
// ---------------------------------------------------------------------------

/**
 * SQLite adapter has no auth — always returns demo mode.
 * @returns {Promise<SessionInfo>}
 */
export async function getMe(_rcId) {
  return { mode: 'demo', rcId: null, clusterId: null };
}
