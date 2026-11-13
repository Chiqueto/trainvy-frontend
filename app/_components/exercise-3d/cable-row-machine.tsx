"use client";
import { forwardRef, useImperativeHandle, useRef } from "react";
import { RoundedBox } from "@react-three/drei";
import { Group, Mesh, Quaternion, Vector3 } from "three";
import type { getExercisePose } from "./kinematics";
import {
  CABLE_ROW_PULLEY,
  CABLE_ROW_ANKLE,
  CABLE_ROW_FOOT_ROTATION,
  getCableRowAttachment,
  getCableRowHandleRotation,
  getCableRowStackLift,
} from "./cable-row-pose";

export interface CableRowMachineHandle {
  update(pose: ReturnType<typeof getExercisePose>): void;
}
const metal = { color: "#475569", metalness: 0.7, roughness: 0.35 },
  pad = { color: "#182232", roughness: 0.8 };
const Y = new Vector3(0, 1, 0),
  v = (x: number, y: number, z: number) => new Vector3(x, y, z);
function Rod({ from, to }: { from: Vector3; to: Vector3 }) {
  const q = Y.clone();
  return (
    <mesh
      position={from.clone().lerp(to, 0.5)}
      quaternion={new Quaternion().setFromUnitVectors(
        q,
        to.clone().sub(from).normalize(),
      )}
      castShadow
    >
      <cylinderGeometry args={[0.012, 0.012, from.distanceTo(to), 16]} />
      <meshStandardMaterial {...metal} />
    </mesh>
  );
}

export const CableRowMachine = forwardRef<CableRowMachineHandle>(
  function CableRowMachine(_, ref) {
    const handle = useRef<Group>(null),
      cable = useRef<Mesh>(null),
      stack = useRef<Group>(null);
    useImperativeHandle(
      ref,
      () => ({
        update(pose) {
          handle.current?.position.copy(pose.bar);
          handle.current?.quaternion.copy(getCableRowHandleRotation(pose));
          const end = getCableRowAttachment(pose);
          if (cable.current) {
            cable.current.position.copy(end).lerp(CABLE_ROW_PULLEY, 0.5);
            cable.current.quaternion.setFromUnitVectors(
              Y,
              CABLE_ROW_PULLEY.clone().sub(end).normalize(),
            );
            cable.current.scale.y = end.distanceTo(CABLE_ROW_PULLEY);
          }
          if (stack.current)
            stack.current.position.y = getCableRowStackLift(pose);
        },
      }),
      [],
    );
    return (
      <group>
        <RoundedBox
          args={[0.37, 0.08, 0.58]}
          position={[0, 0.435, -0.1]}
          radius={0.025}
          castShadow
        >
          <meshStandardMaterial {...pad} />
        </RoundedBox>
        <mesh position={[0, 0.22, -0.1]} castShadow>
          <boxGeometry args={[0.12, 0.4, 0.12]} />
          <meshStandardMaterial {...metal} />
        </mesh>
        {[-1, 1].map((side) => (
          <group key={side}>
            <mesh position={[side * 0.29, 0.035, 0.36]} castShadow>
              <boxGeometry args={[0.08, 0.07, 1.65]} />
              <meshStandardMaterial {...metal} />
            </mesh>
            <group
              position={CABLE_ROW_ANKLE.clone().setX(side * 0.17)}
              quaternion={CABLE_ROW_FOOT_ROTATION}
            >
              <RoundedBox
                args={[0.2, 0.035, 0.34]}
                position={[0, -0.067, 0.075]}
                radius={0.008}
                castShadow
              >
                <meshStandardMaterial color="#263549" metalness={0.5} />
              </RoundedBox>
            </group>
          </group>
        ))}
        <mesh position={CABLE_ROW_PULLEY} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.055, 0.055, 0.05, 24]} />
          <meshStandardMaterial color="#f97316" />
        </mesh>
        <mesh position={[-0.64, 0.7, 1.16]} castShadow>
          <boxGeometry args={[0.07, 1.35, 0.07]} />
          <meshStandardMaterial {...metal} />
        </mesh>
        <mesh position={[-0.32, 0.27, 1.16]}>
          <boxGeometry args={[0.64, 0.07, 0.08]} />
          <meshStandardMaterial {...metal} />
        </mesh>
        <mesh position={[-0.64, 0.035, 1.16]}>
          <boxGeometry args={[0.5, 0.07, 0.35]} />
          <meshStandardMaterial {...metal} />
        </mesh>
        {[-0.76, -0.52].map((x) => (
          <mesh key={x} position={[x, 0.65, 1.16]}>
            <cylinderGeometry args={[0.008, 0.008, 1.2, 12]} />
            <meshStandardMaterial {...metal} />
          </mesh>
        ))}
        <group ref={stack}>
          {Array.from({ length: 7 }, (_, i) => (
            <mesh key={i} position={[-0.64, 0.12 + i * 0.036, 1.16]} castShadow>
              <boxGeometry args={[0.29, 0.03, 0.22]} />
              <meshStandardMaterial color={i === 6 ? "#f97316" : "#334155"} />
            </mesh>
          ))}
        </group>
        <mesh ref={cable}>
          <cylinderGeometry args={[0.004, 0.004, 1, 10]} />
          <meshStandardMaterial color="#a8b0b9" metalness={0.6} />
        </mesh>
        <group ref={handle}>
          {[-1, 1].map((side) => (
            <group key={side}>
              <mesh position={[side * 0.09, 0, 0]} castShadow>
                <cylinderGeometry args={[0.015, 0.015, 0.16, 20]} />
                <meshStandardMaterial color="#151e2a" roughness={0.75} />
              </mesh>
              <Rod from={v(side * 0.09, 0.08, 0)} to={v(0, 0, 0.14)} />
              <Rod from={v(side * 0.09, -0.08, 0)} to={v(0, 0, 0.14)} />
            </group>
          ))}
          <mesh position={[0, 0, 0.14]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.018, 0.005, 8, 18]} />
            <meshStandardMaterial {...metal} />
          </mesh>
        </group>
      </group>
    );
  },
);
