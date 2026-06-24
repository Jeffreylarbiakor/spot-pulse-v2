export function renderDetail(spotId) {
  const el = document.createElement('div');
  el.className = 'screen';
  el.innerHTML = `<div style="padding:24px 16px"><p class="text-secondary">Spot detail (${spotId}) — coming in M1</p></div>`;
  return el;
}
