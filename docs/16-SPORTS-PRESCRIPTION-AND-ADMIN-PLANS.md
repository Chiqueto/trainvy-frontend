# Perfil esportivo, prescrição avançada e planos comerciais

Implementação incremental de 27/10/2026. Mantém Next.js, Fastify, Zod/OpenAPI/Orval e os fluxos de treino existentes.

## Perfil esportivo

Em `/profile`, a seção opcional permite informar objetivos, experiência (iniciante/intermediário/avançado), equipamentos disponíveis e restrições declaradas. `GET`/`PATCH /me/sports-profile` usam exclusivamente o usuário autenticado, sem aceitar ownership pelo body. Alterar esse perfil não cria pesagens nem altera métricas corporais.

Percentual de gordura é opcional no formulário, no contrato de `/me`, no onboarding e na tool de IA. Ausente no primeiro cadastro é `null`; não é convertido em zero. Em atualizações de `/me`, omitir o campo preserva o valor anterior, enquanto enviar `null` o limpa. Usuários com peso, altura e idade continuam com o cadastro corporal completo sem percentual de gordura.

A tool `getSportsProfile`, as gerações de plano/prescrição e o contexto do assistente de sessão recebem esses dados. Campos vazios significam informação não fornecida. Restrições são relatos do usuário, não diagnóstico médico.

## Prescrição avançada opcional

Nos construtores de plano, prescrição e modelo do personal, a seção recolhida **Prescrição avançada (opcional)** contém:

| Campo | Unidade / regra |
| --- | --- |
| `repsMin` / `repsMax` | Faixa inteira positiva; ambos preenchidos ou ambos vazios; mínimo ≤ máximo |
| `targetRir` | Inteiro de 0 a 10; zero é válido |
| `targetLoadInGrams` | Inteiro em gramas; a interface recebe kg; zero é válido |
| `tempo` | Texto opcional até 80 caracteres, por exemplo `3-1-1-0` |

O campo legado `reps` é preservado para manter a compatibilidade. Sem uma faixa, o fluxo de repetições fixas funciona como antes. A interface apresenta a faixa quando informada. A carga alvo usa a mesma convenção de carga adotada pelo atleta no exercício.

Os campos percorrem criação, edição, duplicação, periodização, geração estruturada por IA, modelos e prescrições do personal, atribuição e aceitação pelo atleta. Em sessões, são copiados para `plannedRepsMin`, `plannedRepsMax`, `plannedTargetRir`, `plannedTargetLoadInGrams` e `plannedTempo`.

Esses snapshots aparecem na sessão, no histórico e no contexto da IA. Alterar um plano não reescreve execuções anteriores. Sessões antigas permanecem com os campos novos nulos; nenhuma meta é inventada por backfill. Carga/RIR alvo não preenchem automaticamente carga/RIR executados, e séries continuam não concluídas até registro explícito. A faixa pode orientar as repetições inicialmente sugeridas nas séries de trabalho.

## Admin de planos

`/admin/plans` permite:

- criar plano com código único, nome, público, descrição, preço inicial de referência, status e permissões;
- escolher se um novo plano de personal deve aparecer no cadastro público; o padrão é privado;
- editar permissões e o limite de atletas, inclusive zero ou sem limite;
- consultar os preços dos planos existentes, sem oferecer reajuste nesta tela.

API: `POST /admin/plans` retorna 201; `PUT /admin/plans/:planId/entitlements` mantém o contrato existente. Operações são exclusivas de administrador, transacionais e auditadas (`PLAN_CREATED` / `PLAN_ENTITLEMENTS_UPDATED`). Código duplicado retorna 409. Criar um plano não cria assinaturas, não migra usuários e não realiza cobranças.

Novos planos de atleta ou internos ficam privados e podem ser atribuídos manualmente. O cadastro individual gratuito atual continua inalterado. Planos públicos de personal são descobertos pelo catálogo existente. Papéis ATHLETE/COACH/ADMIN continuam separados de planos e permissões.

As permissões são dados do plano, resolvidos no backend a cada verificação comercial. As validações já existentes (gestão de atletas, quotas, prescrição etc.) usam esses dados. Não foi introduzido bloqueio comercial global dos recursos individuais do beta. Chaves preparatórias, como biblioteca de fontes, não implementam o recurso apenas por serem marcadas. Limites comerciais de IA continuam separados da proteção técnica e da medição de tokens.

## Mudança de preço — apenas documentada para o módulo de pagamentos

O preço de catálogo e o preço contratado são conceitos separados. Uma assinatura existente mantém `priceInCentsSnapshot` e `currencySnapshot`; editar permissões ou criar outro plano não altera esses valores.

Quando houver cobrança oficial, um reajuste deve ser uma operação agendada e auditável, nunca uma simples substituição silenciosa do preço de todos os assinantes:

1. Registrar preço anterior, preço novo, moeda, assinaturas abrangidas e política de antecedência.
2. Avisar o personal com preço novo e momento de aplicação; registrar quando e por qual canal o aviso foi efetivamente entregue.
3. Preservar o preço antigo durante a antecedência contratada. Exemplo: **três cobranças adicionais pelo preço anterior; novo preço somente na quarta cobrança elegível após o aviso**.
4. Contar ciclos reais de cobrança por assinatura, com regras explícitas para falhas, estornos, pausas, trial, troca/cancelamento de plano e ausência de entrega do aviso. Não presumir que três meses de calendário equivalem a três cobranças.
5. Confirmar e aplicar a transição pelo backend, com webhooks idempotentes e trilha de auditoria. Permitir cancelar um reajuste agendado antes da aplicação.

A quantidade de cobranças de antecedência deverá ser configurável, com validação contratual antes do lançamento. Essa política é uma decisão de produto a implementar, não uma regra legal presumida. Não há agendamento, notificações externas, integração de cobrança ou reajuste automático nesta entrega.

## Publicação

Aplicar a migração aditiva `20261027210000_sports_profile_advanced_prescription_admin_plans` antes de disponibilizar a API e o frontend atualizados. Ela adiciona campos opcionais e um valor de auditoria; não reclassifica planos nem modifica prescrições ou métricas existentes. Contratos OpenAPI/Orval foram regenerados. Testes de integração usam somente o banco isolado configurado por `TEST_DATABASE_URL`.
