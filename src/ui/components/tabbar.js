import { navTo, openSub } from '../router.js';
import { icon } from '../helpers.js';

const TABS = [
  { id: 'home',  label: 'Home',     iconName: 'home'  },
  { id: 'spots', label: 'Spots',    iconName: 'spots' },
  { id: 'fab',   label: 'Check-in', iconName: 'plus',  fab: true },
  { id: 'about', label: 'About',    iconName: 'about' },
];

export function renderTabBar(activeTab) {
  const nav = document.createElement('nav');
  nav.className = 'tabbar';
  nav.setAttribute('role', 'tablist');

  TABS.forEach(t => {
    const btn = document.createElement('button');
    btn.className = 'tab' + (t.fab ? ' center' : '');
    btn.setAttribute('role', 'tab');

    if (t.fab) {
      btn.setAttribute('aria-label', 'New check-in');
      btn.innerHTML = `<span class="fab">${icon('plus', 'navicon')}</span><span class="lbl">${t.label}</span>`;
      btn.addEventListener('click', () => openSub('picker'));
    } else {
      btn.setAttribute('aria-current', activeTab === t.id ? 'true' : 'false');
      btn.innerHTML = `${icon(t.iconName, 'navicon')}<span class="lbl">${t.label}</span>`;
      btn.addEventListener('click', () => navTo(t.id));
    }

    nav.appendChild(btn);
  });

  return nav;
}
