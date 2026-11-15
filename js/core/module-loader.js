
// Cargador común de módulos clásicos. Evita cargar dos veces el mismo archivo.
window.LTA = window.LTA || {};
window.LTA.loadScript = window.LTA.loadScript || function(path) {
  window.__LTA_SCRIPT_PROMISES = window.__LTA_SCRIPT_PROMISES || new Map();
  if (window.__LTA_SCRIPT_PROMISES.has(path)) return window.__LTA_SCRIPT_PROMISES.get(path);
  const promise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = path;
    script.async = false;
    script.onload = resolve;
    script.onerror = () => reject(new Error('No se pudo cargar el módulo: ' + path));
    document.head.appendChild(script);
  });
  window.__LTA_SCRIPT_PROMISES.set(path, promise);
  return promise;
};
