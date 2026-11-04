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
import {
  SUMO_HEAD_OFFSET,
  SUMO_HEAD_RADIUS,
} from "../app/_components/exercise-3d/sumo-dumbbell-pose";
import { createSumoDumbbellMuscleMask } from "../app/_components/exercise-3d/sumo-dumbbell-muscles";
import { createGobletSquatMuscleMask } from "../app/_components/exercise-3d/goblet-squat-muscles";
import map from "../app/_components/exercise-3d/sumo-dumbbell-muscle-map.json";
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

describe("wide stance squat with a suspended dumbbell", () => {
  it("recognizes its exact variant and excludes barbell sumo, kettlebells and sumo deadlifts", () => {
    expect(
      getExerciseAnimation(EXERCISE_ANIMATIONS["sumo-dumbbell-squat"].id),
    ).toBe("sumo-dumbbell-squat");
    for (const name of [
      "Agachamento Sumô com Halter",
      "Dumbbell sumo squat",
      "Sumo dumbbell squat",
    ])
      expect(getExerciseAnimation(null, name)).toBe("sumo-dumbbell-squat");
    for (const name of [
      "Agachamento sumô com barra",
      "Sumo squat",
      "Agachamento sumô com kettlebell",
    ])
      expect(getExerciseAnimation(null, name)).toBeNull();
    expect(getExerciseAnimation(null, "Sumo deadlift")).toBe("sumo-deadlift");
  });

  it("uses a wider fixed stance than Goblet, tracks the toes and preserves the real limb lengths", () => {
    const top = getExercisePose("sumo-dumbbell-squat", 0),
      goblet = getExercisePose("goblet-squat", 0);
    expect(Math.abs(top.limbs[0].ankle.x)).toBeGreaterThan(
      Math.abs(goblet.limbs[0].ankle.x) + 0.1,
    );
    for (let step = 0; step <= 100; step++) {
      const pose = getExercisePose("sumo-dumbbell-squat", step / 100);
      for (const [index, l] of pose.limbs.entries()) {
        expect(l.ankle.distanceTo(top.limbs[index].ankle)).toBe(0);
        expect(
          l.footRotation.angleTo(top.limbs[index].footRotation),
        ).toBeLessThan(1e-7);
        expect(l.hip.distanceTo(l.knee)).toBeCloseTo(0.44, 9);
        expect(l.knee.distanceTo(l.ankle)).toBeCloseTo(0.42, 9);
        expect(l.shoulder.distanceTo(l.elbow)).toBeCloseTo(ARM_LENGTH, 9);
        expect(l.elbow.distanceTo(l.wrist)).toBeCloseTo(FOREARM_LENGTH, 9);
        const forward = new Vector3(0, 0, 1).applyQuaternion(l.footRotation);
        expect((Math.atan2(forward.x, forward.z) * 180) / Math.PI).toBeCloseTo(
          l.side * 35,
          8,
        );
        const tracking =
          l.knee.x -
          l.ankle.x -
          l.side * Math.tan((35 * Math.PI) / 180) * (l.knee.z - l.ankle.z);
        expect(Math.abs(tracking)).toBeLessThan(0.005);
        const flexion =
          180 -
          (l.shoulder
            .clone()
            .sub(l.elbow)
            .angleTo(l.wrist.clone().sub(l.elbow)) *
            180) /
            Math.PI;
        expect(flexion).toBeCloseTo(8, 6);
      }
    }
    const low = getExercisePose("sumo-dumbbell-squat", 1);
    expect(Math.abs(low.limbs[0].hip.y - low.limbs[0].knee.y)).toBeLessThan(
      0.04,
    );
    expect(low.bar.y).toBeLessThan(top.bar.y - 0.35);
    expect(low.bar.y - SUMO_HEAD_OFFSET - 0.04).toBeGreaterThan(0.04);
    expect(low.bar.y).toBeLessThan(low.limbs[0].knee.y);
  });

  it("lowers under control, pauses and rises smoothly without pulling the load toward the chest", () => {
    const height = (phase: number) =>
      getExercisePose("sumo-dumbbell-squat", getExerciseDepth(phase)).bar.y;
    expect(height(0)).toBeGreaterThan(height(0.25));
    expect(height(0.25)).toBeGreaterThan(height(0.48));
    expect(height(0.48)).toBeCloseTo(height(0.53), 9);
    expect(height(0.75)).toBeGreaterThan(height(0.54));
    expect(height(1)).toBeCloseTo(height(0), 9);
  });

  it("maps the reviewed adductors as primary without inheriting Goblet's arm emphasis", () => {
    const sumo = createSumoDumbbellMuscleMask(mesh.geometry),
      goblet = createGobletSquatMuscleMask(mesh.geometry);
    expect(map.baseAssetSha256).toBe(manifest.sha256);
    expect(new Set(map.selections.map((s) => s.name)).size).toBe(42);
    for (const s of map.selections) {
      const primary =
        /Rectus_femoris|Vastus|Gluteus_maximus|Adductor_(magnus|longus)/.test(
          s.name,
        );
      expect(s.role).toBe(primary ? 1 : 0.45);
      expect(s.confidence).toBeGreaterThanOrEqual(0.8);
      for (const i of s.indices) {
        expect(sumo.getX(i)).toBeCloseTo(s.role);
        if (/Adductor_magnus/.test(s.name))
          expect(goblet.getX(i)).toBeCloseTo(0.45);
        if (/Adductor_longus|Gluteus_medius/.test(s.name))
          expect(goblet.getX(i)).toBe(0);
      }
    }
  });

  it("maintains bilateral contact on the upper head, grounded soles and clearance from the real thighs", () => {
    const positions = mesh.geometry.attributes.position,
      indices = mesh.geometry.attributes.skinIndex,
      weights = mesh.geometry.attributes.skinWeight;
    const handIds = [-1, 1].map((side) =>
      mesh.skeleton.bones.findIndex(
        (b) => b.name === (side < 0 ? "hand_L" : "hand_R"),
      ),
    );
    const vertices = handIds.map((id) =>
      Array.from({ length: positions.count }, (_, i) => i).filter((i) =>
        [0, 1, 2, 3].some(
          (k) =>
            indices.getComponent(i, k) === id &&
            weights.getComponent(i, k) > 0.8,
        ),
      ),
    );
    for (const depth of [0, 0.25, 0.5, 0.75, 1]) {
      const pose = apply("sumo-dumbbell-squat", depth);
      mesh.parent!.updateMatrixWorld(true);
      mesh.skeleton.update();
      for (const [j, l] of pose.limbs.entries()) {
        const center = new Vector3();
        let contact = Infinity;
        for (const i of vertices[j]) {
          const p = mesh.getVertexPosition(i, new Vector3()).sub(pose.bar);
          center.add(p);
          if (Math.abs(p.y - SUMO_HEAD_OFFSET) < 0.04)
            contact = Math.min(
              contact,
              Math.abs(Math.hypot(p.x, p.z) - SUMO_HEAD_RADIUS),
            );
        }
        center.divideScalar(vertices[j].length);
        expect(center.x).toBeCloseTo(l.side * 0.095, 5);
        expect(center.y).toBeCloseTo(SUMO_HEAD_OFFSET, 5);
        expect(center.z).toBeCloseTo(0, 5);
        expect(contact).toBeLessThan(0.012);
        const axis = new Vector3(l.side * 0.025, -0.265, 0.03)
          .normalize()
          .applyQuaternion(mesh.skeleton.bones[handIds[j]].quaternion);
        expect(
          axis.dot(l.wrist.clone().sub(l.elbow).normalize()),
        ).toBeGreaterThan(0.99999);
      }
      let ground = Infinity,
        legGap = Infinity,
        bodyClearance = Infinity;
      for (let i = 0; i < positions.count; i += 7) {
        const p = mesh.getVertexPosition(i, new Vector3());
        expect(p.toArray().every(Number.isFinite)).toBe(true);
        ground = Math.min(ground, p.y);
        const handVertex = handIds.some((id) =>
          [0, 1, 2, 3].some(
            (k) =>
              indices.getComponent(i, k) === id &&
              weights.getComponent(i, k) > 0.5,
          ),
        );
        if (!handVertex) {
          const radial =
            Math.hypot(p.x - pose.bar.x, p.z - pose.bar.z) - SUMO_HEAD_RADIUS;
          for (const sign of [-1, 1]) {
            const axial =
              Math.abs(p.y - pose.bar.y - sign * SUMO_HEAD_OFFSET) - 0.04;
            const gap =
              Math.hypot(Math.max(radial, 0), Math.max(axial, 0)) +
              Math.min(Math.max(radial, axial), 0);
            bodyClearance = Math.min(bodyClearance, gap);
          }
        }
        if (
          Math.abs(p.y - pose.bar.y) < 0.17 &&
          Math.abs(p.z - pose.bar.z) < 0.08 &&
          Math.abs(p.x) > 0.14
        )
          legGap = Math.min(legGap, Math.abs(p.x) - SUMO_HEAD_RADIUS);
      }
      expect(ground).toBeGreaterThan(-0.01);
      expect(ground).toBeLessThan(0.01);
      expect(legGap).toBeGreaterThan(0.035);
      expect(bodyClearance).toBeGreaterThan(-0.004);
    }
  });
});
