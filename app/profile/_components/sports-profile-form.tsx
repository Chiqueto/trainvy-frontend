"use client";
import { useState, useTransition } from "react";
import type { GetSportsProfile200 } from "@/app/_lib/api/fetch-generated";
import { saveSportsProfileAction } from "@/app/_actions/sports-profile";
import { Button } from "@/components/ui/button";
import { birthDateSchema, calendarToday } from "@/app/_lib/birth-date";
const experienceLabels = {
  BEGINNER: "Iniciante",
  INTERMEDIATE: "Intermediário",
  ADVANCED: "Avançado",
};
export function SportsProfileForm({
  initial,
}: {
  initial: GetSportsProfile200;
}) {
  const [goals, setGoals] = useState(initial.trainingGoals ?? "");
  const [birthDate, setBirthDate] = useState(initial.birthDate ?? "");
  const [persisted, setPersisted] = useState({
    birthDate: initial.birthDate ?? "",
    goals: initial.trainingGoals ?? "",
  });
  const [open, setOpen] = useState(false);
  const missing = [
    !persisted.birthDate && "data de nascimento",
    !persisted.goals.trim() && "objetivo de treino",
  ]
    .filter(Boolean)
    .join(" e ");
  const [experience, setExperience] = useState(initial.experienceLevel ?? "");
  const [equipment, setEquipment] = useState(
    initial.availableEquipment.join(", "),
  );
  const [restrictions, setRestrictions] = useState(
    initial.trainingRestrictions ?? "",
  );
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();
  const inputClass =
    "min-h-11 rounded-xl border border-input bg-background p-3 text-sm";
  function changed() {
    setSaved(false);
    setError("");
  }
  return (
    <section className="w-full rounded-2xl border border-border bg-card p-5 text-left">
      <h2 className="font-heading text-base font-semibold">Perfil esportivo</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Seus dados e preferências ajudam a personalizar os treinos.
      </p>
      {missing && (
        <aside
          aria-label="Cadastro incompleto"
          className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-3 text-sm"
        >
          <p>Complete seu perfil: falta informar {missing}.</p>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="mt-2 min-h-10 font-semibold text-primary hover:underline"
          >
            Completar cadastro
          </button>
        </aside>
      )}
      <details
        className="mt-4"
        open={open}
        onToggle={(event) => setOpen(event.currentTarget.open)}
      >
        <summary className="cursor-pointer py-2 text-sm font-semibold text-primary">
          Editar objetivos e preferências
        </summary>
        <form
          className="mt-3 space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            setError("");
            setSaved(false);
            if (birthDate) {
              const parsed = birthDateSchema.safeParse(birthDate);
              if (!parsed.success) {
                setError(parsed.error.issues[0].message);
                return;
              }
            }
            startTransition(async () => {
              const result = await saveSportsProfileAction({
                ...(birthDate ? { birthDate } : {}),
                trainingGoals: goals.trim() || null,
                experienceLevel: experience
                  ? (experience as GetSportsProfile200["experienceLevel"])
                  : null,
                availableEquipment: [
                  ...new Set(
                    equipment
                      .split(/[,\n]/)
                      .map((s) => s.trim())
                      .filter(Boolean),
                  ),
                ],
                trainingRestrictions: restrictions.trim() || null,
              });
              if (!result.success) {
                setError(result.error);
                return;
              }
              setSaved(true);
              setPersisted({
                birthDate: result.data.birthDate ?? birthDate,
                goals: result.data.trainingGoals ?? goals,
              });
            });
          }}
        >
          <fieldset disabled={pending} className="flex flex-col gap-4">
            <legend className="sr-only">Dados esportivos opcionais</legend>
            <label className="flex flex-col gap-2 text-sm">
              Data de nascimento
              <input
                type="date"
                value={birthDate}
                autoComplete="bday"
                max={calendarToday()}
                required={Boolean(persisted.birthDate)}
                onChange={(event) => {
                  setBirthDate(event.target.value);
                  changed();
                }}
                className={inputClass}
              />
            </label>
            <label className="flex flex-col gap-2 text-sm">
              Objetivos
              <textarea
                value={goals}
                maxLength={1000}
                rows={3}
                onChange={(e) => {
                  setGoals(e.target.value);
                  changed();
                }}
                placeholder="Ex.: ganhar força, melhorar o condicionamento"
                className={inputClass}
              />
            </label>
            <label className="flex flex-col gap-2 text-sm">
              Experiência
              <select
                value={experience}
                onChange={(e) => {
                  setExperience(e.target.value as typeof experience);
                  changed();
                }}
                className={inputClass}
              >
                <option value="">Não informado</option>
                {Object.entries(experienceLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-2 text-sm">
              Equipamentos disponíveis
              <textarea
                value={equipment}
                rows={2}
                maxLength={2400}
                onChange={(e) => {
                  setEquipment(e.target.value);
                  changed();
                }}
                placeholder="Ex.: halteres, barra, elásticos. Separe por vírgulas."
                className={inputClass}
              />
            </label>
            <label className="flex flex-col gap-2 text-sm">
              Restrições e cuidados declarados
              <textarea
                value={restrictions}
                rows={3}
                maxLength={2000}
                onChange={(e) => {
                  setRestrictions(e.target.value);
                  changed();
                }}
                placeholder="O que você quer que seja considerado ao planejar seus treinos?"
                className={inputClass}
              />
            </label>
          </fieldset>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          {saved && (
            <p role="status" className="text-sm text-emerald-500">
              Perfil esportivo salvo.
            </p>
          )}
          <Button disabled={pending} className="min-h-11 w-full rounded-full">
            {pending ? "Salvando..." : "Salvar perfil esportivo"}
          </Button>
        </form>
      </details>
    </section>
  );
}
