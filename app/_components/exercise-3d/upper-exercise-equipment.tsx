"use client";
import { forwardRef, useImperativeHandle, useRef } from "react";
import { Group } from "three";
import type { getExercisePose } from "./kinematics";
import type { UpperExercise } from "./upper-exercise-types";
import { PreacherCurlBench } from "./preacher-curl-bench";

export interface UpperEquipmentHandle {
  update(pose: ReturnType<typeof getExercisePose>): void;
}
function Weight({
  barbell,
  small,
  preacher,
}: {
  barbell: boolean;
  small: boolean;
  preacher: boolean;
}) {
  const length = preacher ? 1.1 : barbell ? 1.5 : 0.25,
    radius = preacher ? 0.095 : barbell ? 0.14 : small ? 0.055 : 0.08,
    offset = preacher ? 0.45 : barbell ? 0.59 : 0.095;
  return (
    <>
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.013, 0.013, length, 20]} />
        <meshStandardMaterial color="#bfc5cc" metalness={0.8} roughness={0.3} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh
          key={side}
          position={[side * offset, 0, 0]}
          rotation={[0, 0, Math.PI / 2]}
          castShadow
        >
          <cylinderGeometry
            args={[radius, radius, barbell ? 0.04 : 0.07, barbell ? 32 : 6]}
          />
          <meshStandardMaterial
            color={barbell ? "#d66a14" : "#242c38"}
            metalness={0.25}
            roughness={0.5}
          />
        </mesh>
      ))}
    </>
  );
}
export const UpperExerciseEquipment = forwardRef<
  UpperEquipmentHandle,
  { exercise: UpperExercise }
>(function UpperExerciseEquipment({ exercise }, ref) {
  const groups = useRef<(Group | null)[]>([]),
    barbell =
      exercise === "preacher-curl" ||
      exercise === "skull-crusher" ||
      exercise === "military-press" ||
      exercise === "barbell-curl" ||
      exercise === "legacy-barbell-curl";
  useImperativeHandle(
    ref,
    () => ({
      update(pose) {
        if (barbell) {
          groups.current[0]?.position.copy(pose.bar);
          groups.current[0]?.quaternion.identity();
        } else
          pose.limbs.forEach((limb, i) => {
            groups.current[i]?.position.copy(limb.grip);
            groups.current[i]?.quaternion.copy(limb.handRotation);
          });
      },
    }),
    [barbell],
  );
  return (
    <>
      {(barbell ? [0] : [0, 1]).map((i) => (
        <group
          key={i}
          ref={(g) => {
            groups.current[i] = g;
          }}
        >
          <Weight
            barbell={barbell}
            small={exercise === "lateral-raise"}
            preacher={exercise === "preacher-curl" || exercise === "skull-crusher"}
          />
        </group>
      ))}
      {exercise === "preacher-curl" && <PreacherCurlBench />}
      {exercise === "dumbbell-shoulder-press" && (
        <group>
          <mesh position={[0, 0.455, -0.04]} castShadow>
            <boxGeometry args={[0.43, 0.07, 0.42]} />
            <meshStandardMaterial color="#111c2b" roughness={0.8} />
          </mesh>
          <mesh position={[0, 0.9, -0.145]} castShadow>
            <boxGeometry args={[0.35, 0.82, 0.06]} />
            <meshStandardMaterial color="#111c2b" roughness={0.8} />
          </mesh>
          {[-1, 1].map((side) => (
            <mesh key={side} position={[side * 0.17, 0.21, -0.02]} castShadow>
              <boxGeometry args={[0.045, 0.42, 0.5]} />
              <meshStandardMaterial color="#293748" metalness={0.5} />
            </mesh>
          ))}
        </group>
      )}
    </>
  );
});
