/** Import only the four licensed muscles absent from the shared surface atlas.
 * node scripts/create-hip-abduction-supplement.mjs <MuscularSystem100.fbx>
 * The shared athlete and all existing checksum-bound masks remain unchanged.
 */
import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import * as T from "three";
import { FBXLoader } from "three/addons/loaders/FBXLoader.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";
import {
  mergeGeometries,
  mergeVertices,
} from "three/addons/utils/BufferGeometryUtils.js";
import { MeshoptDecoder } from "meshoptimizer";
import {
  alignPelvicPoint,
  decorateConnection,
} from "./anatomical-connections.mjs";
import { compressAnatomyGlb } from "./compress-anatomy-glb.mjs";

globalThis.FileReader = class {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then((result) => {
      this.result = result;
      this.onloadend?.();
    });
  }
};
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const root = new URL("../public/models/exercise-3d/", import.meta.url);
const baseBytes = await readFile(new URL("trainvy-athlete.glb", root));
const manifest = JSON.parse(
  await readFile(new URL("model-manifest.json", root), "utf8"),
);
if (hash(baseBytes) !== manifest.sha256)
  throw new Error("Unexpected athlete asset");
const { scene: base } = await new GLTFLoader()
  .setMeshoptDecoder(MeshoptDecoder)
  .parseAsync(
    baseBytes.buffer.slice(
      baseBytes.byteOffset,
      baseBytes.byteOffset + baseBytes.byteLength,
    ),
    "",
  );
let athlete;
base.traverse((o) => {
  if (o.isSkinnedMesh) athlete = o;
});
const bones = athlete.skeleton.bones.map((source) => {
  const b = new T.Bone();
  b.name = source.name;
  b.position.copy(source.position);
  return b;
});
const sourceBytes = await readFile(process.argv[2]);
const source = new FBXLoader().parse(
  sourceBytes.buffer.slice(
    sourceBytes.byteOffset,
    sourceBytes.byteOffset + sourceBytes.byteLength,
  ),
  "",
);
source.updateMatrixWorld(true);
const parts = [],
  structures = [];
source.traverse((o) => {
  if (
    !o.isMesh ||
    !/^(Gluteus_minimus_muscle|Tensor_fasciae_latae)[lr]$/.test(o.name)
  )
    return;
  let g = o.geometry.clone().applyMatrix4(o.matrixWorld);
  for (const key of Object.keys(g.attributes))
    if (key !== "position") g.deleteAttribute(key);
  const point = new T.Vector3(),
    positions = g.attributes.position;
  for (let i = 0; i < positions.count; i++) {
    point.fromBufferAttribute(positions, i);
    const y = point.y * 0.01,
      side = Math.sign(point.x);
    point.set(point.x * 0.011, y * 0.988 - 0.0074, 0.12 + point.z * 0.0095);
    if (y < 1) {
      const t = T.MathUtils.clamp((0.88 - y) / 0.45, 0, 1),
        u = T.MathUtils.clamp((0.43 - y) / 0.375, 0, 1);
      point.x += side * (0.035 + 0.03 * t + 0.02 * u);
      point.z += -0.04 + 0.12 * t - 0.155 * u;
    }
    alignPelvicPoint(point, true);
    positions.setXYZ(i, ...point.toArray());
  }
  g = mergeVertices(g, 1e-6);
  g.computeVertexNormals();
  decorateConnection(g, o.name, bones);
  parts.push(g);
  structures.push({ name: o.name, vertices: g.attributes.position.count });
});
if (structures.length !== 4)
  throw new Error("Expected only bilateral minimus and TFL");
const geometry = mergeGeometries(parts);
const mesh = new T.SkinnedMesh(
  geometry,
  new T.MeshStandardMaterial({ vertexColors: true }),
);
mesh.name = "Trainvy_HipAbduction_LicensedMuscles";
const scene = new T.Scene();
scene.add(mesh, ...bones);
scene.updateMatrixWorld(true);
mesh.bind(new T.Skeleton(bones));
mesh.normalizeSkinWeights();
const data = await compressAnatomyGlb(
  await new GLTFExporter().parseAsync(scene, { binary: true }),
);
await writeFile(new URL("hip-abduction-supplement.glb", root), data);
const provenance = {
  asset: "hip-abduction-supplement.glb",
  sha256: hash(data),
  baseAssetSha256: manifest.sha256,
  sourceSha256: hash(sourceBytes),
  source: "Z-Anatomy / BodyParts3D",
  license: "CC-BY-SA-4.0",
  bones: bones.map((b) => b.name),
  structures,
  vertices: geometry.attributes.position.count,
  triangles: geometry.index.count / 3,
  bytes: data.length,
};
await writeFile(
  new URL("hip-abduction-supplement.json", root),
  JSON.stringify(provenance, null, 2) + "\n",
);
console.log(JSON.stringify(provenance, null, 2));
