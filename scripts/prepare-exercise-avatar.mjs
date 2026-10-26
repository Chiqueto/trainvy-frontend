/** Adapt the existing first-app GLB without rebuilding or replacing its sculpt.
 * Usage: node scripts/prepare-exercise-avatar.mjs path/to/anatomical-lifter.glb
 * The original file is read only. Output is a self-contained local GLB.
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import * as T from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";

globalThis.FileReader = class {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then((result) => {
      this.result = result;
      this.onloadend?.();
    });
  }
};
if (!process.argv[2])
  throw new Error("Pass the original anatomical-lifter.glb path.");
const source = await readFile(process.argv[2]);
const { scene } = await new GLTFLoader().parseAsync(
  source.buffer.slice(source.byteOffset, source.byteOffset + source.byteLength),
  "",
);
const meshes = [];
scene.traverse((object) => {
  if (object.isSkinnedMesh) meshes.push(object);
});
if (meshes.length !== 1)
  throw new Error("Expected the single anatomical mesh from first-app.");
const mesh = meshes[0];
const bones = [...mesh.skeleton.bones];
if (bones.length !== 7 || bones[0].name !== "sled")
  throw new Error("Unsupported source skeleton.");
const origin = bones[0].position.clone();
const tilt = new T.Quaternion().setFromAxisAngle(
  new T.Vector3(1, 0, 0),
  -Math.PI / 4,
);
const inverseTilt = tilt.clone().invert();
const v = (x, y, z) => new T.Vector3(x, y, z);
const arms = [-1, 1].map((side) => {
  const shoulder = v(side * 0.215, 0.224, 0.132);
  const elbow = v(side * 0.354, 0.075, 0.231);
  const wrist = v(side * 0.331, 0.35, 0.219);
  const index = bones.length;
  for (const [name, point] of [
    ["upperArm", shoulder],
    ["forearm", elbow],
    ["hand", wrist],
  ]) {
    const bone = new T.Bone();
    bone.name = `${name}_${side < 0 ? "L" : "R"}`;
    bone.position.copy(point).applyQuaternion(tilt).add(origin);
    bones.push(bone);
    scene.add(bone);
  }
  return { shoulder, elbow, wrist, index };
});
function segment(p, a, b) {
  const d = b.clone().sub(a);
  const t = p.clone().sub(a).dot(d) / d.lengthSq();
  return {
    t,
    distance: p.distanceTo(
      a.clone().addScaledVector(d, T.MathUtils.clamp(t, 0, 1)),
    ),
  };
}
const { position, skinIndex, skinWeight, uv } = mesh.geometry.attributes;
const exerciseMuscles = new Float32Array(position.count * 3);
const point = new T.Vector3();
let changed = 0;
for (let i = 0; i < position.count; i++) {
  point
    .fromBufferAttribute(position, i)
    .sub(origin)
    .applyQuaternion(inverseTilt);
  // Keep the source's hack-squat mask for this exercise's legs/glutes.
  // A separate, neutral-by-default mask marks only visible bench-press
  // prime movers and secondary muscles. These are visual categories, not EMG.
  const absX = Math.abs(point.x);
  const tissue = uv.getY(i);
  exerciseMuscles[i * 3] = uv.getX(i);
  if (tissue > 0) {
    const chest =
      T.MathUtils.smoothstep(absX, 0.025, 0.055) *
      (1 - T.MathUtils.smoothstep(absX, 0.14, 0.17)) *
      T.MathUtils.smoothstep(point.y, 0.06, 0.1) *
      (1 - T.MathUtils.smoothstep(point.y, 0.235, 0.27)) *
      T.MathUtils.smoothstep(point.z, 0.155, 0.185);
    const anteriorDeltoid =
      T.MathUtils.smoothstep(absX, 0.17, 0.195) *
      (1 - T.MathUtils.smoothstep(absX, 0.275, 0.3)) *
      T.MathUtils.smoothstep(point.y, 0.12, 0.16) *
      (1 - T.MathUtils.smoothstep(point.y, 0.255, 0.29)) *
      T.MathUtils.smoothstep(point.z, 0.175, 0.205);
    const triceps =
      T.MathUtils.smoothstep(absX, 0.27, 0.3) *
      (1 - T.MathUtils.smoothstep(absX, 0.4, 0.43)) *
      T.MathUtils.smoothstep(point.y, 0.015, 0.06) *
      (1 - T.MathUtils.smoothstep(point.y, 0.22, 0.255)) *
      (1 - T.MathUtils.smoothstep(point.z, 0.205, 0.235));
    exerciseMuscles[i * 3 + 1] = Math.max(
      chest,
      anteriorDeltoid,
      triceps * 0.8,
    );
  }
  if (Math.abs(point.x) < 0.175 || point.y < -0.02) continue;
  const { shoulder, elbow, wrist, index } = arms[point.x < 0 ? 0 : 1];
  const upper = segment(point, shoulder, elbow);
  const lower = segment(point, elbow, wrist);
  const shoulderBlend = T.MathUtils.smoothstep(Math.abs(point.x), 0.175, 0.265);
  let weights;
  if (upper.distance < lower.distance) {
    const bend = T.MathUtils.smoothstep(upper.t, 0.8, 1.1);
    weights = [
      1 - shoulderBlend,
      shoulderBlend * (1 - bend),
      shoulderBlend * bend,
      0,
    ];
  } else {
    const bend = T.MathUtils.smoothstep(lower.t, -0.1, 0.2);
    const hand = T.MathUtils.smoothstep(lower.t, 0.85, 1.02);
    weights = [
      1 - shoulderBlend,
      shoulderBlend * (1 - bend),
      shoulderBlend * bend * (1 - hand),
      shoulderBlend * bend * hand,
    ];
  }
  skinIndex.setXYZW(i, 0, index, index + 1, index + 2);
  skinWeight.setXYZW(i, ...weights);
  changed++;
}
mesh.geometry.setAttribute(
  "_exerciseMuscles",
  new T.BufferAttribute(exerciseMuscles, 3),
);
scene.updateMatrixWorld(true);
mesh.bind(new T.Skeleton(bones));
mesh.normalizeSkinWeights();
const output = new URL(
  "../public/models/exercise-3d/anatomical-lifter.glb",
  import.meta.url,
);
await mkdir(new URL(".", output), { recursive: true });
const result = await new GLTFExporter().parseAsync(scene, {
  binary: true,
  onlyVisible: false,
});
await writeFile(output, Buffer.from(result));
console.log(
  JSON.stringify({
    bones: bones.length,
    vertices: position.count,
    armVertices: changed,
    vertexAttribute: "exerciseMuscles",
    bytes: result.byteLength,
  }),
);
