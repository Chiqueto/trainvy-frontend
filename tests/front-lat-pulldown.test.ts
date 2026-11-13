// @vitest-environment node
import { describe, expect, it } from "vitest";
import { getExerciseAnimation, EXERCISE_ANIMATIONS } from "../app/_components/exercise-3d/exercises";
import { getExercisePose } from "../app/_components/exercise-3d/kinematics";

describe("canonical front pulldown", () => {
  it("keeps identities and labels distinct while using the validated equivalent pronated movement", () => {
    expect(getExerciseAnimation("00000000-0000-4000-8000-000000000120")).toBe("front-lat-pulldown");
    expect(getExerciseAnimation(null,"Puxada Frontal")).toBe("front-lat-pulldown");
    expect(EXERCISE_ANIMATIONS["front-lat-pulldown"].name).toBe("Puxada Frontal");
    expect(EXERCISE_ANIMATIONS["front-lat-pulldown"].id).not.toBe(EXERCISE_ANIMATIONS["lat-pulldown"].id);
    for(const name of ["Puxada Frontal com Pegada Neutra","Puxada Frontal com Pegada Supinada","Puxada atrás da nuca"])expect(getExerciseAnimation(null,name)).toBeNull();
    for(const p of [0,.1,.3,.5,.7,1]){
      const a=getExercisePose("front-lat-pulldown",p),b=getExercisePose("lat-pulldown",p);
      expect(a).toEqual(b);
    }
  });
});
