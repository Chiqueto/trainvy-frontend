# Branches, worktrees e integração de exercícios em paralelo

Leia antes de editar arquivos de um exercício. O fluxo solicitado é **reservar UUID → criar branch/worktree → pesquisar e implementar → validar → integrar na main**. A implementação ocorre em paralelo; a integração é serializada. Esta organização reduz interferência entre chats, mas não elimina conflitos semânticos ou substitui revisão visual e testes.

## Escopo e autorização

Ao executar esta skill para produzir/revisar um exercício, criar a branch, fazer commits da tarefa e realizar o merge local na `main` após validação fazem parte do fluxo solicitado. Não peça confirmação novamente para esses passos. Uma instrução mais recente da sessão, como “só preparar”, “não commitar” ou “não fazer merge”, prevalece.

Push, publicação, alteração de branch protection e execução de migrations em produção exigem autorização correspondente na sessão. Merge local não implica push. Se o usuário já autorizou publicar, prossiga até o destino autorizado, respeitando proteções/CI existentes. Editar a skill por si só não executa exercícios, commits, merges ou deploys.

## Reserva e isolamento

1. Descubra as raízes reais dos dois repositórios e execute `git status --short`, `git worktree list --porcelain` e `git branch --show-current` em ambos. Registre HEAD/base. Não presuma que o backend fica em `../trainvy-api`: um worktree pode estar em outro lugar. Depois de criados, use sempre os caminhos explícitos do par de worktrees para código, Prisma, OpenAPI/Orval e testes.
2. Identifique a main local e, se houver remoto acessível, faça fetch de `origin/main`. Preserve commits locais: não use reset para igualar branches. Escolha uma base que inclua main e a main remota conhecida, sem descartar trabalho. Se forem divergentes, resolva essa divergência na integração, preservando ambos os históricos. Se faltar remoto/rede, pode produzir a partir da main local e deve informar a limitação de sincronização ao finalizar.
3. Gere um token exclusivo de proprietário por chat (por exemplo um UUID) e uma identificação de tarefa `exercise-3d/<slug>-<uuid>-<sufixo-do-chat>`. Use essa branch nos repositórios alterados. O UUID continua sendo a identidade do exercício; o sufixo evita colisão de nomes de branch.
4. Reserve o UUID **antes de começar** usando `scripts/workflow-lock.mjs` desta skill. Todos os chats usam o mesmo repositório frontend como âncora, inclusive quando alteram a API. O script resolve `--git-common-dir`, compartilhado pelos worktrees, e cria o lock com abertura exclusiva:

   ```powershell
   node <skill>/scripts/workflow-lock.mjs acquire <frontend-repo> exercise-<uuid> <owner-token>
   ```

   Exit code 0 significa adquirido; 2 significa ocupado; 1 significa erro. Verifique o código de saída. Nunca prossiga depois de falha. Não use `git rev-parse --git-dir` como âncora de coordenação: ele é diferente em cada worktree.
5. Para “próximo pendente”, consulte a fila atual na base, pule UUIDs reservados e tente adquirir o próximo. Aquisição exclusiva resolve a disputa entre dois chats que leram a mesma fila. Depois de reservar, releia a cobertura na base atualizada: se outro chat já concluiu o exercício, libere a reserva e escolha outro. Para um UUID explicitamente solicitado que esteja ocupado, informe a tarefa em andamento; não produza uma segunda implementação concorrente nem escolha outro exercício sem contexto que autorize isso.
6. Crie um worktree **novo**, dentro de uma pasta de tarefas permitida e ignorada pelo Git, como `<repo>/.tmp/exercise-worktrees/<task-id>/frontend` e o equivalente da API. Use caminhos completos, sem sobrescrever diretórios existentes. Exemplo (variáveis já resolvidas, sem colchetes literais):

   ```powershell
   git -C $frontendRepo worktree add -b $taskBranch $frontendTask $frontendBase
   git -C $apiRepo worktree add -b $taskBranch $apiTask $apiBase
   ```

   Só crie o worktree da API se necessário; se ela se tornar necessária depois, crie-o antes de editá-la. Não execute `checkout`/`switch` na pasta compartilhada do usuário. Não copie alterações não commitadas para a tarefa, não faça stash de arquivos alheios e não use `git add .`/`git add -A` indiscriminadamente. Se uma dependência necessária só existe em alterações não commitadas, implemente o que for independente e reporte a dependência; não a inclua silenciosamente.
7. Instale dependências e prepare configurações locais somente nos worktrees da tarefa. `.env` e credenciais nunca entram em commits/logs; use apenas configuração autorizada, com teste de banco isolado. Não compartilhe `node_modules`, `.next`, saídas geradas ou porta de servidor entre tarefas. Use portas próprias. Testes que alteram banco também precisam de isolamento; worktrees não isolam um `TEST_DATABASE_URL` comum. Se só houver um banco de testes disponível, serialize esses testes com o lock `integration`, sem executar migrations de outra tarefa ou produção.

## Implementação e preparação

- Faça pesquisa, revisão anatômica, modelo e conferência visual conforme o SKILL.md, um UUID por unidade. Arquivos de equipamento/máscara e documentação por UUID ajudam a reduzir conflitos. Infraestrutura compartilhada pode mudar quando necessário, preservando os exercícios já integrados.
- Use nomes únicos de migrations por tarefa; nunca renomeie/regrave migrations já aplicadas para resolver colisões. Regere o OpenAPI e o Orval da **API da tarefa**, apontando a saída ao frontend da tarefa: scripts antigos podem escrever na pasta irmã original.
- Registre o par de branches, bases, UUID, worktrees, fontes e verificações no documento da revisão. Stage apenas os caminhos revisados da tarefa. Revise `git diff --cached` e faça commits próprios em cada repositório alterado. Não comite segredos, caches ou modificações de outro chat.
- Antes de integrar: testes pertinentes, TypeScript, build local sem efeitos em produção, conferência visual desktop/celular e critério de conclusão anatômica. Um comando com exit code diferente de zero impede a integração até ser corrigido. Não trate sucesso do último comando de uma sequência como sucesso de todos.

## Integração serializada na main

1. Adquira `integration` usando o **mesmo frontend âncora**, com o token do chat. Esse único lock protege a integração do par frontend/API e os testes que usam banco compartilhado. Se ocupado, continue trabalho independente ou aguarde em intervalos curtos; não toque na main enquanto outro chat integra.
2. Dentro do lock, releia HEADs, worktrees e estado das mains; refaça fetch se disponível. Descubra onde cada `main` está checkoutada. Uma main já checkoutada não pode ser aberta em outro worktree. Se não estiver checkoutada, crie um worktree de integração dedicado para ela. Nunca mova `refs/heads/main` por `update-ref` por trás de uma pasta checkoutada.
3. Se a pasta da main tiver alterações não commitadas ou merge/rebase em andamento, preserve tudo e não faça merge nela. Se a reserva da main mudar durante a tarefa, descubra de novo. Deixe os commits prontos na branch e informe a pendência concreta; não peça que o usuário confirme de novo um merge já autorizado. O lock coordena chats que seguem esta skill, não bloqueia edições manuais do usuário.
4. Atualize **a branch da tarefa** incorporando as mudanças recentes da main local e da `origin/main` conhecida (merge é adequado; não reescreva branch publicada/compartilhada). Resolva conflitos preservando os exercícios dos outros chats. Não escolha `ours`/`theirs` em bloco para arquivos de registro, cinemática, materiais, laboratório ou schema. OpenAPI/Orval devem ser regenerados a partir do contrato combinado, preservando o restante.
5. Valide o resultado combinado: testes de todos os exercícios afetados, typecheck/build aplicáveis e revisão visual quando conflitos mudarem cinemática, máscara ou equipamento. Se frontend/API mudarem juntos, confira o contrato combinado e a ordem das migrations. Após correções, faça os commits e registre os SHAs efetivamente validados. Releia a main e confirme que ela ainda é ancestral desses commits; se tiver avançado, incorpore o novo estado e refaça as verificações afetadas.
6. Integre via `git -C <main-worktree> merge --ff-only <task-branch>` somente o commit combinado já validado. Esse avanço preserva os commits/merges da tarefa. Prepare ambos os repositórios antes de avançar qualquer main. Se houver alteração na API, integre API e depois frontend; os dois Git não oferecem transação atômica. Em falha parcial, informe quais SHAs entraram, preserve as branches e conclua a parte restante após resolver a causa. Não dê reset em uma main já integrada.
7. Se push estiver autorizado, respeite branch protection e o fluxo de PR/CI quando exigidos. Use push comum, nunca force push na main. Se o remoto avançar e rejeitar o push, faça fetch, incorpore as novas mudanças, valide e tente novamente; limite a três ciclos por integração. Depois disso, preserve as branches/commits e informe a disputa em andamento. Não declare publicado só porque o merge local terminou. A publicação da API/frontend e migrations pode ser assíncrona; não prometa atomicidade de deploy.
8. Libere o lock `integration` em `finally`, inclusive quando verificações falharem. Não mantenha o lock ao encerrar um turno esperando informação externa. Se for continuar trabalho na branch após falha, mantenha a reserva do UUID com metadados recuperáveis; ao encerrar/suspender a tarefa, libere-a depois de registrar branch/estado. Na retomada, reserve novamente e procure trabalho anterior antes de iniciar outro.

## Liberação e recuperação

```powershell
node <skill>/scripts/workflow-lock.mjs release <frontend-repo> integration <owner-token>
node <skill>/scripts/workflow-lock.mjs release <frontend-repo> exercise-<uuid> <owner-token>
```

Libere apenas locks adquiridos por esta tarefa, usando o mesmo token. Locks não expiram por tempo: uma animação pode demorar e outro chat pode continuar ativo. Não apague lock de outra tarefa automaticamente. Em sessão interrompida, inspecione proprietário, worktrees, branches e operação Git; só remova reserva abandonada após confirmar que o trabalho anterior terminou e que a retomada está autorizada. O PID do helper não identifica o chat ativo.

Ao concluir, informe exercício/UUID, branches e commits, checks, main local integrada ou pendência, e push/deploy realizado ou não. Preserve branches e worktrees com trabalho não integrado. Não faça limpeza recursiva automática nem exclua branch de outro chat. Worktrees limpos e já integrados podem ser removidos com `git worktree remove` quando apropriado, sem `--force`.
