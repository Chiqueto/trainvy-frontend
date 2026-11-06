"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { approveAiWorkoutPlanAction as approveAiWorkoutPlan } from "@/app/_actions/legal";
import { Button } from "@/components/ui/button";
export function ApproveAiPlan({
  id,
  updatedAt,
}: {
  id: string;
  updatedAt: string;
}) {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  return (
    <form
      className="space-y-3 rounded-xl border p-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
          const result = await approveAiWorkoutPlan(id, {
            reviewed: true,
            expectedUpdatedAt: updatedAt,
          });
          if (result.status === 200) router.refresh();
          else setMessage(result.data.error);
        } catch {
          setMessage("Falha ao aprovar. Tente novamente.");
        } finally {
          setBusy(false);
        }
      }}
    >
      <label className="flex gap-2 text-sm">
        <input type="checkbox" required />
        Revisei exercícios, séries, repetições, cargas e segurança desta versão.
      </label>
      <Button disabled={busy}>Revisar e Aprovar Prescrição</Button>
      <p role="status" className="text-sm">
        {message}
      </p>
    </form>
  );
}
