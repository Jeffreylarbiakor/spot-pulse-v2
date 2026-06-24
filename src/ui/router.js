const state = {
  tab: 'home',
  sub: null,   // { type: 'detail'|'checkin'|'success'|'picker', id?: string }
};

const listeners = new Set();

export function getState() { return { ...state }; }

export function navTo(tab) {
  state.tab = tab;
  state.sub = null;
  _emit();
}

export function openSub(type, id = null) {
  state.sub = { type, id };
  _emit();
}

export function closeSub() {
  state.sub = null;
  _emit();
}

export function isFlow() {
  return state.sub?.type === 'checkin' || state.sub?.type === 'success' || state.sub?.type === 'picker';
}

export function onRoute(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function _emit() {
  listeners.forEach(fn => fn(getState()));
}
