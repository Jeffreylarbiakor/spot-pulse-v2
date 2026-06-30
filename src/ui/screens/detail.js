import { getClustersSync as getClusters, MONTHS } from '../../data/store.js';
import { findSpot } from '../../../shared/core/selectors.js';
import { rag } from '../../../shared/core/rag.js';
import { esc, icon, ringSVG, disclaimerHTML } from '../helpers.js';
import { openSub } from '../router.js';

const PILLAR_DEFS = [
  ['access',     'Access',     25],
  ['engagement', 'Engagement', 20],
  ['support',    'Support',    25],
  ['governance', 'Governance', 30],
];

export function renderDetail(spotId) {
  const { spot: s, cluster: c } = findSpot(getClusters(), spotId);
  const sc = s.pillars
    ? s.pillars.access + s.pillars.engagement + s.pillars.support + s.pillars.governance
    : null;
  const r = sc != null ? rag(sc) : null;

  const progs = s.programmes.map(p => `<span class="tag prog">${esc(p)}</span>`).join('');

  const idRows = [
    ['Community',          s.community],
    ['District',           s.district],
    ['Region',             s.region],
    ['Cluster',            c.name],
    ['Regional Coordinator', c.rc],
    ['Year established',   s.year],
  ].map(([k, v]) => `<div><div class="k">${k}</div><div class="vv">${esc(v)}</div></div>`).join('');

  const pillars = s.pillars ? PILLAR_DEFS.map(([key, label, max]) => {
    const v = s.pillars[key];
    const pct = Math.round(v / max * 100);
    return `<div class="pillar">
      <div class="top"><span class="pn">${label}</span><span class="pv"><b>${v}</b> / ${max}</span></div>
      <div class="track"><i style="width:${pct}%"></i></div>
    </div>`;
  }).join('') : `<p style="color:var(--ink-400);margin:0">No check-in submitted for this month yet.</p>`;

  const pts = MONTHS.map((m, i) => ({ label: m.split(' ')[0], v: s.trend[i] }));
  const last2 = pts.filter(p => p.v != null).slice(-2);
  const delta = last2.length === 2 ? last2[1].v - last2[0].v : 0;
  const trendHTML = pts.map((p, i) =>
    `<div class="pt"><span class="mm">${p.label}</span><span class="sc">${p.v == null ? '—' : p.v}</span></div>` +
    (i < pts.length - 1 ? '<span style="color:var(--ink-300)">›</span>' : '')
  ).join('');

  const reportingMonthShort = MONTHS[MONTHS.length - 1].split(' ')[0];

  const el = document.createElement('div');
  el.className = 'view pad-bottom';
  el.id = 'view';
  el.tabIndex = -1;

  el.innerHTML = `
    <h1 class="h-screen">${esc(s.name)}</h1>
    <div style="margin:6px 0 4px;display:flex;gap:6px;flex-wrap:wrap">
      ${s.induction ? '<span class="tag induct">Induction Phase</span>' : ''}${progs}
    </div>
    <div class="card" style="margin-top:14px;text-align:center">
      <div class="ring-wrap">
        ${sc != null
          ? `<div class="ring">${ringSVG(sc, r, `${esc(s.name)}: score ${sc} out of 100, ${r.label}`)}<div class="ctr"><span class="num">${sc}</span><span class="of">/ 100</span></div></div>
             <span class="chip ${r.cls}" style="font-size:14px"><span class="dot"></span>${r.label}</span>`
          : `<p style="color:var(--ink-400);margin:8px 0">No check-in for this month</p>`}
      </div>
    </div>
    <div class="card" style="margin-top:14px"><div class="section-title" style="margin-bottom:14px">Pillar breakdown</div>${pillars}</div>
    <div class="card" style="margin-top:14px">
      <div class="section-title" style="margin-bottom:14px">3-month trend</div>
      <div class="trend">${trendHTML}<span class="arrow ${delta >= 0 ? 'up' : 'down'}" style="margin-left:6px" aria-label="${delta >= 0 ? 'Up' : 'Down'} ${Math.abs(delta)} points vs prior month">${delta >= 0 ? '▲' : '▼'} ${delta >= 0 ? '+' : ''}${delta}</span></div>
    </div>
    <div class="card" style="margin-top:14px"><div class="section-title" style="margin-bottom:14px">Identity</div><div class="idgrid">${idRows}</div></div>
    <button class="btn btn-primary btn-block" id="checkinBtn" style="margin-top:16px">${icon('plus', 'navicon')} Check-in for ${reportingMonthShort}</button>
    ${disclaimerHTML()}`;

  el.querySelector('#checkinBtn').addEventListener('click', () => openSub('checkin', spotId));
  return el;
}
