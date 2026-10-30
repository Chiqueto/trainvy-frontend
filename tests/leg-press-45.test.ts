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
  LEG_PRESS_PLATE_NORMAL,
  LEG_PRESS_TILT,
  LEG_PRESS_HIP,
  LEG_PRESS_SEAT_CENTER,
  LEG_PRESS_SEAT_ANGLE,
  LEG_PRESS_FOOT_ROTATION,
} from "../app/_components/exercise-3d/leg-press-45-pose";
import { createLegPress45MuscleMask } from "../app/_components/exercise-3d/leg-press-45-muscles";
import { createHackSquatMuscleMask } from "../app/_components/exercise-3d/hack-squat-muscles";
import { createProneLegCurlMuscleMask } from "../app/_components/exercise-3d/prone-leg-curl-muscles";
import map from "../app/_components/exercise-3d/leg-press-45-muscle-map.json";
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

describe("inclined bilateral leg press", () => {
  it("resolves only supported machine aliases and preserves horizontal, vertical and unilateral variants", () => {
    expect(getExerciseAnimation(EXERCISE_ANIMATIONS["leg-press-45"].id)).toBe(
      "leg-press-45",
    );
    for (const name of [
      "Leg Press 45",
      "Leg Press 45°",
      "Leg press inclinado",
      "45 degree leg press",
    ])
      expect(getExerciseAnimation(null, name)).toBe("leg-press-45");
    for (const name of [
      "Leg Press Horizontal",
      "Leg Press Vertical",
      "Leg press unilateral",
      "Leg press",
    ])
      expect(getExerciseAnimation(null, name)).toBeNull();
  });

  it("moves both feet with the 45-degree platform while pelvis, back and hands remain supported", () => {
    const start = getExercisePose("leg-press-45", 0);
    for (let i = 0; i <= 100; i++) {
      const pose = getExercisePose("leg-press-45", i / 100),
        delta = pose.bar.clone().sub(start.bar);
      expect(delta.y).toBeCloseTo(delta.z, 10);
      expect(delta.x).toBe(0);
      expect(pose.tilt.angleTo(start.tilt)).toBeLessThan(1e-7);
      for (const [index, l] of pose.limbs.entries()) {
        expect(
          l.ankle.clone().sub(start.limbs[index].ankle).distanceTo(delta),
        ).toBeLessThan(1e-9);
        expect(
          l.footRotation.angleTo(start.limbs[index].footRotation),
        ).toBeLessThan(1e-7);
        for (const contact of ["hip", "shoulder", "grip"] as const)
          expect(
            l[contact].clone().sub(start.limbs[index][contact]).length(),
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
        expect(ankleAngle).toBeLessThan(115);
        expect(Math.abs(l.knee.x - l.ankle.x)).toBeLessThan(0.08);
      }
    }
    expect(getExercisePose("leg-press-45", 1).bar.y).toBeLessThan(
      start.bar.y - 0.2,
    );
  });

  it("descends under control, pauses at the bottom and rises smoothly", () => {
    const height = (phase: number) =>
      getExercisePose("leg-press-45", getExerciseDepth(phase)).bar.y;
    expect(height(0)).toBeGreaterThan(height(0.25));
    expect(height(0.25)).toBeGreaterThan(height(0.48));
    expect(height(0.48)).toBeCloseTo(height(0.53), 9);
    expect(height(0.75)).toBeGreaterThan(height(0.54));
    expect(height(1)).toBeCloseTo(height(0), 9);
  });

  it("independently maps bilateral extensors and stabilizers, preserving unrelated anatomy", () => {
    const mask = createLegPress45MuscleMask(mesh.geometry),
      hack = createHackSquatMuscleMask(mesh.geometry),
      curl = createProneLegCurlMuscleMask(mesh.geometry);
    expect(map.baseAssetSha256).toBe(manifest.sha256);
    expect(new Set(map.selections.map((s) => s.name)).size).toBe(26);
    for (const s of map.selections) {
      expect(s.confidence).toBeGreaterThanOrEqual(0.8);
      const primary = /Rectus_femoris|Vastus_|Gluteus_maximus/.test(s.name);
      for (const i of s.indices) {
        expect(mask.getX(i)).toBeCloseTo(primary ? 1 : 0.45);
        if (
          /biceps_femoris|Semitendinosus|Semimembranosus|gastrocnemius|Gluteus_medius/.test(
            s.name,
          )
        ) {
          expect(hack.getX(i)).toBe(0);
        }
        if (/biceps_femoris|Semitendinosus|Semimembranosus/.test(s.name))
          expect(curl.getX(i)).toBe(1);
        if (/gastrocnemius/.test(s.name)) expect(curl.getX(i)).toBeCloseTo(0.45);
        if (primary) expect(curl.getX(i)).toBe(0);
      }
    }
    const selected = new Set(map.selections.flatMap((s) => s.indices));
    for (let i = 0; i < mask.count; i++)
      if (!selected.has(i)) expect(mask.getX(i)).toBe(0);
  });

  it("keeps real skinned geometry finite and aligns hands with the forearms", () => {
    for (let i = 0; i <= 10; i++) {
      const pose = apply("leg-press-45", i / 10);
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
      const pose = apply("leg-press-45", depth);
      mesh.parent!.updateMatrixWorld(true);
      mesh.skeleton.update();
      let sole = Infinity,
        back = Infinity,
        seat = Infinity;
      for (let i = 0; i < positions.count; i++) {
        const p = mesh.getVertexPosition(i, new Vector3());
        if (positions.getY(i) < 0.03 && Math.abs(positions.getX(i)) < 0.3) {
          sole = Math.min(
            sole,
            p.clone().sub(pose.bar).dot(LEG_PRESS_PLATE_NORMAL),
          );
          const plateLocal = p
            .clone()
            .sub(pose.bar)
            .applyQuaternion(LEG_PRESS_FOOT_ROTATION.clone().invert());
          expect(Math.abs(plateLocal.x)).toBeLessThan(0.46);
          expect(Math.abs(plateLocal.z)).toBeLessThan(0.25);
        }
        const local = p
          .clone()
          .sub(LEG_PRESS_HIP)
          .applyQuaternion(LEG_PRESS_TILT.clone().invert());
        const seatLocal = p
          .clone()
          .sub(LEG_PRESS_SEAT_CENTER)
          .applyAxisAngle(new Vector3(1, 0, 0), -LEG_PRESS_SEAT_ANGLE);
        if (
          Math.abs(seatLocal.x) < 0.23 &&
          Math.abs(seatLocal.z) < 0.15 &&
          positions.getY(i) > 0.73 &&
          positions.getY(i) < 1.02
        )
          seat = Math.min(seat, seatLocal.y - 0.04);
        if (local.y > 0.07 && local.y < 0.65 && Math.abs(local.x) < 0.16)
          back = Math.min(back, local.z + 0.083);
      }
      expect(seat).toBeGreaterThan(-0.008);
      expect(seat).toBeLessThan(0.008);
      expect(sole).toBeGreaterThan(-0.012);
      expect(sole).toBeLessThan(0.008);
      expect(back).toBeGreaterThan(-0.008);
      expect(back).toBeLessThan(0.008);
    }
  });
});
