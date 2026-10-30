import { describe, expect, it } from "vitest";
import { Vector3 } from "three";
import { getExerciseAnimation } from "../app/_components/exercise-3d/exercises";
import {
  ARM_LENGTH,
  FOREARM_LENGTH,
  getExerciseDepth,
  getExercisePose,
  getDeclineLegSupports,
  DECLINE_ROLLER_RADIUS,
  SMITH_RAIL_Z,
} from "../app/_components/exercise-3d/kinematics";

describe("exercise 3D scope", () => {
  it("only enables canonical supported variants", () => {
    expect(getExerciseAnimation("00000000-0000-4000-8000-000000000101")).toBe(
      "bench-press",
    );
    expect(getExerciseAnimation("00000000-0000-4000-8000-000000000102")).toBe(
      "bench-press",
    );
    expect(getExerciseAnimation("00000000-0000-4000-8000-000000000105")).toBe(
      "squat",
    );
    expect(getExerciseAnimation("d3b3f492-65fa-4038-851f-6f46b69e9fb4")).toBe(
      "smith-squat",
    );
    expect(getExerciseAnimation("00000000-0000-4000-8000-000000000103")).toBe(
      "incline-dumbbell-press",
    );
    expect(getExerciseAnimation("6ef90b25-cd99-4860-8933-ae29e4d1f3d8")).toBe(
      "flat-dumbbell-press",
    );
    expect(getExerciseAnimation("00000000-0000-4000-8000-000000000104")).toBe(
      "incline-bench-press",
    );
    expect(getExerciseAnimation("eb910207-283c-414d-8d37-7c6b6d7de0d8")).toBe(
      "decline-bench-press",
    );
    expect(getExerciseAnimation("f5a99b5a-74d1-4622-880e-bcf24758dc31")).toBe(
      "smith-bench-press",
    );
    expect(getExerciseAnimation("f3e5e1cf-d232-4a80-87b3-9f35650a1b5e")).toBe(
      "machine-chest-press",
    );
    for (const id of [
      null,
      undefined,
      "custom-supino",
      "00000000-0000-4000-8000-000000000106",
      "00000000-0000-4000-8000-000000000112",
    ]) {
      expect(getExerciseAnimation(id)).toBeNull();
    }
  });
});

describe("incline press variants", () => {
  it("enables supported barbell and dumbbell variants while keeping Smith or declinado halteres unsupported", () => {
    for (const name of [
      "Supino Inclinado no Smith",
      "Supino Declinado com Halteres",
      "Supino Declinado no Smith",
    ])
      expect(getExerciseAnimation(undefined, name)).toBeNull();

    expect(
      getExerciseAnimation(undefined, "Supino Inclinado com Halteres"),
    ).toBe("incline-dumbbell-press");
    expect(getExerciseAnimation(undefined, "Supino Inclinado com Barra")).toBe(
      "incline-bench-press",
    );
    expect(getExerciseAnimation(undefined, "Supino Inclinado")).toBe(
      "incline-bench-press",
    );
    expect(getExerciseAnimation(undefined, "Supino Declinado com Barra")).toBe(
      "decline-bench-press",
    );
  });
  it("keeps the incline, supports and anatomical lengths while the dumbbells converge without colliding", () => {
    const initial = getExercisePose("incline-dumbbell-press", 0);
    const bottom = getExercisePose("incline-dumbbell-press", 1);
    for (let step = 0; step <= 200; step++) {
      const pose = getExercisePose("incline-dumbbell-press", step / 200);
      expect(pose.tilt.angleTo(initial.tilt)).toBeLessThan(0.000001);
      expect(pose.origin.distanceTo(initial.origin)).toBe(0);
      expect(pose.limbs[0].grip.distanceTo(pose.limbs[1].grip)).toBeGreaterThan(
        0.3,
      );
      for (let i = 0; i < 2; i++) {
        const limb = pose.limbs[i];
        expect(limb.hip.distanceTo(limb.knee)).toBeCloseTo(0.44, 5);
        expect(limb.knee.distanceTo(limb.ankle)).toBeCloseTo(0.42, 5);
        expect(limb.shoulder.distanceTo(limb.elbow)).toBeCloseTo(ARM_LENGTH, 5);
        expect(limb.elbow.distanceTo(limb.wrist)).toBeCloseTo(
          FOREARM_LENGTH,
          5,
        );
        expect(limb.ankle.distanceTo(initial.limbs[i].ankle)).toBe(0);
        expect(limb.shoulder.distanceTo(initial.limbs[i].shoulder)).toBe(0);
        expect(limb.grip.y).toBeGreaterThan(limb.elbow.y);
      }
    }
    expect(initial.limbs[0].grip.y).toBeGreaterThan(bottom.limbs[0].grip.y);
    expect(initial.limbs[1].grip.x).toBeLessThan(bottom.limbs[1].grip.x);
    expect(
      initial.tilt.angleTo(getExercisePose("bench-press", 0).tilt),
    ).toBeCloseTo(Math.PI / 6, 6);
  });
});

describe("flat dumbbell press", () => {
  it("enables canonical id and normalized names", () => {
    expect(getExerciseAnimation("6ef90b25-cd99-4860-8933-ae29e4d1f3d8")).toBe(
      "flat-dumbbell-press",
    );
    expect(getExerciseAnimation(undefined, "Supino Reto com Halteres")).toBe(
      "flat-dumbbell-press",
    );
    expect(getExerciseAnimation(undefined, "supino com halteres")).toBe(
      "flat-dumbbell-press",
    );
    expect(getExerciseAnimation(undefined, "supino com halter")).toBe(
      "flat-dumbbell-press",
    );
  });
  it("keeps flat bench orientation, converging dumbbell path, and preserved bone lengths", () => {
    const initial = getExercisePose("flat-dumbbell-press", 0);
    const bottom = getExercisePose("flat-dumbbell-press", 1);
    for (let step = 0; step <= 200; step++) {
      const pose = getExercisePose("flat-dumbbell-press", step / 200);
      expect(pose.tilt.angleTo(initial.tilt)).toBeLessThan(0.000001);
      expect(pose.origin.distanceTo(initial.origin)).toBe(0);
      expect(pose.limbs[0].grip.distanceTo(pose.limbs[1].grip)).toBeGreaterThan(
        0.28,
      );
      for (let i = 0; i < 2; i++) {
        const limb = pose.limbs[i];
        expect(limb.hip.distanceTo(limb.knee)).toBeCloseTo(0.44, 5);
        expect(limb.knee.distanceTo(limb.ankle)).toBeCloseTo(0.42, 5);
        expect(limb.shoulder.distanceTo(limb.elbow)).toBeCloseTo(ARM_LENGTH, 5);
        expect(limb.elbow.distanceTo(limb.wrist)).toBeCloseTo(
          FOREARM_LENGTH,
          5,
        );
        expect(limb.ankle.distanceTo(initial.limbs[i].ankle)).toBe(0);
        expect(limb.shoulder.distanceTo(initial.limbs[i].shoulder)).toBe(0);
        expect(limb.grip.y).toBeGreaterThan(limb.elbow.y);
      }
    }
    // Dumbbells are higher at lockout (initial) than bottom
    expect(initial.limbs[0].grip.y).toBeGreaterThan(bottom.limbs[0].grip.y);
    // Dumbbells are closer together at lockout (converging) than at bottom (stretched)
    expect(
      initial.limbs[0].grip.distanceTo(initial.limbs[1].grip),
    ).toBeLessThan(bottom.limbs[0].grip.distanceTo(bottom.limbs[1].grip));
    // Flat bench angle is parallel to barbell bench press
    expect(
      initial.tilt.angleTo(getExercisePose("bench-press", 0).tilt),
    ).toBeCloseTo(0, 6);
  });
});

describe("smith bench press", () => {
  it("enables canonical id and normalized variations", () => {
    expect(getExerciseAnimation("f5a99b5a-74d1-4622-880e-bcf24758dc31")).toBe(
      "smith-bench-press",
    );
    expect(getExerciseAnimation(undefined, "Supino Reto no Smith")).toBe(
      "smith-bench-press",
    );
    expect(getExerciseAnimation(undefined, "supino no smith")).toBe(
      "smith-bench-press",
    );
    expect(getExerciseAnimation(undefined, "supino smith")).toBe(
      "smith-bench-press",
    );
    expect(getExerciseAnimation(undefined, "supino reto smith")).toBe(
      "smith-bench-press",
    );
  });

  it("guides the bar along a strictly linear vertical path with preserved bone lengths and flat bench pose", () => {
    const initial = getExercisePose("smith-bench-press", 0);
    const bottom = getExercisePose("smith-bench-press", 1);

    for (let step = 0; step <= 200; step++) {
      const pose = getExercisePose("smith-bench-press", step / 200);

      // Trajetória perfeitamente linear vertical da barra nos trilhos do Smith: Z constante!
      expect(pose.bar.z).toBeCloseTo(-0.035, 6);
      expect(pose.bar.x).toBe(0);

      // Orientação plana e estável do banco
      expect(pose.tilt.angleTo(initial.tilt)).toBeLessThan(0.000001);
      expect(pose.origin.distanceTo(initial.origin)).toBe(0);

      // Preservação anatômica de segmentos ósseos
      for (let i = 0; i < 2; i++) {
        const limb = pose.limbs[i];
        expect(limb.hip.distanceTo(limb.knee)).toBeCloseTo(0.44, 5);
        expect(limb.knee.distanceTo(limb.ankle)).toBeCloseTo(0.42, 5);
        expect(limb.shoulder.distanceTo(limb.elbow)).toBeCloseTo(ARM_LENGTH, 5);
        expect(limb.elbow.distanceTo(limb.wrist)).toBeCloseTo(
          FOREARM_LENGTH,
          5,
        );
        expect(limb.ankle.distanceTo(initial.limbs[i].ankle)).toBe(0);
        expect(limb.shoulder.distanceTo(initial.limbs[i].shoulder)).toBe(0);

        // Mãos conectadas à barra
        expect(limb.grip.y).toBe(pose.bar.y);
        expect(limb.grip.z).toBe(pose.bar.z);
      }
    }

    // Posição no topo (lockout) é mais alta que no fundo (contato no peito)
    expect(initial.bar.y).toBeGreaterThan(bottom.bar.y);
    expect(initial.bar.y).toBeCloseTo(1.035, 5);
    expect(bottom.bar.y).toBeCloseTo(0.655, 5);

    // Alinhamento paralelo ao supino reto convencional
    expect(
      initial.tilt.angleTo(getExercisePose("bench-press", 0).tilt),
    ).toBeCloseTo(0, 6);
  });
});

describe.each([
  "squat",
  "smith-squat",
  "bench-press",
  "incline-bench-press",
  "decline-bench-press",
  "smith-bench-press",
] as const)("%s kinematics", (exercise) => {
  it("keeps limb lengths, feet planted and hands on the bar throughout a repetition", () => {
    const start = getExercisePose(exercise, 0);
    for (let step = 0; step <= 100; step++) {
      const pose = getExercisePose(exercise, step / 100);
      for (let i = 0; i < pose.limbs.length; i++) {
        const limb = pose.limbs[i];
        expect(limb.hip.distanceTo(limb.knee)).toBeCloseTo(0.44, 5);
        expect(limb.knee.distanceTo(limb.ankle)).toBeCloseTo(0.42, 5);
        expect(limb.shoulder.distanceTo(limb.elbow)).toBeCloseTo(ARM_LENGTH, 5);
        expect(limb.elbow.distanceTo(limb.wrist)).toBeCloseTo(
          FOREARM_LENGTH,
          5,
        );
        expect(limb.ankle.distanceTo(start.limbs[i].ankle)).toBe(0);
        expect(limb.grip.y).toBe(pose.bar.y);
        expect(limb.grip.z).toBe(pose.bar.z);
      }
    }
  });
});


describe("smith squat kinematics", () => {
  it("enables canonical id and normalized names", () => {
    expect(getExerciseAnimation("d3b3f492-65fa-4038-851f-6f46b69e9fb4")).toBe(
      "smith-squat",
    );
    expect(getExerciseAnimation(undefined, "Agachamento no Smith")).toBe(
      "smith-squat",
    );
    expect(getExerciseAnimation(undefined, "agachamento smith")).toBe(
      "smith-squat",
    );
    expect(getExerciseAnimation(undefined, "smith squat")).toBe(
      "smith-squat",
    );
    expect(getExerciseAnimation(undefined, "agachamento na maquina smith")).toBe(
      "smith-squat",
    );
  });

  it("strictly constrains bar to vertical linear guide rails with upright torso and preserved bone lengths", () => {
    const initial = getExercisePose("smith-squat", 0);
    const bottom = getExercisePose("smith-squat", 1);
    const freeSquat = getExercisePose("squat", 1);

    // Barbell descends purely vertically on the fixed guide rail (constant Z, X=0)
    expect(initial.bar.z).toBeCloseTo(SMITH_RAIL_Z, 6);
    expect(bottom.bar.z).toBeCloseTo(SMITH_RAIL_Z, 6);
    expect(initial.bar.x).toBeCloseTo(0, 6);
    expect(bottom.bar.x).toBeCloseTo(0, 6);
    expect(initial.bar.y).toBeGreaterThan(bottom.bar.y);

    for (let step = 0; step <= 100; step++) {
      const depth = step / 100;
      const pose = getExercisePose("smith-squat", depth);

      // Linear guide: bar Z remains fixed at SMITH_RAIL_Z across the entire rep
      expect(pose.bar.z).toBeCloseTo(SMITH_RAIL_Z, 5);
      expect(pose.bar.x).toBeCloseTo(0, 5);

      // Trapezius contact stays attached to the barbell
      for (let i = 0; i < 2; i++) {
        const limb = pose.limbs[i];
        expect(limb.hip.distanceTo(limb.knee)).toBeCloseTo(0.44, 5);
        expect(limb.knee.distanceTo(limb.ankle)).toBeCloseTo(0.42, 5);
        expect(limb.shoulder.distanceTo(limb.elbow)).toBeCloseTo(ARM_LENGTH, 5);
        expect(limb.elbow.distanceTo(limb.wrist)).toBeCloseTo(FOREARM_LENGTH, 5);
        expect(limb.ankle.y).toBeCloseTo(0.05, 5);
        expect(limb.ankle.distanceTo(initial.limbs[i].ankle)).toBe(0);
        expect(limb.grip.y).toBeCloseTo(pose.bar.y, 5);
        expect(limb.grip.z).toBeCloseTo(pose.bar.z, 5);
      }
    }

    // Biomechanical finding: Torso is more upright in Smith squat than free squat
    // (Abelbeck 2002; Schwanbeck 2009)
    expect(bottom.tilt.y).toBe(0);
    // Torso angle of smith squat is significantly more vertical than free squat forward lean
    expect(bottom.tilt.x).toBeLessThan(freeSquat.tilt.x);

    // Feet are placed slightly anterior to the bar path
    expect(initial.limbs[0].ankle.z).toBeGreaterThan(SMITH_RAIL_Z);
  });
});

describe("decline bench bar path", () => {
  it("lowers toward the lower chest with tucked elbows and stacked forearms", () => {
    const top = getExercisePose("decline-bench-press", 0);
    const bottom = getExercisePose("decline-bench-press", 1);
    const inverse = bottom.tilt.clone().invert();
    for (const limb of bottom.limbs) {
      const upper = limb.elbow.clone().sub(limb.shoulder).applyQuaternion(inverse);
      // Local +Y is headward: elbows must stay footward of the shoulders.
      expect(upper.y).toBeLessThan(-0.1);
      const abduction = Math.atan2(Math.abs(upper.x), -upper.y) * 180 / Math.PI;
      expect(abduction).toBeGreaterThan(45);
      expect(abduction).toBeLessThan(70);
      const forearm = limb.wrist.clone().sub(limb.elbow).normalize();
      expect(forearm.y).toBeGreaterThan(0.995);
      const chestOffset = bottom.bar.clone().sub(limb.shoulder).applyQuaternion(inverse);
      expect(chestOffset.y).toBeLessThan(-0.2);
      expect(chestOffset.y).toBeGreaterThan(-0.3);
    }
    expect(bottom.bar.z).toBeGreaterThan(top.bar.z);
    for (let step = 0; step <= 100; step++) {
      const pose = getExercisePose("decline-bench-press", step / 100);
      for (const limb of pose.limbs) {
        expect(pose.bar.z).toBeGreaterThan(limb.shoulder.z);
        expect(limb.elbow.clone().sub(limb.shoulder).applyQuaternion(inverse).y).toBeLessThan(0);
      }
    }
  });
});

describe("decline bench leg support", () => {
  it("bends knees above the hips with feet secured in a neutral ankle position throughout the press", () => {
    const start = getExercisePose("decline-bench-press", 0);
    for (const depth of [0, 0.25, 0.5, 0.75, 1]) {
      const pose = getExercisePose("decline-bench-press", depth);
      for (const [index, limb] of pose.limbs.entries()) {
        expect(limb.knee.y - limb.hip.y).toBeGreaterThan(0.2);
        expect(limb.knee.y - limb.ankle.y).toBeGreaterThan(0.2);
        expect(limb.knee.z).toBeGreaterThan(limb.hip.z);
        expect(limb.ankle.z).toBeGreaterThan(limb.knee.z);
        // A flexed knee, rather than the inverted V beneath the bench.
        const angle = limb.hip
          .clone()
          .sub(limb.knee)
          .angleTo(limb.ankle.clone().sub(limb.knee));
        expect(angle).toBeGreaterThan(Math.PI / 3);
        expect(angle).toBeLessThan((2 * Math.PI) / 3);
        expect(limb.knee.distanceTo(start.limbs[index].knee)).toBe(0);
        expect(limb.footRotation.angleTo(start.limbs[index].footRotation)).toBe(
          0,
        );
        const footUp = new Vector3(0, 1, 0).applyQuaternion(limb.footRotation);
        const shinUp = limb.knee.clone().sub(limb.ankle).normalize();
        expect(footUp.dot(shinUp)).toBeGreaterThan(0.999);
        const toeDirection = new Vector3(0, 0, 1).applyQuaternion(
          limb.footRotation,
        );
        expect(toeDirection.z).toBeGreaterThan(0.5);
        expect(toeDirection.y).toBeGreaterThan(0.2);
        expect(limb.hip.distanceTo(limb.knee)).toBeCloseTo(0.44, 6);
        expect(limb.knee.distanceTo(limb.ankle)).toBeCloseTo(0.42, 6);
      }
      expect(pose.limbs[0].knee.y).toBeCloseTo(pose.limbs[1].knee.y, 8);
      expect(pose.limbs[0].knee.x).toBeCloseTo(-pose.limbs[1].knee.x, 8);
    }
  });

  it("places the retaining roller over the instep and the upper roller behind the knees", () => {
    const { kneeRoller, ankleRoller } = getDeclineLegSupports();
    for (const limb of getExercisePose("decline-bench-press", 0).limbs) {
      const footUp = new Vector3(0, 1, 0).applyQuaternion(limb.footRotation);
      const footForward = new Vector3(0, 0, 1).applyQuaternion(
        limb.footRotation,
      );
      const rollerOffset = ankleRoller.clone().sub(limb.ankle);
      expect(rollerOffset.dot(footUp)).toBeGreaterThan(DECLINE_ROLLER_RADIUS);
      expect(rollerOffset.dot(footUp)).toBeLessThan(
        DECLINE_ROLLER_RADIUS + 0.05,
      );
      expect(rollerOffset.dot(footForward)).toBeGreaterThan(0);
      expect(rollerOffset.dot(footForward)).toBeLessThan(0.1);
      expect(kneeRoller.y + DECLINE_ROLLER_RADIUS).toBeLessThan(limb.knee.y);
      expect(Math.abs(kneeRoller.z - limb.knee.z)).toBeLessThan(0.05);
    }
  });
});

describe("rep timing", () => {
  it("holds briefly at lockout and the bottom, with a smooth slower descent", () => {
    expect(getExerciseDepth(0)).toBe(0);
    expect(getExerciseDepth(0.02)).toBe(0);
    expect(getExerciseDepth(0.48)).toBe(1);
    expect(getExerciseDepth(0.51)).toBe(1);
    expect(getExerciseDepth(0.99)).toBeGreaterThan(0);
    expect(getExerciseDepth(1)).toBe(0);

    const descent = Array.from({ length: 20 }, (_, i) =>
      getExerciseDepth(0.04 + (i / 19) * 0.44),
    );
    const ascent = Array.from({ length: 20 }, (_, i) =>
      getExerciseDepth(0.54 + (i / 19) * 0.46),
    );
    expect(
      descent.every((depth, i) => i === 0 || depth >= descent[i - 1]),
    ).toBe(true);
    expect(ascent.every((depth, i) => i === 0 || depth <= ascent[i - 1])).toBe(
      true,
    );
  });
});
