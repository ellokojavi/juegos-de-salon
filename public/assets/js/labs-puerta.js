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
 * Las llaves se dan y se quitan con `node tools/agents/llave-labs.mjs nueva <etiqueta> | quitar
 * <etiqueta> | listar`, que edita HUELLAS: aquí solo está la huella SHA-256 de cada llave, nunca la
 * llave. La etiqueta es pública (el repo lo es): iniciales o un apodo, no un nombre completo.
 */
(function () {
  // Una línea por persona: 'etiqueta': 'huella'. La edita llave-labs.mjs
  var HUELLAS = {
    'dueño': '867ef25adf5e043b13378e8c3ca53f1b53b5dc4ee8df926e74b7448b2f5b7417',
    'MI': 'f01eea37a3c990f60b252663ada208c1d8c83cb858d891b35bf3dee78a3e877d',
    'Chanicua': '441119bfd83362159a827adaabe0d71a43ec146fca8cb02109521fa624f8b874',
    'Pepembau': '5468c6279bf6e74a99b2edc3d4bce3fcb7bbfd3508dcc4442aaa21f33bbf9165',
    'loco_Cris': '8ec321a014d83c5c51f3b2cd20feef15356712b908d05cd843cd66cc3b1a7700',
    'ratoncito': 'ec59c878d9f9405e0422806d2b16751e601b42bdbfee9e7a431d9c4d0f21950a',
  };
  var GUARDADA = 'juegos-de-salon:labs-llave';
  var h = document.documentElement;
  var abrir = function () { h.style.visibility = ''; };
  var fuera = function () {
    try { localStorage.removeItem(GUARDADA); } catch (e) { /* sin almacenamiento */ }
    location.replace('/');
  };
  h.style.visibility = 'hidden';
  try {
    // La llave sale del link en el acto, antes de que la página la lea o la comparta
    var q = new URLSearchParams(location.search), dada = q.get('key');
    if (dada !== null) {
      q.delete('key');
      var resto = q.toString();
      history.replaceState(history.state, '', location.pathname + (resto ? '?' + resto : '') + location.hash);
    }
    if (/^(localhost|127\.0\.0\.1|\[::1\])$|\.ts\.net$/.test(location.hostname)) return abrir();
    var llave = dada;
    if (!llave) { try { llave = localStorage.getItem(GUARDADA); } catch (e) { /* sin almacenamiento */ } }
    if (!llave || !window.crypto || !crypto.subtle) return fuera();
    crypto.subtle.digest('SHA-256', new TextEncoder().encode(llave)).then(function (b) {
      var hex = Array.prototype.map.call(new Uint8Array(b), function (x) { return (x < 16 ? '0' : '') + x.toString(16); }).join('');
      var vale = false;
      for (var k in HUELLAS) if (Object.prototype.hasOwnProperty.call(HUELLAS, k) && HUELLAS[k] === hex) vale = true;
      if (!vale) return fuera();
      try { localStorage.setItem(GUARDADA, llave); } catch (e) { /* entra igual, esta vez */ }
      abrir();
    }, fuera);
  } catch (e) { fuera(); }
})();
