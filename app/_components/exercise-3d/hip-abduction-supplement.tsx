"use client";

import { useEffect, useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import {
  BufferAttribute,
  Object3D,
  MeshPhysicalMaterial,
  SkinnedMesh,
} from "three";
import provenance from "../../../public/models/exercise-3d/hip-abduction-supplement.json";
import manifest from "../../../public/models/exercise-3d/model-manifest.json";

/** Named licensed muscles absent from the shared atlas, bound to the same rig. */
export function HipAbductionSupplement({
  athlete,
  material,
}: {
  athlete: Object3D;
  material: MeshPhysicalMaterial;
}) {
  const { scene } = useGLTF(
    `/models/exercise-3d/hip-abduction-supplement.glb?v=${provenance.sha256.slice(0, 12)}`,
    false,
    true,
  );
  const mesh = useMemo(() => {
    if (provenance.baseAssetSha256 !== manifest.sha256)
      throw new Error("Hip abduction supplement has an incompatible rig");
    let base!: SkinnedMesh, source!: SkinnedMesh;
    athlete.traverse((o) => {
      if (o instanceof SkinnedMesh) base = o;
    });
    scene.traverse((o) => {
      if (o instanceof SkinnedMesh) source = o;
    });
    if (
      base.skeleton.bones.some((bone, i) => bone.name !== provenance.bones[i])
    )
      throw new Error("Hip abduction skeleton order mismatch");
    const geometry = source.geometry.clone();
    const count = geometry.attributes.position.count;
    for (const [name, size] of [
      ["_pecdeckmuscles", 1],
      ["_flymuscles", 1],
      ["_smithbenchmuscles", 1],
      ["_machinechestpressmuscles", 1],
      ["_legdetailmuscles", 4],
      ["_lowerbodymuscles", 4],
    ] as const)
      geometry.setAttribute(
        name,
        new BufferAttribute(new Float32Array(count * size), size),
      );
    const selection = new BufferAttribute(new Float32Array(count * 2), 2);
    for (let i = 0; i < count; i++) selection.setXY(i, 0, 1);
    geometry.setAttribute("_hipmachinemuscles", selection);
    const result = new SkinnedMesh(geometry, material);
    result.bind(base.skeleton, base.bindMatrix);
    result.frustumCulled = false;
    result.castShadow = true;
    return result;
  }, [athlete, material, scene]);
  useEffect(() => () => mesh.geometry.dispose(), [mesh]);
  return <primitive object={mesh} dispose={null} />;
}
