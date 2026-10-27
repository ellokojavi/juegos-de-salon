/**
 * The room's QR code on the waiting screen: draws `url` as an SVG inside the element `selector` names
 * (looked up once the generator is loaded, so a screen redrawn meanwhile still gets it), or removes
 * that element if it cannot. The generator is qrcode-generator 1.4.4 (MIT, Kazuhiko Arase), served from the site
 * itself (`vendor/qrcode.js`, unchanged from its npm package) and loaded the first time a QR is drawn.
 */
let loading = null;

function loadGenerator() {
  if (window.qrcode) return Promise.resolve();
  loading ||= new Promise((res, rej) => {
    const sc = document.createElement('script');
    sc.src = new URL('vendor/qrcode.js', import.meta.url).href;
    sc.onload = res;
    sc.onerror = e => { loading = null; rej(e); };
    document.head.append(sc);
  });
  return loading;
}

export async function renderQr(url, selector = '#qr') {
  try {
    await loadGenerator();
    const qr = window.qrcode(0, 'M'); qr.addData(url); qr.make();
    const box = document.querySelector(selector); if (box) box.innerHTML = qr.createSvgTag({ cellSize: 4, margin: 0, scalable: true });
  } catch (_) { document.querySelector(selector)?.remove(); }
}
