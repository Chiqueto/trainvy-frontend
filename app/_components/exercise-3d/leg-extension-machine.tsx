"use client";

import { forwardRef, useImperativeHandle, useRef } from "react";
import { RoundedBox } from "@react-three/drei";
import { Group, Vector3 } from "three";
import {
  getLegExtensionPose,
  getLegExtensionLeverAngle,
  getLegExtensionRoller,
  LEG_EXTENSION_KNEE,
  LEG_EXTENSION_ROLLER_RADIUS,
} from "./leg-extension-pose";

export interface LegExtensionMachineHandle {
  update: (pose: ReturnType<typeof getLegExtensionPose>) => void;
}

function Beam({
  a,
  b,
  width = 0.055,
}: {
  a: Vector3;
  b: Vector3;
  width?: number;
}) {
  const delta = b.clone().sub(a);
  return (
    <mesh
      position={a.clone().lerp(b, 0.5)}
      quaternion={new Group().quaternion.setFromUnitVectors(
        new Vector3(0, 1, 0),
        delta.clone().normalize(),
      )}
      castShadow
    >
      <boxGeometry args={[width, delta.length(), width]} />
      <meshStandardMaterial color="#334155" metalness={0.65} roughness={0.3} />
    </mesh>
  );
}

export const LegExtensionMachine = forwardRef<LegExtensionMachineHandle>(
  function LegExtensionMachine(_, ref) {
    const lever = useRef<Group>(null);
    const stack = useRef<Group>(null);
    useImperativeHandle(
      ref,
      () => ({
        update(pose) {
          // The whole assembly rotates about the knee-aligned transverse axle.
          if (lever.current)
            lever.current.rotation.x = getLegExtensionLeverAngle(pose);
          if (stack.current)
            stack.current.position.y = (pose.limbs[0].ankle.y - 0.26) * 0.35;
        },
      }),
      [],
    );
    const roller = getLegExtensionRoller(getLegExtensionPose(0));
    const radius = roller.distanceTo(LEG_EXTENSION_KNEE);
    return (
      <group>
        {[-0.25, 0.67].map((z) => (
          <mesh key={z} position={[0.12, 0.055, z]} castShadow receiveShadow>
            <boxGeometry args={[1.05, 0.09, 0.13]} />
            <meshStandardMaterial
              color="#1e293b"
              metalness={0.55}
              roughness={0.4}
            />
          </mesh>
        ))}
        {[-0.26, 0.26].map((x) => (
          <group key={x}>
            <Beam
              a={new Vector3(x, 0.09, -0.25)}
              b={new Vector3(x, 0.57, 0.08)}
            />
            <Beam
              a={new Vector3(x, 0.09, 0.67)}
              b={new Vector3(x, 0.61, 0.35)}
            />
          </group>
        ))}
        <RoundedBox
          args={[0.48, 0.09, 0.48]}
          radius={0.025}
          position={[0, 0.565, 0.18]}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial color="#182232" roughness={0.8} />
        </RoundedBox>
        <RoundedBox
          args={[0.39, 0.67, 0.085]}
          radius={0.025}
          position={[0, 0.9, -0.095]}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial color="#182232" roughness={0.8} />
        </RoundedBox>
        <Beam a={new Vector3(0, 0.15, -0.25)} b={new Vector3(0, 1.22, -0.16)} />
        {[-1, 1].map((side) => (
          <group key={side}>
            <Beam
              a={new Vector3(side * 0.26, 0.58, 0.12)}
              b={new Vector3(side * 0.34, 0.69, 0.08)}
              width={0.025}
            />
            <mesh
              position={[side * 0.34, 0.69, 0.08]}
              rotation={[0, 0, Math.PI / 2]}
              castShadow
            >
              <cylinderGeometry args={[0.017, 0.017, 0.13, 20]} />
              <meshStandardMaterial color="#0f172a" roughness={0.85} />
            </mesh>
            <Beam
              a={new Vector3(side * 0.35, 0.15, 0.55)}
              b={LEG_EXTENSION_KNEE.clone().setX(side * 0.35)}
            />
            <mesh
              position={LEG_EXTENSION_KNEE.clone().setX(side * 0.35)}
              rotation={[0, 0, Math.PI / 2]}
            >
              <cylinderGeometry args={[0.055, 0.055, 0.08, 28]} />
              <meshStandardMaterial
                color="#f97316"
                metalness={0.55}
                roughness={0.35}
              />
            </mesh>
          </group>
        ))}
        <group ref={lever} position={LEG_EXTENSION_KNEE}>
          {[-0.35, 0.35].map((x) => (
            <Beam
              key={x}
              a={new Vector3(x, 0, 0)}
              b={new Vector3(x, 0, radius)}
              width={0.035}
            />
          ))}
          <mesh
            position={[0, 0, radius]}
            rotation={[0, 0, Math.PI / 2]}
            castShadow
          >
            <cylinderGeometry args={[0.018, 0.018, 0.76, 24]} />
            <meshStandardMaterial
              color="#cbd5e1"
              metalness={0.8}
              roughness={0.25}
            />
          </mesh>
          {[-0.14, 0.14].map((x) => (
            <mesh
              key={x}
              position={[x, 0, radius]}
              rotation={[0, 0, Math.PI / 2]}
              castShadow
            >
              <cylinderGeometry
                args={[
                  LEG_EXTENSION_ROLLER_RADIUS,
                  LEG_EXTENSION_ROLLER_RADIUS,
                  0.23,
                  32,
                ]}
              />
              <meshStandardMaterial color="#182232" roughness={0.85} />
            </mesh>
          ))}
        </group>
        {/* A schematic cam transmission and rising selector stack communicate resistance. */}
        <Beam
          a={new Vector3(0.35, 0.68, 0.44)}
          b={new Vector3(0.66, 0.68, 0.44)}
          width={0.025}
        />
        <mesh position={[0.66, 0.68, 0.44]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.12, 0.12, 0.035, 36]} />
          <meshStandardMaterial
            color="#475569"
            metalness={0.7}
            roughness={0.35}
          />
        </mesh>
        {[-0.04, 0.2].map((z) => (
          <Beam
            key={z}
            a={new Vector3(0.66, 0.1, z)}
            b={new Vector3(0.66, 1.28, z)}
            width={0.022}
          />
        ))}
        <Beam
          a={new Vector3(0.66, 1.28, -0.04)}
          b={new Vector3(0.66, 1.28, 0.2)}
        />
        <group ref={stack}>
          {Array.from({ length: 7 }, (_, i) => (
            <mesh key={i} position={[0.66, 0.16 + i * 0.035, 0.08]} castShadow>
              <boxGeometry args={[0.22, 0.027, 0.24]} />
              <meshStandardMaterial
                color={i === 6 ? "#f97316" : "#263244"}
                metalness={0.5}
                roughness={0.45}
              />
            </mesh>
          ))}
        </group>
        <Beam
          a={new Vector3(0.66, 0.96, 0.08)}
          b={new Vector3(0.66, 0.77, 0.44)}
          width={0.009}
        />
        <Beam
          a={new Vector3(0.66, 0.96, 0.08)}
          b={new Vector3(0.66, 0.42, 0.08)}
          width={0.009}
        />
      </group>
    );
  },
);
