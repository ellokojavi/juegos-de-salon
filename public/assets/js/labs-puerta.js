/**
 * La puerta del laboratorio (D-281). /labs/ no está en el menú ni en los buscadores (D-101), pero
 * su dirección circula (el README, los links compartidos, /case/): sin la llave, quien llega ve el
 * menú. La llave viene una vez en el link que manda el dueño (`/labs/?key=…`), queda en el
 * celular y se borra del link; desde ahí se entra sin ella.
 *
 * Es una puerta, no una cerradura: el sitio es estático y sus archivos se pueden bajar igual. Frena
 * a los curiosos y a los robots que corren JavaScript; los que no lo corren los frena el
 * `noindex` de cada página.
 *
 * Va como script clásico y primero en el <head>, para que la página no se alcance a ver. En
 * localhost (los guiones de punta a punta) y en Tailscale (D-67) se abre sola.
 *
 * Cambiar la llave: `printf %s 'llave-nueva' | sha256sum` y poner el resultado en HUELLA. Quien
 * tenía la vieja queda afuera hasta recibir el link nuevo.
 */
(function () {
  var HUELLA = '867ef25adf5e043b13378e8c3ca53f1b53b5dc4ee8df926e74b7448b2f5b7417';
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
      if (hex !== HUELLA) return fuera();
      try { localStorage.setItem(GUARDADA, llave); } catch (e) { /* entra igual, esta vez */ }
      abrir();
    }, fuera);
  } catch (e) { fuera(); }
})();
