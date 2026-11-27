const PLANNING_ERROR_MESSAGES: Record<string, string> = {
  ACTIVE_WORKOUT_SESSION:
    "Finalize seu treino atual antes de alterar o planejamento.",
  PLAN_BELONGS_TO_PERIODIZATION:
    "Este plano pertence a uma periodização e deve ser gerenciado por ela.",
  PLAN_IS_ACTIVE_PERIODIZATION_BLOCK:
    "Este plano é a etapa atual de uma periodização ativa. Pause a periodização para alterá-lo.",
  ACTIVE_PERIODIZATION:
    "Existe uma periodização ativa. Pause-a antes de realizar esta ação.",
  PERIODIZATION_HAS_NO_PLANS:
    "Adicione pelo menos uma etapa antes de ativar a periodização.",
  PERIODIZATION_NOT_STARTED: "Esta periodização ainda não foi iniciada.",
  PERIODIZATION_NOT_ACTIVE: "Esta periodização não está ativa.",
  PERIODIZATION_COMPLETED: "Esta periodização já foi concluída.",
  NO_OPEN_BLOCK: "Não há uma etapa em andamento nesta periodização.",
  INCONSISTENT_PLANNING_STATE:
    "Não foi possível alterar o planejamento porque seu estado está inconsistente. Tente novamente ou entre em contato com o suporte.",
  PLAN_ALREADY_IN_PERIODIZATION: "Este plano já faz parte de uma periodização.",
  ACTIVE_PLAN_CANNOT_BE_ATTACHED:
    "Desative o plano antes de adicioná-lo a uma periodização.",
  ACTIVE_BLOCK_CANNOT_BE_REMOVED:
    "A etapa em andamento não pode ser removida da periodização.",
  COMPLETED_BLOCK_CANNOT_BE_REMOVED:
    "Uma etapa concluída não pode ser removida da periodização.",
  COMPLETED_BLOCK_IMMUTABLE:
    "Uma etapa concluída não pode ter sua estrutura alterada.",
  INVALID_REORDER_BLOCKS:
    "A nova ordem contém etapas inválidas. Atualize a página e tente novamente.",
  PERIODIZATION_ALREADY_STARTED:
    "Uma periodização já iniciada não pode ser excluída.",
  ATHLETE_PLAN_LIMIT_REACHED:
    "O plano Atleta Grátis permite 1 plano próprio. Assine o Atleta Pro para criar planos ilimitados.",
  ATHLETE_WORKOUT_DAY_LIMIT_REACHED:
    "O plano Atleta Grátis permite até 5 treinos por plano próprio. Assine o Atleta Pro para liberar treinos ilimitados.",
  PERIODIZATION_REQUIRES_PRO:
    "Periodizações fazem parte do plano Atleta Pro. Assine para organizar ciclos de treino.",
};

export function getPlanningErrorMessage(code?: string): string {
  if (code && PLANNING_ERROR_MESSAGES[code]) {
    return PLANNING_ERROR_MESSAGES[code];
  }

  return "Não foi possível concluir a ação. Tente novamente em instantes.";
}
