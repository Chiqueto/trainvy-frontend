# Tactical Workout Builder

Implementado nos editores de planos pessoais (incluindo etapas de periodização e edição), prescrições do treinador e modelos. Existem apenas duas visualizações: **Deck 3D** (`tactical`) e **Cards** (`classic`). A lista tática 2D foi removida. Os valores internos da preferência são preservados para compatibilidade; ambos os editores usam o mesmo array `days` do componente pai.

No modo Cards, técnicas e grupos ficam em uma seção recolhível, inicialmente aberta quando há configuração salva. O editor pessoal inclui atalhos para expandir e localizar cada treino, botões de expansão separados das ações e alvos de toque de 44px. Reordenar, duplicar ou excluir não aciona o recolhimento do card.

## Contrato e persistência

`WorkoutExercise` mantém `sets` numérico e todos os campos existentes. Campos aditivos opcionais no HTTP:

- `supersetGroupId`: identificador do grupo dentro do treino.
- `runes`: `DROP_SET`, `REST_PAUSE`, `ISOMETRIC_HOLD`, `CLUSTER_SET`, `TEMPO_CONTROL`.
- `setPrescription`: séries prescritas `{ reps, zone, restSeconds, load? }`; carga em kg. Lista vazia usa os parâmetros gerais legados. Uma lista preenchida deve ter o mesmo tamanho de `sets`.

Alterações nos controles gerais aplicam somente o campo alterado às séries individuais. Trocas de exercício preservam séries, carga e técnicas; alternativas fixas são limpas para evitar referências ao próprio exercício. Fusão mantém as prescrições individuais e aproxima os membros; desfusão não remove séries nem técnicas. Reordenação tática move grupos como bloco. O clássico permite editar códigos de grupo, técnicas e doses individuais.

Os campos passam pelos schemas Zod/OpenAPI e pelo client Orval, incluindo criação, edição, duplicação, modelos e prescrição. Payloads antigos continuam aceitos. Os registros de execução e o histórico existente não são reescritos; `setPrescription` representa planejamento, não séries já executadas.

## Preferência

`GET/PATCH /me/builder-preferences` usa exclusivamente o usuário da sessão. O PATCH aceita apenas `preferredBuilderMode`. O banco usa `User.preferredBuilderMode` com padrão `tactical`.

O cliente atualiza a visualização imediatamente e guarda a preferência em `trainvy:builder-mode:<userId>`. Escritas na API são serializadas. Alterações locais pendentes são reenviadas na próxima abertura; o valor confirmado do servidor prevalece sobre caches antigos de outros dispositivos. Falhas de sincronização são indicadas sem apagar o treino.

## Interações e estimativas

As descrições de blocos horizontais e técnicas rápidas abaixo são o registro histórico da lista 2D removida. Para os controles atuais do Deck 3D, consulte [Studio espacial](TACTICAL-BUILDER-UX.md).

O modo tático ocupa uma janela fixa de `100dvh`, com cabeçalho de 60 px e arena de `calc(100dvh - 60px)`. A página de fundo fica bloqueada; somente a mesa e os carrosséis rolam. O deck e as ações de salvar/revisar permanecem no rodapé. Em telas baixas, cartas e blocos encolhem sem remover os controles. A área segura inferior do PWA é respeitada.

Os exercícios aparecem como blocos horizontais de 92 px (80 px nas telas mais baixas), com zona cíclica, séries e ações diretas:

- **Técnica** abre as opções daquele exercício com marcação explícita, explicação curta e possibilidade de desmarcar. O badge mostra a técnica aplicada. Não é necessário selecionar uma runa no deck e depois procurar um botão genérico de aplicação.
- **Bi-set** abre a lista de parceiros do treino. A escolha combina os exercícios em uma borda compartilhada, com identificação de bi-set/super-set e ação **Separar exercícios**. Separar preserva técnicas, doses e cargas.
- **Toque no deck** adiciona diretamente ao próximo espaço e aproxima a última inserção na mesa. Arraste continua disponível para inserir, reordenar, combinar e aplicar técnicas. Técnicas rápidas selecionadas no dock identificam claramente os exercícios de destino e permitem cancelar.
- **Nome do exercício** abre o ajuste fino de séries, repetições, carga, descanso e metas. A troca rápida usa popover portaled para não ser cortada pelo scroll da mesa.

O mapa e o radar ficam em miniatura no HUD mobile; tocar abre o detalhamento. No desktop, o painel fica aberto na lateral. Configurações do plano e organização das divisões ficam em um painel próprio, usando o mesmo estado do editor clássico. A IA continua acessível nas configurações quando disponível; sua interface recebe o foco enquanto a arena é suspensa.

Mouse: deslocamento mínimo de 7 px. Touch: pressão de 220 ms com tolerância de 6 px; movimento prévio mantém o scroll. Arraste usa alças nas cartas da mesa. Hover central de 300 ms habilita fusão; movimentos rápidos reordenam. Há controles de teclado e alternativas por clique/toque para inserir, fundir, aplicar técnicas e reordenar. Animações respeitam redução de movimento e vibração é opcional conforme suporte do dispositivo.

Mapa usa os papéis musculares reais do catálogo: séries principais ×1 e secundárias ×0,5. Os limiares cromáticos são convenções de volume ilustrativo. Tempo considera reps ×3 s, descansos, aquecimento e transições. Custo SNC e radar são heurísticas editoriais, sem medição fisiológica ou EMG. Metadados ausentes não são apresentados como dados medidos. Trocas sugeridas exigem família de movimento reconhecida e músculo primário compatível; podem haver menos de quatro quando o catálogo não contém variações suficientes. O treinador deve revisar a adequação.

O botão “Selar treino” anima antes de chamar o salvamento existente. Em prescrições profissionais ele salva o rascunho; a revisão e aprovação explícita para enviar ao aluno permanecem obrigatórias.

## Validação e deploy

- Revisão de ergonomia: **754 testes frontend aprovados em 91 arquivos**. Os sete casos táticos cobrem configurações, parceiro do bi-set, técnicas por exercício, desfusão preservando doses, toque para adicionar, troca de variação e paridade com o clássico/salvamento.
- Validação original da API: 22 testes de persistência, ownership, preferências e schemas aprovados. A revisão de ergonomia não muda contratos HTTP nem o banco.
- Edge com componentes reais e catálogo fictício: 390×844, 375×667, 360×740 e desktop 1440×1000, sem overflow horizontal e com página de fundo bloqueada. Quatro blocos visíveis em 390×844, três nos viewports mobile menores e cinco no desktop; mesa mantém scroll interno.
- Verificados no navegador: toque para adicionar, rest-pause no exercício escolhido, seleção de parceiro, expansão do mapa, fusão por arraste e arraste de técnica com feedback do alvo.
- TypeScript e build frontend passaram na revisão. Lint dos componentes e editores alterados sem erros; permanece o aviso preexistente de `tags` não usado no editor de modelos. O build da API passou na implementação original.
- Migração `20261111120000_tactical_builder` validada no schema isolado `tactical_builder_validation_20261111` do banco de testes. O schema padrão desse banco não possui baseline de migrations; não foi feito reset nem baseline sobre ele.

A migração `20261111120000_tactical_builder` foi posteriormente aplicada à base configurada da aplicação por solicitação explícita do usuário, com confirmação das quatro colunas e do registro no Prisma. As duas migrations anteriores que estavam pendentes foram preservadas. A revisão de ergonomia não requer nova migration. Nenhum push ou deploy foi realizado nesta revisão.
