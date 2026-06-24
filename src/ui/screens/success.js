import { getClusters, MONTHS, REPORTING_MONTH } from '../../data/store.js';
import { findSpot, allSpots } from '../../../shared/core/selectors.js';
import { computePillars, scoreOf } from '../../../shared/core/scoring.js';
import { rag } from '../../../shared/core/rag.js';
import { formModel } from './checkin.js';
import { esc, ringSVG, disclaimerHTML } from '../helpers.js';
import { openSub, navTo } from '../router.js';

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

  // Delta vs the previous reporting month (index -2)
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
    <div style="margin-top:12px">
      <span class="sync-badge pending">Pending sync</span>
    </div>
    ${disclaimerHTML()}`;

  el.querySelector('#dashBtn').addEventListener('click', () => navTo('home'));
  el.querySelector('#nextBtn').addEventListener('click', () => {
    const spots = allSpots(clusters);
    const i = spots.findIndex(s => s.id === spotId);
    openSub('checkin', spots[(i + 1) % spots.length].id);
  });

  return el;
}
