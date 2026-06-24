import { esc, ghIconSVG, disclaimerHTML } from '../helpers.js';

const PILLAR_DEFS = [
  ['Access',     25],
  ['Engagement', 20],
  ['Support',    25],
  ['Governance', 30],
];

const ROADMAP = [
  { label: 'Offline-first PWA',            desc: 'Works with no signal; check-ins sync when a connection returns.',                      future: false },
  { label: 'RC accounts',                   desc: 'Secure sign-in scoped to each Regional Coordinator\'s own cluster.',                   future: false },
  { label: 'Write-through to EduSpots',     desc: 'Scores flow into existing EduSpots systems — one record, no double entry.',            future: true },
  { label: 'SMS / WhatsApp fallback',       desc: 'Submit a check-in by text where data is scarce or phones are basic.',                  future: true },
  { label: 'Push reminders',               desc: 'Notify RCs when the reporting window opens.',                                           future: true },
  { label: 'Multi-language UI',             desc: 'Localised copy for RCs in different regions.',                                        future: true },
];

export function renderAbout() {
  const weights = PILLAR_DEFS
    .map(([n, m]) => `<div class="wr"><span class="wn">${n}</span><span class="ww">${m}</span></div>`)
    .join('');

  const steps = ROADMAP.map(s =>
    `<div class="tl-step ${s.future ? 'future' : ''}">
      <div class="ts">${esc(s.label)}</div>
      <div class="td">${esc(s.desc)}</div>
    </div>`
  ).join('');

  const el = document.createElement('div');
  el.className = 'view pad-bottom';
  el.id = 'view';
  el.tabIndex = -1;

  el.innerHTML = `
    <h1 class="h-screen" style="margin:2px 4px 10px">About &amp; roadmap</h1>

    <div class="card">
      <div class="about-block">
        <h3>What this is</h3>
        <p>Spot Pulse is a concept demo of a Spot health tracker. A Regional Coordinator completes a 60-second monthly check-in per Spot on their phone; the app computes a 0–100 Spot Health Score with Green / Amber / Red status and rolls everything into a live network dashboard.</p>
      </div>
      <div class="about-block">
        <h3>How the score works</h3>
        <p>Four weighted pillars sum to 100.</p>
        <div class="weighttbl">
          ${weights}
          <div class="wr" style="border-top:1px solid var(--border-subtle);padding-top:7px">
            <span class="wn" style="font-weight:800">Total</span><span class="ww">100</span>
          </div>
        </div>
      </div>
      <div class="about-block">
        <h3>Data provenance</h3>
        <p>Spot names, locations, and programmes are drawn from EduSpots' published materials; all activity figures are illustrative.</p>
      </div>
    </div>

    <div class="card" style="margin-top:14px">
      <div class="section-title" style="margin-bottom:6px">Roadmap</div>
      <div class="timeline">${steps}</div>
    </div>

    <div class="card" style="margin-top:14px">
      <div class="about-block">
        <h3>Built by</h3>
        <p>Jeffrey Larbi-Akor — an independent concept exploring how EduSpots might track Spot health at network scale.</p>
        <a class="ghlink" href="https://github.com/Jeffreylarbiakor/spot-pulse-v2" target="_blank" rel="noopener">${ghIconSVG()} github.com/Jeffreylarbiakor/spot-pulse-v2</a>
      </div>
    </div>

    ${disclaimerHTML()}`;

  return el;
}
