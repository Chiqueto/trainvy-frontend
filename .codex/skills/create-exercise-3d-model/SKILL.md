---
name: create-exercise-3d-model
description: >-
  Workflow e diretrizes obrigatórias para criação e modelagem de exercícios 3D no Trainvy.
  Exige pesquisa aprofundada em estudos biomecânicos e cinesiológicos antes da modelagem
  para garantir angulações anatômicas exatas (ex: banco a 30° no supino inclinado) e
  mapeamento realista de músculos primários (vermelho vivo) e secundários/sinergistas (vermelho mais claro).
---

# Criação e Modelagem de Exercícios 3D — Trainvy

Este guia é a referência técnica e metodológica obrigatória para a adição de novas simulações 3D interativas de exercícios na plataforma Trainvy.

---

## ⚠️ REGRA INVIOLÁVEL: Pesquisa Científica Prévia

**Antes de escrever qualquer linha de código cinemático, modificar shaders ou ajustar malhas 3D**, é **estritamente obrigatório** realizar uma busca detalhada em estudos científicos recentes de **Biomecânica, Cinesiologia e Eletromiografia (EMG)** (fontes: PubMed, *Journal of Strength and Conditioning Research*, NSCA, ACSM, etc.).

A pesquisa deve responder obrigatoriamente a duas perguntas centrais:

1. **Qual é a angulação articular e de equipamento ideal comprovada pela literatura?**
   - *Exemplo real*: No supino inclinado, a literatura biomecânica (estudos de Barnett et al., Trebs et al., Lauver et al.) demonstra que a inclinação do encosto de **30°** maximiza o recrutamento do feixe clavicular (peitoral superior) e minimiza a ativação indesejada do deltoide anterior e estresse na cápsula anterior do ombro, enquanto inclinações de **45°** transferem trabalho excessivo aos ombros.
   - *Nunca* adotar angulações por "senso comum" sem confirmação prévia na literatura.

2. **Quais são os músculos motores primários e quais são os sinergistas/secundários inseparáveis?**
   - O corpo humano opera em cadeias cinéticas e contrações sinérgicas. **É biomecanicamente incorreto tentar "isolar" completamente um músculo em exercícios compostos**.
   - No supino inclinado com halteres, o peitoral superior (porção clavicular) é o **motor primário**, mas o peitoral médio/inferior (feixe esternocostal), o tríceps braquial e o deltoide anterior atuam ativamente como **sinergistas/secundários**.
   - Portanto, os secundários **devem ser destacados visualmente em vermelho mais claro**, enquanto o foco principal fica em **vermelho vivo**. Todo o resto do corpo permanece em tom neutro.

---

## 🎨 Padrão de Cores e Shading Anatômico

No shader anatômico de tecido (`anatomy-material.ts`):

| Categoria | Papel Biomecânico | Constante | Cor Hex | Significado Visual |
| :--- | :--- | :--- | :--- | :--- |
| **Primário** | Motor primário / Alvo principal | `primaryTissue` | `#bd5148` | Vermelho vivo/anatômico intenso |
| **Secundário** | Sinergistas / Co-ativação / Estabilizadores | `secondaryTissue` | `#d97d75` | Vermelho mais claro / suave |
| **Neutro** | Músculos e ossos não recrutados no exercício | `neutralTissue` | `#b5b3ac` | Cinza/bege neutro de baixo contraste |

> [!IMPORTANT]
> **Aviso obrigatório**: As legendas e textos de apoio devem deixar claro que a coloração é meramente ilustrativa de foco anatômico, e **nunca** uma medição quantitativa de esforço, contração milivolt ou EMG em tempo real.

---

## 📐 Pipeline de Implementação Técnica

### 1. Definição do Exercício (`exercises.ts`)
Adicionar em `EXERCISE_ANIMATIONS` com:
- `id`: UUID canônico global.
- `name`: Nome formal em português.
- `equipment`: Equipamento e angulação exata comprovada (ex.: `"Banco inclinado a 30° e dois halteres"`).
- `muscles`: Objeto com `primary: [...]` e `secondary: [...]`.

### 2. Cinemática Inversa e Trajetória (`kinematics.ts`)
- Definir constantes angulares (ex.: `INCLINE_BENCH_ANGLE = Math.PI / 6`).
- Implementar Two-Bone IK via `solveJoint(start, end, lenA, lenB, poleVector)` para manter comprimentos ósseos reais (`ARM_LENGTH`, `FOREARM_LENGTH`) constantes.
- Definir trajetória dos membros e pesos com convergência natural e sem colisão de geometria.
- Implementar cadência fisiológica:
  - Descida excêntrica controlada (~44% do ciclo)
  - Pausa isométrica no ponto de máxima extensão (~6% do ciclo)
  - Subida concêntrica suave (~46% do ciclo)
  - Pausa no topo (~4% do ciclo)

### 3. Cenário e Acessórios (`exercise-scene.tsx`)
- Modelar o equipamento (banco, anilhas, halteres) com proporções anatômicas e materiais metálicos/borrachas realistas.
- Alinhar encosto e apoios do atleta com a rotação angular exata.

### 4. Shaders e Máscara Muscular (`anatomy-material.ts`)
- Configurar canal de atributos da malha (`_exercisemuscles`).
- Mapear ativação primária (1.0 -> `primaryTissue`) e ativação secundária (0.45 a 0.50 -> `secondaryTissue`).
- Garantir que todos os sinergistas inseparáveis recebam a cor secundária suave.

### 5. Guia de Execução e Diálogo (`exercise-execution-dialog.tsx`)
- Redigir `description`, `setup`, `execution` e `tips` em português claro.
- Detalhar a angulação recomendada e a postura segura para o praticante.

---

## 🧪 Checklist de Verificação & Testes

Antes de considerar qualquer modelo 3D concluído:
- [ ] Pesquisa em estudos biomecânicos realizada e referenciada nas anotações do commit/PR.
- [ ] Angulação do banco e articulações validada contra a literatura (ex.: 30° para inclinado).
- [ ] Músculos sinergistas identificados e pintados em vermelho mais claro (sem isolamento irreal).
- [ ] Testes do Vitest passando (`npx vitest run tests/exercise-3d.test.ts tests/exercise-3d-asset.test.ts`).
- [ ] Ausência de inversões de articulações (joelhos ou cotovelos dobrando para trás).
- [ ] Ausência de clipping de implementos (halteres ou barras atravessando o corpo).
- [ ] Legendagem neutra preservada com disclaimer explicativo.
