import * as T from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

// The MakeHuman head and Z-Anatomy cervical column use different origins.
// Calibrate the cut's centre to the column, keeping the authored face intact.
export const HEAD_OFFSET = new T.Vector3(0, -0.018, -0.07);
export const HEAD_CUT_Y = 1.49;
const JOIN_BASE_Y = 1.43;
const NECK_CENTRE_Z = 0.103;
const skin = new T.Color("#b5b0a7");

function headVertex(g, i) {
  const y = g.attributes.position.getY(i);
  if (y < HEAD_CUT_Y - 0.000001 || g.attributes.uv.getY(i) > 0.1) return false;
  const colour = g.attributes.color;
  return (
    y > 1.59 ||
    (Math.abs(colour.getX(i) - skin.r) < 0.008 &&
      Math.abs(colour.getY(i) - skin.g) < 0.008 &&
      Math.abs(colour.getZ(i) - skin.b) < 0.008)
  );
}

function boundary(g, selected) {
  const nodes = new Map();
  const position = g.attributes.position,
    normal = g.attributes.normal;
  const key = (p) =>
    p
      .toArray()
      .map((v) => Math.round(v * 1e6))
      .join(",");
  for (let t = 0; t < g.index.count; t += 3) {
    const tri = [0, 1, 2].map((j) => g.index.getX(t + j));
    for (let j = 0; j < 3; j++) {
      const a = tri[j],
        b = tri[(j + 1) % 3];
      if (
        !selected[a] ||
        !selected[b] ||
        Math.abs(position.getY(a) - HEAD_CUT_Y) > 0.000001 ||
        Math.abs(position.getY(b) - HEAD_CUT_Y) > 0.000001
      )
        continue;
      for (const [id, other] of [
        [a, b],
        [b, a],
      ]) {
        const p = new T.Vector3().fromBufferAttribute(position, id);
        const k = key(p),
          neighbor = key(new T.Vector3().fromBufferAttribute(position, other));
        if (k === neighbor) continue;
        if (!nodes.has(k))
          nodes.set(k, {
            id,
            p,
            n: new T.Vector3().fromBufferAttribute(normal, id),
            neighbors: new Set(),
          });
        nodes.get(k).neighbors.add(neighbor);
      }
    }
  }
  if (
    nodes.size < 16 ||
    [...nodes.values()].some((v) => v.neighbors.size !== 2)
  )
    throw new Error("The head cut must be a closed neck boundary.");
  const loop = [],
    start = nodes.keys().next().value;
  let current = start,
    previous;
  do {
    const vertex = nodes.get(current);
    loop.push(vertex);
    const next = [...vertex.neighbors].find(
      (neighbor) => neighbor !== previous,
    );
    previous = current;
    current = next;
  } while (current !== start && loop.length <= nodes.size);
  if (loop.length !== nodes.size) throw new Error("Disconnected head cut.");
  return loop;
}

function slope(n) {
  const horizontal = Math.max(0.15, n.x * n.x + n.z * n.z);
  return new T.Vector3(
    T.MathUtils.clamp((-n.x * n.y) / horizontal, -1.2, 1.2),
    1,
    T.MathUtils.clamp((-n.z * n.y) / horizontal, -1.2, 1.2),
  );
}

/** Fit the head, then loft its exact cut into the native cervical muscle surface. */
export function fitAnatomicalHead(g, connections) {
  const selected = Uint8Array.from(
    { length: g.attributes.position.count },
    (_, i) => (headVertex(g, i) ? 1 : 0),
  );
  const loop = boundary(g, selected);
  const point = new T.Vector3();
  const changedNormals = new Uint8Array(selected.length);
  for (let i = 0; i < selected.length; i++) {
    if (!selected[i]) continue;
    point.fromBufferAttribute(g.attributes.position, i);
    const originalY = point.y,
      originalZ = point.z;
    point.add(HEAD_OFFSET);
    // The source cut contains a deep neck cross-section. Match that short
    // collar to the atlas, fading out before the chin and the occiput.
    const anterior = T.MathUtils.smoothstep(originalZ, 0.14, 0.18);
    const endY = T.MathUtils.lerp(1.565, 1.507, anterior);
    const blend = 1 - T.MathUtils.smoothstep(originalY, HEAD_CUT_Y, endY);
    if (blend > 0) {
      point.z = T.MathUtils.lerp(
        point.z,
        NECK_CENTRE_Z + (point.z - 0.094) * 0.6,
        blend,
      );
      changedNormals[i] = 1;
    }
    g.attributes.position.setXYZ(i, ...point.toArray());
  }
  const sums = new Float32Array(selected.length * 3);
  const a = new T.Vector3(),
    b = new T.Vector3(),
    c = new T.Vector3();
  for (let t = 0; t < g.index.count; t += 3) {
    const ids = [0, 1, 2].map((j) => g.index.getX(t + j));
    if (!ids.every((i) => selected[i])) continue;
    a.fromBufferAttribute(g.attributes.position, ids[0]);
    b.fromBufferAttribute(g.attributes.position, ids[1]);
    c.fromBufferAttribute(g.attributes.position, ids[2]);
    b.sub(a).cross(c.sub(a));
    for (const i of ids) {
      sums[i * 3] += b.x;
      sums[i * 3 + 1] += b.y;
      sums[i * 3 + 2] += b.z;
    }
  }
  for (let i = 0; i < changedNormals.length; i++)
    if (changedNormals[i]) {
      point.fromArray(sums, i * 3).normalize();
      g.attributes.normal.setXYZ(i, point.x, point.y, point.z);
    }
  for (const vertex of loop) {
    vertex.p.fromBufferAttribute(g.attributes.position, vertex.id);
    vertex.n.fromBufferAttribute(g.attributes.normal, vertex.id);
  }
  const centreZ =
    loop.reduce((sum, vertex) => sum + vertex.p.z, 0) / loop.length;
  loop.sort(
    (a, b) =>
      Math.atan2(a.p.x, a.p.z - centreZ) - Math.atan2(b.p.x, b.p.z - centreZ),
  );
  const muscles = connections.filter(
    (o) =>
      !o.name.startsWith("Bone_") &&
      /capitis|colli|Scalenus|Sternocleido|hyoid|thyroid/.test(o.name),
  );
  if (!muscles.length)
    throw new Error("Native cervical surfaces are required for head fitting.");
  const native = new T.Mesh(
    mergeGeometries(muscles.map((o) => o.geometry)),
    new T.MeshBasicMaterial({ side: T.DoubleSide }),
  );
  native.updateMatrixWorld(true);
  const ray = new T.Raycaster(),
    radial = new T.Vector3();
  const bases = loop.map((vertex) => {
    const angle = Math.atan2(vertex.p.x, vertex.p.z - centreZ);
    radial.set(Math.sin(angle), 0, Math.cos(angle));
    const hits = [];
    // The atlas exposes paired muscles with a narrow midline cleft. Sample
    // the adjacent native contour across that cleft rather than leaving a slit.
    for (const delta of [0, -0.1, 0.1, -0.22, 0.22, -0.36, 0.36]) {
      const probe = new T.Vector3(
        Math.sin(angle + delta),
        0,
        Math.cos(angle + delta),
      );
      for (const y of [JOIN_BASE_Y - 0.003, JOIN_BASE_Y, JOIN_BASE_Y + 0.003]) {
        const centre = new T.Vector3(0, y, NECK_CENTRE_Z);
        ray.set(
          centre.clone().addScaledVector(probe, 0.14),
          probe.clone().negate(),
        );
        const hit = ray
          .intersectObject(native)
          .find((hit) => hit.distance < 0.125);
        if (hit)
          hits.push({
            radius: 0.14 - hit.distance,
            n: hit.normal?.clone() ?? hit.face.normal.clone(),
          });
      }
      if (hits.length >= 3) break;
    }
    if (!hits.length)
      throw new Error(`Missing cervical contour at angle ${angle}.`);
    hits.sort((a, b) => a.radius - b.radius);
    const sample = hits[Math.floor(hits.length / 2)];
    return {
      p: new T.Vector3(
        radial.x * (sample.radius - 0.0007),
        JOIN_BASE_Y,
        NECK_CENTRE_Z + radial.z * (sample.radius - 0.0007),
      ),
      n: sample.n,
    };
  });
  const rows = 14,
    columns = loop.length;
  const positions = [],
    indices = [];
  for (let row = 0; row <= rows; row++) {
    const u = row / rows,
      u2 = u * u,
      u3 = u2 * u;
    for (let col = 0; col < columns; col++) {
      const a = bases[col],
        b = loop[col],
        height = b.p.y - JOIN_BASE_Y;
      const p = a.p
        .clone()
        .multiplyScalar(2 * u3 - 3 * u2 + 1)
        .addScaledVector(slope(a.n), (u3 - 2 * u2 + u) * height)
        .addScaledVector(b.p, -2 * u3 + 3 * u2)
        .addScaledVector(slope(b.n), (u3 - u2) * height);
      positions.push(...p.toArray());
      if (row < rows) {
        const i = row * columns + col,
          next = row * columns + ((col + 1) % columns);
        indices.push(i, next, i + columns, next, next + columns, i + columns);
      }
    }
  }
  const bridge = new T.BufferGeometry();
  bridge.setAttribute("position", new T.Float32BufferAttribute(positions, 3));
  bridge.setIndex(indices);
  bridge.computeVertexNormals();
  const count = bridge.attributes.position.count;
  for (const [name, source] of Object.entries(g.attributes)) {
    if (name === "position" || name === "normal") continue;
    const values = new source.array.constructor(count * source.itemSize);
    const attr = new T.BufferAttribute(
      values,
      source.itemSize,
      source.normalized,
    );
    for (let i = 0; i < count; i++) {
      const u = Math.floor(i / columns) / rows,
        col = i % columns;
      for (let j = 0; j < source.itemSize; j++)
        attr.setComponent(i, j, source.getComponent(loop[col].id, j));
      const tissue = 1 - T.MathUtils.smoothstep(u, 0.05, 0.95);
      if (name === "uv") attr.setXY(i, 0, tissue);
      if (name === "uv1")
        attr.setXY(
          i,
          u === 1
            ? source.getX(loop[col].id)
            : positions[i * 3] * 1400 + positions[i * 3 + 2] * 850,
          0.8 * tissue,
        );
    }
    bridge.setAttribute(name, attr);
  }
  for (let col = 0; col < columns; col++) {
    const i = rows * columns + col,
      n = loop[col].n;
    bridge.attributes.normal.setXYZ(i, n.x, n.y, n.z);
  }
  native.geometry.dispose();
  native.material.dispose();
  // Reuse the head boundary's actual indices so the bridge is attached to it,
  // with the same positions, normals and root weights at the shared seam.
  const joined = mergeGeometries([g, bridge]);
  const offset = g.attributes.position.count,
    top = offset + rows * columns;
  for (let i = g.index.count; i < joined.index.count; i++) {
    const id = joined.index.getX(i);
    if (id >= top) joined.index.setX(i, loop[id - top].id);
  }
  return joined;
}
