export interface WorkoutActionError {
  error: string;
  title: string;
  code: string;
  action?: { label: string; href: string };
}

export function workoutActionError(
  status: number,
  code?: string,
  operation: "start" | "complete" = "start",
): WorkoutActionError {
  const profile = { label: "Revisar perfil", href: "/profile" };
  if (code === "HEALTH_CONSENT_REQUIRED") {
    return {
      code,
      title: "Autorize o uso dos dados de saúde",
      error:
        "Abra seu perfil e revise o consentimento de saúde para continuar.",
      action: profile,
    };
  }
  if (code === "LEGAL_ACCEPTANCE_REQUIRED") {
    return {
      code,
      title: "Os termos precisam da sua atenção",
      error:
        "Leia e aceite a versão atual dos termos de uso e da política de privacidade no perfil.",
      action: profile,
    };
  }
  if (status === 401) {
    return {
      code: "UNAUTHORIZED",
      title: "Sua sessão expirou",
      error: "Entre novamente na sua conta para continuar o treino.",
      action: { label: "Entrar novamente", href: "/auth" },
    };
  }
  if (status === 409 && operation === "start") {
    return {
      code: "CONFLICT",
      title: "Você já tem um treino em andamento",
      error: "Continue ou encerre o treino atual antes de iniciar outro.",
      action: { label: "Ver treino atual", href: "/" },
    };
  }
  if (code === "PENDING_WORKOUT_SETS") {
    return {
      code,
      title: "Ainda há séries pendentes",
      error:
        "Conclua ou remova as séries pendentes no registro do treino antes de finalizar.",
    };
  }
  if (
    (status === 422 && operation === "start") ||
    code === "WORKOUT_PLAN_NOT_ACTIVE"
  ) {
    return {
      code: code ?? "WORKOUT_PLAN_NOT_ACTIVE",
      title: "Revise o plano de treino",
      error:
        "O plano precisa estar ativo e aprovado para iniciar uma sessão. Confira seu planejamento.",
      action: { label: "Ver planejamento", href: "/planning" },
    };
  }
  if (status === 404) {
    return {
      code: "NOT_FOUND",
      title: "Treino não encontrado",
      error:
        "Este treino não está mais disponível. Abra seu planejamento e selecione um treino novamente.",
      action: { label: "Ver planejamento", href: "/planning" },
    };
  }
  if (status === 403) {
    return {
      code: code ?? "FORBIDDEN",
      title: "Não foi possível liberar esta ação",
      error:
        "Revise os dados e as autorizações do seu perfil antes de tentar novamente.",
      action: profile,
    };
  }
  if (status === 429) {
    return {
      code: "TOO_MANY_REQUESTS",
      title: "Aguarde um momento",
      error:
        "Recebemos muitas tentativas. Espere alguns instantes e tente novamente.",
    };
  }
  if (status === 0) {
    return {
      code: "NETWORK_ERROR",
      title: "Não conseguimos conectar",
      error:
        "Confira sua conexão e tente novamente. Se o problema continuar, tente em alguns instantes.",
    };
  }
  return {
    code: "INTERNAL_SERVER_ERROR",
    title:
      operation === "complete"
        ? "Não foi possível finalizar o treino"
        : "Não foi possível iniciar o treino",
    error:
      "O serviço está indisponível no momento. Tente novamente em alguns instantes.",
  };
}
