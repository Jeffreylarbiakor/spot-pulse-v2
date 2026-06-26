import SEED from '../../seed/clusters.json' assert { type: 'json' };

const KEY = 'sp-session';
const DEMO = { mode: 'demo', rc: null };

export function getSession() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : DEMO;
  } catch {
    return DEMO;
  }
}

export function signIn(rc) {
  const session = { mode: 'rc', rc };
  localStorage.setItem(KEY, JSON.stringify(session));
  window.dispatchEvent(new CustomEvent('spot-pulse:session-changed', { detail: session }));
}

export function signOut() {
  localStorage.removeItem(KEY);
  window.dispatchEvent(new CustomEvent('spot-pulse:session-changed', { detail: DEMO }));
}

// RC list derived from seed — used by the sign-in overlay
export const RC_LIST = SEED.clusters.map(c => ({
  rcId:        c.rcId,
  name:        c.rc,
  clusterId:   c.rcId,
  clusterName: c.name,
}));
