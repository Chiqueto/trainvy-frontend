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
  getExerciseDepth,
  getExercisePose,
} from "../app/_components/exercise-3d/kinematics";
import { createStiffMuscleMask } from "../app/_components/exercise-3d/stiff-muscles";
import { createProneLegCurlMuscleMask } from "../app/_components/exercise-3d/prone-leg-curl-muscles";
import { createLegExtensionMuscleMask } from "../app/_components/exercise-3d/leg-extension-muscles";
import { createSeatedLegCurlMuscleMask } from "../app/_components/exercise-3d/seated-leg-curl-muscles";
import { createLegDetailMuscleAttribute } from "../app/_components/exercise-3d/leg-detail-muscles";
import map from "../app/_components/exercise-3d/stiff-muscle-map.json";
import curlMap from "../app/_components/exercise-3d/prone-leg-curl-muscle-map.json";
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

describe("barbell stiff-leg hip hinge", () => {
  it("recognizes the reviewed variant without conflating conventional, Romanian or dumbbell deadlifts", () => {
    expect(getExerciseAnimation(EXERCISE_ANIMATIONS.stiff.id)).toBe("stiff");
    for (const name of [
      "Stiff",
      "Stiff com barra",
      "Stiff-leg deadlift",
      "Stiff leg deadlift",
    ])
      expect(getExerciseAnimation(null, name)).toBe("stiff");
    for (const name of [
      "Romanian deadlift",
      "Levantamento terra romeno",
      "Stiff com halteres",
      "Stiff unilateral",
      "Levantamento terra",
    ])
      expect(getExerciseAnimation(null, name)).toBeNull();
  });

  it("hinges from the hips with a fixed near-straight knee angle, planted feet and real segment lengths", () => {
    const start = getExercisePose("stiff", 0);
    for (let i = 0; i <= 100; i++) {
      const pose = getExercisePose("stiff", i / 100);
      expect((pose.tilt.angleTo(start.tilt) * 180) / Math.PI).toBeCloseTo(
        i * 0.82,
        7,
      );
      for (const [index, l] of pose.limbs.entries()) {
        expect(l.ankle.distanceTo(start.limbs[index].ankle)).toBeLessThan(
          1e-10,
        );
        expect(
          l.footRotation.angleTo(start.limbs[index].footRotation),
        ).toBeLessThan(1e-7);
        expect(l.hip.distanceTo(l.knee)).toBeCloseTo(0.44, 9);
        expect(l.knee.distanceTo(l.ankle)).toBeCloseTo(0.42, 9);
        expect(l.shoulder.distanceTo(l.elbow)).toBeCloseTo(ARM_LENGTH, 9);
        expect(l.elbow.distanceTo(l.wrist)).toBeCloseTo(FOREARM_LENGTH, 9);
        const knee =
          180 -
          (l.hip.clone().sub(l.knee).angleTo(l.ankle.clone().sub(l.knee)) *
            180) /
            Math.PI;
        expect(knee).toBeCloseTo(10, 7);
        expect(l.shoulder.distanceTo(l.hip)).toBeCloseTo(
          start.limbs[index].shoulder.distanceTo(start.limbs[index].hip),
          9,
        );
        expect(l.grip.y).toBeCloseTo(pose.bar.y, 9);
        expect(l.grip.z).toBeCloseTo(pose.bar.z, 9);
        expect(Math.abs(l.grip.x)).toBeLessThan(0.34);
      }
    }
    const bottom = getExercisePose("stiff", 1);
    expect(bottom.limbs[0].hip.z).toBeLessThan(start.limbs[0].hip.z - 0.16);
    expect(bottom.limbs[0].hip.y).toBeGreaterThan(start.limbs[0].hip.y - 0.025);
    expect(bottom.bar.y).toBeLessThan(bottom.limbs[0].knee.y - 0.03);
    expect(bottom.bar.y).toBeGreaterThan(0.22);
    expect(Math.abs(bottom.bar.z - start.bar.z)).toBeLessThan(0.065);
  });

  it("lowers the bar under control, pauses and extends the hip without leaning back at the top", () => {
    const height = (phase: number) =>
      getExercisePose("stiff", getExerciseDepth(phase)).bar.y;
    expect(height(0)).toBeGreaterThan(height(0.25));
    expect(height(0.25)).toBeGreaterThan(height(0.48));
    expect(height(0.48)).toBeCloseTo(height(0.53), 9);
    expect(height(0.75)).toBeGreaterThan(height(0.54));
    expect(height(1)).toBeCloseTo(height(0), 9);
  });

  it("maps long-head hip extensors and stabilizers explicitly, keeping the short head and quadriceps neutral", () => {
    const mask = createStiffMuscleMask(mesh.geometry),
      extension = createLegExtensionMuscleMask(mesh.geometry),
      curl = createProneLegCurlMuscleMask(mesh.geometry);
    expect(map.baseAssetSha256).toBe(manifest.sha256);
    expect(new Set(map.selections.map((s) => s.name)).size).toBe(28);
    for (const s of map.selections) {
      expect(s.confidence).toBeGreaterThanOrEqual(0.8);
      const primary =
        /Long_head_of_biceps_femoris|Semitendinosus|Semimembranosus|Gluteus_maximus/.test(
          s.name,
        );
      for (const i of s.indices) {
        expect(mask.getX(i)).toBeCloseTo(primary ? 1 : 0.45);
        if (
          /Gluteus_maximus|oblique|carpi|digitorum|Iliocostalis|Longissimus|Spinalis/.test(
            s.name,
          )
        )
          expect(curl.getX(i)).toBe(0);
      }
    }
    for (const s of curlMap.selections.filter((s) =>
      /Short_head_of_biceps_femoris/.test(s.name),
    ))
      for (const i of s.indices) expect(mask.getX(i)).toBe(0);
    for (let i = 0; i < mask.count; i++)
      if (extension.getX(i) > 0.9) expect(mask.getX(i)).toBe(0);
  });

  it("preserves the independent extension, seated curl and Stiff GPU channels", () => {
    const packed = createLegDetailMuscleAttribute(mesh.geometry);
    const masks = [
      createLegExtensionMuscleMask(mesh.geometry),
      createSeatedLegCurlMuscleMask(mesh.geometry),
      createStiffMuscleMask(mesh.geometry),
    ];
    expect(packed.itemSize).toBe(3);
    for (let i = 0; i < packed.count; i++)
      for (const [channel, mask] of masks.entries())
        expect(packed.getComponent(i, channel)).toBe(mask.getX(i));
  });

  it("keeps the real skinned model finite, soles grounded and hands aligned with the hanging forearms", () => {
    for (let step = 0; step <= 10; step++) {
      const pose = apply("stiff", step / 10);
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
      let ground = Infinity;
      for (let i = 0; i < mesh.geometry.attributes.position.count; i += 31) {
        const p = mesh.getVertexPosition(i, new Vector3());
        expect(p.toArray().every(Number.isFinite)).toBe(true);
        ground = Math.min(ground, p.y);
      }
      expect(ground).toBeGreaterThan(-0.008);
      expect(ground).toBeLessThan(0.008);
    }
  });

  it("keeps the shaft in front of the real legs and clear of the knee/shin surfaces", () => {
    for (const depth of [0, 0.25, 0.5, 0.75, 1]) {
      const pose = apply("stiff", depth);
      mesh.parent!.updateMatrixWorld(true);
      mesh.skeleton.update();
      let gap = Infinity;
      for (let i = 0; i < mesh.geometry.attributes.position.count; i++) {
        const p = mesh.getVertexPosition(i, new Vector3());
        if (Math.abs(p.x) < 0.22 && Math.abs(p.y - pose.bar.y) < 0.025)
          gap = Math.min(gap, pose.bar.z - p.z);
      }
      expect(gap).toBeGreaterThan(0.018);
      expect(gap).toBeLessThan(0.11);
    }
  });
});
