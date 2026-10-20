/**
 * La puerta del laboratorio (D-281). /labs/ no está en el menú ni en los buscadores (D-101), pero
 * su dirección circula (el README, los links compartidos, /case/): sin una llave, quien llega ve
 * el menú. La llave viene una vez en el link que manda el dueño (`/labs/?key=…`), queda en el
 * celular y se borra del link; desde ahí se entra sin ella. Cada persona tiene la suya (D-284),
 * para poder sacar a una sin cambiarles la llave a las demás.
 *
 * Es una puerta, no una cerradura: el sitio es estático y sus archivos se pueden bajar igual. Frena
 * a los curiosos y a los robots que corren JavaScript; los que no lo corren los frena el
 * `noindex` de cada página.
 *
 * Va como script clásico y primero en el <head>, para que la página no se alcance a ver. En
 * localhost (los guiones de punta a punta) y en Tailscale (D-67) se abre sola.
 *
 * Las llaves viven en Firebase, en `labsLlaves/<huella SHA-256>` = etiqueta (D-345): darla o quitarla
 * es al instante, sin PR ni publicar. `node tools/agents/labs-key.mjs new <label> | remove <label> |
 * list` las escribe como administrador. Las reglas dejan leer una huella que ya se conoce, nunca la
 * lista, y nadie escribe salvo el dueño. HUELLAS, aquí, queda para las llaves de antes (vacía).
 * Si la red falla con una llave ya guardada, entra igual: es una puerta, no una cerradura.
 */
(function () {
  // Una línea por persona: 'etiqueta': 'huella'. La edita labs-key.mjs
  var HUELLAS = {
  };
  var BASE = 'https://juegos-de-salon-default-rtdb.firebaseio.com';
  var GUARDADA = 'juegos-de-salon:labs-llave';
  // La etiqueta de esa llave, para que el feedback 🐞 diga quién lo manda (cup/reportes.js)
  var QUIEN = 'juegos-de-salon:labs-quien';
  var h = document.documentElement;
  var abrir = function () { h.style.visibility = ''; };
  var fuera = function () {
    try { localStorage.removeItem(GUARDADA); localStorage.removeItem(QUIEN); } catch (e) { /* sin almacenamiento */ }
    location.replace('/');
  };
  h.style.visibility = 'hidden';
  try {
    // La llave sale del link en el acto, antes de que la página la lea o la comparta
    var q = new URLSearchParams(location.search), dada = q.get('key');
    if (dada !== null) {
      q.delete('key');
      // Without the empty `=` toString() adds to flags (`?test`, not `?test=`)
      var resto = q.toString().replace(/=(?=&|$)/g, '');
      history.replaceState(history.state, '', location.pathname + (resto ? '?' + resto : '') + location.hash);
    }
    if (/^(localhost|127\.0\.0\.1|\[::1\])$|\.ts\.net$/.test(location.hostname)) return abrir();
    var llave = dada;
    if (!llave) { try { llave = localStorage.getItem(GUARDADA); } catch (e) { /* sin almacenamiento */ } }
    if (!llave || !window.crypto || !crypto.subtle) return fuera();
    crypto.subtle.digest('SHA-256', new TextEncoder().encode(llave)).then(function (b) {
      var hex = Array.prototype.map.call(new Uint8Array(b), function (x) { return (x < 16 ? '0' : '') + x.toString(16); }).join('');
      var quien = null;
      for (var k in HUELLAS) if (Object.prototype.hasOwnProperty.call(HUELLAS, k) && HUELLAS[k] === hex) quien = k;
      var entrar = function (q) {
        try { localStorage.setItem(GUARDADA, llave); localStorage.setItem(QUIEN, q); } catch (e) { /* entra igual, esta vez */ }
        abrir();
      };
      if (quien !== null) return entrar(quien);
      // La huella en Firebase: la etiqueta si la llave vale, null si no (o si se quitó)
      fetch(BASE + '/labsLlaves/' + hex + '.json').then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      }).then(function (q) {
        if (typeof q === 'string' && q) entrar(q); else fuera();
      }, function () {
        // Sin red: una llave que ya había entrado en este celular sigue entrando; una nueva, no
        if (!dada) abrir(); else fuera();
      });
    }, fuera);
  } catch (e) { fuera(); }
})();
