import { describe, expect, it } from "vitest";
import { Quaternion } from "three";
import { getExerciseAnimation } from "../app/_components/exercise-3d/exercises";
import {
  ARM_LENGTH,
  FOREARM_LENGTH,
  getExercisePose,
} from "../app/_components/exercise-3d/kinematics";
import {
  filterExercisesInstant,
  type CachedExercise,
} from "../app/_lib/exercise-catalog-cache";
import { implementationQueue } from "../app/admin/_lib/exercise-coverage";
import type { ListAdminExercises200Item } from "../app/_lib/api/fetch-generated";

describe("machine chest press (supino reto na máquina)", () => {
  it("recognizes only the supported variant, aliases, and removes it from the production queue", () => {
    const id = "f3e5e1cf-d232-4a80-87b3-9f35650a1b5e";
    expect(getExerciseAnimation(id)).toBe("machine-chest-press");

    for (const name of [
      "Supino Reto na Máquina",
      "supino reto maquina",
      "supino na máquina",
      "supino maquina",
      "supino sentado na maquina",
      "supino maquina sentado",
      "supino articulado",
      "machine chest press",
      "chest press machine",
    ]) {
      expect(getExerciseAnimation(null, name)).toBe("machine-chest-press");
    }

    for (const name of [
      "Supino Inclinado na Máquina",
      "Supino Declinado na Máquina",
      "Crucifixo no cabo",
    ]) {
      expect(getExerciseAnimation(null, name)).toBeNull();
    }

    const fixture = (
      exerciseId: string,
      exerciseName: string,
      order: number,
    ): ListAdminExercises200Item => ({
      id: exerciseId,
      name: exerciseName,
      isUnilateral: false,
      family: null,
      updatedAt: "2026-10-28T00:00:00Z",
      groups: [],
      review: null,
      media: [],
      muscles: [],
      priority3d: {
        exerciseId,
        exerciseName,
        tier: 1,
        order,
        batch: "Peito",
        reason: "Teste",
      },
    });

    const queue = implementationQueue([
      fixture(id, "Supino Reto na Máquina", 11),
      fixture(
        "00000000-0000-4000-8000-000000000114",
        "Elevação Pélvica",
        20,
      ),
    ]);
    expect(queue.has(id)).toBe(false);
    expect(queue.get("00000000-0000-4000-8000-000000000114")).toBe(1);
  });

  it("maintains stable seated posture, bone lengths, and frontal-plane elbow opening throughout repetition", () => {
    const extended = getExercisePose("machine-chest-press", 0);
    const stretched = getExercisePose("machine-chest-press", 1);

    // Hands are further forward at extended (p=0) than at stretched (p=1)
    expect(extended.limbs[0].grip.z).toBeGreaterThan(stretched.limbs[0].grip.z);
    // Slight convergence: grips closer together at extended position
    expect(
      extended.limbs[0].grip.distanceTo(extended.limbs[1].grip),
    ).toBeLessThan(stretched.limbs[0].grip.distanceTo(stretched.limbs[1].grip));

    for (let frame = 0; frame <= 200; frame++) {
      const pose = getExercisePose("machine-chest-press", frame / 200);

      // Spine tilt and origin remain stable and seated
      expect(pose.tilt.angleTo(extended.tilt)).toBeLessThan(1e-6);
      expect(pose.origin.distanceTo(extended.origin)).toBe(0);

      for (const [i, limb] of pose.limbs.entries()) {
        // Seated support points remain fixed
        expect(limb.hip.distanceTo(extended.limbs[i].hip)).toBe(0);
        expect(limb.shoulder.distanceTo(extended.limbs[i].shoulder)).toBe(0);
        expect(limb.ankle.distanceTo(extended.limbs[i].ankle)).toBe(0);
        expect(limb.footRotation.angleTo(new Quaternion())).toBe(0);

        // Lower body bone lengths
        expect(limb.hip.distanceTo(limb.knee)).toBeCloseTo(0.44, 6);
        expect(limb.knee.distanceTo(limb.ankle)).toBeCloseTo(0.42, 6);

        // Upper body anatomical bone lengths preserved by IK
        expect(limb.shoulder.distanceTo(limb.elbow)).toBeCloseTo(
          ARM_LENGTH,
          6,
        );
        expect(limb.elbow.distanceTo(limb.wrist)).toBeCloseTo(
          FOREARM_LENGTH,
          6,
        );

        // Illustrative elbow position stays below shoulder height.
        expect(limb.elbow.y).toBeLessThan(limb.shoulder.y);

        // Measure lateral opening in the frontal (XY) projection. A 3D angle
        // against torso-down also includes the forward reach of the press.
        const upperArm = limb.elbow.clone().sub(limb.shoulder);
        const flareDeg = Math.atan2(Math.abs(upperArm.x), -upperArm.y) * 180 / Math.PI;
        expect(flareDeg).toBeGreaterThan(18);
        expect(flareDeg).toBeLessThan(65);
      }
    }
  });

  it("integrates search and filters for machine chest press with broad and specific anatomical terms", () => {
    const review: NonNullable<CachedExercise["anatomy"]> = {
      version: "2026-10-28.1",
      reviewedAt: "2026-10-28T00:00:00Z",
      variant: "Supino na máquina sentado",
      aliases: ["machine chest press", "supino máquina"],
      notes: "Ilustrativo",
      sources: [],
      instructions: {
        description: "Empurrar horizontal na máquina",
        setup: "Ajuste o assento",
        execution: "Empurre à frente",
        tips: "Cotovelos a 45-60 graus",
      },
      participants: [
        {
          id: "PECTORALIS_MAJOR",
          label: "Peitoral maior",
          role: "PRIMARY",
          muscleGroup: "CHEST",
          aliases: ["peitoral"],
          regions: [
            {
              id: "PECTORALIS_MAJOR_STERNOCOSTAL",
              label: "Porção esternocostal",
              aliases: ["peitoral médio"],
            },
          ],
          emphasizedRegionIds: [],
          sourceIds: [],
        },
        {
          id: "TRICEPS_BRACHII",
          label: "Tríceps braquial",
          role: "SECONDARY",
          muscleGroup: "TRICEPS",
          aliases: ["tríceps"],
          regions: [],
          emphasizedRegionIds: [],
          sourceIds: [],
        },
        {
          id: "DELTOID_ANTERIOR",
          label: "Deltoide anterior",
          role: "SECONDARY",
          muscleGroup: "SHOULDERS",
          aliases: ["deltoide frontal"],
          regions: [],
          emphasizedRegionIds: [],
          sourceIds: [],
        },
      ],
    };

    const baseSquat: CachedExercise = {
      id: "squat",
      name: "Agachamento livre",
      ownerUserId: null,
      isUnilateral: false,
      hasMedia: false,
      muscles: [{ id: "m1", muscleGroup: "QUADRICEPS", role: "PRIMARY" }],
    };

    const machinePressExercise: CachedExercise = {
      id: "f3e5e1cf-d232-4a80-87b3-9f35650a1b5e",
      name: "Supino Reto na Máquina",
      ownerUserId: null,
      isUnilateral: false,
      hasMedia: false,
      muscles: [
        { id: "m2", muscleGroup: "CHEST", role: "PRIMARY" },
        { id: "m3", muscleGroup: "TRICEPS", role: "SECONDARY" },
        { id: "m4", muscleGroup: "SHOULDERS", role: "SECONDARY" },
      ],
      anatomy: review,
    };

    const catalog = [baseSquat, machinePressExercise];

    expect(
      filterExercisesInstant(catalog, "supino máquina").map((e) => e.id),
    ).toEqual(["f3e5e1cf-d232-4a80-87b3-9f35650a1b5e"]);

    expect(
      filterExercisesInstant(catalog, "peitoral").map((e) => e.id),
    ).toEqual(["f3e5e1cf-d232-4a80-87b3-9f35650a1b5e"]);

    expect(
      filterExercisesInstant(catalog, "tríceps").map((e) => e.id),
    ).toEqual(["f3e5e1cf-d232-4a80-87b3-9f35650a1b5e"]);

    expect(
      filterExercisesInstant(catalog, "deltoide frontal").map((e) => e.id),
    ).toEqual(["f3e5e1cf-d232-4a80-87b3-9f35650a1b5e"]);

    expect(filterExercisesInstant(catalog, "costas")).toHaveLength(0);
  });
});
