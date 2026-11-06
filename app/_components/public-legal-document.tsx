import Link from "next/link";
import { Streamdown } from "streamdown";
import { listLegalDocuments } from "@/app/_lib/api/fetch-generated";

export async function PublicLegalDocument({ slug }: { slug: string }) {
  const response = await listLegalDocuments({ cache: "no-store" });
  if (response.status !== 200)
    throw new Error("Não foi possível carregar os documentos legais.");
  const document = response.data.find((d) => d.slug === slug);
  return (
    <main className="mx-auto max-w-3xl space-y-5 px-5 py-8">
      <Link className="text-sm underline" href="/profile">
        Voltar ao perfil
      </Link>
      {document ? (
        <>
          <h1 className="text-2xl font-semibold">{document.title}</h1>
          <p className="text-xs text-muted-foreground">
            Versão {document.version} · Atualizado em{" "}
            {new Date(document.updatedAt).toLocaleDateString("pt-BR")}
          </p>
          <Streamdown>{document.contentMd}</Streamdown>
        </>
      ) : (
        <p>Documento ainda não publicado.</p>
      )}
    </main>
  );
}
