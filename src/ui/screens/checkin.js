import { getClusters, REPORTING_MONTH } from '../../data/store.js';
import { findSpot } from '../../../shared/core/selectors.js';
import { esc } from '../helpers.js';

// Shared mutable form state — cleared on each new check-in
export let formModel = {};

function defaultModel(spotId) {
  return {
    spotId,
    daysOpen: 18, hoursPerDay: 3, sessions: 8,
    attendance: 142, sparks: 6,
    rcCheckins: 1, trainings: 1,
    committee: true, dataOnTime: true, challenge: false,
    books: 54, achievement: '',
  };
}

function stepperHTML(key, min, step, value) {
  return `<div class="stepper" data-key="${key}" data-min="${min}" data-step="${step}">
    <button class="dec" aria-label="decrease">−</button>
    <span class="val" id="v_${key}">${value}</span>
    <button class="inc" aria-label="increase">+</button>
  </div>`;
}

function toggleHTML(key, label, checked) {
  return `<div class="toggle-row">
    <span class="fl">${label}</span>
    <button class="toggle" role="switch" aria-checked="${checked}" data-toggle="${key}" aria-label="${label}"></button>
  </div>`;
}

export function renderCheckin(spotId) {
  formModel = defaultModel(spotId);
  const { spot: s } = findSpot(getClusters(), spotId);
  const m = formModel;

  const el = document.createElement('div');
  el.className = 'view';
  el.id = 'view';
  el.tabIndex = -1;

  el.innerHTML = `
    <div style="color:var(--text-muted);font-size:13.5px;margin:0 2px 2px">${esc(s.name)} · Reporting <b style="color:var(--text-body)">${REPORTING_MONTH}</b></div>
    <h1 class="h-screen" style="margin:4px 2px 0">Monthly check-in</h1>

    <div class="card" style="margin-top:16px"><div class="fsection">
      <div class="lbl">Opening</div>
      <div class="field"><span class="fl">Days open<small>This month</small></span>${stepperHTML('daysOpen', 0, 1, m.daysOpen)}</div>
      <div class="field"><span class="fl">Avg hours per day<small>0.5-hour steps</small></span>${stepperHTML('hoursPerDay', 0, 0.5, m.hoursPerDay)}</div>
    </div></div>

    <div class="card" style="margin-top:14px"><div class="fsection">
      <div class="lbl">Engagement</div>
      <div class="field"><span class="fl">Club sessions held</span>${stepperHTML('sessions', 0, 1, m.sessions)}</div>
      <div class="field col"><label class="fl" for="f_att">Total attendance</label><input class="ninput" id="f_att" type="number" inputmode="numeric" value="${m.attendance}" data-num="attendance"></div>
      <div class="field col"><label class="fl" for="f_spk">New Spark registrations</label><input class="ninput" id="f_spk" type="number" inputmode="numeric" value="${m.sparks}" data-num="sparks"></div>
    </div></div>

    <div class="card" style="margin-top:14px"><div class="fsection">
      <div class="lbl">Support</div>
      <div class="field"><span class="fl">Check-ins with your RC</span>${stepperHTML('rcCheckins', 0, 1, m.rcCheckins)}</div>
      <div class="field"><span class="fl">Trainings attended</span>${stepperHTML('trainings', 0, 1, m.trainings)}</div>
    </div></div>

    <div class="card" style="margin-top:14px"><div class="fsection">
      <div class="lbl">Governance</div>
      ${toggleHTML('committee',  'Committee meeting held',       m.committee)}
      ${toggleHTML('dataOnTime', 'Data submitted on time',      m.dataOnTime)}
      ${toggleHTML('challenge',  'Monthly challenge submitted',  m.challenge)}
    </div></div>

    <div class="card" style="margin-top:14px"><div class="fsection">
      <div class="lbl">Extras</div>
      <div class="field col"><label class="fl" for="f_books">Books borrowed</label><input class="ninput" id="f_books" type="number" inputmode="numeric" value="${m.books}" data-num="books"></div>
      <div class="field col"><label class="fl" for="f_ach">Achievement worth celebrating <small>Optional</small></label><input class="tinput" id="f_ach" type="text" placeholder="e.g. 12 girls joined the new coding club" data-text="achievement"></div>
    </div></div>`;

  wireForm(el);
  return el;
}

function wireForm(el) {
  el.querySelectorAll('.stepper').forEach(st => {
    const key = st.dataset.key;
    const min = parseFloat(st.dataset.min);
    const step = parseFloat(st.dataset.step);
    const val = st.querySelector('.val');
    const dec = st.querySelector('.dec');
    const inc = st.querySelector('.inc');

    const upd = () => {
      val.textContent = formModel[key];
      dec.disabled = formModel[key] <= min;
    };

    inc.addEventListener('click', () => { formModel[key] = +(formModel[key] + step).toFixed(1); upd(); });
    dec.addEventListener('click', () => { if (formModel[key] > min) { formModel[key] = +(formModel[key] - step).toFixed(1); upd(); } });
    upd();
  });

  el.querySelectorAll('[data-toggle]').forEach(t => {
    t.addEventListener('click', () => {
      const k = t.dataset.toggle;
      formModel[k] = !formModel[k];
      t.setAttribute('aria-checked', formModel[k]);
    });
  });

  el.querySelectorAll('[data-num]').forEach(n => {
    n.addEventListener('input', () => { formModel[n.dataset.num] = +n.value || 0; });
  });

  const ta = el.querySelector('[data-text]');
  if (ta) ta.addEventListener('input', () => { formModel.achievement = ta.value; });
}
