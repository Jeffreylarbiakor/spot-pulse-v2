import { getClustersSync as getClusters } from '../../data/store.js';
import { getSession } from '../../auth/session.js';
import { allSpots } from '../../../shared/core/selectors.js';
import { rag } from '../../../shared/core/rag.js';
import { esc, icon, disclaimerHTML } from '../helpers.js';
import { openSub } from '../router.js';

function scoreOf(s) {
  return s.pillars.access + s.pillars.engagement + s.pillars.support + s.pillars.governance;
}

function spotRowHTML(s) {
  const sc = scoreOf(s);
  const r = rag(sc);
  return `<button class="spotrow" data-spot="${s.id}" aria-label="${esc(s.name)}, score ${sc}, ${r.key}">
    <div class="meta">
      <div class="sn">${esc(s.name)} ${s.induction ? '<span class="tag induct">Induction Phase</span>' : ''}</div>
      <div class="reg">${esc(s.community)} · ${esc(s.region)}</div>
    </div>
    <span class="chip ${r.cls}"><span class="dot"></span>${sc} · ${r.key}</span>
    ${icon('chev', 'chev')}
  </button>`;
}

export function renderSpots() {
  const session = getSession();
  const allClusters = getClusters();
  const clusters = session.mode === 'rc'
    ? allClusters.filter(c => c.rcId === session.rc.clusterId)
    : allClusters;
  const spots = allSpots(clusters);

  const el = document.createElement('div');
  el.className = 'view pad-bottom';
  el.id = 'view';
  el.tabIndex = -1;

  const list = clusters.map(c =>
    `<h2 class="cluster-h"><span class="name">${esc(c.name)}</span><span class="rc">RC · ${esc(c.rc)}</span></h2>
     ${c.spots.map(spotRowHTML).join('')}`
  ).join('');

  el.innerHTML = `
    <h1 class="h-screen" style="margin:2px 4px 4px">${session.mode === 'rc' ? 'My Spots' : 'All Spots'}</h1>
    <p style="margin:0 4px 10px;color:var(--text-muted);font-size:13px">${spots.length} Spots${session.mode === 'rc' ? '' : ` across ${clusters.length} clusters`} · tap for detail</p>
    ${list}
    ${disclaimerHTML()}`;

  el.querySelectorAll('[data-spot]').forEach(btn => {
    btn.addEventListener('click', () => openSub('detail', btn.dataset.spot));
  });

  return el;
}
