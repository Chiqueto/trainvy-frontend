// @vitest-environment node
import { readFile } from "node:fs/promises";
import { beforeAll, describe, expect, it } from "vitest";
import { Bone, MathUtils, SkinnedMesh, Vector3 } from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "meshoptimizer";
import {
  EXERCISE_ANIMATIONS,
  getExerciseAnimation,
} from "../app/_components/exercise-3d/exercises";
import {
  ARM_LENGTH,
  FOREARM_LENGTH,
  createPoseDriver,
  getExercisePose,
  getExerciseDepth,
} from "../app/_components/exercise-3d/kinematics";
import { getGobletSquatPose } from "../app/_components/exercise-3d/goblet-squat-pose";
import { createGobletSquatMuscleMask } from "../app/_components/exercise-3d/goblet-squat-muscles";
import { createHipMachineMuscleAttribute } from "../app/_components/exercise-3d/hip-machine-muscles";
import { createTissueMaterial } from "../app/_components/exercise-3d/anatomy-material";
import map from "../app/_components/exercise-3d/goblet-squat-muscle-map.json";
import manifest from "../public/models/exercise-3d/model-manifest.json";

let mesh: SkinnedMesh;
let apply: ReturnType<typeof createPoseDriver>;

beforeAll(async () => {
  const bytes = await readFile(
    new URL("../public/models/exercise-3d/trainvy-athlete.glb", import.meta.url),
  );
  const { scene } = await new GLTFLoader()
    .setMeshoptDecoder(MeshoptDecoder)
    .parseAsync(
      bytes.buffer.slice(
        bytes.byteOffset,
        bytes.byteOffset + bytes.byteLength,
      ),
      "",
    );
  const bones = new Map<string, Bone>();
  scene.traverse((o) => {
    if (o instanceof Bone) bones.set(o.name, o);
    if (o instanceof SkinnedMesh) mesh = o;
  });
  apply = createPoseDriver(bones);
});

describe("goblet squat 3D kinematics and anatomy", () => {
  it("registers the exercise with canonical id, goblet instructions and verified muscles", () => {
    const entry = EXERCISE_ANIMATIONS["goblet-squat"];
    expect(entry.id).toBe("9e9f7973-098d-432d-8745-ee8c126fe576");
    expect(entry.name).toBe("Agachamento Goblet");
    expect(entry.equipment).toContain("Halter");
    expect(entry.muscles.primary).toContain("Quadríceps");
    expect(entry.muscles.primary).toContain("Glúteo máximo");
    expect(entry.muscles.secondary).toContain("Adutor magno");
    expect(entry.muscles.secondary).toContain("Eretores da coluna");
    expect(entry.instructions.setup).toContain("halter");
    expect(entry.instructions.execution).toContain("flexionando os quadris");

    expect(getExerciseAnimation(entry.id)).toBe("goblet-squat");
    expect(getExerciseAnimation(null, "Agachamento Goblet")).toBe("goblet-squat");
    expect(getExerciseAnimation(null, "goblet squat")).toBe("goblet-squat");
  });

  it("maintains grounded feet with stable stance across depth 0 to 1", () => {
    for (const d of [0, 0.25, 0.5, 0.75, 1]) {
      const pose = getGobletSquatPose(d);
      for (const limb of pose.limbs) {
        expect(limb.ankle.y).toBeCloseTo(0.05, 3);
        expect(Math.abs(limb.ankle.x)).toBeCloseTo(0.22, 2);
        expect(limb.ankle.z).toBeCloseTo(0.02, 2);
      }
    }
  });

  it("preserves exact anatomical bone lengths without joint stretching or popping", () => {
    for (const d of [0, 0.5, 1]) {
      const pose = getGobletSquatPose(d);
      for (const limb of pose.limbs) {
        // Thigh: hip to knee = 0.44m
        const thighLength = limb.hip.distanceTo(limb.knee);
        expect(thighLength).toBeCloseTo(0.44, 2);

        // Shin: knee to ankle = 0.42m
        const shinLength = limb.knee.distanceTo(limb.ankle);
        expect(shinLength).toBeCloseTo(0.42, 2);

        // Arm: shoulder to elbow = ARM_LENGTH
        const armLength = limb.shoulder.distanceTo(limb.elbow);
        expect(armLength).toBeCloseTo(ARM_LENGTH, 2);

        // Forearm: elbow to wrist = FOREARM_LENGTH
        const forearmLength = limb.elbow.distanceTo(limb.wrist);
        expect(forearmLength).toBeCloseTo(FOREARM_LENGTH, 2);
      }
    }
  });

  it("maintains bilateral symmetry across the sagittal plane", () => {
    for (const d of [0, 0.5, 1]) {
      const pose = getGobletSquatPose(d);
      const [left, right] = pose.limbs;
      expect(left.hip.x).toBeCloseTo(-right.hip.x, 3);
      expect(left.hip.y).toBeCloseTo(right.hip.y, 3);
      expect(left.knee.x).toBeCloseTo(-right.knee.x, 3);
      expect(left.knee.y).toBeCloseTo(right.knee.y, 3);
      expect(left.knee.z).toBeCloseTo(right.knee.z, 3);
      expect(left.ankle.x).toBeCloseTo(-right.ankle.x, 3);
      expect(left.ankle.y).toBeCloseTo(right.ankle.y, 3);
      expect(left.wrist.x).toBeCloseTo(-right.wrist.x, 3);
      expect(left.wrist.y).toBeCloseTo(right.wrist.y, 3);
      expect(left.wrist.z).toBeCloseTo(right.wrist.z, 3);
    }
  });

  it("keeps torso upright compared to conventional back squat kinematics", () => {
    const top = getGobletSquatPose(0);
    const bottom = getGobletSquatPose(1);

    // Torso tilts slightly forward from top to bottom
    const topForwardTilt = Math.atan2(
      2 * (top.tilt.w * top.tilt.x + top.tilt.y * top.tilt.z),
      1 - 2 * (top.tilt.x ** 2 + top.tilt.y ** 2),
    );
    const bottomForwardTilt = Math.atan2(
      2 * (bottom.tilt.w * bottom.tilt.x + bottom.tilt.y * bottom.tilt.z),
      1 - 2 * (bottom.tilt.x ** 2 + bottom.tilt.y ** 2),
    );

    // Bottom inclination is ~16° (0.28 rad), substantially more upright than back squat (~45°-50°)
    expect(MathUtils.radToDeg(bottomForwardTilt)).toBeLessThan(25);
    expect(MathUtils.radToDeg(bottomForwardTilt)).toBeGreaterThan(10);
    expect(bottomForwardTilt).toBeGreaterThan(topForwardTilt);
  });

  it("dispatches goblet squat through the pose driver and kinematics dispatcher", () => {
    const pose = getExercisePose("goblet-squat", 0.5);
    expect(pose.origin.y).toBeLessThan(0.88);
    expect(pose.origin.y).toBeGreaterThan(0.48);
    expect(pose.limbs).toHaveLength(2);

    // Pose driver applies smoothly without throws
    const driverResult = apply("goblet-squat", 0.5);
    expect(driverResult.origin.y).toBeCloseTo(pose.origin.y, 3);
  });

  it("loads the muscle map with matching athlete asset hash and valid selections", () => {
    expect(map.baseAssetSha256).toBe(manifest.sha256);
    expect(map.selections.length).toBe(34);
    expect(map.license).toBe("CC-BY-SA-4.0");

    const mask = createGobletSquatMuscleMask(mesh.geometry);
    expect(mask.count).toBe(mesh.geometry.attributes.position.count);

    let primaryCount = 0;
    let secondaryCount = 0;
    for (let i = 0; i < mask.count; i++) {
      const v = mask.getX(i);
      if (Math.abs(v - 1.0) < 0.01) primaryCount++;
      if (Math.abs(v - 0.45) < 0.01) secondaryCount++;
    }
    expect(primaryCount).toBeGreaterThan(1000);
    expect(secondaryCount).toBeGreaterThan(2000);
  });

  it("produces a dedicated 1-component attribute for goblet squat muscles", () => {
    const mask = createGobletSquatMuscleMask(mesh.geometry);
    expect(mask.itemSize).toBe(1);
    expect(mask.count).toBe(mesh.geometry.attributes.position.count);

    // Verify hip machine muscle attribute remains untouched as 2 components
    const hipAttr = createHipMachineMuscleAttribute(mesh.geometry);
    expect(hipAttr.itemSize).toBe(2);
  });

  it("sets the material shader mode for goblet-squat", () => {
    const { material, setAppearance } = createTissueMaterial();
    setAppearance("goblet-squat");
    expect(material.name).toContain("tissue");
  });
});
