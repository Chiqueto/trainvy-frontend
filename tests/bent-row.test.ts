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
  createBentRowMuscleMask,
  createFlyMachineBentRowAttribute,
} from "../app/_components/exercise-3d/bent-row-muscles";
import { createFlyMachineRowAttribute } from "../app/_components/exercise-3d/machine-row-muscles";
import back from "../app/_components/exercise-3d/deadlift-upper-back-map.json";
import lower from "../app/_components/exercise-3d/sumo-dumbbell-muscle-map.json";
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
describe("standing bent-over barbell row", () => {
  it("resolves the barbell variant only", () => {
    expect(getExerciseAnimation("00000000-0000-4000-8000-000000000121")).toBe(
      "bent-row",
    );
    expect(getExerciseAnimation(null, "Remada Curvada com Barra")).toBe(
      "bent-row",
    );
    expect(getExerciseAnimation(null, "Remada Curvada Supinada")).toBe(
      "supinated-bent-row",
    );
  });
  it("preserves hinge, feet, segment lengths and two-hand shaft contact through 201 poses", () => {
    const first = getExercisePose("bent-row", 0);
    for (let i = 0; i <= 200; i++) {
      const p = getExercisePose("bent-row", i / 200);
      expect(p.origin.distanceTo(first.origin)).toBeLessThan(1e-9);
      expect(p.tilt.angleTo(first.tilt)).toBeLessThan(1e-7);
      for (const [j, l] of p.limbs.entries()) {
        expect(l.ankle.distanceTo(first.limbs[j].ankle)).toBeLessThan(1e-9);
        expect(l.hip.distanceTo(l.knee)).toBeCloseTo(0.44, 7);
        expect(l.knee.distanceTo(l.ankle)).toBeCloseTo(0.42, 7);
        expect(l.shoulder.distanceTo(l.elbow)).toBeCloseTo(ARM_LENGTH, 7);
        expect(l.elbow.distanceTo(l.wrist)).toBeCloseTo(FOREARM_LENGTH, 7);
        expect(
          new Vector3(0, 0.004, 0.012)
            .applyQuaternion(l.handRotation)
            .add(l.wrist)
            .distanceTo(l.grip),
        ).toBeLessThan(1e-6);
        expect(l.grip.y).toBeCloseTo(p.bar.y, 8);
        expect(l.grip.z).toBeCloseTo(p.bar.z, 8);
      }
    }
  });
  it("keeps arm rotations continuous and pronation shared by hand/wrist/forearm", () => {
    let previous: Quaternion[] | undefined;
    for (let i = 0; i <= 1000; i++) {
      const p = apply("bent-row", i / 1000),
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
      for (const [j, s] of ["L", "R"].entries())
        expect(forearmDirectionError(mesh, s, p.limbs[j])).toBeLessThan(1e-6);
      previous = q;
    }
  });
  it("retains the previous packed channels and adds posture muscles as secondary", () => {
    const mask = createBentRowMuscleMask(mesh.geometry),
      old = createFlyMachineRowAttribute(mesh.geometry),
      packed = createFlyMachineBentRowAttribute(mesh.geometry);
    let mismatch = 0;
    for (let i = 0; i < mask.count; i++)
      if (
        old.getX(i) !== packed.getX(i) ||
        old.getY(i) !== packed.getY(i) ||
        mask.getX(i) !== packed.getZ(i)
      )
        mismatch++;
    expect(mismatch).toBe(0);
    for (const s of back.selections)
      if (/^Latissimus|^Transverse/.test(s.name))
        expect(mask.getX(s.indices[0])).toBeCloseTo(
          /^Latissimus/.test(s.name) ? 1 : 0.45,
        );
    for (const s of lower.selections)
      if (/^Gluteus|^Vastus|^Long_head_of_biceps_femoris/.test(s.name))
        expect(mask.getX(s.indices[0])).toBeCloseTo(0.45);
  });
  it("keeps the actual tissue finite, grounded and clear of the bar shaft", () => {
    for (const d of [0, 0.2, 0.4, 0.6, 0.8, 1]) {
      const p = apply("bent-row", d);
      mesh.parent!.updateMatrixWorld(true);
      mesh.skeleton.update();
      let floor = Infinity,
        gap = Infinity,
        finite = true;
      const ids = mesh.geometry.attributes.skinIndex,
        w = mesh.geometry.attributes.skinWeight;
      for (let i = 0; i < ids.count; i += 3) {
        const q = mesh.getVertexPosition(i, new Vector3());
        finite = finite && q.toArray().every(Number.isFinite);
        floor = Math.min(floor, q.y);
        const hand =
          [0, 1, 2, 3].reduce(
            (sum, k) =>
              sum +
              (/^(hand|wrist)_[LR]$/.test(
                mesh.skeleton.bones[ids.getComponent(i, k)]?.name ?? "",
              )
                ? w.getComponent(i, k)
                : 0),
            0,
          ) > 0.5;
        if (!hand && Math.abs(q.x) < 0.7)
          gap = Math.min(gap, Math.hypot(q.y - p.bar.y, q.z - p.bar.z) - 0.014);
      }
      expect(finite).toBe(true);
      expect(floor).toBeGreaterThan(-0.012);
      expect(floor).toBeLessThan(0.012);
      expect(gap, "shaft " + d).toBeGreaterThan(-0.005);
    }
  });
});
