// @vitest-environment node
import { readFile } from "node:fs/promises";
import { beforeAll, describe, expect, it } from "vitest";
import { Bone, MathUtils, Quaternion, SkinnedMesh, Vector3 } from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "meshoptimizer";
import {
  ARM_LENGTH,
  FOREARM_LENGTH,
  createPoseDriver,
  getExercisePose,
  getExerciseProgress,
} from "../app/_components/exercise-3d/kinematics";
import { UPPER_EXERCISES } from "../app/_components/exercise-3d/upper-exercise-types";
import { getScapularMotion } from "../app/_components/exercise-3d/scapular-motion";
import { installScapularRig } from "../app/_components/exercise-3d/scapular-rig";
import {
  createUpperExerciseMuscleMask,
  UPPER_MUSCLE_ROLES,
} from "../app/_components/exercise-3d/upper-exercise-muscles";
import {
  EXERCISE_ANIMATIONS,
  getExerciseAnimation,
} from "../app/_components/exercise-3d/exercises";
import { forearmDirectionError } from "./helpers/forearm-direction-error";
import shoulder from "../app/_components/exercise-3d/upper-shoulder-detail-map.json";
import arms from "../app/_components/exercise-3d/fly-muscle-map.json";
import cuff from "../app/_components/exercise-3d/lat-pulldown-detail-map.json";
import triceps from "../app/_components/exercise-3d/one-arm-row-support-map.json";
import { getRopePushdownAttachment } from "../app/_components/exercise-3d/rope-pushdown-machine";
import { getPreacherCurlBenchGeometry } from "../app/_components/exercise-3d/preacher-curl-bench";
import { PREACHER_CURL_ANGLE } from "../app/_components/exercise-3d/upper-exercise-pose";
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
  installScapularRig(mesh, bones);
  apply = createPoseDriver(bones);
});
describe("five shoulder and elbow movements, with historical curl identity", () => {
  it.each(UPPER_EXERCISES)(
    "%s retains real bones, stable supports, contact and continuous hand orientation",
    (exercise) => {
      const support = getExercisePose(exercise, 0),
        rotations: (Quaternion | undefined)[] = [];
      for (let i = 0; i <= 120; i++) {
        const pose = apply(exercise, i / 120);
        expect(pose.origin.distanceTo(support.origin)).toBeLessThan(1e-10);
        for (const [j, limb] of pose.limbs.entries()) {
          expect(limb.shoulder.distanceTo(limb.elbow)).toBeCloseTo(
            ARM_LENGTH,
            5,
          );
          expect(limb.elbow.distanceTo(limb.wrist)).toBeCloseTo(
            FOREARM_LENGTH,
            5,
          );
          expect(limb.hip.distanceTo(limb.knee)).toBeCloseTo(0.44, 5);
          expect(limb.knee.distanceTo(limb.ankle)).toBeCloseTo(0.42, 5);
          expect(limb.ankle.distanceTo(support.limbs[j].ankle)).toBeLessThan(
            1e-10,
          );
          expect(
            limb.wrist
              .clone()
              .add(
                new Vector3(0, 0.004, 0.012).applyQuaternion(limb.handRotation),
              )
              .distanceTo(limb.grip),
          ).toBeLessThan(1e-7);
          expect(forearmDirectionError(mesh, j ? "R" : "L", limb)).toBeLessThan(
            1e-6,
          );
          if (rotations[j])
            expect(limb.handRotation.angleTo(rotations[j]!)).toBeLessThan(0.14);
          rotations[j] = limb.handRotation.clone();
        }
        expect(pose.limbs[0].grip.x).toBeCloseTo(-pose.limbs[1].grip.x, 5);
      }
    },
  );
  it.each(["military-press", "dumbbell-shoulder-press"] as const)(
    "%s clears the face and finishes with extended elbows and independent scapular motion",
    (exercise) => {
      const top = getExercisePose(exercise, 0),
        bottom = getExercisePose(exercise, 1);
      expect(top.bar.y - bottom.bar.y).toBeGreaterThan(0.5);
      for (const limb of top.limbs) {
        const upper = limb.elbow.clone().sub(limb.shoulder).normalize(),
          fore = limb.wrist.clone().sub(limb.elbow).normalize();
        expect(upper.dot(fore)).toBeGreaterThan(0.9);
        expect(
          getScapularMotion(exercise, 0, limb.side).rotation.angleTo(
            getScapularMotion(exercise, 1, limb.side).rotation,
          ),
        ).toBeGreaterThan(0.5);
      }
      if (exercise === "military-press")
        for (let i = 0; i <= 100; i++) {
          const p = getExercisePose(exercise, i / 100);
          expect(p.bar.z).toBeGreaterThanOrEqual(0.05);
          expect(p.bar.z).toBeLessThanOrEqual(0.27);
        }
    },
  );
  it("supports both upper arms on the Scott bench through the curl", () => {
    const top = getExercisePose("preacher-curl", 0);
    const bottom = getExercisePose("preacher-curl", 1);
    expect(getExerciseAnimation("00000000-0000-4000-8000-000000000130")).toBe(
      "preacher-curl",
    );
    expect(top.bar.y - bottom.bar.y).toBeGreaterThan(0.3);
    for (const [index, arm] of top.limbs.entries()) {
      expect(arm.elbow.distanceTo(bottom.limbs[index].elbow)).toBeLessThan(
        1e-9,
      );
      const upper = arm.elbow.clone().sub(arm.shoulder).normalize();
      expect(upper.z).toBeGreaterThan(0.6);
      expect(arm.grip.y).toBeGreaterThan(arm.elbow.y);
      expect(bottom.limbs[index].grip.y).toBeLessThan(arm.elbow.y);
    }
    const bench = getPreacherCurlBenchGeometry();
    const normal = new Vector3(
      0,
      Math.sin(PREACHER_CURL_ANGLE),
      Math.cos(PREACHER_CURL_ANGLE),
    );
    const along = new Vector3(
      0,
      -Math.cos(PREACHER_CURL_ANGLE),
      Math.sin(PREACHER_CURL_ANGLE),
    );
    const position = mesh.geometry.getAttribute("position");
    const skinIndex = mesh.geometry.getAttribute("skinIndex");
    const skinWeight = mesh.geometry.getAttribute("skinWeight");
    const sledIndex = mesh.skeleton.bones.findIndex((b) => b.name === "sled");
    const pose = apply("preacher-curl", 0.5);
    const offset = pose.origin.clone().sub(new Vector3(0, 1.142, 0));
    let padPenetration = 0;
    let postPenetration = 0;
    let minTorsoY = Infinity;
    for (let i = 0; i < position.count; i++) {
      let sledWeight = 0;
      for (let j = 0; j < 4; j++) {
        if (skinIndex.getComponent(i, j) === sledIndex) {
          sledWeight += skinWeight.getComponent(i, j);
        }
      }
      if (sledWeight <= 0.3 || Math.abs(position.getX(i)) > 0.28) continue;
      const world = new Vector3(
        position.getX(i),
        position.getY(i),
        position.getZ(i),
      ).add(offset);
      minTorsoY = Math.min(minTorsoY, world.y);
      const relPad = world.clone().sub(bench.padCenter);
      if (
        Math.abs(relPad.x) <= bench.padSize[0] / 2 &&
        Math.abs(relPad.dot(along)) <= bench.padSize[2] / 2 &&
        Math.abs(relPad.dot(normal)) <= bench.padSize[1] / 2
      ) {
        padPenetration++;
      }
      if (
        Math.abs(world.x - bench.padPostCenter.x) <= bench.padPostSize[0] / 2 &&
        Math.abs(world.y - bench.padPostCenter.y) <= bench.padPostSize[1] / 2 &&
        Math.abs(world.z - bench.padPostCenter.z) <= bench.padPostSize[2] / 2
      ) {
        postPenetration++;
      }
    }
    expect(padPenetration).toBe(0);
    expect(postPenetration).toBe(0);
    expect(minTorsoY).toBeGreaterThanOrEqual(
      bench.seatCenter.y + bench.seatSize[1] / 2 - 0.005,
    );
    expect(MathUtils.radToDeg(PREACHER_CURL_ANGLE)).toBeGreaterThan(50);
  });
  it("keeps the pushdown rope taut and gripped as the elbows extend", () => {
    const extended = getExercisePose("rope-pushdown", 0);
    const flexed = getExercisePose("rope-pushdown", 1);
    expect(getExerciseAnimation("00000000-0000-4000-8000-000000000131")).toBe(
      "rope-pushdown",
    );
    expect(flexed.bar.y - extended.bar.y).toBeGreaterThan(0.25);
    expect(extended.limbs[1].grip.x).toBeGreaterThan(flexed.limbs[1].grip.x);
    for (let i = 0; i <= 48; i++) {
      const pose = getExercisePose("rope-pushdown", i / 48);
      const { ends, junction } = getRopePushdownAttachment(pose);
      for (const [index, end] of ends.entries()) {
        const arm = pose.limbs[index];
        expect(arm.elbow.distanceTo(extended.limbs[index].elbow)).toBeLessThan(
          1e-9,
        );
        expect(end.top.distanceTo(junction)).toBeCloseTo(0.39);
        expect(
          end.top.clone().lerp(end.stopper, 0.5).distanceTo(arm.grip),
        ).toBeLessThan(1e-9);
        expect(end.top.y).toBeLessThan(junction.y);
      }
    }
  });
  it("lateral raise preserves a small fixed elbow bend, outward motion and moving scapulae", () => {
    const up = getExercisePose("lateral-raise", 0),
      down = getExercisePose("lateral-raise", 1);
    // The forward V seen from above reduces the projected sideways span.
    expect(up.limbs[1].grip.x - down.limbs[1].grip.x).toBeGreaterThan(0.35);
    expect(up.limbs[1].grip.y - up.limbs[1].shoulder.y).toBeLessThan(0.02);
    expect(
      getScapularMotion("lateral-raise", 0, 1).rotation.angleTo(
        getScapularMotion("lateral-raise", 1, 1).rotation,
      ),
    ).toBeGreaterThan(0.35);
    for (let i = 0; i <= 20; i++) {
      const l = getExercisePose("lateral-raise", i / 20).limbs[1];
      expect(
        l.elbow
          .clone()
          .sub(l.shoulder)
          .normalize()
          .dot(l.wrist.clone().sub(l.elbow).normalize()),
      ).toBeCloseTo(Math.cos(Math.PI / 12), 6);
    }
  });
  it("curls keep elbows stable, differentiate a neutral grip and preserve legacy lookup", () => {
    for (const key of ["barbell-curl", "hammer-curl"] as const) {
      const a = getExercisePose(key, 0),
        b = getExercisePose(key, 1);
      for (let i = 0; i < 2; i++)
        expect(a.limbs[i].elbow.distanceTo(b.limbs[i].elbow)).toBeLessThan(
          1e-9,
        );
    }
    for (let i = 0; i <= 20; i++) {
      const a = getExercisePose("barbell-curl", i / 20).limbs[1],
        b = getExercisePose("hammer-curl", i / 20).limbs[1];
      expect(a.handRotation.angleTo(b.handRotation)).toBeGreaterThan(1.4);
      expect(
        new Vector3(0, 0, 1).applyQuaternion(b.handRotation).x,
      ).toBeLessThan(-0.99);
    }
    expect(
      getExerciseAnimation(
        "00000000-0000-4000-8000-000000000128",
        "Rosca Direta",
      ),
    ).toBe("legacy-barbell-curl");
    expect(getExerciseAnimation(undefined, "Rosca Direta")).toBe(
      "barbell-curl",
    );
  });
  it.each(UPPER_EXERCISES)(
    "%s maps only explicitly reviewed source surfaces",
    (exercise) => {
      const mask = createUpperExerciseMuscleMask(mesh.geometry, exercise),
        roles = UPPER_MUSCLE_ROLES[exercise];
      let primary = 0;
      for (const atlas of [shoulder, arms, cuff, triceps])
        for (const s of atlas.selections) {
          const name = s.name.replace(/[lr]$/, ""),
            expected = roles.primary.includes(name)
              ? 1
              : roles.secondary.includes(name)
                ? 0.45
                : 0;
          for (const index of s.indices)
            expect(mask.getX(index)).toBeCloseTo(expected, 5);
          if (expected === 1) primary += s.indices.length;
        }
      expect(primary).toBeGreaterThan(900);
      expect(
        EXERCISE_ANIMATIONS[exercise].instructions.execution.length,
      ).toBeGreaterThan(80);
    },
  );
  it("keeps the new extensions supported and the fixed Smith path distinct from dumbbells", () => {
    for (const exercise of ["skull-crusher", "straight-bar-pushdown"] as const) {
      const extended = getExercisePose(exercise, 0);
      const flexed = getExercisePose(exercise, 1);
      expect(extended.limbs[0].elbow.distanceTo(flexed.limbs[0].elbow)).toBeLessThan(1e-9);
      expect(extended.limbs[0].wrist.distanceTo(flexed.limbs[0].wrist)).toBeGreaterThan(0.3);
      expect(extended.limbs[0].grip.x).toBeCloseTo(flexed.limbs[0].grip.x, 6);
    }
    for (const exercise of ["incline-smith-press", "decline-smith-press"] as const) {
      const top = getExercisePose(exercise, 0);
      for (const depth of [0.25, 0.5, 0.75, 1]) {
        const pose = getExercisePose(exercise, depth);
        expect(pose.bar.z).toBe(top.bar.z);
        expect(pose.bar.y).toBeLessThan(top.bar.y);
        expect(pose.limbs[0].grip.x).toBe(top.limbs[0].grip.x);
      }
    }
    const open = getExercisePose("decline-dumbbell-press", 1).limbs;
    const closed = getExercisePose("decline-dumbbell-press", 0).limbs;
    expect(open[0].grip.distanceTo(open[1].grip)).toBeGreaterThan(closed[0].grip.distanceTo(closed[1].grip));
  });

  it("uses a slower lowering phase and real pauses in both endpoints", () => {
    expect(getExerciseProgress("military-press", 0.01)).toBe(0);
    expect(getExerciseProgress("military-press", 0.5)).toBe(1);
    expect(getExerciseProgress("military-press", 0.52)).toBe(1);
  });
});
