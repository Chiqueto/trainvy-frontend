export type GamificationThemeKey =
  | "ALL"
  | "ANIMES"
  | "VEHICLES"
  | "ANIMALS"
  | "MOVIES_SERIES"
  | "GAMES"
  | "MAROMBA_BR";

export interface GamificationThemeInfo {
  id: GamificationThemeKey;
  label: string;
  emoji: string;
  tagline: string;
  description: string;
  samplePraise: string;
  sampleComparison: string;
}

export const GAMIFICATION_THEMES: Record<GamificationThemeKey, GamificationThemeInfo> = {
  ALL: {
    id: "ALL",
    label: "Todos (Misto)",
    emoji: "✨",
    tagline: "Universo aberto e variado",
    description: "Mistura surpresas de animes, carros, feras, cinema, games e a pura cultura maromba a cada treino.",
    samplePraise: "Hoje até o Sr. Miyagi e o Tanjiro aplaudiriam de pé!",
    sampleComparison: "Você levantou 4 Porsches ou 1 Hipopótamo!",
  },
  ANIMES: {
    id: "ANIMES",
    label: "Animes",
    emoji: "⚔️",
    tagline: "Poder de luta e disciplina ninja",
    description: "Frases de Tanjiro, Rock Lee, Goku, Gojo, Guts, Luffy e pesos de rochas gigantes, katanas e armaduras lendárias.",
    samplePraise: "Parabéns, hoje você treinou como o Tanjiro na Seleção Final!",
    sampleComparison: "Carga total equivale a 3 rochas gigantes cortadas pelo Tanjiro!",
  },
  VEHICLES: {
    id: "VEHICLES",
    label: "Veículos",
    emoji: "🏎️",
    tagline: "Potência, torque e velocidade bruta",
    description: "Comparações com supercarros, caças a jato, locomotivas, tanques de guerra e motores roncando alto.",
    samplePraise: "Motor V12 biturbo cortando giro na reta de Interlagos!",
    sampleComparison: "Hoje você levantou o peso de 5 Porsches 911 ou 1 Tanque de Guerra!",
  },
  ANIMALS: {
    id: "ANIMALS",
    label: "Animais",
    emoji: "🦁",
    tagline: "Força da selva e instinto animal",
    description: "Comparações selvagens com gorilas, crocodilos, ursos polares, rinocerontes, elefantes e baleias.",
    samplePraise: "Força bruta de gorila das montanhas: a selva toda respeitou seu treino!",
    sampleComparison: "Volume total equivalente a 1 Hipopótamo adulto e 2 leões!",
  },
  MOVIES_SERIES: {
    id: "MOVIES_SERIES",
    label: "Filmes & Séries",
    emoji: "🎬",
    tagline: "Grandes lendas da cultura pop",
    description: "Citações de Rocky Balboa, Sr. Miyagi, Exterminador, Batman, John Wick, Matrix e DeLorean.",
    samplePraise: "Caramba, hoje até o Sr. Miyagi ficaria impressionado! Tira casaco, puxa ferro!",
    sampleComparison: "Você levantou o peso de 4 DeLoreans ou 1 T-Rex de Jurassic Park!",
  },
  GAMES: {
    id: "GAMES",
    label: "Games & RPG",
    emoji: "🎮",
    tagline: "Boss fights, subidas de nível e XP puro",
    description: "Frases de Elden Ring, God of War, Dark Souls, The Witcher, Pokémon e pesos de itens lendários dos games.",
    samplePraise: "Você derrotou o cansaço sem tomar um hit: PREY SLAUGHTERED!",
    sampleComparison: "Volume total equivale a 4 Espadas Buster ou 1 Mecha Metal Gear!",
  },
  MAROMBA_BR: {
    id: "MAROMBA_BR",
    label: "Maromba & Memes",
    emoji: "🏋️",
    tagline: "Cultura fitness brasileira, shape e sem mimimi",
    description: "Bordões clássicos da maromba nacional, frango com batata doce, disciplina bruta e foco total no shape.",
    samplePraise: "Em pleno 2026, você não deu desculpa e foi meter o shape!",
    sampleComparison: "Hoje você levantou o equivalente a 350 sacos de arroz de 5kg!",
  },
};

interface WeightItem {
  name: string;
  weightKg: number;
  prefix: string;
  category: GamificationThemeKey;
}

const THEMED_WEIGHT_ITEMS: WeightItem[] = [
  // Veículos
  { name: "Patinete Elétrico Reforçado", weightKg: 35, prefix: "um", category: "VEHICLES" },
  { name: "Kart de Corrida Profissional", weightKg: 160, prefix: "um", category: "VEHICLES" },
  { name: "Moto Esportiva 1000cc", weightKg: 210, prefix: "uma", category: "VEHICLES" },
  { name: "Jet Ski Turbo", weightKg: 380, prefix: "um", category: "VEHICLES" },
  { name: "Carro de Fórmula 1", weightKg: 798, prefix: "um", category: "VEHICLES" },
  { name: "Fusca Clássico 1968", weightKg: 840, prefix: "um", category: "VEHICLES" },
  { name: "Porsche 911 GT3 RS", weightKg: 1450, prefix: "um", category: "VEHICLES" },
  { name: "Picape Hilux 4x4", weightKg: 2200, prefix: "uma", category: "VEHICLES" },
  { name: "Trator Agrícola Pesado", weightKg: 5500, prefix: "um", category: "VEHICLES" },
  { name: "Caminhão de Bombeiros", weightKg: 8500, prefix: "um", category: "VEHICLES" },
  { name: "Caça Militar F-16", weightKg: 12000, prefix: "um", category: "VEHICLES" },
  { name: "Ônibus Articulado Urbano", weightKg: 18000, prefix: "um", category: "VEHICLES" },
  { name: "Tanque de Guerra Blindado", weightKg: 55000, prefix: "um", category: "VEHICLES" },
  { name: "Locomotiva de Carga a Diesel", weightKg: 120000, prefix: "uma", category: "VEHICLES" },
  { name: "Avião Boeing 747 Jumbo", weightKg: 180000, prefix: "um", category: "VEHICLES" },

  // Animais
  { name: "Lobo Cinzento Alfa", weightKg: 55, prefix: "um", category: "ANIMALS" },
  { name: "Leão Adulto da Savana", weightKg: 190, prefix: "um", category: "ANIMALS" },
  { name: "Gorila das Costas Prateadas", weightKg: 240, prefix: "um", category: "ANIMALS" },
  { name: "Tartaruga-Gigante de Galápagos", weightKg: 300, prefix: "uma", category: "ANIMALS" },
  { name: "Urso Polar Gigante", weightKg: 550, prefix: "um", category: "ANIMALS" },
  { name: "Alce Gigante do Alasca", weightKg: 700, prefix: "um", category: "ANIMALS" },
  { name: "Crocodilo de Água Salgada", weightKg: 1000, prefix: "um", category: "ANIMALS" },
  { name: "Hipopótamo Adulto", weightKg: 1500, prefix: "um", category: "ANIMALS" },
  { name: "Rinoceronte Branco", weightKg: 2400, prefix: "um", category: "ANIMALS" },
  { name: "Elefante Africano", weightKg: 6000, prefix: "um", category: "ANIMALS" },
  { name: "Mamute Imperial da Era do Gelo", weightKg: 9500, prefix: "um", category: "ANIMALS" },
  { name: "Tubarão-Baleia", weightKg: 15000, prefix: "um", category: "ANIMALS" },
  { name: "Baleia Jubarte", weightKg: 35000, prefix: "uma", category: "ANIMALS" },
  { name: "Megalodonte Pré-Histórico", weightKg: 50000, prefix: "um", category: "ANIMALS" },
  { name: "Baleia Azul dos Oceanos", weightKg: 150000, prefix: "uma", category: "ANIMALS" },

  // Animes
  { name: "Casco de Treino do Mestre Kame", weightKg: 40, prefix: "o", category: "ANIMES" },
  { name: "Espada Dragonslayer do Guts", weightKg: 180, prefix: "a", category: "ANIMES" },
  { name: "Pesos de Tornozelo do Rock Lee", weightKg: 250, prefix: "um par de", category: "ANIMES" },
  { name: "Armadura de Ouro de Sagitário", weightKg: 450, prefix: "uma", category: "ANIMES" },
  { name: "Rocha Gigante cortada pelo Tanjiro", weightKg: 1800, prefix: "uma", category: "ANIMES" },
  { name: "Carro amassado pelo Goku", weightKg: 3200, prefix: "um", category: "ANIMES" },
  { name: "Rocha do Treino dos Hashiras", weightKg: 6000, prefix: "uma", category: "ANIMES" },
  { name: "Robô Evangelion Unit-01", weightKg: 8500, prefix: "um", category: "ANIMES" },
  { name: "Titã Blindado de 15m", weightKg: 38000, prefix: "um", category: "ANIMES" },
  { name: "Mecha Mobile Suit Gundam", weightKg: 60000, prefix: "um", category: "ANIMES" },
  { name: "Navio Pirata Thousand Sunny", weightKg: 110000, prefix: "o", category: "ANIMES" },
  { name: "Meteoro conjurado por Madara", weightKg: 250000, prefix: "um", category: "ANIMES" },

  // Filmes & Séries
  { name: "Escudo do Capitão América + Moto Militar", weightKg: 180, prefix: "o", category: "MOVIES_SERIES" },
  { name: "Martelo Mjölnir encantado", weightKg: 300, prefix: "o", category: "MOVIES_SERIES" },
  { name: "DeLorean do De Volta para o Futuro", weightKg: 1250, prefix: "o", category: "MOVIES_SERIES" },
  { name: "Batmóvel Tumbler de Gotham", weightKg: 2500, prefix: "o", category: "MOVIES_SERIES" },
  { name: "Armadura Hulkbuster do Stark", weightKg: 4500, prefix: "a", category: "MOVIES_SERIES" },
  { name: "T-Rex de Jurassic Park", weightKg: 8000, prefix: "o", category: "MOVIES_SERIES" },
  { name: "Sino Big Ben de Londres", weightKg: 13700, prefix: "o", category: "MOVIES_SERIES" },
  { name: "Caça Estelar X-Wing de Star Wars", weightKg: 22000, prefix: "um", category: "MOVIES_SERIES" },
  { name: "Monólito de Aço do Exterminador", weightKg: 50000, prefix: "o", category: "MOVIES_SERIES" },
  { name: "Nave Millennium Falcon", weightKg: 100000, prefix: "a", category: "MOVIES_SERIES" },
  { name: "Estátua da Liberdade em Bronze", weightKg: 225000, prefix: "a", category: "MOVIES_SERIES" },

  // Games & RPG
  { name: "Escudo Hyliano do Link", weightKg: 12, prefix: "o", category: "GAMES" },
  { name: "Machado Leviatã do Kratos", weightKg: 35, prefix: "o", category: "GAMES" },
  { name: "Espada Buster do Cloud", weightKg: 40, prefix: "a", category: "GAMES" },
  { name: "Chocobo de Montaria Dourado", weightKg: 450, prefix: "um", category: "GAMES" },
  { name: "Baú do Minecraft cheio de barras de ouro", weightKg: 1200, prefix: "um", category: "GAMES" },
  { name: "Bigorna Maciça de Netherite", weightKg: 8000, prefix: "uma", category: "GAMES" },
  { name: "Dragão Alduin de Skyrim", weightKg: 15000, prefix: "o", category: "GAMES" },
  { name: "Tanque Siege de StarCraft", weightKg: 60000, prefix: "um", category: "GAMES" },
  { name: "Robô Mecha Metal Gear REX", weightKg: 500000, prefix: "o", category: "GAMES" },

  // Maromba & Memes BR
  { name: "Balde Gigante de Creatina Pura", weightKg: 10, prefix: "um", category: "MAROMBA_BR" },
  { name: "Galão Térmico de Água de Treino", weightKg: 20, prefix: "um", category: "MAROMBA_BR" },
  { name: "Fardo de Frango Congelado da Granja", weightKg: 120, prefix: "um", category: "MAROMBA_BR" },
  { name: "Estoque de Batata Doce e Ovos", weightKg: 350, prefix: "um", category: "MAROMBA_BR" },
  { name: "Máquina Leg Press 45° abarrotada de anilhas", weightKg: 850, prefix: "uma", category: "MAROMBA_BR" },
  { name: "Palete de Fábrica de Whey Concentrado", weightKg: 1200, prefix: "um", category: "MAROMBA_BR" },
  { name: "Carreta Bitrem de Suplemento e Mantimentos", weightKg: 35000, prefix: "uma", category: "MAROMBA_BR" },
];

const THEMED_PRAISES: Record<Exclude<GamificationThemeKey, "ALL">, string[]> = {
  ANIMES: [
    "Parabéns! Hoje você treinou como o Tanjiro na Seleção Final! ⚔️",
    "Caramba! O Rock Lee olhou sua disciplina e tirou os pesos das pernas pra aplaudir! 💥",
    "Vegeta mediu o poder desse treino: 'O ki dele é de mais de 8000!' 🔥",
    "Você sobreviveu à gravidade 100x na nave da Corporação Cápsula! 🚀",
    "Satoru Gojo aprovou seu treino com selo infinito: 'Você é o mais forte hoje!' 🤞",
    "All Might em pessoa confirmaria: 'Esse treino foi PLUS ULTRA!' 🌟",
    "Respiração da Hipertrofia, Décima Forma: Foco Absoluto e Sem Falhas! ⚡",
    "Nem a Dragonslayer do Guts era tão pesada quanto essa barra hoje! 🗡️",
    "Você despertou o Haki do Conquistador na última série e intimidou a gravidade! 🏴‍☠️",
    "Expansão de Domínio: Academia Vazia, Energia Infinita e Foco Total! ⛩️",
    "Treino no estilo Saitama: intensidade máxima e sem inventar desculpa! 👊",
    "Bankai! Toda a sua energia espiritual foi canalizada nesse treino! ⚡",
    "Kurama cedeu 100% do chakra pra você fechar essa planilha monstra! 🦊",
    "Você ativou o Modo Berserk e quebrou todos os seus limites anteriores! 💥",
    "Hunter de Três Estrelas: sua força física atingiu o rank máximo da associação! 🌟",
  ],
  VEHICLES: [
    "Motor V12 biturbo roncando alto e cortando giro na reta de Interlagos! 🏎️",
    "Você colocou tanta potência na barra que precisou acionar o controle de tração! 🏁",
    "Hoje você teve o torque monstruoso de um trator pesado em cada repetição! 🚜",
    "Ritmo de volta mais rápida da corrida: sem perder um milésimo de segundo! ⏱️",
    "Câmbio manual no talo, pé cravado no acelerador e tração total do início ao fim! ⚙️",
    "Hoje você moveu carga de tanque de guerra e deixou a pista em chamas! 🔥",
    "Pit stop de 2 segundos: descansou rápido e voltou pra pista com pneu macio novo! 🏎️",
    "Tração integral nas 4 rodas em subida de serra com barro: ninguém te segura! 🛞",
    "Você empurrou tanto ferro que acionou o sistema KERS e abriu a asa móvel (DRS)! ⚡",
    "Motor turbo diesel trabalhando em regime de potência contínua e carga total! 🚛",
    "Trem-bala japonês Shinkansen a 320 km/h: pontualidade, precisão e potência máxima! 🚄",
    "Monoposto de Fórmula 1 fazendo a subida da Eau Rouge de pé colado no fundo! 🏁",
    "Turbina de caça supersônico rompendo a barreira do som sem hesitar! ✈️",
  ],
  ANIMALS: [
    "Força brutal de gorila das montanhas! A selva inteira respeitou seu treino! 🦍",
    "Hoje você teve a voracidade e a imponência de um leão em dia de caça! 🦁",
    "Resistência pura de rinoceronte: nada nem ninguém parou seu ímpeto! 🦏",
    "Pegada de urso polar gigante: cada série foi pura demonstração de soberania! 🐻",
    "Vigor e precisão de leopardo selvagem: execução cirúrgica e potente! 🐆",
    "Mordida de crocodilo do Nilo: pegada de aço que não soltou a barra por nada! 🐊",
    "Salto de tigre siberiano na neve: força explosiva absurda em cada repetição! 🐅",
    "Resistência inabalável de búfalo africano liderando a manada com fúria! 🐃",
    "Asas de águia-real: visão afiada, foco cirúrgico e amplitude impecável! 🦅",
    "Carapaça blindada de tartaruga-gigante: estrutura dorsal inabalável sob carga! 🐢",
    "Instinto de lobo alfa: comandou o treino e não deixou uma repetição para trás! 🐺",
  ],
  MOVIES_SERIES: [
    "Caramba, hoje até o Sr. Miyagi ficaria impressionado! 'Tira casaco, bota casaco, puxa ferro!' 🥋",
    "Rocky Balboa está tocando 'Eye of the Tiger' só pra comemorar suas séries! 🥊",
    "O Exterminador do Futuro mandou avisar: 'Hasta la vista, preguiça!' 🤖",
    "Batman já encomendou essa sua planilha pro treino na Batcaverna em Gotham! 🦇",
    "John Wick olhou seu foco e achou o comprometimento absoluto! ✏️",
    "Capitão América em pessoa diria: 'Eu posso fazer isso o dia todo!' 🛡️",
    "Morpheus confirmou: você definitivamente escolheu a pílula vermelha do ganho muscular! 💊",
    "Dom Toretto olhou sua série e disse: 'Isso sim é sobre família e sobrecarga progressiva!' 🚗",
    "Gladiador no Coliseu de Roma: 'O que fazemos na vida ecoa na eternidade!' 🏛️",
    "Primeira regra do Clube do Treino: você nunca pula o dia de treino! 🧼",
    "Indiana Jones desviava de pedras gigantes, você levantou o templo todo! 🤠",
    "Que a Força esteja com você — e hoje os midichlorians estavam no talo! ⚔️",
    "Espartanos! Hoje nós desafiamos a gravidade e treinamos até a falha! 🛡️",
    "Neo desviou de tiros, você desviou das desculpas e quebrou a Matrix! 🕶️",
    "Gandalf gritou 'Você não vai passar!' pra preguiça e manteve a disciplina! 🧙",
  ],
  GAMES: [
    "Você entrou na sala do Boss, desviou de tudo e deu 'YOU DIED' no cansaço! ⚔️",
    "Kratos olhou seu levantamento terra e soltou um breve aceno: 'Muito bem, Garoto.' 🪓",
    "Level Up! Você adquiriu +50 de Força e desbloqueou a Conquista 'Sem Desculpas'! 🎮",
    "Geralt de Rívia tomou poção de andorinha só pra acompanhar o ritmo desse treino! 🐺",
    "Treino finalizado com ranking SSS no estilo Devil May Cry! Smokin' Sexy Style! 🔥",
    "Link abriu o baú secreto e encontrou esse treino lendário com fanfarra completa! 🗝️",
    "Inimigo do tipo Aço foi obliterado pelo seu ataque crítico de hipertrofia! ⚡",
    "Você zerou essa planilha na dificuldade Nightmare e no modo Iron Man! 🏆",
    "Doom Slayer aprovou com orgulho: 'Rip and tear... until the workout is done!' 🎸",
    "Nem a stamina do Dark Souls regenera tão rápido quanto o seu descanso de série! 🛡️",
    "Arthur Morgan olhou seu esforço e confirmou: 'You're alright, boah!' 🤠",
    "Você completou a quest principal e limpou todos os objetivos secundários do treino! 🗺️",
  ],
  MAROMBA_BR: [
    "Em pleno 2026, ano da tecnologia, você não deu desculpa e foi meter o shape! 🚀",
    "Hoje foi no amor ou na dor: o treino foi pago com gosto e o músculo agradeceu! 💥",
    "Cariani e Muzy analisaram seu treino e atestaram: 'Disciplina pura, foco de atleta!' 🧠",
    "Hoje não teve choro nem mimimi: a planilha foi executada com 100% de garra! 🥩",
    "Você não treina pra agradar ninguém, treina pra ter que passar nas portas de lado! 🚪",
    "Marmita de frango com batata doce bateu no estômago e virou pura força na barra! 🍠",
    "Treino pago, consciência limpa e endorfina no teto: o shape vem com força! 🏆",
    "Nem o Ramon Dino colocaria defeito nessa execução: contração máxima em cada série! 🦖",
    "A dor do treino é passageira, mas a honra de bater a meta de hoje é eterna! ⚡",
    "Você entrou na academia com sono e saiu com o pump monstruoso que rasga a manga! 👕",
    "Bota mais dois de cada lado que hoje o foco é total e a mente não vacila! 🏋️",
    "Respeita o processo: cada repetição de hoje é um tijolo a mais no seu shape! 🧱",
  ],
};

export interface ThematicSummaryResult {
  theme: GamificationThemeKey;
  themeInfo: GamificationThemeInfo;
  praise: string;
  weightComparisonTitle: string;
  weightComparisonDetail: string;
  weightComparisonBadge: string;
  highlightStat: string;
}

/**
 * Gera elogio temático e equivalência de peso com base no volume em kg e no tema selecionado.
 */
export function getWorkoutThematicSummary(
  totalVolumeInKg: number,
  themePreference: GamificationThemeKey = "ALL",
  seed = 0
): ThematicSummaryResult {
  const ALL_THEMES: Exclude<GamificationThemeKey, "ALL">[] = [
    "ANIMES",
    "VEHICLES",
    "ANIMALS",
    "MOVIES_SERIES",
    "GAMES",
    "MAROMBA_BR",
  ];

  const effectiveTheme: Exclude<GamificationThemeKey, "ALL"> =
    themePreference === "ALL"
      ? ALL_THEMES[Math.abs(seed) % ALL_THEMES.length]
      : (themePreference as Exclude<GamificationThemeKey, "ALL">) in THEMED_PRAISES
      ? (themePreference as Exclude<GamificationThemeKey, "ALL">)
      : "ANIMES";

  const praises = THEMED_PRAISES[effectiveTheme] ?? THEMED_PRAISES.ANIMES;
  const praiseIndex = Math.abs(seed) % praises.length;
  const praise = praises[praiseIndex];

  // Filtra itens de peso pelo tema ou todos se preferência for ALL
  const candidateItems =
    themePreference === "ALL"
      ? THEMED_WEIGHT_ITEMS
      : THEMED_WEIGHT_ITEMS.filter((item) => item.category === effectiveTheme);

  // Encontra a melhor equivalência
  const safeVolume = Math.max(totalVolumeInKg, 20);

  // Ordena por quão próximo o peso chega (ou múltiplos)
  let bestItem = candidateItems[0];
  let bestCount = 1;

  // Tenta encontrar um item que divida bem o volume
  for (const item of candidateItems) {
    const ratio = safeVolume / item.weightKg;
    if (ratio >= 0.8 && ratio <= 15) {
      bestItem = item;
      bestCount = Math.max(1, Math.round(ratio));
      break;
    }
  }

  // Se não achou na faixa 0.8 a 15, pega o item mais próximo
  if (!bestItem) {
    bestItem = candidateItems[Math.abs(seed) % candidateItems.length];
    bestCount = Math.max(1, Math.round(safeVolume / bestItem.weightKg));
  }

  let countText = "";
  if (bestCount === 1) {
    countText = `${bestItem.prefix} ${bestItem.name}`;
  } else {
    countText = `${bestCount}x ${bestItem.name}s`;
  }

  const comparisonTitle = `Hoje você levantou o equivalente a ${countText}!`;
  const comparisonDetail = `Seu volume total de ${Math.round(
    safeVolume
  ).toLocaleString("pt-BR")} kg equivale à carga de ${countText} (peso base: ~${bestItem.weightKg.toLocaleString("pt-BR")} kg cada).`;

  return {
    theme: themePreference,
    themeInfo: GAMIFICATION_THEMES[themePreference] ?? GAMIFICATION_THEMES.ALL,
    praise,
    weightComparisonTitle: comparisonTitle,
    weightComparisonDetail: comparisonDetail,
    weightComparisonBadge: `${bestItem.name}`,
    highlightStat: `${Math.round(safeVolume).toLocaleString("pt-BR")} kg`,
  };
}
