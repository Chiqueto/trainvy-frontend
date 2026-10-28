import { z } from "zod";
import { birthDateSchema } from "@/app/_lib/birth-date";

const decimal = (value: string) => Number(value.trim().replace(",", "."));

export const onboardingSchema = z.object({
  weightKg: z
    .string()
    .transform(decimal)
    .pipe(
      z
        .number()
        .min(20, "Informe um peso entre 20 e 350 kg.")
        .max(350, "Informe um peso entre 20 e 350 kg."),
    ),
  heightCm: z
    .string()
    .transform(decimal)
    .pipe(
      z
        .number()
        .int("Informe a altura em centímetros inteiros.")
        .min(50, "Informe uma altura entre 50 e 250 cm.")
        .max(250, "Informe uma altura entre 50 e 250 cm."),
    ),
  birthDate: birthDateSchema,
  trainingGoals: z
    .string()
    .trim()
    .min(1, "Conte qual é seu objetivo de treino.")
    .max(1000, "Descreva seu objetivo em até 1000 caracteres."),
  bodyFatPercentage: z
    .string()
    .transform((value) => (value.trim() ? decimal(value) : null))
    .pipe(
      z
        .number()
        .int("Informe o percentual de gordura em número inteiro.")
        .min(0, "Informe um percentual entre 0 e 100%.")
        .max(100, "Informe um percentual entre 0 e 100%.")
        .nullable(),
    ),
});

export function getOnboardingError(error: z.ZodError) {
  const issue = error.issues[0];
  if (issue?.code !== "invalid_type")
    return issue?.message ?? "Revise os dados informados.";
  return "Preencha os campos com números válidos.";
}
