/** Extract real pelvic/neck structures from the same licensed Z-Anatomy FBXs.
 * node scripts/prepare-anatomical-connections.mjs <SkeletalSystem100.fbx> <MuscularSystem100.fbx>
 * No downloads or source files are needed by the application at runtime.
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import * as T from "three";
import { FBXLoader } from "three/addons/loaders/FBXLoader.js";
import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";
import { mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";
import { alignPelvicPoint } from "./anatomical-connections.mjs";

globalThis.FileReader = class {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then((result) => {
      this.result = result;
      this.onloadend?.();
    });
  }
};
const scene = new T.Group();
const sources = [];
function clipped(g, distance) {
  const values = [];
  for (let t = 0; t < g.attributes.position.count; t += 3) {
    const tri = [0, 1, 2].map((j) => {
      const p = new T.Vector3().fromBufferAttribute(
        g.attributes.position,
        t + j,
      );
      return { p, d: distance(p) };
    });
    const poly = [];
    for (let j = 0; j < 3; j++) {
      const a = tri[j],
        b = tri[(j + 1) % 3];
      if (a.d >= 0) poly.push(a.p);
      if (a.d >= 0 !== b.d >= 0)
        poly.push(a.p.clone().lerp(b.p, a.d / (a.d - b.d)));
    }
    for (let j = 1; j < poly.length - 1; j++)
      for (const p of [poly[0], poly[j], poly[j + 1]])
        values.push(...p.toArray());
  }
  const result = new T.BufferGeometry();
  result.setAttribute("position", new T.Float32BufferAttribute(values, 3));
  return result;
}
for (const [i, path] of process.argv.slice(2).entries()) {
  const bytes = await readFile(path);
  sources.push({
    file: i === 0 ? "SkeletalSystem100.fbx" : "MuscularSystem100.fbx",
    sha256: createHash("sha256").update(bytes).digest("hex"),
  });
  const source = new FBXLoader().parse(
    bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
    "",
  );
  source.updateMatrixWorld(true);
  source.traverse((o) => {
    if (!o.isMesh) return;
    const n = o.name;
    const bone =
      i === 0 &&
      /^(Hip_bone[lr]|Sacrum|Coccyx|Vertebra_L[1-5]|Vertebra_C[3-7]|Axis_\(C2\)|Atlas_\(C1\))$/.test(
        n,
      );
    const abdomen =
      i === 1 &&
      /^(Rectus_abdominis_muscle[lr]|External_abdominal_oblique_muscle[lr]|Linea_alba|Inguinal_ligament[lr])$/.test(
        n,
      );
    const pelvicMuscle =
      i === 1 &&
      /^(Iliacus_muscle[lr]|Psoas_major[lr]|Piriformis_muscle[lr]|Obturator_(internus|externus)[lr])$/.test(
        n,
      );
    const neck =
      i === 1 &&
      /^(Splenius_(capitis|colli)_muscle[lr]|(Spinalis|Longissimus)_capitis_muscle[lr]|Rectus_posterior_(major|minor)_capitis_muscle[lr]|Longus_(colli|capitis)_muscle[lr]|Semispinalis_colli_muscle[lr]|Sternocleidomastoid_muscle[lr]|Scalenus_(anterior|medius|posterior)_muscle[lr]|Sternohyoid_muscle[lr]|Sternothyroid_muscle[lr]|Omohyoid_muscle[lr])$/.test(
        n,
      );
    if (!bone && !abdomen && !pelvicMuscle && !neck) return;
    let g = o.geometry.clone().applyMatrix4(o.matrixWorld);
    if (g.index) g = g.toNonIndexed();
    for (const key of Object.keys(g.attributes))
      if (key !== "position") g.deleteAttribute(key);
    const p = new T.Vector3();
    for (let v = 0; v < g.attributes.position.count; v++) {
      p.fromBufferAttribute(g.attributes.position, v);
      // FBXLoader yields centimetres, Y-up, anterior +Z. Match the existing atlas.
      p.set(p.x * 0.011, p.y * 0.00988 - 0.0074, 0.12 + p.z * 0.0095);
      if (bone || pelvicMuscle) alignPelvicPoint(p);
      g.attributes.position.setXYZ(v, ...p.toArray());
    }
    if (abdomen) g = clipped(g, (p) => 0.975 - p.y);
    if (neck) {
      g = clipped(
        g,
        (p) => p.y - (n.startsWith("Sternocleidomastoid") ? 1.46 : 1.374),
      );
      g = clipped(g, (p) => 1.555 - p.y);
    }
    if (!g.attributes.position.count) return;
    if (o.matrixWorld.determinant() < 0) {
      const a = new T.Vector3(),
        b = new T.Vector3();
      for (let v = 0; v < g.attributes.position.count; v += 3) {
        a.fromBufferAttribute(g.attributes.position, v + 1);
        b.fromBufferAttribute(g.attributes.position, v + 2);
        g.attributes.position.setXYZ(v + 1, ...b.toArray());
        g.attributes.position.setXYZ(v + 2, ...a.toArray());
      }
    }
    g = mergeVertices(g, 0.000005);
    g.computeVertexNormals();
    const mesh = new T.Mesh(
      g,
      new T.MeshStandardMaterial({ color: "#b5b3ac" }),
    );
    mesh.name = bone ? `Bone_${n}` : n;
    mesh.userData = {
      anatomicalConnection:
        neck || /Vertebra_C|Axis_|Atlas_/.test(n) ? "neck" : "pelvis",
    };
    scene.add(mesh);
  });
}
if (sources.length !== 2 || scene.children.length < 25)
  throw new Error("Provide the complete skeletal and muscular source files.");
scene.userData = {
  source: "Z-Anatomy / BodyParts3D",
  license: "CC-BY-SA-4.0",
  sources,
};
const output = new URL("assets/anatomical-connections.glb", import.meta.url);
await mkdir(new URL(".", output), { recursive: true });
const data = await new GLTFExporter().parseAsync(scene, { binary: true });
await writeFile(output, Buffer.from(data));
console.log(
  JSON.stringify({
    structures: scene.children.map((o) => o.name),
    bytes: data.byteLength,
  }),
);
