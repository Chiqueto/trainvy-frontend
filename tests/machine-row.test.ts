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
  MACHINE_ROW_PIVOT,
  MACHINE_ROW_RADIUS,
  MACHINE_ROW_LEVER_X,
  MACHINE_ROW_PAD_CENTER,
  MACHINE_ROW_PAD_SIZE,
  getMachineRowLever,
} from "../app/_components/exercise-3d/machine-row-pose";
import {
  createMachineRowMuscleMask,
  createFlyMachineRowAttribute,
} from "../app/_components/exercise-3d/machine-row-muscles";
import { createFlyMuscleMask } from "../app/_components/exercise-3d/fly-muscles";
import back from "../app/_components/exercise-3d/deadlift-upper-back-map.json";
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
describe("chest-supported bilateral lever row", () => {
  it("resolves its bilateral machine variant without capturing the unilateral or cable rows", () => {
    expect(getExerciseAnimation("43025392-0466-46e7-82ab-27888d53f929")).toBe(
      "machine-row",
    );
    expect(getExerciseAnimation(null, "Remada Sentada na Máquina")).toBe(
      "machine-row",
    );
    expect(
      getExerciseAnimation(null, "Remada Unilateral na Máquina"),
    ).toBeNull();
    expect(getExerciseAnimation("120f29ac-733c-478b-8aa9-a3f4c22f5e70")).toBe(
      "cable-row",
    );
  });
  it("keeps lengths and supports fixed and hands on the same lever arc through 201 poses", () => {
    const first = getExercisePose("machine-row", 0);
    for (let i = 0; i <= 200; i++) {
      const p = i / 200,
        pose = getExercisePose("machine-row", p),
        lever = getMachineRowLever(p);
      expect(pose.origin.distanceTo(first.origin)).toBeLessThan(1e-9);
      expect(pose.bar.distanceTo(MACHINE_ROW_PIVOT)).toBeCloseTo(
        MACHINE_ROW_RADIUS,
        8,
      );
      expect(
        new Vector3(0, MACHINE_ROW_RADIUS, 0)
          .applyQuaternion(lever.rotation)
          .add(MACHINE_ROW_PIVOT)
          .distanceTo(pose.bar),
      ).toBeLessThan(1e-9);
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
        expect(l.elbow.x * l.side).toBeGreaterThan(0.2);
      }
    }
    for (const l of getExercisePose("machine-row", 1).limbs) {
      const flexion =
        Math.PI -
        l.shoulder.clone().sub(l.elbow).angleTo(l.wrist.clone().sub(l.elbow));
      expect((flexion * 180) / Math.PI).toBeLessThan(35);
    }
    expect(
      getExercisePose("machine-row", 0).bar.distanceTo(
        getExercisePose("cable-row", 0).bar,
      ),
    ).toBeGreaterThan(0.08);
  });
  it("keeps arm rotation continuous and wrist/forearm aligned through 1001 poses", () => {
    const names = [
      "upperArm_L",
      "upperArm_R",
      "forearm_L",
      "forearm_R",
      "hand_L",
      "hand_R",
    ];
    let previous: Map<string, Quaternion> | undefined;
    for (let i = 0; i <= 1000; i++) {
      const pose = apply("machine-row", i / 1000),
        current = new Map(
          names.map((n) => [n, bones.get(n)!.quaternion.clone()]),
        );
      if (previous)
        for (const n of names)
          expect(current.get(n)!.angleTo(previous.get(n)!)).toBeLessThan(0.03);
      for (const [j, s] of ["L", "R"].entries()) {
        expect(
          bones
            .get(`forearm_${s}`)!
            .quaternion.angleTo(pose.limbs[j].handRotation),
        ).toBeLessThan(1e-6);
        expect(
          bones
            .get(`wrist_${s}`)!
            .quaternion.angleTo(pose.limbs[j].handRotation),
        ).toBeLessThan(1e-6);
      }
      previous = current;
    }
  });
  it("preserves the entire fly channel and explicitly maps the reviewed row participants", () => {
    const mask = createMachineRowMuscleMask(mesh.geometry),
      packed = createFlyMachineRowAttribute(mesh.geometry),
      fly = createFlyMuscleMask(mesh.geometry);
    expect(packed.itemSize).toBe(2);
    let mismatches = 0;
    for (let i = 0; i < mask.count; i++)
      if (packed.getX(i) !== fly.getX(i) || packed.getY(i) !== mask.getX(i))
        mismatches++;
    expect(mismatches).toBe(0);
    for (const atlas of [back, detail, arms, lower])
      for (const s of atlas.selections) {
        if (
          /^Latissimus|^Teres_major|^Transverse_part_of_trapezius|^Rhomboid/.test(
            s.name,
          )
        )
          expect(mask.getX(s.indices[0])).toBe(1);
        if (
          /^Scapular_spinal|^Brachialis|^Long_head_of_biceps_brachii/.test(
            s.name,
          )
        )
          expect(mask.getX(s.indices[0])).toBeCloseTo(0.45);
        if (/pectoralis_major|^Gluteus|^Vastus|^Rectus_femoris/.test(s.name))
          expect(mask.getX(s.indices[0])).toBe(0);
      }
  });
  it("keeps tissue finite, soles on the floor, chest by the pad and arms clear of lever shafts", () => {
    for (const p of [0, 0.2, 0.4, 0.6, 0.8, 1]) {
      const pose = apply("machine-row", p);
      mesh.parent!.updateMatrixWorld(true);
      mesh.skeleton.update();
      let finite = true,
        floor = Infinity,
        chestFront = -Infinity,
        shaftGap = Infinity;
      const ids = mesh.geometry.attributes.skinIndex,
        w = mesh.geometry.attributes.skinWeight;
      for (let i = 0; i < ids.count; i += 3) {
        const q = mesh.getVertexPosition(i, new Vector3());
        finite = finite && q.toArray().every(Number.isFinite);
        floor = Math.min(floor, q.y);
        if (
          Math.abs(q.x) < MACHINE_ROW_PAD_SIZE[0] / 2 &&
          Math.abs(q.y - MACHINE_ROW_PAD_CENTER.y) < MACHINE_ROW_PAD_SIZE[1] / 2
        )
          chestFront = Math.max(chestFront, q.z);
        const arm =
          [0, 1, 2, 3].reduce(
            (n, k) =>
              n +
              (/^(upperArm|forearm|elbow)_[LR]$/.test(
                mesh.skeleton.bones[ids.getComponent(i, k)]?.name ?? "",
              )
                ? w.getComponent(i, k)
                : 0),
            0,
          ) > 0.6;
        if (arm)
          for (const side of [-1, 1]) {
            const start = MACHINE_ROW_PIVOT.clone().setX(
                side * MACHINE_ROW_LEVER_X,
              ),
              end = pose.bar.clone().setX(side * MACHINE_ROW_LEVER_X),
              axis = end.clone().sub(start);
            const t = Math.max(
              0,
              Math.min(1, q.clone().sub(start).dot(axis) / axis.lengthSq()),
            );
            shaftGap = Math.min(
              shaftGap,
              q.distanceTo(start.addScaledVector(axis, t)) - 0.023,
            );
          }
      }
      expect(finite).toBe(true);
      expect(floor).toBeGreaterThan(-0.012);
      expect(floor).toBeLessThan(0.012);
      const contact =
        chestFront - (MACHINE_ROW_PAD_CENTER.z - MACHINE_ROW_PAD_SIZE[2] / 2);
      expect(contact, `pad contact ${p}`).toBeGreaterThan(-0.04);
      expect(contact, `pad penetration ${p}`).toBeLessThan(0.012);
      expect(shaftGap, `shaft ${p}`).toBeGreaterThan(-0.005);
    }
  });
});
