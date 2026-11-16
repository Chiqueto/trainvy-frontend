import type { ExerciseAnimation, ExerciseDefinition } from "./exercises";
import { BENT_ROW_INSTRUCTIONS } from "./bent-row-instructions";
import {
  HIGH_BENT_ROW_INSTRUCTIONS,
  SUPINATED_BENT_ROW_INSTRUCTIONS,
} from "./row-variant-instructions";
export const BARBELL_ROW_DEFINITIONS = {
  "bent-row": {
    id: "00000000-0000-4000-8000-000000000121",
    name: "Remada Curvada (Baixa) — Pronada",
    equipment: "Barra livre, pegada pronada; tronco inclinado e barra suspensa",
    instructions: BENT_ROW_INSTRUCTIONS,
    muscles: {
      primary: ["Latíssimo do dorso e redondo maior"],
      secondary: [
        "Trapézio e romboides (controle escapular)",
        "Deltoide posterior",
        "Bíceps, braquial, braquiorradial e pegada",
        "Manguito rotador e serrátil anterior",
        "Eretores, abdômen e músculos de sustentação das pernas",
      ],
    },
  },
  "supinated-bent-row": {
    id: "1444333f-9fb0-4d74-843a-42b9480e5cfc",
    name: "Remada Curvada (Baixa) — Supinada",
    equipment:
      "Barra livre, pegada supinada; tronco inclinado e barra suspensa",
    instructions: SUPINATED_BENT_ROW_INSTRUCTIONS,
    muscles: {
      primary: ["Latíssimo do dorso e redondo maior"],
      secondary: [
        "Trapézio e romboides (controle escapular)",
        "Deltoide posterior",
        "Bíceps, braquial, braquiorradial e pegada",
        "Manguito rotador e serrátil anterior",
        "Eretores, abdômen e músculos de sustentação das pernas",
      ],
    },
  },
  "high-bent-row": {
    id: "7f249b6a-85ad-45ca-9147-6cfa712547c7",
    name: "Remada Curvada (Alta) — Pronada",
    equipment: "Barra livre, pegada pronada; tronco inclinado e barra suspensa",
    instructions: HIGH_BENT_ROW_INSTRUCTIONS,
    muscles: {
      primary: ["Trapézio médio, romboides e deltoide posterior"],
      secondary: [
        "Dorsal e redondo maior",
        "Bíceps, braquial, braquiorradial e pegada",
        "Manguito rotador e serrátil anterior",
        "Eretores, abdômen e músculos de sustentação das pernas",
      ],
    },
  },
  "high-supinated-bent-row": {
    id: "92a8b19e-86b5-47ea-91d1-529fab4ab05c",
    name: "Remada Curvada (Alta) — Supinada",
    equipment:
      "Barra livre, pegada supinada; tronco inclinado e barra suspensa",
    instructions: {
      description:
        "Remada Curvada (Alta) — Supinada, com barra livre. Cotovelos mais abertos e ênfase ilustrativa na parte alta das costas.",
      setup:
        "Pés na largura do quadril, joelhos levemente flexionados e abdômen firme. Recue o quadril, mantenha coluna e pescoço alinhados e o tronco inclinado, aproximadamente 27° acima da horizontal. Use pegada supinada, mais aberta que os ombros. Palmas voltadas para a frente, com punhos alinhados aos antebraços. A barra fica suspensa, abaixo dos ombros.",
      execution:
        "Conduza os cotovelos para trás e para fora, em abertura confortável, aproximando a barra das costelas baixas/base do peito. Preserve a inclinação do tronco. Estenda os braços com controle, mantendo a barra suspensa entre repetições. Na volta, deixe as escápulas se afastarem sobre o tórax; na puxada, aproxime-as junto com o movimento dos braços, sem arredondar a coluna.",
      tips: "Puxada alta significa base do peito, nunca rosto ou pescoço. Use apenas uma abertura confortável para ombros e punhos. A pegada sozinha não determina a ênfase. Cores representam participação muscular ilustrativa, sem EMG medido ou isolamento.",
    },
    muscles: {
      primary: ["Trapézio médio, romboides e deltoide posterior"],
      secondary: [
        "Dorsal e redondo maior",
        "Bíceps, braquial, braquiorradial e pegada",
        "Manguito rotador e serrátil anterior",
        "Eretores, abdômen e músculos de sustentação das pernas",
      ],
    },
  },
  "yates-row": {
    id: "bb4607b8-c89b-4d22-bf59-1edf55c2ee77",
    name: "Remada Yates — Pronada",
    equipment: "Barra livre, pegada pronada; tronco mais ereto",
    instructions: {
      description:
        "Remada Yates — Pronada, com barra livre. Cotovelos próximos ao corpo e ênfase ilustrativa no dorsal.",
      setup:
        "Pés na largura do quadril, joelhos levemente flexionados e abdômen firme. Recue o quadril, mantenha coluna e pescoço alinhados e o tronco mais ereto, aproximadamente 50° acima da horizontal. Use pegada pronada, na largura dos ombros ou um pouco além. Palmas voltadas para trás ao segurar a barra. A barra fica suspensa, abaixo dos ombros.",
      execution:
        "Conduza os cotovelos para trás e próximos das costelas, em direção aos bolsos de trás, aproximando a barra do umbigo/baixo abdômen. Preserve a inclinação do tronco. Estenda os braços com controle, mantendo a barra suspensa entre repetições. Na volta, deixe as escápulas se afastarem sobre o tórax; na puxada, aproxime-as junto com o movimento dos braços, sem arredondar a coluna.",
      tips: "Evite elevar a barra ao peito ou levantar o tronco para completar a repetição. A pegada sozinha não determina a ênfase. Cores representam participação muscular ilustrativa, sem EMG medido ou isolamento.",
    },
    muscles: {
      primary: ["Latíssimo do dorso e redondo maior"],
      secondary: [
        "Trapézio e romboides (controle escapular)",
        "Deltoide posterior",
        "Bíceps, braquial, braquiorradial e pegada",
        "Manguito rotador e serrátil anterior",
        "Eretores, abdômen e músculos de sustentação das pernas",
      ],
    },
  },
  "supinated-yates-row": {
    id: "824b6099-a3d9-41f9-bf52-d29587393c85",
    name: "Remada Yates — Supinada",
    equipment: "Barra livre, pegada supinada; tronco mais ereto",
    instructions: {
      description:
        "Remada Yates — Supinada, com barra livre. Cotovelos próximos ao corpo e ênfase ilustrativa no dorsal.",
      setup:
        "Pés na largura do quadril, joelhos levemente flexionados e abdômen firme. Recue o quadril, mantenha coluna e pescoço alinhados e o tronco mais ereto, aproximadamente 50° acima da horizontal. Use pegada supinada, na largura dos ombros ou um pouco além. Palmas voltadas para a frente, com punhos alinhados aos antebraços. A barra fica suspensa, abaixo dos ombros.",
      execution:
        "Conduza os cotovelos para trás e próximos das costelas, em direção aos bolsos de trás, aproximando a barra do umbigo/baixo abdômen. Preserve a inclinação do tronco. Estenda os braços com controle, mantendo a barra suspensa entre repetições. Na volta, deixe as escápulas se afastarem sobre o tórax; na puxada, aproxime-as junto com o movimento dos braços, sem arredondar a coluna.",
      tips: "Evite elevar a barra ao peito ou levantar o tronco para completar a repetição. A pegada sozinha não determina a ênfase. Cores representam participação muscular ilustrativa, sem EMG medido ou isolamento.",
    },
    muscles: {
      primary: ["Latíssimo do dorso e redondo maior"],
      secondary: [
        "Trapézio e romboides (controle escapular)",
        "Deltoide posterior",
        "Bíceps, braquial, braquiorradial e pegada",
        "Manguito rotador e serrátil anterior",
        "Eretores, abdômen e músculos de sustentação das pernas",
      ],
    },
  },
  "pendlay-row": {
    id: "1eef7876-e093-42af-8374-00d3b105c47a",
    name: "Remada Pendlay (Pronada)",
    equipment: "Barra livre, pegada pronada; anilhas no chão a cada repetição",
    instructions: {
      description:
        "Remada Pendlay (Pronada), com barra livre. Cada repetição começa com as anilhas paradas no chão.",
      setup:
        "Pés na largura do quadril, joelhos levemente flexionados e abdômen firme. Recue o quadril, mantenha coluna e pescoço alinhados e o tronco quase paralelo ao chão, aproximadamente 5° acima da horizontal. Use pegada pronada, na largura dos ombros ou um pouco além. Palmas voltadas para trás ao segurar a barra. Barra sobre o meio dos pés e anilhas apoiadas no chão; use blocos firmes se a altura das anilhas exigir.",
      execution:
        "Com as anilhas paradas, refaça a pressão do abdômen e puxe a barra de forma rápida e controlada às costelas baixas/abdômen superior. Mantenha o tronco próximo da horizontal. Guie a descida até as anilhas assentarem por completo e pause antes da próxima repetição. Na volta, deixe as escápulas se afastarem sobre o tórax; na puxada, aproxime-as junto com o movimento dos braços, sem arredondar a coluna.",
      tips: "Não rebata a carga no chão nem transforme a puxada em um levantamento terra. A pegada sozinha não determina a ênfase. Cores representam participação muscular ilustrativa, sem EMG medido ou isolamento.",
    },
    muscles: {
      primary: ["Dorsal, redondo maior, trapézio médio e romboides"],
      secondary: [
        "Deltoide posterior",
        "Bíceps, braquial, braquiorradial e pegada",
        "Manguito rotador e serrátil anterior",
        "Eretores, abdômen e músculos de sustentação das pernas",
      ],
    },
  },
  "generic-bent-row": {
    id: "00000000-0000-4000-8000-000000000122",
    name: "Remada Curvada",
    equipment: "Barra livre, pegada pronada; tronco inclinado e barra suspensa",
    instructions: {
      description:
        "Remada Curvada, com barra livre. Cotovelos próximos ao corpo e ênfase ilustrativa no dorsal.",
      setup:
        "Pés na largura do quadril, joelhos levemente flexionados e abdômen firme. Recue o quadril, mantenha coluna e pescoço alinhados e o tronco inclinado, aproximadamente 27° acima da horizontal. Use pegada pronada, na largura dos ombros ou um pouco além. Palmas voltadas para trás ao segurar a barra. A barra fica suspensa, abaixo dos ombros.",
      execution:
        "Conduza os cotovelos para trás e próximos das costelas, em direção aos bolsos de trás, aproximando a barra do umbigo/baixo abdômen. Preserve a inclinação do tronco. Estenda os braços com controle, mantendo a barra suspensa entre repetições. Na volta, deixe as escápulas se afastarem sobre o tórax; na puxada, aproxime-as junto com o movimento dos braços, sem arredondar a coluna.",
      tips: "Evite elevar a barra ao peito ou levantar o tronco para completar a repetição. A pegada sozinha não determina a ênfase. Cores representam participação muscular ilustrativa, sem EMG medido ou isolamento.",
    },
    muscles: {
      primary: ["Latíssimo do dorso e redondo maior"],
      secondary: [
        "Trapézio e romboides (controle escapular)",
        "Deltoide posterior",
        "Bíceps, braquial, braquiorradial e pegada",
        "Manguito rotador e serrátil anterior",
        "Eretores, abdômen e músculos de sustentação das pernas",
      ],
    },
  },
} satisfies Record<string, ExerciseDefinition>;
export const BARBELL_ROW_ALIASES: Readonly<Record<string, ExerciseAnimation>> =
  {
    "remada curvada (baixa) — pronada": "bent-row",
    "remada curvada com barra": "bent-row",
    "remada curvada": "bent-row",
    "remada curvada pronada": "bent-row",
    "remada curvada baixa": "bent-row",
    "remada ao umbigo": "bent-row",
    "remada curvada (baixa) — supinada": "supinated-bent-row",
    "remada curvada com barra e pegada supinada": "supinated-bent-row",
    "remada curvada (alta) — pronada": "high-bent-row",
    "remada curvada com barra ao peito": "high-bent-row",
    "remada curvada alta pronada": "high-bent-row",
    "remada ao peito pronada": "high-bent-row",
    "remada curvada (alta) — supinada": "high-supinated-bent-row",
    "remada curvada alta supinada": "high-supinated-bent-row",
    "remada ao peito supinada": "high-supinated-bent-row",
    "remada yates — pronada": "yates-row",
    "yates row pronada": "yates-row",
    "remada yates — supinada": "supinated-yates-row",
    "yates row supinada": "supinated-yates-row",
    "remada yates": "supinated-yates-row",
    "yates row": "supinated-yates-row",
    "remada pendlay (pronada)": "pendlay-row",
    "remada pendlay": "pendlay-row",
    "pendlay row": "pendlay-row",
    "remada do chao": "pendlay-row",
  };
