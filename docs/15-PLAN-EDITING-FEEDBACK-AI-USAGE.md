# Edição de planos, feedback e custos de IA

Escopo definido em 27/10/2026: priorizar treino editável, feedback persistente e visibilidade operacional da IA. RAG/biblioteca não são necessários nesta etapa; a IA consulta os dados estruturados do atleta. Cobrança automática e alterações no catálogo ficam fora deste trabalho.

## Edição

- O detalhe de um plano oferece **Editar plano**, levando a `/planning/plans/:id/edit`.
- O construtor existente recebe os dias, exercícios, aquecimento, alternativas e capas já salvos.
- É possível alterar nome, exercícios, séries, repetições, descansos e ordem, além de adicionar/remover treinos e exercícios.
- Na criação e edição manual, exercícios e alternativas são escolhidos em um modal de busca por nome/grupo muscular, com cards do catálogo e envio dos IDs existentes. Não há cadastro de exercício personalizado nesse fluxo. Prescrições antigas sem vínculo continuam preservadas; novos itens, inclusive rascunhos de IA, precisam ser selecionados no catálogo antes de salvar.
- O detalhe da rotina oferece retorno para `/planning`. O menu de ações usa portal, reposicionamento para caber na tela e espaço reservado à navegação inferior; confirmações também usam portal e empilham os botões no celular.
- A API preserva IDs de itens mantidos, vínculo com periodização e estado de ativação. IDs enviados precisam pertencer ao plano/dia e os exercícios precisam ser globais ou do próprio atleta.
- Uma sessão em andamento do mesmo plano bloqueia a edição. Início de sessão e edição compartilham lock do plano.
- Execuções anteriores continuam com os snapshots e séries originais. Remover um dia prescrito não apaga a sessão histórica.
- Endpoints: `GET /workout-plans/:id/edit` e `PUT /workout-plans/:id`. Somente o dono edita; treinador continua usando o fluxo próprio de prescrição.

## Feedback pós-treino

- O resumo recebe a avaliação persistida e só mostra **Salvo** após confirmação da API.
- Sensação obrigatória; dor, fadiga e qualidade do sono de 0 a 10 e notas são opcionais.
- Um registro por sessão concluída, editável por seu atleta. Séries e histórico não são modificados.
- Falha de gravação preserva os campos para nova tentativa. Falha de leitura oferece retry.
- O histórico possui acesso ao resumo/avaliação.
- Endpoints: `GET`/`PUT /workout-sessions/:sessionId/feedback`.
- A tool `getRecentTrainingFeedback` lê as últimas dez avaliações somente após consentimento de histórico; não recebe userId do modelo. São relatos subjetivos, não diagnóstico. Resultados antigos das tools de histórico são redigidos antes de reenviar mensagens quando o consentimento foi revogado.

## Consumo de IA

- `/admin/ai-usage` e `GET /admin/ai-usage` são exclusivos de administradores.
- Filtros de 7/30/90 dias e usuário, totais, evolução diária UTC, agregação por funcionalidade/modelo, top 20 usuários e últimas 30 chamadas.
- Cobertura: chat geral, chat de sessão, geração de plano, geração de prescrição e análise de evolução do aluno.
- Cada etapa do chat registra uma chamada ao modelo. Não confundir chamadas com mensagens.
- São registrados tokens de entrada, saída, raciocínio e cache informados pelo SDK. Raciocínio já integra a saída; cache já integra a entrada.
- Uma chamada sem contagem reportada permanece com tokens/custo nulos. Falhas são registradas sem inventar consumo zero. Falhas de telemetria são logadas e não descartam uma geração bem-sucedida.
- Não são armazenados prompts, documentos ou respostas nesse registro operacional.
- Tarifas padrão do Gemini 2.5 Flash, verificadas em 27/10/2026: USD 0,30 por milhão de tokens de entrada, USD 2,50 de saída e USD 0,03 de cache. Entrada com áudio usa USD 1,00 e cache USD 0,10; toda a entrada mista recebe essa tarifa de maneira conservadora.
- Preço e versão são preservados por evento. Estimativas não consideram franquia gratuita, impostos, câmbio, descontos ou tentativas internas sem uso reportado; não substituem a fatura do provedor.
- Não há histórico de tokens anterior à implantação nem cobrança de usuários. Os limites técnicos de proteção existentes continuam independentes desta medição.

Fonte de preços: [Google AI — Gemini API pricing](https://ai.google.dev/gemini-api/docs/pricing#gemini-2.5-flash).

## Publicação

Aplicar a migração `20261027200000_session_feedback_and_ai_usage` antes de disponibilizar a API e o frontend atualizados. OpenAPI e Orval acompanham os endpoints. Os testes de persistência usam somente `TEST_DATABASE_URL`.
