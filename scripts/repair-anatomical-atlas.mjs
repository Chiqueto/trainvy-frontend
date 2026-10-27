/**
 * Recover the uncut proximal muscles from the distributed v3 atlas when the
 * licensed Blender source inputs are unavailable. No anatomy is synthesised.
 *
 * node scripts/repair-anatomical-atlas.mjs <v4.glb> <v3.glb>
 * node scripts/repair-anatomical-atlas.mjs --from-git
 * Inputs must be the published v4/v3 files; hashes are checked before writing.
 * Export with Git using a binary-safe process API, never PowerShell redirection.
 */
import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import * as T from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { MeshoptDecoder } from "meshoptimizer";
import { compressAnatomyGlb } from "./compress-anatomy-glb.mjs";
import {
  alignPelvicPoint,
  loadAnatomicalConnections,
  findTorsoLiner,
  anchorGlutealAttachments,
} from "./anatomical-connections.mjs";
import { addJointSupports, skinAnatomy } from "./anatomy-skinning.mjs";
import { fitAnatomicalHead } from "./fit-anatomical-head.mjs";

globalThis.FileReader = class {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then((result) => {
      this.result = result;
      this.onloadend?.();
    });
  }
};
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
async function source(path, revision) {
  if (process.argv[2] === "--from-git") {
    return execFileSync(
      "git",
      ["show", `${revision}:public/models/exercise-3d/trainvy-athlete.glb`],
      {
        cwd: fileURLToPath(new URL("../", import.meta.url)),
        maxBuffer: 20_000_000,
      },
    );
  }
  if (!path) throw new Error("Provide v4/v3 GLB input paths or --from-git.");
  return readFile(path);
}
async function load(b, expected) {
  if (hash(b) !== expected)
    throw new Error("Unexpected source asset checksum.");
  const { scene } = await new GLTFLoader()
    .setMeshoptDecoder(MeshoptDecoder)
    .parseAsync(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength), "");
  let mesh;
  scene.traverse((o) => {
    if (o.isSkinnedMesh) mesh = o;
  });
  return mesh;
}
const v4 = await source(
  process.argv[2],
  "635a62660fa8c482f2e7241dc064745f6e01a538",
);
const v3 = await source(process.argv[3], "a57bd99");
const current = await load(
  v4,
  "4ea1a28cee208db49f7fd5e733f88d8ea43e662042cb92332088a24183a24527",
);
const uncut = await load(
  v3,
  "b2fb045c8c57539fc6eb27032a040d66287bf8f7787716a005105675df7c074d",
);
const bones = current.skeleton.bones.map((source) => {
  const b = new T.Bone();
  b.name = source.name;
  b.position.copy(source.position);
  return b;
});
addJointSupports(bones);

function select(source, lower) {
  const g = source.geometry,
    p = g.attributes.position,
    c = g.attributes.color;
  const ids = [];
  const torsoLiner = findTorsoLiner(g);
  for (let t = 0; t < g.index.count; t += 3) {
    const tri = [0, 1, 2].map((j) => g.index.getX(t + j));
    const garment = tri.every(
      (i) =>
        p.getY(i) > 0.65 &&
        p.getY(i) < 1.02 &&
        Math.abs(p.getX(i)) < 0.255 &&
        c.getX(i) < 0.035 &&
        c.getY(i) < 0.035,
    );
    // The atlas abdomen is cut exactly at .975 m. The proximal leg structures
    // are separate surfaces below it; hands at the same height stay with v4.
    const leg = tri.every(
      (i) => p.getY(i) < 0.97495 && Math.abs(p.getX(i)) < 0.255,
    );
    const obsoleteNeck = tri.every(
      (i) =>
        (torsoLiner(i) && p.getY(i) > 1.38) ||
        (g.attributes.uv.getY(i) > 0.5 &&
          p.getY(i) > 1.46 &&
          Math.abs(p.getX(i)) < 0.082),
    );
    if (!garment && !obsoleteNeck && leg === lower) ids.push(...tri);
  }
  const used = [...new Set(ids)],
    remap = new Map(used.map((id, i) => [id, i]));
  const result = new T.BufferGeometry();
  for (const [name, attr] of Object.entries(g.attributes)) {
    const values = used.flatMap((id) =>
      Array.from({ length: attr.itemSize }, (_, j) => attr.getComponent(id, j)),
    );
    result.setAttribute(
      name,
      new T.Float32BufferAttribute(values, attr.itemSize),
    );
  }
  result.setIndex(ids.map((id) => remap.get(id)));
  if (lower) {
    const point = new T.Vector3();
    for (let i = 0; i < result.attributes.position.count; i++) {
      point.fromBufferAttribute(result.attributes.position, i);
      alignPelvicPoint(point, true);
      result.attributes.position.setXYZ(i, ...point.toArray());
    }
    result.computeVertexNormals();
  }
  skinAnatomy(
    result,
    lower ? "RecoveredLowerAtlas" : "RecoveredAtlas",
    bones,
    true,
  );
  if (lower) anchorGlutealAttachments(result, bones);
  return result;
}
const parts = [select(current, false), select(uncut, true)];
const connections = await loadAnatomicalConnections(bones);
parts.push(...connections.map((o) => o.geometry));
const geometry = fitAnatomicalHead(mergeGeometries(parts), connections);
for (const key of ["color", "_exercisemuscles", "skinWeight"]) {
  const a = geometry.getAttribute(key);
  geometry.setAttribute(
    key,
    new T.BufferAttribute(
      Uint8Array.from(a.array, (v) =>
        Math.round(T.MathUtils.clamp(v, 0, 1) * 255),
      ),
      a.itemSize,
      true,
    ),
  );
}
const mesh = new T.SkinnedMesh(
  geometry,
  new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.5 }),
);
mesh.name = "Trainvy_Anatomical_Atlas";
const scene = new T.Group();
scene.add(mesh, ...bones);
scene.updateMatrixWorld(true);
mesh.bind(new T.Skeleton(bones));
mesh.normalizeSkinWeights();
const manifestUrl = new URL(
  "../public/models/exercise-3d/model-manifest.json",
  import.meta.url,
);
const previous = JSON.parse(await readFile(manifestUrl, "utf8"));
const structures = [
  ...previous.structures.filter(
    (s) =>
      !["Trainvy_Shorts", "Trainvy_NapeSeal", "Trainvy_PelvicSeal"].includes(s),
  ),
  "Gluteus_medius_musclel",
  "Gluteus_medius_muscler",
  ...connections.map((o) => o.name),
  "Trainvy_HeadNeckJoin",
];
scene.userData = {
  title: previous.title,
  version: 7,
  anatomySource: previous.anatomySource,
  anatomyLicense: previous.anatomyLicense,
  assetLicense: previous.assetLicense,
  headSource: previous.headSource,
  headLicense: previous.headLicense,
  changes:
    "Preserved native pelvis and supported gluteal attachments; calibrated MakeHuman head to the cervical axis, continuous jaw-to-neck join sampled from native muscles; stable forearm twist and closed grips",
  structures: [...new Set(structures)],
};
const data = await compressAnatomyGlb(
  await new GLTFExporter().parseAsync(scene, { binary: true }),
);
await writeFile(
  new URL("../public/models/exercise-3d/trainvy-athlete.glb", import.meta.url),
  data,
);
const manifest = {
  ...previous,
  ...scene.userData,
  sha256: hash(data),
  vertices: geometry.attributes.position.count,
  triangles: geometry.index.count / 3,
  bytes: data.byteLength,
  bones: bones.map((b) => b.name),
  recoverySources: {
    v4: hash(v4),
    v3: hash(v3),
    connections: hash(
      await readFile(
        new URL("assets/anatomical-connections.glb", import.meta.url),
      ),
    ),
  },
};
await writeFile(manifestUrl, JSON.stringify(manifest, null, 2) + "\n");
console.log(
  JSON.stringify({
    vertices: manifest.vertices,
    triangles: manifest.triangles,
    bytes: manifest.bytes,
  }),
);
