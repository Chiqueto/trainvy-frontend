// @vitest-environment node
import { readFile } from "node:fs/promises";
import { beforeAll, describe, expect, it } from "vitest";
import { Bone, SkinnedMesh, Vector3 } from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "meshoptimizer";
import { createPoseDriver } from "../app/_components/exercise-3d/kinematics";
import { EXERCISE_ANIMATIONS } from "../app/_components/exercise-3d/exercises";
import { createTissueMaterial } from "../app/_components/exercise-3d/anatomy-material";

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
  scene.traverse((object) => {
    if (object instanceof Bone) bones.set(object.name, object);
    if (object instanceof SkinnedMesh) mesh = object;
  });
  apply = createPoseDriver(bones);
});

describe("Trainvy anatomical athlete", () => {
  it("has a complete neutral-pose rig, joint supports and normalised weights", () => {
    expect(mesh.skeleton.bones).toHaveLength(15);
    expect(mesh.skeleton.bones.map((b) => b.name)).toContain("elbow_L");
    const weights = mesh.geometry.getAttribute("skinWeight");
    let maximumError = 0;
    for (let i = 0; i < weights.count; i += 19)
      maximumError = Math.max(
        maximumError,
        Math.abs(
          1 -
            weights.getX(i) -
            weights.getY(i) -
            weights.getZ(i) -
            weights.getW(i),
        ),
      );
    expect(maximumError).toBeLessThan(0.005);
  });
  it("uses independent, nonempty primary/secondary maps and leaves the face neutral", () => {
    const masks = mesh.geometry.getAttribute("_exercisemuscles"),
      positions = mesh.geometry.getAttribute("position");
    let squat = 0,
      bench = 0,
      independent = 0,
      colouredFace = 0;
    for (let i = 0; i < masks.count; i++) {
      if (masks.getX(i) > 0.2) squat++;
      if (masks.getY(i) > 0.2) bench++;
      if (masks.getX(i) !== masks.getY(i)) independent++;
      if (positions.getY(i) > 1.49 && (masks.getX(i) > 0 || masks.getY(i) > 0))
        colouredFace++;
    }
    expect(squat).toBeGreaterThan(5000);
    expect(bench).toBeGreaterThan(5000);
    expect(independent).toBeGreaterThan(10000);
    expect(colouredFace).toBe(0);
    expect(EXERCISE_ANIMATIONS.squat.muscles.primary).not.toEqual(
      EXERCISE_ANIMATIONS["bench-press"].muscles.primary,
    );
  });
  it.each(["squat", "bench-press"] as const)(
    "keeps every sampled vertex finite through %s",
    (exercise) => {
      const p = new Vector3();
      let invalid = 0,
        maximumRadius = 0;
      for (const depth of [0, 0.25, 0.5, 0.75, 1]) {
        apply(exercise, depth);
        mesh.parent!.updateMatrixWorld(true);
        mesh.skeleton.update();
        for (
          let i = 0;
          i < mesh.geometry.getAttribute("position").count;
          i += 47
        ) {
          mesh.getVertexPosition(i, p);
          if (!p.toArray().every(Number.isFinite)) invalid++;
          maximumRadius = Math.max(maximumRadius, p.length());
        }
      }
      expect(invalid).toBe(0);
      expect(maximumRadius).toBeLessThan(3);
    },
  );
  it("can switch to neutral anatomy without replacing the material or linking external textures", () => {
    const { material, setAppearance } = createTissueMaterial();
    setAppearance("squat", false);
    setAppearance("bench-press", true);
    expect(material.map).toBeNull();
    expect(material.normalMap).toBeNull();
    expect(material.vertexColors).toBe(true);
    material.dispose();
  });
});
