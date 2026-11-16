"use client";
import { RoundedBox } from "@react-three/drei";
export function OneArmRowBench() {
  return (
    <group>
      <RoundedBox
        args={[0.3, 0.08, 1.25]}
        position={[-0.14, 0.46, 0.08]}
        radius={0.025}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial color="#182232" roughness={0.8} />
      </RoundedBox>
      {[-0.38, 0.5].map((z) => (
        <group key={z}>
          <mesh position={[-0.14, 0.24, z]} castShadow>
            <boxGeometry args={[0.08, 0.42, 0.08]} />
            <meshStandardMaterial color="#475569" metalness={0.7} />
          </mesh>
          <mesh position={[-0.14, 0.035, z]} castShadow>
            <boxGeometry args={[0.58, 0.07, 0.13]} />
            <meshStandardMaterial color="#263549" />
          </mesh>
        </group>
      ))}
    </group>
  );
}
