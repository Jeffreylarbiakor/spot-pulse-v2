import { getClustersSync as getClusters, REPORTING_MONTH } from '../../data/store.js';
import { rag } from '../../../shared/core/rag.js';
import { esc, icon, disclaimerHTML } from '../helpers.js';
import { openSub } from '../router.js';

function scoreOf(s) {
  return s.pillars.access + s.pillars.engagement + s.pillars.support + s.pillars.governance;
}

function checkinRowHTML(s) {
  const sc = scoreOf(s);
  const r = rag(sc);
  return `<button class="spotrow" data-spot="${s.id}" aria-label="Check in ${esc(s.name)}">
    <div class="meta">
      <div class="sn">${esc(s.name)}</div>
      <div class="reg">${esc(s.community)} · ${esc(s.region)}</div>
    </div>
    <span class="chip ${r.cls}"><span class="dot"></span>${sc}</span>
    ${icon('chev', 'chev')}
  </button>`;
}

export function renderPicker() {
  const clusters = getClusters();
  const el = document.createElement('div');
  el.className = 'view';
  el.id = 'view';
  el.tabIndex = -1;

  const list = clusters.map(c =>
    `<div class="cluster-h"><span class="name">${esc(c.name)}</span><span class="rc">RC · ${esc(c.rc)}</span></div>
     ${c.spots.map(checkinRowHTML).join('')}`
  ).join('');

  el.innerHTML = `
    <h1 class="h-screen" style="margin:2px 4px 4px">New check-in</h1>
    <p style="margin:0 4px 14px;color:var(--text-muted);font-size:13px">Choose a Spot to report for <b style="color:var(--text-body)">${REPORTING_MONTH}</b></p>
    ${list}
    ${disclaimerHTML()}`;

  el.querySelectorAll('[data-spot]').forEach(btn => {
    btn.addEventListener('click', () => openSub('checkin', btn.dataset.spot));
  });

  return el;
}
