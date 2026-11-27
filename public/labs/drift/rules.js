/**
 * Drift (Derrape): the game's data, no logic (C-2). Texts in LOCALES = { es, en, pt } with the same keys
 * (C-3); the physics and rules are in engine.js, the stages in tracks.js. See docs/games/drift.md and
 * the plan in docs/rally/.
 */

export const GAME_ID = 'drift';
/** The tuning panel's own memory on this phone (core section 12): never ranked, never sent. */
export const TUNING_KEY = 'juegos-de-salon:drift:tuning';

const ES = {
  ui: {
    docTitle: 'Derrape 🏁 · Juegos de Salón', gameChip: '🏁 Derrape', menu: '‹ Laboratorio',
    title: 'Derrape', lead: 'Derrapa contra el reloj por un camino de tierra, puerta por puerta.',
    howTitle: '🏁 Cómo se juega', play: '🏁 Jugar', go: '¡A correr!',
    hint: '👈 👉 Mantén un lado para girar y los dos para frenar',
    hintSteer: '👈 👉 Desliza para girar', hintPedal: '👆 Mantén: aceleras\n👇 Bájalo: frenas y retrocedes',
    hintStick: '🕹️ Desliza: a los lados giras, arriba aceleras, abajo frenas y retrocedes',
    gateOf: 'Puerta {n} de {total}', penalty: '+{s} s', resetLabel: 'Volver al camino',
    paused: 'En pausa', tapToGo: 'Toca para seguir',
    resumeTitle: '⏯ Hay una partida a medias', resume: 'Continuar', delete: 'Borrar',
    resultTitle: 'Tu tiempo', clean: 'Sin castigos: todas las puertas a la primera.',
    withPenalty: '{clock} en el reloj y {s} s de castigo.',
    again: '🏁 Jugar otra vez', shareRotulo: '📤 Compartir', shareContext: 'Contrarreloj', shareLine: '⏱️ Hice {time} en Derrape.',
    tuneOpen: 'Ajustes del auto', tuneTitle: '🔧 Ajustes del auto', tuneCamera: 'Cámara',
    camFollow: 'Gira con el auto', camFixed: 'Mapa fijo', tuneAhead: 'Camino a la vista (m)',
    tuneCopy: '📋 Copiar valores', tuneCopied: 'Copiados', tuneDefaults: 'Volver a los de fábrica',
    tuneFrame: 'Cuadro: {ms} ms', tuneClose: 'Cerrar',
    tuneControls: 'Controles', schemeWheel: '🕹️ Volante y pedal', schemeStick: '👆 Un dedo', schemeAuto: 'Acelera solo',
    tuneSetting: 'Escenario', settingStage: '🏁 Etapa', settingMeadow: '🌿 Pradera', settingForest: '🔥 Bosque', settingPlain: '🌙 Llanura',
    tuneReach: 'Recorrido del pulgar (px)',
  },
  como: [
    '🏁 Cruza todas las puertas hasta la meta en el menor tiempo.',
    '🕹️ Pulgar izquierdo: desliza para girar. Pulgar derecho: mantén para acelerar y bájalo para frenar y retroceder.',
    '⏱️ Saltarte una puerta suma 10 segundos. Si te sales, ↺ te devuelve al camino por 5 segundos.',
  ],
};

const EN = {
  ui: {
    docTitle: 'Drift 🏁 · Parlor Games', gameChip: '🏁 Drift', menu: '‹ Lab',
    title: 'Drift', lead: 'Slide against the clock down a dirt road, gate by gate.',
    howTitle: '🏁 How to play', play: '🏁 Play', go: 'Go!',
    hint: '👈 👉 Hold one side to steer, both to brake',
    hintSteer: '👈 👉 Slide to steer', hintPedal: '👆 Hold: speed up\n👇 Slide down: brake, then reverse',
    hintStick: '🕹️ Slide: sideways to steer, up to speed up, down to brake, then reverse',
    gateOf: 'Gate {n} of {total}', penalty: '+{s} s', resetLabel: 'Back on the road',
    paused: 'Paused', tapToGo: 'Tap to go on',
    resumeTitle: '⏯ There is a game in progress', resume: 'Continue', delete: 'Delete',
    resultTitle: 'Your time', clean: 'No penalties: every gate on the first try.',
    withPenalty: '{clock} on the clock and {s} s of penalties.',
    again: '🏁 Play again', shareRotulo: '📤 Share', shareContext: 'Time trial', shareLine: '⏱️ I clocked {time} in Drift.',
    tuneOpen: 'Car settings', tuneTitle: '🔧 Car settings', tuneCamera: 'Camera',
    camFollow: 'Turns with the car', camFixed: 'Fixed map', tuneAhead: 'Road in view (m)',
    tuneCopy: '📋 Copy values', tuneCopied: 'Copied', tuneDefaults: 'Back to the defaults',
    tuneFrame: 'Frame: {ms} ms', tuneClose: 'Close',
    tuneControls: 'Controls', schemeWheel: '🕹️ Wheel and pedal', schemeStick: '👆 One finger', schemeAuto: 'Self-accelerating',
    tuneSetting: 'Setting', settingStage: '🏁 Stage', settingMeadow: '🌿 Meadow', settingForest: '🔥 Forest', settingPlain: '🌙 Plain',
    tuneReach: 'Thumb travel (px)',
  },
  como: [
    '🏁 Drive through every gate to the finish in the shortest time.',
    '🕹️ Left thumb: slide to steer. Right thumb: hold to speed up, slide it down to brake, then reverse.',
    '⏱️ Missing a gate adds 10 seconds. If you go off, ↺ puts you back on the road for 5 seconds.',
  ],
};

const PT = {
  ui: {
    docTitle: 'Derrapagem 🏁 · Jogos de Salão', gameChip: '🏁 Derrapagem', menu: '‹ Laboratório',
    title: 'Derrapagem', lead: 'Derrape contra o relógio numa estrada de terra, portão por portão.',
    howTitle: '🏁 Como se joga', play: '🏁 Jogar', go: 'Já!',
    hint: '👈 👉 Segure um lado para virar e os dois para frear',
    hintSteer: '👈 👉 Deslize para virar', hintPedal: '👆 Segure: acelera\n👇 Desça: freia e dá ré',
    hintStick: '🕹️ Deslize: para os lados vira, para cima acelera, para baixo freia e dá ré',
    gateOf: 'Portão {n} de {total}', penalty: '+{s} s', resetLabel: 'Voltar à estrada',
    paused: 'Em pausa', tapToGo: 'Toque para seguir',
    resumeTitle: '⏯ Há uma partida pela metade', resume: 'Continuar', delete: 'Apagar',
    resultTitle: 'Seu tempo', clean: 'Sem penalidades: todos os portões de primeira.',
    withPenalty: '{clock} no relógio e {s} s de penalidade.',
    again: '🏁 Jogar de novo', shareRotulo: '📤 Compartilhar', shareContext: 'Contra o relógio', shareLine: '⏱️ Fiz {time} em Derrapagem.',
    tuneOpen: 'Ajustes do carro', tuneTitle: '🔧 Ajustes do carro', tuneCamera: 'Câmera',
    camFollow: 'Gira com o carro', camFixed: 'Mapa fixo', tuneAhead: 'Estrada à vista (m)',
    tuneCopy: '📋 Copiar valores', tuneCopied: 'Copiados', tuneDefaults: 'Voltar aos de fábrica',
    tuneFrame: 'Quadro: {ms} ms', tuneClose: 'Fechar',
    tuneControls: 'Controles', schemeWheel: '🕹️ Volante e pedal', schemeStick: '👆 Um dedo', schemeAuto: 'Acelera sozinho',
    tuneSetting: 'Cenário', settingStage: '🏁 Etapa', settingMeadow: '🌿 Prado', settingForest: '🔥 Floresta', settingPlain: '🌙 Planície',
    tuneReach: 'Curso do polegar (px)',
  },
  como: [
    '🏁 Passe por todos os portões até a chegada no menor tempo.',
    '🕹️ Polegar esquerdo: deslize para virar. Polegar direito: segure para acelerar e desça para frear e dar ré.',
    '⏱️ Pular um portão soma 10 segundos. Se você sair, ↺ te leva de volta à estrada por 5 segundos.',
  ],
};

export const LOCALES = { es: ES, en: EN, pt: PT };
