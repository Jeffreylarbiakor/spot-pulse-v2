import { closeSub } from '../router.js';

export function renderTopbar({ title, showBack = false, onBack = null }) {
  const el = document.createElement('header');
  el.className = 'topbar';

  if (showBack) {
    const back = document.createElement('button');
    back.className = 'topbar-back';
    back.setAttribute('aria-label', 'Go back');
    back.innerHTML = '&#8592; Cancel';
    back.addEventListener('click', onBack || closeSub);
    el.appendChild(back);
  }

  const h = document.createElement('h1');
  h.className = 'topbar-title';
  h.textContent = title;
  el.appendChild(h);

  return el;
}
