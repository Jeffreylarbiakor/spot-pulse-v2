# Spot Pulse v2 — Session Handoff

**Project:** `/Users/jeffrey/Documents/Projects/spot-pulse-v2`
**GitHub:** https://github.com/Jeffreylarbiakor/spot-pulse-v2
**Last commit:** M1+M2 (`cf4d82d`) — all 7 screens + real scoring wired

---

## What has been built

### M0 — Scaffold (committed)
Directory structure per TRD §17. Design tokens, component CSS, router, PWA stub, Vite dev server. `npm run dev` starts on port 5173.

### M1 — All 7 screens (committed)
Full parity port from `reference/SpotPulse.html`. Exact EduSpots token palette (green-500 `#006B38`, paper `#FBFAF6`). All screens render correctly and have been screenshot-verified:
- Home dashboard (stat grid, RAG donut, cluster bars, month selector pills)
- Spots directory (cluster headers, spot rows with RAG chips)
- Spot detail (score ring, pillar breakdown, 3-month trend, identity grid)
- Check-in picker
- 60-second check-in form (steppers, toggles, numeric inputs, sticky Save bar)
- Success screen
- About + roadmap

### M2 — Shared pure core + real scoring N5 (committed, same commit as M1)
`shared/core/rag.js` — RAG_RED_MAX = 50 (single constant, PRD §6.2 resolved as recommended).
`shared/core/scoring.js` — `computePillars(inputs)` reference implementation. Support (60/40) and Governance (10/10/10) anchored to v1 Excel. Access and Engagement targets documented as assumptions pending EduSpots sign-off.
`shared/core/selectors.js` — `networkStats`, `clusterAvgs`, `avg`, `allSpots`, `findSpot` — pure, shared by client and server.
Success screen calls `computePillars()` on Save so score and delta reflect actual RC inputs, not pre-set seed values.

### Not yet built (M3 onward)
- **M3** — IndexedDB persistence (next)
- **M4** — Service worker + manifest (PWA installable, offline open)
- **M5** — Sync engine (Pending/Syncing/Synced/Failed states)
- **M6** — Backend API (Node/Fastify, append-only store, server-side scoring)
- **M7** — RC accounts + cluster scoping + demo mode
- **M8** — Write-through adapter + mock (EduSpots integration contract)
- **M9** — SMS/WhatsApp parser
- **M10** — Hardening (a11y, Lighthouse, secret scan)

---

## Key files and structure

```
spot-pulse-v2/
  index.html                    — app shell, Vite entry
  vite.config.js
  package.json                  — "type": "module", vite + vitest
  seed/clusters.json            — 5 clusters, 16 Spots, seed data fixture
  reference/SpotPulse.html      — original reference build (parity source)
  reference/DeveloperHandoff.html — token/component spec sheet
  shared/core/
    rag.js                      — rag(score), RAG_RED_MAX=50
    scoring.js                  — computePillars(inputs), scoreOf(pillars), TARGETS config
    selectors.js                — networkStats, clusterAvgs, findSpot, allSpots, avg
  src/
    main.js                     — app entry, router wiring, render() function
    data/store.js               — in-memory store from seed JSON (M3 replaces with IndexedDB)
    styles/tokens.css           — full EduSpots token :root block
    styles/components.css       — all component styles (exact reference parity)
    ui/
      router.js                 — tab/sub state, navTo, openSub, closeSub, isFlow, onRoute
      helpers.js                — esc(), icon(), ringSVG(), donutSVG(), disclaimerHTML()
      components/
        tabbar.js               — bottom tab bar + raised FAB
        topbar.js               — renderTopbar() + renderSubbar()
      screens/
        home.js                 — renderHome(monthIndex)
        spots.js                — renderSpots()
        detail.js               — renderDetail(spotId)
        picker.js               — renderPicker()
        checkin.js              — renderCheckin(spotId), exports formModel
        success.js              — renderSuccess(spotId) — calls computePillars()
        about.js                — renderAbout()
```

---

## M3 — What to build next

**Goal:** Check-ins persist to IndexedDB. Reload keeps them. Dashboard derives scores from stored submissions rather than seed pillars.

### Steps

**1. Install `idb`** (thin IndexedDB wrapper per TRD §3):
```bash
npm install idb
```

**2. Rewrite `src/data/store.js`** to use IndexedDB:

```js
import { openDB } from 'idb';
import SEED from '../../seed/clusters.json' assert { type: 'json' };

const DB_NAME = 'spot-pulse';
const DB_VERSION = 1;

let _db;
async function db() {
  if (!_db) _db = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      db.createObjectStore('submissions', { keyPath: 'id' });
      db.createObjectStore('network', { keyPath: 'id' });
    }
  });
  return _db;
}

export const MONTHS = SEED.months;
export const REPORTING_MONTH = SEED.reportingMonth;

// Returns seed clusters merged with any stored submissions
export async function getClusters() {
  // For M3: return seed clusters but override pillars/trend from stored submissions
  const store = await db();
  const submissions = await store.getAll('submissions');
  return mergeSubmissions(SEED.clusters, submissions);
}

export function getClustersSync() {
  // Sync fallback for initial render — returns seed data
  return SEED.clusters;
}

export async function saveSubmission(submission) {
  const store = await db();
  await store.put('submissions', submission);
}

export async function getSubmissions() {
  const store = await db();
  return store.getAll('submissions');
}
```

**3. Create `src/data/merge.js`** — merge stored submissions onto seed clusters:
```js
import { computePillars, scoreOf } from '../../shared/core/scoring.js';
import { MONTHS } from './store.js';

export function mergeSubmissions(clusters, submissions) {
  // Group latest submission per (spotId, month)
  const latest = new Map();
  for (const sub of submissions) {
    const key = `${sub.spotId}:${sub.month}`;
    const existing = latest.get(key);
    if (!existing || sub.submittedAt > existing.submittedAt) latest.set(key, sub);
  }

  return clusters.map(cluster => ({
    ...cluster,
    spots: cluster.spots.map(spot => {
      // Build new trend from submissions
      const trend = MONTHS.map((_, i) => {
        const monthKey = monthToKey(MONTHS[i]);
        const sub = latest.get(`${spot.id}:${monthKey}`);
        if (sub) return scoreOf(computePillars(sub.inputs));
        return spot.trend[i]; // fall back to seed
      });
      const latestScore = trend[trend.length - 1];
      const latestPillars = (() => {
        const monthKey = monthToKey(MONTHS[MONTHS.length - 1]);
        const sub = latest.get(`${spot.id}:${monthKey}`);
        return sub ? computePillars(sub.inputs) : spot.pillars;
      })();
      return { ...spot, pillars: latestPillars, trend };
    }),
  }));
}

function monthToKey(label) {
  // 'Jun 2026' -> '2026-06'
  const [mon, year] = label.split(' ');
  const months = { Jan:'01',Feb:'02',Mar:'03',Apr:'04',May:'05',Jun:'06',Jul:'07',Aug:'08',Sep:'09',Oct:'10',Nov:'11',Dec:'12' };
  return `${year}-${months[mon]}`;
}
```

**4. Update `src/ui/screens/checkin.js`** — on Save, build a `CheckinSubmission` and call `saveSubmission()`:
```js
import { saveSubmission } from '../../data/store.js';
import { computePillars } from '../../../shared/core/scoring.js';
import { REPORTING_MONTH } from '../../data/store.js';

// In the save handler (called from main.js when Save button is clicked):
export async function saveCheckin(spotId) {
  const inputs = {
    daysOpen:    formModel.daysOpen,
    hoursPerDay: formModel.hoursPerDay,
    sessions:    formModel.sessions,
    attendance:  formModel.attendance,
    sparks:      formModel.sparks,
    rcCheckins:  formModel.rcCheckins,
    trainings:   formModel.trainings,
    committee:   formModel.committee,
    dataOnTime:  formModel.dataOnTime,
    challenge:   formModel.challenge,
    books:       formModel.books,
    achievement: formModel.achievement,
  };
  const submission = {
    id: crypto.randomUUID(),
    spotId,
    month: reportingMonthKey(REPORTING_MONTH),  // '2026-06'
    submittedBy: 'demo',
    submittedAt: new Date().toISOString(),
    source: 'app',
    inputs,
    syncState: 'pending',
  };
  await saveSubmission(submission);
  return submission;
}
```

**5. Update `src/main.js`** — make `render()` async-aware. The Save button calls `saveCheckin(spotId)` then navigates to success.

**6. Update `src/ui/screens/home.js` and `spots.js`** to call `await getClusters()` instead of the sync version.

### M3 done when
- Complete a check-in, reload the page — the submitted score persists in the dashboard.
- `seed/clusters.json` score shows up for months with no submission; computed score shows for months that have one.

---

## Design decisions already locked

| Decision | Value |
|----------|-------|
| RAG Red/Amber boundary | 50 (PRD §6.2 resolved) |
| Brand color | `--green-500: #006B38` |
| Background | `--paper: #FBFAF6` |
| Score ring | 150×150, r=64, stroke 13 |
| Commit authorship | Jeffrey Larbi-Akor only — no Co-Authored-By lines |
| RAG thresholds | Green ≥75, Amber 50–74, Red <50 |

## Companion docs (in the job applications folder, for reference)
- `/Users/jeffrey/Documents/Job Applications/EduSpots/Spot Pulse/v2/SpotPulse_v2_PRD.md`
- `/Users/jeffrey/Documents/Job Applications/EduSpots/Spot Pulse/v2/SpotPulse_v2_TRD.md`
- `/Users/jeffrey/Documents/Job Applications/EduSpots/Spot Pulse/v2/Spot Pulse v2 - Build Brief.md`

## To start the dev server
```bash
cd /Users/jeffrey/Documents/Projects/spot-pulse-v2
npm run dev
# App runs at http://localhost:5173
```
