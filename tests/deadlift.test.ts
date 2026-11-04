// @vitest-environment node
import { readFile } from "node:fs/promises";
import { beforeAll, describe, expect, it } from "vitest";
import { Bone, SkinnedMesh, Vector3 } from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "meshoptimizer";
import { ARM_LENGTH, FOREARM_LENGTH, createPoseDriver, getExerciseDepth, getExercisePose } from "../app/_components/exercise-3d/kinematics";
import { EXERCISE_ANIMATIONS, getExerciseAnimation } from "../app/_components/exercise-3d/exercises";
import { createDeadliftMuscleMask } from "../app/_components/exercise-3d/deadlift-muscles";
import { createStiffMuscleMask } from "../app/_components/exercise-3d/stiff-muscles";
import atlas from "../app/_components/exercise-3d/sumo-dumbbell-muscle-map.json";

let mesh: SkinnedMesh;
let apply: ReturnType<typeof createPoseDriver>;
beforeAll(async () => {
  const bytes = await readFile(new URL("../public/models/exercise-3d/trainvy-athlete.glb", import.meta.url));
  const { scene } = await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), "");
  const bones = new Map<string, Bone>();
  scene.traverse((o) => { if (o instanceof Bone) bones.set(o.name, o); if (o instanceof SkinnedMesh) mesh = o; });
  apply = createPoseDriver(bones);
});

describe("conventional deadlift", () => {
  it("recognizes its own variant without conflating nearby exercises", () => {
    expect(getExerciseAnimation(EXERCISE_ANIMATIONS.deadlift.id)).toBe("deadlift");
    expect(getExerciseAnimation(null, "Levantamento Terra")).toBe("deadlift");
    expect(getExerciseAnimation(null, "Levantamento Terra Sumô")).toBeNull();
    expect(getExerciseAnimation(null, "Romanian deadlift")).toBeNull();
    expect(getExerciseAnimation(null, "Stiff")).toBe("stiff");
  });
  it("keeps feet planted and bone lengths fixed, with the plates grounded at the bottom", () => {
    const top = getExercisePose("deadlift", 0);
    const bottom = getExercisePose("deadlift", 1);
    expect(bottom.bar.y).toBeCloseTo(0.2, 5);
    expect(bottom.bar.y).toBeLessThan(top.bar.y);
    expect(bottom.limbs[0].hip.y).toBeLessThan(top.limbs[0].hip.y - 0.2);
    for (let i = 0; i <= 100; i++) {
      const pose = getExercisePose("deadlift", i / 100);
      expect(pose.bar.y).toBeGreaterThanOrEqual(0.19999);
      for (const [index, limb] of pose.limbs.entries()) {
        expect(limb.ankle.distanceTo(top.limbs[index].ankle)).toBeLessThan(1e-9);
        expect(limb.hip.distanceTo(limb.knee)).toBeCloseTo(0.44, 7);
        expect(limb.knee.distanceTo(limb.ankle)).toBeCloseTo(0.42, 7);
        expect(limb.shoulder.distanceTo(limb.elbow)).toBeCloseTo(ARM_LENGTH, 5);
        expect(limb.elbow.distanceTo(limb.wrist)).toBeCloseTo(FOREARM_LENGTH, 5);
        expect(limb.grip.distanceTo(pose.bar.clone().setX(limb.grip.x))).toBeLessThan(1e-5);
      }
    }
    expect(getExercisePose("deadlift", getExerciseDepth(0.5)).bar.y).toBeCloseTo(0.2, 5);
  });
  it("uses its own quadriceps and hamstring selection instead of inheriting the stiff map", () => {
    const mask = createDeadliftMuscleMask(mesh.geometry), stiff = createStiffMuscleMask(mesh.geometry);
    const quad = atlas.selections.find(s => s.name === "Vastus_lateralis_musclel")!;
    const hamstring = atlas.selections.find(s => s.name === "Long_head_of_biceps_femorisl")!;
    expect(mask.getX(quad.indices[0])).toBe(1);
    expect(stiff.getX(quad.indices[0])).toBe(0);
    expect(mask.getX(hamstring.indices[0])).toBe(1);
  });
  it("keeps the skinned feet grounded and the bar clear of non-hand tissue", () => {
    const pos = mesh.geometry.attributes.position, indices = mesh.geometry.attributes.skinIndex, weights = mesh.geometry.attributes.skinWeight;
    const hands = mesh.skeleton.bones.map((b, i) => /^(hand|wrist)_[LR]$/.test(b.name) ? i : -1).filter(i => i >= 0);
    for (const depth of [0, 0.25, 0.5, 0.75, 1]) {
      const pose = apply("deadlift", depth);
      mesh.parent!.updateMatrixWorld(true);
      mesh.skeleton.update();
      let ground = Infinity, shaftGap = Infinity, closest = "";
      const gripGap = [Infinity, Infinity];
      for (let i = 0; i < pos.count; i += 5) {
        const p = mesh.getVertexPosition(i, new Vector3());
        ground = Math.min(ground, p.y);
        const isHand = [0, 1, 2, 3].reduce((sum, k) => sum + (hands.includes(indices.getComponent(i, k)) ? weights.getComponent(i, k) : 0), 0) > 0.5;
        if (isHand && Math.abs(p.x) > 0.23 && Math.abs(p.x) < 0.36) {
          const side = p.x < 0 ? 0 : 1;
          gripGap[side] = Math.min(gripGap[side], Math.abs(Math.hypot(p.y - pose.bar.y, p.z - pose.bar.z) - 0.014));
        }
        if (!isHand && Math.abs(p.x) < 0.7) { const gap = Math.hypot(p.y - pose.bar.y, p.z - pose.bar.z) - 0.014; if (gap < shaftGap) { shaftGap = gap; closest = `${depth} ${p.x} ${[0,1,2,3].map(k => `${mesh.skeleton.bones[indices.getComponent(i,k)]?.name}:${weights.getComponent(i,k)}`).join(' ')}`; } }
      }
      expect(ground).toBeGreaterThan(-0.012);
      expect(ground).toBeLessThan(0.012);
      expect(shaftGap, closest).toBeGreaterThan(-0.004);
      expect(Math.max(...gripGap)).toBeLessThan(0.012);
    }
  });
});
