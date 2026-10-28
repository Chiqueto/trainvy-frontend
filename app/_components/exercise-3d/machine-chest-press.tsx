"use client";

import { forwardRef, useImperativeHandle, useRef } from "react";
import { RoundedBox } from "@react-three/drei";
import { Group, Mesh, Vector3 } from "three";
import type { getExercisePose } from "./kinematics";

type Pose = ReturnType<typeof getExercisePose>;
export interface MachineChestPressHandle {
  update(pose: Pose): void;
}

const metal = { color: "#334155", metalness: 0.75, roughness: 0.3 };
const chrome = { color: "#cbd5e1", metalness: 0.9, roughness: 0.15 };
const pad = { color: "#182232", roughness: 0.8 };
const up = new Vector3(0, 1, 0);
const pivots = [
  new Vector3(-0.32, 1.42, -0.12),
  new Vector3(0.32, 1.42, -0.12),
];

function beam(mesh: Mesh | null, from: Vector3, to: Vector3) {
  if (!mesh) return;
  mesh.position.copy(from).lerp(to, 0.5);
  mesh.quaternion.setFromUnitVectors(up, to.clone().sub(from).normalize());
  mesh.scale.set(1, from.distanceTo(to), 1);
}

/** 3D Seated Converging Machine Chest Press equipment.
 * Padded seat, vertical backrest, converging press lever arms,
 * dual horizontal/neutral handles, and animated side weight stack. */
export const MachineChestPress = forwardRef<MachineChestPressHandle>(
  function MachineChestPress(_, ref) {
    const handles = useRef<(Group | null)[]>([]);
    const leverArms = useRef<(Mesh | null)[]>([]);
    const stack = useRef<Group>(null);

    useImperativeHandle(
      ref,
      () => ({
        update(pose) {
          for (const [index, limb] of pose.limbs.entries()) {
            // Position handles exactly at the athlete's hands
            const handleGroup = handles.current[index];
            if (handleGroup) {
              handleGroup.position.copy(limb.grip);
            }
            // Direct lever beam from the overhead pivot axis to the handle grip
            beam(leverArms.current[index], pivots[index], limb.grip);
          }

          // Move the weight stack smoothly with forward press displacement (concentric lift)
          if (stack.current) {
            const pressProgress = (pose.limbs[0].grip.z - 0.25) / (0.60 - 0.25);
            const clamped = Math.max(0, Math.min(1, pressProgress));
            stack.current.position.y = 0.22 + clamped * 0.18;
          }
        },
      }),
      [],
    );

    return (
      <group>
        {/* Base frame on studio floor */}
        <mesh position={[0, 0.04, 0.15]} castShadow>
          <boxGeometry args={[0.72, 0.08, 1.15]} />
          <meshStandardMaterial {...metal} />
        </mesh>
        <mesh position={[0, 0.04, -0.32]} castShadow>
          <boxGeometry args={[0.92, 0.08, 0.22]} />
          <meshStandardMaterial {...metal} />
        </mesh>

        {/* Central upright spine supporting backrest and seat */}
        <mesh position={[0, 0.75, -0.18]} castShadow>
          <boxGeometry args={[0.1, 1.42, 0.1]} />
          <meshStandardMaterial {...metal} />
        </mesh>

        {/* Seat support post and adjustment pin */}
        <mesh position={[0, 0.25, 0.1]} castShadow>
          <boxGeometry args={[0.08, 0.42, 0.08]} />
          <meshStandardMaterial {...metal} />
        </mesh>

        {/* Ergonomic seat cushion */}
        <RoundedBox
          args={[0.36, 0.08, 0.38]}
          position={[0, 0.44, 0.12]}
          radius={0.025}
          smoothness={4}
          castShadow
        >
          <meshStandardMaterial {...pad} />
        </RoundedBox>

        {/* Ergonomic vertical backrest cushion with slight thoracic contour */}
        <RoundedBox
          args={[0.32, 0.65, 0.075]}
          position={[0, 0.84, -0.07]}
          radius={0.025}
          smoothness={4}
          castShadow
        >
          <meshStandardMaterial {...pad} />
        </RoundedBox>

        {/* Overhead pivot crossbeam and bearing housings */}
        <mesh position={[0, 1.44, -0.12]} castShadow>
          <boxGeometry args={[0.78, 0.09, 0.12]} />
          <meshStandardMaterial {...metal} />
        </mesh>
        {[-1, 1].map((side) => (
          <mesh
            key={side}
            position={[side * 0.32, 1.42, -0.12]}
            rotation={[0, 0, Math.PI / 2]}
            castShadow
          >
            <cylinderGeometry args={[0.055, 0.055, 0.09, 24]} />
            <meshStandardMaterial
              color="#f97316"
              metalness={0.4}
              roughness={0.35}
            />
          </mesh>
        ))}

        {/* Side weight stack enclosure */}
        <mesh position={[-0.62, 0.68, -0.26]} castShadow>
          <boxGeometry args={[0.26, 1.28, 0.32]} />
          <meshStandardMaterial color="#111a27" roughness={0.65} />
        </mesh>

        {/* Guide rods */}
        {[-0.05, 0.05].map((offset) => (
          <mesh
            key={offset}
            position={[-0.62, 0.68, -0.26 + offset]}
            castShadow
          >
            <cylinderGeometry args={[0.012, 0.012, 1.22, 20]} />
            <meshStandardMaterial {...chrome} />
          </mesh>
        ))}

        {/* Fixed lower weight plates */}
        {Array.from({ length: 8 }, (_, i) => (
          <mesh key={i} position={[-0.62, 0.12 + i * 0.05, -0.26]} castShadow>
            <boxGeometry args={[0.21, 0.042, 0.22]} />
            <meshStandardMaterial
              color="#64748b"
              metalness={0.6}
              roughness={0.35}
            />
          </mesh>
        ))}

        {/* Animated dynamic weight plate selection */}
        <group ref={stack} position={[0, 0.22, 0]}>
          <mesh position={[-0.62, 0.38, -0.26]} castShadow>
            <boxGeometry args={[0.22, 0.045, 0.23]} />
            <meshStandardMaterial color="#ea580c" />
          </mesh>
          <mesh position={[-0.62, 0.42, -0.26]} castShadow>
            <cylinderGeometry args={[0.016, 0.016, 0.08, 16]} />
            <meshStandardMaterial {...chrome} />
          </mesh>
        </group>

        {/* Dual independent lever arms & handle assemblies */}
        {[-1, 1].map((side, index) => (
          <group key={side}>
            {/* Pressing lever beam */}
            <mesh
              ref={(mesh) => {
                leverArms.current[index] = mesh;
              }}
              castShadow
            >
              <boxGeometry args={[0.04, 1, 0.04]} />
              <meshStandardMaterial {...metal} />
            </mesh>

            {/* Handle grips assembly at athlete's hands */}
            <group
              ref={(group) => {
                handles.current[index] = group;
              }}
            >
              {/* Horizontal grip (pronated) */}
              <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
                <cylinderGeometry args={[0.016, 0.016, 0.14, 20]} />
                <meshStandardMaterial color="#1e293b" roughness={0.7} />
              </mesh>
              {/* Vertical grip (neutral) */}
              <mesh position={[0, 0, 0.06]} castShadow>
                <cylinderGeometry args={[0.015, 0.015, 0.13, 20]} />
                <meshStandardMaterial color="#1e293b" roughness={0.7} />
              </mesh>
              {/* Handle connection bracket */}
              <mesh position={[0, 0, 0.03]} castShadow>
                <boxGeometry args={[0.03, 0.025, 0.08]} />
                <meshStandardMaterial {...metal} />
              </mesh>
              {/* Trainvy Orange accent collars */}
              {[-0.07, 0.07].map((x) => (
                <mesh
                  key={x}
                  position={[x, 0, 0]}
                  rotation={[0, 0, Math.PI / 2]}
                >
                  <sphereGeometry args={[0.02, 14, 10]} />
                  <meshStandardMaterial color="#f97316" roughness={0.4} />
                </mesh>
              ))}
            </group>
          </group>
        ))}
      </group>
    );
  },
);
