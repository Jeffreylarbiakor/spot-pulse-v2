import { MONTHS } from '../../data/store.js';

const TAB_SUB = {
  home:  'EduSpots network health',
  spots: 'Network directory',
  about: 'About Spot Pulse',
};

export function renderTopbar(tab, monthIndex, onMonthChange) {
  const el = document.createElement('div');
  el.className = 'topbar';

  const monthPills = MONTHS.map((m, i) =>
    `<button aria-pressed="${i === monthIndex}" data-mi="${i}">${m.split(' ')[0]}</button>`
  ).join('');

  el.innerHTML = `
    <div class="titles">
      <div class="wordmark">Spot<b>Pulse</b></div>
      <div class="sub">${TAB_SUB[tab] || 'concept demo'}</div>
    </div>
    ${tab === 'home' ? `<div class="month"><div class="months">${monthPills}</div></div>` : ''}`;

  el.querySelectorAll('[data-mi]').forEach(btn => {
    btn.addEventListener('click', () => onMonthChange(parseInt(btn.dataset.mi, 10)));
  });

  return el;
}

export function renderSubbar(label, onBack) {
  const el = document.createElement('div');
  el.className = 'subbar';
  const btn = document.createElement('button');
  btn.className = 'back';
  btn.id = 'backBtn';
  btn.textContent = label;
  btn.addEventListener('click', onBack);
  el.appendChild(btn);
  return el;
}
