import Link from "next/link";
import { redirect } from "next/navigation";
import { getMyArchivedPrescriptions } from "@/app/_lib/api/fetch-generated";
import { Streamdown } from "streamdown";

export default async function PrescriptionArchive() {
  const response = await getMyArchivedPrescriptions({ cache: "no-store" });
  if (response.status === 401) redirect("/auth");
  if (response.status !== 200)
    throw new Error("Não foi possível carregar o arquivo de prescrições.");
  return (
    <main className="mx-auto max-w-3xl space-y-5 p-5">
      <Link className="text-sm underline" href="/personal">
        Voltar à área profissional
      </Link>
      <h1 className="text-2xl font-semibold">Arquivo de prescrições</h1>
      <p className="text-sm text-muted-foreground">
        Prescrições aprovadas antes do encerramento do vínculo, preservadas para
        consulta em modo somente leitura. Exibição limitada às 100 mais
        recentes.
      </p>
      {response.data.length === 0 && <p>Nenhuma prescrição arquivada.</p>}
      {response.data.map((p) => (
        <details key={p.id} className="rounded-xl border p-4">
          <summary>
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
  );
}
