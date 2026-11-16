// @vitest-environment node
import { readFile } from "node:fs/promises";
import { beforeAll, describe, expect, it } from "vitest";
import { Bone, Quaternion, SkinnedMesh, Vector3 } from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "meshoptimizer";
import { installScapularRig } from "../app/_components/exercise-3d/scapular-rig";
import {
  getScapularMotion,
  PULLING_EXERCISES,
} from "../app/_components/exercise-3d/scapular-motion";
import {
  ARM_LENGTH,
  FOREARM_LENGTH,
  createPoseDriver,
  getExercisePose,
} from "../app/_components/exercise-3d/kinematics";
import { createHighRowMuscleMask } from "../app/_components/exercise-3d/high-row-muscles";
import { createBentRowMuscleMask } from "../app/_components/exercise-3d/bent-row-muscles";
import back from "../app/_components/exercise-3d/deadlift-upper-back-map.json";
import detail from "../app/_components/exercise-3d/lat-pulldown-detail-map.json";
import {
  EXERCISE_ANIMATIONS,
  getExerciseAnimation,
} from "../app/_components/exercise-3d/exercises";
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
  installScapularRig(mesh, bones);
  apply = createPoseDriver(bones);
});
describe("scapular motion across every implemented row and pulldown", () => {
  it.each(PULLING_EXERCISES)(
    "%s retains segment lengths, fixed supports and continuous rotations",
    (exercise) => {
      const start = getExercisePose(exercise, 0);
      let previous: Quaternion[] | undefined;
      for (let i = 0; i <= 200; i++) {
        const pose = apply(exercise, i / 200);
        const current = [
          "scapula_L",
          "scapula_R",
          "upperArm_L",
          "upperArm_R",
          "forearm_L",
          "forearm_R",
        ].map((n) => bones.get(n)!.quaternion.clone());
        if (previous)
          current.forEach((q, j) =>
            expect(q.angleTo(previous![j]), exercise + " " + i).toBeLessThan(
              0.1,
            ),
          );
        previous = current;
        expect(pose.origin.distanceTo(start.origin)).toBeLessThan(1e-9);
        for (const [j, l] of pose.limbs.entries()) {
          expect(
            l.shoulder.distanceTo(l.elbow),
            exercise + " humerus " + i,
          ).toBeCloseTo(ARM_LENGTH, 7);
          expect(
            l.elbow.distanceTo(l.wrist),
            exercise + " forearm " + i,
          ).toBeCloseTo(FOREARM_LENGTH, 7);
          expect(l.ankle.distanceTo(start.limbs[j].ankle)).toBeLessThan(1e-9);
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
  it.each(PULLING_EXERCISES)(
    "%s moves actual scapular tissues, rather than only shoulder endpoints",
    (exercise) => {
      const active = detail.selections.find(
        (s) =>
          s.name.startsWith("Rhomboid_major") &&
          s.indices.some(
            (i) => mesh.geometry.attributes.position.getX(i) > 0.06,
          ),
      )!;
      const indices = active.indices.filter(
        (i) => mesh.geometry.attributes.position.getX(i) > 0.06,
      );
      expect(indices.length).toBeGreaterThan(30);
      const surface = (p: number) => {
        apply(exercise, p);
        mesh.parent!.updateMatrixWorld(true);
        mesh.skeleton.update();
        return indices.map((i) =>
          mesh.applyBoneTransform(
            i,
            new Vector3().fromBufferAttribute(
              mesh.geometry.attributes.position,
              i,
            ),
          ),
        );
      };
      const contracted = surface(0),
        extended = surface(1);
      const displacement =
        contracted.reduce((sum, v, i) => sum + v.distanceTo(extended[i]), 0) /
        indices.length;
      expect(displacement).toBeGreaterThan(0.008);
      const q = getScapularMotion(exercise, 0, 1).rotation;
      expect(
        q.angleTo(getScapularMotion(exercise, 1, 1).rotation),
      ).toBeGreaterThan(0.2);
    },
  );
  it("keeps the supporting scapula steady and allows overhead upward rotation", () => {
    const a = getExercisePose("one-arm-row", 0),
      b = getExercisePose("one-arm-row", 1);
    expect(a.limbs[0].shoulder.distanceTo(b.limbs[0].shoulder)).toBe(0);
    expect(a.limbs[0].wrist.distanceTo(b.limbs[0].wrist)).toBe(0);
    expect(
      getScapularMotion("one-arm-row", 0, -1).rotation.angleTo(
        getScapularMotion("one-arm-row", 1, -1).rotation,
      ),
    ).toBe(0);
    const inferior = new Vector3(0.13, -0.06, 0.035);
    const down = getScapularMotion("lat-pulldown", 0, 1).point(inferior),
      up = getScapularMotion("lat-pulldown", 1, 1).point(inferior);
    expect(up.x).toBeGreaterThan(down.x);
    expect(up.y).toBeGreaterThan(down.y);
    for (const l of getExercisePose("lat-pulldown", 1).limbs) {
      const flexion =
        Math.PI -
        l.shoulder.clone().sub(l.elbow).angleTo(l.wrist.clone().sub(l.elbow));
      expect(flexion).toBeLessThan(Math.PI / 4);
    }
  });
  it("preserves every original thorax deformation for unrelated exercises", () => {
    for (const exercise of ["bench-press", "squat", "deadlift"] as const) {
      const pose = apply(exercise, 0.4);
      mesh.parent!.updateMatrixWorld(true);
      mesh.skeleton.update();
      const positions = mesh.geometry.attributes.position,
        weights = mesh.geometry.attributes.skinWeight,
        ids = mesh.geometry.attributes.skinIndex;
      let checked = 0;
      for (let i = 0; i < positions.count; i += 17) {
        if (
          [0, 1, 2, 3].some(
            (j) =>
              weights.getComponent(i, j) > 0 &&
              !["sled", "scapula_L", "scapula_R"].includes(
                mesh.skeleton.bones[ids.getComponent(i, j)].name,
              ),
          )
        )
          continue;
        const rest = new Vector3().fromBufferAttribute(positions, i),
          rootRest = new Vector3(0, 1.142, 0);
        const expected = rest
          .clone()
          .sub(rootRest)
          .applyQuaternion(pose.tilt)
          .add(pose.origin);
        expect(
          mesh.applyBoneTransform(i, rest).distanceTo(expected),
        ).toBeLessThan(1e-6);
        checked++;
      }
      expect(checked).toBeGreaterThan(200);
    }
  });
  it("separates high and low trajectories, grip rotation and the categorical muscle emphasis", () => {
    const low = getExercisePose("bent-row", 0),
      high = getExercisePose("high-bent-row", 0),
      sup = getExercisePose("supinated-bent-row", 0);
    expect(high.bar.y - low.bar.y).toBeGreaterThan(0.12);
    expect(high.bar.z - low.bar.z).toBeGreaterThan(0.12);
    expect(Math.abs(high.limbs[1].elbow.x)).toBeGreaterThan(
      Math.abs(low.limbs[1].elbow.x) + 0.08,
    );
    expect(
      low.limbs[1].handRotation.angleTo(sup.limbs[1].handRotation),
    ).toBeGreaterThan(2.8);
    const normal = createBentRowMuscleMask(mesh.geometry),
      wide = createHighRowMuscleMask(mesh.geometry);
    for (const s of back.selections.filter((s) =>
      s.name.startsWith("Latissimus"),
    ))
      for (const i of s.indices) {
        expect(normal.getX(i)).toBe(1);
        expect(wide.getX(i)).toBeCloseTo(0.45);
      }
    for (const s of detail.selections.filter((s) =>
      s.name.startsWith("Scapular_spinal"),
    ))
      for (const i of s.indices) expect(wide.getX(i)).toBe(1);
    for (const key of ["supinated-bent-row", "high-bent-row"] as const)
      expect(getExerciseAnimation(EXERCISE_ANIMATIONS[key].id)).toBe(key);
  });
  it.each(["bent-row", "supinated-bent-row", "high-bent-row"] as const)(
    "%s keeps the revised skin grounded and the bar clear of the torso",
    (exercise) => {
      const positions = mesh.geometry.attributes.position;
      for (const depth of [0, 0.2, 0.4, 0.6, 0.8, 1]) {
        const pose = apply(exercise, depth);
        mesh.parent!.updateMatrixWorld(true);
        mesh.skeleton.update();
        let gap = Infinity,
          floor = Infinity,
          finite = true;
        for (let i = 0; i < positions.count; i++) {
          const q = mesh.applyBoneTransform(
            i,
            new Vector3().fromBufferAttribute(positions, i),
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
        expect(gap, exercise + " shaft " + depth).toBeGreaterThan(-0.005);
      }
    },
  );
});
