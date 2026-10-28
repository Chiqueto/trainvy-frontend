"use client";

import { forwardRef, useImperativeHandle, useRef } from "react";
import { RoundedBox } from "@react-three/drei";
import { Group, Matrix4, Mesh, Quaternion, Vector3 } from "three";
import type { getExercisePose } from "./kinematics";

type Pose = ReturnType<typeof getExercisePose>;
export interface PecDeckMachineHandle {
  update(pose: Pose): void;
}
const metal = { color: "#334155", metalness: 0.72, roughness: 0.32 };
const pad = { color: "#182232", roughness: 0.8 };
const up = new Vector3(0, 1, 0);

function beam(mesh: Mesh | null, from: Vector3, to: Vector3) {
  if (!mesh) return;
  mesh.position.copy(from).lerp(to, 0.5);
  mesh.quaternion.setFromUnitVectors(up, to.clone().sub(from).normalize());
  mesh.scale.set(1, from.distanceTo(to), 1);
}

/** The same pose drives the athlete, forearm pads, handles and rotating arms. */
export const PecDeckMachine = forwardRef<PecDeckMachineHandle>(
  function PecDeckMachine(_, ref) {
    const pads = useRef<(Group | null)[]>([]);
    const handles = useRef<(Group | null)[]>([]);
    const vertical = useRef<(Mesh | null)[]>([]);
    const overhead = useRef<(Mesh | null)[]>([]);
    const stack = useRef<Group>(null);
    useImperativeHandle(
      ref,
      () => ({
        update(pose) {
          for (const [index, limb] of pose.limbs.entries()) {
            const y = limb.wrist.clone().sub(limb.elbow).normalize();
            const x = limb.elbow
              .clone()
              .sub(limb.shoulder)
              .normalize()
              .multiplyScalar(limb.side);
            const z = x.clone().cross(y).normalize();
            const rotation = new Quaternion().setFromRotationMatrix(
              new Matrix4().makeBasis(x, y, z),
            );
            const assembly = pads.current[index];
            if (assembly) {
              assembly.position.copy(limb.elbow);
              assembly.quaternion.copy(rotation);
            }
            handles.current[index]?.position.copy(limb.grip);
            const padCenter = limb.elbow
              .clone()
              .addScaledVector(y, 0.11)
              .addScaledVector(z, 0.053);
            const top = padCenter.clone().setY(1.56);
            beam(vertical.current[index], padCenter, top);
            beam(
              overhead.current[index],
              new Vector3(limb.shoulder.x, 1.56, limb.shoulder.z),
              top,
            );
          }
          if (stack.current)
            stack.current.position.y =
              0.22 + (0.56 - pose.limbs[1].elbow.x) * 0.3;
        },
      }),
      [],
    );
    return (
      <group>
        {/* Stable seat/backrest and feet on the studio floor. */}
        <RoundedBox
          args={[0.37, 0.08, 0.4]}
          position={[0, 0.425, 0.07]}
          radius={0.025}
          smoothness={4}
          castShadow
        >
          <meshStandardMaterial {...pad} />
        </RoundedBox>
        <RoundedBox
          args={[0.31, 0.57, 0.075]}
          position={[0, 0.8, -0.085]}
          radius={0.025}
          smoothness={4}
          castShadow
        >
          <meshStandardMaterial {...pad} />
        </RoundedBox>
        <mesh position={[0, 0.2, -0.02]} castShadow>
          <boxGeometry args={[0.1, 0.4, 0.1]} />
          <meshStandardMaterial {...metal} />
        </mesh>
        {[-1, 1].map((side) => (
          <group key={side}>
            <mesh position={[side * 0.39, 0.81, -0.25]} castShadow>
              <boxGeometry args={[0.065, 1.57, 0.065]} />
              <meshStandardMaterial {...metal} />
            </mesh>
            <mesh position={[side * 0.34, 0.035, 0.02]} castShadow>
              <boxGeometry args={[0.15, 0.07, 0.9]} />
              <meshStandardMaterial color="#1e293b" roughness={0.65} />
            </mesh>
            <mesh position={[side * 0.215, 1.56, 0.052]} castShadow>
              <cylinderGeometry args={[0.055, 0.055, 0.09, 28]} />
              <meshStandardMaterial
                color="#f97316"
                metalness={0.45}
                roughness={0.4}
              />
            </mesh>
          </group>
        ))}
        <mesh position={[0, 1.6, -0.09]} castShadow>
          <boxGeometry args={[0.84, 0.07, 0.4]} />
          <meshStandardMaterial {...metal} />
        </mesh>
        <mesh position={[0, 0.045, -0.16]} castShadow>
          <boxGeometry args={[0.85, 0.09, 0.15]} />
          <meshStandardMaterial {...metal} />
        </mesh>
        {/* Side weight stack, clear of the chest and backrest. */}
        <mesh position={[-0.63, 0.63, -0.28]} castShadow>
          <boxGeometry args={[0.25, 1.2, 0.3]} />
          <meshStandardMaterial color="#111a27" roughness={0.6} />
        </mesh>
        {Array.from({ length: 8 }, (_, i) => (
          <mesh key={i} position={[-0.63, 0.1 + i * 0.048, -0.09]} castShadow>
            <boxGeometry args={[0.22, 0.035, 0.03]} />
            <meshStandardMaterial
              color="#64748b"
              metalness={0.5}
              roughness={0.4}
            />
          </mesh>
        ))}
        <group ref={stack} position={[0, 0.22, 0]}>
          <mesh position={[-0.63, 0.35, -0.08]} castShadow>
            <boxGeometry args={[0.23, 0.035, 0.04]} />
            <meshStandardMaterial color="#f97316" />
          </mesh>
        </group>
        {[-1, 1].map((side, index) => (
          <group key={side}>
            <mesh
              ref={(mesh) => {
                vertical.current[index] = mesh;
              }}
              castShadow
            >
              <boxGeometry args={[0.035, 1, 0.035]} />
              <meshStandardMaterial {...metal} />
            </mesh>
            <mesh
              ref={(mesh) => {
                overhead.current[index] = mesh;
              }}
              castShadow
            >
              <boxGeometry args={[0.045, 1, 0.045]} />
              <meshStandardMaterial {...metal} />
            </mesh>
            <group
              ref={(group) => {
                pads.current[index] = group;
              }}
            >
              <RoundedBox
                args={[0.095, 0.22, 0.045]}
                position={[0, 0.11, 0.053]}
                radius={0.018}
                smoothness={3}
                castShadow
              >
                <meshStandardMaterial {...pad} />
              </RoundedBox>
              <mesh position={[0, 0.11, 0.078]}>
                <boxGeometry args={[0.055, 0.18, 0.018]} />
                <meshStandardMaterial {...metal} />
              </mesh>
            </group>
            <group
              ref={(group) => {
                handles.current[index] = group;
              }}
            >
              <mesh castShadow>
                <cylinderGeometry args={[0.014, 0.014, 0.11, 20]} />
                <meshStandardMaterial color="#171e29" roughness={0.75} />
              </mesh>
              {[-0.06, 0.06].map((y) => (
                <mesh key={y} position={[0, y, 0]}>
                  <sphereGeometry args={[0.018, 12, 8]} />
                  <meshStandardMaterial color="#f97316" />
                </mesh>
              ))}
            </group>
          </group>
        ))}
      </group>
    );
  },
);
