import Fastify from 'fastify';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';
import db from './db.js';
import { computePillars, scoreOf } from '../shared/core/scoring.js';
import { mergeSubmissions } from '../shared/core/merge.js';

// Load seed data (JSON import needs createRequire in ESM with Node <22.12)
const require = createRequire(import.meta.url);
const SEED = require('../seed/clusters.json');

const PORT = process.env.PORT || 3001;
const HOST = '0.0.0.0';

const app = Fastify({ logger: false });

// --- CORS (dev: allow Vite origin) ---
app.addHook('onRequest', (req, reply, done) => {
  reply.header('Access-Control-Allow-Origin', '*');
  reply.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  reply.header('Access-Control-Allow-Headers', 'Content-Type, Idempotency-Key');
  if (req.method === 'OPTIONS') { reply.code(204).send(); return; }
  done();
});

// ---------------------------------------------------------------------------
// POST /api/checkins
// Idempotent on submission.id (also accepted as Idempotency-Key header).
// Persists append-only. Recomputes pillars/score server-side from inputs.
// Returns 200 for new records, 200 + updated:true when a later submission
// for the same (spotId, month) supersedes an earlier one.
// ---------------------------------------------------------------------------
app.post('/api/checkins', async (req, reply) => {
  const sub = req.body;

  if (!sub?.id || !sub?.spotId || !sub?.month || !sub?.inputs) {
    return reply.code(400).send({ error: 'Missing required fields: id, spotId, month, inputs' });
  }

  // Idempotency: same id already stored — return the existing record
  const existing = db.prepare('SELECT id FROM submissions WHERE id = ?').get(sub.id);
  if (existing) {
    return reply.code(200).send({ id: sub.id, idempotent: true });
  }

  // Server-side recompute — never trust client-sent pillars/score
  const pillars = computePillars(sub.inputs);
  const score   = scoreOf(pillars);

  // Is there already a submission for this (spotId, month)?
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

  return reply.code(200).send({
    id:      sub.id,
    score,
    pillars,
    updated: !!prior,  // true when this supersedes an earlier submission
  });
});

// ---------------------------------------------------------------------------
// GET /api/network?month=YYYY-MM
// Returns derived clusters/spots for the given month (or the latest if omitted).
// Merges all stored submissions onto seed data using shared mergeSubmissions.
// ---------------------------------------------------------------------------
app.get('/api/network', async (req, reply) => {
  const rows = db.prepare('SELECT * FROM submissions ORDER BY submitted_at ASC').all();

  // Reshape DB rows to CheckinSubmission shape expected by mergeSubmissions
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

  return reply.send({
    months:    SEED.months,
    reporting: SEED.reportingMonth,
    clusters,
  });
});

// ---------------------------------------------------------------------------
// GET /api/me  — stub until M7 (RC accounts)
// ---------------------------------------------------------------------------
app.get('/api/me', async (req, reply) => {
  return reply.send({ mode: 'demo', rcId: null, clusterId: null });
});

// ---------------------------------------------------------------------------
app.listen({ port: Number(PORT), host: HOST }, (err) => {
  if (err) { console.error(err); process.exit(1); }
  console.log(`Spot Pulse API running on http://localhost:${PORT}`);
});
