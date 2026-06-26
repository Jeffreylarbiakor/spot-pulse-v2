import { RC_LIST, signIn } from '../../auth/session.js';
import { esc } from '../helpers.js';

/** Render a full-screen sign-in overlay and return a remove function. */
export function showSignInOverlay() {
  const overlay = document.createElement('div');
  overlay.className = 'signin-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', 'Sign in as Regional Coordinator');

  overlay.innerHTML = `
    <div class="signin-card">
      <button class="signin-close" id="signinClose" aria-label="Cancel">✕</button>
      <div style="font-size:13px;font-family:var(--font-display);font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--brand);margin-bottom:4px">Sign in</div>
      <h2 style="margin:0 0 4px;font-size:18px;font-family:var(--font-display);font-weight:800">Choose your cluster</h2>
      <p style="margin:0 0 18px;font-size:13px;color:var(--text-muted);line-height:1.5">
        This selects your Regional Coordinator profile and scopes the app to your Spots.
        In production this would redirect to a secure identity provider.
      </p>
      <div class="signin-list" id="signinList">
        ${RC_LIST.map(rc => `
          <button class="signin-row" data-rcid="${esc(rc.rcId)}">
            <div>
              <div style="font-weight:700;font-size:15px">${esc(rc.name)}</div>
              <div style="font-size:12px;color:var(--text-muted);margin-top:1px">${esc(rc.clusterName)}</div>
            </div>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M6 3l5 5-5 5" stroke="var(--ink-400)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>`).join('')}
      </div>
    </div>`;

  document.body.appendChild(overlay);

  function remove() {
    overlay.remove();
  }

  overlay.querySelector('#signinClose').addEventListener('click', remove);
  overlay.addEventListener('click', e => { if (e.target === overlay) remove(); });

  overlay.querySelector('#signinList').addEventListener('click', e => {
    const row = e.target.closest('[data-rcid]');
    if (!row) return;
    const rc = RC_LIST.find(r => r.rcId === row.dataset.rcid);
    if (rc) {
      signIn(rc);
      remove();
    }
  });

  // Trap focus inside overlay
  overlay.querySelector('#signinClose').focus();

  return remove;
}
