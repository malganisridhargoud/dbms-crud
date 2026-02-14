(function () {
  const host = window.location.hostname;
  const isLocal = host === 'localhost' || host === '127.0.0.1' || host === '::1';
  const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
  const defaultBase = isLocal ? 'http://127.0.0.1:5000' : `${protocol}//${host}:5000`;
  window.API_BASE = window.API_BASE || defaultBase;
})();
