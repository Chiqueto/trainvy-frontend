"use client";
import { forwardRef, useImperativeHandle, useRef } from "react";
import { RoundedBox } from "@react-three/drei";
import { Group, Vector3 } from "three";
import type { getExercisePose } from "./kinematics";
import {
  MACHINE_ROW_PIVOT,
  MACHINE_ROW_LEVER_X,
  MACHINE_ROW_RADIUS,
  MACHINE_ROW_PAD_CENTER,
  MACHINE_ROW_PAD_SIZE,
} from "./machine-row-pose";
export interface MachineRowMachineHandle {
  update(pose: ReturnType<typeof getExercisePose>): void;
}
const metal = { color: "#475569", metalness: 0.7, roughness: 0.35 },
  pad = { color: "#182232", roughness: 0.8 },
  Y = new Vector3(0, 1, 0);

export const MachineRowMachine = forwardRef<MachineRowMachineHandle>(
  function MachineRowMachine(_, ref) {
    const levers = useRef<(Group | null)[]>([]),
      handles = useRef<(Group | null)[]>([]);
    useImperativeHandle(
      ref,
      () => ({
        update(pose) {
          const direction = pose.bar.clone().sub(MACHINE_ROW_PIVOT).normalize();
          for (const [i, l] of pose.limbs.entries()) {
            levers.current[i]?.quaternion.setFromUnitVectors(Y, direction);
            const grip = handles.current[i];
            if (grip) {
              grip.position.copy(l.grip);
              grip.quaternion.setFromUnitVectors(
                Y,
                new Vector3(1, 0, 0).applyQuaternion(l.handRotation),
              );
            }
          }
        },
      }),
      [],
    );
    return (
      <group>
        <RoundedBox
          args={[0.38, 0.08, 0.38]}
          position={[0, 0.425, 0.02]}
          radius={0.025}
          castShadow
        >
          <meshStandardMaterial {...pad} />
        </RoundedBox>
        <mesh position={[0, 0.22, 0]} castShadow>
          <boxGeometry args={[0.1, 0.4, 0.1]} />
          <meshStandardMaterial {...metal} />
        </mesh>
        <RoundedBox
          args={[...MACHINE_ROW_PAD_SIZE]}
          position={MACHINE_ROW_PAD_CENTER}
          radius={0.025}
          castShadow
        >
          <meshStandardMaterial {...pad} />
        </RoundedBox>
        <mesh position={[0, 0.38, 0.18]} castShadow>
          <boxGeometry args={[0.065, 0.65, 0.065]} />
          <meshStandardMaterial {...metal} />
        </mesh>
        <mesh position={[0, 0.035, 0.16]} castShadow>
          <boxGeometry args={[0.85, 0.07, 0.12]} />
          <meshStandardMaterial {...metal} />
        </mesh>
        <mesh
          position={[0, MACHINE_ROW_PIVOT.y, MACHINE_ROW_PIVOT.z]}
          rotation={[0, 0, Math.PI / 2]}
        >
          <cylinderGeometry args={[0.025, 0.025, 0.9, 20]} />
          <meshStandardMaterial {...metal} />
        </mesh>
        {[-1, 1].map((side, i) => (
          <group key={side}>
            <mesh position={[side * 0.39, 0.035, 0.2]} castShadow>
              <boxGeometry args={[0.1, 0.07, 1.1]} />
              <meshStandardMaterial {...metal} />
            </mesh>
            <mesh
              position={[
                side * MACHINE_ROW_LEVER_X,
                0.145,
                MACHINE_ROW_PIVOT.z,
              ]}
              castShadow
            >
              <boxGeometry args={[0.075, 0.22, 0.075]} />
              <meshStandardMaterial {...metal} />
            </mesh>
            <group
              position={[
                side * MACHINE_ROW_LEVER_X,
                MACHINE_ROW_PIVOT.y,
                MACHINE_ROW_PIVOT.z,
              ]}
              ref={(o) => {
                levers.current[i] = o;
              }}
            >
              <mesh position={[0, MACHINE_ROW_RADIUS / 2, 0]} castShadow>
                <boxGeometry args={[0.045, MACHINE_ROW_RADIUS, 0.045]} />
                <meshStandardMaterial {...metal} />
              </mesh>
              <mesh
                position={[-side * 0.06, MACHINE_ROW_RADIUS, 0]}
                rotation={[0, 0, Math.PI / 2]}
                castShadow
              >
                <cylinderGeometry args={[0.016, 0.016, 0.12, 20]} />
                <meshStandardMaterial {...metal} />
              </mesh>
              <mesh
                position={[side * 0.09, 0.34, 0]}
                rotation={[0, 0, Math.PI / 2]}
                castShadow
              >
                <cylinderGeometry args={[0.018, 0.018, 0.18, 20]} />
                <meshStandardMaterial {...metal} />
              </mesh>
              <mesh
                position={[side * 0.15, 0.34, 0]}
                rotation={[0, 0, Math.PI / 2]}
                castShadow
              >
                <cylinderGeometry args={[0.14, 0.14, 0.045, 32]} />
                <meshStandardMaterial
                  color="#f97316"
                  roughness={0.5}
                  metalness={0.4}
                />
              </mesh>
            </group>
            {/* Rotating neutral handles keep the wrist aligned while the lever follows its arc. */}
            <group
              ref={(o) => {
                handles.current[i] = o;
              }}
            >
              <mesh castShadow>
                <cylinderGeometry args={[0.016, 0.016, 0.16, 20]} />
                <meshStandardMaterial color="#151e2a" roughness={0.75} />
              </mesh>
              {[-0.085, 0.085].map((y) => (
                <mesh key={y} position={[0, y, 0]}>
                  <sphereGeometry args={[0.019, 12, 8]} />
                  <meshStandardMaterial color="#94a3b8" metalness={0.6} />
                </mesh>
              ))}
            </group>
          </group>
        ))}
      </group>
    );
  },
);
