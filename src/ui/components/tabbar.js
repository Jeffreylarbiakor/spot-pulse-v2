import { navTo, openSub } from '../router.js';

const TABS = [
  { id: 'home',   label: 'Home',   icon: '⊞' },
  { id: 'spots',  label: 'Spots',  icon: '📍' },
  { id: 'checkin', label: '',      icon: '+', fab: true },
  { id: 'about',  label: 'About',  icon: '○' },
];

export function renderTabBar(activeTab) {
  const el = document.createElement('nav');
  el.className = 'tab-bar';
  el.setAttribute('aria-label', 'Main navigation');

  TABS.forEach(t => {
    const btn = document.createElement('button');
    if (t.fab) {
      btn.className = 'tab-fab';
      btn.setAttribute('aria-label', 'New check-in');
      btn.textContent = '+';
      btn.addEventListener('click', () => openSub('picker'));
    } else {
      btn.className = 'tab-btn' + (activeTab === t.id ? ' active' : '');
      btn.setAttribute('aria-label', t.label);
      btn.setAttribute('aria-current', activeTab === t.id ? 'page' : 'false');
      btn.innerHTML = `<span aria-hidden="true">${t.icon}</span><span>${t.label}</span>`;
      btn.addEventListener('click', () => navTo(t.id));
    }
    el.appendChild(btn);
  });

  return el;
}
