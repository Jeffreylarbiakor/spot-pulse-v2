# Spot Pulse v2

A mobile-first PWA for Regional Coordinators to track the health of community learning Spots. Each RC completes a 60-second monthly check-in per Spot; the app computes a 0-100 Spot Health Score with Green / Amber / Red status and rolls everything into a live network dashboard.

> **Disclaimer:** Spot Pulse is an independent concept by Jeffrey Larbi-Akor. It is not an official EduSpots product. Spot names, locations, and programmes are drawn from EduSpots' public materials; all activity figures are illustrative until wired to a real backend.

## What works today

- **Full 7-screen UI** with exact parity to the validated v1 reference build: Home dashboard, Spots directory, Spot detail, Check-in picker, 60-second check-in form, Success screen, About.
- **Real score computation:** on Save, `computePillars(inputs)` runs against the RC's actual form entries. The success screen shows the real score and delta — not a pre-set value.
- **IndexedDB persistence:** check-ins survive page reload. The dashboard and cluster bars recompute from stored submissions, not seed data. Each submission carries a `syncState: 'pending'` badge ready for the sync engine (M5).
- **Shared pure core:** `shared/core/scoring.js`, `rag.js`, and `selectors.js` are imported by the client and will be shared with the server and SMS parser — one `computePillars`, no duplication.

## Build milestones

| M | Milestone | Status |
|---|-----------|--------|
| M0 | Scaffold + tokens + module split | Done |
| M1 | Parity port of 7 screens | Done |
| M2 | Shared pure core + real scoring (N5) | Done |
| M3 | IndexedDB persistence | Done |
| M4 | Service worker + manifest (PWA installable, offline open) | Next |
| M5 | Sync engine + Pending / Syncing / Synced / Failed states | Pending |
| M6 | Backend API + append-only store + server-side scoring | Pending |
| M7 | RC accounts + cluster scoping + demo mode (N2) | Pending |
| M8 | Write-through adapter + documented mock (N3) | Pending |
| M9 | SMS/WhatsApp parser (N4) | Pending |
| M10 | Hardening: a11y, Lighthouse, secret scan | Pending |

M0-M3 deliver a fully working offline-capable app with real scoring and local persistence — a strong standalone demo even before the backend lands. M4 adds installability and true offline-open. M5 onward wires sync, accounts, and the EduSpots integration.

## Architecture

- **Client:** vanilla JS modules (Vite), IndexedDB via `idb`, Workbox service worker (M4)
- **Shared core:** `shared/core/` — `computePillars`, `rag`, and per-month selectors; imported by client, server (M6), and SMS parser (M9)
- **Backend:** Node/Fastify, append-only submissions store, idempotent `POST /checkins` (M6)
- **Scoring:** reference implementation pending EduSpots sign-off (see `shared/core/scoring.js`)

## Running locally

```bash
npm install
npm run dev   # http://localhost:5173
npm test      # unit + parity tests
```

## Limitations

- All metrics are illustrative — no live EduSpots data in this build.
- Scoring weights are a reference implementation; exact curves pending EduSpots confirmation.
- RAG Red/Amber boundary is 50 (recommended over 55) — see PRD §6.2.
- Sync engine not yet built: check-ins persist locally and show "Pending sync" but do not yet POST to a backend.
