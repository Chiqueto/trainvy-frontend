# Editor tático — 11/11/2026

## Studio espacial — atualização de 12/11/2026

O modo espacial tem cartas livres na mesa e catálogo horizontal com rolagem contínua por roda do mouse, setas ou swipe. A alça do catálogo permite arrastar até a posição desejada na mesa, inclusive no touch. Devolver uma carta da mesa ao deck remove somente essa entrada do treino. Coordenadas são locais ao editor e não alteram a identidade do exercício no catálogo ou o histórico.

Duplo clique no título abre a configuração; o lápis oferece a mesma ação com um toque ou teclado. Botão direito, menu ⋯ e toque longo de 600 ms sem deslocamento abrem as ações tanto nas cartas do catálogo quanto nas da mesa. Deslizar cancela o toque longo. A configuração do catálogo é aplicada à nova carta somente ao confirmar **Adicionar ao treino**.

O painel possui abas Prescrição, Técnicas e Substitutos. A prescrição avançada abre expandida e mantém campos e séries individuais editáveis. Substitutos usa o seletor do catálogo, com até duas alternativas, excluindo o próprio exercício e a alternativa já selecionada. Seletores aninhados ficam acima do painel. Eventos de portais não iniciam o pan nem o arraste da carta.

Séries e repetições usam inputs, +/−, roda do mouse e alça vertical de ajuste. Alterar reps fixas limpa a faixa e preserva descansos e cargas individuais. Técnicas aparecem em abas laterais e abrem formulários explícitos, sem alternar valores ao clicar na etiqueta.

`runeConfig` agora aceita drop-set 1–10 reduções, rest-pause 1–600 s, cluster 2–20 blocos, isometria `peakN`/`baseN` com N entre 1–600 s e cadência de quatro fases inteiras entre 0–60 s. A notação antiga continua válida. Zod/OpenAPI e Orval foram atualizados; publicar a API antes do frontend. Não é necessária nova migration, pois os valores continuam no JSON existente.

**Ajuda e legendas** explica gestos, controles, cores e estrelas: verde/★ indica a categoria isoladora, ciano/★★ multiarticular e dourado/★★★ composto/potência, conforme a heurística do editor. O mapa inclui demanda do SNC em pontos (2/4/7 por série, acrescidos do fator de técnicas). É uma comparação ilustrativa das fichas, sem representar fadiga ou estresse fisiológico medido.

As descrições abaixo documentam a interface tática em lista anterior; seus controles cíclicos continuam disponíveis nessa visualização.

### Edição e salvamento do plano

O nome do plano é editável diretamente no cabeçalho espacial e fica sincronizado com o formulário de configurações compartilhado com o editor normal. Planos, modelos e prescrições mantêm suas próprias ações de salvar e revisar. O painel reúne os campos gerais de cada editor e permite renomear, duplicar, excluir e ordenar treinos, além de ajustar a duração e o dia de referência. Alterar exercícios preserva a duração informada. A prescrição permite editar aquecimento e descanso geral, além das séries individuais; técnicas exibem ícones no seletor e nas etiquetas laterais.

### Painel muscular, SNC e atributos

O botão Mapa muscular abre um painel lateral de 400 px com rolagem própria no desktop (a partir de 1024 px), mantendo a mesa interativa. No celular e em telas menores, abre em modal. Ambos preservam as abas Músculos, SNC e Atributos, o modelo detalhado e os textos maiores. A silhueta SVG possui vistas anterior/posterior, mais regiões anatômicas ilustrativas e seleção por toque, teclado ou nomes dos grupos. O radar usa rótulos maiores e uma lista de valores com escala 0–10. A demanda do SNC mostra base, acréscimo de técnicas e contribuições por exercício, incluindo a classificação desconhecida; a fórmula do índice permanece a mesma. Os resumos exibem pontos, sem apresentar o índice como porcentagem de fadiga.

O workspace compartilhado pelos editores de planos, modelos e prescrições usa um cabeçalho de 56 px com revisão e salvamento, mesa flexível, painel muscular de 288 px no desktop e dock de 202 px. No mobile, a pílula de telemetria abre o painel em modal; ações compactas mantêm nomes acessíveis. A rolagem continua disponível sem barras nativas.

Técnicas podem ser aplicadas pelo menu junto ao exercício, arraste com prévia colorida ou seleção persistente no dock. No modo armado, tocar novamente remove a técnica; cancelar ou Escape desarma. Badges alternam parâmetros e possuem remoção independente. Bi-set combina com o próximo exercício elegível; o seletor permanece como alternativa quando não há parceiro imediatamente abaixo.

`runeConfig` é um objeto opcional validado pela API, persistido no exercício e transportado pelo cliente Orval. Preserva drops (1/2/3), pausa (10/15/20 s), isometria (pico 2/3 s ou base 2 s), cluster (2/3/4 blocos) e cadência. Valores ausentes usam a primeira opção; nenhuma alteração reescreve sessões anteriores. O editor clássico também mostra e alterna os parâmetros.

Publicação requer a migração aditiva `20261111140000_rune_configuration` no backend antes do frontend. A migração anterior `20261111120000_tactical_builder` é pré-requisito. Nenhuma migração foi aplicada ao banco principal durante esta revisão.

O mapa indica volume planejado ilustrativo. As faixas são rotuladas Neutro, Ativo, Moderado e Elevado, sem sugerir que um limiar fixo determine volume ideal ou sobrecarga fisiológica.

Validação: testes do editor e serialização, integração de criação/edição/duplicação no banco isolado, TypeScript nos dois repositórios e inspeção em Chrome headless com catálogo fictício nas larguras 1440, 1280 e 390 px.
