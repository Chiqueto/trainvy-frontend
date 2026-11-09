# Central de notificações

O sininho no topo da home e o cartão “Central de notificações” no perfil abrem o mesmo hub. Ele funciona sem permissão de push, com paginação, contador de não lidas, leitura individual e leitura de todas as notificações. Abrir o hub não marca os avisos automaticamente; “Ver detalhes” marca o aviso antes de navegar.

O estado é persistido na tabela `notification`: `readAt = null` significa não lida; uma data significa lida. O schema e a migration existentes já contêm esse campo e seus índices; esta alteração não exige migration. A API autentica o usuário e restringe consultas e alterações ao dono. Repetir a leitura preserva o primeiro horário salvo.

O frontend usa os contratos Orval existentes através de Server Actions, sem cache. Atualiza a listagem ao abrir, ao voltar à janela e a cada minuto enquanto a página está visível. Há estados de erro e nova tentativa. Não é uma conexão em tempo real.

Aceitar um convite de treinador gera `COACH_LINKED`; enviar uma prescrição aprovada gera `WORKOUT_ASSIGNED`. O aviso é criado dentro da transação de domínio, respeitando as preferências da categoria; push só é enviado após o commit. Falha de push não remove o aviso nem reverte a operação. Lembretes de sequência também são elegíveis para usuários com plano ativo sem inscrição push.

Push depende das chaves VAPID da API e do frontend, permissão do navegador e inscrição do dispositivo. A ativação registra o service worker e limita a espera de inicialização a dez segundos. Falhas ao revogar a inscrição no servidor são apresentadas ao usuário. A entrega real em dispositivo precisa ser conferida no ambiente publicado com essas configurações.
