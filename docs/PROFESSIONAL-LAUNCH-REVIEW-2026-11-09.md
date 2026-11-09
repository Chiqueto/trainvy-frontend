# Prontidão para oferecer o Trainvy a profissionais

> Revisão histórica do diagnóstico inicial. Os ajustes posteriores autorizados foram implementados localmente; consulte [operação do piloto](PROFESSIONAL-PILOT-OPERATIONS.md) para a regra atual de CREF, cota compartilhada, suporte e release. Gateway permanece fora do escopo. Os resultados abaixo descrevem a avaliação anterior às correções.

Revisão de 09/11/2026. Escopo: código atual do frontend e da API, documentação operacional e testes locais. Nenhuma alteração de comportamento, cobrança, publicação ou migration foi realizada nesta revisão. Os testes integrados usaram a conexão isolada protegida por `TEST_DATABASE_URL`.

## Parecer

Há produto suficiente para preparar um piloto acompanhado com poucos profissionais: cadastro profissional, convites, vínculo com aluno, catálogo, exercícios personalizados, modelos reutilizáveis, prescrição manual e assistida por IA, aprovação explícita, aceite do aluno, execução por série, evolução, compartilhamento autorizado e notificações.

Eu não abriria aquisição comercial automática no estado observado. Primeiro fecharia as permissões e os limites da IA profissional, alinharia o controle de CREF e recuperaria a validação dos fluxos integrados. O piloto pode usar trials com prazo e atendimento direto; checkout automático não é pré-requisito para esse formato.

O funcionamento observado em testes locais não comprova configuração de produção, backup restaurável, contratos com fornecedores ou a jornada completa em celular real. As consultas públicas às URLs Vercel citadas na documentação não foram concluídas pelas ferramentas desta sessão; isso não demonstra indisponibilidade da aplicação.

## Evidência de testes

| Verificação executada | Resultado | Interpretação |
| --- | --- | --- |
| Frontend completo: `npx vitest run` | 700 passaram; 1 falhou; 84 arquivos | O único erro exige `trainvy-static-v2`, enquanto o service worker usa v3. Teste desatualizado; não demonstra defeito de cache. |
| API: 9 arquivos selecionados de testes unitários | 55 passaram | Cobrem política profissional/IA, custos, CPF, privacidade, documentos, consentimento de prescrição e notificações. Não representam a suíte completa da API. |
| API: `CoachAthleteFoundation.spec.ts` e `CoachPrescriptionConcurrency.spec.ts` | 4 passaram; 31 falharam; 35 testes | As falhas observadas ocorrem na autorização profissional. Fixtures antigas criam `status: VERIFIED`, sem cumprir a declaração/aceite atual. Os cenários posteriores de convite, envio e concorrência não ficam efetivamente validados. |
| TypeScript do frontend e da API | Sem erros de compilação observados | Não substitui testes em navegador ou com credenciais reais de profissionais. |

Não interpretar as 31 falhas como 31 defeitos distintos de produção. Atualizar fixtures para o fluxo vigente e executar novamente; só então classificar eventuais regressões remanescentes. Não remover as exigências de autorização para fazer os testes passarem.

## Antes de abrir o piloto

### 1. Aplicar permissões e cotas à IA profissional — prioridade alta

**Confirmado no código:** `GenerateCoachPrescriptionDraftWithAi` verifica `MANAGE_ATHLETES` e o vínculo, chama o provedor e salva o rascunho. Não verifica `AI_PLAN_GENERATION` nem usa `CheckAndConsumeAiQuota`. O fluxo de insights também chama o provedor sem consumir a cota do chat. `trackAiGeneration` registra consumo/custo, mas não autoriza nem limita a chamada.

O bootstrap diferencia `COACH` de `COACH_AI` pelos entitlements de IA. A autorização observada nesses endpoints não aplica essa diferença. Um plano profissional sem a permissão de geração pode alcançar a chamada de IA; bloquear apenas o botão no frontend não resolve.

**Consequência:** a separação comercial entre planos e a proteção de custo não são confiáveis nesses fluxos. Há ainda fallback de cota de chat para contas Coach, independentemente de entitlement específico, a revisar conforme a oferta escolhida.

**Fechamento:** definir explicitamente quais planos podem gerar fichas e insights; validar o entitlement na API antes do provedor; reservar cota; aplicar limite de rajadas e orçamento; retornar erro claro sem perder a instrução digitada. Testar plano sem IA, assinatura vencida, cota zero e chamadas simultâneas.

Fontes: [geração profissional](../../trainvy-api/src/usecases/GenerateCoachPrescriptionDraftWithAi.ts), [insights](../../trainvy-api/src/usecases/GetCoachAthleteProgressInsights.ts), [telemetria](../../trainvy-api/src/usecases/RecordAiUsage.ts), [cotas do chat](../../trainvy-api/src/usecases/CheckAndConsumeAiQuota.ts), [catálogo comercial inicial](../../trainvy-api/prisma/commercial-bootstrap.sql).

### 2. Alinhar o painel administrativo à política real de CREF — prioridade alta

**Confirmado:** o admin oferece “Exigir CREF verificado” e descreve modos obrigatório/teste. `hasProfessionalAccess` recebe `_verificationRequired`, mas não usa esse valor: aceita `DECLARED_ACTIVE` e `VERIFIED_ADMIN`, salvo os bloqueios de suspensão/rejeição. A declaração e o aceite foram uma decisão explícita posterior do produto; não devem ser tratados automaticamente como um bypass acidental.

**Problema:** o administrador pode acreditar que ativou conferência obrigatória quando o controle exibido não altera a decisão aplicada. A documentação histórica também mistura verificação oficial, declaração e modo de testes.

**Fechamento:** escolher e documentar a regra comercial vigente; ajustar/remover o switch incompatível ou implementar sua semântica deliberadamente. Preservar a distinção entre declaração do usuário e conferência administrativa; não anunciar validação oficial sem evidência.

Fontes: [regra efetiva](../../trainvy-api/src/domain/professional-verification.ts), [painel](../app/admin/professionals/policy-card.tsx), [contexto comercial](../../trainvy-api/src/usecases/GetCommercialContext.ts).

### 3. Recuperar os testes do fluxo completo — prioridade alta

**Confirmado:** os dois arquivos integrados executados falham na regra de acesso profissional. A revisão não encontrou configuração de Playwright/Cypress nem testes de navegador nos repositórios locais.

**Fechamento:** fixtures com declaração/aceite vigente; testes verdes de ownership, convite único, limite de alunos, revogação, envio, aceite, duplicidade e rollback. Depois executar a jornada com um profissional e dois alunos em Android, iPhone e desktop: cadastrar → liberar trial → declarar CREF → convidar → autorizar compartilhamento → prescrever → aprovar → aceitar → executar → acompanhar → revogar.

Atualizar também o teste do cache em [pwa.test.tsx](../tests/pwa.test.tsx), mantendo a validação de exclusão dos caches antigos e proteção dos dados privados.

### 4. Mostrar falhas reais no painel de alunos — prioridade alta

**Confirmado:** `/personal` transforma respostas não-200 de alunos/convites em listas vazias. Na falha dos alunos, a contagem vira zero e o limite vira `null`; o cartão interpreta `null` como ilimitado. Isso pode apresentar “nenhum aluno” e “ilimitado” durante uma falha da API. O detalhe do aluno já tem parte do tratamento explícito de erro.

**Fechamento:** exibir erro recuperável e nova tentativa; não apresentar capacidade fictícia nem guia de primeiro acesso quando a consulta falha. Tratar também a listagem de prescrições que hoje pode acabar vazia após falha.

Fontes: [painel](../app/personal/page.tsx), [capacidade](../app/personal/_components/personal-quota-card.tsx), [detalhe do aluno](../app/personal/alunos/[athleteId]/page.tsx).

### 5. Tornar entrada e suporte operáveis — prioridade média

**Confirmado:** escolher plano Coach deixa a assinatura pendente. Há trial, ativação, troca e cancelamento manuais com auditoria no admin. A tela bloqueada menciona suporte, mas só oferece voltar aos treinos; não há CTA direto de atendimento/solicitação de liberação nessa tela. O feedback do beta é persistido, mas não foi localizada uma fila administrativa para triagem/resposta.

**Fechamento para piloto:** contato direto visível, prazo de liberação informado, roteiro de ativação e responsável pelos chamados. Usar trial com data para evitar acesso indefinido acidental. Não é necessário construir um help desk completo para poucos participantes.

Fontes: [conta aguardando liberação](../app/personal/_components/coach-pending-subscription-card.tsx), [operação manual](../../trainvy-api/src/usecases/ManualSubscriptions.ts), [feedback](../../trainvy-api/src/routes/feedback.ts).

### 6. Verificar publicação, recuperação e alertas — prioridade alta operacional

**Confirmado:** a documentação de release exige separar migrations do build. O script atual usado por `build`/`vercel:build` executa migrations e seeds em produção antes de compilar TypeScript. Não foram encontrados diretórios `.github` com o pipeline descrito nos checkouts examinados. Isso não exclui automação externa à cópia local.

**Consequência:** uma compilação que falhe pode já ter alterado o banco. O procedimento descrito não basta como prova de que há bloqueio de release por testes.

**Fechamento:** adotar um procedimento único e reproduzível, validar compilação/testes antes da mudança de produção, controlar concorrência de migrations e registrar a versão publicada. Confirmar nos provedores backup, janela de retenção e restauração em ambiente separado. Há logs e medição de IA; não encontrei integração explícita de alertas de erros/indisponibilidade ou endpoint dedicado de prontidão do banco. Verificar o que já existe nos provedores antes de adicionar serviços.

Fontes: [script real de publicação](../../trainvy-api/src/scripts/vercel-build.ts), [procedimento documentado](12-RELEASE-AUTOMATION.md), [entrada da API](../../trainvy-api/src/index.ts).

## Antes de venda recorrente sem acompanhamento manual

### 7. Fechar cobrança e ciclo da assinatura

Não há checkout, webhook de pagamento, renovação ou reembolso automático nos fluxos examinados. A operação manual existente pode atender o piloto. A ativação manual grava `currentPeriodEnd: null`, portanto não oferece vencimento mensal automático.

Para oferta recorrente, definir preço, capacidade, recursos e limites de IA; implementar contratação, confirmação de pagamento idempotente, vencimento, falhas de cobrança, cancelamento, reembolso e conciliação. Cobrança externa/manual também exige responsável e procedimento claro; não deve ser apresentada como renovação automatizada.

### 8. Conferir evidências operacionais de privacidade e revisão técnica

Já existem documentos versionados, aceites, proteção de CPF, consentimento, exportação/exclusão e identificação profissional nas prescrições. Não partir do pressuposto de que esses recursos precisam ser refeitos.

A documentação do projeto registra pendências de contratos/mecanismos com fornecedores, revisão técnica humana das animações e formalização operacional. O estado atual desses itens no admin e nos provedores não foi inspecionado nesta sessão. Revisar com os responsáveis e registrar evidência real; um checklist no sistema não comprova a execução.

A [ANPD disponibiliza orientações de segurança e um checklist para agentes de pequeno porte](https://www.gov.br/anpd/pt-br/assuntos/noticias/anpd-publica-guia-de-seguranca-para-agentes-de-tratamento-de-pequeno-porte). Usar como referência operacional junto à avaliação jurídica aplicável, sem declarar conformidade automática.

Fonte interna: [implementação de governança e pendências](20-LEGAL-COMPLIANCE-IMPLEMENTATION.md).

## Melhorias de produto para priorizar com o piloto

1. **Respeitar a metodologia do profissional na IA.** O prompt de geração impõe duração de 50–75 minutos, 4–8 exercícios, aquecimento e uma lista fixa de exercícios como regras inegociáveis. Isso pode conflitar com instruções de sessões curtas ou métodos diferentes. Essas regras não são limites gerais do schema: são instruções impostas ao modelo. Separar as regras de segurança/estrutura das escolhas do treinador, usando catálogo e configurações reais.
2. **Rever a promessa de acompanhamento em tempo real.** O guia do personal anuncia essa experiência; as telas examinadas não estabelecem atualização contínua dos registros do aluno. Corrigir a descrição ou implementar atualização com frequência e comportamento definidos.
3. **Melhorar o workspace de desktop.** `/personal` mantém `max-w-lg` mesmo ao ativar uma grade lateral em `lg`. Validar visualmente com muitos alunos e modelos. Há oportunidade de aproveitar a tela para prescrição e comparação de evolução.
4. **Complementar avaliação inicial e relatórios conforme demanda real.** Há perfil esportivo, restrições e evolução. Ficha de anamnese própria, avaliações periódicas e relatórios compartilháveis podem ser úteis; não foram tratados como exigências universais para todo profissional começar o piloto. Um processo externo documentado pode atender o início.
5. **Medir o funil profissional.** Já há Analytics e medição de custo de IA. Ainda falta confirmar acompanhamento de cadastro concluído, conta liberada, primeiro convite, primeiro treino enviado/aceito e aluno que retorna. Esses eventos ajudam a distinguir dificuldade de entrada de falta de valor do produto.

Biblioteca/RAG, pagamentos dos alunos ao personal, chat próprio e ampliação geral do 3D podem ser decididos depois dos primeiros usos. Não bloqueiam um piloto focado em prescrição e acompanhamento.

## Ordem sugerida de execução

1. Permissões/cotas da IA e alinhamento do controle de CREF.
2. Fixtures/testes integrados, teste do cache e jornada completa em dispositivos reais.
3. Erros do painel, contato de suporte e liberação de trial com prazo.
4. Procedimento de publicação, restauração testada e alertas operacionais.
5. Piloto acompanhado com 3–5 profissionais e seus primeiros alunos; medir primeira prescrição aceita, sessões registradas e retorno semanal.
6. Ajustar a oferta com o aprendizado do piloto e fechar cobrança recorrente antes de aquisição automática.
