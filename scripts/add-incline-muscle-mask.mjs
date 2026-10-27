/** Add an independently authored incline-press mask to the approved v7 asset.
 * node scripts/add-incline-muscle-mask.mjs [MuscularSystem100.fbx] [--apply]
 * Source labels, not another exercise's activation channel, determine membership.
 * Without an FBX, replay the compact, checksum-bound semantic selection map.
 */
import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import * as T from "three";
import { FBXLoader } from "three/addons/loaders/FBXLoader.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";
import { MeshoptDecoder } from "meshoptimizer";
import { compressAnatomyGlb } from "./compress-anatomy-glb.mjs";

const hash = (b) => createHash("sha256").update(b).digest("hex");
const root = new URL("../public/models/exercise-3d/", import.meta.url);
const assetUrl = new URL("trainvy-athlete.glb", root);
const mapUrl = new URL("assets/incline-muscle-map.json", import.meta.url);
const bytes = await readFile(assetUrl);
const manifest = JSON.parse(
  await readFile(new URL("model-manifest.json", root), "utf8"),
);
if (
  hash(bytes) !==
  "be63fbfc81394055b10002aa6db7ca37ac8a17164778bafecf1329b99aa57db8"
)
  throw new Error(
    "Expected approved v7 asset; rebuild v7 before applying this additive mask.",
  );
const { scene } = await new GLTFLoader()
  .setMeshoptDecoder(MeshoptDecoder)
  .parseAsync(
    bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
    "",
  );
let mesh;
scene.traverse((o) => {
  if (o.isSkinnedMesh) mesh = o;
});
const g = mesh.geometry,
  p = g.attributes.position;
let semanticMap;
const sourcePath = process.argv.slice(2).find((a) => a !== "--apply");
if (sourcePath) {
  const sourceBytes = await readFile(sourcePath);
  const source = new FBXLoader().parse(
    sourceBytes.buffer.slice(
      sourceBytes.byteOffset,
      sourceBytes.byteOffset + sourceBytes.byteLength,
    ),
    "",
  );
  source.updateMatrixWorld(true);
  const grid = new Map(),
    cell = 0.006,
    point = new T.Vector3();
  const key = (x, y, z) => `${x},${y},${z}`;
  source.traverse((o) => {
    if (
      !o.isMesh ||
      /fascia|bursa|sheath|retinaculum/.test(o.name.toLowerCase())
    )
      return;
    const n = o.name.toLowerCase().replaceAll("_", " ");
    const arm =
      /biceps brachii|triceps brachii|brachialis|coracobrachialis|deltoid|brachioradialis|pronator|supinator|carpi|digitorum|palmaris/.test(
        n,
      );
    const positions = o.geometry.attributes.position;
    const unique = new Set();
    for (let i = 0; i < positions.count; i++) {
      point.fromBufferAttribute(positions, i).applyMatrix4(o.matrixWorld);
      const z = point.y * 0.01,
        side = Math.sign(point.x);
      point.set(point.x * 0.011, z * 0.988 - 0.0074, 0.12 + point.z * 0.0095);
      if (arm) {
        const t = T.MathUtils.clamp((1.38 - z) / 0.28, 0, 1),
          u = T.MathUtils.clamp((1.1 - z) / 0.265, 0, 1);
        point.x += side * (0.006 + 0.047 * t - 0.03 * u);
        point.z += 0.042 - 0.004 * t - 0.035 * u;
      }
      if (point.y < 0.98 || point.y > 1.5) continue;
      const positionKey = point
        .toArray()
        .map((v) => Math.round(v * 1e6))
        .join(",");
      if (unique.has(positionKey)) continue;
      unique.add(positionKey);
      const k = key(...point.toArray().map((v) => Math.floor(v / cell)));
      if (!grid.has(k)) grid.set(k, []);
      grid.get(k).push({ point: point.clone(), name: o.name });
    }
  });
  // Connected anatomical surfaces remain intact: classify each component by
  // a majority of nearest source vertices, then apply its named muscle role.
  const parents = Int32Array.from({ length: p.count }, (_, i) => i);
  const find = (i) => {
    while (parents[i] !== i) {
      parents[i] = parents[parents[i]];
      i = parents[i];
    }
    return i;
  };
  for (let i = 0; i < g.index.count; i += 3) {
    const a = find(g.index.getX(i));
    parents[find(g.index.getX(i + 1))] = a;
    parents[find(g.index.getX(i + 2))] = a;
  }
  const components = new Map();
  for (let i = 0; i < p.count; i++) {
    const r = find(i);
    if (!components.has(r)) components.set(r, []);
    components.get(r).push(i);
  }
  const selected = [];
  for (const ids of components.values()) {
    if (
      g.attributes.uv.getY(ids[0]) < 0.5 ||
      !ids.some((i) => p.getY(i) > 0.98 && p.getY(i) < 1.5)
    )
      continue;
    const votes = new Map();
    let samples = 0;
    for (let s = 0; s < Math.min(40, ids.length); s++) {
      const i = ids[Math.floor((s * ids.length) / Math.min(40, ids.length))];
      point.fromBufferAttribute(p, i);
      const coords = point.toArray().map((v) => Math.floor(v / cell));
      let best = 0.0045 ** 2,
        name;
      for (let x = -1; x <= 1; x++)
        for (let y = -1; y <= 1; y++)
          for (let z = -1; z <= 1; z++)
            for (const entry of grid.get(
              key(coords[0] + x, coords[1] + y, coords[2] + z),
            ) ?? []) {
              const d = point.distanceToSquared(entry.point);
              if (d < best) {
                best = d;
                name = entry.name;
              }
            }
      samples++;
      if (name) votes.set(name, (votes.get(name) ?? 0) + 1);
    }
    const [name, count] = [...votes].sort((a, b) => b[1] - a[1])[0] ?? [];
    const role = /^Clavicular_head_of_pectoralis_major_muscle[lr]$/.test(
      name ?? "",
    )
      ? 1
      : /^(Clavicular_part_of_deltoid_muscle|(?:Long|Medial|Lateral)_head_of_triceps_brachii)[lr]$/.test(
            name ?? "",
          )
        ? 0.5
        : 0;
    if (!role) continue;
    if (count / samples < 0.8)
      throw new Error(
        `Ambiguous source membership for ${name}: ${count}/${samples}`,
      );
    selected.push({ name, role, confidence: count / samples, indices: ids });
  }
  const names = new Set(selected.map((s) => s.name));
  if (names.size !== 10)
    throw new Error(
      `Expected 10 bilateral named structures, found ${[...names]}`,
    );
  semanticMap = {
    baseAssetSha256: hash(bytes),
    sourceSha256: hash(sourceBytes),
    source: "Z-Anatomy / BodyParts3D",
    license: "CC-BY-SA-4.0",
    selections: selected,
  };
  await writeFile(mapUrl, JSON.stringify(semanticMap) + "\n");
} else semanticMap = JSON.parse(await readFile(mapUrl, "utf8"));
if (semanticMap.baseAssetSha256 !== hash(bytes))
  throw new Error("Semantic map does not match geometry");
const previous = g.attributes._exercisemuscles;
const mask = new T.Uint8BufferAttribute(new Uint8Array(p.count * 3), 3, true);
for (let i = 0; i < mask.count; i++)
  mask.setXYZ(i, previous.getX(i), previous.getY(i), 0);
for (const selection of semanticMap.selections)
  for (const i of selection.indices) mask.setZ(i, selection.role);
g.setAttribute("_exercisemuscles", mask);
const report = semanticMap.selections.map(({ indices, ...s }) => ({
  ...s,
  vertices: indices.length,
}));
console.log(JSON.stringify(report, null, 2));
if (process.argv.includes("--apply")) {
  globalThis.FileReader = class {
    readAsArrayBuffer(blob) {
      blob.arrayBuffer().then((result) => {
        this.result = result;
        this.onloadend?.();
      });
    }
  };
  scene.userData = { ...scene.userData, version: 8 };
  const output = await compressAnatomyGlb(
    await new GLTFExporter().parseAsync(scene, { binary: true }),
  );
  await writeFile(assetUrl, output);
  await writeFile(
    new URL("model-manifest.json", root),
    JSON.stringify(
      {
        ...manifest,
        version: 8,
        sha256: hash(output),
        bytes: output.byteLength,
        changes:
          manifest.changes.split("; independent incline")[0] +
          "; independent incline dumbbell press mask from named clavicular pectoralis, anterior deltoid and triceps surfaces",
        inclineMask: {
          channel: "z",
          sourceSha256: semanticMap.sourceSha256,
          selections: report,
        },
      },
      null,
      2,
    ) + "\n",
  );
}
