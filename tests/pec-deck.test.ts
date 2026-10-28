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

describe("forearm-pad pec deck", () => {
  it("recognizes only the supported variant, and removes it from the production queue", () => {
    const id = "b9859cd9-6ed6-4e63-8fd0-500e8cf8d553";
    expect(getExerciseAnimation(id)).toBe("pec-deck");
    for (const name of [
      "peck deck",
      "pec deck",
      "voador",
      "Crucifixo na Máquina — aliases: peck deck, pec deck, voador",
    ])
      expect(getExerciseAnimation(null, name)).toBe("pec-deck");
    for (const name of [
      "Peck deck inverso",
      "Crucifixo com halteres",
      "Crucifixo no cabo",
    ])
      expect(getExerciseAnimation(null, name)).toBeNull();
    const fixture = (
      id: string,
      name: string,
      order: number,
    ): ListAdminExercises200Item => ({
      id,
      name,
      isUnilateral: false,
      family: null,
      updatedAt: "2026-10-28T00:00:00Z",
      groups: [],
      review: null,
      media: [],
      muscles: [],
      priority3d: {
        exerciseId: id,
        exerciseName: name,
        tier: 1,
        order,
        batch: "Peito",
        reason: "Teste",
      },
    });
    const queue = implementationQueue([
      fixture(id, "Crucifixo na Máquina", 9),
      fixture(
        "d555deb1-6eef-436d-8377-9427ac267697",
        "Crucifixo com Halteres",
        10,
      ),
    ]);
    expect(queue.has(id)).toBe(false);
    expect(queue.has("d555deb1-6eef-436d-8377-9427ac267697")).toBe(false);
  });

  it("maintains elbow flexion, bone lengths and seated supports through the entire repetition", () => {
    const closed = getExercisePose("pec-deck", 0),
      open = getExercisePose("pec-deck", 1);
    expect(closed.limbs[0].grip.distanceTo(closed.limbs[1].grip)).toBeLessThan(
      open.limbs[0].grip.distanceTo(open.limbs[1].grip),
    );
    for (let frame = 0; frame <= 200; frame++) {
      const pose = getExercisePose("pec-deck", frame / 200);
      expect(pose.tilt.angleTo(new Quaternion())).toBeLessThan(1e-6);
      expect(pose.origin.distanceTo(closed.origin)).toBe(0);
      expect(pose.limbs[0].grip.distanceTo(pose.limbs[1].grip)).toBeGreaterThan(
        0.15,
      );
      for (const [i, limb] of pose.limbs.entries()) {
        expect(limb.hip.distanceTo(closed.limbs[i].hip)).toBe(0);
        expect(limb.shoulder.distanceTo(closed.limbs[i].shoulder)).toBe(0);
        expect(limb.ankle.distanceTo(closed.limbs[i].ankle)).toBe(0);
        expect(limb.footRotation.angleTo(new Quaternion())).toBe(0);
        expect(limb.hip.distanceTo(limb.knee)).toBeCloseTo(0.44, 6);
        expect(limb.knee.distanceTo(limb.ankle)).toBeCloseTo(0.42, 6);
        expect(limb.shoulder.distanceTo(limb.elbow)).toBeCloseTo(ARM_LENGTH, 6);
        expect(limb.elbow.distanceTo(limb.wrist)).toBeCloseTo(
          FOREARM_LENGTH,
          6,
        );
        expect(
          limb.shoulder
            .clone()
            .sub(limb.elbow)
            .angleTo(limb.wrist.clone().sub(limb.elbow)),
        ).toBeCloseTo(Math.PI / 2, 6);
        expect(limb.elbow.z).toBeGreaterThan(limb.shoulder.z);
        expect(limb.wrist.y).toBeGreaterThan(limb.elbow.y);
      }
    }
  });

  it("preserves broad chest searches and returns reviewed regional terms only once", () => {
    const review: NonNullable<CachedExercise["anatomy"]> = {
      version: "test",
      reviewedAt: "2026-10-28T00:00:00Z",
      variant: "Peck deck",
      aliases: ["voador"],
      notes: "Ilustrativo",
      sources: [],
      instructions: { description: "", setup: "", execution: "", tips: "" },
      participants: [
        {
          id: "PECTORALIS_MAJOR",
          label: "Peitoral maior",
          role: "PRIMARY",
          muscleGroup: "CHEST",
          aliases: ["peitoral"],
          regions: [
            {
              id: "CLAVICULAR",
              label: "Porção clavicular",
              aliases: ["peitoral superior"],
            },
          ],
          emphasizedRegionIds: [],
          sourceIds: [],
        },
        {
          id: "DELTOID_ANTERIOR",
          label: "Deltoide anterior",
          role: "SECONDARY",
          muscleGroup: "SHOULDERS",
          aliases: [],
          regions: [],
          emphasizedRegionIds: [],
          sourceIds: [],
        },
      ],
    };
    const base: CachedExercise = {
      id: "press",
      name: "Supino",
      ownerUserId: null,
      isUnilateral: false,
      hasMedia: false,
      muscles: [{ id: "m", muscleGroup: "CHEST", role: "PRIMARY" }],
    };
    const reviewed: CachedExercise = {
      ...base,
      id: "fly",
      name: "Crucifixo na Máquina",
      anatomy: review,
    };
    for (const query of [
      "peitoral superior",
      "clavicular",
      "deltoide anterior",
      "voador",
    ])
      expect(
        filterExercisesInstant([base, reviewed], query).map((e) => e.id),
      ).toEqual(["fly"]);
    expect(filterExercisesInstant([base, reviewed], "peitoral")).toHaveLength(
      2,
    );
    expect(
      filterExercisesInstant([base, reviewed], "deltoide anterior", "BACK"),
    ).toHaveLength(0);
  });
});
