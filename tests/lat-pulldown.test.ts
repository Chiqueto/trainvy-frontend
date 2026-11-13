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
import { getExerciseAnimation } from "../app/_components/exercise-3d/exercises";
import {
  PULLDOWN_BAR_TOP,
  PULLDOWN_BAR_BOTTOM,
  getPulldownStackLift,
} from "../app/_components/exercise-3d/lat-pulldown-pose";
import { createLatPulldownMuscleMask } from "../app/_components/exercise-3d/lat-pulldown-muscles";
import {
  createPecDeckHangCleanAttribute,
  createHangPowerCleanMuscleMask,
} from "../app/_components/exercise-3d/hang-power-clean-muscles";
import { createPecDeckMuscleMask } from "../app/_components/exercise-3d/pec-deck-muscles";
import upper from "../app/_components/exercise-3d/deadlift-upper-back-map.json";
import detail from "../app/_components/exercise-3d/lat-pulldown-detail-map.json";
import arms from "../app/_components/exercise-3d/fly-muscle-map.json";
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

describe("front machine lat pulldown", () => {
  it("resolves only the reviewed UUID and exact equipment variant", () => {
    expect(getExerciseAnimation("00000000-0000-4000-8000-000000000119")).toBe(
      "lat-pulldown",
    );
    expect(getExerciseAnimation(null, "Puxada Frontal na Máquina")).toBe(
      "lat-pulldown",
    );
    for (const name of [
      "Puxada Frontal com Pegada Neutra",
      "Puxada Frontal com Pegada Supinada",
      "Puxada atrás da nuca",
    ])
      expect(getExerciseAnimation(null, name)).toBeNull();
    expect(
      getExerciseAnimation("00000000-0000-4000-8000-000000000120"),
    ).toBe("front-lat-pulldown");
  });
  it("retains anatomical lengths, fixed seat and feet and exact bar contact through 201 poses", () => {
    const first = getExercisePose("lat-pulldown", 0);
    for (let i = 0; i <= 200; i++) {
      const pose = getExercisePose("lat-pulldown", i / 200);
      expect(pose.origin.distanceTo(first.origin)).toBeLessThan(1e-9);
      for (const [j, l] of pose.limbs.entries()) {
        expect(l.hip.distanceTo(first.limbs[j].hip)).toBeLessThan(1e-9);
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
        expect(l.grip.y).toBeCloseTo(pose.bar.y, 8);
        expect(l.grip.z).toBeCloseTo(pose.bar.z, 8);
        expect(l.elbow.x * l.side).toBeGreaterThan(0.21);
      }
      expect(pose.bar.z).toBeGreaterThan(0.13);
    }
    expect(first.bar.distanceTo(PULLDOWN_BAR_BOTTOM)).toBe(0);
    expect(
      getExercisePose("lat-pulldown", 1).bar.distanceTo(PULLDOWN_BAR_TOP),
    ).toBe(0);
    expect(getPulldownStackLift(first.bar)).toBeGreaterThan(0.5);
    expect(getPulldownStackLift(PULLDOWN_BAR_TOP)).toBe(0);
  });
  it("has continuous anatomical arm rotation without forearm/wrist discontinuities", () => {
    const names = [
      "upperArm_L",
      "upperArm_R",
      "forearm_L",
      "forearm_R",
      "hand_L",
      "hand_R",
    ];
    let previous: Map<string, import("three").Quaternion> | undefined;
    for (let i = 0; i <= 1000; i++) {
      const pose = apply("lat-pulldown", i / 1000);
      const current = new Map(
        names.map((n) => [n, bones.get(n)!.quaternion.clone()]),
      );
      if (previous)
        for (const n of names)
          expect(current.get(n)!.angleTo(previous.get(n)!)).toBeLessThan(0.03);
      for (const [j, suffix] of ["L", "R"].entries()) {
        expect(
          bones
            .get(`forearm_${suffix}`)!
            .quaternion.angleTo(pose.limbs[j].handRotation),
        ).toBeLessThan(1e-6);
        expect(
          bones
            .get(`wrist_${suffix}`)!
            .quaternion.angleTo(pose.limbs[j].handRotation),
        ).toBeLessThan(1e-6);
      }
      previous = current;
    }
  });
  it("highlights the reviewed back/arm surfaces and preserves both older packed masks", () => {
    const mask = createLatPulldownMuscleMask(mesh.geometry),
      packed = createPecDeckHangCleanAttribute(mesh.geometry),
      pec = createPecDeckMuscleMask(mesh.geometry),
      clean = createHangPowerCleanMuscleMask(mesh.geometry);
    expect(packed.itemSize).toBe(3);
    let mismatches = 0;
    for (let i = 0; i < mask.count; i++)
      if (
        packed.getX(i) !== pec.getX(i) ||
        packed.getY(i) !== clean.getX(i) ||
        packed.getZ(i) !== mask.getX(i)
      )
        mismatches++;
    expect(mismatches).toBe(0);
    for (const a of [upper, detail, arms, lower])
      for (const s of a.selections) {
        if (/^Latissimus|^Teres_major/.test(s.name))
          expect(mask.getX(s.indices[0])).toBe(1);
        if (
          /^Scapular_spinal|^Brachialis|^Brachioradialis|^Infraspinatus|^Rhomboid|^Long_head_of_biceps_brachii/.test(
            s.name,
          )
        )
          expect(mask.getX(s.indices[0])).toBeCloseTo(0.45);
        if (/pectoralis_major|^Gluteus|^Vastus|^Rectus_femoris/.test(s.name))
          expect(mask.getX(s.indices[0])).toBe(0);
      }
  });
  it("keeps the skinned mesh finite and clear of the shaft, with feet grounded", () => {
    const indices = mesh.geometry.attributes.skinIndex,
      weights = mesh.geometry.attributes.skinWeight;
    const hands = mesh.skeleton.bones
      .map((b, i) => (/^(hand|wrist)_[LR]$/.test(b.name) ? i : -1))
      .filter((i) => i >= 0);
    for (const d of [0, 0.1, 0.25, 0.4, 0.55, 0.7, 0.85, 1]) {
      const pose = apply("lat-pulldown", d);
      mesh.parent!.updateMatrixWorld(true);
      mesh.skeleton.update();
      let floor = Infinity,
        clearance = Infinity,
        finite = true;
      for (let i = 0; i < indices.count; i += 3) {
        const q = mesh.getVertexPosition(i, new Vector3());
        finite = finite && q.toArray().every(Number.isFinite);
        floor = Math.min(floor, q.y);
        const hand =
          [0, 1, 2, 3].reduce(
            (n, k) =>
              n +
              (hands.includes(indices.getComponent(i, k))
                ? weights.getComponent(i, k)
                : 0),
            0,
          ) > 0.5;
        if (!hand && Math.abs(q.x) < 0.43)
          clearance = Math.min(
            clearance,
            Math.hypot(q.y - pose.bar.y, q.z - pose.bar.z) - 0.017,
          );
      }
      expect(finite).toBe(true);
      expect(floor).toBeGreaterThan(-0.012);
      expect(floor).toBeLessThan(0.012);
      expect(clearance, `shaft at ${d}`).toBeGreaterThan(-0.005);
    }
  });
});
