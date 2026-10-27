import * as T from "three";
import { MarchingCubes } from "three/addons/objects/MarchingCubes.js";
import { mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";

const clamp = T.MathUtils.clamp;
const smoothMin = (a, b, k) => {
  const h = Math.max(k - Math.abs(a - b), 0) / k;
  return Math.min(a, b) - h * h * k * 0.25;
};
function tube(a, b, ra, rb = ra) {
  const axis = b.clone().sub(a),
    length = axis.length(),
    dir = axis.clone().divideScalar(length);
  return (p) => {
    const t = clamp(p.clone().sub(a).dot(dir) / length, 0, 1);
    return (
      p.distanceTo(a.clone().addScaledVector(axis, t)) -
      T.MathUtils.lerp(ra, rb, t)
    );
  };
}
function ellipsoid(c, r) {
  return (p) => {
    const q = p.clone().sub(c);
    return (
      (Math.hypot(q.x / r.x, q.y / r.y, q.z / r.z) - 1) *
      Math.min(r.x, r.y, r.z)
    );
  };
}
function surface(min, size, resolution, sdf) {
  const mc = new MarchingCubes(
    resolution,
    new T.MeshBasicMaterial(),
    false,
    false,
    250000,
  );
  mc.isolation = 0;
  const point = new T.Vector3(),
    step = size.clone().divideScalar(resolution);
  for (let z = 0; z < resolution; z++)
    for (let y = 0; y < resolution; y++)
      for (let x = 0; x < resolution; x++) {
        point.set(min.x + x * step.x, min.y + y * step.y, min.z + z * step.z);
        mc.field[z * resolution * resolution + y * resolution + x] =
          -sdf(point);
      }
  mc.update();
  const g = new T.BufferGeometry(),
    values = new Float32Array(
      mc.geometry.attributes.position.array.slice(0, mc.count * 3),
    );
  for (let i = 0; i < values.length; i += 3)
    for (let j = 0; j < 3; j++)
      values[i + j] =
        min.getComponent(j) + ((values[i + j] + 1) * size.getComponent(j)) / 2;
  g.setAttribute("position", new T.BufferAttribute(values, 3));
  const mesh = mergeVertices(g, 0.00001);
  mesh.computeVertexNormals();
  mc.geometry.dispose();
  mc.material.dispose();
  return mesh;
}
const v = (x, y, z) => new T.Vector3(x, y, z);
const union = (shapes) => (p) =>
  shapes.reduce((d, shape) => smoothMin(d, shape(p), 0.009), 10);

/** Neutral connective surface, recessed beneath the anatomical muscle meshes. */
export function createAnatomyFoundation(bones) {
  const byName = new Map(bones.map((b) => [b.name, b.position])),
    parts = [];
  const torso = [
    ellipsoid(v(0, 1.25, 0.11), v(0.127, 0.16, 0.063)),
    ellipsoid(v(0, 1.08, 0.12), v(0.1, 0.17, 0.065)),
    tube(v(0, 1.39, 0.12), v(0, 1.49, 0.12), 0.056, 0.034),
    tube(v(0, 1.47, 0.12), v(0, 1.575, 0.125), 0.034, 0.039),
  ];
  for (const side of [-1, 1])
    torso.push(
      tube(
        v(side * 0.12, 1.345, 0.12),
        byName.get(`upperArm_${side < 0 ? "L" : "R"}`),
        0.035,
        0.041,
      ),
    );
  const torsoSurface = union(torso);
  parts.push(
    surface(v(-0.24, 0.95, -0.04), v(0.48, 0.68, 0.34), 80, (p) =>
      Math.max(torsoSurface(p), 0.975 - p.y),
    ),
  );
  for (const side of [-1, 1]) {
    const suffix = side < 0 ? "L" : "R",
      shoulder = byName.get(`upperArm_${suffix}`),
      elbow = byName.get(`forearm_${suffix}`),
      wrist = byName.get(`hand_${suffix}`);
    const arm = union([
      tube(shoulder, elbow, 0.028, 0.024),
      tube(elbow, wrist, 0.024, 0.014),
      ellipsoid(elbow, v(0.025, 0.028, 0.025)),
    ]);
    parts.push(
      surface(
        v(side < 0 ? -0.39 : 0.15, 0.75, 0.065),
        v(0.24, 0.68, 0.17),
        76,
        arm,
      ),
    );
    const hip = byName.get(`thigh_${suffix}`),
      knee = byName.get(`shin_${suffix}`),
      ankle = byName.get(`foot_${suffix}`);
    parts.push(
      surface(
        v(side < 0 ? -0.26 : 0.04, 0.015, -0.035),
        v(0.22, 0.92, 0.31),
        86,
        union([tube(hip, knee, 0.038, 0.025), tube(knee, ankle, 0.022, 0.013)]),
      ),
    );
  }
  return parts;
}

/** Closed, fitted training shorts; the cuffs follow the femurs, not the torso. */
export function createTrainingShorts(bones) {
  const byName = new Map(bones.map((b) => [b.name, b.position]));
  const profiles = [
    [0.77, 0.04, 0.065, 0.1],
    [0.82, 0.145, 0.105, 0.09],
    [0.87, 0.175, 0.12, 0.09],
    [0.92, 0.16, 0.105, 0.12],
    [0.99, 0.135, 0.098, 0.12],
  ];
  const pelvis = (p) => {
    let section = 0;
    while (section < profiles.length - 2 && p.y > profiles[section + 1][0])
      section++;
    const a = profiles[section],
      b = profiles[section + 1],
      t = clamp((p.y - a[0]) / (b[0] - a[0]), 0, 1),
      r = [1, 2, 3].map((i) => T.MathUtils.lerp(a[i], b[i], t));
    return Math.max(
      (Math.hypot(p.x / r[0], (p.z - r[2]) / r[1]) - 1) * Math.min(r[0], r[1]),
      profiles[0][0] - p.y,
      p.y - 0.99,
    );
  };
  const shapes = [pelvis];
  for (const suffix of ["L", "R"]) {
    const hip = byName.get(`thigh_${suffix}`),
      knee = byName.get(`shin_${suffix}`),
      end = hip.clone().lerp(knee, 0.34),
      dir = knee.clone().sub(hip).normalize();
    const leg = tube(hip, end, 0.088, 0.079);
    shapes.push((p) => Math.max(leg(p), p.clone().sub(end).dot(dir)));
  }
  return surface(v(-0.28, 0.66, -0.105), v(0.56, 0.36, 0.43), 104, (p) =>
    Math.max(union(shapes)(p), p.y - 0.99),
  );
}
