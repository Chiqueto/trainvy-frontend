import options from "@/app/_lib/muscle-detail-options.json";
import { getMuscleGroupLabel } from "@/app/_lib/muscle-labels";
import type { CreateExerciseBody } from "@/app/_lib/api/fetch-generated";

export function MuscleDetailsSummary({
  details,
}: {
  details?: CreateExerciseBody["muscleDetails"];
}) {
  if (!details?.some((d) => d.detailIds.length)) return null;
  return (
    <div className="space-y-1 text-xs text-muted-foreground">
      {details
        .filter((d) => d.detailIds.length)
        .map((d) => (
          <p key={d.muscleGroup}>
            <span className="font-medium">
              {getMuscleGroupLabel(d.muscleGroup)} ·{" "}
              {d.role === "PRIMARY" ? "Principal" : "Secundário"}:
            </span>{" "}
            {options[d.muscleGroup]
              .filter((o) => d.detailIds.includes(o.id))
              .map((o) => o.label)
              .join(", ")}
          </p>
        ))}
    </div>
  );
}
