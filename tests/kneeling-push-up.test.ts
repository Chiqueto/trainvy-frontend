// @vitest-environment node
import { readFile } from "node:fs/promises";
import { beforeAll, describe, expect, it } from "vitest";
import { Bone, SkinnedMesh, Vector3 } from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "meshoptimizer";
import {
  ARM_LENGTH,
  FOREARM_LENGTH,
  createPoseDriver,
  getExercisePose,
} from "../app/_components/exercise-3d/kinematics";
import {
  EXERCISE_ANIMATIONS,
  getExerciseAnimation,
} from "../app/_components/exercise-3d/exercises";
import { createKneelingPushUpMuscleMask } from "../app/_components/exercise-3d/kneeling-push-up-muscles";
import { KNEELING_PUSH_UP_MAT_TOP } from "../app/_components/exercise-3d/kneeling-push-up-pose";
import { installScapularRig } from "../app/_components/exercise-3d/scapular-rig";
import { forearmDirectionError } from "./helpers/forearm-direction-error";

let mesh: SkinnedMesh;
let apply: ReturnType<typeof createPoseDriver>;

beforeAll(async () => {
  const bytes = await readFile(
    new URL(
      "../public/models/exercise-3d/trainvy-athlete.glb",
      import.meta.url,
    ),
  );
  const { scene } = await new GLTFLoader()
    .setMeshoptDecoder(MeshoptDecoder)
    .parseAsync(
      bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
      "",
    );
  const bones = new Map<string, Bone>();
  scene.traverse((object) => {
    if (object instanceof Bone) bones.set(object.name, object);
    if (object instanceof SkinnedMesh) mesh = object;
  });
  installScapularRig(mesh, bones);
  apply = createPoseDriver(bones);
});

describe("Kneeling Push-up (Flexão de Braços com Joelhos Apoiados)", () => {
  it("resolves canonical UUID and normalized names to kneeling-push-up", () => {
    expect(getExerciseAnimation("9a83be35-3b36-4f1a-8bd3-cfc7cb78f772")).toBe(
      "kneeling-push-up",
    );
    expect(
      getExerciseAnimation(undefined, "Flexão de Braços com Joelhos Apoiados"),
    ).toBe("kneeling-push-up");
    expect(getExerciseAnimation(undefined, "Flexão de joelhos")).toBe(
      "kneeling-push-up",
    );
  });

  it("maintains fixed knees/hands, real bone lengths, elbow flexion and plank alignment", () => {
    const top = getExercisePose("kneeling-push-up", 0);
    const bottom = getExercisePose("kneeling-push-up", 1);

    expect(top.origin.y).toBeGreaterThan(bottom.origin.y + 0.2);

    for (let step = 0; step <= 60; step++) {
      const pose = apply("kneeling-push-up", step / 60);
      for (const [index, limb] of pose.limbs.entries()) {
        expect(limb.hip.distanceTo(limb.knee)).toBeCloseTo(0.44, 5);
        expect(limb.knee.distanceTo(limb.ankle)).toBeCloseTo(0.42, 5);
        expect(limb.shoulder.distanceTo(limb.elbow)).toBeCloseTo(ARM_LENGTH, 5);
        expect(limb.elbow.distanceTo(limb.wrist)).toBeCloseTo(
          FOREARM_LENGTH,
          5,
        );
        // Knees and wrists stay planted throughout the repetition.
        expect(limb.knee.distanceTo(top.limbs[index].knee)).toBeLessThan(1e-9);
        expect(limb.wrist.distanceTo(top.limbs[index].wrist)).toBeLessThan(
          1e-9,
        );
        expect(limb.ankle.y).toBeGreaterThan(KNEELING_PUSH_UP_MAT_TOP + 0.1);
        expect(forearmDirectionError(mesh, index ? "R" : "L", limb)).toBeLessThan(
          1e-5,
        );
        // Elbows flare moderately backward and outward, never dipping below the mat.
        expect(limb.elbow.z).toBeLessThan(limb.wrist.z);
        expect(limb.elbow.y).toBeGreaterThan(KNEELING_PUSH_UP_MAT_TOP + 0.08);
      }

      // Knees, hips and shoulders stay aligned in a straight plank.
      const thighDir = pose.limbs[0].hip
        .clone()
        .sub(pose.limbs[0].knee)
        .normalize();
      const torsoDir = pose.limbs[0].shoulder
        .clone()
        .sub(pose.limbs[0].hip)
        .normalize();
      expect(thighDir.y).toBeGreaterThan(0);
      expect(torsoDir.y).toBeGreaterThan(0);
      expect(thighDir.dot(torsoDir)).toBeGreaterThan(0.95);
    }

    // Bottom chest and nose remain cleanly above the mat.
    const bottomChest = new Vector3(0, 0.12, 0.24)
      .sub(new Vector3(0, -0.28, 0.08))
      .applyQuaternion(bottom.tilt)
      .add(bottom.origin);
    expect(bottomChest.y).toBeGreaterThan(KNEELING_PUSH_UP_MAT_TOP + 0.08);
  });

  it("maps pectoralis major as primary, triceps/anterior deltoid/serratus/core/forearms as secondary, and keeps legs neutral", () => {
    const mask = createKneelingPushUpMuscleMask(mesh.geometry);
    const positions = mesh.geometry.getAttribute("position");
    let primary = 0;
    let secondary = 0;

    for (let i = 0; i < mask.count; i++) {
      const value = mask.getX(i);
      if (value > 0.9) primary++;
      else if (value > 0.1) secondary++;

      if (positions.getY(i) < 0.78 || positions.getY(i) > 1.5) {
        expect(value).toBe(0);
      }
    }

    expect(primary).toBeGreaterThan(1500);
    expect(secondary).toBeGreaterThan(2000);
    expect(EXERCISE_ANIMATIONS["kneeling-push-up"].muscles.primary).toEqual([
      "Peitoral maior (porções clavicular e esternocostal)",
    ]);
  });
});
