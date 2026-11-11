# Editor tático — 11/11/2026

O workspace compartilhado pelos editores de planos, modelos e prescrições usa um cabeçalho de 56 px com revisão e salvamento, mesa flexível, painel muscular de 288 px no desktop e dock de 202 px. No mobile, a pílula de telemetria abre o painel em modal; ações compactas mantêm nomes acessíveis. A rolagem continua disponível sem barras nativas.

Técnicas podem ser aplicadas pelo menu junto ao exercício, arraste com prévia colorida ou seleção persistente no dock. No modo armado, tocar novamente remove a técnica; cancelar ou Escape desarma. Badges alternam parâmetros e possuem remoção independente. Bi-set combina com o próximo exercício elegível; o seletor permanece como alternativa quando não há parceiro imediatamente abaixo.

`runeConfig` é um objeto opcional validado pela API, persistido no exercício e transportado pelo cliente Orval. Preserva drops (1/2/3), pausa (10/15/20 s), isometria (pico 2/3 s ou base 2 s), cluster (2/3/4 blocos) e cadência. Valores ausentes usam a primeira opção; nenhuma alteração reescreve sessões anteriores. O editor clássico também mostra e alterna os parâmetros.

Publicação requer a migração aditiva `20261111140000_rune_configuration` no backend antes do frontend. A migração anterior `20261111120000_tactical_builder` é pré-requisito. Nenhuma migração foi aplicada ao banco principal durante esta revisão.

O mapa indica volume planejado ilustrativo. As faixas são rotuladas Neutro, Ativo, Moderado e Elevado, sem sugerir que um limiar fixo determine volume ideal ou sobrecarga fisiológica.

Validação: testes do editor e serialização, integração de criação/edição/duplicação no banco isolado, TypeScript nos dois repositórios e inspeção em Chrome headless com catálogo fictício nas larguras 1440, 1280 e 390 px.
