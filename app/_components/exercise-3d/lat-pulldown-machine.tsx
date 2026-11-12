"use client";

import { forwardRef, useImperativeHandle, useRef } from "react";
import { RoundedBox } from "@react-three/drei";
import { Group, Mesh, Vector3 } from "three";
import type { getExercisePose } from "./kinematics";
import { PULLDOWN_PULLEY, getPulldownStackLift } from "./lat-pulldown-pose";

export interface LatPulldownMachineHandle {
  update(pose: ReturnType<typeof getExercisePose>): void;
}
const metal = { color: "#475569", metalness: 0.7, roughness: 0.35 };
const pad = { color: "#182232", roughness: 0.8 };
const up = new Vector3(0, 1, 0);

export const LatPulldownMachine = forwardRef<LatPulldownMachineHandle>(
  function LatPulldownMachine(_, ref) {
    const bar = useRef<Group>(null),
      cable = useRef<Mesh>(null),
      stack = useRef<Group>(null);
    useImperativeHandle(
      ref,
      () => ({
        update(pose) {
          bar.current?.position.copy(pose.bar);
          if (cable.current) {
            const end = pose.bar.clone().add(new Vector3(0, 0.035, 0));
            cable.current.position.copy(end).lerp(PULLDOWN_PULLEY, 0.5);
            cable.current.quaternion.setFromUnitVectors(
              up,
              PULLDOWN_PULLEY.clone().sub(end).normalize(),
            );
            cable.current.scale.set(1, end.distanceTo(PULLDOWN_PULLEY), 1);
          }
          if (stack.current)
            stack.current.position.y = getPulldownStackLift(pose.bar);
        },
      }),
      [],
    );
    return (
      <group>
        <RoundedBox
          args={[0.4, 0.08, 0.38]}
          position={[0, 0.425, 0.06]}
          radius={0.025}
          castShadow
        >
          <meshStandardMaterial {...pad} />
        </RoundedBox>
        <mesh position={[0, 0.22, 0.02]} castShadow>
          <boxGeometry args={[0.1, 0.4, 0.1]} />
          <meshStandardMaterial {...metal} />
        </mesh>
        {/* No backrest covering the dorsal; paired thigh restraints anchor the seated lift. */}
        {[-1, 1].map((side) => (
          <group key={side}>
            <mesh position={[side * 0.36, 0.035, 0.12]} castShadow>
              <boxGeometry args={[0.09, 0.07, 1.05]} />
              <meshStandardMaterial {...metal} />
            </mesh>
            <mesh
              position={[side * 0.17, 0.565, 0.3]}
              rotation={[0, 0, Math.PI / 2]}
              castShadow
            >
              <cylinderGeometry args={[0.065, 0.065, 0.23, 24]} />
              <meshStandardMaterial {...pad} />
            </mesh>
            <mesh position={[side * 0.35, 0.49, 0.3]} castShadow>
              <boxGeometry args={[0.045, 0.2, 0.045]} />
              <meshStandardMaterial {...metal} />
            </mesh>
          </group>
        ))}
        <mesh position={[0, 0.04, -0.23]} castShadow>
          <boxGeometry args={[0.83, 0.08, 0.12]} />
          <meshStandardMaterial {...metal} />
        </mesh>
        {/* Tower sits to the side, leaving the athlete's back visible. */}
        <mesh position={[-0.64, 0.88, -0.24]} castShadow>
          <boxGeometry args={[0.08, 1.72, 0.08]} />
          <meshStandardMaterial {...metal} />
        </mesh>
        <mesh position={[0, 1.94, -0.24]} castShadow>
          <boxGeometry args={[1.36, 0.07, 0.1]} />
          <meshStandardMaterial {...metal} />
        </mesh>
        <mesh position={[0, 1.94, 0.02]} castShadow>
          <boxGeometry args={[0.07, 0.07, 0.58]} />
          <meshStandardMaterial {...metal} />
        </mesh>
        <mesh
          position={PULLDOWN_PULLEY}
          rotation={[0, 0, Math.PI / 2]}
          castShadow
        >
          <cylinderGeometry args={[0.055, 0.055, 0.045, 28]} />
          <meshStandardMaterial
            color="#f97316"
            metalness={0.5}
            roughness={0.4}
          />
        </mesh>
        <mesh ref={cable}>
          <cylinderGeometry args={[0.004, 0.004, 1, 10]} />
          <meshStandardMaterial color="#a8b0b9" metalness={0.6} />
        </mesh>
        {[-0.75, -0.53].map((x) => (
          <mesh key={x} position={[x, 0.8, -0.24]}>
            <cylinderGeometry args={[0.009, 0.009, 1.5, 12]} />
            <meshStandardMaterial {...metal} />
          </mesh>
        ))}
        <group ref={stack}>
          {Array.from({ length: 7 }, (_, i) => (
            <mesh
              key={i}
              position={[-0.64, 0.13 + i * 0.035, -0.24]}
              castShadow
            >
              <boxGeometry args={[0.29, 0.028, 0.22]} />
              <meshStandardMaterial
                color={i === 6 ? "#f97316" : "#334155"}
                metalness={0.5}
                roughness={0.5}
              />
            </mesh>
          ))}
        </group>
        <group ref={bar}>
          <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.014, 0.014, 0.86, 24]} />
            <meshStandardMaterial
              color="#d1d9e2"
              metalness={0.85}
              roughness={0.25}
            />
          </mesh>
          {[-1, 1].map((side) => (
            <mesh
              key={side}
              position={[side * 0.3225, 0, 0]}
              rotation={[0, 0, Math.PI / 2]}
              castShadow
            >
              <cylinderGeometry args={[0.017, 0.017, 0.14, 24]} />
              <meshStandardMaterial color="#151e2a" roughness={0.75} />
            </mesh>
          ))}
          <mesh position={[0, 0.025, 0]}>
            <torusGeometry args={[0.02, 0.005, 8, 18]} />
            <meshStandardMaterial {...metal} />
          </mesh>
        </group>
      </group>
    );
  },
);
