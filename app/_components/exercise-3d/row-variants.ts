import type { ExerciseAnimation } from "./exercises";
import type { RowVariant } from "./bent-row-pose";
export const BARBELL_ROW_VARIANTS: Partial<
  Record<ExerciseAnimation, RowVariant>
> = {
  "bent-row": "pronated",
  "generic-bent-row": "pronated",
  "supinated-bent-row": "supinated",
  "high-bent-row": "high",
  "high-supinated-bent-row": "high-supinated",
  "yates-row": "yates",
  "supinated-yates-row": "yates-supinated",
  "pendlay-row": "pendlay",
};
export function isBarbellRow(exercise: ExerciseAnimation) {
  return BARBELL_ROW_VARIANTS[exercise] !== undefined;
}
