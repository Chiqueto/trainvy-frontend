// @vitest-environment node
import { readFile } from "node:fs/promises";
import { beforeAll, describe, expect, it } from "vitest";
import { Bone, SkinnedMesh, Vector3 } from "three";
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
import { HIP_THRUST_SUPPORT } from "../app/_components/exercise-3d/hip-thrust-pose";
import { createHipThrustMuscleMask } from "../app/_components/exercise-3d/hip-thrust-muscles";
import { createStiffMuscleMask } from "../app/_components/exercise-3d/stiff-muscles";
import map from "../app/_components/exercise-3d/hip-thrust-muscle-map.json";
import manifest from "../public/models/exercise-3d/model-manifest.json";

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
  scene.traverse((o) => {
    if (o instanceof Bone) bones.set(o.name, o);
    if (o instanceof SkinnedMesh) mesh = o;
  });
  apply = createPoseDriver(bones);
});

describe("barbell hip thrust with thoracic bench support", () => {
  it("recognizes its canonical ID and exact names without substituting floor bridges or machines", () => {
    expect(getExerciseAnimation(EXERCISE_ANIMATIONS["hip-thrust"].id)).toBe(
      "hip-thrust",
    );
    for (const name of [
      "Elevação Pélvica",
      "Elevação pélvica com barra",
      "Barbell hip thrust",
    ])
      expect(getExerciseAnimation(null, name)).toBe("hip-thrust");
    for (const name of [
      "Glute bridge",
      "Ponte de glúteos",
      "Hip thrust na máquina",
      "Elevação pélvica unilateral",
    ])
      expect(getExerciseAnimation(null, name)).toBeNull();
  });

  it("keeps the feet planted, real segments and the upper back pivot stable throughout the range", () => {
    const top = getExercisePose("hip-thrust", 0);
    for (let i = 0; i <= 100; i++) {
      const pose = getExercisePose("hip-thrust", i / 100);
      const pivot = new Vector3(0, 0.14, 0.03)
        .applyQuaternion(pose.tilt)
        .add(pose.origin);
      expect(pivot.y).toBeCloseTo(HIP_THRUST_SUPPORT.height, 9);
      expect(pivot.z).toBeCloseTo(HIP_THRUST_SUPPORT.edgeZ, 9);
      for (const [index, l] of pose.limbs.entries()) {
        expect(l.ankle.distanceTo(top.limbs[index].ankle)).toBeLessThan(1e-9);
        expect(
          l.footRotation.angleTo(top.limbs[index].footRotation),
        ).toBeLessThan(1e-7);
        expect(l.hip.distanceTo(l.knee)).toBeCloseTo(0.44, 9);
        expect(l.knee.distanceTo(l.ankle)).toBeCloseTo(0.42, 9);
        expect(l.shoulder.distanceTo(l.elbow)).toBeCloseTo(ARM_LENGTH, 9);
        expect(l.elbow.distanceTo(l.wrist)).toBeCloseTo(FOREARM_LENGTH, 9);
        expect(l.shoulder.distanceTo(l.hip)).toBeCloseTo(
          top.limbs[index].shoulder.distanceTo(top.limbs[index].hip),
          9,
        );
      }
    }
    for (const l of top.limbs) {
      const kneeFlexion =
        180 -
        (l.hip.clone().sub(l.knee).angleTo(l.ankle.clone().sub(l.knee)) * 180) /
          Math.PI;
      expect(kneeFlexion).toBeCloseTo(90, 5);
      expect(l.knee.z).toBeCloseTo(l.ankle.z, 5);
      expect(l.hip.y).toBeCloseTo(l.knee.y, 5);
    }
    const low = getExercisePose("hip-thrust", 1);
    expect(low.limbs[0].hip.y).toBeLessThan(top.limbs[0].hip.y - 0.2);
    expect(low.bar.y).toBeGreaterThan(0.25);
  });

  it("uses a controlled eccentric, bottom pause and smooth concentric", () => {
    const height = (phase: number) =>
      getExercisePose("hip-thrust", getExerciseDepth(phase)).bar.y;
    expect(height(0)).toBeGreaterThan(height(0.25));
    expect(height(0.25)).toBeGreaterThan(height(0.48));
    expect(height(0.48)).toBeCloseTo(height(0.53), 8);
    expect(height(0.75)).toBeGreaterThan(height(0.54));
    expect(height(1)).toBeCloseTo(height(0), 9);
  });

  it("has an independent gluteus-maximus primary map and includes reviewed synergists", () => {
    const mask = createHipThrustMuscleMask(mesh.geometry),
      stiff = createStiffMuscleMask(mesh.geometry);
    expect(map.baseAssetSha256).toBe(manifest.sha256);
    expect(new Set(map.selections.map((s) => s.name)).size).toBe(32);
    for (const s of map.selections) {
      expect(s.confidence).toBeGreaterThanOrEqual(0.8);
      const primary = /Gluteus_maximus/.test(s.name);
      expect(s.role).toBe(primary ? 1 : 0.45);
      for (const i of s.indices) {
        expect(mask.getX(i)).toBeCloseTo(s.role);
        if (/Long_head_of_biceps_femoris/.test(s.name))
          expect(stiff.getX(i)).toBe(1);
        if (/Vastus|Rectus_femoris|Gluteus_medius/.test(s.name))
          expect(stiff.getX(i)).toBe(0);
      }
    }
  });

  it("preserves the skinned silhouette, grounded soles and physical bench/pad contact", () => {
    for (const depth of [0, 0.25, 0.5, 0.75, 1]) {
      const pose = apply("hip-thrust", depth);
      mesh.parent!.updateMatrixWorld(true);
      mesh.skeleton.update();
      let ground = Infinity,
        benchGap = Infinity,
        padGap = Infinity;
      const bar = pose.bar;
      for (let i = 0; i < mesh.geometry.attributes.position.count; i += 7) {
        const p = mesh.getVertexPosition(i, new Vector3());
        expect(p.toArray().every(Number.isFinite)).toBe(true);
        ground = Math.min(ground, p.y);
        if (
          Math.abs(p.x) < 0.18 &&
          Math.abs(p.z - HIP_THRUST_SUPPORT.edgeZ) < 0.04
        )
          benchGap = Math.min(
            benchGap,
            Math.abs(p.y - HIP_THRUST_SUPPORT.height),
          );
        if (
          Math.abs(p.x) < 0.18 &&
          Math.hypot(p.y - bar.y, p.z - bar.z) < padGap
        ) {
          padGap = Math.hypot(p.y - bar.y, p.z - bar.z);
        }
      }
      expect(ground).toBeGreaterThan(-0.01);
      expect(ground).toBeLessThan(0.01);
      expect(benchGap).toBeLessThan(0.04);
      expect(padGap).toBeGreaterThan(0.055);
      expect(padGap).toBeLessThan(0.09);
    }
  });
});
