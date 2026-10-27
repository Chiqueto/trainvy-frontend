import * as T from "three";
import { readFile } from "node:fs/promises";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { skinAnatomy, nearest } from "./anatomy-skinning.mjs";

const smooth = (a, b, t) => T.MathUtils.smoothstep(t, a, b);
/** Preserve medial sacral attachments while matching the rig's wider femurs. */
export function alignPelvicPoint(p, fromLeg = false) {
  if (p.y < 0.74 || p.y > 1.005) return p;
  const sourceY = (p.y + 0.0074) / 0.988;
  const t = T.MathUtils.clamp((0.88 - sourceY) / 0.45, 0, 1);
  const u = T.MathUtils.clamp((0.43 - sourceY) / 0.375, 0, 1);
  const side = p.x < 0 ? -1 : 1;
  const dx = 0.035 + 0.03 * t + 0.02 * u;
  const dz = -0.04 + 0.12 * t - 0.155 * u;
  const amount = smooth(0.74, 0.92, p.y);
  if (fromLeg) {
    p.x -= side * dx;
    p.z -= dz;
  }
  const width = 1 - amount * (1 - smooth(0.018, 0.09, Math.abs(p.x)));
  p.x += side * dx * width;
  p.z += dz * (1 - amount);
  return p;
}

export function decorateConnection(g, name, bones) {
  const bone = name.startsWith("Bone_");
  const tendon = /Linea_alba|ligament/.test(name);
  const colour = new T.Color(bone || tendon ? "#c9c5b6" : "#b5b3ac");
  const count = g.attributes.position.count;
  const colors = [],
    uv = [],
    fibre = [];
  for (let i = 0; i < count; i++) {
    const x = g.attributes.position.getX(i),
      y = g.attributes.position.getY(i),
      z = g.attributes.position.getZ(i);
    colors.push(...colour.toArray());
    uv.push(0, bone ? 0 : 1);
    fibre.push(
      x * 1400 + z * 850 + Math.sin(y * 18) * 2,
      bone ? 0 : tendon ? 0.15 : 0.85,
    );
  }
  g.setAttribute("color", new T.Float32BufferAttribute(colors, 3));
  g.setAttribute("uv", new T.Float32BufferAttribute(uv, 2));
  g.setAttribute("uv1", new T.Float32BufferAttribute(fibre, 2));
  g.setAttribute(
    "_exercisemuscles",
    new T.Float32BufferAttribute(new Float32Array(count * 3), 3),
  );
  skinAnatomy(g, name, bones);
  if (
    bone ||
    /abdominis|abdominal|Linea_alba|ligament|capitis|colli|Scalenus|Sternocleido|hyoid|thyroid/.test(
      name,
    )
  ) {
    for (let i = 0; i < count; i++) {
      g.attributes.skinIndex.setXYZW(i, 0, 0, 0, 0);
      g.attributes.skinWeight.setXYZW(i, 1, 0, 0, 0);
    }
  }
  return g;
}

export async function loadAnatomicalConnections(bones) {
  const b = await readFile(
    new URL("assets/anatomical-connections.glb", import.meta.url),
  );
  const { scene } = await new GLTFLoader().parseAsync(
    b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength),
    "",
  );
  scene.updateMatrixWorld(true);
  const parts = [];
  scene.traverse((o) => {
    if (o.isMesh)
      parts.push({
        name: o.name,
        geometry: decorateConnection(
          o.geometry.clone().applyMatrix4(o.matrixWorld),
          o.name,
          bones,
        ),
      });
  });
  if (parts.length < 25)
    throw new Error("Incomplete anatomical connection asset.");
  return parts;
}

/** Find the old hidden torso liner without confusing it with the authored head. */
export function findTorsoLiner(g) {
  const count = g.attributes.position.count;
  const parent = Uint32Array.from({ length: count }, (_, i) => i);
  const root = (i) => {
    while (parent[i] !== i) {
      parent[i] = parent[parent[i]];
      i = parent[i];
    }
    return i;
  };
  for (let t = 0; t < g.index.count; t += 3) {
    const a = root(g.index.getX(t));
    parent[root(g.index.getX(t + 1))] = a;
    parent[root(g.index.getX(t + 2))] = a;
  }
  const groups = new Map();
  for (let i = 0; i < count; i++) {
    const id = root(i),
      y = g.attributes.position.getY(i);
    if (!groups.has(id)) groups.set(id, { min: y, max: y, tissue: 0 });
    const group = groups.get(id);
    group.min = Math.min(group.min, y);
    group.max = Math.max(group.max, y);
    group.tissue = Math.max(group.tissue, g.attributes.uv.getY(i));
  }
  const liners = new Set(
    [...groups]
      .filter(([, b]) => b.tissue === 0 && b.min < 1.0 && b.max > 1.52)
      .map(([id]) => id),
  );
  return (i) => liners.has(root(i));
}

export function anchorGlutealAttachments(g, bones) {
  const m = g.attributes._exercisemuscles ?? g.attributes._exerciseMuscles;
  const p = new T.Vector3();
  for (let i = 0; i < g.attributes.position.count; i++) {
    p.fromBufferAttribute(g.attributes.position, i);
    if (m.getX(i) < 0.9 || p.y < 0.76 || p.y > 0.975 || p.z > 0.1) continue;
    const suffix = p.x < 0 ? "L" : "R";
    const thigh = bones.findIndex((b) => b.name === `thigh_${suffix}`);
    const hip = bones.findIndex((b) => b.name === `hip_${suffix}`);
    const t = nearest(p, bones[thigh].position, bones[thigh + 1].position).t;
    const blend = smooth(0.02, 0.32, t) * smooth(0.025, 0.13, Math.abs(p.x));
    g.attributes.skinIndex.setXYZW(i, 0, hip, thigh, 0);
    g.attributes.skinWeight.setXYZW(
      i,
      (1 - blend) ** 2,
      2 * blend * (1 - blend),
      blend ** 2,
      0,
    );
  }
}
