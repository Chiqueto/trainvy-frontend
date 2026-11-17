"use client";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from "react";
import { Group } from "three";
import type { getExercisePose } from "./kinematics";
import { createGrippingHandGeometry } from "./gripping-hand-geometry";

export interface GrippingHandsHandle {
  update(pose: ReturnType<typeof getExercisePose>): void;
}
export const GrippingHands = forwardRef<
  GrippingHandsHandle,
  { leftSupport: boolean }
>(function GrippingHands({ leftSupport }, ref) {
  const groups = useRef<(Group | null)[]>([]);
  const geometries = useMemo(
    () => [
      createGrippingHandGeometry(-1, leftSupport),
      createGrippingHandGeometry(1),
    ],
    [leftSupport],
  );
  useEffect(() => () => geometries.forEach((g) => g.dispose()), [geometries]);
  useImperativeHandle(
    ref,
    () => ({
      update(pose) {
        pose.limbs.forEach((limb, i) => {
          groups.current[i]?.position.copy(limb.wrist);
          groups.current[i]?.quaternion.copy(limb.handRotation);
        });
      },
    }),
    [],
  );
  return (
    <>
      {geometries.map((geometry, i) => (
        <group
          key={i}
          ref={(g) => {
            groups.current[i] = g;
          }}
        >
          <mesh geometry={geometry} castShadow dispose={null}>
            <meshStandardMaterial
              color="#b5b3ac"
              roughness={0.58}
              metalness={0}
            />
          </mesh>
        </group>
      ))}
    </>
  );
});
