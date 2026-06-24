import { getClusters, MONTHS } from '../../data/store.js';
import { networkStats, clusterAvgs } from '../../../shared/core/selectors.js';
import { esc, icon, donutSVG, disclaimerHTML } from '../helpers.js';
import { openSub } from '../router.js';

export function renderHome(monthIndex) {
  const clusters = getClusters();
  const m = monthIndex;
  const mlabel = MONTHS[m];
  const ns = networkStats(clusters, m);
  const cavg = clusterAvgs(clusters, m);

  const el = document.createElement('div');
  el.className = 'view pad-bottom';
  el.id = 'view';
  el.tabIndex = -1;

  const stats = [
    [ns.total,                      'Spots tracked'],
    [ns.avg,                        'Avg health'],
    [`${ns.reporting}/${ns.total}`, 'Check-ins logged'],
    [ns.g,                          'In Green band'],
  ].map(([v, l]) => `<div class="stat"><div class="v">${v}</div><div class="l">${l}</div></div>`).join('');

  const bars = cavg.map(([n, v]) => `
    <div class="bar-row">
      <div class="top"><span class="nm">${esc(n)}</span><span class="vl">${v}</span></div>
      <div class="track"><i style="width:${v}%"></i></div>
    </div>`).join('');

  el.innerHTML = `
    <div class="statgrid">${stats}</div>
    <div class="card" style="margin-top:14px">
      <div class="section-title" style="margin-bottom:14px">RAG distribution · ${mlabel}</div>
      <div style="display:flex;align-items:center;gap:18px">
        <div style="position:relative;flex:none;width:140px;height:140px">
          ${donutSVG(ns.g, ns.a, ns.r)}
          <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center">
            <span style="font-family:var(--font-mono);font-weight:700;font-size:26px;color:var(--text-strong)">${ns.reporting}</span>
            <span style="font-size:10px;color:var(--text-muted)">reporting</span>
          </div>
        </div>
        <div class="legend" style="flex:1">
          <div class="li"><span class="sw" style="background:var(--green-500)"></span>Green <b>${ns.g}</b></div>
          <div class="li"><span class="sw" style="background:var(--amber-500)"></span>Amber <b>${ns.a}</b></div>
          <div class="li"><span class="sw" style="background:var(--danger)"></span>Red <b>${ns.r}</b></div>
        </div>
      </div>
    </div>
    <div class="card" style="margin-top:14px">
      <div class="section-title" style="margin-bottom:14px">Average health by cluster · ${mlabel}</div>
      ${bars}
      <div style="display:flex;justify-content:space-between;font-family:var(--font-mono);font-size:10px;color:var(--ink-400);margin-top:2px"><span>0</span><span>50</span><span>100</span></div>
    </div>
    <button class="btn btn-primary btn-block" id="newCheckinBtn" style="margin-top:16px">${icon('plus', 'navicon')} New check-in</button>
    ${disclaimerHTML()}`;

  el.querySelector('#newCheckinBtn').addEventListener('click', () => openSub('picker'));
  return el;
}
