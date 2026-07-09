# Spot Pulse v2

A mobile-first PWA for Regional Coordinators to track the health of community learning Spots. Each RC completes a 60-second monthly check-in per Spot; the app computes a 0-100 Spot Health Score with Green / Amber / Red status and rolls everything into a live network dashboard.

> **Disclaimer:** Spot Pulse is an independent concept by Jeffrey Larbi-Akor. It is not an official EduSpots product. Spot names, locations, and programmes are drawn from EduSpots' public materials; all activity figures are illustrative until wired to a real backend.

## What works today

- **Full 7-screen UI** — Home dashboard, Spots directory, Spot detail, Check-in picker, 60-second check-in form, Success screen, About. Accessible: contextual aria-labels, `role="img"` on charts, `aria-current="page"` on navigation, WCAG AA contrast throughout.
- **Real score computation** — `computePillars(inputs)` runs on save. The success screen shows the real score and delta vs the prior month.
- **PWA / offline-first** — installable on iOS and Android via the browser menu. Opens fully offline after first visit; Workbox pre-caches all assets. IndexedDB keeps check-ins across reloads.
- **Sync engine** — check-ins save locally as `pending`, then flush to the backend when online. The success screen shows a live Pending → Syncing → Synced / Failed badge with a Retry button on failure.
- **RC accounts + cluster scoping** — sign in as any of the 5 seed RCs. The Spots directory and Check-in picker filter to that RC's cluster. `submittedBy` is recorded on every submission; the server rejects cross-cluster writes with 403. Full network remains visible in demo mode without sign-in.
- **Backend API** — Fastify + SQLite append-only store. `POST /api/checkins` is idempotent on submission UUID. Server recomputes pillars/score from raw inputs and never trusts client-sent values. Storage is abstracted behind a three-function adapter interface — swap `ADAPTER=mock` for in-memory testing or `ADAPTER=eduspots` when the real backend is wired. See [`docs/integration-contract.md`](docs/integration-contract.md).
- **SMS/WhatsApp check-ins** — `POST /api/sms` accepts Africa's Talking and Twilio webhook shapes, parses the two-line SP format, and persists via the active adapter. Same scope enforcement and idempotency guarantees as the app flow.
- **Shared pure core** — `shared/core/` (`scoring.js`, `rag.js`, `selectors.js`, `merge.js`, `sms-parser.js`) is imported by both client and server — one implementation, no duplication.

## Build milestones

| M | Milestone | Status |
|---|-----------|--------|
| M0 | Scaffold + tokens + module split | Done |
| M1 | Parity port of 7 screens | Done |
| M2 | Shared pure core + real scoring | Done |
| M3 | IndexedDB persistence | Done |
| M4 | Service worker + manifest (PWA installable, offline-open) | Done |
| M5 | Sync engine + Pending / Syncing / Synced / Failed states | Done |
| M6 | Backend API + append-only store + server-side scoring | Done |
| M7 | RC accounts + cluster scoping + demo mode | Done |
| M8 | Write-through adapter + documented mock (EduSpots integration contract) | Done |
| M9 | SMS/WhatsApp parser | Done |
| M10 | Hardening: a11y, secret scan, README | Done |

## Architecture

```
spot-pulse-v2/
├── shared/core/            # Pure JS — imported by both client and server
│   ├── scoring.js          # computePillars(inputs) + scoreOf(pillars)
│   ├── rag.js              # RAG thresholds (Green ≥75, Amber 50-74, Red <50)
│   ├── selectors.js        # allSpots, findSpot, clusterAvg
│   ├── merge.js            # mergeSubmissions — last-write-wins per (spotId, month)
│   └── sms-parser.js       # parseSMS(raw) → { spotId, month, inputs }
├── src/
│   ├── auth/session.js     # localStorage session, RC_LIST, signIn/signOut
│   ├── data/
│   │   ├── store.js        # IndexedDB (idb), getClusters, saveSubmission
│   │   └── sync.js         # Flush pending → POST /api/checkins, sync state machine
│   └── ui/                 # Vanilla JS screens + components
├── server/
│   ├── index.js            # Fastify API — registers routes, selects adapter
│   ├── db.js               # better-sqlite3, WAL mode, append-only submissions table
│   ├── adapters/
│   │   ├── sqlite.js       # Default adapter — local SQLite store
│   │   └── mock.js         # In-memory adapter + EduSpots integration contract
│   └── routes/
│       └── sms.js          # POST /api/sms — SMS/WhatsApp webhook handler
├── docs/
│   └── integration-contract.md  # EduSpots API contract and implementation checklist
├── tests/
│   └── sms-parser.test.js  # 14 unit tests (node:test), all passing
└── seed/clusters.json      # 5 clusters, 16 Spots, seed check-in data
```

**Client:** Vanilla JS ES modules, Vite, IndexedDB via `idb`, Workbox service worker.  
**Backend:** Node 22, Fastify, better-sqlite3. DB at `/data/spot-pulse.db` (gitignored).  
**Scoring:** 4 pillars — Access 25, Engagement 20, Support 25, Governance 30.

## Running locally

```bash
# Install dependencies
npm install

# Start the Vite dev server (port 5173)
npm run dev

# Start the API server in a separate terminal (port 3001)
node server/index.js
```

Then open [http://localhost:5173](http://localhost:5173). The Vite proxy forwards `/api` requests to the backend automatically.

To try RC mode: tap **Sign in as RC →** in the amber session strip and choose any coordinator. The Spots directory and check-in picker will filter to their cluster.

## Limitations

- All metrics are illustrative — no live EduSpots data in this build.
- Sign-in is a stub (pick from a list); production would use a real identity provider.
- Scoring weights are a reference implementation; exact curves pending EduSpots confirmation.
- RAG Red/Amber boundary is 50 — see PRD 6.2.
- SMS gateway integration (Africa's Talking / Twilio webhook wiring) is not configured; the `/api/sms` endpoint is ready to receive webhooks once a number is provisioned.
