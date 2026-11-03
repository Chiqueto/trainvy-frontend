import { SUMO_HEAD_RADIUS, SUMO_HEAD_OFFSET } from "./sumo-dumbbell-pose";

export function SumoDumbbell() {
  return (
    <group>
      <mesh castShadow>
        <cylinderGeometry args={[0.014, 0.014, 0.22, 24]} />
        <meshStandardMaterial
          color="#cbd5e1"
          metalness={0.9}
          roughness={0.25}
        />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[0, side * SUMO_HEAD_OFFSET, 0]} castShadow>
          <cylinderGeometry
            args={[SUMO_HEAD_RADIUS, SUMO_HEAD_RADIUS, 0.08, 6]}
          />
          <meshStandardMaterial
            color="#263244"
            roughness={0.8}
            metalness={0.1}
          />
        </mesh>
      ))}
    </group>
  );
}
