import { forearmDirectionError } from "./helpers/forearm-direction-error";
// @vitest-environment node
import { readFile } from "node:fs/promises";
import { beforeAll, describe, expect, it } from "vitest";
import { Bone, SkinnedMesh, Vector3, Quaternion } from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "meshoptimizer";
import {
  ARM_LENGTH,
  FOREARM_LENGTH,
  createPoseDriver,
  getExercisePose,
} from "../app/_components/exercise-3d/kinematics";
import { getExerciseAnimation } from "../app/_components/exercise-3d/exercises";
import {
  createOneArmRowMuscleMask,
  createPackedRowAttribute,
} from "../app/_components/exercise-3d/one-arm-row-muscles";
import { createFlyMachineBentRowAttribute } from "../app/_components/exercise-3d/bent-row-muscles";
import back from "../app/_components/exercise-3d/deadlift-upper-back-map.json";
import support from "../app/_components/exercise-3d/one-arm-row-support-map.json";
import arms from "../app/_components/exercise-3d/fly-muscle-map.json";
let mesh: SkinnedMesh, apply: ReturnType<typeof createPoseDriver>;
const bones = new Map<string, Bone>();
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
  scene.traverse((o) => {
    if (o instanceof Bone) bones.set(o.name, o);
    if (o instanceof SkinnedMesh) mesh = o;
  });
  apply = createPoseDriver(bones);
});
describe("supported single-arm dumbbell row", () => {
  it("resolves the exact dumbbell variation", () => {
    expect(getExerciseAnimation("00000000-0000-4000-8000-000000000138")).toBe(
      "one-arm-row",
    );
    expect(getExerciseAnimation(null, "Remada Unilateral com Halteres")).toBe(
      "one-arm-row",
    );
    expect(
      getExerciseAnimation(null, "Remada Unilateral na Máquina"),
    ).toBeNull();
  });
  it("retains three supports and fixed segment lengths through 201 poses", () => {
    const first = getExercisePose("one-arm-row", 0);
    for (let i = 0; i <= 200; i++) {
      const p = getExercisePose("one-arm-row", i / 200);
      expect(p.origin.distanceTo(first.origin)).toBeLessThan(1e-9);
      for (const [j, l] of p.limbs.entries()) {
        expect(l.hip.distanceTo(l.knee)).toBeCloseTo(0.44, 7);
        expect(l.knee.distanceTo(l.ankle)).toBeCloseTo(0.42, 7);
        expect(l.shoulder.distanceTo(l.elbow)).toBeCloseTo(ARM_LENGTH, 7);
        expect(l.elbow.distanceTo(l.wrist)).toBeCloseTo(FOREARM_LENGTH, 7);
        expect(l.ankle.distanceTo(first.limbs[j].ankle)).toBeLessThan(1e-9);
      }
      expect(p.limbs[0]).toEqual(first.limbs[0]);
      expect(p.bar).toEqual(p.limbs[1].grip);
      expect(
        new Vector3(0, 0.004, 0.012)
          .applyQuaternion(p.limbs[1].handRotation)
          .add(p.limbs[1].wrist)
          .distanceTo(p.bar),
      ).toBeLessThan(1e-6);
    }
  });
  it("keeps arm rotation continuous and separates planted wrist extension from the forearm", () => {
    let previous: Quaternion[] | undefined;
    for (let i = 0; i <= 1000; i++) {
      const p = apply("one-arm-row", i / 1000),
        q = [
          "upperArm_L",
          "upperArm_R",
          "forearm_L",
          "forearm_R",
          "hand_L",
          "hand_R",
        ].map((n) => bones.get(n)!.quaternion.clone());
      if (previous)
        q.forEach((v, j) => expect(v.angleTo(previous![j])).toBeLessThan(0.04));
      expect(forearmDirectionError(mesh, "R", p.limbs[1])).toBeLessThan(1e-6);
      expect(
        bones.get("forearm_L")!.quaternion.angleTo(p.limbs[0].handRotation),
      ).toBeGreaterThan(0.5);
      previous = q;
    }
  });
  it("highlights one pulling side and support muscles, preserving all older packed channels", () => {
    const mask = createOneArmRowMuscleMask(mesh.geometry),
      old = createFlyMachineBentRowAttribute(mesh.geometry),
      packed = createPackedRowAttribute(mesh.geometry),
      pos = mesh.geometry.attributes.position;
    let mismatch = 0;
    for (let i = 0; i < mask.count; i++)
      if (
        old.getX(i) !== packed.getX(i) ||
        old.getY(i) !== packed.getY(i) ||
        old.getZ(i) !== packed.getZ(i) ||
        mask.getX(i) !== packed.getW(i)
      )
        mismatch++;
    expect(mismatch).toBe(0);
    for (const atlas of [back, support, arms])
      for (const s of atlas.selections) {
        const active = s.indices.reduce((sum, i) => sum + pos.getX(i), 0) > 0,
          i = s.indices[0];
        if (/^Latissimus|^Transverse_part/.test(s.name))
          expect(mask.getX(i)).toBeCloseTo(active ? 1 : 0.45);
        if (/triceps_brachii|pectoralis_major/.test(s.name))
          expect(mask.getX(i)).toBeCloseTo(active ? 0 : 0.45);
      }
  });
  it("keeps the skinned tissue finite and its supporting hand/knee by the bench surface", () => {
    for (const d of [0, 0.2, 0.4, 0.6, 0.8, 1]) {
      const p = apply("one-arm-row", d);
      mesh.parent!.updateMatrixWorld(true);
      mesh.skeleton.update();
      let floor = Infinity,
        handY = Infinity,
        kneeY = Infinity,
        finite = true,
        gap = Infinity;
      const ids = mesh.geometry.attributes.skinIndex,
        w = mesh.geometry.attributes.skinWeight;
      for (let i = 0; i < ids.count; i += 3) {
        const q = mesh.getVertexPosition(i, new Vector3());
        finite = finite && q.toArray().every(Number.isFinite);
        floor = Math.min(floor, q.y);
        const influence = (name: string) =>
          [0, 1, 2, 3].reduce(
            (sum, k) =>
              sum +
              (mesh.skeleton.bones[ids.getComponent(i, k)]?.name === name
                ? w.getComponent(i, k)
                : 0),
            0,
          );
        if (influence("hand_L") > 0.7) handY = Math.min(handY, q.y);
        if (
          Math.abs(q.x - p.limbs[0].knee.x) < 0.1 &&
          Math.abs(q.z - p.limbs[0].knee.z) < 0.07 &&
          q.y > 0.35 &&
          q.y < 0.7
        )
          kneeY = Math.min(kneeY, q.y);
        if (
          q.x > 0.15 &&
          influence("hand_R") < 0.2 &&
          influence("wrist_R") < 0.2
        )
          gap = Math.min(gap, q.distanceTo(p.bar));
      }
      expect(finite).toBe(true);
      expect(floor).toBeGreaterThan(-0.012);
      expect(floor).toBeLessThan(0.012);
      expect(handY, "support palm").toBeGreaterThan(0.48);
      expect(handY, "support contact").toBeLessThan(0.54);
      expect(Number.isFinite(kneeY)).toBe(true);
      expect(kneeY).toBeGreaterThan(0.48);
      expect(kneeY).toBeLessThan(0.52);
      expect(gap, "dumbbell centre " + d).toBeGreaterThan(0.025);
    }
  });
});
