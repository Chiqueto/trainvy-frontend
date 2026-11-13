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
  CABLE_ROW_ANKLE,
  CABLE_ROW_HANDLE_TOP,
  getCableRowAttachment,
  getCableRowHandleRotation,
  getCableRowStackLift,
} from "../app/_components/exercise-3d/cable-row-pose";
import { createCableRowMuscleMask } from "../app/_components/exercise-3d/cable-row-muscles";
import { createLatPulldownMuscleMask } from "../app/_components/exercise-3d/lat-pulldown-muscles";
import { createPecDeckHangCleanAttribute } from "../app/_components/exercise-3d/hang-power-clean-muscles";
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
describe("neutral triangle seated cable row", () => {
  it("resolves only its exact variant", () => {
    expect(getExerciseAnimation("120f29ac-733c-478b-8aa9-a3f4c22f5e70")).toBe(
      "cable-row",
    );
    expect(
      getExerciseAnimation(null, "Remada Baixa no Cabo com Triângulo"),
    ).toBe("cable-row");
    for (const n of [
      "Remada baixa com barra aberta",
      "Remada unilateral no cabo",
      "Remada curvada",
    ])
      expect(getExerciseAnimation(null, n)).toBeNull();
  });
  it("keeps seat, feet, lengths, neutral grip and the triangle attached through 201 poses", () => {
    const first = getExercisePose("cable-row", 0);
    for (let i = 0; i <= 200; i++) {
      const pose = getExercisePose("cable-row", i / 200);
      expect(pose.origin.distanceTo(first.origin)).toBeLessThan(1e-9);
      for (const [j, l] of pose.limbs.entries()) {
        expect(l.hip.distanceTo(first.limbs[j].hip)).toBeLessThan(1e-9);
        expect(
          l.ankle.distanceTo(CABLE_ROW_ANKLE.clone().setX(l.side * 0.17)),
        ).toBeLessThan(1e-9);
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
        const shaft = new Vector3(1, 0, 0).applyQuaternion(l.handRotation),
          handleAxis = new Vector3(0, 1, 0).applyQuaternion(
            getCableRowHandleRotation(pose),
          );
        expect(Math.abs(shaft.dot(handleAxis))).toBeGreaterThan(0.99);
        expect(l.elbow.x * l.side).toBeGreaterThan(0.16);
        expect(l.knee.y).toBeGreaterThan(l.ankle.y);
      }
      expect(getCableRowAttachment(pose).distanceTo(pose.bar)).toBeCloseTo(
        0.14,
        8,
      );
    }
    expect(
      getExercisePose("cable-row", 1).bar.distanceTo(CABLE_ROW_HANDLE_TOP),
    ).toBe(0);
    expect(getCableRowStackLift(first)).toBeGreaterThan(0.15);
    expect(getCableRowStackLift(getExercisePose("cable-row", 1))).toBe(0);
  });
  it("avoids arm spin and keeps forearm and wrist coherent through 1001 poses", () => {
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
      const pose = apply("cable-row", i / 1000),
        current = new Map(
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
  it("maps scapular retractors as row prime movers and keeps the older packed masks intact", () => {
    const mask = createCableRowMuscleMask(mesh.geometry),
      pull = createLatPulldownMuscleMask(mesh.geometry),
      packed = createPecDeckHangCleanAttribute(mesh.geometry);
    expect(packed.itemSize).toBe(4);
    let mismatches = 0;
    for (let i = 0; i < mask.count; i++)
      if (packed.getW(i) !== mask.getX(i) || packed.getZ(i) !== pull.getX(i))
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
        if (/^Rhomboid/.test(s.name))
          expect(pull.getX(s.indices[0])).toBeCloseTo(0.45);
      }
  });
  it("keeps the skinned tissue finite, feet on their platform and the handle out of the torso", () => {
    for (const p of [0, 0.2, 0.4, 0.6, 0.8, 1]) {
      const pose = apply("cable-row", p);
      mesh.parent!.updateMatrixWorld(true);
      mesh.skeleton.update();
      let finite = true,
        floor = Infinity,
        clearance = Infinity;
      const ids = mesh.geometry.attributes.skinIndex,
        w = mesh.geometry.attributes.skinWeight;
      for (let i = 0; i < ids.count; i += 3) {
        const q = mesh.getVertexPosition(i, new Vector3());
        finite = finite && q.toArray().every(Number.isFinite);
        floor = Math.min(floor, q.y);
        const trunk =
          [0, 1, 2, 3].reduce(
            (n, k) =>
              n +
              (/^(root|spine|chest|pelvis)/.test(
                mesh.skeleton.bones[ids.getComponent(i, k)]?.name ?? "",
              )
                ? w.getComponent(i, k)
                : 0),
            0,
          ) > 0.6;
        if (trunk) clearance = Math.min(clearance, q.distanceTo(pose.bar));
      }
      expect(finite).toBe(true);
      expect(floor).toBeGreaterThan(0.07);
      expect(clearance, `trunk clearance ${p}`).toBeGreaterThan(0.04);
    }
  });
});
