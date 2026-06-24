if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/src/pwa/sw.js').catch(() => {});
  });
}
