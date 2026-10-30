// @vitest-environment node
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
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
import {
  getHipAbductionLeverAngle,
  getHipAbductionPadCenter,
  HIP_ABDUCTION_PAD,
} from "../app/_components/exercise-3d/hip-abduction-pose";
import { createHipAbductionMuscleMask } from "../app/_components/exercise-3d/hip-abduction-muscles";
import { createSmithSquatMuscleMask } from "../app/_components/exercise-3d/smith-squat-muscles";
import { createHipMachineMuscleAttribute } from "../app/_components/exercise-3d/hip-machine-muscles";
import map from "../app/_components/exercise-3d/hip-abduction-muscle-map.json";
import provenance from "../public/models/exercise-3d/hip-abduction-supplement.json";
import manifest from "../public/models/exercise-3d/model-manifest.json";

let mesh: SkinnedMesh, supplement: SkinnedMesh;
let apply: ReturnType<typeof createPoseDriver>;
beforeAll(async () => {
  const load = async (file: string) => {
    const bytes = await readFile(
      new URL(`../public/models/exercise-3d/${file}`, import.meta.url),
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
    return { scene, bytes };
  };
  const base = await load("trainvy-athlete.glb");
  const bones = new Map<string, Bone>();
  base.scene.traverse((o) => {
    if (o instanceof Bone) bones.set(o.name, o);
    if (o instanceof SkinnedMesh) mesh = o;
  });
  apply = createPoseDriver(bones);
  const extra = await load(provenance.asset);
  expect(createHash("sha256").update(extra.bytes).digest("hex")).toBe(
    provenance.sha256,
  );
  extra.scene.traverse((o) => {
    if (o instanceof SkinnedMesh) supplement = o;
  });
  supplement.bind(mesh.skeleton, mesh.bindMatrix);
});

describe("supported seated hip abduction", () => {
  it("recognizes only the seated machine variant", () => {
    expect(getExerciseAnimation(EXERCISE_ANIMATIONS["hip-abduction"].id)).toBe(
      "hip-abduction",
    );
    for (const name of [
      "Cadeira Abdutora",
      "Abdução de quadril na máquina sentada",
      "Seated hip abduction machine",
    ])
      expect(getExerciseAnimation(null, name)).toBe("hip-abduction");
    for (const name of [
      "Cadeira Adutora",
      "Abdução em pé",
      "Clamshell",
      "Abdução deitada",
      "Abdução na polia",
    ])
      expect(getExerciseAnimation(null, name)).toBeNull();
  });

  it("opens symmetrically around fixed hips while preserving 90-degree knees, bone lengths, grips and torso", () => {
    const top = getExercisePose("hip-abduction", 0);
    for (let i = 0; i <= 100; i++) {
      const pose = getExercisePose("hip-abduction", i / 100);
      expect(pose.origin.distanceTo(top.origin)).toBe(0);
      expect(pose.tilt.angleTo(top.tilt)).toBe(0);
      for (const [index, l] of pose.limbs.entries()) {
        expect(l.hip.distanceTo(top.limbs[index].hip)).toBe(0);
        expect(l.grip.distanceTo(top.limbs[index].grip)).toBe(0);
        expect(l.hip.distanceTo(l.knee)).toBeCloseTo(0.44, 9);
        expect(l.knee.distanceTo(l.ankle)).toBeCloseTo(0.42, 9);
        expect(l.shoulder.distanceTo(l.elbow)).toBeCloseTo(ARM_LENGTH, 9);
        expect(l.elbow.distanceTo(l.wrist)).toBeCloseTo(FOREARM_LENGTH, 9);
        expect(l.knee.y).toBeCloseTo(l.hip.y, 9);
        expect(
          l.knee.clone().sub(l.hip).dot(l.ankle.clone().sub(l.knee)),
        ).toBeCloseTo(0, 9);
        const toeDirection = new Vector3(0, 0, 1).applyQuaternion(
          l.footRotation,
        );
        expect(
          toeDirection.dot(l.knee.clone().sub(l.hip).normalize()),
        ).toBeCloseTo(1, 9);
        const angle = getHipAbductionLeverAngle(l);
        expect((Math.abs(angle) * 180) / Math.PI).toBeCloseTo(35 - 0.3 * i, 7);
        const pad = getHipAbductionPadCenter(l)
          .sub(l.hip)
          .applyAxisAngle(new Vector3(0, 1, 0), -angle);
        expect(pad.x).toBeCloseTo(l.side * HIP_ABDUCTION_PAD.x, 9);
        expect(pad.z).toBeCloseTo(HIP_ABDUCTION_PAD.z, 9);
      }
      expect(pose.limbs[0].knee.x).toBeCloseTo(-pose.limbs[1].knee.x, 9);
    }
  });

  it("returns eccentrically, pauses and abducts smoothly", () => {
    const width = (phase: number) =>
      Math.abs(
        getExercisePose("hip-abduction", getExerciseDepth(phase)).limbs[0].knee
          .x,
      );
    expect(width(0)).toBeGreaterThan(width(0.25));
    expect(width(0.25)).toBeGreaterThan(width(0.48));
    expect(width(0.48)).toBeCloseTo(width(0.53), 9);
    expect(width(0.75)).toBeGreaterThan(width(0.54));
    expect(width(1)).toBeCloseTo(width(0), 9);
  });

  it("maps the named base muscles and supplies the missing licensed minimus/TFL without painting substitutes", () => {
    const mask = createHipAbductionMuscleMask(mesh.geometry);
    expect(map.baseAssetSha256).toBe(manifest.sha256);
    expect(map.selections).toHaveLength(4);
    for (const s of map.selections) {
      expect(s.confidence).toBeGreaterThanOrEqual(0.8);
      const role = /medius/.test(s.name) ? 1 : 0.45;
      for (const i of s.indices) expect(mask.getX(i)).toBeCloseTo(role);
    }
    expect(provenance.baseAssetSha256).toBe(manifest.sha256);
    expect(provenance.license).toBe("CC-BY-SA-4.0");
    expect(provenance.structures.map((s) => s.name).sort()).toEqual([
      "Gluteus_minimus_musclel",
      "Gluteus_minimus_muscler",
      "Tensor_fasciae_latael",
      "Tensor_fasciae_lataer",
    ]);
    expect(mesh.skeleton.bones.map((b) => b.name)).toEqual(provenance.bones);
    const weights = supplement.geometry.attributes.skinWeight;
    for (let i = 0; i < weights.count; i++)
      expect(
        weights.getX(i) + weights.getY(i) + weights.getZ(i) + weights.getW(i),
      ).toBeCloseTo(1, 5);
  });

  it("keeps Smith and abductor selections independent while using one GPU attribute", () => {
    const packed = createHipMachineMuscleAttribute(mesh.geometry);
    const smith = createSmithSquatMuscleMask(mesh.geometry),
      abduction = createHipAbductionMuscleMask(mesh.geometry);
    expect(packed.itemSize).toBe(2);
    for (let i = 0; i < packed.count; i++) {
      expect(packed.getX(i)).toBe(smith.getX(i));
      expect(packed.getY(i)).toBe(abduction.getX(i));
    }
  });

  it("keeps skinned soles on moving footrests and outer pads touching the lateral thighs", () => {
    for (const depth of [0, 0.5, 1]) {
      const pose = apply("hip-abduction", depth);
      mesh.parent!.updateMatrixWorld(true);
      mesh.skeleton.update();
      for (const l of pose.limbs) {
        let sole = Infinity,
          outer = -Infinity;
        const angle = getHipAbductionLeverAngle(l);
        for (let i = 0; i < mesh.geometry.attributes.position.count; i += 5) {
          const p = mesh.getVertexPosition(i, new Vector3());
          expect(p.toArray().every(Number.isFinite)).toBe(true);
          const local = p
            .clone()
            .sub(l.hip)
            .applyAxisAngle(new Vector3(0, 1, 0), -angle);
          if (Math.abs(local.x) < 0.085 && local.z > 0.38 && p.y < 0.3)
            sole = Math.min(sole, p.y);
          if (
            Math.abs(local.z - HIP_ABDUCTION_PAD.z) < 0.065 &&
            Math.abs(local.y) < 0.06 &&
            l.side * local.x > 0
          )
            outer = Math.max(outer, l.side * local.x);
        }
        expect(sole).toBeGreaterThan(0.2);
        expect(sole).toBeLessThan(0.22);
        const clearance =
          HIP_ABDUCTION_PAD.x - HIP_ABDUCTION_PAD.width / 2 - outer;
        expect(clearance).toBeGreaterThan(-0.01);
        expect(clearance).toBeLessThan(0.035);
      }
      for (let i = 0; i < supplement.geometry.attributes.position.count; i++)
        expect(
          supplement
            .getVertexPosition(i, new Vector3())
            .toArray()
            .every(Number.isFinite),
        ).toBe(true);
    }
  });
});
