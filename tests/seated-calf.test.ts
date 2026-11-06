// @vitest-environment node
import { readFile } from "node:fs/promises";
import { beforeAll, describe, expect, it } from "vitest";
import { Bone, SkinnedMesh, Vector3 } from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "meshoptimizer";
import {
  ARM_LENGTH,
  FOREARM_LENGTH,
  createPoseDriver,
  getExercisePose,
} from "../app/_components/exercise-3d/kinematics";
import { CALF_FOOT_CONTACT } from "../app/_components/exercise-3d/standing-calf-pose";
import {
  SEATED_CALF_HIP,
  SEATED_CALF_PIVOT,
  getSeatedCalfPad,
} from "../app/_components/exercise-3d/seated-calf-pose";
import { createSeatedCalfMuscleMask } from "../app/_components/exercise-3d/seated-calf-muscles";
import { createStandingCalfMuscleMask } from "../app/_components/exercise-3d/standing-calf-muscles";
import { createGobletSumoDeadliftAttribute } from "../app/_components/exercise-3d/sumo-deadlift-muscles";
import { getExerciseAnimation } from "../app/_components/exercise-3d/exercises";
import atlas from "../app/_components/exercise-3d/standing-calf-muscle-map.json";

let mesh: SkinnedMesh, apply: ReturnType<typeof createPoseDriver>;
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
  const bones = new Map<string, Bone>();
  scene.traverse((o) => {
    if (o instanceof Bone) bones.set(o.name, o);
    if (o instanceof SkinnedMesh) mesh = o;
  });
  apply = createPoseDriver(bones);
});
describe("seated machine calf raise", () => {
  it("resolves its UUID and exact aliases without capturing the standing variant", () => {
    expect(getExerciseAnimation("00000000-0000-4000-8000-000000000118")).toBe(
      "seated-calf",
    );
    expect(getExerciseAnimation(null, "Panturrilha Sentado")).toBe(
      "seated-calf",
    );
    expect(getExerciseAnimation(null, "Panturrilha em Pé")).toBe(
      "standing-calf",
    );
    expect(
      getExerciseAnimation(null, "Panturrilha Unilateral Sentado"),
    ).toBeNull();
  });
  it("retains seat and forefoot contact and anatomical segment lengths through 101 poses", () => {
    for (let i = 0; i <= 100; i++) {
      const pose = getExercisePose("seated-calf", i / 100);
      for (const l of pose.limbs) {
        expect(
          l.hip.distanceTo(SEATED_CALF_HIP.clone().setX(l.side * 0.14)),
        ).toBeLessThan(1e-8);
        expect(
          CALF_FOOT_CONTACT.clone()
            .applyQuaternion(l.footRotation)
            .add(l.ankle)
            .distanceTo(SEATED_CALF_PIVOT.clone().setX(l.side * 0.14)),
        ).toBeLessThan(1e-8);
        expect(l.hip.distanceTo(l.knee)).toBeCloseTo(0.44, 7);
        expect(l.knee.distanceTo(l.ankle)).toBeCloseTo(0.42, 7);
        expect(l.shoulder.distanceTo(l.elbow)).toBeCloseTo(ARM_LENGTH, 7);
        expect(l.elbow.distanceTo(l.wrist)).toBeCloseTo(FOREARM_LENGTH, 7);
        const angle =
          (l.hip.clone().sub(l.knee).angleTo(l.ankle.clone().sub(l.knee)) *
            180) /
          Math.PI;
        expect(angle).toBeGreaterThan(75);
        expect(angle).toBeLessThan(110);
        expect(getSeatedCalfPad(pose).y).toBeGreaterThan(
          l.hip.clone().lerp(l.knee, 0.8).y,
        );
      }
    }
  });
  it("distinguishes soleus emphasis from standing gastrocnemius emphasis and packs without new GPU slots", () => {
    const seated = createSeatedCalfMuscleMask(mesh.geometry),
      standing = createStandingCalfMuscleMask(mesh.geometry),
      packed = createGobletSumoDeadliftAttribute(mesh.geometry);
    expect(packed.itemSize).toBe(4);
    for (const s of atlas.selections) {
      const i = s.indices[0];
      if (/^Soleus/.test(s.name)) expect(seated.getX(i)).toBe(1);
      else if (/gastrocnemius/.test(s.name)) {
        expect(seated.getX(i)).toBeCloseTo(0.45);
        expect(standing.getX(i)).toBe(1);
      }
    }
    let mismatches = 0;
    for (let i = 0; i < seated.count; i++)
      if (packed.getW(i) !== seated.getX(i)) mismatches++;
    expect(mismatches).toBe(0);
  });
  it("keeps the actual skinned feet on the platform and all sampled vertices finite", () => {
    for (const d of [0, 0.25, 0.5, 0.75, 1]) {
      apply("seated-calf", d);
      mesh.parent!.updateMatrixWorld(true);
      mesh.skeleton.update();
      const soles = [Infinity, Infinity];
      let finite = true;
      for (let i = 0; i < mesh.geometry.attributes.position.count; i += 2) {
        const p = mesh.getVertexPosition(i, new Vector3());
        finite = finite && p.toArray().every(Number.isFinite);
        if (Math.abs(p.x) < 0.24 && p.z > 0.56 && p.z < 0.75 && p.y < 0.26) {
          const side = p.x < 0 ? 0 : 1;
          soles[side] = Math.min(soles[side], p.y);
        }
      }
      expect(finite).toBe(true);
      for (const y of soles) {
        expect(y).toBeGreaterThan(0.17);
        expect(y).toBeLessThan(0.19);
      }
    }
  });
});
