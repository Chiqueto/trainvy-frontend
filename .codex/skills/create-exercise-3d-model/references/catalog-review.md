# Integração da revisão individual com o catálogo

Consulte ao implementar ou corrigir um exercício 3D. Os caminhos abaixo são relativos à raiz de cada repositório; confirme o código atual antes de mudar contratos. Este guia descreve o fluxo desejado e distingue recursos existentes de extensões ainda necessárias.

## Localizar a fonte de verdade

Frontend (`trainvy-frontend`):

- `docs/EXERCISE-CATALOG-REVIEW.md`: critérios, referência da revisão ampla e publicação.
- `docs/EXERCISE-CATALOG-EXPANSION.md`: famílias, variações e ambiguidades de nomes.
- `app/_components/exercise-3d/exercises.ts`: UUIDs, equipamentos e legendas do registro 3D.
- `app/_components/exercise-3d/anatomy-material.ts` e arquivos de malha/cinemática: o que é realmente ilustrado.
- `app/_lib/muscle-labels.ts`, cache do catálogo e consumidores de busca: labels e integração da taxonomia.
- `app/admin/_components/exercises-catalog.tsx`: administração e apresentação dos grupos.

Backend (repositório irmão `trainvy-api`):

- `prisma/schema.prisma`: `Exercise`, `ExerciseMuscle`, `MuscleGroup` e papéis.
- `src/domain/exercise-catalog-review.json` e `.ts`: revisão versionada dos grupos amplos, notas, fontes e famílias por UUID.
- `src/schemas/admin-exercises.ts` e `src/usecases/UpdateAdminExerciseMuscles.ts`: contrato e edição individual autenticada, transacional e auditada.
- `src/usecases/ListAdminExercises.ts` e `GetExerciseCatalogVersion.ts`: leitura, comparação com a revisão e versão de cache.
- `src/domain/canonical-catalog.ts`, `muscle-taxonomy.ts` e `catalog-backfill.ts`: bootstrap e consumidores do mapeamento; preservar edições manuais.

## Limite do contrato atual

Na implementação consultada em 28/10/2026, `ExerciseMuscle` persiste **grupo amplo + PRIMARY/SECONDARY**. O endpoint `PUT /admin/exercises/:exerciseId/muscles` aceita `expectedUpdatedAt`, `primaryMuscleGroups` e `secondaryMuscleGroups`. Isso não constitui uma taxonomia persistida de músculos e regiões. Os textos livres em `ExerciseDefinition.muscles` do 3D também não criam essa taxonomia nem ampliam a busca automaticamente.

Portanto, verifique o schema antes da primeira revisão detalhada. Se ainda faltar suporte:

1. Implemente a estrutura mínima aditiva e validada para o exercício em trabalho, preservando os grupos atuais e os clientes existentes. Registre a revisão individual e a ligação estável entre grupo, músculo e região; não crie um enum para cada nome informal ou ângulo.
2. Mantenha UUID, variação adotada, participantes/papéis, ênfase regional quando sustentada, fontes, data/versão e limites do que foi revisado. Use identificadores anatômicos estáveis e relações de pertencimento; não transforme essa lista conceitual em campos arbitrários enviados ao banco.
3. Preserve `Route → Use Case → Prisma`, validação Zod/OpenAPI, ownership/admin e migrações compatíveis. Se o contrato HTTP mudar, regenere o Orval. Não grave JSON gerado por IA diretamente no banco nem esconda dados estruturados em uma legenda para simular persistência.
4. Mantenha a associação ampla como base dos filtros/relatórios existentes. Agregar filhos ao grupo pai deve deduplicar o exercício e suas séries; uma subdivisão não multiplica o volume ou transforma uma série em várias.
5. Integre os participantes/regiões à busca e à legenda normal do exercício. Sinônimos de grupo incluem seus descendentes; um resultado pode aparecer uma única vez mesmo com vários músculos relacionados. Não propague ênfase de um exercício a todos que compartilham o grupo.

Essa extensão é implementada uma vez e reutilizada nas revisões seguintes. Não preencha detalhes dos demais exercícios apenas para completar a nova estrutura. Falta de detalhe significa **ainda não revisado nesse nível**, não ausência de participação muscular. Se houver bloqueio real, registre a pendência e não alegue que o catálogo já ganhou os detalhes.

## Revisão e persistência de um UUID

1. Leia o cadastro e a revisão existentes do UUID. Confira os músculos, as fontes, o equipamento e `updatedAt`; salve os dados anteriores necessários para avaliar e reverter a mudança.
2. Prepare uma decisão pequena: atributos anteriores, novos atributos sustentados, notas de variação/ênfase, fontes e incertezas. Uma edição em `exercises.ts` sozinha não atualiza o catálogo da API.
3. Atualize a entrada versionada do exercício e seus conceitos anatômicos necessários, preservando as entradas dos demais UUIDs. Use versão/data por exercício quando houver esse suporte; uma versão global ou `review.matches` dos grupos amplos não comprova revisão anatômica detalhada de todos os cadastros.
4. Persista pelo use case/endpoint individual suportado ou prepare uma nova migration operacional restrita ao UUID, com validação de identidade e estado. Respeite o ambiente autorizado na sessão. Mudanças de contrato/dados que exigem publicação devem ser identificadas como tal.
5. No endpoint atual, envie o `expectedUpdatedAt` recém-lido. Em 409, releia e compare as mudanças; não repita uma substituição cega que apague a revisão de outro admin. Os novos contratos detalhados devem preservar essa proteção e a auditoria.
6. Invalide a versão do cache junto da alteração anatômica, inclusive quando apenas os detalhes mudarem. Releia o cadastro salvo e confira a equivalência com a versão de código, a busca, a legenda e a máscara 3D.

**Não execute** `catalog:review-muscles -- --apply` ou `ReconcileExerciseMuscles` para esse fluxo: esses mecanismos percorrem a revisão global. A mesma regra vale para reclassificações em massa durante startup ou seed. Uma correção individual deve preservar alterações manuais dos outros exercícios.

As migrations `20261028120000_exercise_catalog_muscle_groups` e `20261028121000_review_global_exercise_muscles` descrevem a entrega inicial. Quando publicadas, são imutáveis. Na implementação consultada, `tests/domain/exercise-catalog-review.spec.ts` compara a migration inicial com o manifesto inteiro. Ao evoluir uma entrada, preserve a validação da revisão inicial com um snapshot/fixture dessa versão e acrescente cobertura da nova migration/revisão individual; não reescreva a migration antiga para satisfazer o teste.

## Conferência entre anatomia e representação

Para o UUID em trabalho, confira:

- Participantes no cadastro versus labels no 3D, posição da máscara e técnica adotada.
- Grupo pai presente na busca simples e músculo/região presente na busca específica, sem resultado duplicado.
- Ênfase regional sustentada versus incerteza explícita. Mudança de ênfase não determina, por si, uma mudança de papel biomecânico.
- Regiões coenvolvidas e sinergistas visíveis segundo a decisão editorial; valores da máscara sem interpretação de porcentagem ou de EMG medido.
- Máscara realmente capaz de separar a região. Cores e labels precisam permanecer coerentes quando a vista, a pose ou o equipamento mudarem.
- Nenhum outro UUID ou exercício personalizado alterado. Código compartilhado pode evoluir para suportar o alvo, com regressões para os movimentos existentes.
- Testes de validação/persistência, conflitos, busca, deduplicação de agregados e visualizador conforme as partes modificadas.

Se houver comparação entre supinos reto/inclinado/declinado, pesquise a execução exata antes de escolher a ênfase. Não incorpore à skill uma regra permanente de ângulo ótimo, isolamento regional ou benefício clínico a partir desse exemplo.
