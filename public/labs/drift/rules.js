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
    sceneLabel: 'Cómo ves la carrera', scene2d: '🗺️ Vista 2D', scene3d: '🚗 Vista 3D',
    hint: '👈 👉 Mantén un lado para girar y los dos para frenar',
    hintSteer: '👈 👉 Desliza para girar', hintPedal: '👆 Mantén: aceleras\n👇 Bájalo: frenas y retrocedes',
    hintStick: '🕹️ Desliza: a los lados giras, arriba aceleras, abajo frenas y retrocedes',
    howStick: '🕹️ Un dedo: deslízalo a los lados para girar, arriba para acelerar y abajo para frenar y retroceder.',
    gateOf: 'Puerta {n} de {total}', penalty: '+{s} s', resetLabel: 'Volver al camino',
    paused: 'En pausa', tapToGo: 'Toca para seguir',
    resumeTitle: '⏯ Hay una partida a medias', resume: 'Continuar', delete: 'Borrar',
    ghostGap: '👻 {d} s', ghostRecord: '👻 ¡Nuevo récord! Tu fantasma correrá esta vuelta.', ghostBest: '👻 Tu récord: {clock}.',
    resultTitle: 'Tu tiempo', clean: 'Sin castigos: todas las puertas a la primera.',
    withPenalty: '{clock} en el reloj y {s} s de castigo.',
    withBonus: '{clock} en el reloj y {b} s de premio.', withBoth: '{clock} en el reloj, {p} s de castigo y {b} s de premio.',
    bonus: '−{s} s', tokenTag: '−{s} s',
    ghostLabel: 'Contra quién corres', ghostMine: '👻 Mi récord', ghostIntermediate: 'Intermedio', ghostExpert: 'Experto',
    expertBeat: '👻 Le ganaste al fantasma del piloto experto por {s} s.', expertLost: '👻 El fantasma del piloto experto llegó {s} s antes. ¡Alcánzalo!',
    medalGold: '🥇 Medalla de oro: le ganaste al piloto experto.', medalSilver: '🥈 Medalla de plata. El oro es {clock}.', medalBronze: '🥉 Medalla de bronce. La plata es {clock}.', medalNone: 'Sin medalla todavía. El bronce es {clock}.',
    pacerBeat: '👻 Le ganaste al fantasma del piloto intermedio por {s} s.', pacerLost: '👻 El fantasma del piloto intermedio llegó {s} s antes. ¡Alcánzalo!',
    again: '🏁 Jugar otra vez', shareRotulo: '📤 Compartir', shareContext: 'Contrarreloj', shareLine: '⏱️ Hice {time} en Derrape.', shareWrecked: '💥 Destrocé el auto en la puerta {n} de {total} en Derrape.',
    lives: 'Vidas: {n}', wreckedTitle: 'Auto destrozado', wreckedDetail: 'Te quedaste sin vidas en la puerta {n} de {total}.',
    tuneOpen: 'Ajustes del auto', tuneTitle: '🔧 Ajustes del auto', tuneCamera: 'Cámara',
    camFollow: 'Gira con el auto', camFixed: 'Mapa fijo', tuneAhead: 'Camino a la vista (m)',
    tuneCopy: '📋 Copiar valores', tuneCopied: 'Copiados', tuneDefaults: 'Volver a los de fábrica',
    tuneFrame: 'Cuadro: {ms} ms', tuneClose: 'Cerrar',
    tuneControls: 'Controles', schemeWheel: '🕹️ Volante y pedal', schemeStick: '👆 Un dedo', schemeAuto: 'Acelera solo',
    tuneSetting: 'Escenario', settingStage: '🏁 Etapa', settingMeadow: '🌿 Pradera', settingForest: '🔥 Bosque', settingPlain: '🌙 Llanura',
    tuneReach: 'Recorrido del pulgar (px)', tuneTop: 'Velocidad máxima (m/s)',
    tuneStage: 'Circuito (empieza de nuevo)', stageWeek: '📅 El de la semana',
  },
  como: [
    '🏁 Cruza todas las puertas hasta la meta en el menor tiempo.',
    '🕹️ Pulgar izquierdo: desliza para girar. Pulgar derecho: mantén para acelerar y bájalo para frenar y retroceder.',
    '⏱️ Saltarte una puerta suma 10 segundos y ↺ suma 5. Atrapa los números del camino: −10 te quita 10 segundos.',
  ],
};

const EN = {
  ui: {
    docTitle: 'Drift 🏁 · Parlor Games', gameChip: '🏁 Drift', menu: '‹ Lab',
    title: 'Drift', lead: 'Slide against the clock down a dirt road, gate by gate.',
    howTitle: '🏁 How to play', play: '🏁 Play', go: 'Go!',
    sceneLabel: 'How you see the race', scene2d: '🗺️ 2D view', scene3d: '🚗 3D view',
    hint: '👈 👉 Hold one side to steer, both to brake',
    hintSteer: '👈 👉 Slide to steer', hintPedal: '👆 Hold: speed up\n👇 Slide down: brake, then reverse',
    hintStick: '🕹️ Slide: sideways to steer, up to speed up, down to brake, then reverse',
    howStick: '🕹️ One finger: slide it sideways to steer, up to speed up, and down to brake, then reverse.',
    gateOf: 'Gate {n} of {total}', penalty: '+{s} s', resetLabel: 'Back on the road',
    paused: 'Paused', tapToGo: 'Tap to go on',
    resumeTitle: '⏯ There is a game in progress', resume: 'Continue', delete: 'Delete',
    ghostGap: '👻 {d} s', ghostRecord: '👻 New record! Your ghost will race this lap.', ghostBest: '👻 Your record: {clock}.',
    resultTitle: 'Your time', clean: 'No penalties: every gate on the first try.',
    withPenalty: '{clock} on the clock and {s} s of penalties.',
    withBonus: '{clock} on the clock and {b} s of bonus.', withBoth: '{clock} on the clock, {p} s of penalties and {b} s of bonus.',
    bonus: '−{s} s', tokenTag: '−{s} s',
    ghostLabel: 'Who you race', ghostMine: '👻 My record', ghostIntermediate: 'Intermediate', ghostExpert: 'Expert',
    expertBeat: '👻 You beat the expert driver’s ghost by {s} s.', expertLost: '👻 The expert driver’s ghost finished {s} s ahead. Catch it!',
    medalGold: '🥇 Gold medal: you beat the expert driver.', medalSilver: '🥈 Silver medal. Gold is {clock}.', medalBronze: '🥉 Bronze medal. Silver is {clock}.', medalNone: 'No medal yet. Bronze is {clock}.',
    pacerBeat: '👻 You beat the intermediate driver’s ghost by {s} s.', pacerLost: '👻 The intermediate driver’s ghost finished {s} s ahead. Catch it!',
    again: '🏁 Play again', shareRotulo: '📤 Share', shareContext: 'Time trial', shareLine: '⏱️ I clocked {time} in Drift.', shareWrecked: '💥 I wrecked the car at gate {n} of {total} in Drift.',
    lives: 'Lives: {n}', wreckedTitle: 'Car wrecked', wreckedDetail: 'You ran out of lives at gate {n} of {total}.',
    tuneOpen: 'Car settings', tuneTitle: '🔧 Car settings', tuneCamera: 'Camera',
    camFollow: 'Turns with the car', camFixed: 'Fixed map', tuneAhead: 'Road in view (m)',
    tuneCopy: '📋 Copy values', tuneCopied: 'Copied', tuneDefaults: 'Back to the defaults',
    tuneFrame: 'Frame: {ms} ms', tuneClose: 'Close',
    tuneControls: 'Controls', schemeWheel: '🕹️ Wheel and pedal', schemeStick: '👆 One finger', schemeAuto: 'Self-accelerating',
    tuneSetting: 'Setting', settingStage: '🏁 Stage', settingMeadow: '🌿 Meadow', settingForest: '🔥 Forest', settingPlain: '🌙 Plain',
    tuneReach: 'Thumb travel (px)', tuneTop: 'Top speed (m/s)',
    tuneStage: 'Circuit (starts again)', stageWeek: '📅 This week’s',
  },
  como: [
    '🏁 Drive through every gate to the finish in the shortest time.',
    '🕹️ Left thumb: slide to steer. Right thumb: hold to speed up, slide it down to brake, then reverse.',
    '⏱️ Missing a gate adds 10 seconds and ↺ adds 5. Catch the numbers on the road: −10 takes 10 seconds off.',
  ],
};

const PT = {
  ui: {
    docTitle: 'Derrapagem 🏁 · Jogos de Salão', gameChip: '🏁 Derrapagem', menu: '‹ Laboratório',
    title: 'Derrapagem', lead: 'Derrape contra o relógio numa estrada de terra, portão por portão.',
    howTitle: '🏁 Como se joga', play: '🏁 Jogar', go: 'Já!',
    sceneLabel: 'Como você vê a corrida', scene2d: '🗺️ Visão 2D', scene3d: '🚗 Visão 3D',
    hint: '👈 👉 Segure um lado para virar e os dois para frear',
    hintSteer: '👈 👉 Deslize para virar', hintPedal: '👆 Segure: acelera\n👇 Desça: freia e dá ré',
    hintStick: '🕹️ Deslize: para os lados vira, para cima acelera, para baixo freia e dá ré',
    howStick: '🕹️ Um dedo: deslize para os lados para virar, para cima para acelerar e para baixo para frear e dar ré.',
    gateOf: 'Portão {n} de {total}', penalty: '+{s} s', resetLabel: 'Voltar à estrada',
    paused: 'Em pausa', tapToGo: 'Toque para seguir',
    resumeTitle: '⏯ Há uma partida pela metade', resume: 'Continuar', delete: 'Apagar',
    ghostGap: '👻 {d} s', ghostRecord: '👻 Novo recorde! Seu fantasma vai correr esta volta.', ghostBest: '👻 Seu recorde: {clock}.',
    resultTitle: 'Seu tempo', clean: 'Sem penalidades: todos os portões de primeira.',
    withPenalty: '{clock} no relógio e {s} s de penalidade.',
    withBonus: '{clock} no relógio e {b} s de bônus.', withBoth: '{clock} no relógio, {p} s de penalidade e {b} s de bônus.',
    bonus: '−{s} s', tokenTag: '−{s} s',
    ghostLabel: 'Contra quem você corre', ghostMine: '👻 Recorde', ghostIntermediate: 'Médio', ghostExpert: 'Experiente',
    expertBeat: '👻 Você venceu o fantasma do piloto experiente por {s} s.', expertLost: '👻 O fantasma do piloto experiente chegou {s} s antes. Alcance-o!',
    medalGold: '🥇 Medalha de ouro: você venceu o piloto experiente.', medalSilver: '🥈 Medalha de prata. O ouro é {clock}.', medalBronze: '🥉 Medalha de bronze. A prata é {clock}.', medalNone: 'Ainda sem medalha. O bronze é {clock}.',
    pacerBeat: '👻 Você venceu o fantasma do piloto intermediário por {s} s.', pacerLost: '👻 O fantasma do piloto intermediário chegou {s} s antes. Alcance-o!',
    again: '🏁 Jogar de novo', shareRotulo: '📤 Compartilhar', shareContext: 'Contra o relógio', shareLine: '⏱️ Fiz {time} em Derrapagem.', shareWrecked: '💥 Destruí o carro no portão {n} de {total} em Derrapagem.',
    lives: 'Vidas: {n}', wreckedTitle: 'Carro destruído', wreckedDetail: 'Você ficou sem vidas no portão {n} de {total}.',
    tuneOpen: 'Ajustes do carro', tuneTitle: '🔧 Ajustes do carro', tuneCamera: 'Câmera',
    camFollow: 'Gira com o carro', camFixed: 'Mapa fixo', tuneAhead: 'Estrada à vista (m)',
    tuneCopy: '📋 Copiar valores', tuneCopied: 'Copiados', tuneDefaults: 'Voltar aos de fábrica',
    tuneFrame: 'Quadro: {ms} ms', tuneClose: 'Fechar',
    tuneControls: 'Controles', schemeWheel: '🕹️ Volante e pedal', schemeStick: '👆 Um dedo', schemeAuto: 'Acelera sozinho',
    tuneSetting: 'Cenário', settingStage: '🏁 Etapa', settingMeadow: '🌿 Prado', settingForest: '🔥 Floresta', settingPlain: '🌙 Planície',
    tuneReach: 'Curso do polegar (px)', tuneTop: 'Velocidade máxima (m/s)',
    tuneStage: 'Circuito (começa de novo)', stageWeek: '📅 O da semana',
  },
  como: [
    '🏁 Passe por todos os portões até a chegada no menor tempo.',
    '🕹️ Polegar esquerdo: deslize para virar. Polegar direito: segure para acelerar e desça para frear e dar ré.',
    '⏱️ Pular um portão soma 10 segundos e ↺ soma 5. Pegue os números da estrada: −10 tira 10 segundos.',
  ],
};

export const LOCALES = { es: ES, en: EN, pt: PT };
