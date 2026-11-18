# Militar: cotovelos à frente — 18/11/2026

UUID `00000000-0000-4000-8000-000000000123`, militar estrito em pé com barra
à frente e pegada pronada. Branch `exercise-3d/military-elbows-k649`, base
frontend `0a063f4`, API `b221200`; worktree frontend
`.tmp/exercise-worktrees/five-upper-m218/frontend`.

## Pesquisa e decisão

Consultados antes de editar a cinemática:

- [CrossFit, The Shoulder Press](https://www.crossfit.com/essentials/the-shoulder-press):
  referência técnica do desenvolvimento estrito em pé, com cotovelos à frente
  da barra e tronco sustentado. Não se copia a posição de recepção do clean.
- [ACE, Seated Shoulder Press](https://www.acefitness.org/resources/everyone/exercise-library/43/seated-shoulder-press/):
  referência técnica com barra que orienta cotovelos apontados à frente.
  É variante sentada; aplica-se aqui somente a orientação, não seus apoios.
- [Coratella et al., 2022](https://doi.org/10.3389/fphys.2022.825880): estudo
  primário de EMG em oito fisiculturistas, comparando variantes sentadas com
  barra/máquina à frente/atrás. Informa os participantes e as diferenças entre
  variantes, sem definir um ângulo universal para o militar em pé.
- [Ebaugh et al., 2005](https://doi.org/10.1016/j.clinbiomech.2005.03.008):
  fundamento de cinemática escapular já consultado na revisão do mesmo UUID.
  O acompanhamento escapular permanece; apontar cotovelos à frente não implica
  imobilizar os ombros ou eliminar trapézio/serrátil.

Deltoides anterior/lateral continuam principais; tríceps, estabilizadores do
ombro/escápula, preensão e tronco continuam participantes secundários no mapa
explícito vigente. Nenhuma intensidade real é inferida das cores. A orientação
adotada é editorial para este avatar e não uma prescrição individual de ângulo.

## Causa e correção

O pole vector do IK era compartilhado com o desenvolvimento com halteres e
apontava para fora e para trás. Isso movia os cotovelos lateralmente em torno
da linha ombro–punho conforme a barra subia.

Somente no militar, a direção da flexão agora fica no plano anterior: o vetor
de dobra é perpendicular ao alcance ombro–punho e não tem componente lateral.
Assim o cotovelo fica abaixo no início e segue à frente ao elevar o braço,
sem abrir e fechar para os lados. A largura fixa da pegada ainda permite uma
pequena obliquidade anatômica entre ombro e mão. Mantêm-se os comprimentos
ósseos e a resolução iterativa da pegada real na barra.

Trajetória da barra, cabeça rígida, apoios e cadência permanecem os da
[revisão anterior](EXERCISE-3D-LATERAL-HEAD-REFERENCE-REVIEW.md).
A elevação lateral aprovada não sofreu alteração; a orientação antiga do IK
permanece exclusiva do desenvolvimento com halteres aprovado.

## Cadastro e validação

Consulta somente de leitura confirmou equivalência entre cadastro persistido
e revisão versionada, inclusive as instruções que já colocam cotovelos à frente.
Não há alteração de músculos, nome, UUID, histórico, contrato HTTP ou migration.

O teste novo reproduziu a abertura indevida antes da correção e passou depois:
201 posições, nos dois braços, sem desvio lateral da dobra nem inversão do
plano de flexão. As duas suítes específicas passaram com 32 testes, incluindo
comprimentos ósseos, continuidade, contato das mãos, orientação do antebraço,
passagem da barra, rigidez da cabeça e regressões das demais execuções.

Revisão visual desktop 1440px/celular 390px, fases intermediárias e extremas,
vistas frontal, lateral, superior e posterior: cotovelos à frente e pegada
mantida, sem erros de navegador, assets remotos ou transbordamento horizontal.
Artefatos locais: `.tmp/military-press-k649-qa/`.

Verificação final: 968 testes em 112 arquivos, ESLint dos dois arquivos
TypeScript alterados e build de produção com checagem TypeScript aprovados.
Mains local/remota reconferidas nas bases registradas, sem mudanças na API.
