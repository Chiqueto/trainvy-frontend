// @vitest-environment node
import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { SkinnedMesh } from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "meshoptimizer";
import { createFlyMuscleMask } from "../app/_components/exercise-3d/fly-muscles";
import { createPecDeckMuscleMask } from "../app/_components/exercise-3d/pec-deck-muscles";
import mapping from "../app/_components/exercise-3d/fly-muscle-map.json";
describe("fly muscle mask", () => {
  it("highlights the named pectorals, deltoids and biceps independently of pec deck", async () => {
    const bytes = await readFile(
      new URL(
        "../public/models/exercise-3d/trainvy-athlete.glb",
        import.meta.url,
      ),
    );
    const { scene } = await new GLTFLoader()
      .setMeshoptDecoder(MeshoptDecoder)
      .parseAsync(
        bytes.buffer.slice(
          bytes.byteOffset,
          bytes.byteOffset + bytes.byteLength,
        ),
        "",
      );
    let mesh: SkinnedMesh | undefined;
    scene.traverse((x) => {
      if (x instanceof SkinnedMesh) mesh = x;
    });
    expect(mesh).toBeDefined();
    const fly = createFlyMuscleMask(mesh!.geometry);
    const pec = createPecDeckMuscleMask(mesh!.geometry);
    for (const s of mapping.selections) {
      expect(s.indices.length).toBeGreaterThan(0);
      for (const i of s.indices) expect(fly.getX(i)).toBeCloseTo(s.role);
    }
    const biceps = mapping.selections.filter((s) => s.name.includes("biceps"));
    expect(
      biceps.some((s) =>
        s.indices.some((i) => pec.getX(i) === 0 && fly.getX(i) > 0),
      ),
    ).toBe(true);
  });
});
