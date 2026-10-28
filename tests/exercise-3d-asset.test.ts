// @vitest-environment node
import { readFile } from "node:fs/promises";
import { beforeAll, describe, expect, it } from "vitest";
import {
  Bone,
  Color,
  DoubleSide,
  Mesh,
  MeshBasicMaterial,
  Quaternion,
  Raycaster,
  SkinnedMesh,
  Vector3,
} from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "meshoptimizer";
import { createPoseDriver } from "../app/_components/exercise-3d/kinematics";
import { EXERCISE_ANIMATIONS } from "../app/_components/exercise-3d/exercises";
import { createTissueMaterial } from "../app/_components/exercise-3d/anatomy-material";
import { createPecDeckMuscleMask } from "../app/_components/exercise-3d/pec-deck-muscles";
import { createSmithBenchMuscleMask } from "../app/_components/exercise-3d/smith-bench-muscles";
import { createMachineChestPressMuscleMask } from "../app/_components/exercise-3d/machine-chest-press-muscles";
import { createSmithSquatMuscleMask } from "../app/_components/exercise-3d/smith-squat-muscles";

let mesh: SkinnedMesh;
let apply: ReturnType<typeof createPoseDriver>;
let bindPositions: Map<string, Vector3>;
beforeAll(async () => {
  const bytes = await readFile(
    new URL(
      "../public/models/exercise-3d/trainvy-athlete.glb",
      import.meta.url,
    ),
  );
  const { scene } = await new GLTFLoader()
    .setMeshoptDecoder(MeshoptDecoder)
    .parseAsync(
      bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
      "",
    );
  const bones = new Map<string, Bone>();
  scene.traverse((object) => {
    if (object instanceof Bone) bones.set(object.name, object);
    if (object instanceof SkinnedMesh) mesh = object;
  });
  bindPositions = new Map(
    [...bones].map(([name, bone]) => [name, bone.position.clone()]),
  );
  apply = createPoseDriver(bones);
});

describe("Trainvy anatomical athlete", () => {

  it("maps the smith squat explicitly with quadriceps and glutes as primary and adductors as secondary", () => {
    const geometry = mesh.geometry;
    const mask = createSmithSquatMuscleMask(geometry);
    const positions = geometry.getAttribute("position");
    let primary = 0,
      secondary = 0,
      neutralUpper = 0;
    for (let i = 0; i < mask.count; i++) {
      const val = mask.getX(i);
      if (val > 0.9) primary++;
      else if (val > 0.1) secondary++;
      if (positions.getY(i) > 1.05) {
        expect(val).toBe(0);
        neutralUpper++;
      }
    }
    expect(primary).toBeGreaterThan(3000);
    expect(secondary).toBeGreaterThan(200);
    expect(neutralUpper).toBeGreaterThan(1000);
    expect(EXERCISE_ANIMATIONS["smith-squat"].muscles.primary).toEqual([
      "Quadríceps",
      "Glúteos (ênfase no máximo)",
    ]);
    expect(EXERCISE_ANIMATIONS["smith-squat"].muscles.secondary).toEqual([
      "Adutores",
    ]);
  });

  it("maps the pec deck explicitly without inheriting the press triceps map or changing the cached asset", () => {
    const geometry = mesh.geometry;
    const existing = geometry.getAttribute("_exercisemuscles");
    const before = Array.from(existing.array);
    const mask = createPecDeckMuscleMask(geometry);
    const positions = geometry.getAttribute("position");
    let primary = 0,
      secondary = 0,
      excludedPress = 0;
    for (let i = 0; i < mask.count; i++) {
      if (mask.getX(i) > 0.9) primary++;
      else if (mask.getX(i) > 0.1) secondary++;
      if (
        existing.getY(i) > 0.15 &&
        existing.getY(i) < 0.72 &&
        mask.getX(i) === 0
      )
        excludedPress++;
      if (positions.getY(i) < 1 || positions.getY(i) > 1.49)
        expect(mask.getX(i)).toBe(0);
      if (mask.getX(i) > 0 && mask.getX(i) < 0.9) {
        expect(positions.getY(i)).toBeGreaterThan(1.24);
        expect(positions.getZ(i)).toBeGreaterThan(0.145);
      }
    }
    expect(primary).toBeGreaterThan(1000);
    expect(secondary).toBeGreaterThan(100);
    expect(excludedPress).toBeGreaterThan(1000);
    expect(Array.from(existing.array)).toEqual(before);
  });

  it("maps the Smith bench press explicitly with pectoralis major as primary and triceps/anterior deltoid as secondary", () => {
    const geometry = mesh.geometry;
    const mask = createSmithBenchMuscleMask(geometry);
    const positions = geometry.getAttribute("position");
    let primary = 0,
      secondary = 0;
    for (let i = 0; i < mask.count; i++) {
      if (mask.getX(i) > 0.9) primary++;
      else if (mask.getX(i) > 0.1) secondary++;

      if (positions.getY(i) > 1.49 || positions.getY(i) < 0.8) {
        expect(mask.getX(i)).toBe(0);
      }
    }
    expect(primary).toBe(2460);
    expect(secondary).toBe(4488);
    expect(EXERCISE_ANIMATIONS["smith-bench-press"].muscles.primary).toEqual([
      "Peitoral maior (porções esternocostal e clavicular)",
    ]);
    expect(EXERCISE_ANIMATIONS["smith-bench-press"].muscles.secondary).toEqual([
      "Tríceps braquial",
      "Deltoide anterior",
    ]);
  });

  it("resets the vertical pec-deck hand grip when switching to a barbell exercise", () => {
    const bones = new Map(mesh.skeleton.bones.map((b) => [b.name, b]));
    const pose = apply("pec-deck", 0.5);
    for (const limb of pose.limbs) {
      const hand = bones.get(`hand_${limb.side < 0 ? "L" : "R"}`);
      expect(hand).toBeDefined();
      expect(hand!.quaternion.angleTo(limb.handRotation)).toBeLessThan(1e-6);
    }
    apply("bench-press", 0.5);
    for (const suffix of ["L", "R"])
      expect(
        bones.get(`hand_${suffix}`)!.quaternion.angleTo(new Quaternion()),
      ).toBe(0);
  });
  it("keeps the declined knees in their anatomical bend plane and rotates the actual foot bones with the shins", () => {
    const bones = new Map(mesh.skeleton.bones.map((b) => [b.name, b]));
    for (const depth of [0, 0.5, 1]) {
      const pose = apply("decline-bench-press", depth);
      for (const limb of pose.limbs) {
        const suffix = limb.side < 0 ? "L" : "R";
        const hip = bindPositions.get(`thigh_${suffix}`)!;
        const knee = bindPositions.get(`shin_${suffix}`)!;
        const ankle = bindPositions.get(`foot_${suffix}`)!;
        const restNormal = knee
          .clone()
          .sub(hip)
          .cross(ankle.clone().sub(knee))
          .normalize();
        const posedNormal = limb.knee
          .clone()
          .sub(limb.hip)
          .cross(limb.ankle.clone().sub(limb.knee))
          .normalize();
        for (const segment of ["thigh", "shin"]) {
          expect(
            restNormal
              .clone()
              .applyQuaternion(bones.get(`${segment}_${suffix}`)!.quaternion)
              .dot(posedNormal),
          ).toBeCloseTo(1, 6);
        }
        const foot = bones.get(`foot_${suffix}`)!;
        expect(foot.quaternion.angleTo(limb.footRotation)).toBeLessThan(1e-6);
        expect(foot.quaternion.angleTo(new Quaternion())).toBeGreaterThan(0.2);
        expect(foot.position.distanceTo(limb.ankle)).toBeLessThan(1e-6);
      }
    }
    // Switching back to any planted-foot exercise must clear the declined pose.
    for (const exercise of [
      "squat",
      "smith-squat",
      "bench-press",
      "incline-dumbbell-press",
      "flat-dumbbell-press",
      "incline-bench-press",
      "smith-bench-press",
    ] as const) {
      apply(exercise, 0.5);
      for (const suffix of ["L", "R"])
        expect(
          bones.get(`foot_${suffix}`)!.quaternion.angleTo(new Quaternion()),
        ).toBe(0);
    }
  });
  it("has a complete neutral-pose rig, joint supports and normalised weights", () => {
    expect(mesh.skeleton.bones).toHaveLength(21);
    expect(mesh.skeleton.bones.map((b) => b.name)).toContain("elbow_L");
    expect(mesh.skeleton.bones.map((b) => b.name)).toContain("hip_L");
    expect(mesh.skeleton.bones.map((b) => b.name)).toContain("shoulder_L");
    expect(mesh.skeleton.bones.map((b) => b.name)).toContain("wrist_L");
    const weights = mesh.geometry.getAttribute("skinWeight");
    let maximumError = 0;
    for (let i = 0; i < weights.count; i += 19)
      maximumError = Math.max(
        maximumError,
        Math.abs(
          1 -
            weights.getX(i) -
            weights.getY(i) -
            weights.getZ(i) -
            weights.getW(i),
        ),
      );
    expect(maximumError).toBeLessThan(0.005);
  });
  it("uses independent, nonempty primary/secondary maps and leaves the face neutral", () => {
    const masks = mesh.geometry.getAttribute("_exercisemuscles"),
      positions = mesh.geometry.getAttribute("position");
    let squat = 0,
      bench = 0,
      independent = 0,
      colouredFace = 0;
    for (let i = 0; i < masks.count; i++) {
      if (masks.getX(i) > 0.2) squat++;
      if (masks.getY(i) > 0.2) bench++;
      if (masks.getX(i) !== masks.getY(i)) independent++;
      if (positions.getY(i) > 1.49 && (masks.getX(i) > 0 || masks.getY(i) > 0))
        colouredFace++;
    }
    expect(squat).toBeGreaterThan(5000);
    expect(bench).toBeGreaterThan(5000);
    expect(independent).toBeGreaterThan(10000);
    expect(colouredFace).toBe(0);
    expect(EXERCISE_ANIMATIONS.squat.muscles.primary).not.toEqual(
      EXERCISE_ANIMATIONS["bench-press"].muscles.primary,
    );
  });
  it.each([
    "squat",
    "smith-squat",
    "bench-press",
    "incline-dumbbell-press",
    "flat-dumbbell-press",
    "incline-bench-press",
    "decline-bench-press",
    "smith-bench-press",
  ] as const)(
    "keeps both arm segments in one bend plane without roll flips in %s",
    (exercise) => {
      const bones = new Map(mesh.skeleton.bones.map((b) => [b.name, b]));
      let maximumPlaneError = 0,
        maximumStepAngle = 0;
      const previous = new Map<string, Quaternion>();
      for (let step = 0; step <= 200; step++) {
        apply(exercise, step / 200);
        for (const suffix of ["L", "R"]) {
          const upper = `upperArm_${suffix}`,
            fore = `forearm_${suffix}`,
            hand = `hand_${suffix}`;
          const anatomicalNormal = bindPositions
            .get(fore)!
            .clone()
            .sub(bindPositions.get(upper)!)
            .cross(new Vector3(0, 0, 1))
            .normalize();
          const posedNormal = bones
            .get(fore)!
            .position.clone()
            .sub(bones.get(upper)!.position)
            .cross(
              bones.get(hand)!.position.clone().sub(bones.get(fore)!.position),
            )
            .normalize();
          for (const name of [upper, fore]) {
            const direction = (
              name === upper
                ? bindPositions.get(fore)!
                : bindPositions.get(hand)!
            )
              .clone()
              .sub(bindPositions.get(name)!)
              .normalize();
            const normal = anatomicalNormal
              .clone()
              .addScaledVector(direction, -anatomicalNormal.dot(direction))
              .normalize();
            const q = bones.get(name)!.quaternion;
            maximumPlaneError = Math.max(
              maximumPlaneError,
              normal.clone().applyQuaternion(q).distanceTo(posedNormal),
            );
            if (previous.has(name))
              maximumStepAngle = Math.max(
                maximumStepAngle,
                previous.get(name)!.angleTo(q),
              );
            previous.set(name, q.clone());
          }
        }
      }
      expect(maximumPlaneError).toBeLessThan(0.000001);
      expect(maximumStepAngle).toBeLessThan(0.04);
    },
  );
  it("exposes primary gluteal surfaces on both sides and keeps them neutral in bench press", () => {
    const p = mesh.geometry.attributes.position;
    const m = mesh.geometry.getAttribute("_exercisemuscles");
    const tissue = mesh.geometry.attributes.uv;
    for (const side of [-1, 1]) {
      let gluteal = 0;
      for (let i = 0; i < p.count; i++) {
        if (
          p.getX(i) * side > 0.035 &&
          p.getX(i) * side < 0.22 &&
          p.getY(i) > 0.8 &&
          p.getY(i) < 0.965 &&
          p.getZ(i) < 0.065 &&
          m.getX(i) > 0.9
        ) {
          gluteal++;
          expect(m.getY(i)).toBe(0);
          expect(tissue.getY(i)).toBe(1);
        }
      }
      expect(gluteal).toBeGreaterThan(300);
    }
  });
  it("uses neutral anatomical tissue at the nape and lower abdomen", () => {
    const surface = new Mesh(
      mesh.geometry,
      new MeshBasicMaterial({ side: DoubleSide }),
    );
    surface.updateMatrixWorld(true);
    const tissue = mesh.geometry.attributes.uv;
    const masks = mesh.geometry.getAttribute("_exercisemuscles");
    let muscularNape = 0;
    for (const y of [1.41, 1.43, 1.45]) {
      for (const x of [-0.018, 0, 0.018]) {
        const hits = new Raycaster(
          new Vector3(x, y, -0.5),
          new Vector3(0, 0, 1),
        ).intersectObject(surface);
        expect(hits.length).toBeGreaterThan(0);
        expect(hits[0].point.z).toBeLessThan(0.13);
        if (
          [hits[0].face!.a, hits[0].face!.b, hits[0].face!.c].every(
            (id) => tissue.getY(id) > 0.9,
          )
        )
          muscularNape++;
        for (const id of [hits[0].face!.a, hits[0].face!.b, hits[0].face!.c]) {
          expect(masks.getX(id)).toBe(0);
          expect(masks.getY(id)).toBe(0);
        }
      }
    }
    expect(muscularNape).toBeGreaterThanOrEqual(8);
    for (const y of [0.89, 0.94, 0.975]) {
      for (const x of [-0.07, 0, 0.07]) {
        const hits = new Raycaster(
          new Vector3(x, y, 0.5),
          new Vector3(0, 0, -1),
        ).intersectObject(surface);
        expect(hits.length).toBeGreaterThan(0);
      }
    }
    surface.material.dispose();
  });
  it("joins the head cut to the cervical surface without an open seam", () => {
    const g = mesh.geometry,
      positions = g.attributes.position;
    const edges = new Map<string, number>();
    const key = (i: number) =>
      new Vector3()
        .fromBufferAttribute(positions, i)
        .toArray()
        .map((v) => Math.round(v * 1e6))
        .join(",");
    for (let t = 0; t < g.index!.count; t += 3) {
      const tri = [0, 1, 2].map((j) => g.index!.getX(t + j));
      for (let j = 0; j < 3; j++) {
        const a = tri[j],
          b = tri[(j + 1) % 3];
        if (
          Math.abs(positions.getY(a) - 1.472) > 0.000001 ||
          Math.abs(positions.getY(b) - 1.472) > 0.000001
        )
          continue;
        const ka = key(a),
          kb = key(b);
        if (ka === kb) continue;
        const edge = [ka, kb].sort().join("|");
        edges.set(edge, (edges.get(edge) ?? 0) + 1);
      }
    }
    expect(edges.size).toBeGreaterThan(30);
    expect([...edges.values()].every((count) => count === 2)).toBe(true);
  });
  it("positions the head over the cervical column and preserves a continuous nape profile", () => {
    const g = mesh.geometry;
    let anteriorHead = -Infinity;
    for (let i = 0; i < g.attributes.position.count; i++) {
      if (g.attributes.position.getY(i) > 1.57)
        anteriorHead = Math.max(anteriorHead, g.attributes.position.getZ(i));
    }
    expect(anteriorHead).toBeLessThan(0.225);
    const surface = new Mesh(g, new MeshBasicMaterial({ side: DoubleSide }));
    surface.updateMatrixWorld(true);
    for (const x of [-0.025, 0, 0.025]) {
      let previous: number | undefined;
      for (let step = 0; step <= 10; step++) {
        const y = 1.44 + step * 0.005;
        const hits = new Raycaster(
          new Vector3(x, y, -0.4),
          new Vector3(0, 0, 1),
        ).intersectObject(surface);
        expect(hits.length).toBeGreaterThan(0);
        const z = hits[0].point.z;
        if (previous !== undefined)
          expect(Math.abs(z - previous)).toBeLessThan(0.012);
        previous = z;
      }
    }
    surface.material.dispose();
  });
  it("includes native pelvic and neck structures and excludes smooth synthetic seals", async () => {
    const manifest = JSON.parse(
      await readFile(
        new URL(
          "../public/models/exercise-3d/model-manifest.json",
          import.meta.url,
        ),
        "utf8",
      ),
    );
    for (const name of [
      "Bone_Hip_bonel",
      "Bone_Hip_boner",
      "Bone_Sacrum",
      "Splenius_capitis_musclel",
      "Spinalis_capitis_muscler",
    ])
      expect(manifest.structures).toContain(name);
    expect(manifest.structures).not.toContain("Trainvy_NapeSeal");
    expect(manifest.structures).not.toContain("Trainvy_PelvicSeal");
    const g = mesh.geometry;
    let lowerAbdomen = 0;
    for (let i = 0; i < g.attributes.position.count; i++) {
      const p = new Vector3().fromBufferAttribute(g.attributes.position, i);
      if (
        p.y > 0.87 &&
        p.y < 0.97 &&
        Math.abs(p.x) < 0.08 &&
        p.z > 0.14 &&
        g.attributes.uv.getY(i) > 0.9 &&
        g.attributes.uv1.getY(i) > 0.1
      )
        lowerAbdomen++;
    }
    expect(lowerAbdomen).toBeGreaterThan(100);
  });
  it("never binds pelvic muscles to the arms and anchors medial gluteal origins to the pelvis", () => {
    const g = mesh.geometry,
      indices = g.attributes.skinIndex,
      weights = g.attributes.skinWeight;
    const masks = g.getAttribute("_exercisemuscles");
    let rootedGluteal = 0,
      supportedGluteal = 0;
    for (let i = 0; i < g.attributes.position.count; i++) {
      const p = new Vector3().fromBufferAttribute(g.attributes.position, i);
      if (p.y < 0.74 || p.y > 1.005 || Math.abs(p.x) > 0.24) continue;
      for (let j = 0; j < 4; j++) {
        if (weights.getComponent(i, j) > 0) {
          const bone = mesh.skeleton.bones[indices.getComponent(i, j)].name;
          expect(bone).not.toMatch(
            /^(upperArm|forearm|hand|elbow|shoulder|wrist)_/,
          );
          if (masks.getX(i) > 0.9 && p.z < 0.1 && bone.startsWith("hip_"))
            supportedGluteal++;
        }
      }
      if (
        masks.getX(i) > 0.9 &&
        p.y > 0.9 &&
        Math.abs(p.x) < 0.065 &&
        p.z < 0.1
      ) {
        expect(indices.getX(i)).toBe(0);
        expect(weights.getX(i)).toBeGreaterThan(0.95);
        rootedGluteal++;
      }
    }
    expect(rootedGluteal).toBeGreaterThan(30);
    expect(supportedGluteal).toBeGreaterThan(100);
  });
  it.each([
    "squat",
    "smith-squat",
    "bench-press",
    "incline-dumbbell-press",
    "flat-dumbbell-press",
    "incline-bench-press",
    "decline-bench-press",
    "smith-bench-press",
  ] as const)(
    "keeps the closed hands rigid and attached to the bar throughout %s",
    (exercise) => {
      const g = mesh.geometry;
      const c = g.attributes.color;
      const colour = new Color("#b8b4ac");
      const sample = [];
      for (let i = 0; i < g.attributes.position.count; i++) {
        const p = new Vector3().fromBufferAttribute(g.attributes.position, i);
        if (
          g.attributes.uv.getY(i) < 0.1 &&
          p.y > 0.75 &&
          p.y < 0.89 &&
          Math.abs(p.x) > 0.255 &&
          Math.abs(c.getX(i) - colour.r) < 0.008 &&
          Math.abs(c.getY(i) - colour.g) < 0.008 &&
          Math.abs(c.getZ(i) - colour.b) < 0.008
        )
          sample.push(i);
      }
      expect(sample.length).toBeGreaterThan(500);
      const vertex = new Vector3();
      for (const depth of [0, 0.25, 0.5, 0.75, 1]) {
        apply(exercise, depth);
        mesh.parent!.updateMatrixWorld(true);
        mesh.skeleton.update();
        for (const i of sample.filter((_, index) => index % 31 === 0)) {
          const restPoint = new Vector3().fromBufferAttribute(
            g.attributes.position,
            i,
          );
          const name = `hand_${restPoint.x < 0 ? "L" : "R"}`;
          const hand = mesh.skeleton.bones.find((b) => b.name === name)!;
          const expected = restPoint
            .sub(bindPositions.get(name)!)
            .add(hand.position);
          mesh.getVertexPosition(i, vertex);
          expect(vertex.distanceTo(expected)).toBeLessThan(0.00001);
        }
      }
    },
  );
  it.each([
    "squat",
    "smith-squat",
    "bench-press",
    "incline-dumbbell-press",
    "flat-dumbbell-press",
    "incline-bench-press",
    "decline-bench-press",
    "smith-bench-press",
  ] as const)("keeps every sampled vertex finite through %s", (exercise) => {
    const p = new Vector3();
    let invalid = 0,
      maximumRadius = 0;
    for (const depth of [0, 0.25, 0.5, 0.75, 1]) {
      apply(exercise, depth);
      mesh.parent!.updateMatrixWorld(true);
      mesh.skeleton.update();
      for (
        let i = 0;
        i < mesh.geometry.getAttribute("position").count;
        i += 47
      ) {
        mesh.getVertexPosition(i, p);
        if (!p.toArray().every(Number.isFinite)) invalid++;
        maximumRadius = Math.max(maximumRadius, p.length());
      }
    }
    expect(invalid).toBe(0);
    expect(maximumRadius).toBeLessThan(3);
  });
  it("can switch to neutral anatomy without replacing the material or linking external textures", () => {
    const { material, setAppearance } = createTissueMaterial();
    setAppearance("squat", false);
    setAppearance("bench-press", true);
    setAppearance("incline-dumbbell-press", true);
    setAppearance("flat-dumbbell-press", true);
    setAppearance("incline-bench-press", true);
    setAppearance("decline-bench-press", true);
    setAppearance("smith-bench-press", true);
    setAppearance("smith-squat", true);
    expect(material.map).toBeNull();
    expect(material.normalMap).toBeNull();
    expect(material.vertexColors).toBe(true);
    material.dispose();
  });
  it("uses a dedicated clavicular-pectoral mask for incline without colouring the lower chest, legs or head", () => {
    const masks = mesh.geometry.getAttribute("_exercisemuscles");
    const positions = mesh.geometry.attributes.position;
    let primary = 0,
      secondary = 0,
      differs = 0;
    for (let i = 0; i < masks.count; i++) {
      const z = masks.getZ(i);
      if (z > 0.9) primary++;
      else if (z > 0.2) secondary++;
      if (z !== masks.getY(i)) differs++;
      if (positions.getY(i) < 0.98 || positions.getY(i) > 1.49)
        expect(z).toBe(0);
      if (z > 0) expect(mesh.geometry.attributes.uv.getY(i)).toBe(1);
    }
    expect(primary).toBe(850);
    expect(secondary).toBe(4488);
    expect(differs).toBeGreaterThan(1000);
    expect(
      EXERCISE_ANIMATIONS["incline-dumbbell-press"].muscles.primary,
    ).not.toEqual(EXERCISE_ANIMATIONS["bench-press"].muscles.primary);
    expect(
      EXERCISE_ANIMATIONS["flat-dumbbell-press"].muscles.primary,
    ).not.toEqual(
      EXERCISE_ANIMATIONS["incline-dumbbell-press"].muscles.primary,
    );
    expect(EXERCISE_ANIMATIONS["incline-bench-press"].muscles.primary).toEqual(
      EXERCISE_ANIMATIONS["incline-dumbbell-press"].muscles.primary,
    );
    expect(
      EXERCISE_ANIMATIONS["decline-bench-press"].muscles.primary,
    ).not.toEqual(EXERCISE_ANIMATIONS["incline-bench-press"].muscles.primary);
  });
  it.each([
    "bench-press",
    "incline-dumbbell-press",
    "flat-dumbbell-press",
    "incline-bench-press",
    "decline-bench-press",
    "smith-bench-press",
  ] as const)(
    "supports the load over the forearm and keeps forearms vertical in %s",
    (exercise) => {
      const bones = new Map(mesh.skeleton.bones.map((b) => [b.name, b]));
      for (const depth of [0, 0.25, 0.5, 0.75, 1]) {
        apply(exercise, depth);
        const rightForearm = bones
          .get("hand_R")!
          .position.clone()
          .sub(bones.get("elbow_R")!.position);
        const leftForearm = bones
          .get("hand_L")!
          .position.clone()
          .sub(bones.get("elbow_L")!.position);

        // O peso deve estar apoiado sobre o antebraço:
        if (exercise.includes("dumbbell")) {
          // Nos halteres, o antebraço fica perfeitamente vertical (0°)
          const angleR =
            (Math.acos(Math.abs(rightForearm.y) / rightForearm.length()) *
              180) /
            Math.PI;
          const angleL =
            (Math.acos(Math.abs(leftForearm.y) / leftForearm.length()) * 180) /
            Math.PI;
          expect(angleR).toBeLessThan(0.01);
          expect(angleL).toBeLessThan(0.01);
        } else {
          // Na barra, o antebraço no fundo do movimento fica rigorosamente vertical sob a carga
          if (depth === 1) {
            const angleR =
              (Math.acos(Math.abs(rightForearm.y) / rightForearm.length()) *
                180) /
              Math.PI;
            expect(angleR).toBeLessThan(6.0);
          }
        }

        // Os cotovelos se aproximam na adução mas nunca colidem ou encostam:
        const distElbows = bones
          .get("elbow_R")!
          .position.distanceTo(bones.get("elbow_L")!.position);
        expect(distElbows).toBeGreaterThan(0.5);
      }
    },
  );
});
