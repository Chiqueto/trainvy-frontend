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
  getExerciseProgress,
} from "../app/_components/exercise-3d/kinematics";
import { getExerciseAnimation } from "../app/_components/exercise-3d/exercises";
import {
  createHangPowerCleanMuscleMask,
  createPecDeckHangCleanAttribute,
} from "../app/_components/exercise-3d/hang-power-clean-muscles";
import { createPecDeckMuscleMask } from "../app/_components/exercise-3d/pec-deck-muscles";
import arm from "../app/_components/exercise-3d/fly-muscle-map.json";
import calf from "../app/_components/exercise-3d/standing-calf-muscle-map.json";
import lower from "../app/_components/exercise-3d/sumo-dumbbell-muscle-map.json";
import { getHangPowerCleanPhaseLabel } from "../app/_components/exercise-3d/hang-power-clean-pose";
let mesh: SkinnedMesh, apply: ReturnType<typeof createPoseDriver>;
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
  apply = createPoseDriver(bones);
});
describe("hang power clean", () => {
  it("selects only this barbell variant", () => {
    expect(getExerciseAnimation("1b7764ca-1826-488e-8734-fc88117ed9dd")).toBe(
      "hang-power-clean",
    );
    expect(getExerciseAnimation(null, "Hang Power Clean")).toBe(
      "hang-power-clean",
    );
    for (const name of [
      "Power Clean",
      "Hang Clean",
      "Hang Power Clean com Halteres",
      "Clean and Jerk",
    ])
      expect(getExerciseAnimation(null, name)).toBeNull();
  });
  it("uses the whole ballistic cycle and a genuine above-parallel catch", () => {
    const hang = getExercisePose("hang-power-clean", 0.3),
      drive = getExercisePose("hang-power-clean", 0.37),
      catchPose = getExercisePose("hang-power-clean", 0.45),
      standing = getExercisePose("hang-power-clean", 0.65);
    expect(getExerciseProgress("hang-power-clean", 0.3)).toBeCloseTo(0.3);
    expect(getHangPowerCleanPhaseLabel(0.45)).toMatch(/Recepção/);
    expect(hang.bar.y).toBeGreaterThan(hang.limbs[0].knee.y);
    expect(drive.limbs[0].hip.y - hang.limbs[0].hip.y).toBeGreaterThan(0.07);
    expect(catchPose.limbs[0].hip.y).toBeGreaterThan(catchPose.limbs[0].knee.y);
    expect(catchPose.limbs[0].elbow.z).toBeGreaterThan(
      catchPose.limbs[0].wrist.z + 0.12,
    );
    expect(catchPose.limbs[0].elbow.y).toBeGreaterThan(
      catchPose.limbs[0].shoulder.y - 0.04,
    );
    expect(
      Math.abs(catchPose.bar.y - catchPose.limbs[0].shoulder.y),
    ).toBeLessThan(0.06);
    expect(standing.limbs[0].hip.y).toBeGreaterThan(
      catchPose.limbs[0].hip.y + 0.1,
    );
  });
  it("preserves bone lengths and grips at 401 samples, without foot sliding during the catch", () => {
    for (let i = 0; i <= 400; i++) {
      const p = i / 400,
        pose = getExercisePose("hang-power-clean", p);
      for (const l of pose.limbs) {
        expect(l.hip.distanceTo(l.knee), `femur ${p}`).toBeCloseTo(0.44, 6);
        expect(l.knee.distanceTo(l.ankle), `shin ${p}`).toBeCloseTo(0.42, 6);
        expect(l.shoulder.distanceTo(l.elbow), `upper arm ${p}`).toBeCloseTo(
          ARM_LENGTH,
          6,
        );
        expect(l.elbow.distanceTo(l.wrist), `forearm ${p}`).toBeCloseTo(
          FOREARM_LENGTH,
          6,
        );
        expect(l.grip.distanceTo(pose.bar.clone().setX(l.grip.x))).toBeLessThan(
          1e-6,
        );
        expect(
          l.wrist
            .clone()
            .add(new Vector3(0, 0.004, 0.012).applyQuaternion(l.handRotation))
            .distanceTo(l.grip),
        ).toBeLessThan(1e-5);
        if (p >= 0.43 && p <= 0.68)
          expect(
            l.ankle.distanceTo(new Vector3(l.side * 0.2, 0.05, 0.08)),
          ).toBeLessThan(1e-8);
      }
    }
    const first = getExercisePose("hang-power-clean", 0),
      last = getExercisePose("hang-power-clean", 1);
    expect(first.bar.distanceTo(last.bar)).toBeLessThan(1e-8);
  });
  it("uses explicit muscle identities and keeps the packed pec-deck channel intact", () => {
    const mask = createHangPowerCleanMuscleMask(mesh.geometry),
      packed = createPecDeckHangCleanAttribute(mesh.geometry),
      pec = createPecDeckMuscleMask(mesh.geometry);
    expect(packed.itemSize).toBe(4);
    for (const a of [lower, calf, arm])
      for (const s of a.selections) {
        if (/^Vastus_lateralis_muscle|^Gluteus_maximus_muscle/.test(s.name))
          expect(mask.getX(s.indices[0])).toBe(1);
        if (
          /^Soleus_muscle|^Clavicular_part_of_deltoid_muscle|^Long_head_of_biceps_brachii/.test(
            s.name,
          )
        )
          expect(mask.getX(s.indices[0])).toBeCloseTo(0.45);
        if (/pectoralis_major/.test(s.name))
          expect(mask.getX(s.indices[0])).toBe(0);
      }
    let different = 0;
    for (let i = 0; i < mask.count; i++) {
      if (packed.getX(i) !== pec.getX(i) || packed.getY(i) !== mask.getX(i))
        different++;
    }
    expect(different).toBe(0);
  });
  it("keeps actual tissue finite, feet grounded in the catch and the shaft clear through turnover", () => {
    const indices = mesh.geometry.attributes.skinIndex,
      weights = mesh.geometry.attributes.skinWeight;
    const hands = mesh.skeleton.bones
      .map((b, i) => (/^(hand|wrist)_[LR]$/.test(b.name) ? i : -1))
      .filter((i) => i >= 0);
    for (const phase of [
      0, 0.28, 0.34, 0.37, 0.395, 0.405, 0.41, 0.415, 0.42, 0.43, 0.48, 0.62,
      0.68, 0.72, 0.75, 0.8, 0.85, 0.9, 1,
    ]) {
      const pose = apply("hang-power-clean", phase);
      mesh.parent!.updateMatrixWorld(true);
      mesh.skeleton.update();
      let finite = true,
        ground = Infinity,
        gap = Infinity;
      let closest = "";
      const gripGap = [Infinity, Infinity];
      for (let i = 0; i < mesh.geometry.attributes.position.count; i += 5) {
        const q = mesh.getVertexPosition(i, new Vector3());
        finite = finite && q.toArray().every(Number.isFinite);
        ground = Math.min(ground, q.y);
        const hand =
          [0, 1, 2, 3].reduce(
            (sum, k) =>
              sum +
              (hands.includes(indices.getComponent(i, k))
                ? weights.getComponent(i, k)
                : 0),
            0,
          ) > 0.5;
        const distance = Math.hypot(q.y - pose.bar.y, q.z - pose.bar.z) - 0.014;
        if (!hand && Math.abs(q.x) < 0.7 && distance < gap) {
          gap = distance;
          closest = [0, 1, 2, 3]
            .map(
              (k) =>
                `${mesh.skeleton.bones[indices.getComponent(i, k)]?.name}:${weights.getComponent(i, k).toFixed(2)}`,
            )
            .join(",");
        }
        if (hand && Math.abs(q.x) > 0.23 && Math.abs(q.x) < 0.36) {
          const side = q.x < 0 ? 0 : 1;
          gripGap[side] = Math.min(gripGap[side], Math.abs(distance));
        }
      }
      expect(finite).toBe(true);
      expect(ground, `ground ${phase}`).toBeGreaterThan(-0.012);
      if (phase >= 0.43 && phase <= 0.68) expect(ground).toBeLessThan(0.012);
      expect(gap, `shaft ${phase} ${closest}`).toBeGreaterThan(-0.005);
      if (phase === 0.43 || phase === 0.62)
        expect(gap, `rack contact ${phase}`).toBeLessThan(0.02);
      expect(Math.max(...gripGap), `grip ${phase}`).toBeLessThan(0.018);
    }
  });
});
