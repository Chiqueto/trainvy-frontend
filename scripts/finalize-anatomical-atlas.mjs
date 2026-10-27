import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import * as T from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { compressAnatomyGlb } from "./compress-anatomy-glb.mjs";
import { createAnatomyFoundation } from "./anatomy-foundation.mjs";
import {
  alignPelvicPoint,
  loadAnatomicalConnections,
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
const tmp = new URL("../.tmp/anatomy-qa/", import.meta.url),
  output = new URL(
    "../public/models/exercise-3d/trainvy-athlete.glb",
    import.meta.url,
  );
async function load(url) {
  const b = await readFile(url);
  return new GLTFLoader().parseAsync(
    b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength),
    "",
  );
}
const { scene: scaffold } = await load(new URL("scaffold.glb", tmp));
const { scene: atlas } = await load(new URL("atlas-surfaces.glb", tmp));
atlas.updateMatrixWorld(true);
scaffold.updateMatrixWorld(true);
let base;
scaffold.traverse((o) => {
  if (o.isSkinnedMesh) base = o;
});
const bones = base.skeleton.bones.map((source) => {
  const bone = new T.Bone();
  bone.name = source.name;
  bone.position.copy(source.position);
  return bone;
});
addJointSupports(bones);
const smooth = (a, b, t) => T.MathUtils.smoothstep(t, a, b);
const parts = [],
  structures = [];
function classify(name) {
  const n = name.toLowerCase().replaceAll("_", " ");
  return {
    primarySquat: /rectus femoris|vastus |gluteus maximus/.test(n),
    secondarySquat: /adductor (magnus|longus|brevis)/.test(n),
    primaryBench: n.includes("pectoralis major"),
    secondaryBench: /triceps brachii|clavicular part of deltoid/.test(n),
    skin: name.startsWith("Trainvy_"),
    bone: name.startsWith("Bone_"),
    tendon: n.includes("tendon") || n.includes("linea alba"),
  };
}
function decorate(g, name) {
  const count = g.attributes.position.count,
    c = classify(name),
    col = new Float32Array(count * 3),
    uv = new Float32Array(count * 2),
    fibres = new Float32Array(count * 2),
    masks = new Float32Array(count * 3),
    p = new T.Vector3();
  const colour = new T.Color(
    c.bone || c.tendon ? "#c9c5b6" : c.skin ? "#b5b0a7" : "#b5b3ac",
  );
  g.computeBoundingBox();
  const bounds = g.boundingBox;
  for (let i = 0; i < count; i++) {
    p.fromBufferAttribute(g.attributes.position, i);
    let phase = p.x * 1400 + p.z * 850 + Math.sin(p.y * 18) * 2;
    if (c.primaryBench)
      phase =
        Math.atan2(p.y - 1.37, Math.abs(p.x - Math.sign(p.x) * 0.215)) * 120 +
        p.z * 120;
    const longitudinal =
        (p.y - bounds.min.y) / Math.max(0.001, bounds.max.y - bounds.min.y),
      insertion = smooth(0.78, 0.98, Math.abs(longitudinal - 0.5) * 2);
    const fiber = c.skin || c.bone ? 0 : c.tendon ? 0.15 : 1 - insertion * 0.7;
    const tone = colour.clone();
    if (!c.skin && !c.bone && !c.tendon)
      tone.lerp(new T.Color("#d1caba"), insertion * 0.38);
    col.set(tone.toArray(), i * 3);
    uv.set([0, c.skin || c.bone ? 0 : 1], i * 2);
    fibres.set([phase, fiber], i * 2);
    masks.set(
      [
        c.primarySquat ? 1 : c.secondarySquat ? 0.5 : 0,
        c.primaryBench ? 1 : c.secondaryBench ? 0.5 : 0,
        0,
      ],
      i * 3,
    );
  }
  for (const key of Object.keys(g.attributes))
    if (!["position", "normal"].includes(key)) g.deleteAttribute(key);
  g.setAttribute("color", new T.BufferAttribute(col, 3));
  g.setAttribute("uv", new T.BufferAttribute(uv, 2));
  g.setAttribute("uv1", new T.BufferAttribute(fibres, 2));
  g.setAttribute("_exercisemuscles", new T.BufferAttribute(masks, 3));
  skinAnatomy(g, name, bones);
  return g;
}
atlas.traverse((o) => {
  if (!o.isMesh || o.name.startsWith("Trainvy_Garment")) return;
  const g = o.geometry.clone().applyMatrix4(o.matrixWorld);
  if (!g.index) {
    const ids = Array.from(
      { length: g.attributes.position.count },
      (_, i) => i,
    );
    g.setIndex(ids);
  }
  if (
    /femor|vastus|adductor|gluteus|semitendin|semimembr|sartorius|gracilis|tensor.fasciae/i.test(
      o.name,
    )
  ) {
    const point = new T.Vector3();
    for (let i = 0; i < g.attributes.position.count; i++) {
      point.fromBufferAttribute(g.attributes.position, i);
      alignPelvicPoint(point, true);
      g.attributes.position.setXYZ(i, ...point.toArray());
    }
    g.computeVertexNormals();
  }
  structures.push({ name: o.name, vertices: g.attributes.position.count });
  const decorated = decorate(g, o.name);
  anchorGlutealAttachments(decorated, bones);
  parts.push(decorated);
});
for (const [i, g] of createAnatomyFoundation(bones).entries())
  parts.push(
    decorate(g, i === 0 ? "Trainvy_FoundationTorso" : "Trainvy_Foundation"),
  );
const connections = await loadAnatomicalConnections(bones);
for (const part of connections) {
  parts.push(part.geometry);
  structures.push({
    name: part.name,
    vertices: part.geometry.attributes.position.count,
  });
}
// Keep the authored closed hands and footwear, not the rejected
// procedural torso or face. These neutral components never receive muscle masks.
const accessories = base.geometry.clone(),
  ids = [];
const p = accessories.attributes.position,
  uv = accessories.attributes.uv;
for (let t = 0; t < accessories.index.count; t += 3) {
  const tri = [0, 1, 2].map((j) => accessories.index.getX(t + j));
  if (
    tri.every(
      (i) =>
        uv.getY(i) < 0.1 &&
        p.getY(i) < 1.1 &&
        (p.getY(i) < 0.16 || Math.abs(p.getX(i)) > 0.255),
    )
  )
    ids.push(...tri);
}
accessories.setIndex(ids);
const keep = new Set(ids),
  remap = new Map(),
  positions = [],
  normals = [],
  colors = [],
  uvs = [],
  details = [],
  masks = [],
  indices = [],
  weights = [];
for (const old of keep) {
  const i = remap.size;
  remap.set(old, i);
  positions.push(p.getX(old), p.getY(old), p.getZ(old));
  for (const [key, arr, n] of [
    ["normal", normals, 3],
    ["color", colors, 3],
    ["uv", uvs, 2],
    ["uv1", details, 2],
    ["_exercisemuscles", masks, 3],
    ["skinIndex", indices, 4],
    ["skinWeight", weights, 4],
  ]) {
    const a = accessories.getAttribute(key);
    for (let j = 0; j < n; j++)
      arr.push(key === "_exercisemuscles" ? 0 : a.getComponent(old, j));
  }
}
const a = new T.BufferGeometry();
for (const [key, arr, n, Type] of [
  ["position", positions, 3, Float32Array],
  ["normal", normals, 3, Float32Array],
  ["color", colors, 3, Float32Array],
  ["uv", uvs, 2, Float32Array],
  ["uv1", details, 2, Float32Array],
  ["_exercisemuscles", masks, 3, Float32Array],
  ["skinIndex", indices, 4, Uint16Array],
  ["skinWeight", weights, 4, Float32Array],
])
  a.setAttribute(key, new T.BufferAttribute(new Type(arr), n));
a.setIndex(ids.map((i) => remap.get(i)));
// Accessories contain only closed hands and shoes; each moves rigidly.
for (let i = 0; i < a.attributes.position.count; i++) {
  const foot = a.attributes.position.getY(i) < 0.16;
  const suffix = a.attributes.position.getX(i) < 0 ? "L" : "R";
  a.attributes.skinIndex.setXYZW(
    i,
    bones.findIndex((b) => b.name === `${foot ? "foot" : "hand"}_${suffix}`),
    0,
    0,
    0,
  );
  a.attributes.skinWeight.setXYZW(i, 1, 0, 0, 0);
}
parts.push(a);
const merged = fitAnatomicalHead(mergeGeometries(parts), connections);
structures.push({ name: "Trainvy_HeadNeckJoin" });
for (const key of ["color", "_exercisemuscles", "skinWeight"]) {
  const attr = merged.getAttribute(key),
    bytes = new Uint8Array(attr.array.length);
  for (let i = 0; i < bytes.length; i++)
    bytes[i] = Math.round(T.MathUtils.clamp(attr.array[i], 0, 1) * 255);
  merged.setAttribute(key, new T.BufferAttribute(bytes, attr.itemSize, true));
}
const material = new T.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.5,
  }),
  mesh = new T.SkinnedMesh(merged, material),
  scene = new T.Group();
mesh.name = "Trainvy_Anatomical_Atlas";
scene.add(mesh, ...bones);
scene.updateMatrixWorld(true);
mesh.bind(new T.Skeleton(bones));
mesh.normalizeSkinWeights();
scene.userData = {
  title: "Trainvy anatomical athlete",
  version: 7,
  anatomySource: "Z-Anatomy / BodyParts3D",
  anatomyLicense: "CC-BY-SA-4.0",
  assetLicense: "CC-BY-SA-4.0",
  headSource: "MakeHuman hm08",
  headLicense: "CC0",
  changes:
    "Selected superficial muscles, native pelvic and cervical connections; preserved gluteal alignment and hip supports; MakeHuman head calibrated to the cervical axis with continuous jaw-to-neck fitting; independent muscle masks, fibre coordinates, articulated grips and footwear",
  structures: [...new Set(structures.map((s) => s.name))],
};
const data = await compressAnatomyGlb(
  await new GLTFExporter().parseAsync(scene, { binary: true }),
);
await mkdir(new URL(".", output), { recursive: true });
await writeFile(output, Buffer.from(data));
await writeFile(
  new URL("../public/models/exercise-3d/model-manifest.json", import.meta.url),
  JSON.stringify(
    {
      version: 7,
      asset: "trainvy-athlete.glb",
      sha256: createHash("sha256").update(Buffer.from(data)).digest("hex"),
      vertices: merged.attributes.position.count,
      triangles: merged.index.count / 3,
      bytes: data.byteLength,
      bones: bones.map((b) => b.name),
      structures,
      ...scene.userData,
    },
    null,
    2,
  ),
);
console.log(
  JSON.stringify({
    vertices: merged.attributes.position.count,
    triangles: merged.index.count / 3,
    megabytes: data.byteLength / 1048576,
    structures: structures.length,
  }),
);
