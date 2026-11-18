# Desenvolvimentos, elevação lateral e roscas — 18/11/2026

Correção posterior de trajetória, giro axial e elevação dos ombros:
[revisão de postura](EXERCISE-3D-UPPER-FORM-CORRECTIONS.md). Seus detalhes
substituem os valores de cinemática anteriores abaixo; o cadastro permanece coerente.

Branch do par frontend/API: `exercise-3d/five-upper-m218`. Bases: frontend
`7e18460`, API `b8d6cd5`. Trabalho por UUID; cinco movimentos novos e uma
identidade histórica equivalente, sem reaproveitar uma execução incompatível.

| UUID final | Movimento adotado | Decisão anatômica |
| --- | --- | --- |
| `000000000123` | Desenvolvimento militar estrito em pé, barra à frente, pronada | Deltoides anterior/lateral principais; tríceps, peitoral, manguito, controle escapular, pegada e tronco secundários. |
| `000000000124` | Desenvolvimento bilateral sentado com halteres, encosto vertical, pronada | Mesmos participantes por revisão própria; apoio distinto, trajetória independente/convergente e sem rotação de Arnold press. |
| `000000000125` | Elevação lateral em pé, braços discretamente à frente | Deltoide lateral principal; demais deltoides, manguito, trapézio/serrátil, cotovelo, punho e tronco secundários. |
| `000000000127` | Rosca direta com barra reta, supinada | Bíceps/braquial principais; braquiorradial, pegada, deltoide anterior e tronco secundários. Sem separar cabeças do bíceps. |
| `000000000128` | Mesmo movimento de 127, preservado para históricos | Cadastro/mídia originais confirmavam a mesma barra. Não inventar uma rosca com halteres neste UUID. Excluído somente de novas escolhas; alias genérico resolve 127, preservando prioridade de personalizados. |
| `000000000129` | Rosca martelo bilateral, pegada neutra constante | Bíceps, braquial e braquiorradial principais; pegada, ombro e tronco secundários. Não afirmar maior EMG universal do braquiorradial nem ausência do bíceps. |

Todos os IDs completos têm o prefixo `00000000-0000-4000-8000-`. Os dois
desenvolvimentos e a elevação lateral não fixam as escápulas para baixo: há
rotação superior, elevação e inclinação posterior ilustrativas. As roscas mantêm
cotovelos estáveis sem girar o punho arbitrariamente. As pernas sustentam o corpo;
neutralidade da cor não significa ausência de atividade.

## Fontes consultadas antes de modelar

- [Saeterbakken e Fimland, 2013](https://pubmed.ncbi.nlm.nih.gov/23096062/):
  EMG e força em desenvolvimentos com barra/halteres, sentado/em pé. Usado para
  distinguir apoios e participação, sem converter diferenças agudas em hipertrofia.
- [Coratella et al., 2022](https://doi.org/10.3389/fphys.2022.825880): oito
  fisiculturistas, desenvolvimento sentado com barra/máquina à frente/atrás.
  Confirma coenvolvimento de deltoides, tríceps, peitoral e trapézio. Não extrapolar
  magnitudes para a variante militar em pé nem recomendar passagem atrás da nuca.
- [Coratella et al., 2020](https://doi.org/10.3390/ijerph17176015): dez
  fisiculturistas, elevações com rotações e flexão do cotovelo distintas. Sustenta
  distinguir deltoide lateral/anterior/posterior; não impõe rotação interna ou
  gesto de derramar água. Plano e amplitude do avatar são escolhas editoriais.
- [Coratella et al., 2023](https://doi.org/10.3390/sports11030064): dez
  fisiculturistas, pegadas supinada/pronada/neutra, séries não exaustivas com carga
  de 8RM. Bíceps e braquiorradial seguem coenvolvidos. Não distingue cabeças do
  bíceps; braquial inferido pela anatomia, sem fingir medição superficial.
- [Uysal et al., 2026](https://doi.org/10.1186/s13102-026-01867-7): estudo
  recente sobre configurações de barra/pegada e fases da rosca. Usado como
  contexto de variabilidade; não transferir resultados agudos para porcentagens
  de esforço no modelo ou para promessa de hipertrofia.
- [Ebaugh, McClure e Karduna, 2005](https://doi.org/10.1016/j.clinbiomech.2005.03.008):
  cinemática tridimensional e EMG durante elevação ativa/passiva. Fundamenta
  acompanhamento escapular qualitativo; não fornece proporção fixa universal
  nem ângulos individuais para estes exercícios carregados.
- [OpenStax, anatomia de cintura escapular e membros superiores](https://openstax.org/books/anatomy-and-physiology-2e/pages/11-5-muscles-of-the-pectoral-girdle-and-upper-limbs):
  ações dos músculos e estabilização, sem medições de EMG dos modelos.

## Implementação e limites

Comprimentos ósseos permanecem os do GLB. Nas roscas, flexão ilustrativa do
cotovelo de aproximadamente 15 a 120 graus; pequena posição anterior fixa do
braço mantém o equipamento à frente das coxas. Na lateral, elevação de 10 a 85
graus, plano 20 graus à frente e flexão do cotovelo de cerca de 10 graus.
Desenvolvimentos usam alcance compatível com o rig, preservam passagem anterior
e evitam choque entre halteres. Não são ângulos ótimos universais.

Pés, quadril e apoios permanecem estáveis. O banco sentado é vertical nesta
variante. As escápulas têm rotação superior ilustrativa progressiva até cerca de
39 graus nos desenvolvimentos e 22 graus na lateral, com pequena inclinação
posterior; não se impõe relação fixa de 2:1. O braço acompanha a escápula e o
antebraço respeita seu eixo real de referência. As mãos existentes, já revisadas,
envolvem os equipamentos com dedos/polegares legíveis; martelo mantém oposição
das palmas e o eixo do halter acompanha o antebraço.

Mapas de ativação são explícitos por movimento. Um mapa adicional, ligado ao
checksum do atlas, identifica deltoide acromial e redondo menor com concordância
de origem de 92,5%. O processo não altera o GLB/licença. Supraespinal e subescapular
permanecem no cadastro, mas não possuem superfícies individualizadas neste asset:
não se pinta tecido vizinho para simular sua presença. As cores continuam
`primaryTissue`, `secondaryTissue` e `neutralTissue`, sem medidas de intensidade.

O renderer já estava no limite de atributos WebGL. A revisão usa um canal de
máscara existente, preenchido com o mapa explícito do exercício atual; ao trocar
para outro movimento, restaura o mapa anterior apropriado. Não acrescenta um
atributo além do limite do dispositivo. A revisão no navegador detectou e
confirmou a correção desse problema que testes de pose não revelariam.

## Cadastro, contratos e persistência

Revisões individuais `2026-11-18.upper.1` em seis arquivos JSON da API e seis
migrations novas, uma por UUID. Cada migration bloqueia a linha e exige identidade
global, nome, revisão detalhada ausente e classificação anterior exata. Adiciona
somente grupos secundários sustentados que faltavam; preserva grupos anteriores,
edições manuais, UUIDs, mídias, históricos, séries e decisões profissionais.
`updatedAt` invalida o cache. Não executa reconciliação geral do catálogo.

A identidade legada 128 permanece válida por histórico e resolução direta do
modelo; somente novas seleções usam 127. O quinto exercício distinto passa a ser
o martelo 129, o próximo da fila. A enumeração HTTP de modelos recebe os novos
valores de forma aditiva; OpenAPI e Orval regenerados no par isolado.

Aplicação das novas migrations no banco da aplicação deve ser registrada
separadamente; preparar/testar uma migration não equivale a aplicá-la.

## Verificação

Testes por movimento conferem alcance, comprimentos ósseos, pés/assento estáveis,
contato das mãos, continuidade dos quaternions, eixo do antebraço, passagem da
barra à frente do rosto, cotovelos estáveis nas roscas, pegada neutra do martelo,
acompanhamento escapular e seleção dos músculos de origem. A entrega da API é
testada com rollback: schema, guardas de identidade, idempotência, preservação
manual, histórico/customizados, busca muscular e instruções no fluxo normal.

Conferência visual dos cinco movimentos em desktop 1440px e celular 390px,
vários ângulos/fases: sem erros de navegador, assets remotos ou transbordamento.
Regressões de escápulas, pegadas, atlas e exercícios existentes verificadas.

Resultados: suíte completa da API com 950 testes em 117 arquivos; frontend com
952 testes em 111 arquivos, mais a regressão adicional do seletor de demonstrações
que oculta a rosca legada em novas escolhas e preserva uma seleção já salva.
Após o ajuste final do shader, 135 verificações direcionadas de movimentos,
escápulas, pegadas e renderer passaram. ESLint dos arquivos alterados e builds
de ambos os repositórios aprovados. Preflight somente de leitura confirmou as
seis identidades e classificações anteriores no banco da aplicação.
