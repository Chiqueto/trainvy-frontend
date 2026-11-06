"use client";
import { forwardRef, useImperativeHandle, useRef } from "react";
import { Group } from "three";
import { getSeatedCalfPad, type getSeatedCalfPose } from "./seated-calf-pose";

export interface SeatedCalfMachineHandle {
  update: (pose: ReturnType<typeof getSeatedCalfPose>) => void;
}
function Block({
  position,
  size,
  pad = false,
}: {
  position: [number, number, number];
  size: [number, number, number];
  pad?: boolean;
}) {
  return (
    <mesh position={position} castShadow receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial
        color={pad ? "#252b35" : "#465467"}
        metalness={pad ? 0 : 0.6}
        roughness={pad ? 0.7 : 0.35}
      />
    </mesh>
  );
}
export const SeatedCalfMachine = forwardRef<SeatedCalfMachineHandle>(
  function SeatedCalfMachine(_, ref) {
    const pads = useRef<Group>(null);
    useImperativeHandle(
      ref,
      () => ({
        update(pose) {
          if (!pads.current) return;
          pads.current.position.copy(getSeatedCalfPad(pose));
          const { hip, knee } = pose.limbs[0];
          pads.current.rotation.x = -Math.atan2(knee.y - hip.y, knee.z - hip.z);
        },
      }),
      [],
    );
    return (
      <group>
        <Block position={[0, 0.05, 0.15]} size={[0.9, 0.1, 1.25]} />
        <Block position={[0, 0.3, -0.05]} size={[0.1, 0.5, 0.1]} />
        <Block position={[0, 0.55, 0.04]} size={[0.47, 0.1, 0.4]} pad />
        <Block position={[0, 0.12, 0.655]} size={[0.6, 0.12, 0.19]} />
        {[-1, 1].map((side) => (
          <group key={side}>
            <Block
              position={[side * 0.43, 0.53, 0.35]}
              size={[0.045, 0.96, 0.045]}
            />
            <Block
              position={[side * 0.34, 0.72, 0.22]}
              size={[0.045, 0.16, 0.045]}
            />
            <mesh position={[side * 0.34, 0.8, 0.22]}>
              <cylinderGeometry args={[0.018, 0.018, 0.18, 16]} />
              <meshStandardMaterial color="#252b35" />
            </mesh>
          </group>
        ))}
        <group ref={pads}>
          {[-1, 1].map((side) => (
            <Block
              key={side}
              position={[side * 0.14, 0, 0]}
              size={[0.19, 0.09, 0.2]}
              pad
            />
          ))}
          <Block position={[0, 0.08, 0]} size={[0.8, 0.06, 0.07]} />
          {[-1, 1].map((side) => (
            <mesh
              key={side}
              position={[side * 0.49, 0.08, 0]}
              rotation={[0, 0, Math.PI / 2]}
              castShadow
            >
              <cylinderGeometry args={[0.1, 0.1, 0.06, 32]} />
              <meshStandardMaterial
                color="#303b49"
                metalness={0.6}
                roughness={0.4}
              />
            </mesh>
          ))}
        </group>
      </group>
    );
  },
);
