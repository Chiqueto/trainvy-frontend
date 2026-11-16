// @vitest-environment node
import { readFile } from "node:fs/promises";
import { beforeAll, describe, expect, it } from "vitest";
import { Bone, Quaternion, SkinnedMesh, Vector3 } from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "meshoptimizer";
import { BARBELL_ROW_VARIANTS } from "../app/_components/exercise-3d/row-variants";
import {
  getExercisePose,
  getExerciseProgress,
  createPoseDriver,
  ARM_LENGTH,
  FOREARM_LENGTH,
} from "../app/_components/exercise-3d/kinematics";
import { installScapularRig } from "../app/_components/exercise-3d/scapular-rig";
import {
  EXERCISE_ANIMATIONS,
  getExerciseAnimation,
  type ExerciseAnimation,
} from "../app/_components/exercise-3d/exercises";
import chest from "../app/_components/exercise-3d/fly-muscle-map.json";
import { createBentRowMuscleMask } from "../app/_components/exercise-3d/bent-row-muscles";
import {
  createHighRowMuscleMask,
  createPendlayMuscleMask,
  createSmithHighRowAttribute,
} from "../app/_components/exercise-3d/high-row-muscles";
import { createSmithBenchMuscleMask } from "../app/_components/exercise-3d/smith-bench-muscles";
import back from "../app/_components/exercise-3d/deadlift-upper-back-map.json";
const keys = Object.keys(BARBELL_ROW_VARIANTS).filter(
  (k) => k !== "generic-bent-row",
) as ExerciseAnimation[];
let mesh: SkinnedMesh,
  apply: ReturnType<typeof createPoseDriver>,
  pecBase: number;
beforeAll(async () => {
  const b = await readFile(
    new URL(
      "../public/models/exercise-3d/trainvy-athlete.glb",
      import.meta.url,
    ),
  );
  const { scene } = await new GLTFLoader()
    .setMeshoptDecoder(MeshoptDecoder)
    .parseAsync(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength), "");
  const bones = new Map<string, Bone>();
  scene.traverse((o) => {
    if (o instanceof Bone) bones.set(o.name, o);
    if (o instanceof SkinnedMesh) mesh = o;
  });
  pecBase = Math.min(
    ...chest.selections
      .filter((s) => s.name.startsWith("Sternocostal"))
      .flatMap((s) =>
        s.indices.map((i) => mesh.geometry.attributes.position.getY(i)),
      ),
  );
  installScapularRig(mesh, bones);
  apply = createPoseDriver(bones);
});
describe("anatomically anchored barbell row variants", () => {
  it.each(keys)(
    "%s ends at its named region of the actual atlas, never head/upper chest",
    (key) => {
      const pose = getExercisePose(key, 0);
      const local = pose.bar
        .clone()
        .sub(pose.origin)
        .applyQuaternion(pose.tilt.clone().invert());
      const height = local.y + 1.142;
      if (key.startsWith("high")) {
        expect(height).toBeGreaterThanOrEqual(pecBase);
        expect(height).toBeLessThan(pecBase + 0.04);
      } else if (key === "pendlay-row") {
        expect(height).toBeLessThan(pecBase + 0.01);
        expect(height).toBeGreaterThan(pecBase - 0.045);
      } else {
        expect(height).toBeLessThan(pecBase - 0.1);
        expect(height).toBeGreaterThan(1.01);
      }
      expect(local.z).toBeGreaterThan(0.235);
      expect(local.z).toBeLessThan(0.28);
      expect(getExerciseAnimation(EXERCISE_ANIMATIONS[key].id)).toBe(key);
      expect(getExerciseAnimation(null, EXERCISE_ANIMATIONS[key].name)).toBe(
        key,
      );
    },
  );
  it("keeps the traditional variants equally inclined, Yates more upright and Pendlay near horizontal", () => {
    const standard = getExercisePose("bent-row", 0).tilt;
    for (const key of [
      "supinated-bent-row",
      "high-bent-row",
      "high-supinated-bent-row",
    ] as const)
      expect(standard.angleTo(getExercisePose(key, 0).tilt)).toBeLessThan(1e-6);
    const angle = (key: ExerciseAnimation) =>
      getExercisePose(key, 0).tilt.angleTo(new Quaternion());
    expect(angle("yates-row")).toBeLessThan(angle("bent-row") - 0.3);
    expect(angle("supinated-yates-row")).toBeCloseTo(angle("yates-row"));
    expect(Math.PI / 2 - angle("pendlay-row")).toBeLessThan(0.11);
  });
  it.each(keys)(
    "%s preserves supports, real bone lengths, contact and torso throughout the cycle",
    (key) => {
      const start = getExercisePose(key, 0);
      for (let i = 0; i <= 200; i++) {
        const pose = getExercisePose(key, i / 200);
        expect(pose.origin.distanceTo(start.origin)).toBeLessThan(1e-9);
        expect(pose.tilt.angleTo(start.tilt)).toBeLessThan(1e-6);
        for (const [j, l] of pose.limbs.entries()) {
          expect(l.ankle.distanceTo(start.limbs[j].ankle)).toBeLessThan(1e-9);
          expect(l.shoulder.distanceTo(l.elbow)).toBeCloseTo(ARM_LENGTH, 7);
          expect(l.elbow.distanceTo(l.wrist)).toBeCloseTo(FOREARM_LENGTH, 7);
          expect(
            new Vector3(0, 0.004, 0.012)
              .applyQuaternion(l.handRotation)
              .add(l.wrist)
              .distanceTo(l.grip),
          ).toBeLessThan(1e-6);
        }
      }
    },
  );
  it("starts every Pendlay pull from settled plates with a longer lowering phase and no rebound", () => {
    const phasePose = (phase: number) =>
      getExercisePose("pendlay-row", getExerciseProgress("pendlay-row", phase));
    const ground = phasePose(0);
    for (const phase of [0, 0.05, 0.11, 0.8, 0.87, 0.98])
      expect(phasePose(phase).bar.distanceTo(ground.bar)).toBeLessThan(1e-9);
    expect(ground.bar.y - 0.2).toBeCloseTo(0, 8);
    expect(phasePose(0.29).bar.y).toBeGreaterThan(ground.bar.y + 0.3);
    expect(getExerciseProgress("pendlay-row", 0.3)).toBe(0);
    expect(getExerciseProgress("pendlay-row", 0.38)).toBe(0);
    for (const key of keys.filter((k) => k !== "pendlay-row"))
      expect(getExercisePose(key, 1).bar.y - 0.2).toBeGreaterThan(0.1);
  });
  it.each(keys)(
    "%s keeps the deformed atlas grounded, finite and clear of the shaft",
    (key) => {
      const position = mesh.geometry.attributes.position;
      for (const d of [0, 0.25, 0.5, 0.75, 1]) {
        const pose = apply(key, d);
        mesh.parent!.updateMatrixWorld(true);
        mesh.skeleton.update();
        let finite = true,
          floor = Infinity,
          gap = Infinity;
        for (let i = 0; i < position.count; i++) {
          const q = mesh.applyBoneTransform(
            i,
            new Vector3().fromBufferAttribute(position, i),
          );
          finite &&= Number.isFinite(q.lengthSq());
          floor = Math.min(floor, q.y);
          if (Math.abs(q.x) < 0.17)
            gap = Math.min(
              gap,
              Math.hypot(q.y - pose.bar.y, q.z - pose.bar.z) - 0.014,
            );
        }
        expect(finite).toBe(true);
        expect(floor).toBeGreaterThan(-0.012);
        expect(floor).toBeLessThan(0.012);
        expect(gap, key + " " + d).toBeGreaterThan(-0.005);
      }
    },
  );
  it("uses distinct reviewed roles for low, high and floor rows while preserving the Smith shader channel", () => {
    const low = createBentRowMuscleMask(mesh.geometry),
      high = createHighRowMuscleMask(mesh.geometry),
      pendlay = createPendlayMuscleMask(mesh.geometry),
      packed = createSmithHighRowAttribute(mesh.geometry),
      smith = createSmithBenchMuscleMask(mesh.geometry);
    for (const s of back.selections.filter((s) =>
      s.name.startsWith("Transverse"),
    )) {
      const i = s.indices[0];
      expect(low.getX(i)).toBeCloseTo(0.45);
      expect(high.getX(i)).toBe(1);
      expect(pendlay.getX(i)).toBe(1);
    }
    for (let i = 0; i < packed.count; i++) {
      if (
        packed.getX(i) !== smith.getX(i) ||
        packed.getY(i) !== high.getX(i) ||
        packed.getZ(i) !== pendlay.getX(i)
      )
        throw Error("Packed map changed at " + i);
    }
  });
});
