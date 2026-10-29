"use client";
import { useState } from "react";
import Link from "next/link";
import { Search, ExternalLink, Copy } from "lucide-react";
import { CREF_REGIONS, officialCrefSource } from "./official-sources";
import { Button } from "@/components/ui/button";
export function ProfessionalCrefSearch({
  q = "",
  region = "",
}: {
  q?: string;
  region?: string;
}) {
  const [text, setText] = useState(q);
  const [uf, setUf] = useState(region);
  const [message, setMessage] = useState("");
  const source = officialCrefSource(uf);
  return (
    <section className="rounded-2xl border bg-card p-5 space-y-4">
      <div>
        <h2 className="font-heading text-lg font-semibold">
          Buscar e consultar CREF
        </h2>
        <p className="text-sm text-muted-foreground">
          Localize um cadastro para validar ou consulte um registro na fonte
          oficial.
        </p>
      </div>
      <form
        action="/admin/professionals"
        method="get"
        className="grid gap-3 sm:grid-cols-[1fr_110px_auto] sm:items-end"
      >
        <label className="grid gap-1 text-sm">
          CREF ou nome
          <input
            name="q"
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={180}
            placeholder="123456-G ou nome completo"
            className="rounded-lg border bg-background p-3"
          />
        </label>
        <label className="grid gap-1 text-sm">
          UF
          <select
            name="region"
            value={uf}
            onChange={(e) => setUf(e.target.value)}
            className="rounded-lg border bg-background p-3"
          >
            <option value="">Todas</option>
            {CREF_REGIONS.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <Button type="submit">
          <Search className="size-4" />
          Buscar cadastros
        </Button>
      </form>
      <div className="flex flex-wrap items-center gap-3">
        <a
          href={source.url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium"
        >
          <ExternalLink className="size-4" />
          {source.name}
        </a>
        <Button
          variant="outline"
          type="button"
          disabled={!text.trim()}
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(text.trim());
              setMessage("Pesquisa copiada. Cole no formulário oficial.");
            } catch {
              setMessage("Copie o CREF ou nome e cole na consulta oficial.");
            }
          }}
        >
          <Copy className="size-4" />
          Copiar pesquisa
        </Button>
        <Link className="text-sm underline" href="/admin/professionals">
          Limpar filtros
        </Link>
      </div>
      <p className="text-xs text-muted-foreground">
        A consulta oficial abre em outra aba. Confira o resultado e registre a
        validação no cadastro abaixo. O Trainvy não presume que o CREF está
        válido por ter sido informado ou encontrado na busca interna.
      </p>
      <p role="status" className="text-sm">
        {message}
      </p>
    </section>
  );
}
