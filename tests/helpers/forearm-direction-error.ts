import { Matrix4, SkinnedMesh, Vector3 } from "three";
/** Independent geometry check using the GLB's inverse-bind matrices. */
export function forearmDirectionError(
  mesh: SkinnedMesh,
  suffix: string,
  limb: { elbow: Vector3; wrist: Vector3 },
) {
  const { bones, boneInverses } = mesh.skeleton;
  const fore = bones.findIndex((b) => b.name === `forearm_${suffix}`),
    hand = bones.findIndex((b) => b.name === `hand_${suffix}`);
  const bind = (i: number) =>
    new Vector3().setFromMatrixPosition(
      new Matrix4().copy(boneInverses[i]).invert(),
    );
  const actual = bind(hand)
    .sub(bind(fore))
    .normalize()
    .applyQuaternion(bones[fore].quaternion);
  return actual.distanceTo(limb.wrist.clone().sub(limb.elbow).normalize());
}
