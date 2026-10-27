import * as T from "three";
import {
  mergeGeometries,
  mergeVertices,
} from "three/addons/utils/BufferGeometryUtils.js";

/** Join two horizontal neck cuts with shared boundary vertices and smooth tangents. */
export function stitchNeck(
  body,
  head,
  { origin, inverseTilt, tilt, bottomY, topY },
) {
  const toLocal = (p) => p.clone().sub(origin).applyQuaternion(inverseTilt);
  const toWorld = (p) => p.clone().applyQuaternion(tilt).add(origin);
  const key = (p) =>
    p
      .toArray()
      .map((v) => Math.round(v * 1e6))
      .join(",");

  function boundary(geometry, height) {
    const { position, normal } = geometry.attributes;
    const nodes = new Map();
    const add = (a, b) => {
      for (const [vertex, neighbor] of [
        [a, b],
        [b, a],
      ]) {
        if (!nodes.has(vertex.key))
          nodes.set(vertex.key, { ...vertex, neighbors: new Set() });
        nodes.get(vertex.key).neighbors.add(neighbor.key);
      }
    };
    const count = geometry.index?.count ?? position.count;
    for (let triangle = 0; triangle < count; triangle += 3) {
      const vertices = [0, 1, 2].map((corner) => {
        const index = geometry.index
          ? geometry.index.getX(triangle + corner)
          : triangle + corner;
        const p = toLocal(new T.Vector3().fromBufferAttribute(position, index));
        const n = new T.Vector3()
          .fromBufferAttribute(normal, index)
          .applyQuaternion(inverseTilt);
        return { p, n, key: key(p) };
      });
      for (let edge = 0; edge < 3; edge++) {
        const a = vertices[edge],
          b = vertices[(edge + 1) % 3];
        if (
          a.key !== b.key &&
          Math.abs(a.p.y - height) < 2e-6 &&
          Math.abs(b.p.y - height) < 2e-6 &&
          Math.abs(a.p.x) < 0.115 &&
          Math.abs(b.p.x) < 0.115
        )
          add(a, b);
      }
    }
    if (
      nodes.size < 8 ||
      [...nodes.values()].some((node) => node.neighbors.size !== 2)
    )
      throw new Error(`Neck cut at ${height} must be one closed loop`);
    const loop = [];
    let current = nodes.keys().next().value,
      previous;
    do {
      const vertex = nodes.get(current);
      loop.push(vertex);
      const next = [...vertex.neighbors].find(
        (neighbor) => neighbor !== previous,
      );
      previous = current;
      current = next;
    } while (current !== loop[0].key && loop.length <= nodes.size);
    if (loop.length !== nodes.size)
      throw new Error("The neck cut must not contain disconnected loops");
    let area = 0;
    for (let i = 0; i < loop.length; i++) {
      const a = loop[i].p,
        b = loop[(i + 1) % loop.length].p;
      area += a.z * b.x - b.z * a.x;
    }
    if (area < 0) loop.reverse();
    const centerZ =
      loop.reduce((sum, vertex) => sum + vertex.p.z, 0) / loop.length;
    let start = 0,
      best = Infinity;
    for (let i = 0; i < loop.length; i++) {
      const angle = Math.abs(Math.atan2(loop[i].p.x, loop[i].p.z - centerZ));
      if (angle < best) {
        best = angle;
        start = i;
      }
    }
    const ordered = [...loop.slice(start), ...loop.slice(0, start)];
    const cumulative = [0];
    for (let i = 0; i < ordered.length; i++)
      cumulative.push(
        cumulative.at(-1) +
          ordered[i].p.distanceTo(ordered[(i + 1) % ordered.length].p),
      );
    const length = cumulative.at(-1);
    return {
      vertices: ordered,
      fractions: cumulative.map((distance) => distance / length),
    };
  }

  const bottom = boundary(body, bottomY),
    top = boundary(head, topY);
  const positions = [],
    indices = [];
  const addRing = (ring) => {
    const ids = ring.vertices.map((vertex) => {
      const index = positions.length / 3;
      positions.push(...toWorld(vertex.p).toArray());
      return index;
    });
    return { ...ring, ids };
  };
  function sample(ring, t) {
    let segment = 0;
    while (
      segment < ring.vertices.length - 1 &&
      t > ring.fractions[segment + 1]
    )
      segment++;
    const a = ring.vertices[segment],
      b = ring.vertices[(segment + 1) % ring.vertices.length];
    const u =
      (t - ring.fractions[segment]) /
      (ring.fractions[segment + 1] - ring.fractions[segment]);
    return {
      p: a.p.clone().lerp(b.p, u),
      n: a.n.clone().lerp(b.n, u).normalize(),
    };
  }
  function slope(n) {
    const horizontal = Math.max(0.1, n.x * n.x + n.z * n.z);
    const result = new T.Vector3(
      (-n.x * n.y) / horizontal,
      1,
      (-n.z * n.y) / horizontal,
    );
    result.x = T.MathUtils.clamp(result.x, -1.5, 1.5);
    result.z = T.MathUtils.clamp(result.z, -1.5, 1.5);
    return result;
  }
  const rings = [addRing(bottom)];
  const columns = 96,
    rows = 12,
    height = topY - bottomY;
  for (let row = 1; row < rows; row++) {
    const u = row / rows,
      u2 = u * u,
      u3 = u2 * u;
    const vertices = [];
    for (let column = 0; column < columns; column++) {
      const t = column / columns,
        a = sample(bottom, t),
        b = sample(top, t);
      const da = slope(a.n),
        db = slope(b.n);
      const p = a.p
        .clone()
        .multiplyScalar(2 * u3 - 3 * u2 + 1)
        .addScaledVector(da, (u3 - 2 * u2 + u) * height)
        .addScaledVector(b.p, -2 * u3 + 3 * u2)
        .addScaledVector(db, (u3 - u2) * height);
      p.y = bottomY + u * height;
      vertices.push({ p });
    }
    rings.push(
      addRing({
        vertices,
        fractions: Array.from({ length: columns + 1 }, (_, i) => i / columns),
      }),
    );
  }
  rings.push(addRing(top));
  // A zipper connects unequal boundary counts without adding T-junctions.
  for (let row = 0; row < rings.length - 1; row++) {
    const a = rings[row],
      b = rings[row + 1];
    let i = 0,
      j = 0;
    while (i < a.ids.length || j < b.ids.length) {
      const ai = a.ids[i % a.ids.length],
        bj = b.ids[j % b.ids.length];
      const nextA = i < a.ids.length ? a.fractions[i + 1] : Infinity;
      const nextB = j < b.ids.length ? b.fractions[j + 1] : Infinity;
      if (nextA <= nextB) {
        indices.push(ai, a.ids[(i + 1) % a.ids.length], bj);
        i++;
      } else {
        indices.push(ai, b.ids[(j + 1) % b.ids.length], bj);
        j++;
      }
    }
  }
  const bridge = new T.BufferGeometry();
  bridge.setAttribute("position", new T.Float32BufferAttribute(positions, 3));
  bridge.setIndex(indices);
  // Weld positions first, then compute shared normals across both seams.
  const surfaces = [body, bridge, head].map((geometry) => {
    const result = geometry.clone();
    result.deleteAttribute("normal");
    return result;
  });
  const joined = mergeVertices(mergeGeometries(surfaces), 0.000001);
  joined.computeVertexNormals();
  // Keep the authored face normals and the body's SDF normals away from the
  // join. Only the neck band needs normals recomputed across both surfaces.
  const originalNormals = new Map();
  for (const surface of [body, head]) {
    for (let vertex = 0; vertex < surface.attributes.position.count; vertex++) {
      const p = new T.Vector3().fromBufferAttribute(
        surface.attributes.position,
        vertex,
      );
      const n = new T.Vector3().fromBufferAttribute(
        surface.attributes.normal,
        vertex,
      );
      const id = key(p);
      if (originalNormals.has(id)) originalNormals.get(id).add(n);
      else originalNormals.set(id, n);
    }
  }
  const p = new T.Vector3(),
    n = new T.Vector3();
  for (let vertex = 0; vertex < joined.attributes.position.count; vertex++) {
    p.fromBufferAttribute(joined.attributes.position, vertex);
    const original = originalNormals.get(key(p));
    if (!original) continue;
    const y = toLocal(p).y;
    const blend =
      y < bottomY
        ? T.MathUtils.smoothstep(y, bottomY - 0.008, bottomY)
        : y > topY
          ? 1 - T.MathUtils.smoothstep(y, topY, topY + 0.008)
          : 1;
    n.fromBufferAttribute(joined.attributes.normal, vertex);
    n.copy(original.clone().normalize().lerp(n, blend).normalize());
    joined.attributes.normal.setXYZ(vertex, n.x, n.y, n.z);
  }
  return joined;
}
