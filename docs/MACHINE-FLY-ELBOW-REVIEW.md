# Crucifixo máquina — continuidade do antebraço e cotovelo

UUID: `6ca42bbc-3724-45ec-98ed-36fb53af260a`. Consulta e revisão: 28/10/2026.
Branch: `exercise-3d/machine-fly-elbow-20261028`; base frontend `f96674d`.
Worktree: `.tmp/exercise-worktrees/machine-fly-elbow/frontend`.

O gesto continua sendo o crucifixo sentado com pegadores, encosto e cotovelos levemente flexionados, sem apoios de antebraço. O problema gráfico vinha de frames distintos para o antebraço proximal, o suporte distal do punho e a mão: a mistura dos pesos de skinning torcia a anatomia entre esses pontos.

A correção calcula a orientação a partir do eixo real do antebraço no bind pose e da direção palmar da pegada neutra. Antebraço, suporte distal e mão passam a concordar em direção e rotação axial. Os pegadores acompanham essa orientação. O suporte do cotovelo continua interpolando os segmentos adjacentes; o asset e seus pesos não mudaram.

A leve flexão de 20° agora fica no plano com o cotovelo discretamente para baixo: braço a 10° abaixo do plano horizontal e antebraço a 10° acima, deixando o cotovelo aproximadamente 5 cm abaixo do ombro no boneco. O arco horizontal foi centralizado entre as duas direções anteriores para preservar o alcance. São ajustes ilustrativos para esta malha, não ângulos ótimos ou prescrição individual. Comprimentos ósseos, apoio dos pés, tronco e cadência foram preservados.

## Cadastro e evidência

Conferidos `src/domain/machine-fly-anatomy.json` e a entrada do UUID em `exercise-catalog-review.json` da API (base `f73f4b5`). A revisão existente `2026-10-28.2`, suas instruções e a legenda continuam compatíveis: peitoral maior principal; deltoide anterior e bíceps secundários, sem ênfase regional medida. A estabilização do cotovelo pelo bíceps é inferência anatômica. Este ajuste de pose não muda identidade, participantes, aliases, filtros ou contrato; não exige alteração de cadastro ou migration. Nenhuma escrita no banco foi executada.

- [Life Fitness, manual Pro 2, pectoral fly](https://www.manualsonline.com/manuals/mfg/life_fitness/pro_2_series.html?p=17): referência técnica de leve flexão dos cotovelos durante o movimento; não comprova valores quantitativos de EMG.
- [Life Fitness, equipamento Insignia Pectoral Fly](https://www.lifefitness.com/en-us/catalog/strength-training/selectorized/insignia-series-pectoral-fly-rear-deltoid): referência do implemento com pegadores e ajuste de posição.
- [Solstad et al., 2020](https://pubmed.ncbi.nlm.nih.gov/33239937/): comparação aguda entre supino com barra e crucifixo com halteres em 17 homens treinados usando 6RM. A participação do peitoral, deltoide anterior e bíceps informa a revisão anatômica existente; extrapolar magnitude de EMG para esta máquina ou recomendar ângulos a partir dela seria inadequado.
- [Estudo de fadiga no supino, 2025](https://www.frontiersin.org/journals/physiology/articles/10.3389/fphys.2025.1661217/full): consultado pela descrição do teste isométrico do peitoral em máquina butterfly; não é validação da cinemática dinâmica nem justificativa para trocar os participantes do crucifixo.

## Validação

Testes de cinemática verificam flexão estável, pequeno rebaixamento dos cotovelos, comprimentos dos segmentos, pegada e apoios. A regressão no rig real verifica concordância longitudinal e axial entre antebraço e suporte distal para impedir colapso pela mistura de pesos. Passaram 69 testes direcionados, TypeScript e ESLint (apenas um import sem uso preexistente no teste do asset).

Revisão visual em Chrome descartável: desktop 1440px e celular 390px; frente, lateral, costas e perspectiva; movimento fechado, intermediário e aberto. Sem erros de console, overflow ou troca de máscara. Conferidas continuidade do cotovelo/antebraço, orientação dos punhos, pegadores, silhueta e shading. Capturas locais em `.tmp/machine-fly-elbow-qa` na raiz principal do frontend. Cores e legendas permanecem ilustrativas, sem leitura de EMG.

Integração prevista na main local após build; sem push/deploy automático.
