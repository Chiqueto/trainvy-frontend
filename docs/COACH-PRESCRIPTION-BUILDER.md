# Editor de prescrições do personal

Atualizado em 11/11/2026.

O editor mostra um treino por vez, com navegação pela divisão, contagem de exercícios e duração. Adicionar ou duplicar um dia abre esse treino; reordenar mantém o treino selecionado. Erros de validação abrem o primeiro treino que precisa de correção.

A biblioteca compartilhada permite buscar por nome ou músculo, filtrar por grupo muscular e alternar entre todos, catálogo global e exercícios próprios. A API continua limitando a listagem aos exercícios globais e aos do usuário autenticado. No editor do personal, a seleção em lote mantém a ordem das escolhas entre filtros, permite retirar itens antes de confirmar e exclui exercícios já presentes no dia.

Exercícios principais e alternativas são selecionados do catálogo, com nomes e IDs juntos. Não existe campo de texto livre para criar um exercício durante a prescrição. Rascunhos antigos sem IDs continuam visíveis, mas precisam ser vinculados ao catálogo antes de salvar pelo editor. Alternativas começam filtradas pelo grupo principal do exercício, sem tratar esse filtro como garantia de equivalência técnica. Principal e outra alternativa são excluídos das opções.

Cada exercício separa aquecimento, séries de trabalho, repetições e descanso, com resumo imediato. Carga, RIR, faixa de repetições e cadência ficam na prescrição avançada; alternativas ficam em uma seção expansível. A ação de aplicar a dose aos demais copia apenas séries de trabalho, repetições/faixa e descanso do mesmo dia, preservando cargas, aquecimento, RIR e cadência individuais.

A API já expunha os IDs no contrato Zod/OpenAPI. Os use cases de criação e edição agora os preservam e validam em consulta por IDs com escopo global ou do próprio personal. Nomes de referências explícitas vêm do catálogo; IDs indisponíveis são recusados. A normalização de alternativas mantém nome e ID juntos ao remover duplicações ou compactar a segunda opção. Payloads antigos sem IDs continuam suportados pela API para compatibilidade. Não há alteração de schema HTTP ou migration.

## Navegação profissional

A entrada autenticada em `/` e a conclusão do login de um personal existente abrem `/personal`, inclusive quando a conta ainda precisa de liberação profissional ou comercial. A landing pública e a home do atleta são preservadas. O treino próprio do personal tem um destino explícito em `/meu-treino`, usado pela navegação, boas-vindas, acesso com assinatura pendente e atalho de treino da PWA. Os dois destinos reutilizam o mesmo componente de home, sem duplicar a lógica de execução. Retornos explícitos e convites continuam tendo precedência na autenticação.

Criar e editar prescrições de um aluno mantém Alunos selecionado na navegação principal. O painel mostra alunos antes de cotas e convites, com o botão de convidar no cabeçalho. O arquivo de prescrições aparece como recurso secundário com contexto; o cadastro e o status do CREF ficam em um cartão no Perfil. As telas de arquivo e cadastro mantêm a navegação principal, com Alunos e Perfil selecionados respectivamente.

O envio mantém revisão e aprovação explícita, controle de versão e validação do vínculo Coach ↔ Atleta. Testes cobrem seleção, filtros, cancelamento de lote, IDs na criação/edição e recusa de IDs indisponíveis. A conferência visual local usa dados fictícios, sem persistência real.
