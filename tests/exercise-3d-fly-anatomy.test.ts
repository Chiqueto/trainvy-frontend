import { describe, expect, it } from "vitest";
import { getExerciseAnimation } from "../app/_components/exercise-3d/exercises";
import mask from "../app/_components/exercise-3d/fly-muscle-map.json";
import manifest from "../public/models/exercise-3d/model-manifest.json";

describe("flat dumbbell fly registration and anatomy", () => {
  it("only registers its canonical exercise", () => {
    expect(getExerciseAnimation("d555deb1-6eef-436d-8377-9427ac267697")).toBe(
      "flat-dumbbell-fly",
    );
    expect(
      getExerciseAnimation("d555deb1-6eef-436d-8377-9427ac267698"),
    ).toBeNull();
  });
  it("selects bilateral named source surfaces on the current asset", () => {
    expect(mask.baseAssetSha256).toBe(manifest.sha256);
    for (const name of [
      "Clavicular_head_of_pectoralis_major_muscle",
      "Sternocostal_head_of_pectoralis_major_muscle",
      "Clavicular_part_of_deltoid_muscle",
      "Long_head_of_biceps_brachii",
      "Short_head_of_biceps_brachii",
    ]) {
      for (const side of ["l", "r"])
        expect(
          mask.selections.some(
            (s) => s.name === name + side && s.indices.length > 0,
          ),
        ).toBe(true);
    }
  });
});
