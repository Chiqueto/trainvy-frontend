# Visualização anatômica — versão atual, 27/10/2026

O visualizador usa `public/models/exercise-3d/trainvy-athlete.glb`: superfícies musculares e
suporte ósseo adaptados de Z-Anatomy/BodyParts3D, cabeça com base MakeHuman CC0,
mãos fechadas e calçados próprios. Não se trata de uma escultura integralmente original,
nem de um modelo clínico validado. A versão anterior está registrada no histórico abaixo.

Foram selecionadas estruturas superficiais, exposto o reto abdominal, corrigidos reflexos
de normais, ajustado o orçamento de polígonos e transferidas as superfícies para uma pose neutra.
O rig tem 21 ossos, incluindo suportes de cotovelo, ombro, quadril e torção distal do antebraço. O manifesto
`public/models/exercise-3d/model-manifest.json` registra estruturas, contagens e SHA-256.
O GLB usa EXT_meshopt_compression com decoder local habilitado pelo Drei: não carrega
modelos, texturas ou HDRIs de terceiros em runtime. A compressão preserva os buffers geométricos.

Máscaras independentes: agachamento destaca quadríceps/glúteo máximo e adutores; supino
destaca peitoral maior, tríceps e deltoide anterior. As cores são constantes durante a repetição
e não representam EMG, intensidade ou ativação medida. Todo o restante permanece neutro.
É possível desligar o destaque, observar pelas costas, pausar, reiniciar, mudar a velocidade,
percorrer a repetição e ampliar a visualização. A interface de progresso atualiza no máximo
100 vezes por ciclo, mantendo renderização sob demanda quando pausada.

Na versão 7, a roupa foi removida e as superfícies proximais das coxas e dos glúteos foram
restauradas integralmente. Esconder apenas a roupa deixaria os recortes feitos na versão 4
expostos. A pelve contém os ossos do quadril, sacro e músculos inferiores do abdômen do mesmo
atlas Z-Anatomy. A nuca usa esplênios, espinal da cabeça e outros músculos cervicais do atlas.
Os preenchimentos lisos experimentais foram removidos. As estruturas adicionadas permanecem
neutras, com fibras e relevo compatíveis com as demais superfícies musculares.
As inserções mediais dos glúteos preservam o contato com a pelve; a transição para o fêmur
usa suportes de quadril. A classificação anatômica impede que vértices da bacia recebam pesos
dos braços por proximidade. O SHA-256 do manifesto identifica a URL do GLB para invalidar o cache.
A orientação do braço usa a frente anatômica como referência de flexão, evitando o roll
introduzido pela pequena inclinação lateral dos cotovelos na pose de repouso. A torção distal
do antebraço é distribuída por suportes próprios; as mãos fechadas ficam rígidas na barra.

A cabeça MakeHuman foi calibrada ao eixo cervical do atlas: a origem anterior diferente
foi compensada, preservando o rosto e reposicionando os olhos junto com a cabeça. O contorno
inferior do pescoço da cabeça é ajustado à seção cervical. Uma transição curta usa a borda
exata do recorte e o contorno dos músculos nativos, com índices compartilhados, normais
contínuas e fibras que diminuem em direção à face. O restante da malha da versão 6 aprovada,
incluindo quadril e glúteos, permanece idêntico.

O link para um Markdown técnico foi substituído pela seção recolhida "Sobre esta visualização",
com origem e licença legíveis. Créditos completos em `public/models/exercise-3d/ATTRIBUTION.md`;
termos em `LICENSE-CC-BY-SA-4.0.txt` e `UPSTREAM-NOTICES.txt`. O GLB adaptado é CC BY-SA 4.0;
isso não altera a licença do código da aplicação.

## Reproduzir o asset

Inputs licenciados preservados no projeto irmão `trainvy-3d-poc`:
`assets/poc06/z_anatomy/{MuscularSystem100,SkeletalSystem100}.fbx` e
`scenes/trainvy_bench_press_poc04.blend`. A aplicação não depende desse projeto em execução.

```powershell
node scripts/generate-anatomy-scaffold.mjs
& 'C:/Program Files/Blender Foundation/Blender 5.2/blender.exe' --background --factory-startup --python-exit-code 1 --python scripts/build-anatomical-atlas.py
node scripts/finalize-anatomical-atlas.mjs
node scripts/anatomy-qa.mjs
& 'C:/Program Files/Blender Foundation/Blender 5.2/blender.exe' --background --factory-startup --python-exit-code 1 --python scripts/render-anatomy-qa.py -- squat-0 squat-0.5 squat-1 bench-press-0 bench-press-0.5 bench-press-1
```

Intermediários e renders ficam em `.tmp/anatomy-qa`, ignorados pelo Git. Distribuir o GLB
final e seu manifesto. O scaffold procedural contribui apenas mãos, calçados e esqueleto;
seu tronco e sua cabeça experimentais não aparecem no asset final. As poses são ilustrativas;
novos exercícios exigem revisão anatômica e de articulação específica.

Quando os inputs do Blender não estiverem disponíveis, a recuperação da versão 7 usa os GLBs
distribuídos nos commits `635a626` (v4) e `a57bd99` (v3, com músculos completos). O script
confere os SHA-256 antes de gravar e compartilha os pesos e conexões anatômicas com o pipeline de geração.
As conexões estão preservadas em `scripts/assets/anatomical-connections.glb`; a recuperação
funciona offline, sem Blender nem download dos FBXs:

```powershell
node scripts/repair-anatomical-atlas.mjs --from-git
```

Também aceita caminhos locais para os dois GLBs: `node scripts/repair-anatomical-atlas.mjs <v4.glb> <v3.glb>`.
Não redirecionar os binários com `git show ... > arquivo.glb` no Windows PowerShell.

Para recriar o recorte das conexões a partir dos FBXs licenciados originais:

```powershell
node scripts/prepare-anatomical-connections.mjs <SkeletalSystem100.fbx> <MuscularSystem100.fbx>
```

Os hashes das fontes ficam nos metadados desse recorte. Sua licença e origem estão em
`scripts/assets/ATTRIBUTION.md`. O runtime carrega somente o GLB final comprimido.

Validação da versão 7: 33 testes de cinemática, asset, visualizador e guia de execução;
revisão no Chrome em desktop/celular, incluindo closes da cabeça, perfil elevado, costas e poses
intermediárias dos dois exercícios. Os testes cobrem as máscaras independentes, a
ancoragem dos glúteos, a ausência de influência dos braços na pelve, as mãos rígidas na barra,
o alinhamento da cabeça e a junção sem borda aberta no pescoço. Os atributos abaixo da
região cervical foram comparados à versão 6 aprovada e permanecem idênticos.

## Registro histórico — protótipo anterior

# Teste de exercícios 3D

Abrir `/lab/exercises-3d` com `npm run dev`. A página não consulta dados de treino nem exige uma sessão para visualizar o teste. O guia “Ver execução” oferece “Testar animação 3D” apenas para os IDs canônicos 101/102 (supino reto com barra) e 105 (agachamento livre). Nomes semelhantes e outros exercícios não recebem animações por aproximação.

## Reutilização

Origem: `C:/projetos/firma/digital-twin/first-app`.

- Malha `public/models/anatomical-lifter.glb`, preservando cabeça, roupa, fibras e anatomia.
- Material baseado em `components/AnatomicalAvatar/anatomyMaterial.ts`, com máscara muscular independente para cada movimento.
- Clonagem independente de esqueleto/material do componente `AnatomicalAvatar`.
- Convenções de posição e comprimentos de `lifterKinematics.ts`.

O modelo original tinha sete ossos e braços fixos no tronco. `scripts/prepare-exercise-avatar.mjs` adiciona seis ossos para braços, antebraços e mãos e redistribui seus pesos. O script lê o arquivo de origem sem alterá-lo e grava o derivado em `public/models/exercise-3d/`.

```powershell
node scripts/prepare-exercise-avatar.mjs 'C:\projetos\firma\digital-twin\first-app\public\models\anatomical-lifter.glb'
```

O GLB pronto acompanha o frontend; o projeto original não é necessário para executar ou fazer build. Créditos da cabeça Quaternius CC0 em `public/models/exercise-3d/ATTRIBUTION.md`.

## Comportamento

React Three Fiber, Three.js e Drei. Cena carregada apenas no cliente, sem HDRIs, fontes 3D ou modelos externos. No guia de treino, engine e GLB só são requisitados ao abrir explicitamente a animação; fechar desmonta o Canvas. A cópia local do modelo tem aproximadamente 14 MiB, ainda sem LOD/compressão.

Pausa, reinício, velocidade, posição manual, câmera livre e vistas frontal/lateral. Pausado usa renderização sob demanda. Respeita movimento reduzido, pausa ao ocultar a aba e limita DPR a 1,5. Erros de modelo/WebGL são contidos; as ilustrações e instruções existentes continuam disponíveis no guia. Nenhuma alteração em API, banco, permissões ou registro de séries.

## Regra de músculos em destaque

- Destacar somente os grupos musculares principais e secundários explicitamente definidos por exercício. Todo o restante da anatomia deve permanecer neutro.
- Não reutilizar mapas de ativação de outros exercícios nem adivinhar grupos musculares por semelhança no nome.
- Exibir em cada exercício os grupos que a animação destaca.
- As cores são uma ilustração qualitativa; não representam ativação medida, EMG nem a intensidade real de esforço.

Máscara atual: o agachamento destaca quadríceps; o supino reto destaca peitoral, tríceps e deltoide anterior. O agachamento preserva o mapa anatômico existente do arquivo fonte; a máscara do supino usa apenas vértices da região peitoral/anterior do ombro e dos tríceps. Atributo customizado no GLB: `_exerciseMuscles`.

A repetição desce ao longo de aproximadamente 44% do ciclo, mantém uma pausa curta no ponto baixo e sobe suavemente durante 48%; há também um pequeno intervalo na extensão. Essa distribuição evita a impressão de oscilação sinusoidal e torna cada repetição mais fácil de acompanhar visualmente.

## Limites do experimento

Animação procedural ilustrativa, não captura de movimento nem validação biomecânica profissional. A malha foi originalmente esculpida para hack squat; ombros, quadril e punhos ainda podem apresentar deformações em poses extremas. As máscaras anatômicas identificam regiões ilustrativas sem estimar EMG. A amplitude e a carga visual não são uma prescrição personalizada. Antes de expandir o catálogo, revisar movimentos e preparar uma malha com rig geral/LOD.

Referências de implementação: [Canvas e fallback](https://r3f.docs.pmnd.rs/api/canvas), [renderização sob demanda](https://r3f.docs.pmnd.rs/advanced/scaling-performance).

## Validação em 25/10/2026

- `npm run build`: passou, incluindo a rota estática `/lab/exercises-3d`.
- `npx tsc --noEmit --incremental false`: passou.
- ESLint nos componentes 3D, página, script e teste novos: passou.
- `npx vitest run tests/exercise-3d.test.ts tests/exercise-media.test.tsx`: 14 testes passaram. Cobrem escopo por ID, comprimentos constantes dos membros, pés fixos, mãos na barra e regressões do guia de execução.
- Chrome headless com renderização WebGL real: os dois exercícios nas posições inicial/final, câmera lateral, reprodução/pausa/reinício, velocidade, scrub e movimento reduzido; sem erros de console no fluxo normal. Layout de 390 px sem overflow horizontal.
- Falhas simuladas de download do GLB e WebGL indisponível: mensagem de fallback exibida sem derrubar a página.
- A revisão visual confirmou destaque de quadríceps no agachamento e peito/tríceps/deltoide anterior no supino, com os outros músculos neutros; vista frontal do supino alinhada à posição deitada e breve pausa no ponto baixo.
