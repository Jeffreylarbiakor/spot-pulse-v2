// Shared UI helpers used across screens

export function esc(t) {
  return String(t).replace(/[&<>"]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));
}

const ICON = {
  home:  '<path d="M3 9.6 12 3l9 6.6V20a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/>',
  spots: '<path d="M20 10c0 5.5-8 11-8 11s-8-5.5-8-11a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="2.6"/>',
  plus:  '<circle cx="12" cy="12" r="9"/><path d="M12 8.2v7.6M8.2 12h7.6"/>',
  about: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><path d="M12 7.6h.01"/>',
  chev:  '<path d="m9 6 6 6-6 6"/>',
  gh:    '', // inlined in about screen
};

export function icon(name, cls) {
  return `<svg class="${cls || 'navicon'}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICON[name]}</svg>`;
}

export function ringSVG(score, ragObj) {
  const R = 64, C = 2 * Math.PI * R, len = (score / 100) * C;
  return `<svg width="150" height="150" viewBox="0 0 150 150" style="transform:rotate(-90deg)">
    <circle r="${R}" cx="75" cy="75" fill="none" stroke="var(--ink-100)" stroke-width="13"/>
    <circle r="${R}" cx="75" cy="75" fill="none" stroke="${ragObj.c}" stroke-width="13" stroke-linecap="round" stroke-dasharray="${len} ${C - len}"/></svg>`;
}

export function donutSVG(g, a, r) {
  const t = g + a + r || 1, R = 52, C = 2 * Math.PI * R, gap = 2;
  const seg = (v, col, off) => {
    const len = (v / t) * C;
    return `<circle r="${R}" cx="70" cy="70" fill="none" stroke="${col}" stroke-width="20" stroke-dasharray="${Math.max(len - gap, 0)} ${C - Math.max(len - gap, 0)}" stroke-dashoffset="${-off}"/>`;
  };
  let o = 0;
  const A = seg(g, 'var(--green-500)', o); o += (g / t) * C;
  const B = seg(a, 'var(--amber-500)', o); o += (a / t) * C;
  const D = seg(r, 'var(--danger)', o);
  return `<svg width="140" height="140" viewBox="0 0 140 140" style="transform:rotate(-90deg)">${A}${B}${D}</svg>`;
}

export function disclaimerHTML() {
  return `<div class="disclaimer">Independent concept demo by Jeffrey Larbi-Akor — not an official EduSpots product. Metrics are illustrative.</div>`;
}

export function ghIconSVG() {
  return `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8a8 8 0 0 0 5.47 7.59c.4.07.55-.17.55-.38l-.01-1.49c-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.4 7.4 0 0 1 4 0c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48l-.01 2.2c0 .21.15.46.55.38A8 8 0 0 0 16 8c0-4.42-3.58-8-8-8Z"/></svg>`;
}
