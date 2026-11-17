# Detalhamento muscular opcional — 17/11/2026

O cadastro personalizado mantém os grupos principais/secundários e permite abrir
“Detalhar” em cada grupo selecionado. É possível salvar somente o grupo geral.
As opções usam identificadores e nomes das revisões anatômicas do catálogo,
com aliases equivalentes consolidados no seletor. Não atribuem ativação medida
nem uma revisão científica ao exercício criado pelo usuário.

`muscleDetails` segue o contrato OpenAPI/Orval: grupo, papel e `detailIds`.
A API valida cada identificador contra o grupo e os papéis selecionados. A edição
restaura as seleções; remover o grupo limpa seu detalhe, e trocar o papel move
o detalhamento junto. A busca inclui os nomes das regiões selecionadas.

O resumo aparece no catálogo personalizado e no cabeçalho da evolução. O UUID
do exercício continua sendo a identidade do histórico. Séries e sessões antigas
não são reescritas; o resumo mostra a classificação atual do cadastro. Métricas
de volume continuam agrupadas pelos grupos musculares gerais.

Requer a migration da API `20261117170000_custom_muscle_details` antes de publicar
a API e o frontend. As listas de opções em `app/_lib/muscle-detail-options.json`
e `src/domain/muscle-detail-options.json` da API devem permanecer iguais.

No desktop, o espaço da sidebar é reservado no `html`, pois o bloqueio de
rolagem dos diálogos pode zerar o padding do `body`. O guia fica centralizado
na área disponível ao lado da navegação.
