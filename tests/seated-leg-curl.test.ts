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
  getSeatedLegCurlRoller,
  getSeatedLegCurlLeverAngle,
  SEATED_CURL_KNEE,
  SEATED_CURL_ROLLER_RADIUS,
  SEATED_CURL_THIGH_PAD,
} from "../app/_components/exercise-3d/seated-leg-curl-pose";
import { createSeatedLegCurlMuscleMask } from "../app/_components/exercise-3d/seated-leg-curl-muscles";
import { createSmithSquatMuscleMask } from "../app/_components/exercise-3d/smith-squat-muscles";
import { createLegExtensionMuscleMask } from "../app/_components/exercise-3d/leg-extension-muscles";
import mapping from "../app/_components/exercise-3d/seated-leg-curl-muscle-map.json";
import manifest from "../public/models/exercise-3d/model-manifest.json";

describe("seated leg curl", () => {
  it("registers the seated variant without claiming prone, standing or unilateral curls", () => {
    expect(
      getExerciseAnimation(EXERCISE_ANIMATIONS["seated-leg-curl"].id),
    ).toBe("seated-leg-curl");
    for (const name of [
      "Cadeira Flexora",
      "Flexora sentada",
      "Seated leg curl",
    ])
      expect(getExerciseAnimation(null, name)).toBe("seated-leg-curl");
    for (const name of [
      "Cadeira Extensora Unilateral",
      "Cadeira Flexora Unilateral",
      "Mesa Flexora",
      "Flexora em pé",
    ])
      expect(getExerciseAnimation(null, name)).toBeNull();
  });

  it("keeps supports and segment lengths fixed throughout a knee-only arc with continuous roller contact", () => {
    const start = getExercisePose("seated-leg-curl", 0);
    const radius = getSeatedLegCurlRoller(start).distanceTo(SEATED_CURL_KNEE);
    for (let i = 0; i <= 100; i++) {
      const pose = getExercisePose("seated-leg-curl", i / 100);
      expect(pose.origin.distanceTo(start.origin)).toBeLessThan(1e-10);
      const roller = getSeatedLegCurlRoller(pose);
      const renderedRoller = new Vector3(0, 0, radius)
        .applyAxisAngle(new Vector3(1, 0, 0), getSeatedLegCurlLeverAngle(pose))
        .add(SEATED_CURL_KNEE);
      expect(renderedRoller.distanceTo(roller)).toBeLessThan(1e-10);
      expect(roller.distanceTo(SEATED_CURL_KNEE)).toBeCloseTo(radius, 9);
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
        const shin = limb.ankle.clone().sub(limb.knee).normalize();
        const anterior = new Vector3(0, shin.z, -shin.y);
        expect(
          roller.clone().setX(contact.x).sub(contact).dot(anterior),
        ).toBeLessThan(0);
        expect(roller.clone().setX(contact.x).distanceTo(contact)).toBeCloseTo(
          SEATED_CURL_ROLLER_RADIUS + 0.035,
          9,
        );
        const flexion =
          Math.PI -
          limb.hip
            .clone()
            .sub(limb.knee)
            .angleTo(limb.ankle.clone().sub(limb.knee));
        expect((flexion * 180) / Math.PI).toBeCloseTo(90 - (80 * i) / 100, 8);
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
    const mask = createSeatedLegCurlMuscleMask(mesh.geometry);
    const squat = createSmithSquatMuscleMask(mesh.geometry);
    const extension = createLegExtensionMuscleMask(mesh.geometry);
    const p = mesh.geometry.getAttribute("position");
    expect(mapping.baseAssetSha256).toBe(manifest.sha256);
    expect(new Set(mapping.selections.map((s) => s.name)).size).toBe(16);
    for (const selection of mapping.selections) {
      expect(selection.confidence).toBeGreaterThanOrEqual(0.8);
      expect(selection.indices.length).toBeGreaterThan(0);
      for (const i of selection.indices)
        expect(mask.getX(i)).toBeCloseTo(selection.role);
      if (/biceps_femoris/.test(selection.name)) {
        for (const i of selection.indices) {
          expect(mask.getX(i)).toBe(1);
          expect(extension.getX(i)).toBeCloseTo(0.45);
        }
      }
    }
    let neutralGlutes = 0;
    for (let i = 0; i < mask.count; i++) {
      if (p.getY(i) > 1.12 || p.getY(i) < 0.07) expect(mask.getX(i)).toBe(0);
      if (squat.getX(i) > 0.9 && mask.getX(i) === 0) neutralGlutes++;
    }
    expect(neutralGlutes).toBeGreaterThan(300);
    const quadriceps = Array.from({ length: mask.count }, (_, i) => i).filter(
      (i) => extension.getX(i) > 0.9,
    );
    expect(quadriceps.length).toBeGreaterThan(1000);
    for (const i of quadriceps) expect(mask.getX(i)).toBe(0);
    const apply = createPoseDriver(bones);
    let previous: ReturnType<typeof getExercisePose> | undefined;
    for (let step = 0; step <= 10; step++) {
      const pose = apply("seated-leg-curl", step / 10);
      scene.updateMatrixWorld(true);
      mesh.skeleton.update();
      if (step === 0) {
        let thighSurface = -Infinity;
        for (let i = 0; i < p.count; i++) {
          const vertex = mesh.getVertexPosition(i, new Vector3());
          if (
            Math.abs(vertex.x) > 0.06 &&
            Math.abs(vertex.x) < 0.22 &&
            vertex.z > 0.21 &&
            vertex.z < 0.37 &&
            vertex.y > 0.65 &&
            vertex.y < 0.85
          )
            thighSurface = Math.max(thighSurface, vertex.y);
        }
        expect(
          Math.abs(SEATED_CURL_THIGH_PAD.y - 0.045 - thighSurface),
        ).toBeLessThan(0.003);
      }
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
