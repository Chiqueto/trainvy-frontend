// @vitest-environment node
import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
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
} from "../app/_components/exercise-3d/kinematics";
import {
  getLegExtensionRoller,
  getLegExtensionLeverAngle,
  LEG_EXTENSION_KNEE,
  LEG_EXTENSION_ROLLER_RADIUS,
} from "../app/_components/exercise-3d/leg-extension-pose";
import { createLegExtensionMuscleMask } from "../app/_components/exercise-3d/leg-extension-muscles";
import { createSmithSquatMuscleMask } from "../app/_components/exercise-3d/smith-squat-muscles";
import mapping from "../app/_components/exercise-3d/leg-extension-muscle-map.json";
import manifest from "../public/models/exercise-3d/model-manifest.json";

describe("seated leg extension", () => {
  it("registers the canonical ID and exact variants without claiming curls or unilateral variants", () => {
    expect(getExerciseAnimation(EXERCISE_ANIMATIONS["leg-extension"].id)).toBe(
      "leg-extension",
    );
    for (const name of [
      "Cadeira Extensora",
      "Extensão de joelhos na máquina",
      "Seated leg extension",
    ])
      expect(getExerciseAnimation(null, name)).toBe("leg-extension");
    for (const name of [
      "Cadeira Flexora Unilateral",
      "Cadeira Extensora Unilateral",
      "Mesa Flexora Unilateral",
    ])
      expect(getExerciseAnimation(null, name)).toBeNull();
  });

  it("keeps supports and segment lengths fixed throughout a knee-only arc with continuous roller contact", () => {
    const start = getExercisePose("leg-extension", 0);
    const radius = getLegExtensionRoller(start).distanceTo(LEG_EXTENSION_KNEE);
    for (let i = 0; i <= 100; i++) {
      const pose = getExercisePose("leg-extension", i / 100);
      expect(pose.origin.distanceTo(start.origin)).toBeLessThan(1e-10);
      const roller = getLegExtensionRoller(pose);
      const renderedRoller = new Vector3(0, 0, radius)
        .applyAxisAngle(new Vector3(1, 0, 0), getLegExtensionLeverAngle(pose))
        .add(LEG_EXTENSION_KNEE);
      expect(renderedRoller.distanceTo(roller)).toBeLessThan(1e-10);
      expect(roller.distanceTo(LEG_EXTENSION_KNEE)).toBeCloseTo(radius, 9);
      for (const [n, limb] of pose.limbs.entries()) {
        for (const contact of ["hip", "knee", "grip", "shoulder"] as const)
          expect(
            limb[contact].distanceTo(start.limbs[n][contact]),
          ).toBeLessThan(1e-10);
        expect(limb.hip.distanceTo(limb.knee)).toBeCloseTo(0.44, 9);
        expect(limb.knee.distanceTo(limb.ankle)).toBeCloseTo(0.42, 9);
        expect(limb.shoulder.distanceTo(limb.elbow)).toBeCloseTo(ARM_LENGTH, 9);
        expect(limb.elbow.distanceTo(limb.wrist)).toBeCloseTo(
          FOREARM_LENGTH,
          9,
        );
        const contact = limb.knee.clone().lerp(limb.ankle, 0.34 / 0.42);
        expect(roller.clone().setX(contact.x).distanceTo(contact)).toBeCloseTo(
          LEG_EXTENSION_ROLLER_RADIUS + 0.035,
          9,
        );
        const flexion =
          Math.PI -
          limb.hip
            .clone()
            .sub(limb.knee)
            .angleTo(limb.ankle.clone().sub(limb.knee));
        expect((flexion * 180) / Math.PI).toBeCloseTo(10 + (80 * i) / 100, 8);
      }
    }
  });

  it("uses bilateral named muscle surfaces, excludes glutes, and preserves the real skinned mesh across the arc", async () => {
    const bytes = await readFile(
      new URL(
        "../public/models/exercise-3d/trainvy-athlete.glb",
        import.meta.url,
      ),
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
    let mesh!: SkinnedMesh;
    const bones = new Map<string, Bone>();
    scene.traverse((o) => {
      if (o instanceof SkinnedMesh) mesh = o;
      if (o instanceof Bone) bones.set(o.name, o);
    });
    const mask = createLegExtensionMuscleMask(mesh.geometry);
    const squat = createSmithSquatMuscleMask(mesh.geometry);
    const p = mesh.geometry.getAttribute("position");
    expect(mapping.baseAssetSha256).toBe(manifest.sha256);
    expect(mapping.selections).toHaveLength(12);
    for (const selection of mapping.selections) {
      expect(selection.confidence).toBeGreaterThanOrEqual(0.8);
      expect(selection.indices.length).toBeGreaterThan(0);
      for (const i of selection.indices)
        expect(mask.getX(i)).toBeCloseTo(selection.role);
    }
    let neutralGlutes = 0;
    for (let i = 0; i < mask.count; i++) {
      if (p.getY(i) > 1.12 || p.getY(i) < 0.3) expect(mask.getX(i)).toBe(0);
      if (squat.getX(i) > 0.9 && mask.getX(i) === 0) neutralGlutes++;
    }
    expect(neutralGlutes).toBeGreaterThan(300);
    const apply = createPoseDriver(bones);
    let previous: ReturnType<typeof getExercisePose> | undefined;
    for (let step = 0; step <= 10; step++) {
      const pose = apply("leg-extension", step / 10);
      scene.updateMatrixWorld(true);
      mesh.skeleton.update();
      for (let i = 0; i < p.count; i += 31) {
        const vertex = mesh.getVertexPosition(i, new Vector3());
        expect(vertex.toArray().every(Number.isFinite)).toBe(true);
        expect(vertex.y).toBeGreaterThan(0.03);
      }
      for (const limb of pose.limbs) {
        const shin = bones.get(`shin_${limb.side < 0 ? "L" : "R"}`)!;
        expect(shin.quaternion.toArray().every(Number.isFinite)).toBe(true);
      }
      if (previous)
        expect(
          pose.limbs[0].ankle.distanceTo(previous.limbs[0].ankle),
        ).toBeLessThan(0.06);
      previous = pose;
    }
  });
});
