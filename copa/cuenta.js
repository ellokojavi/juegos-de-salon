/**
 * Lo que La Copa recuerda en este celular: con qué jugador está sentado en cada copa y el
 * intento del día a medio jugar (C-6).
 *
 * El intento no usa `createSessionStore` porque su caducidad de 12 horas no alcanza: un día
 * se puede jugar hasta dos días después de abierto (el día de gracia). Se guarda por copa,
 * día y jugador, y se borra solo cuando la copa termina.
 */
const PREFIJO = 'juegos-de-salon:copa:';

export function createCuenta({ prueba = false } = {}) {
  // Las copas de prueba no se mezclan con las de verdad, y en ellas cada pestaña es un
  // celular distinto (sessionStorage): así se juega una copa de varios en un solo computador.
  const p = prueba ? 'prueba:' : '';
  const donde = () => (prueba ? sessionStorage : localStorage);
  const leer = k => { try { return JSON.parse(donde().getItem(PREFIJO + k) || 'null'); } catch (_) { return null; } };
  const escribir = (k, v) => { try { donde().setItem(PREFIJO + k, JSON.stringify(v)); return true; } catch (_) { return false; } };
  const borrar = k => { try { donde().removeItem(PREFIJO + k); } catch (_) { /* nada */ } };
  return {
    /** El jugador con que este celular está sentado en la copa, o null. */
    quien: code => leer(`${p}sesion:${code}`)?.pid || null,
    recordar(code, pid, { nombre, copa, fin } = {}) {
      escribir(`${p}sesion:${code}`, { pid });
      const mias = (leer(`${p}mias`) || []).filter(c => c.code !== code);
      mias.unshift({ code, nombre, copa, fin });
      escribir(`${p}mias`, mias.slice(0, 10));
    },
    olvidar(code) {
      borrar(`${p}sesion:${code}`);
      escribir(`${p}mias`, (leer(`${p}mias`) || []).filter(c => c.code !== code));
    },
    /** Las copas en que este celular participa, para ofrecerlas en la portada. */
    mias(now = Date.now()) {
      const semana = 7 * 24 * 60 * 60 * 1000;
      return (leer(`${p}mias`) || []).filter(c => !c.fin || now < c.fin + semana);
    },
    intento: {
      leer: (code, dia, pid) => leer(`${p}intento:${code}:${dia}:${pid}`),
      guardar: (code, dia, pid, datos) => escribir(`${p}intento:${code}:${dia}:${pid}`, datos),
      borrar: (code, dia, pid) => borrar(`${p}intento:${code}:${dia}:${pid}`),
    },
    /** El último nombre que se usó, para no escribirlo de nuevo en la próxima copa. */
    nombre: {
      get: () => leer('nombre') || '',
      set: n => escribir('nombre', n),
    },
  };
}
