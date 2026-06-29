import { getClustersSync as getClusters, MONTHS, REPORTING_MONTH } from '../../data/store.js';
import { findSpot, allSpots } from '../../../shared/core/selectors.js';
import { computePillars, scoreOf } from '../../../shared/core/scoring.js';
import { rag } from '../../../shared/core/rag.js';
import { formModel, lastSubmissionId } from './checkin.js';
import { esc, ringSVG, disclaimerHTML } from '../helpers.js';
import { openSub, navTo } from '../router.js';
import { syncPending } from '../../data/sync.js';

const BADGE_CONFIG = {
  pending:          { cls: 'pending', label: 'Pending sync',     showRetry: false },
  syncing:          { cls: 'syncing', label: 'Syncing…',         showRetry: false },
  synced:           { cls: 'synced',  label: 'Synced',           showRetry: false },
  'synced-updated': { cls: 'synced',  label: 'Synced (updated)', showRetry: false },
  failed:           { cls: 'failed',  label: 'Sync failed',      showRetry: true  },
  local:            { cls: 'local',   label: 'Saved locally',    showRetry: false },
};

function badgeHTML(state) {
  const cfg = BADGE_CONFIG[state] ?? BADGE_CONFIG.pending;
  const retry = cfg.showRetry
    ? `<button class="btn" id="retryBtn" style="padding:4px 12px;font-size:12px;min-height:32px">Retry</button>`
    : '';
  return `<span class="sync-badge ${cfg.cls}" id="syncBadge">${cfg.label}</span>${retry}`;
}

export function renderSuccess(spotId) {
  const clusters = getClusters();
  const { spot: s } = findSpot(clusters, spotId);

  // N5: compute real score from the RC's actual inputs
  const pillars = computePillars({
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
  });
  const sc = scoreOf(pillars);
  const r = rag(sc);

  // Delta vs the previous reporting month
  const prevScore = s.trend[MONTHS.length - 2];
  const delta = prevScore != null ? sc - prevScore : 0;
  const prevMonthLabel = MONTHS[MONTHS.length - 2].split(' ')[0];

  const el = document.createElement('div');
  el.className = 'view';
  el.id = 'view';
  el.tabIndex = -1;

  el.innerHTML = `
    <div class="card success-card" style="margin-top:24px;text-align:center;padding:30px 24px">
      <div style="font-size:13px;font-family:var(--font-display);font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--brand)">Check-in saved</div>
      <h1 class="h-screen" style="margin:8px 0 2px;font-size:20px">${esc(s.name)} · ${REPORTING_MONTH}</h1>
      <div class="ring-wrap" style="margin-top:14px">
        <div class="ring">${ringSVG(sc, r)}<div class="ctr"><span class="num">${sc}</span><span class="of">/ 100</span></div></div>
        <span class="chip ${r.cls}" style="font-size:14px"><span class="dot"></span>${r.label}</span>
      </div>
      <div style="margin-top:14px;display:inline-flex;align-items:center;gap:7px;font-family:var(--font-mono);font-weight:700;font-size:15px;color:var(--green-700);background:var(--green-50);padding:8px 16px;border-radius:var(--r-pill)">
        ${delta >= 0 ? '▲' : '▼'} ${delta >= 0 ? '+' : ''}${delta}
        <span style="font-family:var(--font-body);font-weight:600;color:var(--text-muted);font-size:13px">vs ${prevMonthLabel}</span>
      </div>
      <p style="font-size:13.5px;color:var(--text-muted);margin:16px auto 0;max-width:34ch;line-height:1.55">
        ${r.key === 'Green'
          ? `Nicely done. ${esc(s.name)} is in the ${r.key} band — thanks for keeping the network healthy.`
          : `${esc(s.name)} needs attention. Keep supporting this Spot to move it into the Green band.`}
      </p>
      <div style="display:flex;flex-direction:column;gap:10px;margin-top:22px">
        <button class="btn btn-primary btn-block" id="dashBtn">Back to dashboard</button>
        <button class="btn btn-secondary btn-block" id="nextBtn">Next Spot</button>
      </div>
    </div>
    <div style="margin-top:12px;display:flex;align-items:center;justify-content:center;gap:8px" id="syncRow">
      ${badgeHTML('pending')}
    </div>
    ${disclaimerHTML()}`;

  el.querySelector('#dashBtn').addEventListener('click', () => navTo('home'));
  el.querySelector('#nextBtn').addEventListener('click', () => {
    const spots = allSpots(clusters);
    const i = spots.findIndex(sp => sp.id === spotId);
    openSub('checkin', spots[(i + 1) % spots.length].id);
  });

  // Live sync badge — updates in-place via the spot-pulse:sync-changed event
  const submissionId = lastSubmissionId;

  function updateBadge(state) {
    const row = el.querySelector('#syncRow');
    if (!row) return;
    row.innerHTML = badgeHTML(state);
    const retryBtn = row.querySelector('#retryBtn');
    if (retryBtn) retryBtn.addEventListener('click', syncPending);
  }

  function onSyncChanged(e) {
    if (e.detail.id === submissionId) updateBadge(e.detail.syncState);
  }

  window.addEventListener('spot-pulse:sync-changed', onSyncChanged);

  // Remove listener when this screen leaves the DOM
  const observer = new MutationObserver(() => {
    if (!document.contains(el)) {
      window.removeEventListener('spot-pulse:sync-changed', onSyncChanged);
      observer.disconnect();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });

  return el;
}
