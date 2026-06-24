# Spot Pulse v2

A mobile-first PWA for Regional Coordinators to track the health of community learning Spots.

> **Disclaimer:** Spot Pulse is an independent concept by Jeffrey Larbi-Akor. It is not an official EduSpots product. Spot names, locations, and programmes are drawn from EduSpots' public materials; all activity figures are illustrative until wired to a real backend.

## Status

Build in progress. v2 adds offline-first PWA, RC accounts, write-through to EduSpots, and SMS/WhatsApp fallback capture on top of the validated v1 prototype.

## Architecture

- **Client:** vanilla JS modules, IndexedDB, Workbox service worker
- **Shared core:** `shared/core/` — `computePillars`, `rag`, and per-month selectors imported by client, server, and SMS parser
- **Backend:** Node (Fastify), append-only submissions store, idempotent `POST /checkins`
- **Scoring:** reference implementation pending EduSpots sign-off (see `shared/core/scoring.js`)

## Build milestones

| M | Milestone | Status |
|---|-----------|--------|
| M0 | Scaffold + tokens + module split | In progress |
| M1 | Parity port of 7 screens | Pending |
| M2 | Shared pure core + real scoring (N5) | Pending |
| M3 | IndexedDB persistence | Pending |
| M4 | Service worker + manifest (N1) | Pending |
| M5 | Sync engine + visible states | Pending |
| M6 | Backend API + append-only store | Pending |
| M7 | RC accounts + cluster scoping + demo mode (N2) | Pending |
| M8 | Write-through adapter + documented mock (N3) | Pending |
| M9 | SMS/WhatsApp parser (N4) | Pending |
| M10 | Hardening: a11y, perf, secret scan | Pending |

## Limitations

- All metrics illustrative — no live EduSpots data in this demo.
- Scoring weights are a reference implementation; exact curves pending EduSpots confirmation.
- RAG Red/Amber boundary set to 50 (recommended) — see PRD §6.2.
