import Link from "next/link";
import { listAdminFeedback } from "@/app/_lib/api/fetch-generated";
import { readAdmin } from "@/app/admin/_lib/server";
import { AdminDashboardLayout } from "@/app/admin/_components/admin-dashboard-layout";
import { adminDate } from "@/app/admin/_lib/presentation";

const categories = ["BUG", "SUGGESTION", "QUESTION", "OTHER"] as const;
const labels = {
  BUG: "Problema",
  SUGGESTION: "Sugestão",
  QUESTION: "Dúvida",
  OTHER: "Outro",
};
export default async function FeedbackPage({
  searchParams,
}: {
  searchParams: Promise<{ cursor?: string; category?: string }>;
}) {
  const params = await searchParams;
  const category = categories.find((item) => item === params.category);
  const data = await readAdmin(
    listAdminFeedback(
      { category, cursor: params.cursor, limit: 20 },
      { cache: "no-store" },
    ),
  );
  return (
    <AdminDashboardLayout>
      <h1 className="font-heading text-2xl font-semibold">
        Feedbacks e suporte
      </h1>
      <p className="text-sm text-muted-foreground">
        Mensagens recebidas pelo app, das mais recentes às mais antigas. O
        contato abre seu aplicativo de e-mail; revise a resposta antes de
        enviar.
      </p>
      <form className="flex flex-wrap items-end gap-3" action="/admin/feedback">
        <label className="grid gap-2 text-sm">
          Categoria
          <select
            name="category"
            defaultValue={category ?? ""}
            className="rounded-lg border bg-background p-3"
          >
            <option value="">Todas</option>
            {categories.map((item) => (
              <option key={item} value={item}>
                {labels[item]}
              </option>
            ))}
          </select>
        </label>
        <button className="rounded-lg border px-4 py-3 text-sm" type="submit">
          Filtrar
        </button>
      </form>
      {data.items.length === 0 && (
        <p className="rounded-xl border p-5 text-sm">
          Nenhum feedback encontrado para esta consulta.
        </p>
      )}
      {data.items.map((item) => (
        <article
          key={item.id}
          className="space-y-3 rounded-2xl border bg-card p-5"
        >
          <div className="flex flex-wrap justify-between gap-2 text-xs text-muted-foreground">
            <span>
              {labels[item.category as keyof typeof labels] ?? item.category}
            </span>
            <time dateTime={item.createdAt}>{adminDate(item.createdAt)}</time>
          </div>
          <h2 className="font-semibold">{item.user.name}</h2>
          <p className="whitespace-pre-wrap break-words text-sm">
            {item.message}
          </p>
          <a
            className="inline-block text-sm underline"
            href={`mailto:${encodeURIComponent(item.user.email)}?subject=${encodeURIComponent("Resposta ao seu feedback no Trainvy")}`}
          >
            Responder por e-mail
          </a>
        </article>
      ))}
      {data.nextCursor && (
        <Link
          className="text-sm underline"
          href={{
            pathname: "/admin/feedback",
            query: {
              ...(category ? { category } : {}),
              cursor: data.nextCursor,
            },
          }}
        >
          Mensagens anteriores
        </Link>
      )}
    </AdminDashboardLayout>
  );
}
