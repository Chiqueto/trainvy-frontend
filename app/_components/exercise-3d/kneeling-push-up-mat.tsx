"use client";

import { KNEELING_PUSH_UP_MAT_TOP } from "./kneeling-push-up-pose";

export function KneelingPushUpMat() {
  return (
    <group>
      <mesh position={[0, KNEELING_PUSH_UP_MAT_TOP / 2, 0.08]} receiveShadow>
        <boxGeometry args={[0.84, KNEELING_PUSH_UP_MAT_TOP, 1.56]} />
        <meshStandardMaterial color="#161f2c" roughness={0.9} metalness={0.05} />
      </mesh>
      <mesh position={[0, KNEELING_PUSH_UP_MAT_TOP + 0.0005, -0.66]}>
        <boxGeometry args={[0.84, 0.001, 0.012]} />
        <meshStandardMaterial color="#f97316" roughness={0.5} />
      </mesh>
    </group>
  );
}
