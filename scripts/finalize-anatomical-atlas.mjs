import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import * as T from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";
import {
  mergeGeometries,
  mergeVertices,
} from "three/addons/utils/BufferGeometryUtils.js";
import { compressAnatomyGlb } from "./compress-anatomy-glb.mjs";
import {
  createAnatomyFoundation,
  createTrainingShorts,
} from "./anatomy-foundation.mjs";
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
for (const suffix of ["L", "R"]) {
  for (const [support, target] of [
    ["hip", "thigh"],
    ["shoulder", "upperArm"],
  ]) {
    const bone = new T.Bone();
    bone.name = `${support}_${suffix}`;
    bone.position.copy(
      bones.find((b) => b.name === `${target}_${suffix}`).position,
    );
    bones.push(bone);
  }
}
const origin = bones[0].position;
const smooth = (a, b, t) => T.MathUtils.smoothstep(t, a, b);
const nearest = (p, a, b) => {
  const d = b.clone().sub(a),
    t = p.clone().sub(a).dot(d) / d.lengthSq();
  return {
    t,
    distance: p.distanceTo(
      a.clone().addScaledVector(d, T.MathUtils.clamp(t, 0, 1)),
    ),
  };
};
const frame = (side) => {
  const suffix = side < 0 ? "L" : "R";
  return {
    index: bones.findIndex((b) => b.name === `upperArm_${suffix}`),
    elbowIndex: bones.findIndex((b) => b.name === `elbow_${suffix}`),
    shoulderIndex: bones.findIndex((b) => b.name === `shoulder_${suffix}`),
    shoulder: bones.find((b) => b.name === `upperArm_${suffix}`).position,
    elbow: bones.find((b) => b.name === `forearm_${suffix}`).position,
    wrist: bones.find((b) => b.name === `hand_${suffix}`).position,
  };
};
const arms = [frame(-1), frame(1)],
  parts = [],
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
function skin(g, name) {
  const n = name.toLowerCase().replaceAll("_", " ");
  const armStructure =
    /biceps brachii|triceps brachii|brachialis|coracobrachialis|deltoid|brachioradialis|pronator|supinator|carpi|digitorum|palmaris|bone (humerus|radius|ulna)/.test(
      n,
    ) && g.boundingBox.max.y > 0.8;
  const index = new Uint16Array(g.attributes.position.count * 4),
    weight = new Float32Array(index.length),
    p = new T.Vector3();
  for (let i = 0; i < g.attributes.position.count; i++) {
    p.fromBufferAttribute(g.attributes.position, i);
    const local = p.clone().sub(origin);
    let ids = [0, 0, 0, 0],
      w = [1, 0, 0, 0];
    if (local.y < -0.225 && name !== "Trainvy_FoundationTorso") {
      const leg = p.x < 0 ? 0 : 1,
        id = 1 + leg * 3,
        hip = bones[id].position,
        knee = bones[id + 1].position,
        ankle = bones[id + 2].position,
        a = nearest(p, hip, knee),
        b = nearest(p, knee, ankle);
      if (a.distance <= b.distance) {
        const root = 1 - smooth(0.02, 0.23, a.t),
          bend = smooth(0.83, 1.12, a.t);
        ids = [0, id, id + 1, 0];
        w = [root, (1 - root) * (1 - bend), (1 - root) * bend, 0];
      } else {
        const bend = smooth(-0.12, 0.17, b.t),
          foot = smooth(0.86, 1.03, b.t);
        ids = [id, id + 1, id + 2, 0];
        w = [1 - bend, bend * (1 - foot), bend * foot, 0];
      }
    }
    if (
      armStructure ||
      (Math.abs(local.x) > 0.178 && local.y > -0.42 && local.y < 0.3)
    ) {
      const f = arms[local.x < 0 ? 0 : 1],
        a = nearest(p, f.shoulder, f.elbow),
        b = nearest(p, f.elbow, f.wrist);
      if (armStructure || Math.min(a.distance, b.distance) < 0.12) {
        const blend =
          armStructure || name.startsWith("Trainvy_Foundation")
            ? smooth(-0.12, 0.4, a.t)
            : smooth(0.178, 0.244, Math.abs(local.x));
        if (a.distance < b.distance) {
          const bend = smooth(0.8, 1.1, a.t);
          w = [1 - blend, blend * (1 - bend), blend * bend, 0];
        } else {
          const bend = smooth(-0.1, 0.2, b.t),
            hand = smooth(0.85, 1.03, b.t);
          w = [
            1 - blend,
            blend * (1 - bend),
            blend * bend * (1 - hand),
            blend * bend * hand,
          ];
        }
        ids = [0, f.index, f.index + 1, f.index + 2];
        if (a.t < 0.5 && w[0] > 0) {
          const support = 2 * blend * (1 - blend);
          w = [(1 - blend) ** 2, blend ** 2, 0, support];
          ids[3] = f.shoulderIndex;
        }
        const support = (1 - smooth(0.03, 0.085, p.distanceTo(f.elbow))) * 0.9;
        if (support > 0) {
          const limb = w[1] + w[2];
          w = [
            w[0],
            w[1] * (1 - support),
            w[2] * (1 - support),
            limb * support,
          ];
          ids[3] = f.elbowIndex;
        }
      }
    }
    index.set(ids, i * 4);
    weight.set(w, i * 4);
  }
  g.setAttribute("skinIndex", new T.BufferAttribute(index, 4));
  g.setAttribute("skinWeight", new T.BufferAttribute(weight, 4));
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
    name.startsWith("Trainvy_Shorts")
      ? "#171c20"
      : c.bone || c.tendon
        ? "#c9c5b6"
        : c.skin
          ? "#b5b0a7"
          : "#b5b3ac",
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
  g.setAttribute("_exerciseMuscles", new T.BufferAttribute(masks, 3));
  skin(g, name);
  if (name === "Trainvy_Shorts") {
    // A bisector support keeps the hip fabric's volume during deep flexion.
    for (let i = 0; i < count; i++) {
      p.fromBufferAttribute(g.attributes.position, i);
      const suffix = p.x < 0 ? "L" : "R";
      const thigh = bones.findIndex((b) => b.name === `thigh_${suffix}`);
      const support = bones.findIndex((b) => b.name === `hip_${suffix}`);
      const t = nearest(p, bones[thigh].position, bones[thigh + 1].position).t;
      const blend = smooth(0, 0.25, t) * smooth(0.025, 0.11, Math.abs(p.x));
      g.attributes.skinIndex.setXYZW(i, 0, support, thigh, 0);
      g.attributes.skinWeight.setXYZW(
        i,
        (1 - blend) ** 2,
        2 * blend * (1 - blend),
        blend ** 2,
        0,
      );
    }
  }
  return g;
}
// Hide the proximal thigh surfaces inside the shorts. Clip triangles rather
// than moving their vertices, retaining the exposed muscle's natural contour.
function clipSurface(g, distance) {
  const positions = [],
    normals = [];
  for (let t = 0; t < g.index.count; t += 3) {
    const polygon = [0, 1, 2].map((j) => {
      const id = g.index.getX(t + j);
      const p = new T.Vector3().fromBufferAttribute(g.attributes.position, id);
      return {
        p,
        n: new T.Vector3().fromBufferAttribute(g.attributes.normal, id),
        d: distance(p),
      };
    });
    const kept = [];
    for (let i = 0; i < 3; i++) {
      const a = polygon[i],
        b = polygon[(i + 1) % 3];
      if (a.d >= 0) kept.push(a);
      if (a.d >= 0 !== b.d >= 0) {
        const u = a.d / (a.d - b.d);
        kept.push({
          p: a.p.clone().lerp(b.p, u),
          n: a.n.clone().lerp(b.n, u).normalize(),
        });
      }
    }
    for (let i = 1; i < kept.length - 1; i++)
      for (const v of [kept[0], kept[i], kept[i + 1]]) {
        positions.push(...v.p.toArray());
        normals.push(...v.n.toArray());
      }
  }
  const result = new T.BufferGeometry();
  result.setAttribute("position", new T.Float32BufferAttribute(positions, 3));
  result.setAttribute("normal", new T.Float32BufferAttribute(normals, 3));
  result.setIndex(Array.from({ length: positions.length / 3 }, (_, i) => i));
  return mergeVertices(result, 0.000001);
}
atlas.traverse((o) => {
  if (!o.isMesh || o.name.startsWith("Trainvy_Garment")) return;
  let g = o.geometry.clone().applyMatrix4(o.matrixWorld);
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
    const old = g;
    g = clipSurface(g, (p) => {
      const id = p.x < 0 ? 1 : 4;
      return nearest(p, bones[id].position, bones[id + 1].position).t - 0.29;
    });
    old.dispose();
    if (!g.attributes.position.count) return;
  }
  structures.push({ name: o.name, vertices: g.attributes.position.count });
  parts.push(decorate(g, o.name));
});
for (const [i, g] of createAnatomyFoundation(bones).entries())
  parts.push(
    decorate(g, i === 0 ? "Trainvy_FoundationTorso" : "Trainvy_Foundation"),
  );
const shorts = createTrainingShorts(bones);
structures.push({
  name: "Trainvy_Shorts",
  vertices: shorts.attributes.position.count,
});
parts.push(decorate(shorts, "Trainvy_Shorts"));
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
  ["_exerciseMuscles", masks, 3, Float32Array],
  ["skinIndex", indices, 4, Uint16Array],
  ["skinWeight", weights, 4, Float32Array],
])
  a.setAttribute(key, new T.BufferAttribute(new Type(arr), n));
a.setIndex(ids.map((i) => remap.get(i)));
parts.push(a);
const merged = mergeGeometries(parts);
for (const key of ["color", "_exerciseMuscles", "skinWeight"]) {
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
  version: 4,
  anatomySource: "Z-Anatomy / BodyParts3D",
  anatomyLicense: "CC-BY-SA-4.0",
  assetLicense: "CC-BY-SA-4.0",
  headSource: "MakeHuman hm08",
  headLicense: "CC0",
  changes:
    "Selected superficial muscles, abdominal exposure, retargeted neutral pose, articulated rig with hip and elbow supports, exercise-specific masks, fibre coordinates, studio materials; CC0 head; authored connective foundation, training shorts, closed hands and footwear",
  structures: structures.map((s) => s.name),
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
      version: 4,
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
