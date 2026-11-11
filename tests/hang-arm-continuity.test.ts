// @vitest-environment node
import { readFile } from "node:fs/promises";
import { expect, it } from "vitest";
import { Bone, Quaternion, Vector3 } from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "meshoptimizer";
import { createPoseDriver } from "../app/_components/exercise-3d/kinematics";

it("keeps upper arms, forearms and hands continuous across the entire cycle", async () => {
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
  });
  const apply = createPoseDriver(bones),
    names = [
      "upperArm_L",
      "forearm_L",
      "hand_L",
      "upperArm_R",
      "forearm_R",
      "hand_R",
    ];
  const previous = new Map<string, Quaternion>(),
    max = new Map<string, { speed: number; phase: number }>();
  let previousElbow: Vector3 | undefined,
    maxElbowSpeed = 0;
  for (let i = 0; i <= 2000; i++) {
    const p = i / 2000,
      pose = apply("hang-power-clean", p),
      dt = 5.5 / 2000;
    for (const name of names) {
      const q = bones.get(name)!.quaternion;
      if (previous.has(name)) {
        const speed = previous.get(name)!.angleTo(q) / dt;
        if (speed > (max.get(name)?.speed ?? 0))
          max.set(name, { speed, phase: p });
      }
      previous.set(name, q.clone());
    }
    for (const side of ["L", "R"]) {
      expect(
        bones
          .get(`forearm_${side}`)!
          .quaternion.angleTo(bones.get(`hand_${side}`)!.quaternion),
      ).toBeLessThan(1e-6);
      expect(
        bones
          .get(`wrist_${side}`)!
          .quaternion.angleTo(bones.get(`hand_${side}`)!.quaternion),
      ).toBeLessThan(1e-6);
    }
    if (previousElbow)
      maxElbowSpeed = Math.max(
        maxElbowSpeed,
        previousElbow.distanceTo(pose.limbs[0].elbow) / dt,
      );
    previousElbow = pose.limbs[0].elbow.clone();
  }
  // Regression bounds for this illustrative rig; not physiological speed limits.
  // Previously the elbow jumped 36 cm and the arm rotated >85 degrees within 2.75 ms.
  for (const [name, { speed, phase }] of max)
    expect(speed, `${name} at ${phase}`).toBeLessThan(35);
  expect(maxElbowSpeed).toBeLessThan(7);
});
