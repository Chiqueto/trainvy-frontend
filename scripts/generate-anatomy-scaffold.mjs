/**
 * Trainvy Atelier — original procedural anatomical athlete, in metres.
 * Geometry, head, hands, garment and footwear are authored here, without
 * downloaded meshes, textures, external head assets or runtime dependencies.
 * Regenerate: node scripts/generate-anatomy-scaffold.mjs
 */
import { mkdir, writeFile } from "node:fs/promises";
import * as T from "three";
import { MarchingCubes } from "three/addons/objects/MarchingCubes.js";
import {
  mergeVertices,
  mergeGeometries,
} from "three/addons/utils/BufferGeometryUtils.js";
import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";
import { stitchNeck } from "./stitch-anatomy-neck.mjs";

const FOOT_ANGLE = 0;
const restPosition = new T.Vector3(0, 1.142, 0);
const getSledPosition = () => restPosition.clone();
const toSledWorld = (point) => point.clone().add(restPosition);
function getLegPose(side) {
  const hip = toSledWorld(new T.Vector3(side * 0.14, -0.28, 0.08));
  const ankle = new T.Vector3(side * 0.18, 0.05, 0.04);
  const axis = ankle.clone().sub(hip),
    d = axis.length();
  axis.normalize();
  const along = (d * d + 0.44 * 0.44 - 0.42 * 0.42) / (2 * d);
  const h = Math.sqrt(0.44 * 0.44 - along * along);
  const pole = new T.Vector3(side * 0.12, 0.15, 1);
  pole.addScaledVector(axis, -pole.dot(axis)).normalize();
  return {
    hip,
    ankle,
    knee: hip.clone().addScaledVector(axis, along).addScaledVector(pole, h),
  };
}

// GLTFExporter uses the browser FileReader interface even for untextured GLBs.
globalThis.FileReader = class {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then((result) => {
      this.result = result;
      this.onloadend?.();
    });
  }
};

const shapes = [];
const cuts = [];
const handGroups = [];
const up = new T.Vector3(0, 1, 0);
const tilt = new T.Quaternion();
const red = new T.Color("#b95d49");
const rose = new T.Color("#a94c3d");
const tendon = new T.Color("#e5d9bd");
const skin = new T.Color("#b8b4ac");
const NECK_BASE_Y = 0.347;
const HEAD_JOIN_Y = 0.389;
const fabric = new T.Color("#070708");
const elastic = new T.Color("#101012");
const trim = new T.Color("#09090b");
const briefTop = -0.195;
const briefHem = (p) =>
  -0.438 + 0.12 * Math.pow(Math.min(1, Math.abs(p.x) / 0.19), 1.8);
const insideBriefs = (p) =>
  p.y <= briefTop && p.y >= briefHem(p) && Math.abs(p.x) < 0.195;
const briefColor = (p) =>
  p.y > briefTop - 0.018 ? elastic : p.y - briefHem(p) < 0.003 ? trim : fabric;
const vec = (a) => new T.Vector3(...a);
const smooth = (a, b, x) => T.MathUtils.smoothstep(x, a, b);

function ellipsoid(
  center,
  radii,
  {
    quaternion = new T.Quaternion(),
    blend = 0.012,
    color = red,
    fiber = 0.7,
    power = 2,
    fan = false,
    cut = false,
    muscle = "neutral",
  } = {},
) {
  const rotation = new T.Matrix4().makeRotationFromQuaternion(quaternion);
  const e = rotation.elements;
  const r = vec(radii);
  const extent = new T.Vector3(
    Math.abs(e[0]) * r.x + Math.abs(e[4]) * r.y + Math.abs(e[8]) * r.z,
    Math.abs(e[1]) * r.x + Math.abs(e[5]) * r.y + Math.abs(e[9]) * r.z,
    Math.abs(e[2]) * r.x + Math.abs(e[6]) * r.y + Math.abs(e[10]) * r.z,
  ).addScalar(blend + 0.014);
  const shape = {
    center,
    radii: r,
    e,
    extent,
    blend,
    color,
    fiber,
    power,
    fan,
    muscle,
  };
  (cut ? cuts : shapes).push(shape);
  return shape;
}

function body(center, radii, options = {}) {
  return ellipsoid(toSledWorld(vec(center)), radii, {
    ...options,
    quaternion: tilt.clone().multiply(options.quaternion ?? new T.Quaternion()),
  });
}

function span(start, end, width, depth, options = {}) {
  const direction = end.clone().sub(start);
  const center = start.clone().add(end).multiplyScalar(0.5);
  return ellipsoid(center, [width, direction.length() * 0.5, depth], {
    ...options,
    quaternion: new T.Quaternion().setFromUnitVectors(
      up,
      direction.normalize(),
    ),
  });
}

function bodySpan(a, b, width, depth, options = {}) {
  return span(toSledWorld(vec(a)), toSledWorld(vec(b)), width, depth, options);
}

// A lofted anatomical envelope gives the ribcage, waist and iliac crest a
// continuous contour. Muscle relief then emerges from that surface.
const torsoProfile = [
  [-0.365, 0.004, 0.004, 0.09],
  [-0.33, 0.125, 0.079, 0.09],
  [-0.27, 0.164, 0.094, 0.095],
  [-0.2, 0.141, 0.078, 0.122],
  [-0.12, 0.127, 0.072, 0.13],
  [-0.02, 0.139, 0.076, 0.132],
  [0.08, 0.165, 0.088, 0.135],
  [0.18, 0.183, 0.085, 0.133],
  [0.23, 0.17, 0.073, 0.132],
  [0.27, 0.115, 0.058, 0.125],
  [0.29, 0.035, 0.029, 0.12],
  [0.3, 0.002, 0.002, 0.12],
];
const inverseTilt = tilt.clone().invert();
const sledOrigin = getSledPosition(0);
const samplePoint = new T.Vector3();
const envelope = body([0, -0.02, 0.13], [0.2, 0.35, 0.13], {
  blend: 0.018,
  color: rose,
  fiber: 0.45,
});
envelope.sample = (x, y, z) => {
  samplePoint.set(x, y, z).sub(sledOrigin).applyQuaternion(inverseTilt);
  const py = samplePoint.y;
  let section = 0;
  while (section < torsoProfile.length - 2 && py > torsoProfile[section + 1][0])
    section++;
  const a = torsoProfile[section],
    b = torsoProfile[section + 1];
  const t = T.MathUtils.clamp((py - a[0]) / (b[0] - a[0]), 0, 1);
  const values = [1, 2, 3].map((c) => {
    const p0 = torsoProfile[Math.max(0, section - 1)][c];
    const p3 = torsoProfile[Math.min(torsoProfile.length - 1, section + 2)][c];
    return (
      0.5 *
      (2 * a[c] +
        (-p0 + b[c]) * t +
        (2 * p0 - 5 * a[c] + 4 * b[c] - p3) * t * t +
        (-p0 + 3 * a[c] - 3 * b[c] + p3) * t * t * t)
    );
  });
  const [width, depth, centerZ] = values;
  const radial =
    (Math.hypot(samplePoint.x / width, (samplePoint.z - centerZ) / depth) - 1) *
    Math.min(width, depth);
  return Math.max(radial, torsoProfile[0][0] - py, py - torsoProfile.at(-1)[0]);
};
body([0, 0.322, 0.113], [0.047, 0.091, 0.047], { blend: 0.025 });

for (const side of [-1, 1]) {
  // Broad fan-shaped pectorals with a shallow sternum and tapered waist.
  body([side * 0.087, 0.151, 0.212], [0.095, 0.064, 0.027], {
    blend: 0.014,
    fiber: 1,
    fan: true,
    muscle: "pectoralis",
  });
  body([side * 0.107, 0.199, 0.186], [0.092, 0.036, 0.032], {
    blend: 0.018,
    fiber: 0.85,
    fan: true,
    muscle: "pectoralis",
  });
  body([side * 0.116, -0.073, 0.147], [0.024, 0.105, 0.038], {
    blend: 0.014,
    fiber: 0.85,
  });
  body([side * 0.111, 0.066, 0.068], [0.08, 0.156, 0.044], { blend: 0.02 });
  bodySpan(
    [side * 0.035, 0.338, 0.09],
    [side * 0.205, 0.229, 0.11],
    0.037,
    0.036,
    { blend: 0.019 },
  );
  bodySpan(
    [side * 0.029, 0.362, 0.15],
    [side * 0.019, 0.232, 0.177],
    0.012,
    0.012,
    { blend: 0.009 },
  );
  bodySpan(
    [side * 0.025, 0.235, 0.201],
    [side * 0.193, 0.239, 0.164],
    0.006,
    0.007,
    { blend: 0.008, color: tendon, fiber: 0.18 },
  );
  for (const y of [0.043, -0.013, -0.071]) {
    body([side * 0.036, y, 0.212 - Math.abs(y) * 0.07], [0.032, 0.026, 0.017], {
      blend: 0.011,
      power: 2.7,
      fiber: 0.85,
    });
  }
  body([side * 0.032, -0.139, 0.196], [0.028, 0.041, 0.015], {
    blend: 0.014,
    fiber: 0.9,
  });
  for (let j = 0; j < 3; j++) {
    body(
      [side * (0.137 - j * 0.005), 0.08 - j * 0.035, 0.185],
      [0.021, 0.013, 0.01],
      { blend: 0.009 },
    );
  }
  // Gluteal folds blend into the proximal thighs rather than floating over them.
  body([side * 0.092, -0.297, 0.047], [0.09, 0.095, 0.072], {
    blend: 0.021,
    color: rose,
    fan: true,
    muscle: "gluteus",
  });
  // Scapular planes, spinal erectors and the lumbar aponeurosis.
  body([side * 0.099, 0.151, 0.055], [0.074, 0.086, 0.032], {
    blend: 0.018,
    fan: true,
  });
  bodySpan(
    [side * 0.035, -0.19, 0.049],
    [side * 0.027, 0.151, 0.043],
    0.024,
    0.019,
    { blend: 0.012, color: rose },
  );

  // Neutral A-pose, rather than a bent hack-machine bind pose.
  const shoulder = new T.Vector3(side * 0.215, 0.224, 0.132);
  const elbow = new T.Vector3(side * 0.295, -0.06, 0.12);
  const wrist = new T.Vector3(side * 0.32, -0.325, 0.15);
  const a = (t, x = 0, z = 0) =>
    shoulder
      .clone()
      .lerp(elbow, t)
      .add(new T.Vector3(side * x, 0, z))
      .toArray();
  const f = (t, x = 0, z = 0) =>
    elbow
      .clone()
      .lerp(wrist, t)
      .add(new T.Vector3(side * x, 0, z))
      .toArray();
  body(shoulder.toArray(), [0.064, 0.07, 0.061], {
    blend: 0.019,
    fiber: 0.7,
    muscle: "deltoidLateral",
  });
  bodySpan(a(-0.06, 0, 0.029), a(0.37, 0.004, 0.03), 0.037, 0.036, {
    blend: 0.012,
    fiber: 0.9,
    muscle: "deltoidAnterior",
  });
  bodySpan(a(-0.03, 0.024, -0.022), a(0.4, 0.021, -0.02), 0.033, 0.035, {
    blend: 0.012,
    fiber: 0.85,
    muscle: "deltoidPosterior",
  });
  bodySpan(a(0.08), a(0.98), 0.04, 0.039, { blend: 0.015, fiber: 0.45 });
  // Biceps, brachialis and the long/lateral triceps heads are distinct volumes.
  bodySpan(a(0.18, -0.002, 0.026), a(0.86, -0.002, 0.025), 0.038, 0.038, {
    blend: 0.008,
    fiber: 1,
    muscle: "biceps",
  });
  bodySpan(a(0.24, 0.026, 0.002), a(0.95, 0.022, 0.004), 0.021, 0.027, {
    blend: 0.007,
    fiber: 0.85,
    muscle: "brachialis",
  });
  bodySpan(a(0.13, -0.01, -0.027), a(0.9, -0.01, -0.022), 0.034, 0.036, {
    blend: 0.009,
    fiber: 1,
    muscle: "triceps",
  });
  bodySpan(a(0.2, 0.027, -0.02), a(0.93, 0.023, -0.016), 0.022, 0.03, {
    blend: 0.008,
    fiber: 0.95,
    muscle: "triceps",
  });
  body(elbow.toArray(), [0.03, 0.03, 0.031], {
    blend: 0.014,
    fiber: 0.1,
    color: tendon,
  });
  bodySpan(f(0.01), f(1.02), 0.027, 0.027, { blend: 0.013, fiber: 0.45 });
  bodySpan(f(0.06, 0.017, 0.01), f(0.79, 0.008, 0.014), 0.027, 0.03, {
    blend: 0.008,
    fiber: 1,
    muscle: "forearm",
  });
  bodySpan(f(0.1, -0.014, -0.013), f(0.85, -0.006, -0.008), 0.024, 0.026, {
    blend: 0.008,
    fiber: 1,
    muscle: "forearm",
  });
  for (const offset of [-0.012, 0, 0.012]) {
    bodySpan(
      f(0.17, offset, 0.024),
      f(0.92, offset * 0.5, 0.019),
      0.0065,
      0.008,
      { blend: 0.003, fiber: 1, muscle: "forearm" },
    );
    bodySpan(
      f(0.64, offset * 0.6, 0.022),
      f(1.01, offset * 0.45, 0.02),
      0.0027,
      0.0035,
      { blend: 0.003, color: tendon, fiber: 0.1 },
    );
  }
  body(wrist.toArray(), [0.023, 0.027, 0.023], {
    blend: 0.01,
    color: skin,
    fiber: 0,
  });
  // Closed hands are authored around the horizontal bar, with separated fingers.
  const handStart = shapes.length;
  const palm = wrist.clone().add(new T.Vector3(0, -0.019, 0.005));
  body(palm.toArray(), [0.033, 0.027, 0.019], {
    blend: 0.008,
    color: skin,
    fiber: 0,
  });
  for (let finger = 0; finger < 4; finger++) {
    const x = palm.x + side * (finger - 1.5) * 0.014;
    const points = [
      [0.012, -0.008],
      [0.02, 0.012],
      [0.002, 0.031],
      [-0.019, 0.024],
      [-0.023, 0.009],
    ];
    for (let j = 0; j < 4; j++) {
      const p = points[j],
        q = points[j + 1];
      bodySpan(
        [x, wrist.y + p[0], wrist.z + p[1]],
        [x, wrist.y + q[0], wrist.z + q[1]],
        0.0062 - j * 0.00035,
        0.0062,
        { blend: 0.002, color: skin, fiber: 0 },
      );
    }
  }
  bodySpan(
    [palm.x - side * 0.028, wrist.y - 0.014, wrist.z - 0.014],
    [palm.x - side * 0.035, wrist.y + 0.004, wrist.z + 0.001],
    0.01,
    0.01,
    { blend: 0.004, color: skin, fiber: 0 },
  );
  bodySpan(
    [palm.x - side * 0.035, wrist.y + 0.004, wrist.z + 0.001],
    [palm.x - side * 0.014, wrist.y + 0.012, wrist.z + 0.014],
    0.008,
    0.008,
    { blend: 0.004, color: skin, fiber: 0 },
  );
  handGroups.push({ side, volumes: shapes.slice(handStart) });
}

// Shallow negative volumes engrave the abdominal midline and navel.
body([0, 0.11, 0.245], [0.003, 0.107, 0.01], { blend: 0.003, cut: true });
body([0, -0.037, 0.218], [0.0025, 0.1, 0.007], { blend: 0.002, cut: true });
body([0, -0.11, 0.207], [0.008, 0.007, 0.005], { blend: 0.003, cut: true });
for (const side of [-1, 1]) {
  bodySpan(
    [side * 0.115, -0.111, 0.175],
    [side * 0.047, -0.236, 0.193],
    0.015,
    0.012,
    { color: rose, fiber: 0.9, blend: 0.009 },
  );
}

const headStart = shapes.length;
// Cranial vault, mandible, zygomatic planes, brow, nose and ears. Dimensions
// follow adult proportions; the head is not a downloaded/stylised character.
body([0, 0.487, 0.111], [0.073, 0.09, 0.08], {
  blend: 0.018,
  color: skin,
  fiber: 0,
});
body([0, 0.518, 0.104], [0.07, 0.061, 0.074], {
  blend: 0.014,
  color: skin,
  fiber: 0,
});
body([0, 0.414, 0.142], [0.062, 0.051, 0.055], {
  blend: 0.016,
  color: skin,
  fiber: 0,
});
body([0, 0.386, 0.171], [0.03, 0.023, 0.026], {
  blend: 0.012,
  color: skin,
  fiber: 0,
});
body([0, 0.459, 0.199], [0.009, 0.038, 0.014], {
  blend: 0.007,
  color: skin,
  fiber: 0,
});
body([0, 0.441, 0.217], [0.013, 0.012, 0.014], {
  blend: 0.005,
  color: skin,
  fiber: 0,
});
body([0, 0.411, 0.198], [0.025, 0.0038, 0.006], {
  blend: 0.002,
  color: skin,
  fiber: 0,
});
body([0, 0.404, 0.198], [0.023, 0.004, 0.006], {
  blend: 0.002,
  color: skin,
  fiber: 0,
});
body([0, 0.408, 0.204], [0.022, 0.0012, 0.004], { blend: 0.0006, cut: true });
for (const side of [-1, 1]) {
  body([side * 0.043, 0.45, 0.169], [0.03, 0.031, 0.025], {
    blend: 0.012,
    color: skin,
    fiber: 0,
  });
  body([side * 0.031, 0.494, 0.176], [0.031, 0.01, 0.021], {
    blend: 0.009,
    color: skin,
    fiber: 0,
  });
  body([side * 0.01, 0.437, 0.207], [0.009, 0.008, 0.012], {
    blend: 0.003,
    color: skin,
    fiber: 0,
  });
  body([side * 0.008, 0.434, 0.217], [0.0037, 0.0028, 0.004], {
    blend: 0.001,
    cut: true,
  });
  body([side * 0.031, 0.478, 0.185], [0.021, 0.009, 0.014], {
    blend: 0.003,
    cut: true,
  });
  body([side * 0.075, 0.462, 0.104], [0.012, 0.03, 0.018], {
    blend: 0.007,
    color: skin,
    fiber: 0,
  });
  body([side * 0.082, 0.464, 0.113], [0.006, 0.019, 0.009], {
    blend: 0.002,
    cut: true,
  });
  body([side * 0.082, 0.448, 0.116], [0.005, 0.007, 0.007], {
    blend: 0.003,
    color: skin,
    fiber: 0,
  });
}

const headShapes = shapes.slice(headStart);
const legs = [-1, 1].map((side) => ({ side, ...getLegPose(side, 0) }));
for (const { side, hip, knee, ankle } of legs) {
  const direction = knee.clone().sub(hip).normalize();
  const front = new T.Vector3(0, 0, 1)
    .addScaledVector(direction, -direction.z)
    .normalize();
  const lateral = new T.Vector3()
    .crossVectors(direction, front)
    .normalize()
    .multiplyScalar(side);
  const at = (t, x = 0, z = 0) =>
    hip
      .clone()
      .lerp(knee, t)
      .addScaledVector(lateral, x)
      .addScaledVector(front, z);
  const muscle = { muscle: "quadriceps", color: red, fiber: 1, blend: 0.013 };
  // Femur envelope, vastus lateralis, rectus femoris, adductors, and the
  // characteristic medial teardrop above the patella.
  span(at(0.01), at(0.99), 0.071, 0.07, {
    ...muscle,
    muscle: "neutral",
    blend: 0.018,
  });
  span(at(0.08, 0.047, 0.012), at(0.87, 0.036, 0.023), 0.061, 0.073, muscle);
  span(at(0.06, -0.009, 0.037), at(0.88, -0.002, 0.04), 0.049, 0.069, {
    ...muscle,
    color: new T.Color("#c46557"),
  });
  span(at(0.1, -0.044, -0.008), at(0.79, -0.031, 0.006), 0.054, 0.062, {
    ...muscle,
    muscle: "adductors",
    activation: 0.62,
  });
  span(at(0.57, -0.038, 0.024), at(0.96, -0.025, 0.025), 0.04, 0.05, {
    ...muscle,
    blend: 0.007,
  });
  // Hamstrings and sartorius support/stabilise; they are not painted as prime movers.
  span(at(0.08, 0.02, -0.055), at(0.9, 0.016, -0.035), 0.049, 0.052, {
    ...muscle,
    muscle: "hamstrings",
    color: rose,
  });
  span(at(0.12, -0.035, -0.049), at(0.91, -0.03, -0.03), 0.042, 0.045, {
    ...muscle,
    muscle: "hamstrings",
    color: rose,
  });
  span(at(0.14, 0.043, 0.072), at(0.83, -0.037, 0.058), 0.012, 0.016, {
    ...muscle,
    muscle: "sartorius",
    color: rose,
    blend: 0.009,
  });
  // Patella and quadriceps tendon are part of the same surface.
  ellipsoid(knee.clone().addScaledVector(front, 0.014), [0.043, 0.045, 0.043], {
    color: rose,
    fiber: 0.15,
    blend: 0.016,
    activation: 0.16,
  });
  span(
    at(0.83, 0, 0.036),
    knee.clone().addScaledVector(front, 0.047),
    0.021,
    0.016,
    { color: tendon, blend: 0.007, activation: 0.2 },
  );

  const shinDir = ankle.clone().sub(knee).normalize();
  const shinFront = new T.Vector3(0, 0, 1)
    .addScaledVector(shinDir, -shinDir.z)
    .normalize();
  const shinAt = (t, x = 0, z = 0) =>
    knee
      .clone()
      .lerp(ankle, t)
      .add(new T.Vector3(side * x, 0, 0))
      .addScaledVector(shinFront, z);
  ellipsoid(knee.clone().addScaledVector(front, 0.045), [0.029, 0.035, 0.013], {
    quaternion: new T.Quaternion().setFromUnitVectors(
      new T.Vector3(0, 0, 1),
      front,
    ),
    color: tendon,
    blend: 0.009,
    activation: 0.12,
  });
  span(
    knee.clone().addScaledVector(front, 0.044),
    shinAt(0.16, 0, 0.034),
    0.014,
    0.012,
    { color: tendon, blend: 0.009, activation: 0.15 },
  );
  span(shinAt(0.01), shinAt(1.02), 0.035, 0.037, {
    color: red,
    blend: 0.016,
    activation: 0.18,
  });
  span(
    shinAt(0.08, -0.017, -0.028),
    shinAt(0.62, -0.016, -0.019),
    0.035,
    0.044,
    { color: rose, fiber: 0.8, blend: 0.009 },
  );
  span(shinAt(0.07, 0.021, -0.023), shinAt(0.58, 0.02, -0.018), 0.032, 0.037, {
    color: rose,
    fiber: 0.8,
    blend: 0.009,
  });
  span(shinAt(0.15, 0.024, 0.013), shinAt(0.86, 0.01, 0.012), 0.023, 0.024, {
    color: red,
    fiber: 0.95,
    blend: 0.01,
  });
  span(shinAt(0.18, -0.009, 0.033), shinAt(0.95, -0.007, 0.025), 0.008, 0.007, {
    color: tendon,
    fiber: 0.1,
    blend: 0.005,
  });
  span(shinAt(0.55, 0, -0.023), shinAt(1.02, 0, -0.009), 0.014, 0.015, {
    color: tendon,
    blend: 0.007,
    activation: 0.2,
  });
  ellipsoid(ankle, [0.033, 0.038, 0.034], {
    color: tendon,
    blend: 0.014,
    activation: 0.2,
  });
}

function distanceAt(x, y, z, shape) {
  if (shape.sample) return shape.sample(x, y, z);
  const dx = x - shape.center.x,
    dy = y - shape.center.y,
    dz = z - shape.center.z;
  const e = shape.e,
    r = shape.radii;
  const a = (e[0] * dx + e[1] * dy + e[2] * dz) / r.x;
  const b = (e[4] * dx + e[5] * dy + e[6] * dz) / r.y;
  const c = (e[8] * dx + e[9] * dy + e[10] * dz) / r.z;
  const p = shape.power;
  return (
    (Math.pow(Math.abs(a) ** p + Math.abs(b) ** p + Math.abs(c) ** p, 1 / p) -
      1) *
    Math.min(r.x, r.y, r.z)
  );
}

const startTime = performance.now();
function meshField(volumes, negativeVolumes, minimum, size, resolution) {
  const mc = new MarchingCubes(
    resolution,
    new T.MeshStandardMaterial(),
    false,
    false,
    600000,
  );
  mc.isolation = 0;
  mc.field.fill(-1);
  const step = size.clone().divideScalar(resolution);

  for (const shape of [...volumes, ...negativeVolumes]) {
    const low = shape.center
      .clone()
      .sub(shape.extent)
      .sub(minimum)
      .divide(step);
    const high = shape.center
      .clone()
      .add(shape.extent)
      .sub(minimum)
      .divide(step);
    const isCut = negativeVolumes.includes(shape);
    for (
      let iz = Math.max(1, Math.floor(low.z));
      iz <= Math.min(resolution - 2, Math.ceil(high.z));
      iz++
    ) {
      const z = minimum.z + iz * step.z;
      for (
        let iy = Math.max(1, Math.floor(low.y));
        iy <= Math.min(resolution - 2, Math.ceil(high.y));
        iy++
      ) {
        const y = minimum.y + iy * step.y;
        for (
          let ix = Math.max(1, Math.floor(low.x));
          ix <= Math.min(resolution - 2, Math.ceil(high.x));
          ix++
        ) {
          const x = minimum.x + ix * step.x;
          const index = iz * resolution * resolution + iy * resolution + ix;
          const a = -mc.field[index];
          const b = distanceAt(x, y, z, shape);
          const k = shape.blend;
          if (isCut) {
            const h = Math.max(k - Math.abs(a + b), 0) / k;
            mc.field[index] = -(Math.max(a, -b) + h * h * k * 0.25);
          } else {
            const h = Math.max(k - Math.abs(a - b), 0) / k;
            mc.field[index] = -(Math.min(a, b) - h * h * k * 0.25);
          }
        }
      }
    }
  }
  mc.update();
  const geometry = new T.BufferGeometry();
  const position = new Float32Array(
    mc.geometry.attributes.position.array.slice(0, mc.count * 3),
  );
  const normals = new Float32Array(
    mc.geometry.attributes.normal.array.slice(0, mc.count * 3),
  );
  for (let i = 0; i < position.length; i += 3) {
    for (let j = 0; j < 3; j++) {
      position[i + j] =
        minimum.getComponent(j) +
        (position[i + j] + 1) * size.getComponent(j) * 0.5;
      normals[i + j] /= size.getComponent(j);
    }
    const n = Math.hypot(normals[i], normals[i + 1], normals[i + 2]);
    for (let j = 0; j < 3; j++) normals[i + j] /= n || 1;
  }
  geometry.setAttribute("position", new T.BufferAttribute(position, 3));
  geometry.setAttribute("normal", new T.BufferAttribute(normals, 3));
  const result = mergeVertices(geometry, 0.00001);
  mc.geometry.dispose();
  mc.material.dispose();
  return result;
}

const handShapes = handGroups.flatMap((group) => group.volumes);
const bodyGeometry = meshField(
  shapes.filter((s) => !handShapes.includes(s) && !headShapes.includes(s)),
  cuts,
  new T.Vector3(-0.48, 0.005, -0.1),
  new T.Vector3(0.96, 1.78, 0.5),
  200,
);
const headGeometry = meshField(
  [
    ...headShapes,
    ...shapes.filter(
      (s) =>
        s.center.y > 1.42 && s.center.y < 1.51 && Math.abs(s.center.x) < 0.08,
    ),
  ],
  cuts.filter((s) => s.center.y > 1.5),
  new T.Vector3(-0.105, 1.48, 0.012),
  new T.Vector3(0.21, 0.275, 0.235),
  96,
);
const handGeometries = handGroups.map(({ side, volumes }) => {
  const center = toSledWorld(vec([side * 0.32, -0.325, 0.15]));
  const size = new T.Vector3(0.13, 0.1, 0.11);
  return meshField(
    volumes,
    [],
    center.clone().sub(size.clone().multiplyScalar(0.5)),
    size,
    64,
  );
});

const restSled = getSledPosition(0);
const bones = [];
function bone(name, position) {
  const b = new T.Bone();
  b.name = name;
  b.position.copy(position);
  bones.push(b);
  return b;
}
bone("sled", restSled);
for (const { side, hip, knee, ankle } of legs) {
  const suffix = side < 0 ? "L" : "R";
  bone(`thigh_${suffix}`, hip);
  bone(`shin_${suffix}`, knee);
  bone(`foot_${suffix}`, ankle);
}

const armFrames = [-1, 1].map((side) => {
  const shoulder = toSledWorld(vec([side * 0.215, 0.224, 0.132]));
  const elbow = toSledWorld(vec([side * 0.295, -0.06, 0.12]));
  const wrist = toSledWorld(vec([side * 0.32, -0.325, 0.15]));
  const index = bones.length;
  for (const [name, point] of [
    ["upperArm", shoulder],
    ["forearm", elbow],
    ["hand", wrist],
  ])
    bone(`${name}_${side < 0 ? "L" : "R"}`, point);
  return { side, shoulder, elbow, wrist, index };
});
for (const frame of armFrames) {
  frame.elbowIndex = bones.length;
  bone(`elbow_${frame.side < 0 ? "L" : "R"}`, frame.elbow);
}

function nearestOnSegment(p, a, b) {
  const axis = b.clone().sub(a);
  const t = p.clone().sub(a).dot(axis) / axis.lengthSq();
  return {
    t,
    distance: p.distanceTo(
      a.clone().addScaledVector(axis, T.MathUtils.clamp(t, 0, 1)),
    ),
  };
}

function decorate(g, { color, tissue = 1, fixedBone } = {}) {
  const positions = g.attributes.position;
  const colors = new Float32Array(positions.count * 3);
  const uvs = new Float32Array(positions.count * 2);
  const muscleDetails = new Float32Array(positions.count * 2);
  const muscleMasks = new Float32Array(positions.count * 3);
  const indices = new Uint16Array(positions.count * 4);
  const weights = new Float32Array(positions.count * 4);
  const point = new T.Vector3();
  const surfaceNormal = new T.Vector3();
  for (let i = 0; i < positions.count; i++) {
    point.fromBufferAttribute(positions, i);
    let group = "neutral";
    let c = color,
      fiber = 0,
      phase = 0,
      fascia = 0,
      surfaceTissue = tissue;
    const localPoint = point.clone().sub(restSled).applyQuaternion(inverseTilt);
    if (
      !color &&
      localPoint.y >= NECK_BASE_Y &&
      Math.abs(localPoint.x) < 0.115
    ) {
      c = skin;
      surfaceTissue = 0;
    }
    if (!c) {
      let best = Infinity,
        selected;
      for (const shape of shapes) {
        const d = distanceAt(point.x, point.y, point.z, shape);
        if (d < best) {
          best = d;
          selected = shape;
        }
      }
      group = selected.muscle;
      c = selected.color.clone();
      fiber = selected.fiber;
      // Fibre coordinates are baked in the muscle's own frame. They follow
      // its long axis and deform with the surface throughout the squat.
      const offset = point.clone().sub(selected.center);
      const e = selected.e;
      const transverse = e[0] * offset.x + e[1] * offset.y + e[2] * offset.z;
      const longitudinal = e[4] * offset.x + e[5] * offset.y + e[6] * offset.z;
      const depth = e[8] * offset.x + e[9] * offset.y + e[10] * offset.z;
      if (selected.fan) {
        // Pectorals and gluteals radiate from their insertion instead of using
        // parallel stripes. The phase stays attached to the skinned vertices.
        const anchorX =
          Math.sign(selected.center.x || 1) * selected.radii.x * 1.3;
        phase =
          Math.atan2(
            longitudinal - selected.radii.y * 0.55,
            Math.abs(transverse - anchorX),
          ) *
            100 +
          depth * 400;
      } else {
        phase =
          transverse * 1600 + depth * 1000 + Math.sin(longitudinal * 16) * 3;
      }
      const end = Math.abs(longitudinal) / selected.radii.y;
      const local = point.clone().sub(restSled).applyQuaternion(inverseTilt);
      const fusiform =
        selected.radii.y > selected.radii.x * 1.8 && selected.radii.y > 0.06;
      const limb = Math.abs(local.x) > 0.19 || local.y < -0.34;
      fascia =
        fusiform && limb ? selected.fiber * smooth(0.8, 1.06, end) * 0.65 : 0;
      fiber *= 1 - smooth(0.72, 1.05, end);
      // Soft, narrow ivory transitions make the muscle insertions readable.
      c.lerp(tendon, fascia);
      const variation = Math.sin(longitudinal * 64 + transverse * 28) * 0.025;
      c.multiplyScalar(1 + variation);
      surfaceNormal
        .fromBufferAttribute(g.attributes.normal, i)
        .applyQuaternion(inverseTilt);
      const anterior =
        smooth(0.4, 0.85, surfaceNormal.z) * smooth(0.14, 0.19, local.z);
      if (
        Math.abs(local.x) < 0.17 &&
        local.y > -0.33 &&
        local.y < 0.24 &&
        anterior > 0
      ) {
        // Continuous colour masks keep narrow fascia clean at every voxel
        // resolution. They add no floating tubes or disconnected white chips.
        const midline =
          (1 - smooth(0.002, 0.005, Math.abs(local.x))) *
          smooth(-0.23, -0.17, local.y);
        const absBand = Math.min(
          ...[0.073, 0.015, -0.043, -0.102].map((y) => Math.abs(local.y - y)),
        );
        const intersections =
          (1 - smooth(0.001, 0.004, absBand)) *
          (1 - smooth(0.058, 0.076, Math.abs(local.x)));
        const inguinalY = -0.325 + Math.abs(local.x) * 0.82;
        const inguinal =
          (1 - smooth(0.003, 0.009, Math.abs(local.y - inguinalY))) *
          smooth(0.014, 0.04, Math.abs(local.x));
        const fasciaMask =
          Math.max(midline, intersections * 0.75, inguinal * 0.9) * anterior;
        c.lerp(tendon, fasciaMask);
        fiber *= 1 - fasciaMask;
      }
      // Paint the covered region as well as adding the fitted garment shell.
      // This keeps the crotch opaque even where skinning compresses the fabric.
      if (insideBriefs(local)) {
        c = briefColor(local);
        fiber = 0;
        phase = 0;
        surfaceTissue = 0;
      }
    }
    // Fade tissue colour and fibres before fading the anatomy mask. Both
    // sides of the welded neck then meet in the same neutral material.
    if (!color && localPoint.y > 0.29 && Math.abs(localPoint.x) < 0.115) {
      const fade = smooth(0.29, 0.317, localPoint.y);
      c = c.clone().lerp(skin, fade);
      fiber *= 1 - fade;
      surfaceTissue = Math.min(
        surfaceTissue,
        1 - smooth(0.318, NECK_BASE_Y, localPoint.y),
      );
    }
    // Long, fine fibres follow each muscle's principal axis. Their restrained
    // contrast reads as tissue instead of painted stripes at normal zoom.
    const shade = 1 - fiber * 0.035;
    const squat =
      group === "quadriceps" || group === "gluteus"
        ? 1
        : group === "adductors"
          ? 0.5
          : 0;
    const bench =
      group === "pectoralis"
        ? 1
        : ["triceps", "deltoidAnterior"].includes(group)
          ? 0.5
          : 0;
    muscleMasks.set(surfaceTissue > 0 ? [squat, bench, 0] : [0, 0, 0], i * 3);
    colors.set([c.r * shade, c.g * shade, c.b * shade], i * 3);
    uvs.set([0, surfaceTissue], i * 2);
    muscleDetails.set([phase, fiber], i * 2);

    const influences = new Map();
    if (fixedBone !== undefined) {
      influences.set(fixedBone, 1);
    } else {
      const legIndex = point.x < 0 ? 0 : 1;
      const leg = legs[legIndex];
      const thigh = nearestOnSegment(point, leg.hip, leg.knee);
      const shin = nearestOnSegment(point, leg.knee, leg.ankle);
      const thighBone = 1 + legIndex * 3;
      if (thigh.t < 0.06 && shin.t < 0) {
        influences.set(0, 1);
      } else if (thigh.distance <= shin.distance) {
        const root = 1 - smooth(0.02, 0.23, thigh.t);
        const knee = smooth(0.83, 1.12, thigh.t);
        influences.set(0, root);
        influences.set(thighBone, (1 - root) * (1 - knee));
        influences.set(thighBone + 1, (1 - root) * knee);
      } else {
        const knee = smooth(-0.12, 0.17, shin.t);
        const foot = smooth(0.86, 1.03, shin.t);
        influences.set(thighBone, 1 - knee);
        influences.set(thighBone + 1, knee * (1 - foot));
        influences.set(thighBone + 2, knee * foot);
      }
      // The thorax and pelvis remain anchored to the central anatomical root.
      const local = point
        .clone()
        .sub(restSled)
        .applyQuaternion(tilt.clone().invert());
      if (local.y > -0.225) {
        influences.clear();
        influences.set(0, 1);
      }
    }
    let slot = 0;
    for (const [index, weight] of influences) {
      indices[i * 4 + slot] = index;
      weights[i * 4 + slot] = weight;
      slot++;
    }
  }
  g.setAttribute("_exerciseMuscles", new T.BufferAttribute(muscleMasks, 3));
  g.setAttribute("color", new T.BufferAttribute(colors, 3));
  g.setAttribute("uv", new T.BufferAttribute(uvs, 2));
  g.setAttribute("uv1", new T.BufferAttribute(muscleDetails, 2));
  g.setAttribute("skinIndex", new T.BufferAttribute(indices, 4));
  g.setAttribute("skinWeight", new T.BufferAttribute(weights, 4));
  return g;
}

// Clip the existing sculpt into a fitted shell. Clipped boundaries keep the
// waistband and leg openings clean, and matching skin weights prevent sliding.
function surfacePatch(geometry, constraints, offset) {
  const positions = [],
    normals = [];
  const source = geometry.attributes;
  const count = geometry.index?.count ?? source.position.count;
  for (let triangle = 0; triangle < count; triangle += 3) {
    let polygon = [0, 1, 2].map((corner) => {
      const vertex = geometry.index
        ? geometry.index.getX(triangle + corner)
        : triangle + corner;
      const p = new T.Vector3().fromBufferAttribute(source.position, vertex);
      const n = new T.Vector3().fromBufferAttribute(source.normal, vertex);
      return {
        p,
        n,
        local: p.clone().sub(restSled).applyQuaternion(inverseTilt),
      };
    });
    for (const constraint of constraints) {
      const clipped = [];
      for (let index = 0; index < polygon.length; index++) {
        const a = polygon[index],
          b = polygon[(index + 1) % polygon.length];
        const da = constraint(a.local),
          db = constraint(b.local);
        if (da >= 0) clipped.push(a);
        if (da >= 0 !== db >= 0) {
          const t = da / (da - db);
          clipped.push({
            p: a.p.clone().lerp(b.p, t),
            n: a.n.clone().lerp(b.n, t).normalize(),
            local: a.local.clone().lerp(b.local, t),
          });
        }
      }
      polygon = clipped;
      if (!polygon.length) break;
    }
    for (let index = 1; index < polygon.length - 1; index++) {
      for (const vertex of [polygon[0], polygon[index], polygon[index + 1]]) {
        positions.push(
          ...vertex.p.clone().addScaledVector(vertex.n, offset).toArray(),
        );
        normals.push(...vertex.n.toArray());
      }
    }
  }
  const patch = new T.BufferGeometry();
  patch.setAttribute("position", new T.Float32BufferAttribute(positions, 3));
  patch.setAttribute("normal", new T.Float32BufferAttribute(normals, 3));
  return mergeVertices(patch, 0.00001);
}

const briefs = decorate(
  surfacePatch(
    bodyGeometry,
    [
      (p) => briefTop - p.y,
      (p) => p.y - briefHem(p),
      (p) => 0.195 - Math.abs(p.x),
    ],
    0.004,
  ),
  { color: fabric, tissue: 0 },
);
const garmentPoint = new T.Vector3();
for (let vertex = 0; vertex < briefs.attributes.position.count; vertex++) {
  garmentPoint
    .fromBufferAttribute(briefs.attributes.position, vertex)
    .sub(restSled)
    .applyQuaternion(inverseTilt);
  const c = briefColor(garmentPoint);
  briefs.attributes.color.setXYZ(vertex, c.r, c.g, c.b);
}

const trimmedBody = surfacePatch(
  bodyGeometry,
  [(p) => Math.max(NECK_BASE_Y - p.y, Math.abs(p.x) - 0.115)],
  0,
);
const trimmedHead = surfacePatch(headGeometry, [(p) => p.y - HEAD_JOIN_Y], 0);
const joinedAnatomy = stitchNeck(trimmedBody, trimmedHead, {
  origin: restSled,
  inverseTilt,
  tilt,
  bottomY: NECK_BASE_Y,
  topY: HEAD_JOIN_Y,
});
const pieces = [
  decorate(joinedAnatomy),
  briefs,
  ...handGeometries.map((g) =>
    decorate(g, { color: skin, tissue: 0, fixedBone: 0 }),
  ),
];
function detail(g, center, quaternion, options) {
  if (!g.index) g = mergeVertices(g, 0.00001);
  g.applyQuaternion(quaternion);
  g.translate(center.x, center.y, center.z);
  pieces.push(decorate(g, options));
}

// Original short-cropped scalp: a fitted surface, never a floating head cap.
const scalp = surfacePatch(
  headGeometry,
  [(p) => p.y - (0.529 + 0.012 * smooth(0.1, 0.19, p.z))],
  0.0009,
);
pieces.push(
  decorate(scalp, { color: new T.Color("#484944"), tissue: 0, fixedBone: 0 }),
);
for (const side of [-1, 1]) {
  detail(
    new T.SphereGeometry(1, 24, 12).scale(0.022, 0.0028, 0.0028),
    toSledWorld(vec([side * 0.031, 0.491, 0.192])),
    tilt,
    { color: new T.Color("#62615a"), tissue: 0, fixedBone: 0 },
  );
}

// Small eyes sit inside the recessed sockets. Anatomical presentation uses
// a restrained neutral iris rather than cartoon pupils or an external face.
for (const side of [-1, 1]) {
  for (const [r, z, c] of [
    [0.009, 0.186, "#bbbcb7"],
    [0.0042, 0.194, "#777c77"],
    [0.0018, 0.195, "#343a38"],
  ]) {
    detail(
      new T.SphereGeometry(1, 24, 16).scale(r, r * 0.78, r * 0.42),
      toSledWorld(vec([side * 0.031, 0.479, z])),
      tilt,
      { color: new T.Color(c), tissue: 0, fixedBone: 0 },
    );
  }
}

// Rounded footwear follows the platform angle. Bevelled outlines replace the
// old stacks of boxes without changing the position of the planted ankles.
const footRotation = new T.Quaternion().setFromAxisAngle(
  new T.Vector3(1, 0, 0),
  FOOT_ANGLE,
);
function shoeOutline(width, length) {
  const s = new T.Shape();
  s.moveTo(-width * 0.36, -length * 0.4);
  s.bezierCurveTo(
    -width * 0.6,
    -length * 0.15,
    -width * 0.58,
    length * 0.35,
    -width * 0.3,
    length * 0.48,
  );
  s.bezierCurveTo(
    -width * 0.12,
    length * 0.57,
    width * 0.35,
    length * 0.53,
    width * 0.45,
    length * 0.35,
  );
  s.bezierCurveTo(
    width * 0.54,
    length * 0.15,
    width * 0.42,
    -length * 0.27,
    width * 0.29,
    -length * 0.4,
  );
  s.quadraticCurveTo(0, -length * 0.53, -width * 0.36, -length * 0.4);
  return s;
}
for (let index = 0; index < legs.length; index++) {
  const { ankle } = legs[index];
  const fixedBone = 3 + index * 3;
  for (const [width, length, depth, y, color] of [
    [0.106, 0.24, 0.014, -0.027, "#20252a"],
    [0.098, 0.22, 0.033, -0.002, "#bfc3c4"],
  ]) {
    const g = new T.ExtrudeGeometry(shoeOutline(width, length), {
      depth,
      bevelEnabled: true,
      bevelSegments: 4,
      steps: 1,
      bevelSize: 0.008,
      bevelThickness: 0.007,
      curveSegments: 14,
    });
    g.rotateX(Math.PI / 2);
    const center = new T.Vector3(0, y, 0.045)
      .applyQuaternion(footRotation)
      .add(ankle);
    detail(g, center, footRotation, {
      color: new T.Color(color),
      tissue: 0,
      fixedBone,
    });
  }
  detail(
    new T.SphereGeometry(1, 24, 16).scale(0.043, 0.024, 0.052),
    new T.Vector3(0, 0.014, -0.006).applyQuaternion(footRotation).add(ankle),
    footRotation,
    { color: new T.Color("#555b60"), tissue: 0, fixedBone },
  );
  for (let j = 0; j < 5; j++) {
    const g = new T.CapsuleGeometry(0.002, 0.053, 3, 8);
    g.rotateZ(Math.PI / 2);
    detail(
      g,
      new T.Vector3(0, 0.034 - j * 0.002, 0.025 + j * 0.016)
        .applyQuaternion(footRotation)
        .add(ankle),
      footRotation,
      { color: new T.Color("#e0dfd8"), tissue: 0, fixedBone },
    );
  }
}

const merged = mergeGeometries(pieces);
// Smooth shoulder/elbow weights are authored in the neutral pose. The head,
// thorax, pelvis and opposite limb cannot inherit another limb's transform.
const pos = merged.attributes.position,
  si = merged.attributes.skinIndex,
  sw = merged.attributes.skinWeight;
const probe = new T.Vector3();
for (let i = 0; i < pos.count; i++) {
  probe.fromBufferAttribute(pos, i);
  const local = probe.clone().sub(restSled);
  if (Math.abs(local.x) < 0.178 || local.y < -0.42 || local.y > 0.3) continue;
  const frame = armFrames[local.x < 0 ? 0 : 1];
  const a = nearestOnSegment(probe, frame.shoulder, frame.elbow),
    b = nearestOnSegment(probe, frame.elbow, frame.wrist);
  if (Math.min(a.distance, b.distance) > 0.1) continue;
  const shoulderBlend = smooth(0.178, 0.244, Math.abs(local.x));
  let weights;
  if (a.distance < b.distance) {
    const bend = smooth(0.8, 1.1, a.t);
    weights = [
      1 - shoulderBlend,
      shoulderBlend * (1 - bend),
      shoulderBlend * bend,
      0,
    ];
  } else {
    const bend = smooth(-0.1, 0.2, b.t),
      hand = smooth(0.85, 1.03, b.t);
    weights = [
      1 - shoulderBlend,
      shoulderBlend * (1 - bend),
      shoulderBlend * bend * (1 - hand),
      shoulderBlend * bend * hand,
    ];
  }
  const support =
    (1 - smooth(0.03, 0.085, probe.distanceTo(frame.elbow))) * 0.9;
  if (support > 0) {
    const limb = weights[1] + weights[2];
    weights = [
      weights[0],
      weights[1] * (1 - support),
      weights[2] * (1 - support),
      limb * support,
    ];
    si.setXYZW(i, 0, frame.index, frame.index + 1, frame.elbowIndex);
  } else si.setXYZW(i, 0, frame.index, frame.index + 1, frame.index + 2);
  sw.setXYZW(i, ...weights);
}
// Normalised byte attributes retain colour/skin fidelity without shipping
// twelve bytes for each categorical muscle mask and weight vector.
for (const name of ["color", "_exerciseMuscles", "skinWeight"]) {
  const a = merged.getAttribute(name),
    values = new Uint8Array(a.array.length);
  for (let i = 0; i < values.length; i++)
    values[i] = Math.round(T.MathUtils.clamp(a.array[i], 0, 1) * 255);
  merged.setAttribute(name, new T.BufferAttribute(values, a.itemSize, true));
}
const material = new T.MeshStandardMaterial({
  color: "#ffffff",
  vertexColors: true,
  roughness: 0.72,
  metalness: 0,
});
material.name = "AnatomicalTissue";
const mesh = new T.SkinnedMesh(merged, material);
mesh.name = "AnatomicalLifter";
const scene = new T.Group();
scene.name = "AnatomicalLifterRig";
scene.userData = {
  title: "Trainvy Atelier anatomical athlete",
  version: 2,
  units: "metres",
  geometry: "Original procedural SDF sculpt; no external meshes or textures",
  muscles: {
    squat: { primary: ["quadriceps", "gluteus"], secondary: ["adductors"] },
    "bench-press": {
      primary: ["pectoralis"],
      secondary: ["triceps", "deltoidAnterior"],
    },
  },
};
scene.add(mesh, ...bones);
scene.updateMatrixWorld(true);
mesh.bind(new T.Skeleton(bones));
mesh.normalizeSkinWeights();
const exporter = new GLTFExporter();
const data = await exporter.parseAsync(scene, { binary: true });
const output = new URL("../.tmp/anatomy-qa/scaffold.glb", import.meta.url);
await mkdir(new URL(".", output), { recursive: true });
await writeFile(output, Buffer.from(data));
console.log(
  `Anatomical lifter: ${merged.attributes.position.count.toLocaleString()} vertices, ${(merged.index?.count ?? merged.attributes.position.count) / 3} triangles, ${(data.byteLength / 1048576).toFixed(2)} MiB, ${((performance.now() - startTime) / 1000).toFixed(1)}s`,
);
