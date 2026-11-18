# Revisão da lateral e da cabeça no militar — 18/11/2026

Branch `exercise-3d/lateral-head-v836`, base frontend `5cbb551`, API `b221200`.
Worktree frontend `.tmp/exercise-worktrees/five-upper-m218/frontend`.
Esta revisão substitui os detalhes da lateral e do controle cervical descritos
na [correção anterior](EXERCISE-3D-UPPER-FORM-CORRECTIONS.md).

## Elevação lateral — UUID 00000000-0000-4000-8000-000000000125

A imagem enviada pelo usuário mostra, de cima, braços formando um V para a
frente e flexão suave dos cotovelos no plano horizontal. A implementação
anterior retirava elevação do antebraço no plano da subida, fazendo os punhos
caírem abaixo dos cotovelos. Essa não era a curvatura da referência.

O úmero agora sobe em um plano 25 graus anterior ao plano frontal. A flexão
ilustrativa de 15 graus acrescenta direção anterior ao antebraço, perpendicular
ao úmero, preservando os comprimentos dos segmentos. No topo, os punhos ficam
adiante dos cotovelos, praticamente na mesma altura. A pegada acompanha esse
plano sem desvio do punho. Mantém-se o acompanhamento angular das escápulas,
sem acrescentar encolhimento linear dos ombros.

Esses ângulos são escolhas editoriais do avatar para representar a imagem,
não uma prescrição universal. A pesquisa técnica anterior foi reconferida:
[ACE, Lateral Raise](https://www.acefitness.org/resources/everyone/exercise-library/26/lateral-raise/),
[Coratella et al., 2020](https://doi.org/10.3390/ijerph17176015) e
[Ebaugh et al., 2005](https://doi.org/10.1016/j.clinbiomech.2005.03.008).
Não se infere EMG ou intensidade a partir da cor do modelo. Deltoide lateral
primário e sinergistas/estabilizadores secundários permanecem no mapa explícito.

## Desenvolvimento militar — UUID 00000000-0000-4000-8000-000000000123

O controle anterior distribuía pesos diferentes dentro do próprio rosto:
mandíbula e bochechas moviam menos que o topo da cabeça. Isso deformava suas
proporções mesmo quando o teste de passagem da barra era aprovado.

Agora todos os vértices da cabeça ajustada recebem uma única transformação
rígida; a transição de pesos acontece somente no pescoço abaixo do corte da
cabeça. O pivô cervical acompanha o tronco nos demais movimentos. No militar,
a liberação da barra usa extensão suave de até 6 graus e recuo de até 8 mm,
retornando à posição neutra nas extremidades. São parâmetros geométricos do
avatar, não recomendações clínicas individuais. A linha contínua da barra
foi compatibilizada com essa menor movimentação, mantendo a chegada acima da
cabeça e a distância positiva do rosto ao longo da repetição.

Referência técnica primária reconferida antes da edição:
[NSCA, Progressive Strategies for Teaching Fundamental Resistance Training Movement Patterns](https://www.nsca.com/contentassets/3d09f06f0b4c4f6fbd8cc382ed1f3d4a/ptq-10.2.1-progressive-strategies-for-teaching-fundamental-resistance-training-movement-patterns.pdf).
A fonte orienta a passagem da barra; os valores geométricos não são derivados
como limites universais do texto.

## Cadastro e verificação

Consulta somente de leitura confirmou que os seis cadastros da entrega anterior
continuam equivalentes aos JSONs e classificações vigentes. Nenhuma mudança de
nome, músculos, regiões, instruções, identidade, contrato ou migration é necessária.
GLB, topologia, UVs e cores anatômicas são preservados. Desenvolvimento com
halteres e correções das roscas permanecem protegidos pelas regressões existentes.

Dois testes novos reproduziram os problemas antes da correção: direção da flexão
na lateral e distâncias internas da cabeça. Agora conferem o V em vista superior,
comprimentos e alturas, distâncias entre mandíbula/nariz/orelhas/topo em 101
posições e transformação rígida de todos os vértices da cabeça em 11 posições.
A passagem da barra usa a geometria deformada real. As duas suítes específicas
passaram com 31 testes. A revisão visual usa vistas frontal, lateral e superior,
desktop 1440px e celular 390px; artefatos locais em `.tmp/*-v836-qa/`.

Resultado final: 967 testes aprovados em 112 arquivos; ESLint dos quatro
arquivos TypeScript alterados e build de produção com TypeScript aprovados.
Revisão visual de lateral, militar, desenvolvimento com halteres e supino
concluída nos dois tamanhos, sem erros do navegador, assets remotos ou
transbordamento horizontal. As mains local/remota foram reconferidas nas
bases acima antes da integração; nenhuma alteração necessária na API ou no banco.
