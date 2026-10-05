/**
 * Cómo llegar a cada pantalla de cada juego, sin jugar la partida entera. Lo usan `mirar.mjs`
 * (una pantalla, para mirarla) y las pruebas de idiomas (todas, en cada idioma: D-199).
 *
 * Cada camino es una lista de trocitos de JS que se corren en la página, uno cada 700 ms; un
 * paso `1` es solo una espera. Se arma con el id del juego ('ahorcado'), no con su carpeta.
 */
import { SUELTOS } from '../../public/assets/js/games.js';

/* --- Trozos de camino de Batalla Naval (ver el comentario de su entrada) --- */
const BN_CPU = [
  `document.querySelectorAll('.mode')[2].click()`,
  `(()=>{const i=document.querySelector('#setup-form input');i.value='Javi';i.dispatchEvent(new Event('input',{bubbles:true}))})()`,
  `document.querySelector('#setup-actions .btn--yellow').click()`,
];
const BN_ZARPA = [
  `[...document.querySelectorAll('#place-actions .btn')].find(b=>/azar|random|aleat|zufällig/i.test(b.textContent)).click()`,
  `document.querySelector('#place-sail .btn').click()`,
];
const BN_FRENA = `(()=>{const S=window.__bn.session();clearTimeout(S.cpuTimer);S.cpuTimer='frenado';})()`;
const BN_FALLA = rol => `(()=>{const S=window.__bn.session(),L=S.layouts['${rol === 'A' ? 'B' : 'A'}'].layout,
  T={carrier:5,battleship:4,cruiser:3,submarine:3,destroyer:2},o=new Set();
  for(const [id,p] of Object.entries(L)) for(let i=0;i<T[id];i++) o.add((p.dir==='h'?p.r:p.r+i)+','+(p.dir==='h'?p.c+i:p.c));
  for(let r=0;r<10;r++) for(let c=0;c<10;c++) if(!o.has(r+','+c)) return S.transport.send({t:'shot',from:'${rol}',cell:'ABCDEFGHIJ'[c]+(r+1)});})()`;

/* --- Tango: empezar y llenar el tablero con el motor de verdad (ver su entrada) --- */
const TAN_EMPEZAR = `document.getElementById('btn-empezar').click()`;
const TAN_LLENAR = choque => `(async()=>{const {JUEGOS}=await import('/cup/games/index.js');const p=JUEGOS.tango.generar(__copa.estado.juego.semilla,1);
  const L=p.sol.map((v,i)=>i).filter(i=>p.dadas[i]===undefined), u=${choque}?L.filter(i=>p.sol[i]===2).at(-1):L.at(-1);
  const c=i=>document.querySelector('.tan[data-i="'+i+'"]');
  for(const i of L){if(i===u)continue;for(let k=0;k<3&&Number(c(i).dataset.v)!==p.sol[i];k++)c(i).click();}
  if(${choque})c(u).click();})()`;

/**
 * Cómo llegar a cada pantalla. Cada paso es un trocito de JS que se corre en la página;
 * si un juego necesita otra cosa, se suma acá y no en un guion nuevo.
 */
/** Siembra el panel con salas, señales y copas, y abre la vista pedida (ver `panel` abajo). */
const SEMBRAR_PANEL = vista => `(async()=>{const DIA=86400000,ahora=Date.now(),hoy=Math.floor(ahora/DIA);
      const rooms={ABCD:{createdAt:ahora-4*60000,lastAt:ahora-60000,game:'dudo',players:{A:{name:'Javi',online:true},B:{name:'Cata',online:true}},messages:{m1:{t:'hello',at:ahora-4*60000},m2:{t:'bid',at:ahora-60000}}},EFGH:{createdAt:ahora-2*3600000,lastAt:ahora-12*60000,game:'juego-nuevo',players:{A:{name:'Fausto',online:false}}}};
      // Una Batalla Naval como la que confundió al panel (D-138): cada disparo trae su respuesta
      // automática, y hay dos mensajes de chat. Debe decir 40 jugadas y 2 mensajes de chat.
      const nave={createdAt:ahora-24*60000,lastAt:ahora-16*60000,game:'batalla-naval',players:{A:{name:'Tomiguel',online:false},B:{name:'SVS',online:false}},messages:{}};
      for(let i=0;i<40;i++){nave.messages['s'+i]={t:'shot',at:ahora-40*60000+i*30000};nave.messages['r'+i]={t:'reply',at:ahora-40*60000+i*30000+500};}
      nave.messages.c1={t:'chat',at:ahora-17*60000,text:'x'};nave.messages.c2={t:'chat',at:ahora-16*60000,text:'y'};
      rooms.CPSV=nave;
      // Salas jugadas de varios días, con país y ganador, para ver la bitácora y su paginado (D-79).
      // Van a propósito: un empate, una sala sin registro de ganador (de antes de que se anotara),
      // una donde nunca entró nadie más y nombres de varios países.
      const gente=[['Javi','CL'],['Cata','CL'],['Pancho','CL'],['Fran','AR'],['Ana','BR'],['Leo','ES'],['Nico','MX'],['Sofi','PE']];
      const juegos=['dudo','ahorcado','linea-de-tiempo','toque-y-fama','batalla-naval'];
      const dias={};
      for(let k=0;k<26;k++){
        const d=hoy-(k%7), code=String.fromCharCode(65+k%26)+'BCD'.slice(0,3);
        const a=gente[k%gente.length], b=gente[(k+3)%gente.length];
        const lg=k%4===1?'pt':k%4===2?'en':'es';
        const r={game:juegos[k%juegos.length],at:(d*DIA)+((10+k%12)*3600000),v:'0.33.6',players:{A:a[0],B:b[0]},co:{A:a[1],B:b[1]},...(k%5===4?{}:{l:{A:lg,B:k%6===0?'pt':lg}})};
        if(k%7===3) r.end={winner:'tie',at:r.at};
        else if(k%5!==1) r.end={winner:k%2?'A':'B',name:k%2?a[0]:b[0],at:r.at};
        if(k%9===4){ delete r.players.B; delete r.co.B; delete r.end; }
        (dias[d]=dias[d]||{rooms:{}}).rooms[code]=r;
      }
      const days={...dias};
      days[hoy]={...(days[hoy]||{}),rooms:{...((days[hoy]||{}).rooms||{}),ABCD:{game:'dudo',at:ahora-4*60000,players:{A:'Javi',B:'Cata'},co:{A:'CL',B:'CL'},l:{A:'es',B:'pt'},end:{winner:'A',name:'Javi',at:ahora}},EFGH:{game:'juego-nuevo',at:ahora-2*3600000,players:{A:'Fausto'},co:{A:'UY'}},CPSV:{game:'batalla-naval',at:ahora-24*60000,players:{A:'Tomiguel',B:'SVS'},co:{A:'CL',B:'CL'}}},local:{dudo:{local:{4:6},cpu:{1:3}},'juego-nuevo':{equipos:{6:5}},ahorcado:{local:{3:4}}},origin:{America__Santiago:12,Europe__Madrid:2},lang:{'es-CL':12,'pt-BR':2},applang:{es:11,pt:2,fr:1},hour:{14:4,21:9}};
      days[hoy-1]={...(days[hoy-1]||{}),local:{'linea-de-tiempo':{solo:{1:7}}},origin:{America__Santiago:5},lang:{'es-CL':5},applang:{es:5},hour:{20:5}};
      
      const {nuevaMeta}=await import('/cup/engine.js');
      const Z='America/Santiago', fecha=k=>new Date(ahora-k*DIA).toLocaleDateString('en-CA',{timeZone:Z});
      const nombres=['Javi','Cata','Pancho','Fran','Sofi','Nico','Leo'];
      const copa=(nombre,dias,hace,n,{lab=false,alias=null,lang='es'}={})=>{
        const pids=nombres.slice(0,n).map((g,i)=>'p'+String(i).padStart(5,'0'));
        const meta=nuevaMeta({nombre,dias,inicio:fecha(hace),tz:Z,admin:pids[0],creada:ahora-(Math.max(hace,0)+1)*DIA,lab,alias,lang});
        // El país de cada inscrito (D-207); el último, de antes de que se guardara, va sin bandera
        const co=['CL','CL','AR','CL','PE','MX','ES'];
        const players=Object.fromEntries(pids.map((p,i)=>[p,{name:nombres[i],at:ahora-(Math.max(hace,0)+1)*DIA+(i+1)*3600000,...(i<n-1?{co:co[i]}:{})}]));
        const started=[null],results=[null];
        for(let d=1;d<=dias;d++){
          started[d]={};results[d]={};
          if(ahora<meta.win[d].a)continue;
          pids.forEach((p,i)=>{
            const k=(d*7+i*3)%10, hoyDia=ahora<meta.win[d].h;
            if(hoyDia&&i>=n-2&&k%3===0)return;                         // todavía no lo juega
            const t0=Math.min(ahora-60000,meta.win[d].a+(2+i+d)*3600000);
            started[d][p]=t0;
            if(hoyDia&&i===n-1){started[d][p]=ahora-4*60000;return;}  // lo está jugando ahora
            if(k===7)return;                                           // lo dejó sin terminar
            const s=[100,89,78,67,56,44,30,20,11,0][k];
            results[d][p]={s,ms:40000+k*23000+i*7000,at:t0+60000+k*20000,r:s+'/100',t:''};
          });
        }
        return {meta,players,started,results};
      };
      const torneos={OFICI:copa('Copa de la oficina',7,2,5,{alias:'oficina'}),PRIMO:copa('Los primos',3,0,3,{lang:'pt'}),LABOR:copa('Prueba del laboratorio',3,1,2,{lab:true}),AGOST:copa('Copa de agosto',7,20,6,{alias:'agosto'}),FINDE:copa('Copa del finde',3,-2,2)};
      // En la oficina, Cata jugó el día 2 de comodín y el admin cerró la inscripción: la historia los muestra sin hora
      torneos.OFICI.wild={p00001:'2'};torneos.OFICI.closed=true;
      // Partidas sin red con hora (D-140), para la ficha de un juego
      // Tráfico del sitio (D-208): una semana de visitas, con orígenes, links marcados y páginas
      for(let k=0;k<7;k++){const d=hoy-k,f=7-k;days[d]=days[d]||{};Object.assign(days[d],{vistas:{inicio:9*f,cup:6*f,hangman:2*f,connections:f,labs:1},entradas:{inicio:5*f,cup:3*f,hangman:f,connections:1},juegan:{inicio:2*f,cup:2*f,hangman:1},ref:{directo:5*f,google_com:2*f,google_cl:f,instagram_com:f,chatgpt_com:1},via:{link:3*f,instagram:1},retorno:{nueva:4*f,vuelve:5*f},disp:{celular:7*f,computador:2*f},pais:{CL:7*f,AR:f,ES:1}});}
      // Con nombre y final desde D-210: uno jugando, uno que ganó, un solitario terminado y uno sin nombre
      days[hoy].live={k3p9aaaaaa:{game:'dudo',mode:'cpu',n:1,co:'CL',l:'es',name:'Javi',v:'0.93.0',at:ahora-15*60000,beat:ahora-60000},q8w7aaaaaa:{game:'dudo',mode:'local',n:4,co:'AR',name:'Fran, Leo, Ana, Bia',v:'0.92.1',at:ahora-5*3600000,beat:ahora-4*3600000,fin:{at:ahora-4*3600000,g:'Leo',d:'9 rondas'}},t1t2aaaaaa:{game:'toque-y-fama',mode:'solo',n:1,co:'MX',l:'en',name:'Nico',v:'0.99.0',at:ahora-3*3600000,beat:ahora-3*3600000+120000,fin:{at:ahora-3*3600000+150000,d:'80/100 · 6 intentos · 2:30'}},s0s0aaaaaa:{game:'ahorcado',mode:'solo',n:1,co:'PE',v:'0.90.0',at:ahora-2*DIA,beat:ahora-2*DIA+300000}};
      // Los días de copa también mandan su señal: el panel no los cuenta entre las partidas de los juegos
      days[hoy].local.copa={copa:{1:9}};
      window.__panel.seed({rooms,days,torneos,vista:'${vista}'});})()`;

export const CAMINOS = {
  /** La Copa con el almacén de prueba (`?prueba`): la portada y el formulario para crear una. */
  copa: {
    intro: [],
    crear: [`document.getElementById('btn-crear').click()`],
  },
  dudo: {
    intro: [],
    configuracion: [`document.querySelectorAll('.mode')[0].click()`],
    // Contra el celular se llega a la mesa sin pantalla de pase de por medio
    juego: [
      `document.querySelectorAll('.mode')[2].click()`,
      `(()=>{const i=document.querySelector('#setup-form input');i.value='Javi';i.dispatchEvent(new Event('input',{bubbles:true}))})()`,
      `document.querySelector('#setup-actions .btn--yellow').click()`,
    ],
    // Con la pinta elegida aparece el selector de cantidad, que es la parte apretada de la barra
    apuesta: [
      `document.querySelectorAll('.mode')[2].click()`,
      `(()=>{const i=document.querySelector('#setup-form input');i.value='Javi';i.dispatchEvent(new Event('input',{bubbles:true}))})()`,
      `document.querySelector('#setup-actions .btn--yellow').click()`,
      `document.querySelectorAll('.pinta')[4].click()`,
    ],
    // Se destapa la mesa: se apuesta un disparate y se duda de la respuesta del celular
    destape: [
      `document.querySelectorAll('.mode')[2].click()`,
      `(()=>{const i=document.querySelector('#setup-form input');i.value='Javi';i.dispatchEvent(new Event('input',{bubbles:true}))})()`,
      `document.querySelector('#setup-actions .btn--yellow').click()`,
      `document.querySelectorAll('.pinta')[5].click()`,
      `document.querySelector('#actions .btn--yellow').click()`,
      `1`,   // el celular se demora en cantar su apuesta: un paso de espera
      `[...document.querySelectorAll('#actions .btn')].find(b=>/Dudo|Liar|Duvido|Zweifeln/i.test(b.textContent))?.click()`,
    ],
  },
  'cuarto-rey': {
    intro: [],
    jugadores: [`document.getElementById('btn-go-setup').click()`],
    // Con seis filas se ve si la lista crece pareja y si la barra de abajo sigue alcanzando
    'jugadores-6': [
      `document.getElementById('btn-go-setup').click()`,
      `document.getElementById('btn-add-player').click()`,
      `document.getElementById('btn-add-player').click()`,
    ],
    mesa: [
      `document.getElementById('btn-go-setup').click()`,
      `[...document.querySelectorAll('#players-form input')].forEach((i,k)=>{i.value=['Javi','Cata','Pancho','Fran'][k];i.dispatchEvent(new Event('input',{bubbles:true}))})`,
      `document.getElementById('btn-start').click()`,
    ],
    // El pase (C-9): "¡Salud!" y "Pásale el celular a X" en una sola pantalla. El peor caso: un As
    // con seis jugadores de nombre largo, que son seis fichas más el pase. Se deja una partida
    // guardada con el As arriba del mazo y se retoma.
    pase: [
      `(()=>{const n=['Francisca','Maximiliano','Catalina','Sebastián','Valentina','Bartolomé'];const deck=[{rank:'5',suit:'♣',color:'black'},{rank:'A',suit:'♥',color:'red'}];localStorage.setItem('juegos-de-salon:cuarto-rey:session',JSON.stringify({v:1,game:'cuarto-rey',at:Date.now(),mode:'local',state:{players:n.map((name,i)=>({name,gender:'mfx'[i%3]})),deck,turn:0,kings:0,drawn:0,sorbos:n.map(()=>0),fondos:n.map(()=>0),history:[],current:null,finished:false,victim:null,startedAt:Date.now()}}));location.reload()})()`,
      `document.querySelector('#resume-slot .btn--cyan').click()`,
      `document.getElementById('card').click()`,
      `1`,
      `document.querySelector('#result .actions .btn').click()`,
    ],
  },
  julepe: {
    intro: [],
    configuracion: [`document.querySelectorAll('.mode')[0].click()`],
    // Contra el celular se llega a la mesa sin pantalla de pase de por medio
    declaracion: [
      `document.querySelectorAll('.mode')[2].click()`,
      `(()=>{const i=document.querySelector('#setup-form input');i.value='Javi';i.dispatchEvent(new Event('input',{bubbles:true}))})()`,
      `document.querySelector('#setup-actions .btn--yellow').click()`,
    ],
    // El cambio: con una carta marcada, que es cuando la mano se ve más cargada. Los pasos `1`
    // son esperas: los rivales del aparato declaran y cambian antes, y se demoran a propósito.
    cambio: [
      `document.querySelectorAll('.mode')[2].click()`,
      `(()=>{const i=document.querySelector('#setup-form input');i.value='Javi';i.dispatchEvent(new Event('input',{bubbles:true}))})()`,
      `document.querySelector('#setup-actions .btn--yellow').click()`,
      `document.querySelector('#actions .btn--yellow')?.click()`,
      `1`, `1`, `1`,
      `document.querySelectorAll('#mine .pcard')[0]?.click()`,
    ],
    // La baza: hasta la primera carta, donde aparecen las apagadas y el porqué de abajo
    baza: [
      `document.querySelectorAll('.mode')[2].click()`,
      `(()=>{const i=document.querySelector('#setup-form input');i.value='Javi';i.dispatchEvent(new Event('input',{bubbles:true}))})()`,
      `document.querySelector('#setup-actions .btn--yellow').click()`,
      `document.querySelector('#actions .btn--yellow')?.click()`,
      `1`, `1`, `1`,
      `document.querySelector('#actions .btn--yellow')?.click()`,
      `1`, `1`, `1`,
      `document.querySelector('#mine .pcard:not(.off)')?.click()`,
    ],
  },
  ahorcado: {
    intro: [],
    configuracion: [`document.querySelectorAll('.mode')[0].click()`],
    escribir: [
      `document.querySelectorAll('.mode')[0].click()`,
      `[...document.querySelectorAll('#setup-form .player-row input')].forEach((i,k)=>{i.value=['Javi','Cata'][k];i.dispatchEvent(new Event('input',{bubbles:true}))})`,
      `document.querySelector('#setup-actions .btn').click()`,
      `document.querySelector('#cover button')?.click()`,
    ],
    juego: [
      `document.querySelectorAll('.mode')[2].click()`,
      `(()=>{const i=document.querySelector('#setup-form input');i.value='Javi';i.dispatchEvent(new Event('input',{bubbles:true}))})()`,
      `document.querySelector('#setup-actions .btn').click()`,
    ],
    'juego-chat': [
      `document.querySelectorAll('.mode')[2].click()`,
      `(()=>{const i=document.querySelector('#setup-form input');i.value='Javi';i.dispatchEvent(new Event('input',{bubbles:true}))})()`,
      `document.querySelector('#setup-actions .btn').click()`,
      // La sala trae chat; acá se enciende a mano para mirar cómo convive con la barra
      `(()=>{document.body.classList.add('chat-on');const m=document.getElementById('chat');m.className='chat';m.hidden=false;m.innerHTML='<button class="chat-fab">💬</button>'})()`,
    ],
    resultado: [
      `document.querySelectorAll('.mode')[2].click()`,
      `(()=>{const i=document.querySelector('#setup-form input');i.value='Javi';i.dispatchEvent(new Event('input',{bubbles:true}))})()`,
      `document.querySelector('#setup-actions .btn').click()`,
      // Se juega sola hasta el final: acá interesa la pantalla, no la partida. Cada jugada lleva
      // su número, que es lo que el reductor usa para descartar repetidas.
      `(()=>{const s=window.__ahorcado.view();const w=(s.words.A||'').toUpperCase();
        let n=0; for (const l of new Set(w.split(''))) if (l!==' ')
          window.__ahorcado.session().transport.send({t:'guess',from:'A',letter:l,n:n++,ms:100});})()`,
      `(()=>{for(let i=0;i<4;i++){const h=document.getElementById('handoff');if(h.hidden)break;const b=h.querySelector('button');b?b.click():h.click()}})()`,
    ],
  },
  /**
   * Batalla Naval contra el celular: el celular es siempre quien abre (`starter` es B), así que
   * para mirar una pantalla concreta hay que mover el turno a mano. `BN_FRENA` le corta el reloj
   * del disparo y se lo deja tomado, para que no se vuelva a armar; `BN_FALLA(rol)` dispara al
   * agua del otro, que se sabe dónde está porque las dos flotas viven en la sesión. Así las dos
   * pantallas de turno salen siempre iguales en vez de depender de dónde apuntó el bot.
   */
  'batalla-naval': {
    intro: [],
    // Contra el celular se llega al tablero sin pantalla de pase de por medio
    colocacion: [...BN_CPU],
    // Mi turno: la barra en lima y el tablero del rival encendido (D-92)
    juego: [...BN_CPU, ...BN_ZARPA, BN_FRENA, BN_FALLA('B')],
    // El turno del rival: la barra apagada y el tablero también (D-92)
    espera: [...BN_CPU, ...BN_ZARPA, BN_FRENA, BN_FALLA('B'), BN_FALLA('A')],
  },
  /**
   * Toque y Fama jugando solo: el juego 🔢 de La Copa (D-142). Para el resultado se juega
   * sola: un intento errado y el bueno, que sale del código guardado con el mismo motor.
   */
  'toque-y-fama': {
    intro: [],
    solo: [`document.querySelectorAll('.mode')[2].click()`],
    'solo-juego': [`document.querySelectorAll('.mode')[2].click()`, `document.getElementById('btn-solo-empezar').click()`],
    'solo-resultado': [
      `document.querySelectorAll('.mode')[2].click()`,
      `document.getElementById('btn-solo-empezar').click()`,
      `(async()=>{const m=await import('../cup/games/number/engine.js');const s=m.generar(__tyf.guardada().codigo,1).secreto;
        const probar=n=>{for(const d of n)[...document.querySelectorAll('.screen.active .keypad button')].find(x=>x.textContent===d).click();document.querySelector('.screen.active .keypad .ok').click()};
        probar(s==='0123'?'4567':'0123');probar(s);})()`,
      `document.getElementById('btn-fin').click()`,
      `1`, `1`, `1`, `1`,   // que pase el confeti
    ],
  },
  /**
   * Línea de Tiempo jugando solo: la ⏳ Línea Relámpago de La Copa (D-142). Para el resultado
   * se juega entera, la primera carta mal y el resto bien, con el mismo motor que la reparte.
   */
  'linea-de-tiempo': {
    intro: [],
    solo: [`[...document.querySelectorAll('.mode')].find(m=>/solo|alone|sozinho|allein/i.test(m.textContent)).click()`],
    'solo-juego': [`[...document.querySelectorAll('.mode')].find(m=>/solo|alone|sozinho|allein/i.test(m.textContent)).click()`, `document.getElementById('btn-solo-empezar').click()`],
    'solo-resultado': [
      `[...document.querySelectorAll('.mode')].find(m=>/solo|alone|sozinho|allein/i.test(m.textContent)).click()`,
      `document.getElementById('btn-solo-empezar').click()`,
      `(async()=>{const L=await import('../cup/games/timeline/engine.js');const s=__ldt.solo();const p=L.generar(s.codigo,1,{tema:s.tema,excluir:s.skip});
        let j=[];for(const c of p.mano){const l=L.estado(p,j).linea;const bien=L.huecoCorrecto(l,c);j=[...j,{c:c.id,at:j.length?bien:(bien?0:l.length)}];}
        const esperar=async f=>{for(let i=0;i<40&&!f();i++)await new Promise(r=>setTimeout(r,50));return f();};
        for(const x of j){(await esperar(()=>document.getElementById('handoff').hidden&&document.querySelector('#solo-juego .hand .card[data-card="'+x.c+'"]'))).click();
          document.querySelector('#solo-juego .line .slot[data-slot="'+x.at+'"]').click();document.getElementById('btn-colocar').click();document.getElementById('handoff').click();}})()`,
      `1`, `1`, `1`, `1`,   // las nueve jugadas siguen solas mientras tanto
      `document.getElementById('btn-fin').click()`,
      `1`, `1`, `1`, `1`,   // que pase el confeti
    ],
  },
  /**
   * Tango suelto, el juego ☀️ de La Copa. `juego` es el tablero lleno menos una casilla,
   * para comparar el sol dado con el jugado (#61); `choque`, lleno con un último sol que choca,
   * que es el único choque que se ve sin tocar otra casilla (#135).
   */
  tango: {
    intro: [],
    juego: [TAN_EMPEZAR, `1`, `1`, `1`, `1`, TAN_LLENAR(false)],
    choque: [TAN_EMPEZAR, `1`, `1`, `1`, `1`, TAN_LLENAR(true)],
  },
  /**
   * El panel del dueño no es un juego, pero se mira igual: `window.__panel.seed` lo dibuja
   * con datos sembrados, sin entrar con Google ni tocar la base (C-14). Los datos traen a
   * propósito un juego (`juego-nuevo`), un modo (`equipos`) y un idioma (`fr`) que no están
   * en el registro: así se ve de una que el panel los muestra igual (C-16).
   *
   * Las copas se arman con el motor de verdad (`nuevaMeta`): una a media semana con alguien
   * jugando ahora, una que empieza hoy, una de laboratorio, una terminada y una por empezar.
   * Cada toma abre una sección o una ficha por su ruta (D-207); `datos` es la de audiencia.
   */
  panel: {
    ...Object.fromEntries([['datos', '/audiencia'], ['ahora', '/ahora'], ['resumen', '/ahora'], ['torneo', '/torneo'], ['juegos', '/juegos'], ['audiencia', '/audiencia'],
      ['copa-ficha', '/torneo/OFICI'], ['juego-ficha', '/juego/dudo'], ['sala-ficha', '/sala/CPSV'], ['trafico', '/trafico']].map(([toma, vista]) => [toma, [SEMBRAR_PANEL(vista)]])),
    // Las otras dos pestañas de la ficha de una copa (D-207)
    'copa-dias': [SEMBRAR_PANEL('/torneo/OFICI'), `[...document.querySelectorAll('.subtabs button')][1].click()`],
    'copa-historia': [SEMBRAR_PANEL('/torneo/OFICI'), `[...document.querySelectorAll('.subtabs button')][2].click()`],
  },
};

/**
 * Los juegos sueltos de La Copa que no tienen camino propio (D-199): la antesala y el juego
 * recién empezado. Con esto las pruebas de idiomas recorren todos, y `mirar` también los abre.
 */
for (const { id } of SUELTOS) {
  CAMINOS[id] ||= { intro: [], juego: [TAN_EMPEZAR, `1`, `1`, `1`, `1`, `1`, `1`] };
}
