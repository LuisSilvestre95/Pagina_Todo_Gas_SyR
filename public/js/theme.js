/* Se carga de forma síncrona en <head> para aplicar el tema antes de pintar (evita parpadeo). */
(function () {
  var root = document.documentElement;
  root.classList.add('js');
  var saved = null;
  try { saved = localStorage.getItem('tgs-theme'); } catch (e) { /* almacenamiento bloqueado */ }
  var dark = saved ? saved === 'dark' : window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  root.setAttribute('data-theme', dark ? 'dark' : 'light');
})();
