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
  .lerp(arm.elbow, 0.58)
  .setX(0)
  .addScaledVector(surfaceNormal, -0.091);
const seat = PREACHER_CURL_HIP_HEIGHT - 0.078;

export function PreacherCurlBench() {
  return (
    <group>
      <mesh position={[0, seat, -0.045]} castShadow>
        <boxGeometry args={[0.36, 0.065, 0.35]} />
        <meshStandardMaterial color="#111c2b" roughness={0.83} />
      </mesh>
      <mesh
        position={pad}
        rotation={[Math.PI / 2 - PREACHER_CURL_ANGLE, 0, 0]}
        castShadow
      >
        <boxGeometry args={[0.57, 0.054, 0.29]} />
        <meshStandardMaterial color="#111c2b" roughness={0.83} />
      </mesh>
      <mesh position={[0, seat / 2, -0.1]} castShadow>
        <boxGeometry args={[0.075, seat, 0.075]} />
        <meshStandardMaterial color="#293748" metalness={0.5} />
      </mesh>
      <mesh position={[0, (pad.y - 0.04) / 2, pad.z]} castShadow>
        <boxGeometry args={[0.07, pad.y - 0.04, 0.07]} />
        <meshStandardMaterial color="#293748" metalness={0.5} />
      </mesh>
      <mesh position={[0, 0.027, 0.08]} castShadow>
        <boxGeometry args={[0.12, 0.054, 0.7]} />
        <meshStandardMaterial color="#293748" metalness={0.5} />
      </mesh>
      {[-0.2, 0.36].map((z) => (
        <mesh key={z} position={[0, 0.028, z]} castShadow>
          <boxGeometry args={[0.55, 0.055, 0.07]} />
          <meshStandardMaterial color="#293748" metalness={0.5} />
        </mesh>
      ))}
    </group>
  );
}
