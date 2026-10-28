---
name: create-exercise-3d-model
description: >-
  Crie ou revise exercícios 3D do Trainvy com pesquisa biomecânica prévia e revisão
  do cadastro do mesmo exercício: músculos principais/secundários, regiões e ênfase
  ilustrativa coerentes com a execução. Trabalhe por UUID, um exercício por vez,
  preservando catálogo, busca e histórico, com branches/worktrees isolados e integração
  serializada na main. Aplique ao implementar ou corrigir modelos
  e animações de exercícios; editar esta skill não executa uma revisão de exercícios.
---

# Exercícios 3D e revisão do cadastro — Trainvy

Cada exercício é uma unidade de trabalho: **pesquisa → cadastro → modelo/legenda → validação**. Criar ou revisar seu 3D inclui conferir e, quando necessário, corrigir o cadastro correspondente. Trabalhar individualmente reduz o alcance de erros; não garante ausência de alucinação. Fontes, validação de schemas e comparação entre dados e imagem continuam necessárias.

## Identificar o movimento e o estado atual

- Leia o `AGENTS.md` e os documentos de contexto exigidos pelo projeto.
- Fixe o UUID canônico e a variação: equipamento, inclinação, pegada, apoio, amplitude e execução representada. Compare o cadastro da API com as instruções e o registro 3D existentes. Um nome genérico não autoriza presumir barra, halteres ou uma técnica específica.
- O padrão é revisar **um UUID por vez**. Se o pedido incluir vários exercícios, conclua cada unidade separadamente. Não classifique o catálogo inteiro nem os exercícios de uma família como efeito colateral.
- Leia [a integração com o catálogo](references/catalog-review.md) ao iniciar a unidade, antes de decidir onde persistir a revisão. O schema atual e o código consultado prevalecem sobre exemplos desta skill.

## Isolar a tarefa e integrar na main

Antes de alterar arquivos do exercício, siga [o fluxo de branches e worktrees](references/parallel-workflow.md): reserve o UUID, crie uma branch e um diretório isolados por chat, implemente e valide nesse worktree e integre na main com exclusão mútua. Branches diferentes na mesma pasta não isolam chats.

O fluxo padrão solicitado inclui commits da tarefa e merge local na main após as verificações, respeitando instruções mais recentes da sessão. Push/deploy continuam sujeitos à autorização correspondente. Use o helper [workflow-lock.mjs](scripts/workflow-lock.mjs) para coordenar reservas e integração entre worktrees. Editar esta skill não inicia esse fluxo nem integra alterações já presentes na pasta do usuário.

## Pesquisa antes de alterar o cadastro ou modelar

Antes de código cinemático, shaders, malhas ou correções anatômicas do cadastro, pesquise biomecânica, cinesiologia e EMG da **variação identificada**. Consulte fontes primárias e referências anatômicas, priorizando trabalhos pertinentes e recentes sem descartar fundamentos relevantes. Bibliotecas oficiais podem esclarecer a execução, mas não comprovam ativação muscular.

Registre junto à revisão do UUID, em documento versionado ou no mecanismo de revisão existente:

- Links/DOIs e data da consulta; variação, população, ângulos, amplitude e limitações estudadas.
- Execução adotada e justificativa dos ângulos articulares e do equipamento.
- Principais, sinergistas/estabilizadores relevantes, músculos específicos e eventual ênfase regional; decisão e fontes que a sustentam.
- O que foi observado diretamente nas fontes, o que é inferência anatômica/editorial e o que permanece incerto.

Não trate um ângulo, uma cadência ou um ranking de EMG como ideal universal. Não prometa redução de lesão/estresse articular ou hipertrofia a partir de EMG isolada. Exemplos anteriores, inclusive supino a 30°, exigem conferência para a variação em trabalho. Evite transferir conclusões entre barra, halteres, máquinas ou inclinações sem justificar a extrapolação.

Quando a evidência não sustentar uma subdivisão ou ênfase, mantenha a classificação mais ampla fundamentada e registre a limitação. Não invente músculo, região, referência ou precisão para completar campos. Se a própria identidade do exercício for ambígua, resolva-a antes de mudar o cadastro ou ilustrar uma técnica presumida.

## Atualizar o cadastro do mesmo UUID

Execute a revisão do cadastro como parte da implementação do 3D, não como uma anotação opcional para depois:

- Preserve os grupos amplos e seus vínculos. Detalhe **grupo → músculo → região anatômica**, somente quando a anatomia e as fontes permitirem. Região de ênfase e papel principal/secundário são informações distintas: menor ênfase de uma região não transforma automaticamente todo o músculo em secundário.
- Reutilize os identificadores anatômicos e sinônimos existentes. Se faltar um conceito necessário, implemente a extensão mínima compatível conforme a referência; não envie campos que o contrato não suporta.
- Atualize apenas o exercício em trabalho, suas associações e sua revisão. Preserve IDs, ownership, histórico, cargas, séries, mídia válida e decisões manuais de outros exercícios.
- Mantenha dados versionados e dados persistidos coerentes pelos mecanismos do projeto. Não edite uma migration já publicada. Nunca execute a reconciliação geral para corrigir um único UUID.
- Aplique mudanças somente no ambiente autorizado pela sessão. A autorização existente deve ser respeitada sem novas confirmações redundantes; usar a skill não concede autorização adicional para produção ou publicação. Informe se a revisão está no código, em testes ou aplicada no ambiente de destino.

## Busca e apresentação integradas

A precisão deve aparecer no fluxo normal. Buscar por um grupo ou sinônimo, como “peito”/“peitoral”, deve encontrar seus exercícios e as subdivisões relacionadas; uma busca específica deve considerar os músculos/regiões cadastrados. Não crie um botão obrigatório “Ver músculos detalhados”.

A legenda normal do exercício deve explicar os participantes e a ênfase sustentada pela revisão. Cadastro, busca, legenda, instruções e máscara anatômica precisam representar a mesma variação. Uma documentação local não equivale a cadastro persistido ou funcionalidade de busca implementada.

## Modelo, movimento e cores

- Em `app/_components/exercise-3d/exercises.ts`, associe o UUID à própria animação e mantenha `name`, `equipment` e `muscles.primary/secondary` coerentes com a revisão. Confirme os tipos atuais; não reutilize uma animação incompatível só por semelhança do nome.
- Em `kinematics.ts`, preserve comprimentos ósseos reais (`ARM_LENGTH`, `FOREARM_LENGTH`), apoios e trajetórias sem inversão articular. Use IK como `solveJoint` quando apropriado. Para movimentos controlados, represente excêntrica, transições e concêntrica plausíveis; para saltos, arremessos e LPO, pesquise e modele as fases específicas, sem impor a cadência de um supino.
- Em `exercise-scene.tsx`, confira equipamento, escala, encosto, apoios e alinhamento com a técnica adotada.
- No shader e na malha, mapeie explicitamente os músculos/regiões deste exercício. Reutilizar infraestrutura é permitido; herdar a classificação de outro movimento sem revisão não é.

Preserve as constantes do material anatômico atual:

| Destaque                                                          | Constante         | Cor       |
| ----------------------------------------------------------------- | ----------------- | --------- |
| Principal / região de ênfase fundamentada                         | `primaryTissue`   | `#bd5148` |
| Secundários e demais regiões participantes indicadas pela revisão | `secondaryTissue` | `#d97d75` |
| Anatomia sem destaque neste mapa                                  | `neutralTissue`   | `#b5b3ac` |

Os valores da máscara, como `1.0` ou `0.45`, são categorias gráficas, não percentuais de ativação. Um músculo neutro não deve ser descrito como totalmente inativo. Mantenha legenda discreta de **participação e ênfase ilustrativas, sem medição de EMG ou intensidade real**. Não oculte sinergistas relevantes para sugerir isolamento artificial.

Se a malha não separar a região necessária, ajuste a malha/máscara ou use um destaque mais amplo e honesto. Não pinte uma região vizinha como substituta. Em `exercise-execution-dialog.tsx` e nas instruções pertinentes, descreva a execução adotada em português e diferencie decisão ilustrativa de recomendação individual.

## Critérios de conclusão por exercício

- Fontes conferidas, técnica identificada e incertezas registradas para o UUID.
- Cadastro geral e detalhado revisados no contrato real, sem duplicar grupos nos relatórios ou inferir detalhes de exercícios ainda não revisados.
- Persistência/entrega identificada: mudança preparada, migração necessária ou aplicada; nenhum “cadastro atualizado” baseado apenas em texto da legenda.
- Busca por grupo/sinônimo e, quando disponível, por região encontra os resultados previstos; testes direcionados dos caminhos alterados passam.
- Legenda, instruções, máscaras, regiões e cores conferidas visualmente em mais de uma vista e nas fases relevantes do movimento.
- Sem clipping, inversões articulares, alteração de comprimento ósseo ou apoios instáveis; silhueta e shading preservados.
- Testes pertinentes passam, incluindo `tests/exercise-3d.test.ts` e `tests/exercise-3d-asset.test.ts` quando aplicáveis. Compare variantes próximas para detectar mapas copiados por engano; elas podem compartilhar participantes quando isso for fundamentado.
- Relate o UUID revisado, o que mudou no cadastro e no 3D, fontes e limites, verificações realizadas e eventual pendência concreta. Não marque a revisão integral como concluída se cadastro, contrato, busca ou representação necessários ainda estiverem pendentes.
