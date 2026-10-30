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
  getProneLegCurlLeverAngle,
  getProneLegCurlRoller,
  PRONE_CURL_KNEE,
  PRONE_CURL_PAD_ANGLE,
  PRONE_CURL_TORSO_PAD_ANGLE,
  PRONE_CURL_ROLLER_RADIUS,
  getProneLegCurlPads,
} from "../app/_components/exercise-3d/prone-leg-curl-pose";
import { createProneLegCurlMuscleMask } from "../app/_components/exercise-3d/prone-leg-curl-muscles";
import { createLegExtensionMuscleMask } from "../app/_components/exercise-3d/leg-extension-muscles";
import map from "../app/_components/exercise-3d/prone-leg-curl-muscle-map.json";
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

describe("prone leg curl", () => {
  it("selects the canonical prone variant without conflating seated, standing or unilateral curls", () => {
    expect(getExerciseAnimation(EXERCISE_ANIMATIONS["prone-leg-curl"].id)).toBe(
      "prone-leg-curl",
    );
    for (const name of [
      "Mesa Flexora",
      "Flexora deitada",
      "Prone leg curl",
      "Lying leg curl",
    ])
      expect(getExerciseAnimation(null, name)).toBe("prone-leg-curl");
    expect(getExerciseAnimation(null, "Cadeira Flexora")).toBe(
      "seated-leg-curl",
    );
    for (const name of ["Mesa Flexora Unilateral", "Flexora em pé"])
      expect(getExerciseAnimation(null, name)).toBeNull();
  });

  it("preserves bone lengths, neutral ankles and 30-degree hip flexion while the posterior roller follows the knees", () => {
    const start = getExercisePose("prone-leg-curl", 0);
    const radius = getProneLegCurlRoller(start).distanceTo(PRONE_CURL_KNEE);
    const headward = new Vector3(0, 1, 0).applyQuaternion(start.tilt);
    const anterior = new Vector3(0, 0, 1).applyQuaternion(start.tilt);
    expect(anterior.y).toBeLessThan(-0.9);
    for (let step = 0; step <= 100; step++) {
      const pose = getExercisePose("prone-leg-curl", step / 100),
        roller = getProneLegCurlRoller(pose);
      expect(pose.origin.distanceTo(start.origin)).toBeLessThan(1e-10);
      expect(pose.tilt.angleTo(start.tilt)).toBeLessThan(1e-7);
      const rendered = new Vector3(0, 0, radius)
        .applyAxisAngle(new Vector3(1, 0, 0), getProneLegCurlLeverAngle(pose))
        .add(PRONE_CURL_KNEE);
      expect(rendered.distanceTo(roller)).toBeLessThan(1e-9);
      for (const [index, limb] of pose.limbs.entries()) {
        for (const contact of ["hip", "knee", "shoulder", "grip"] as const)
          expect(
            limb[contact].distanceTo(start.limbs[index][contact]),
          ).toBeLessThan(1e-10);
        expect(limb.hip.distanceTo(limb.knee)).toBeCloseTo(0.44, 9);
        expect(limb.knee.distanceTo(limb.ankle)).toBeCloseTo(0.42, 9);
        expect(limb.shoulder.distanceTo(limb.elbow)).toBeCloseTo(ARM_LENGTH, 9);
        expect(limb.elbow.distanceTo(limb.wrist)).toBeCloseTo(
          FOREARM_LENGTH,
          9,
        );
        expect(
          ((Math.PI - headward.angleTo(limb.knee.clone().sub(limb.hip))) *
            180) /
            Math.PI,
        ).toBeCloseTo(30, 8);
        const flexion =
          Math.PI -
          limb.hip
            .clone()
            .sub(limb.knee)
            .angleTo(limb.ankle.clone().sub(limb.knee));
        expect((flexion * 180) / Math.PI).toBeCloseTo(90 - 0.8 * step, 8);
        const shin = limb.ankle.clone().sub(limb.knee).normalize();
        const posterior = new Vector3(0, -shin.z, shin.y);
        const contact = limb.knee.clone().addScaledVector(shin, 0.34);
        const offset = roller.clone().setX(contact.x).sub(contact);
        expect(offset.dot(posterior)).toBeCloseTo(
          PRONE_CURL_ROLLER_RADIUS + 0.035,
          9,
        );
        const toes = new Vector3(0, 0, 1).applyQuaternion(limb.footRotation);
        expect(Math.abs(toes.dot(shin))).toBeLessThan(1e-9);
      }
    }
  });

  it("lowers the heels during the eccentric phase, pauses near extension and flexes smoothly", () => {
    const heel = (phase: number) =>
      getExercisePose("prone-leg-curl", getExerciseDepth(phase)).limbs[0].ankle
        .y;
    expect(heel(0)).toBeGreaterThan(heel(0.25));
    expect(heel(0.25)).toBeGreaterThan(heel(0.48));
    expect(heel(0.48)).toBeCloseTo(heel(0.53), 9);
    expect(heel(0.75)).toBeGreaterThan(heel(0.54));
    expect(heel(1)).toBeCloseTo(heel(0), 9);
  });

  it("uses independently reviewed named surfaces and keeps quadriceps and the upper body neutral", () => {
    const mask = createProneLegCurlMuscleMask(mesh.geometry),
      extension = createLegExtensionMuscleMask(mesh.geometry);
    expect(map.baseAssetSha256).toBe(manifest.sha256);
    expect(new Set(map.selections.map((s) => s.name)).size).toBe(16);
    let primary = 0,
      secondary = 0;
    for (const s of map.selections) {
      expect(s.confidence).toBeGreaterThanOrEqual(0.8);
      const isHamstring = /biceps_femoris|Semitendinosus|Semimembranosus/.test(
        s.name,
      );
      for (const i of s.indices) {
        expect(mask.getX(i)).toBeCloseTo(isHamstring ? 1 : 0.45);
        if (isHamstring) primary++;
        else secondary++;
      }
    }
    expect(primary).toBeGreaterThan(5000);
    expect(secondary).toBeGreaterThan(4000);
    for (let i = 0; i < mask.count; i++) {
      if (
        extension.getX(i) > 0.9 ||
        mesh.geometry.attributes.position.getY(i) > 1.12
      )
        expect(mask.getX(i)).toBe(0);
    }
  });

  it("keeps the real skinned model finite and the distal forearm aligned with its grip across the arc", () => {
    for (let step = 0; step <= 10; step++) {
      const pose = apply("prone-leg-curl", step / 10);
      mesh.parent!.updateMatrixWorld(true);
      mesh.skeleton.update();
      for (const limb of pose.limbs) {
        const suffix = limb.side < 0 ? "L" : "R";
        const restAxis = rest
          .get(`hand_${suffix}`)!
          .clone()
          .sub(rest.get(`forearm_${suffix}`)!)
          .normalize();
        const axis = limb.wrist.clone().sub(limb.elbow).normalize();
        for (const name of [
          `forearm_${suffix}`,
          `wrist_${suffix}`,
          `hand_${suffix}`,
        ])
          expect(
            restAxis
              .clone()
              .applyQuaternion(bones.get(name)!.quaternion)
              .dot(axis),
          ).toBeGreaterThan(0.99999);
      }
      for (let i = 0; i < mesh.geometry.attributes.position.count; i += 31) {
        const vertex = mesh.getVertexPosition(i, new Vector3());
        expect(vertex.toArray().every(Number.isFinite)).toBe(true);
        expect(vertex.y).toBeGreaterThan(0.03);
      }
    }
  });

  it("fits the supported chest, hips and thighs against the padding without deep clipping", () => {
    apply("prone-leg-curl", 1);
    mesh.parent!.updateMatrixWorld(true);
    mesh.skeleton.update();
    let chest = Infinity,
      thigh = Infinity,
      hip = Infinity;
    const pads = getProneLegCurlPads();
    const chestNormal = new Vector3(
      0,
      Math.cos(PRONE_CURL_TORSO_PAD_ANGLE),
      Math.sin(PRONE_CURL_TORSO_PAD_ANGLE),
    );
    const thighNormal = new Vector3(
      0,
      Math.cos(PRONE_CURL_PAD_ANGLE),
      -Math.sin(PRONE_CURL_PAD_ANGLE),
    );
    const hipNormal = new Vector3(
      0,
      Math.cos(pads.hipAngle),
      Math.sin(pads.hipAngle),
    );
    // Signed perpendicular distance to the rendered top faces, accounting for
    // each pad's rotation and 8 cm thickness, rather than world-Y separation.
    const uv = mesh.geometry.attributes.uv;
    for (let i = 0; i < uv.count; i++) {
      if (uv.getY(i) < 0.9) continue;
      const p = mesh.getVertexPosition(i, new Vector3());
      if (
        Math.abs(p.x) < 0.17 &&
        p.z > -0.08 &&
        p.z < -0.02 &&
        p.y > 0.4 &&
        p.y < 0.9
      )
        hip = Math.min(hip, p.clone().sub(pads.hip).dot(hipNormal) - 0.04);
      if (
        Math.abs(p.x) < 0.17 &&
        p.z > 0.1 &&
        p.z < 0.46 &&
        p.y > 0.4 &&
        p.y < 0.9
      )
        chest = Math.min(
          chest,
          p.clone().sub(pads.torso).dot(chestNormal) - 0.04,
        );
      if (
        Math.abs(p.x) > 0.06 &&
        Math.abs(p.x) < 0.22 &&
        p.z > -0.36 &&
        p.z < -0.08 &&
        p.y > 0.4 &&
        p.y < 0.9
      )
        thigh = Math.min(
          thigh,
          p.clone().sub(pads.thigh).dot(thighNormal) - 0.04,
        );
    }
    expect(chest).toBeGreaterThan(-0.025);
    expect(chest).toBeLessThan(0.03);
    expect(thigh).toBeGreaterThan(-0.025);
    expect(thigh).toBeLessThan(0.03);
    expect(hip).toBeGreaterThan(-0.025);
    expect(hip).toBeLessThan(0.03);
  });
});
