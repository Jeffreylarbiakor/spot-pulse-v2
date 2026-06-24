export function renderPicker() {
  const el = document.createElement('div');
  el.className = 'screen flow';
  el.innerHTML = `<div style="padding:24px 16px"><p class="text-secondary">Check-in picker — coming in M1</p></div>`;
  return el;
}
