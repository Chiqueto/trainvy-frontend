// @vitest-environment node
import { readFile } from "node:fs/promises";
import { beforeAll, describe, expect, it } from "vitest";
import { Bone, Line3, SkinnedMesh, Vector3 } from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "meshoptimizer";
import {
  createGrippingHandGeometry,
  HAND_GRIP_CENTER,
  prepareHandReplacement,
} from "../app/_components/exercise-3d/gripping-hand-geometry";
import { PULLING_EXERCISES } from "../app/_components/exercise-3d/scapular-motion";
import { usesPowerGrip } from "../app/_components/exercise-3d/power-grip";
import {
  createPoseDriver,
  getExercisePose,
} from "../app/_components/exercise-3d/kinematics";
import {
  getCableRowAttachment,
  getCableRowHandleRotation,
  CABLE_ROW_PULLEY,
} from "../app/_components/exercise-3d/cable-row-pose";
import { forearmDirectionError } from "./helpers/forearm-direction-error";
import chest from "../app/_components/exercise-3d/fly-muscle-map.json";
import lower from "../app/_components/exercise-3d/sumo-dumbbell-muscle-map.json";
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
describe("readable and mechanically aligned pulling grips", () => {
  it("replaces only rigid neutral hand faces and restores every original index for other exercises", () => {
    const index = mesh.geometry.index!,
      before = Array.from(index.array),
      positions = mesh.geometry.attributes.position;
    const replacement = prepareHandReplacement(mesh);
    expect(replacement.removedTriangles).toBeGreaterThan(1000);
    replacement.setEnabled(true);
    expect(mesh.geometry.index).toBe(index);
    expect(mesh.geometry.drawRange.count).toBe(
      before.length - replacement.removedTriangles * 3,
    );
    const ids = mesh.geometry.attributes.skinIndex,
      w = mesh.geometry.attributes.skinWeight,
      uv = mesh.geometry.attributes.uv;
    let remaining = 0;
    for (let i = 0; i < mesh.geometry.drawRange.count; i += 3) {
      if (
        [0, 1, 2].every((j) => {
          const p = index.getX(i + j);
          return (
            uv.getY(p) < 0.1 &&
            w.getX(p) > 0.999 &&
            /^hand_[LR]$/.test(mesh.skeleton.bones[ids.getX(p)].name)
          );
        })
      )
        remaining++;
    }
    expect(remaining).toBe(0);
    expect(mesh.geometry.attributes.position).toBe(positions);
    replacement.setEnabled(false);
    expect(Array.from(index.array)).toEqual(before);
    expect(mesh.geometry.drawRange.count).toBe(Infinity);
  });
  it("models mirrored opposed thumbs and leaves the cylinder lumen clear", () => {
    for (const side of [-1, 1]) {
      const geometry = createGrippingHandGeometry(side),
        p = geometry.attributes.position;
      geometry.computeBoundingBox();
      expect(
        side < 0 ? -geometry.boundingBox!.min.x : geometry.boundingBox!.max.x,
      ).toBeGreaterThan(0.05);
      let radial = Infinity;
      for (let i = 0; i < p.count; i++)
        radial = Math.min(
          radial,
          Math.hypot(
            p.getY(i) - HAND_GRIP_CENTER.y,
            p.getZ(i) - HAND_GRIP_CENTER.z,
          ),
        );
      expect(radial).toBeGreaterThan(0.011);
      geometry.dispose();
    }
  });
  it.each(PULLING_EXERCISES)(
    "%s aligns hand, fingers and metal shaft while preserving the forearm bind axis",
    (exercise) => {
      for (let i = 0; i <= 40; i++) {
        const pose = apply(exercise, i / 40);
        mesh.parent!.updateMatrixWorld(true);
        mesh.skeleton.update();
        for (const l of pose.limbs) {
          if (!usesPowerGrip(exercise, l.side)) continue;
          const shaft = new Vector3(1, 0, 0).applyQuaternion(l.handRotation);
          const target =
            exercise === "cable-row"
              ? new Vector3(0, 1, 0).applyQuaternion(
                  getCableRowHandleRotation(pose),
                )
              : exercise === "machine-row"
                ? new Vector3(0, 1, 0)
                : exercise === "one-arm-row"
                  ? new Vector3(0, 0, 1)
                  : new Vector3(1, 0, 0);
          expect(Math.abs(shaft.dot(target))).toBeGreaterThan(0.999999);
          expect(
            forearmDirectionError(mesh, l.side < 0 ? "L" : "R", l),
          ).toBeLessThan(1e-6);
          expect(
            HAND_GRIP_CENTER.clone()
              .applyQuaternion(l.handRotation)
              .add(l.wrist)
              .distanceTo(l.grip),
          ).toBeLessThan(1e-6);
          const deviation = new Vector3(0, -1, 0)
            .applyQuaternion(l.handRotation)
            .angleTo(l.wrist.clone().sub(l.elbow));
          expect(
            deviation,
            exercise + " " + i + " wrist deviation",
          ).toBeLessThan(0.63);
        }
      }
    },
  );
  it("shows opposite palm and thumb directions in pronated and supinated rows", () => {
    const pronated = getExercisePose("bent-row", 1),
      supinated = getExercisePose("supinated-bent-row", 1);
    for (const [i, l] of pronated.limbs.entries()) {
      const palm = new Vector3(0, 0, 1).applyQuaternion(l.handRotation),
        other = new Vector3(0, 0, 1).applyQuaternion(
          supinated.limbs[i].handRotation,
        );
      expect(palm.dot(other)).toBeLessThan(-0.98);
      expect(
        new Vector3(l.side, 0, 0).applyQuaternion(l.handRotation).x * l.side,
      ).toBeLessThan(-0.99);
      expect(
        new Vector3(l.side, 0, 0).applyQuaternion(
          supinated.limbs[i].handRotation,
        ).x * l.side,
      ).toBeGreaterThan(0.99);
    }
  });
  it("places the open supporting palm and fingers on the unilateral bench", () => {
    const pose = getExercisePose("one-arm-row", 0),
      hand = pose.limbs[0],
      g = createGrippingHandGeometry(-1, true),
      p = g.attributes.position;
    let min = Infinity;
    for (let i = 0; i < p.count; i++)
      min = Math.min(
        min,
        new Vector3()
          .fromBufferAttribute(p, i)
          .applyQuaternion(hand.handRotation)
          .add(hand.wrist).y,
      );
    expect(min).toBeGreaterThan(0.497);
    expect(min).toBeLessThan(0.505);
    g.dispose();
  });
  it("keeps the complete triangle ahead of the abdomen and its apex aligned with the low cable", () => {
    const torso = [
      ...new Set(
        [chest, lower].flatMap((a) =>
          a.selections
            .filter((s) =>
              /pectoralis_major|Rectus_abdominis|External_abdominal/.test(
                s.name,
              ),
            )
            .flatMap((s) => s.indices),
        ),
      ),
    ];
    for (const depth of [0, 0.25, 0.5, 0.75, 1]) {
      const pose = apply("cable-row", depth);
      mesh.parent!.updateMatrixWorld(true);
      mesh.skeleton.update();
      const rotation = getCableRowHandleRotation(pose),
        attachment = getCableRowAttachment(pose);
      // The attachment eye articulates independently; the shaft must face forward
      // without tipping the grips through the full downward cable angle.
      expect(
        attachment
          .clone()
          .sub(pose.bar)
          .normalize()
          .dot(CABLE_ROW_PULLEY.clone().sub(pose.bar).normalize()),
      ).toBeGreaterThan(0.8);
      expect(attachment.y).toBeLessThan(pose.bar.y);
      expect(attachment.z).toBeGreaterThan(pose.bar.z);
      const world = (p: Vector3) => p.applyQuaternion(rotation).add(pose.bar);
      const lines: [Line3, number][] = [];
      for (const side of [-1, 1]) {
        lines.push([
          new Line3(
            world(new Vector3(side * 0.09, -0.08, 0)),
            world(new Vector3(side * 0.09, 0.08, 0)),
          ),
          0.015,
        ]);
        for (const y of [-0.08, 0.08])
          lines.push([
            new Line3(
              world(new Vector3(side * 0.09, y, 0)),
              world(new Vector3(0, 0, 0.14)),
            ),
            0.012,
          ]);
      }
      let gap = Infinity;
      const point = new Vector3(),
        near = new Vector3();
      for (const i of torso) {
        point.fromBufferAttribute(mesh.geometry.attributes.position, i);
        mesh.applyBoneTransform(i, point);
        for (const [line, radius] of lines)
          gap = Math.min(
            gap,
            line.closestPointToPoint(point, true, near).distanceTo(point) -
              radius,
          );
      }
      expect(gap, "triangle/body " + depth).toBeGreaterThan(-0.004);
      if (depth === 0)
        expect(pose.bar.y - pose.origin.y + 1.142).toBeLessThan(1.1);
    }
  });
});
