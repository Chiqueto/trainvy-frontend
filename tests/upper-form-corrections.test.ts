// @vitest-environment node
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { beforeAll, describe, expect, it } from "vitest";
import { Bone, Group, SkinnedMesh, Vector3 } from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "meshoptimizer";
import {
  createPoseDriver,
  getExercisePose,
} from "../app/_components/exercise-3d/kinematics";
import { installScapularRig } from "../app/_components/exercise-3d/scapular-rig";
import {
  getMilitaryHeadRetraction,
  installMilitaryHeadRig,
} from "../app/_components/exercise-3d/military-head-motion";

let mesh: SkinnedMesh, scene: Group, apply: ReturnType<typeof createPoseDriver>;
const bones = new Map<string, Bone>();
beforeAll(async () => {
  const b = await readFile(
    new URL(
      "../public/models/exercise-3d/trainvy-athlete.glb",
      import.meta.url,
    ),
  );
  ({ scene } = await new GLTFLoader()
    .setMeshoptDecoder(MeshoptDecoder)
    .parseAsync(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength), ""));
  scene.traverse((o) => {
    if (o instanceof Bone) bones.set(o.name, o);
    if (o instanceof SkinnedMesh) mesh = o;
  });
  installScapularRig(mesh, bones);
  installMilitaryHeadRig(mesh, bones);
  apply = createPoseDriver(bones);
});
describe("postural corrections from rendered arm orientation", () => {
  it.each(["barbell-curl", "legacy-barbell-curl", "hammer-curl"] as const)(
    "%s fixes the humerus throughout the curl instead of rolling it around the elbow",
    (exercise) => {
      apply(exercise, 0);
      const rotations = ["L", "R"].map((side) =>
        bones.get("upperArm_" + side)!.quaternion.clone(),
      );
      for (let i = 0; i <= 200; i++) {
        const pose = apply(exercise, i / 200);
        for (const [j, side] of ["L", "R"].entries()) {
          expect(
            bones.get("upperArm_" + side)!.quaternion.angleTo(rotations[j]),
          ).toBeLessThan(1e-6);
          const limb = pose.limbs[j],
            u = limb.elbow.clone().sub(limb.shoulder),
            f = limb.wrist.clone().sub(limb.elbow);
          // The lowered endpoint must remain on the flexion side of the fixed elbow hinge.
          expect(u.clone().cross(f).x).toBeLessThan(-0.002);
        }
      }
    },
  );
  it("keeps lateral raise elbows softly bent without lifting the shoulder girdle toward the ears", () => {
    const bottom = getExercisePose("lateral-raise", 1);
    for (let i = 0; i <= 100; i++) {
      const p = getExercisePose("lateral-raise", i / 100);
      p.limbs.forEach((l, j) => {
        expect(l.shoulder.y - bottom.limbs[j].shoulder.y).toBeLessThan(0.008);
        const upper = l.elbow.clone().sub(l.shoulder),
          fore = l.wrist.clone().sub(l.elbow);
        expect(upper.angleTo(fore)).toBeGreaterThan(0.3);
        expect(upper.angleTo(fore)).toBeLessThan(0.4);
      });
    }
  });
  it("preserves the approved seated dumbbell press at every sampled phase", () => {
    const frames = [];
    for (let i = 0; i <= 40; i++) {
      const p = getExercisePose("dumbbell-shoulder-press", i / 40);
      frames.push(
        [
          p.origin,
          p.tilt,
          p.bar,
          ...p.limbs.flatMap((l) => [
            l.hip,
            l.knee,
            l.ankle,
            l.footRotation,
            l.shoulder,
            l.elbow,
            l.wrist,
            l.grip,
            l.handRotation,
          ]),
        ].map((v) => v.toArray().map((n) => Number(n.toFixed(9)))),
      );
    }
    expect(
      createHash("sha256").update(JSON.stringify(frames)).digest("hex"),
    ).toBe("da22360b935810714083f8c2955f11fb3eca0cefda3b3e49d95ca157b54a8750");
  });
  it("clears the actual deformed face surface and returns to a neutral head above the head", () => {
    const position = mesh.geometry.getAttribute("position"),
      uv = mesh.geometry.getAttribute("uv");
    const headIndices = Array.from(
      { length: position.count },
      (_, i) => i,
    ).filter((i) => uv.getY(i) < 0.1 && position.getY(i) > 1.49);
    expect(headIndices.length).toBeGreaterThan(1000);
    expect(getMilitaryHeadRetraction(0)).toBe(0);
    expect(getMilitaryHeadRetraction(1)).toBe(0);
    expect(getMilitaryHeadRetraction(0.5)).toBeGreaterThan(0.04);
    let minimum = Infinity;
    for (let i = 0; i <= 100; i++) {
      const pose = apply("military-press", i / 100);
      scene.updateMatrixWorld(true);
      let front = -Infinity;
      for (const index of headIndices) {
        const p = mesh.applyBoneTransform(
          index,
          new Vector3().fromBufferAttribute(position, index),
        );
        if (Math.abs(p.y - pose.bar.y) < 0.018) front = Math.max(front, p.z);
      }
      if (Number.isFinite(front))
        minimum = Math.min(minimum, pose.bar.z - front - 0.013);
    }
    expect(minimum).toBeGreaterThan(0.004);
    const top = getExercisePose("military-press", 0);
    expect(Math.abs(top.bar.z - 0.08)).toBeLessThan(0.035);
  });
  it.each([
    "bench-press",
    "incline-dumbbell-press",
    "squat",
    "one-arm-row",
    "dumbbell-shoulder-press",
  ] as const)(
    "%s preserves head attachment and the original anatomy outside the military press",
    (exercise) => {
      const position = mesh.geometry.getAttribute("position"),
        uv = mesh.geometry.getAttribute("uv");
      const samples = Array.from({ length: position.count }, (_, i) => i)
        .filter((i) => uv.getY(i) < 0.1 && position.getY(i) > 1.49)
        .filter((_, j) => j % 50 === 0);
      for (const depth of [0, 0.3, 0.6, 1]) {
        const pose = apply(exercise, depth);
        scene.updateMatrixWorld(true);
        for (const index of samples) {
          const source = new Vector3().fromBufferAttribute(position, index);
          const expected = source
            .clone()
            .sub(new Vector3(0, 1.142, 0))
            .applyQuaternion(pose.tilt)
            .add(pose.origin);
          expect(
            mesh.applyBoneTransform(index, source).distanceTo(expected),
          ).toBeLessThan(1e-6);
        }
      }
    },
  );
});
