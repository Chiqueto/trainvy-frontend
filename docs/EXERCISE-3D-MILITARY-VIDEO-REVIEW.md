# Militar: referência de trajetória enviada pelo usuário — 18/11/2026

UUID `00000000-0000-4000-8000-000000000123`, desenvolvimento militar estrito
em pé, com barra à frente e pegada pronada. Branch
`exercise-3d/military-reference-j752`; base frontend `fc597e3`, API `b221200`.
Worktree frontend `.tmp/exercise-worktrees/five-upper-m218/frontend`.

## Referências e limites

O usuário forneceu uma descrição detalhada da execução e o vídeo
[CrossFit, Bar Path in the Press](https://www.youtube.com/watch?v=Bnr1q9pWeTk),
também publicado na [página oficial da demonstração](https://www.crossfit.com/essentials/bar-path-in-the-press).
O vídeo foi aberto em navegador descartável e foram inspecionados quadros
próximos de 8, 18, 35, 48 e 60 segundos. Distinguiu-se a demonstração inicial
da correção posterior do instrutor: a cabeça dá passagem para que a barra
permaneça próxima do rosto. Não foram medidos ângulos humanos a partir desses
quadros. Artefatos locais em `.tmp/military-reference-j752-qa/`.

Referências técnicas reconferidas antes da alteração:
[CrossFit, Shoulder Press](https://www.crossfit.com/essentials/the-shoulder-press),
[CrossFit, Training Guide](https://assets.crossfit.com/pdfs/seminars/CertRefs/CF_Manual_v4.pdf)
e [ACE, Standing Shoulder Press](https://www.acefitness.org/resources/everyone/exercise-library/71/standing-shoulder-press/).
O encaixe inicial tem cotovelos baixos e ligeiramente à frente da barra,
antebraços próximos da vertical e tronco firme. O alto tem extensão controlada,
barra sobre a base e acompanhamento escapular. Não se representa impulso de
pernas nem a recepção do clean.

A revisão de participantes foi reconferida com as pesquisas primárias
[Coratella et al., 2022](https://doi.org/10.3389/fphys.2022.825880) e
[Saeterbakken e Fimland, 2013](https://pubmed.ncbi.nlm.nih.gov/23096062/).
A primeira compara variantes sentadas em oito fisiculturistas; a segunda
compara posições e equipamentos. Nenhuma determina centímetros ideais de recuo
cervical, ângulo universal ou resultado de hipertrofia para este avatar.
Deltoides anterior/lateral continuam principais; tríceps, músculos escapulares,
manguito, preensão e estabilizadores do tronco permanecem no mapa secundário
explícito vigente. Cores continuam ilustrativas, sem leitura de EMG real.

## Ajustes na demonstração

A versão anterior ainda começava com a barra distante dos ombros e cotovelos
atrás dela. Sua linha inclinada aproximava a barra da cabeça conforme subia,
com recuo cervical pequeno. Corrigir somente a abertura lateral não resolvia
esse encaixe nem a coordenação mostrada no vídeo.

Agora a barra começa 3 cm mais alta e 8,5 cm mais próxima do corpo nesse avatar.
Os punhos ficam aproximadamente sobre os cotovelos, que terminam discretamente
à frente da barra. A largura da pegada permanece fixa e a flexão anterior
continua sem giro lateral. Mantêm-se segmentos ósseos e contato real da palma.

A primeira metade da elevação mantém a coordenada longitudinal da barra.
Somente após liberar a testa ela se acomoda suavemente sobre o meio dos pés.
A cabeça recua antes da passagem pelo queixo, com no máximo 4,5 cm de translação
e apenas 2 graus de inclinação ilustrativa, e volta à posição neutra acima.
O rosto inteiro continua rígido; apenas o pescoço abaixo do corte faz a
transição de pesos. Esses valores são ajustes geométricos do avatar, não
prescrições individuais. A descida usa a mesma coordenação em sentido inverso.

Esta decisão substitui os valores correspondentes das revisões
[da cabeça](EXERCISE-3D-LATERAL-HEAD-REFERENCE-REVIEW.md) e
[dos cotovelos](EXERCISE-3D-MILITARY-ELBOW-REVIEW.md).
A lateral aprovada e o desenvolvimento com halteres permanecem preservados.

## Cadastro e verificação

Consulta somente de leitura confirmou correspondência dos seis cadastros da
entrega anterior com seus JSONs e papéis musculares. As instruções já descrevem
o militar estrito à frente, punhos sustentados e cotovelos discretamente à
frente. Não há mudança de nomes, UUIDs, músculos, histórico, contratos ou dados;
nenhuma migration é necessária.

Dois testes novos falharam antes da alteração: encaixe inicial e trajetória
próxima da vertical. Depois da correção, 34 testes específicos passaram,
incluindo osso/pegada, ausência de abertura lateral, rigidez de todos os vértices
da cabeça e folga positiva entre a barra e a superfície real do rosto em 101
posições. O desenvolvimento com halteres continua com a mesma trajetória
aprovada nas 41 amostras da regressão.

Revisão visual de militar, lateral, desenvolvimento com halteres e supino:
desktop 1440px e celular 390px, várias vistas e fases. No militar foram
acrescentadas capturas intermediárias durante a passagem pelo rosto. Todas as
execuções finais passaram sem erros de navegador, assets remotos ou excesso de
largura. Uma tentativa inicial da lateral falhou ao buscar o GLB local; o asset
foi conferido íntegro com HTTP 200 e 8.590.880 bytes, e a repetição limpa passou
nos dois tamanhos, sem mudança de código. Artefatos `.tmp/*-j752-qa/`.

Verificação final: 970 testes aprovados em 112 arquivos; ESLint dos três
arquivos TypeScript alterados e build de produção com TypeScript aprovados.
Mains local/remota reconferidas nas bases registradas antes da integração.
Não houve mudança na API nem escrita no banco.
