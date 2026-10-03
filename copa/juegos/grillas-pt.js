/**
 * As grades de 🔗 Conexões em português do Brasil (D-170). Las mismas reglas que las de español
 * (grillas.js): cuatro grupos de cuatro, del más fácil al más difícil, por significado (D-128) y
 * con distractores (D-102). Propias del idioma: COLAR es pegar y un collar, MANGUEIRA es una
 * manguera y un árbol de mangos, URUBU es un ave y la mascota del Flamengo.
 */
export const GRILLAS = [
  {
    id: 'sapato',
    grupos: [
      { nombre: 'Partes de um sapato', palabras: ['SOLA', 'PALMILHA', 'CADARÇO', 'SALTO'] },
      { nombre: 'Coisas da sinuca', palabras: ['TACO', 'GIZ', 'CAÇAPA', 'BOLA'] },
      { nombre: 'Combustíveis', palabras: ['LENHA', 'CARVÃO', 'GASOLINA', 'ETANOL'] },
      { nombre: 'Ferramentas', palabras: ['MARTELO', 'SERROTE', 'ALICATE', 'CHAVE DE FENDA'] },
    ],
  },
  {
    id: 'ceu',
    grupos: [
      { nombre: 'Signos do zodíaco', palabras: ['ÁRIES', 'TOURO', 'LEÃO', 'PEIXES'] },
      { nombre: 'Planetas', palabras: ['SATURNO', 'URANO', 'TERRA', 'MERCÚRIO'] },
      { nombre: 'Deuses gregos', palabras: ['ZEUS', 'HERA', 'APOLO', 'HERMES'] },
      { nombre: 'Missões espaciais', palabras: ['GEMINI', 'SOYUZ', 'VOSTOK', 'ARTEMIS'] },
    ],
  },
  {
    id: 'xadrez',
    grupos: [
      { nombre: 'Peças de xadrez', palabras: ['BISPO', 'CAVALO', 'PEÃO', 'TORRE'] },
      { nombre: 'Unidades de peso', palabras: ['ONÇA', 'GRAMA', 'ARROBA', 'TONELADA'] },
      { nombre: 'Moedas', palabras: ['LIBRA', 'EURO', 'IENE', 'RÚPIA'] },
      { nombre: 'Instrumentos de sopro', palabras: ['FLAUTA', 'TROMPETE', 'CLARINETE', 'SAXOFONE'] },
    ],
  },
  {
    id: 'casa',
    grupos: [
      { nombre: 'Móveis', palabras: ['SOFÁ', 'CÔMODA', 'ESTANTE', 'POLTRONA'] },
      { nombre: 'Eletrodomésticos', palabras: ['GELADEIRA', 'FOGÃO', 'LIQUIDIFICADOR', 'BATEDEIRA'] },
      { nombre: 'Partes de uma casa', palabras: ['TELHADO', 'PORTA', 'JANELA', 'ESCADA'] },
      { nombre: 'Ferramentas de jardim', palabras: ['RASTELO', 'PÁ', 'MANGUEIRA', 'TESOURA'] },
    ],
  },
  {
    id: 'cores',
    // Con palabras que solo se conocen en Brasil: fuera de una copa internacional (D-186)
    local: 'br',
    grupos: [
      { nombre: 'Frutas', palabras: ['CEREJA', 'PÊSSEGO', 'FRAMBOESA', 'AMEIXA'] },
      { nombre: 'Cores', palabras: ['TURQUESA', 'OCRE', 'MAGENTA', 'LARANJA'] },
      { nombre: 'Pedras preciosas', palabras: ['RUBI', 'ESMERALDA', 'SAFIRA', 'TOPÁZIO'] },
      { nombre: 'Árvores', palabras: ['IPÊ', 'PINHEIRO', 'JEQUITIBÁ', 'ARAUCÁRIA'] },
    ],
  },
  {
    id: 'escola',
    grupos: [
      { nombre: 'Matérias da escola', palabras: ['QUÍMICA', 'FÍSICA', 'HISTÓRIA', 'MÚSICA'] },
      { nombre: 'Metais', palabras: ['OURO', 'PRATA', 'COBRE', 'FERRO'] },
      { nombre: 'Grupos de pessoas', palabras: ['TRIBO', 'CLÃ', 'BANDA', 'GANGUE'] },
      { nombre: 'Material escolar', palabras: ['CADERNO', 'LÁPIS', 'BORRACHA', 'RÉGUA'] },
    ],
  },
  {
    id: 'festa',
    // Con palabras que solo se conocen en Brasil: fuera de una copa internacional (D-186)
    local: 'br',
    grupos: [
      { nombre: 'Frutas tropicais', palabras: ['ABACAXI', 'MANGA', 'MAMÃO', 'MARACUJÁ'] },
      { nombre: 'Filmes da Pixar', palabras: ['CARROS', 'SOUL', 'VALENTE', 'UP'] },
      { nombre: 'Danças', palabras: ['SALSA', 'FORRÓ', 'FREVO', 'SAMBA'] },
      { nombre: 'Molhos', palabras: ['PESTO', 'AIOLI', 'VINAGRETE', 'BECHAMEL'] },
    ],
  },
  {
    id: 'aviao',
    // Con palabras que solo se conocen en Brasil: fuera de una copa internacional (D-186)
    local: 'br',
    grupos: [
      { nombre: 'Sinais de pontuação', palabras: ['VÍRGULA', 'PONTO', 'HÍFEN', 'TRAVESSÃO'] },
      { nombre: 'Fontes de texto', palabras: ['ARIAL', 'TIMES', 'CALIBRI', 'VERDANA'] },
      { nombre: 'Cortes de carne', palabras: ['PICANHA', 'ALCATRA', 'FRALDINHA', 'MAMINHA'] },
      { nombre: 'Partes de um avião', palabras: ['ASA', 'CABINE', 'TREM DE POUSO', 'CAUDA'] },
    ],
  },
  {
    id: 'mundo',
    grupos: [
      { nombre: 'Rios da Europa', palabras: ['DANÚBIO', 'SENA', 'TÂMISA', 'RENO'] },
      { nombre: 'Ilhas', palabras: ['CUBA', 'MALTA', 'CHIPRE', 'CRETA'] },
      { nombre: 'Drinques', palabras: ['MOJITO', 'CAIPIRINHA', 'MARGARITA', 'DAIQUIRI'] },
      { nombre: 'Cidades com nome de mulher', palabras: ['FLORENÇA', 'VITÓRIA', 'ADELAIDE', 'LOURDES'] },
    ],
  },
  {
    id: 'cozinha',
    // Con palabras que solo se conocen en Brasil: fuera de una copa internacional (D-186)
    local: 'br',
    grupos: [
      { nombre: 'Utensílios de cozinha', palabras: ['BATEDOR', 'ESCORREDOR', 'RALADOR', 'CONCHA'] },
      { nombre: 'Ervas', palabras: ['MANJERICÃO', 'ORÉGANO', 'ALECRIM', 'LOURO'] },
      { nombre: 'Pintores', palabras: ['PORTINARI', 'MONET', 'DALÍ', 'PICASSO'] },
      { nombre: 'Prêmios', palabras: ['NOBEL', 'OSCAR', 'GRAMMY', 'JABUTI'] },
    ],
  },
  {
    id: 'mitos',
    // Con palabras que solo se conocen en Brasil: fuera de una copa internacional (D-186)
    local: 'br',
    grupos: [
      { nombre: 'Filhotes', palabras: ['BEZERRO', 'CORDEIRO', 'POTRO', 'LEITÃO'] },
      { nombre: 'Aparelhos de ginástica', palabras: ['CAVALO', 'BARRA', 'ARGOLAS', 'TRAVE'] },
      { nombre: 'Constelações', palabras: ['ÓRION', 'CASSIOPEIA', 'PÉGASO', 'ANDRÔMEDA'] },
      { nombre: 'Criaturas do folclore', palabras: ['SACI', 'CURUPIRA', 'BOITATÁ', 'IARA'] },
    ],
  },
  {
    id: 'tela',
    grupos: [
      { nombre: 'Redes sociais', palabras: ['TIKTOK', 'INSTAGRAM', 'FACEBOOK', 'LINKEDIN'] },
      { nombre: 'Coisas que se faz no computador', palabras: ['COPIAR', 'COLAR', 'SALVAR', 'IMPRIMIR'] },
      { nombre: 'Coisas que se faz no salão', palabras: ['CORTAR', 'PINTAR', 'ESCOVAR', 'ALISAR'] },
      { nombre: 'Golpes', palabras: ['SOCO', 'TAPA', 'CHUTE', 'CABEÇADA'] },
    ],
  },
  {
    id: 'futebol',
    // Con palabras que solo se conocen en Brasil: fuera de una copa internacional (D-186)
    local: 'br',
    grupos: [
      { nombre: 'Clubes de futebol', palabras: ['FLAMENGO', 'PALMEIRAS', 'CORINTHIANS', 'GRÊMIO'] },
      { nombre: 'Aves', palabras: ['SABIÁ', 'TUCANO', 'ARARA', 'URUBU'] },
      { nombre: 'Jogos de cartas', palabras: ['TRUCO', 'BURACO', 'PÔQUER', 'CANASTRA'] },
      { nombre: 'Brincadeiras de criança', palabras: ['AMARELINHA', 'PIQUE', 'PIÃO', 'PIPA'] },
    ],
  },
];

/** A grade da sessão de teste (D-103), fora do sorteio. */
export const GRILLA_ENSAYO = {
  id: 'ensayo',
  grupos: [
    { nombre: 'Cores', palabras: ['VERMELHO', 'AZUL', 'VERDE', 'AMARELO'] },
    { nombre: 'Frutas', palabras: ['MAÇÃ', 'PERA', 'UVA', 'BANANA'] },
    { nombre: 'Animais da fazenda', palabras: ['VACA', 'GALINHA', 'PORCO', 'OVELHA'] },
    { nombre: 'Coisas com teclas', palabras: ['PIANO', 'TECLADO', 'CALCULADORA', 'CONTROLE'] },
  ],
};
