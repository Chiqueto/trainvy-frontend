export const MY_WORKOUT_PATH = "/meu-treino";

export function getAccountHomePath(accountType?: string | null) {
  return accountType === "COACH" ? "/personal" : "/";
}
