import Fastify from 'fastify';
import { createRequire } from 'node:module';

// ---------------------------------------------------------------------------
// Adapter selection
// Set ADAPTER=mock to run against in-memory state (no SQLite, useful for tests).
// Default is "sqlite" — the local persistent store.
// ---------------------------------------------------------------------------
const ADAPTER_TYPE = process.env.ADAPTER ?? 'sqlite';
const adapter = await import(`./adapters/${ADAPTER_TYPE}.js`);

// Load seed for scope enforcement
const require = createRequire(import.meta.url);
const SEED = require('../seed/clusters.json');

const PORT = process.env.PORT || 3001;
const HOST = '0.0.0.0';

// Build spotId → rcId lookup for scope enforcement
const SPOT_TO_RC = {};
for (const cluster of SEED.clusters) {
  for (const spot of cluster.spots) {
    SPOT_TO_RC[spot.id] = cluster.rcId;
  }
}

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
// Delegates persistence to the active adapter.
// ---------------------------------------------------------------------------
app.post('/api/checkins', async (req, reply) => {
  const sub = req.body;

  if (!sub?.id || !sub?.spotId || !sub?.month || !sub?.inputs) {
    return reply.code(400).send({ error: 'Missing required fields: id, spotId, month, inputs' });
  }

  // Scope enforcement: if submittedBy is set, it must own this spot
  if (sub.submittedBy) {
    const owningRc = SPOT_TO_RC[sub.spotId];
    if (owningRc && owningRc !== sub.submittedBy) {
      return reply.code(403).send({ error: 'Spot not in your cluster' });
    }
  }

  const result = await adapter.saveCheckin(sub);
  return reply.code(200).send(result);
});

// ---------------------------------------------------------------------------
// GET /api/network
// Returns derived clusters/spots. Delegates merge to the active adapter.
// ---------------------------------------------------------------------------
app.get('/api/network', async (_req, reply) => {
  const payload = await adapter.getNetwork();
  return reply.send(payload);
});

// ---------------------------------------------------------------------------
// GET /api/me
// ---------------------------------------------------------------------------
app.get('/api/me', async (req, reply) => {
  const rcId = req.headers['x-rc-id'] ?? null;
  const info = await adapter.getMe(rcId);
  return reply.send(info);
});

// ---------------------------------------------------------------------------
app.listen({ port: Number(PORT), host: HOST }, (err) => {
  if (err) { console.error(err); process.exit(1); }
  console.log(`Spot Pulse API running on http://localhost:${PORT} [adapter: ${ADAPTER_TYPE}]`);
});
