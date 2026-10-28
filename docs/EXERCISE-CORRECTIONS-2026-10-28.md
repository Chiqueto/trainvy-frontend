# Revisão das execuções e identidade do catálogo

Consulta das fontes: 28/10/2026. Branch em ambos os repositórios: `exercise-3d/catalog-fix-20261028`.
Bases: frontend `134bddc`; API `d480a6b`. Implementação em `.tmp/exercise-worktrees/catalog-fix/frontend` e no worktree equivalente `api` do repositório backend.

## Decisões por exercício

| UUID | Revisão |
| --- | --- |
| `f3e5e1cf-d232-4a80-87b3-9f35650a1b5e` | Supino máquina: quadril sobre o assento, costas junto ao encosto, pés fixos; mãos sempre à frente dos ombros. Corrigidos plano de flexão, pegada pronada e deslocamento da pilha. Peitoral maior principal; tríceps e deltoide anterior secundários. |
| `d555deb1-6eef-436d-8377-9427ac267697` | Crucifixo com halteres: rotação das mãos acompanha o arco, palmas para cima na abertura e uma para a outra no fechamento; halteres acompanham a mesma orientação. Comprimentos ósseos e flexão de aproximadamente 20° mantidos. Peitoral maior principal; deltoide anterior e bíceps secundários. |
| `b9859cd9-6ed6-4e63-8fd0-500e8cf8d553` | Renomeado para Peck Deck; permanece o movimento com cotovelos flexionados e apoio de antebraços. Sinônimos ficam na revisão estruturada, fora do nome. |
| `6ca42bbc-3724-45ec-98ed-36fb53af260a` | Novo Crucifixo na Máquina: pegadores sem almofadas de antebraço e cotovelos levemente flexionados durante a adução horizontal. Equipamento e trajetória distintos do Peck Deck. Mapa gráfico conferido: peitoral, deltoide anterior e bíceps; mesmos participantes do crucifixo com halteres por inferência anatômica, sem afirmar equivalência de EMG entre implementos. |
| `46e31e5f-585b-4a3b-8b06-f6bed13440b5` | Crossover na Polia Média: aproximação horizontal à frente do peito. |
| `daf02b04-9308-4b8f-8047-d4a5bb86d079` | Crossover na Polia Alta: aproximação para baixo e para dentro. |
| `dd8854e2-5652-4ffb-86bc-dbf61b42bd04` | Crossover na Polia Baixa: aproximação para cima e para dentro. |

As três alturas já tinham UUIDs próprios. Nomes, instruções e aliases foram padronizados sem criar cópias. A revisão não adiciona animações de crossover. Peitoral maior é o alvo amplo, deltoide anterior participante secundário; estabilização de escápulas, tronco e cotovelos é reconhecida sem pretender exibir todo estabilizador na máscara. Não atribuímos isolamento ou ranking regional às alturas.

## Evidência e limites

- [Comparação de supino horizontal e chest press sentado, 2023](https://pmc.ncbi.nlm.nih.gov/articles/PMC10203828/): investigação aguda de EMG com homens treinados e diferentes pegadas; apoia a escolha dos participantes do supino. Geometria do encosto, base e trajetória desta máquina são decisões de representação, sem alegar ângulo universal ou proteção contra lesões.
- [Saeterbakken et al., 2020](https://pmc.ncbi.nlm.nih.gov/articles/PMC7675616/): comparação de supino com barra e crucifixo com halteres em 17 homens treinados, a 6RM. Apoia os participantes do crucifixo; não mede hipertrofia nem fundamenta equivalência quantitativa com máquinas.
- [ACE, Lying Chest Fly](https://www.acefitness.org/resources/everyone/exercise-library/21/lying-chest-fly/): referência técnica para pegada neutra e punhos alinhados. Palmas acompanhando o arco são uma decisão cinemática; não se exige mantê-las apontadas ao teto no fechamento.
- [Life Fitness, Pectoral Fly/Rear Deltoid](https://www.lifefitness.com/en-us/catalog/strength-training/selectorized/insignia-series-pectoral-fly-rear-deltoid): referência visual do equipamento com pegadores. A distinção editorial entre esse cadastro e o Peck Deck usa o tipo de apoio; a terminologia comercial pode variar.
- [Schanke, 2012](https://core.ac.uk/download/pdf/10596984.pdf): estudo incluindo pec deck e crossover, sem comparar diretamente as três alturas de polia. Não sustenta um ranking de EMG entre baixa, média e alta. O ajuste de altura e a direção do arco são distinções mecânicas.
- [Brown et al., 2010](https://pubmed.ncbi.nlm.nih.gov/20870556/): ações isométricas de ombro mostram diferenciação funcional regional. Extrapolar quantitativamente esses resultados aos três crossovers dinâmicos seria inadequado.

As cores continuam categóricas e ilustrativas; não representam EMG, intensidade nem ausência de participação em tecidos neutros. A cadência mantém retorno controlado, pausa breve e concêntrica suave. Não houve mudança no asset anatômico ou nas cores do material.

## Preservação e entrega

Na API, `20261028180000_catalog_identity_and_execution_fixes` transfere todas as referências de `...0102` (Supino Reto) para `...0101` (Supino Reto com Barra), e de `...0106` (Agachamento) para `...0105` (Agachamento Livre). Inclui exercício principal, planejado, alternativas, séries e propostas. Nomes históricos, cargas, repetições e IDs de sessões/séries permanecem intactos. Mídia não conflitante é transferida; se já existir mídia do mesmo provedor/tipo no destino, prevalece a canônica. Os dois registros globais duplicados são removidos; exercícios particulares não são unificados.

Bootstrap e manifesto não recriam os duplicados. Nomes antigos têm aliases exatos na resolução, preservando a precedência de exercícios particulares. A alteração de `updatedAt` invalida o fingerprint do catálogo. Revisões anatômicas e instruções ficam versionadas e são persistidas pela migration; não houve alteração de contrato HTTP.

Testes: cinemática, malha/asset, orientação das mãos e separação dos dois crucifixos; schemas anatômicos; migration executada duas vezes em tabelas temporárias com rollback; vínculo das séries, alternativas, propostas e mídia preservado. Migrations anteriores são verificadas contra snapshots imutáveis das revisões originais.

Revisão visual: Chrome descartável, desktop 1440px e celular 390px; vistas frontal, lateral e perspectiva; fechamento e abertura/retorno; sem erros de console ou overflow. Conferidas costas/assento, mãos, halteres, apoios, diferenciação de trajetória e shading. Evidência local em `.tmp/catalog-fix-qa` do frontend principal. Build local e TypeScript também verificados.

Entrega preparada para integração local. Aplicação no banco de destino, push e deploy dependem da publicação; não foram executados nesta tarefa.
