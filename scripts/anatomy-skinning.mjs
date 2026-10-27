import * as T from "three";

const smooth = (a, b, t) => T.MathUtils.smoothstep(t, a, b);
export function nearest(p, a, b) {
  const d = b.clone().sub(a);
  const t = p.clone().sub(a).dot(d) / d.lengthSq();
  return {
    t,
    distance: p.distanceTo(
      a.clone().addScaledVector(d, T.MathUtils.clamp(t, 0, 1)),
    ),
  };
}

export function addJointSupports(bones) {
  for (const suffix of ["L", "R"]) {
    for (const [name, start, end, t] of [
      ["hip", "thigh", "thigh", 0],
      ["shoulder", "upperArm", "upperArm", 0],
      ["wrist", "forearm", "hand", 0.72],
    ]) {
      if (bones.some((b) => b.name === `${name}_${suffix}`)) continue;
      const bone = new T.Bone();
      bone.name = `${name}_${suffix}`;
      bone.position
        .copy(bones.find((b) => b.name === `${start}_${suffix}`).position)
        .lerp(bones.find((b) => b.name === `${end}_${suffix}`).position, t);
      bones.push(bone);
    }
  }
}

/** Shared bind-pose weights for imported muscles and recessed connective tissue. */
export function skinAnatomy(g, name, bones, recovered = false) {
  const n = name.toLowerCase().replaceAll("_", " ");
  g.computeBoundingBox();
  const namedArm =
    g.boundingBox.max.y > 0.8 &&
    /biceps brachii|triceps brachii|brachialis|coracobrachialis|deltoid|brachioradialis|pronator|supinator|carpi|digitorum|palmaris|bone (humerus|radius|ulna)/.test(
      n,
    );
  const legStructure =
    /femor|vastus|adductor|gluteus|semitendin|semimembr|sartorius|gracilis|tensor.fasciae|iliacus|psoas|piriformis|obturator|bone.hip|sacrum|coccyx|recoveredloweratlas/.test(
      n,
    );
  const boneIndex = (name) => bones.findIndex((b) => b.name === name);
  const arms = ["L", "R"].map((s) => ({
    upper: boneIndex(`upperArm_${s}`),
    fore: boneIndex(`forearm_${s}`),
    hand: boneIndex(`hand_${s}`),
    elbow: boneIndex(`elbow_${s}`),
    shoulderSupport: boneIndex(`shoulder_${s}`),
    wristSupport: boneIndex(`wrist_${s}`),
    shoulder: bones[boneIndex(`upperArm_${s}`)].position,
    elbowPoint: bones[boneIndex(`forearm_${s}`)].position,
    wrist: bones[boneIndex(`hand_${s}`)].position,
  }));
  const index = new Uint16Array(g.attributes.position.count * 4);
  const weight = new Float32Array(index.length);
  const p = new T.Vector3();
  const handColour = new T.Color("#b8b4ac");
  const originalIndices = g.getAttribute("skinIndex");
  const originalWeights = g.getAttribute("skinWeight");
  const armIds = new Set(
    bones.flatMap((b, i) =>
      /^(upperArm|forearm|hand|elbow|shoulder|wrist)_/.test(b.name) ? [i] : [],
    ),
  );
  for (let i = 0; i < g.attributes.position.count; i++) {
    p.fromBufferAttribute(g.attributes.position, i);
    const local = p.clone().sub(bones[0].position);
    const f = arms[p.x < 0 ? 0 : 1];
    const inheritedArm =
      recovered &&
      originalIndices &&
      originalWeights &&
      [0, 1, 2, 3].some(
        (j) =>
          originalWeights.getComponent(i, j) > 0 &&
          armIds.has(originalIndices.getComponent(i, j)),
      );
    const recoveredBlend =
      recovered && originalIndices && originalWeights
        ? [0, 1, 2, 3].reduce((sum, j) => {
            const id = originalIndices.getComponent(i, j);
            const share =
              id === f.shoulderSupport ? 0.5 : armIds.has(id) ? 1 : 0;
            return sum + share * originalWeights.getComponent(i, j);
          }, 0)
        : null;
    const armStructure = namedArm || inheritedArm;
    let ids = [0, 0, 0, 0],
      w = [1, 0, 0, 0];
    // Closed hands are authored around the bar. Muscle or forearm weights on
    // their fingertips would deform the grip even with a stationary hand bone.
    const c = g.getAttribute("color");
    const hand =
      recovered &&
      g.attributes.uv.getY(i) < 0.1 &&
      p.y > 0.75 &&
      p.y < 0.89 &&
      Math.abs(p.x) > 0.255 &&
      Math.abs(c.getX(i) - handColour.r) < 0.008 &&
      Math.abs(c.getY(i) - handColour.g) < 0.008 &&
      Math.abs(c.getZ(i) - handColour.b) < 0.008;
    if (hand) {
      ids = [f.hand, 0, 0, 0];
    } else if (recovered && p.y < 0.16 && g.attributes.uv.getY(i) < 0.1) {
      ids = [p.x < 0 ? 3 : 6, 0, 0, 0];
    } else {
      if (local.y < -0.225 && name !== "Trainvy_FoundationTorso") {
        const id = p.x < 0 ? 1 : 4;
        const a = nearest(p, bones[id].position, bones[id + 1].position);
        const b = nearest(p, bones[id + 1].position, bones[id + 2].position);
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
        !legStructure &&
        (armStructure ||
          (Math.abs(local.x) > 0.178 && local.y > -0.42 && local.y < 0.3))
      ) {
        const a = nearest(p, f.shoulder, f.elbowPoint),
          b = nearest(p, f.elbowPoint, f.wrist);
        if (armStructure || Math.min(a.distance, b.distance) < 0.12) {
          const blend =
            recoveredBlend ??
            (armStructure || name.startsWith("Trainvy_Foundation")
              ? smooth(-0.12, 0.4, a.t)
              : smooth(0.178, 0.244, Math.abs(local.x)));
          if (a.distance < b.distance) {
            const bend = smooth(0.8, 1.1, a.t);
            w = [1 - blend, blend * (1 - bend), blend * bend, 0];
            ids = [0, f.upper, f.fore, f.hand];
            if (a.t < 0.5 && w[0] > 0) {
              w = [(1 - blend) ** 2, blend ** 2, 0, 2 * blend * (1 - blend)];
              ids[3] = f.shoulderSupport;
            }
          } else {
            const bend = smooth(-0.1, 0.2, b.t);
            const twist = smooth(0.28, 0.82, b.t);
            const grip = smooth(0.9, 1.01, b.t);
            ids = [f.upper, f.fore, f.wristSupport, f.hand];
            w = [
              1 - bend,
              bend * (1 - twist),
              bend * twist * (1 - grip),
              bend * twist * grip,
            ];
          }
          const support =
            (1 - smooth(0.025, 0.075, p.distanceTo(f.elbowPoint))) * 0.9;
          if (support > 0) {
            // At the elbow there is no distal twist yet; retain all weights
            // when reserving the fourth slot for the volume support.
            const upper = a.distance < b.distance ? w[1] : w[0];
            const fore = a.distance < b.distance ? w[2] : w[1] + w[2] + w[3];
            const root = a.distance < b.distance ? w[0] : 0;
            ids = [0, f.upper, f.fore, f.elbow];
            w = [
              root,
              upper * (1 - support),
              fore * (1 - support),
              (upper + fore) * support,
            ];
          }
        }
      }
    }
    index.set(ids, i * 4);
    weight.set(w, i * 4);
  }
  g.setAttribute("skinIndex", new T.BufferAttribute(index, 4));
  g.setAttribute("skinWeight", new T.BufferAttribute(weight, 4));
}
