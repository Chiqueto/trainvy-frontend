// @vitest-environment node
import { readFile } from "node:fs/promises";
import { beforeAll, describe, expect, it } from "vitest";
import { Bone, SkinnedMesh, Vector3 } from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "meshoptimizer";
import {
  getExerciseAnimation,
  EXERCISE_ANIMATIONS,
} from "../app/_components/exercise-3d/exercises";
import {
  ARM_LENGTH,
  FOREARM_LENGTH,
  createPoseDriver,
  getExerciseDepth,
  getExercisePose,
} from "../app/_components/exercise-3d/kinematics";
import {
  HACK_PLATE_CENTER,
  HACK_PLATE_NORMAL,
  HACK_TILT,
} from "../app/_components/exercise-3d/hack-squat-pose";
import { createHackSquatMuscleMask } from "../app/_components/exercise-3d/hack-squat-muscles";
import { createSmithSquatMuscleMask } from "../app/_components/exercise-3d/smith-squat-muscles";
import { createProneLegCurlMuscleMask } from "../app/_components/exercise-3d/prone-leg-curl-muscles";
import map from "../app/_components/exercise-3d/hack-squat-muscle-map.json";
import manifest from "../public/models/exercise-3d/model-manifest.json";

let mesh: SkinnedMesh;
const bones = new Map<string, Bone>(),
  rest = new Map<string, Vector3>();
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
  scene.traverse((o) => {
    if (o instanceof Bone) {
      bones.set(o.name, o);
      rest.set(o.name, o.position.clone());
    }
    if (o instanceof SkinnedMesh) mesh = o;
  });
  apply = createPoseDriver(bones);
});

describe("back-supported machine hack squat", () => {
  it("resolves only supported machine aliases and preserves other hack variants", () => {
    expect(getExerciseAnimation(EXERCISE_ANIMATIONS["hack-squat"].id)).toBe(
      "hack-squat",
    );
    for (const name of [
      "Agachamento Hack na Máquina",
      "Hack squat machine",
      "Hack squat",
    ])
      expect(getExerciseAnimation(null, name)).toBe("hack-squat");
    for (const name of [
      "Reverse hack squat",
      "Hack com barra",
      "Agachamento pêndulo",
      "Hack unilateral",
    ])
      expect(getExerciseAnimation(null, name)).toBeNull();
  });

  it("moves torso, shoulder pads and hands along the 45-degree sled while feet stay planted", () => {
    const start = getExercisePose("hack-squat", 0);
    for (let i = 0; i <= 100; i++) {
      const pose = getExercisePose("hack-squat", i / 100),
        delta = pose.bar.clone().sub(start.bar);
      expect(delta.y).toBeCloseTo(-delta.z, 10);
      expect(delta.x).toBe(0);
      expect(pose.tilt.angleTo(start.tilt)).toBeLessThan(1e-7);
      for (const [index, l] of pose.limbs.entries()) {
        expect(l.ankle.distanceTo(start.limbs[index].ankle)).toBeLessThan(1e-9);
        expect(
          l.footRotation.angleTo(start.limbs[index].footRotation),
        ).toBeLessThan(1e-7);
        for (const contact of ["hip", "shoulder", "grip"] as const)
          expect(
            l[contact]
              .clone()
              .sub(start.limbs[index][contact])
              .distanceTo(delta),
          ).toBeLessThan(1e-9);
        expect(l.hip.distanceTo(l.knee)).toBeCloseTo(0.44, 9);
        expect(l.knee.distanceTo(l.ankle)).toBeCloseTo(0.42, 9);
        expect(l.shoulder.distanceTo(l.elbow)).toBeCloseTo(ARM_LENGTH, 9);
        expect(l.elbow.distanceTo(l.wrist)).toBeCloseTo(FOREARM_LENGTH, 9);
        const flexion =
          180 -
          (l.hip.clone().sub(l.knee).angleTo(l.ankle.clone().sub(l.knee)) *
            180) /
            Math.PI;
        expect(flexion).toBeGreaterThan(10);
        expect(flexion).toBeLessThan(105);
        const footForward = new Vector3(0, 0, 1).applyQuaternion(
          l.footRotation,
        );
        const ankleAngle =
          (l.knee.clone().sub(l.ankle).angleTo(footForward) * 180) / Math.PI;
        expect(ankleAngle).toBeGreaterThan(55);
        expect(ankleAngle).toBeLessThan(110);
        expect(Math.abs(l.knee.x - l.ankle.x)).toBeLessThan(0.08);
      }
    }
    expect(getExercisePose("hack-squat", 1).bar.y).toBeLessThan(
      start.bar.y - 0.2,
    );
  });

  it("descends under control, pauses at the bottom and rises smoothly", () => {
    const height = (phase: number) =>
      getExercisePose("hack-squat", getExerciseDepth(phase)).bar.y;
    expect(height(0)).toBeGreaterThan(height(0.25));
    expect(height(0.25)).toBeGreaterThan(height(0.48));
    expect(height(0.48)).toBeCloseTo(height(0.53), 9);
    expect(height(0.75)).toBeGreaterThan(height(0.54));
    expect(height(1)).toBeCloseTo(height(0), 9);
  });

  it("independently maps bilateral extensors and stabilizers, preserving unrelated anatomy", () => {
    const mask = createHackSquatMuscleMask(mesh.geometry),
      smith = createSmithSquatMuscleMask(mesh.geometry),
      curl = createProneLegCurlMuscleMask(mesh.geometry);
    expect(map.baseAssetSha256).toBe(manifest.sha256);
    expect(new Set(map.selections.map((s) => s.name)).size).toBe(24);
    for (const s of map.selections) {
      expect(s.confidence).toBeGreaterThanOrEqual(0.8);
      const primary = /Rectus_femoris|Vastus_|Gluteus_maximus/.test(s.name);
      for (const i of s.indices) {
        expect(mask.getX(i)).toBeCloseTo(primary ? 1 : 0.45);
        if (
          /abdominis|oblique|Iliocostalis|Longissimus|Spinalis/.test(s.name)
        ) {
          expect(smith.getX(i)).toBe(0);
          expect(curl.getX(i)).toBe(0);
        }
        if (primary) expect(curl.getX(i)).toBe(0);
      }
    }
    const selected = new Set(map.selections.flatMap((s) => s.indices));
    for (let i = 0; i < mask.count; i++)
      if (!selected.has(i)) expect(mask.getX(i)).toBe(0);
  });

  it("keeps real skinned geometry finite and aligns hands with the forearms", () => {
    for (let i = 0; i <= 10; i++) {
      const pose = apply("hack-squat", i / 10);
      mesh.parent!.updateMatrixWorld(true);
      mesh.skeleton.update();
      for (const l of pose.limbs) {
        const suffix = l.side < 0 ? "L" : "R";
        const axis = rest
          .get(`hand_${suffix}`)!
          .clone()
          .sub(rest.get(`forearm_${suffix}`)!)
          .normalize();
        for (const name of [
          `forearm_${suffix}`,
          `wrist_${suffix}`,
          `hand_${suffix}`,
        ])
          expect(
            axis
              .clone()
              .applyQuaternion(bones.get(name)!.quaternion)
              .dot(l.wrist.clone().sub(l.elbow).normalize()),
          ).toBeGreaterThan(0.99999);
      }
      for (let j = 0; j < mesh.geometry.attributes.position.count; j += 31) {
        const p = mesh.getVertexPosition(j, new Vector3());
        expect(p.toArray().every(Number.isFinite)).toBe(true);
        expect(p.y).toBeGreaterThan(0.03);
      }
    }
  });

  it("supports the actual soles and back surfaces without deep penetration", () => {
    const positions = mesh.geometry.attributes.position;
    for (const depth of [0, 0.5, 1]) {
      const pose = apply("hack-squat", depth);
      mesh.parent!.updateMatrixWorld(true);
      mesh.skeleton.update();
      let sole = Infinity,
        back = Infinity,
        shoulder = -Infinity;
      for (let i = 0; i < positions.count; i++) {
        const p = mesh.getVertexPosition(i, new Vector3());
        if (positions.getY(i) < 0.03 && Math.abs(positions.getX(i)) < 0.3)
          sole = Math.min(
            sole,
            p.clone().sub(HACK_PLATE_CENTER).dot(HACK_PLATE_NORMAL),
          );
        const local = p
          .clone()
          .sub(pose.bar)
          .applyQuaternion(HACK_TILT.clone().invert());
        if (
          Math.abs(local.x) > 0.155 &&
          Math.abs(local.x) < 0.285 &&
          local.z > -0.11 &&
          local.z < 0.17
        )
          shoulder = Math.max(shoulder, local.y);
        if (local.y > 0.07 && local.y < 0.65 && Math.abs(local.x) < 0.16)
          back = Math.min(back, local.z + 0.083);
      }
      expect(0.536 - shoulder).toBeGreaterThan(-0.008);
      expect(0.536 - shoulder).toBeLessThan(0.008);
      expect(sole).toBeGreaterThan(-0.012);
      expect(sole).toBeLessThan(0.008);
      expect(back).toBeGreaterThan(-0.008);
      expect(back).toBeLessThan(0.008);
    }
  });
});
