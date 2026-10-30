import { HIP_THRUST_SUPPORT } from "./hip-thrust-pose";

export function HipThrustBench() {
  const z = HIP_THRUST_SUPPORT.edgeZ - 0.18;
  return (
    <group>
      <mesh position={[0, 0.38, z]} castShadow receiveShadow>
        <boxGeometry args={[1.1, 0.08, 0.36]} />
        <meshStandardMaterial color="#343b40" roughness={0.8} />
      </mesh>
      {[-0.4, 0.4].map((x) => (
        <group key={x}>
          <mesh position={[x, 0.19, z]} castShadow>
            <boxGeometry args={[0.07, 0.3, 0.07]} />
            <meshStandardMaterial
              color="#525d65"
              metalness={0.6}
              roughness={0.4}
            />
          </mesh>
          <mesh position={[x, 0.04, z]} castShadow>
            <boxGeometry args={[0.14, 0.08, 0.56]} />
            <meshStandardMaterial color="#3b444b" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export function HipThrustBarPad() {
  return (
    <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
      <cylinderGeometry args={[0.06, 0.06, 0.43, 24]} />
      <meshStandardMaterial color="#3d454b" roughness={0.9} />
    </mesh>
  );
}
