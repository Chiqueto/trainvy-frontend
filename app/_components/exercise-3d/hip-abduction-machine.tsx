"use client";

import { forwardRef, useImperativeHandle, useRef } from "react";
import { RoundedBox } from "@react-three/drei";
import { Group, Quaternion, Vector3 } from "three";
import {
  getHipAbductionPose,
  getHipAbductionLeverAngle,
  HIP_ABDUCTION_PAD,
  HIP_ABDUCTION_MIN_ANGLE,
  HIP_ABDUCTION_MAX_ANGLE,
} from "./hip-abduction-pose";

export interface HipAbductionMachineHandle {
  update: (pose: ReturnType<typeof getHipAbductionPose>) => void;
}
function Beam({
  a,
  b,
  width = 0.055,
}: {
  a: [number, number, number];
  b: [number, number, number];
  width?: number;
}) {
  const start = new Vector3(...a),
    end = new Vector3(...b),
    delta = end.clone().sub(start);
  return (
    <mesh
      position={start.lerp(end, 0.5)}
      quaternion={new Quaternion().setFromUnitVectors(
        new Vector3(0, 1, 0),
        delta.clone().normalize(),
      )}
      castShadow
    >
      <boxGeometry args={[width, delta.length(), width]} />
      <meshStandardMaterial color="#3b4859" metalness={0.65} roughness={0.35} />
    </mesh>
  );
}
export const HipAbductionMachine = forwardRef<HipAbductionMachineHandle>(
  function HipAbductionMachine(_, ref) {
    const left = useRef<Group>(null),
      right = useRef<Group>(null),
      stack = useRef<Group>(null);
    useImperativeHandle(
      ref,
      () => ({
        update(pose) {
          if (left.current)
            left.current.rotation.y = getHipAbductionLeverAngle(pose.limbs[0]);
          if (right.current)
            right.current.rotation.y = getHipAbductionLeverAngle(pose.limbs[1]);
          if (stack.current)
            stack.current.position.y =
              (0.14 *
                (Math.abs(getHipAbductionLeverAngle(pose.limbs[0])) -
                  HIP_ABDUCTION_MIN_ANGLE)) /
              (HIP_ABDUCTION_MAX_ANGLE - HIP_ABDUCTION_MIN_ANGLE);
        },
      }),
      [],
    );
    return (
      <group>
        {[-0.27, 0.75].map((z) => (
          <mesh key={z} position={[0.14, 0.055, z]} castShadow receiveShadow>
            <boxGeometry args={[1.42, 0.09, 0.12]} />
            <meshStandardMaterial
              color="#263244"
              metalness={0.6}
              roughness={0.4}
            />
          </mesh>
        ))}
        {[-0.23, 0.23].map((x) => (
          <Beam key={x} a={[x, 0.09, -0.27]} b={[x, 0.56, 0.18]} />
        ))}
        <Beam a={[0, 0.11, 0.6]} b={[0, 0.56, 0.22]} />
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
        <Beam a={[0, 0.12, -0.25]} b={[0, 1.22, -0.16]} />
        {[-1, 1].map((side) => (
          <group key={side}>
            <Beam
              a={[side * 0.26, 0.56, 0.12]}
              b={[side * 0.34, 0.69, 0.08]}
              width={0.025}
            />
            <mesh
              position={[side * 0.34, 0.69, 0.08]}
              rotation={[0, 0, Math.PI / 2]}
              castShadow
            >
              <cylinderGeometry args={[0.017, 0.017, 0.13, 20]} />
              <meshStandardMaterial color="#101927" roughness={0.85} />
            </mesh>
            <group
              ref={side < 0 ? left : right}
              position={[side * 0.14, 0.57, 0]}
              rotation={[0, side * HIP_ABDUCTION_MAX_ANGLE, 0]}
            >
              <mesh>
                <cylinderGeometry args={[0.055, 0.055, 0.06, 24]} />
                <meshStandardMaterial color="#f97316" metalness={0.5} />
              </mesh>
              <Beam a={[0, 0, 0]} b={[0, 0, 0.44]} width={0.045} />
              <Beam
                a={[0, 0, 0.34]}
                b={[side * HIP_ABDUCTION_PAD.x, 0.11, 0.34]}
                width={0.03}
              />
              <RoundedBox
                args={[HIP_ABDUCTION_PAD.width, 0.2, 0.18]}
                radius={0.018}
                position={[
                  side * HIP_ABDUCTION_PAD.x,
                  0.11,
                  HIP_ABDUCTION_PAD.z,
                ]}
                castShadow
              >
                <meshStandardMaterial color="#243248" roughness={0.85} />
              </RoundedBox>
              <Beam a={[0, 0, 0.44]} b={[0, -0.38, 0.52]} width={0.035} />
              <mesh position={[0, -0.38, 0.52]} castShadow receiveShadow>
                <boxGeometry args={[0.19, 0.035, 0.32]} />
                <meshStandardMaterial color="#2b3745" roughness={0.85} />
              </mesh>
            </group>
          </group>
        ))}
        {[-0.12, 0.12].map((z) => (
          <Beam key={z} a={[0.82, 0.09, z]} b={[0.82, 1.32, z]} width={0.022} />
        ))}
        <Beam a={[0.82, 1.32, -0.12]} b={[0.82, 1.32, 0.12]} />
        <group ref={stack}>
          {Array.from({ length: 7 }, (_, i) => (
            <mesh key={i} position={[0.82, 0.16 + i * 0.035, 0]} castShadow>
              <boxGeometry args={[0.22, 0.027, 0.24]} />
              <meshStandardMaterial
                color={i === 6 ? "#f97316" : "#263244"}
                metalness={0.5}
                roughness={0.45}
              />
            </mesh>
          ))}
        </group>
        <Beam a={[0.82, 1.2, 0]} b={[0.82, 0.55, 0.26]} width={0.009} />
        <Beam a={[0.82, 0.55, 0.26]} b={[0.14, 0.55, 0]} width={0.009} />
      </group>
    );
  },
);
