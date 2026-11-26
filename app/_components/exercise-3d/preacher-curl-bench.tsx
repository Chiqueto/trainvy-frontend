import { Vector3 } from "three";
import {
  getUpperExercisePose,
  PREACHER_CURL_ANGLE,
  PREACHER_CURL_HIP_HEIGHT,
} from "./upper-exercise-pose";

const arm = getUpperExercisePose("preacher-curl", 1).limbs[0];
const surfaceNormal = new Vector3(
  0,
  Math.sin(PREACHER_CURL_ANGLE),
  Math.cos(PREACHER_CURL_ANGLE),
);
const pad = arm.shoulder
  .clone()
  .lerp(arm.elbow, 0.8)
  .setX(0)
  .addScaledVector(surfaceNormal, -0.078);
const seat = PREACHER_CURL_HIP_HEIGHT - 0.123;
const padPostZ = pad.z + 0.045;
const padPostTopY = pad.y - 0.065;

export function getPreacherCurlBenchGeometry() {
  return {
    padCenter: pad.clone(),
    padSize: [0.56, 0.044, 0.21] as const,
    padPostCenter: new Vector3(0, padPostTopY / 2, padPostZ),
    padPostSize: [0.065, padPostTopY, 0.065] as const,
    seatCenter: new Vector3(0, seat, -0.045),
    seatSize: [0.36, 0.065, 0.34] as const,
  };
}

export function PreacherCurlBench() {
  return (
    <group>
      <mesh position={[0, seat, -0.045]} castShadow>
        <boxGeometry args={[0.36, 0.065, 0.34]} />
        <meshStandardMaterial color="#111c2b" roughness={0.83} />
      </mesh>
      <mesh
        position={pad}
        rotation={[Math.PI / 2 - PREACHER_CURL_ANGLE, 0, 0]}
        castShadow
      >
        <boxGeometry args={[0.56, 0.044, 0.21]} />
        <meshStandardMaterial color="#111c2b" roughness={0.83} />
      </mesh>
      <mesh position={[0, seat / 2, -0.095]} castShadow>
        <boxGeometry args={[0.075, seat, 0.075]} />
        <meshStandardMaterial color="#293748" metalness={0.5} />
      </mesh>
      <mesh position={[0, padPostTopY / 2, padPostZ]} castShadow>
        <boxGeometry args={[0.065, padPostTopY, 0.065]} />
        <meshStandardMaterial color="#293748" metalness={0.5} />
      </mesh>
      <mesh position={[0, padPostTopY + 0.004, (pad.z + padPostZ) / 2]} castShadow>
        <boxGeometry args={[0.08, 0.036, 0.085]} />
        <meshStandardMaterial color="#293748" metalness={0.5} />
      </mesh>
      <mesh position={[0, 0.027, 0.07]} castShadow>
        <boxGeometry args={[0.12, 0.054, 0.62]} />
        <meshStandardMaterial color="#293748" metalness={0.5} />
      </mesh>
      {[-0.2, 0.33].map((z) => (
        <mesh key={z} position={[0, 0.028, z]} castShadow>
          <boxGeometry args={[0.55, 0.055, 0.07]} />
          <meshStandardMaterial color="#293748" metalness={0.5} />
        </mesh>
      ))}
    </group>
  );
}
