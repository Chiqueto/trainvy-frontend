"use client";
import { useState, useTransition } from "react";
import type {
  CreateAdminPlanBody,
  ListAdminPlans200Item,
} from "@/app/_lib/api/fetch-generated";
import { createAdminPlanAction } from "../_actions";
import { adminError, parsePrice } from "../_lib/presentation";
import {
  PlanPermissionsFields,
  type PlanPermission,
} from "./plan-permissions-fields";
import { Button } from "@/components/ui/button";
export function CreatePlanForm({
  onCreated,
  onCancel,
}: {
  onCreated: (plan: ListAdminPlans200Item) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("0,00");
  const [audience, setAudience] =
    useState<CreateAdminPlanBody["audience"]>("COACH");
  const [isPublic, setPublic] = useState(false);
  const [active, setActive] = useState(true);
  const [permissions, setPermissions] = useState<PlanPermission[]>([]);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const inputClass =
    "min-h-11 rounded-xl border border-input bg-background p-3 text-sm";
  return (
    <form
      aria-label="Criar plano comercial"
      className="space-y-4 rounded-2xl border border-primary/30 bg-card p-5"
      onSubmit={(event) => {
        event.preventDefault();
        setError("");
        let monthlyPriceInCents: number;
        try {
          monthlyPriceInCents = parsePrice(price);
        } catch (e) {
          setError((e as Error).message);
          return;
        }
        startTransition(async () => {
          const result = await createAdminPlanAction({
            code: code.trim(),
            name: name.trim(),
            description: description.trim() || null,
            audience,
            monthlyPriceInCents,
            isPublic: audience === "COACH" && isPublic,
            isActive: active,
            entitlements: permissions,
          });
          if (!result.success) {
            setError(adminError(result.code));
            return;
          }
          onCreated(result.data);
        });
      }}
    >
      <h2 className="font-heading text-lg font-semibold">
        Novo plano comercial
      </h2>
      <fieldset
        disabled={pending}
        className="grid grid-cols-1 gap-4 sm:grid-cols-2"
      >
        <legend className="sr-only">Dados do novo plano</legend>
        <label className="flex flex-col gap-2 text-sm">
          Nome do plano
          <input
            required
            maxLength={120}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-2 text-sm">
          Código único
          <input
            required
            minLength={2}
            maxLength={80}
            pattern="[A-Z][A-Z0-9_]*"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="Ex.: COACH_ESSENCIAL"
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-2 text-sm">
          Público
          <select
            value={audience}
            onChange={(e) => {
              setAudience(e.target.value as typeof audience);
              setPublic(false);
            }}
            className={inputClass}
          >
            <option value="COACH">Personal / treinador</option>
            <option value="ATHLETE">Atleta</option>
            <option value="INTERNAL">Uso interno</option>
          </select>
        </label>
        <label className="flex flex-col gap-2 text-sm">
          Preço inicial de referência (R$)
          <input
            required
            inputMode="decimal"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-2 text-sm sm:col-span-2">
          Descrição
          <textarea
            value={description}
            maxLength={1000}
            rows={3}
            onChange={(e) => setDescription(e.target.value)}
            className={inputClass}
          />
        </label>
        <label className="flex min-h-11 items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
          />
          Plano ativo
        </label>
        {audience === "COACH" && (
          <label className="flex min-h-11 items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setPublic(e.target.checked)}
            />
            Exibir no cadastro de personal
          </label>
        )}
      </fieldset>
      {audience !== "COACH" && (
        <p className="text-xs text-muted-foreground">
          Novos planos de atleta e uso interno ficam privados e podem ser
          atribuídos manualmente no admin.
        </p>
      )}
      <PlanPermissionsFields
        value={permissions}
        onChange={setPermissions}
        disabled={pending}
      />
      <p className="text-xs text-muted-foreground">
        Criar este plano não realiza cobranças nem migra assinantes existentes.
        Mudanças futuras de preço terão uma política de aviso prévio no módulo
        de pagamentos.
      </p>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <div className="flex gap-3">
        <Button disabled={pending} className="min-h-11 flex-1 rounded-full">
          {pending ? "Criando..." : "Criar plano"}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={pending}
          onClick={onCancel}
          className="min-h-11 rounded-full"
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
}
