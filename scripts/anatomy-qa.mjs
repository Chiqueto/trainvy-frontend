import { readFile, writeFile, mkdir } from "node:fs/promises";
import * as T from "three";
import ts from "typescript";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "meshoptimizer";
import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";
globalThis.FileReader = class {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then((result) => {
      this.result = result;
      this.onloadend?.();
    });
  }
};
const root = new URL("../", import.meta.url),
  out = new URL("../.tmp/anatomy-qa/", import.meta.url);
await mkdir(out, { recursive: true });
let code = ts.transpileModule(
  await readFile(
    new URL("../app/_components/exercise-3d/kinematics.ts", import.meta.url),
    "utf8",
  ),
  {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  },
).outputText;
code = code.replace(
  'from "three"',
  `from "${new URL("../node_modules/three/build/three.module.js", import.meta.url).href}"`,
);
await writeFile(new URL("kinematics.mjs", out), code);
const { createPoseDriver, getExercisePose } = await import(
  new URL("kinematics.mjs", out)
);
const bytes = await readFile(
  new URL("public/models/exercise-3d/trainvy-athlete.glb", root),
);
const records = [];
for (const exercise of ["squat", "bench-press"])
  for (const depth of [0, 0.5, 1]) {
    const { scene } = await new GLTFLoader()
      .setMeshoptDecoder(MeshoptDecoder)
      .parseAsync(
        bytes.buffer.slice(
          bytes.byteOffset,
          bytes.byteOffset + bytes.byteLength,
        ),
        "",
      );
    const bones = new Map();
    let mesh;
    scene.traverse((o) => {
      if (o.isBone) bones.set(o.name, o);
      if (o.isSkinnedMesh) mesh = o;
    });
    createPoseDriver(bones)(exercise, depth);
    scene.updateMatrixWorld(true);
    mesh.skeleton.update();
    const g = mesh.geometry.clone(),
      p = new T.Vector3(),
      c = new T.Color();
    const mask = g.getAttribute("_exercisemuscles"),
      tissue = g.getAttribute("uv");
    let primary = 0,
      secondary = 0;
    for (let i = 0; i < g.attributes.position.count; i++) {
      mesh.getVertexPosition(i, p);
      g.attributes.position.setXYZ(i, ...p.toArray());
      if (!p.toArray().every(Number.isFinite))
        throw new Error("Non-finite posed vertex");
      if (tissue.getY(i) > 0.5) {
        const m = exercise === "squat" ? mask.getX(i) : mask.getY(i);
        c.set(m > 0.7 ? "#bd5148" : m > 0.2 ? "#c99865" : "#b5b3ac");
        if (m > 0.7) primary++;
        else if (m > 0.2) secondary++;
        g.attributes.color.setXYZ(i, c.r, c.g, c.b);
      }
    }
    g.deleteAttribute("skinIndex");
    g.deleteAttribute("skinWeight");
    g.deleteAttribute("_exercisemuscles");
    g.computeVertexNormals();
    g.computeBoundingBox();
    const baked = new T.Mesh(
      g,
      new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.5 }),
    );
    baked.name = "Trainvy_Atelier";
    const group = new T.Group();
    group.add(baked);
    const bar = getExercisePose(exercise, depth).bar;
    const barMesh = new T.Mesh(
      new T.CylinderGeometry(0.014, 0.014, 2.2, 24),
      new T.MeshStandardMaterial({
        color: "#92999d",
        metalness: 0.8,
        roughness: 0.25,
      }),
    );
    barMesh.rotation.z = Math.PI / 2;
    barMesh.position.copy(bar);
    group.add(barMesh);
    for (const side of [-1, 1]) {
      const plate = new T.Mesh(
        new T.CylinderGeometry(0.2, 0.2, 0.06, 48),
        new T.MeshStandardMaterial({ color: "#34424a", roughness: 0.65 }),
      );
      plate.rotation.z = Math.PI / 2;
      plate.position.copy(bar).add(new T.Vector3(side * 0.78, 0, 0));
      group.add(plate);
    }
    if (exercise === "bench-press") {
      const b = new T.Mesh(
        new T.BoxGeometry(0.3, 0.08, 1.25),
        new T.MeshStandardMaterial({ color: "#19232b" }),
      );
      b.position.set(0, 0.42, 0.08);
      group.add(b);
    }
    const name = `${exercise}-${depth}`;
    await writeFile(
      new URL(name + ".glb", out),
      Buffer.from(await new GLTFExporter().parseAsync(group, { binary: true })),
    );
    records.push({
      exercise,
      depth,
      vertices: g.attributes.position.count,
      triangles: g.index.count / 3,
      bounds: g.boundingBox,
      primary,
      secondary,
      bones: bones.size,
    });
  }
await writeFile(
  new URL("validation.json", out),
  JSON.stringify(records, null, 2),
);
console.log(
  JSON.stringify(
    records.map(({ exercise, depth, vertices, primary, secondary }) => ({
      exercise,
      depth,
      vertices,
      primary,
      secondary,
    })),
    null,
    2,
  ),
);
