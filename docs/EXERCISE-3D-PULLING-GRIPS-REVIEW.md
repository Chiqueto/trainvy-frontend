# Puxadas, triângulo e pegadas — revisão de 17/11/2026

Complementa as revisões [escapular](EXERCISE-3D-SCAPULAR-ROWS-REVIEW.md) e de
[variantes com barra](EXERCISE-3D-BARBELL-ROW-VARIANTS-REVIEW.md). Os destinos
anatômicos das remadas com barra e o controle escapular continuam preservados.

## Identidades e cadastro

| UUID | Decisão |
| --- | --- |
| `00000000-0000-4000-8000-000000000119` | Puxada Frontal no Cabo (Pronada): opção mantida. Nome anterior dizia máquina, mas o cadastro e o modelo já descreviam polia alta com barra. |
| `00000000-0000-4000-8000-000000000120` | Puxada Frontal: equivalente retirada das novas seleções e do laboratório. UUID, consultas por histórico e modelo legado permanecem. Aliases genéricos passam a resolver 119. |
| `120f29ac-733c-478b-8aa9-a3f4c22f5e70` | Remada Baixa no Cabo com Triângulo: destino corrigido para abdômen; instruções de pegada e percurso revisadas. |
| `00000000-0000-4000-8000-000000000121` | Curvada baixa pronada: revisão da mão e antebraço. |
| `00000000-0000-4000-8000-000000000122` | Curvada legada: mesma correção de pegada, continua fora de novas seleções. |
| `1444333f-9fb0-4d74-843a-42b9480e5cfc` | Curvada baixa supinada: revisão da mão e antebraço. |
| `7f249b6a-85ad-45ca-9147-6cfa712547c7` | Curvada alta pronada: revisão da mão e abertura confortável. |
| `92a8b19e-86b5-47ea-91d1-529fab4ab05c` | Curvada alta supinada: revisão da mão e abertura confortável. |
| `bb4607b8-c89b-4d22-bf59-1edf55c2ee77` | Yates pronada: revisão da mão e antebraço. |
| `824b6099-a3d9-41f9-bf52-d29587393c85` | Yates supinada: revisão da mão e antebraço. |
| `1eef7876-e093-42af-8374-00d3b105c47a` | Pendlay: revisão da mão; repouso completo no chão preservado. |
| `00000000-0000-4000-8000-000000000138` | Unilateral: mão direita envolve o halter; esquerda fica aberta no banco. |
| `43025392-0466-46e7-82ab-27888d53f929` | Remada na máquina: pegadas neutras alinhadas aos puxadores verticais. |

Conferência por exercício: nenhuma destas correções de mão altera os motores,
sinergistas ou estabilizadores já documentados nos respectivos mapas explícitos.
Puxadas mantêm dorsal/redondo maior como principais; remadas mantêm a participação
de dorsal e retratores escapulares conforme sua variante; unilateral conserva a
distinção entre lado de carga e apoio. Manguito, braços, pegada e sustentação do
tronco continuam secundários. Nenhum mapa de cores foi copiado entre exercícios.
Sem acrescentar ênfase regional ou intensidade de EMG por causa da pegada.

Na API, somente 119, 120 e triângulo recebem revisão `2026-11-17.grip.1` por
migrations individuais que exigem UUID global, nome anterior, JSON anterior
completo e classificação muscular anterior. Uma edição manual divergente é
preservada. As versões históricas dos arquivos e migrations são imutáveis.
Grupos musculares, vínculos dos treinos e sessões não são reescritos.

## Pesquisa anterior à modelagem

- [Padovan et al., 2025 — remada com pegada estreita/larga](https://air.unimi.it/retrieve/handle/2434/1189176/3160536/Padovan%202025%20JHK_pulley.pdf),
  DOI 10.5114/jhk/209550: a execução estreita com triângulo termina no abdômen;
  a larga com barra termina mais alta. Sustenta distinguir os percursos, sem
  transformar EMG de uma amostra em intensidade individual ou resultado hipertrófico.
- [Padovan et al., 2026 — remada com escápulas livres/fixas](https://www.mdpi.com/2411-5142/11/1/6),
  DOI 10.3390/jfmk11010006: referência adicional para percurso abdominal e controle
  escapular. Não implica exigir retração/protração máxima em qualquer situação.
- [Buonsenso et al., 2025 — variações da puxada](https://www.mdpi.com/2411-5142/10/3/345),
  DOI 10.3390/jfmk10030345: diferenças de pegada não justificam inventar uma
  execução de alavancas em dois cadastros que já representam polia alta.
- [Caumes et al., 2019 — relação entre punho e preensão](https://pmc.ncbi.nlm.nih.gov/articles/PMC6920170/),
  DOI 10.1038/s41598-019-55443-w: estudo experimental/modelo de preensão cilíndrica,
  usado para revisar oposição do polegar, dedos e independência do punho. Não
  mede estas animações e não fornece um ângulo universal de punho para remadas.
- [Ronai — técnica de puxada frontal](https://digitalcommons.sacredheart.edu/pthms_exscifac/32/):
  referência técnica complementar para identificar equipamento e trajetória.

## Triângulo e mãos

O centro do triângulo contraído usa o marco abdominal do atlas `y=1.065`,
transformado para o referencial sentado (raiz original `y=1.142`). Resulta em
`y=0.723`, em vez do antigo `0.800`. A estrutura fica à frente do abdômen.
Sua orientação vem do equipamento, com inclinação limitada a 15 graus e ligação
do olhal ao cabo baixo; não herda a rotação de uma das mãos. Este limite é uma
escolha ilustrativa do acessório, não prescrição biomecânica universal.

As mãos antigas eram acessórios rígidos com dedos visualmente fundidos. Nos
13 modelos desta revisão, substituímos apenas essas faces neutras por geometria
original em código: quatro dedos separados e polegar radial em oposição. São
pegadas estáticas, sem simulação de tendões ou articulação individual dos dedos.
A mão de apoio unilateral usa geometria aberta. O GLB, os vértices do atlas e
suas seleções anatômicas permanecem inalterados; outros exercícios recuperam
todos os índices originais. Materiais das mãos permanecem neutros.

O eixo da barra/puxador define o eixo da preensão. Pronada e supinada têm palmas
e polegares orientados de forma distinta, com espelhamento esquerdo/direito.
O antebraço segue seu eixo longitudinal real na pose de referência; não recebe
mais toda a rotação do punho. O encaixe do equipamento permanece na mesma mão.

## Verificação

Testes cobrem alinhamento ao eixo do equipamento nos 13 modelos, direção real
do antebraço, contato da mão, polegares espelhados, diferenciação pronada/supinada,
mão de apoio, ausência de penetração relevante do triângulo no tronco e restauração
dos índices originais. O limite editorial de desvio do punho é 0.63 radianos
neste avatar, não recomendação clínica. Mantidos comprimentos ósseos, apoios,
continuidade, escápulas e destinos alto/baixo das remadas.

Revisão no navegador em desktop e celular: triângulo, curvadas pronada/supinada
alta/baixa, máquina, unilateral e puxada frontal; conferência de vários ângulos
e fases. Sem erros de navegador, carregamento remoto de assets ou transbordamento
horizontal. Cores e legendas continuam categorias ilustrativas, sem medir esforço.

Validação completa: frontend 923 testes em 106 arquivos; API 929 testes em 114
arquivos; ESLint dos arquivos alterados e builds de frontend/API aprovados.
Preflight das três migrations no banco da aplicação aprovado em transações com
rollback, antes de qualquer aplicação persistente.
