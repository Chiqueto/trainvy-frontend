import Link from "next/link";
import { redirect } from "next/navigation";
import { getMyArchivedPrescriptions } from "@/app/_lib/api/fetch-generated";
import { Streamdown } from "streamdown";
import { Archive, ArrowLeft } from "lucide-react";
import { BottomNav } from "@/app/_components/bottom-nav";

export default async function PrescriptionArchive() {
  const response = await getMyArchivedPrescriptions({ cache: "no-store" });
  if (response.status === 401) redirect("/auth");
  if (response.status !== 200)
    throw new Error("Não foi possível carregar o arquivo de prescrições.");
  return (
    <div className="personal-workspace min-h-svh bg-background pb-24 lg:pb-8">
      <main className="mx-auto w-full max-w-4xl space-y-5 p-5">
        <Link
          className="inline-flex min-h-10 items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
          href="/personal"
        >
          <ArrowLeft className="size-4" /> Voltar aos alunos
        </Link>
        <header className="space-y-3 rounded-3xl border border-border/70 bg-card p-5 sm:p-7">
          <span className="inline-flex items-center gap-2 text-xs font-semibold text-primary">
            <Archive className="size-4" /> Histórico profissional
          </span>
          <h1 className="font-heading text-2xl font-bold">
            Prescrições arquivadas
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Prescrições aprovadas antes do encerramento do vínculo, preservadas
            para consulta em modo somente leitura. Exibição limitada às 100 mais
            recentes.
          </p>
        </header>
        {response.data.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border p-8 text-center">
            <Archive className="mx-auto mb-3 size-8 text-muted-foreground" />
            <p className="text-sm font-semibold">
              Nenhuma prescrição arquivada
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              As fichas preservadas após o encerramento de um vínculo aparecem
              aqui.
            </p>
          </div>
        )}
        {response.data.map((p) => (
          <details
            key={p.id}
            className="rounded-2xl border border-border/70 bg-card p-5"
          >
            <summary className="cursor-pointer text-sm font-semibold">
              {p.name} · {new Date(p.approvedAt).toLocaleDateString("pt-BR")}
            </summary>
            <p className="my-3 text-xs">
              Prescrito por:{" "}
              {p.prescribedCrefSnapshot ?? "Identificação legada indisponível"}
            </p>
            {p.notes && <Streamdown>{p.notes}</Streamdown>}
            {p.payload.workoutDays.map((day, i) => (
              <section key={i} className="mt-4 space-y-2">
                <h2 className="font-semibold">
                  {day.name}
                  {day.isRest && " · Descanso"}
                </h2>
                {day.exercises.map((exercise, j) => (
                  <p className="text-sm" key={j}>
                    {exercise.name} · {exercise.sets} séries × {exercise.reps}{" "}
                    repetições · {exercise.restTimeInSeconds}s de descanso
                  </p>
                ))}
              </section>
            ))}
          </details>
        ))}
      </main>
      <BottomNav isCoach activePage="athletes" />
    </div>
  );
}
