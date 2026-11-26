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
import { createElevatedPushUpMuscleMask } from "../app/_components/exercise-3d/elevated-push-up-muscles";
import { ELEVATED_PUSH_UP_DECK_TOP } from "../app/_components/exercise-3d/elevated-push-up-pose";
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

describe("Elevated Push-up (Flexão de Braços com Mãos Elevadas)", () => {
  it("resolves canonical UUID and normalized names to elevated-push-up", () => {
    expect(getExerciseAnimation("64c13c24-240c-44d8-88db-d52af9063792")).toBe(
      "elevated-push-up",
    );
    expect(
      getExerciseAnimation(undefined, "Flexão de Braços com Mãos Elevadas"),
    ).toBe("elevated-push-up");
    expect(getExerciseAnimation(undefined, "Flexão inclinada")).toBe(
      "elevated-push-up",
    );
  });

  it("maintains grounded ankles, elevated palms on deck, real bone lengths, and straight plank alignment", () => {
    const top = getExercisePose("elevated-push-up", 0);
    const bottom = getExercisePose("elevated-push-up", 1);

    expect(top.origin.y).toBeGreaterThan(bottom.origin.y + 0.2);

    for (let step = 0; step <= 60; step++) {
      const pose = apply("elevated-push-up", step / 60);
      for (const [index, limb] of pose.limbs.entries()) {
        expect(limb.hip.distanceTo(limb.knee)).toBeCloseTo(0.44, 5);
        expect(limb.knee.distanceTo(limb.ankle)).toBeCloseTo(0.42, 5);
        expect(limb.shoulder.distanceTo(limb.elbow)).toBeCloseTo(ARM_LENGTH, 5);
        expect(limb.elbow.distanceTo(limb.wrist)).toBeCloseTo(
          FOREARM_LENGTH,
          5,
        );
        // Ankles stay anchored behind and wrists stay planted on the elevated deck.
        expect(limb.ankle.distanceTo(top.limbs[index].ankle)).toBeLessThan(1e-9);
        expect(limb.wrist.distanceTo(top.limbs[index].wrist)).toBeLessThan(
          1e-9,
        );
        expect(limb.wrist.y).toBeGreaterThan(ELEVATED_PUSH_UP_DECK_TOP);
        expect(forearmDirectionError(mesh, index ? "R" : "L", limb)).toBeLessThan(
          1e-5,
        );
        // Elbows flare backward cleanly above the bench deck.
        expect(limb.elbow.z).toBeLessThan(limb.wrist.z);
        expect(limb.elbow.y).toBeGreaterThan(ELEVATED_PUSH_UP_DECK_TOP);
      }

      // Ankle -> knee -> hip -> shoulder stay aligned in an inclined straight plank.
      const lowerLegDir = pose.limbs[0].knee
        .clone()
        .sub(pose.limbs[0].ankle)
        .normalize();
      const thighDir = pose.limbs[0].hip
        .clone()
        .sub(pose.limbs[0].knee)
        .normalize();
      const torsoDir = pose.limbs[0].shoulder
        .clone()
        .sub(pose.limbs[0].hip)
        .normalize();
      expect(lowerLegDir.dot(thighDir)).toBeGreaterThan(0.99);
      expect(thighDir.dot(torsoDir)).toBeGreaterThan(0.96);
    }
  });

  it("maps pectoralis major as primary, triceps/anterior deltoid/serratus/core/forearms as secondary, and keeps legs neutral", () => {
    const mask = createElevatedPushUpMuscleMask(mesh.geometry);
    const position = mesh.geometry.getAttribute("position");
    const count = position.count;
    let primaryCount = 0;
    let secondaryCount = 0;
    let lowerBodyColored = 0;
    for (let i = 0; i < count; i++) {
      const value = mask.getX(i);
      const vertex = new Vector3().fromBufferAttribute(position, i);
      if (value >= 0.99) primaryCount++;
      else if (value >= 0.4) secondaryCount++;
      if (value > 0.1 && vertex.y < 0.72) lowerBodyColored++;
    }
    expect(primaryCount).toBeGreaterThan(100);
    expect(secondaryCount).toBeGreaterThan(100);
    expect(lowerBodyColored).toBe(0);
    expect(EXERCISE_ANIMATIONS["elevated-push-up"].muscles.primary).toEqual([
      "Peitoral maior (porções clavicular e esternocostal)",
    ]);
  });
});
