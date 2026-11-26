import { ELEVATED_PUSH_UP_DECK_TOP } from "./elevated-push-up-pose";

const PAD_HEIGHT = 0.056;
const DECK_Z = 0.54;
const DECK_DEPTH = 0.42;
const DECK_WIDTH = 1.04;

/** Stable flat bench / elevated platform for incline hands-elevated push-ups. */
export function ElevatedPushUpBench() {
  const padCenterY = ELEVATED_PUSH_UP_DECK_TOP - PAD_HEIGHT / 2;
  const legHeight = ELEVATED_PUSH_UP_DECK_TOP - PAD_HEIGHT;

  return (
    <group aria-hidden="true">
      {/* Cushioned support deck */}
      <mesh
        position={[0, padCenterY, DECK_Z]}
        receiveShadow
        castShadow
      >
        <boxGeometry args={[DECK_WIDTH, PAD_HEIGHT, DECK_DEPTH]} />
        <meshStandardMaterial color="#1a212b" roughness={0.78} metalness={0.1} />
      </mesh>
      {/* Subtle front edge reference accent */}
      <mesh position={[0, ELEVATED_PUSH_UP_DECK_TOP + 0.0006, DECK_Z - DECK_DEPTH / 2 + 0.012]}>
        <boxGeometry args={[DECK_WIDTH - 0.04, 0.0012, 0.012]} />
        <meshStandardMaterial color="#e86a24" roughness={0.55} />
      </mesh>
      {/* Two steel support legs & floor feet */}
      {[-0.38, 0.38].map((x) => (
        <group key={x}>
          <mesh position={[x, legHeight / 2, DECK_Z]} castShadow receiveShadow>
            <boxGeometry args={[0.055, legHeight, 0.06]} />
            <meshStandardMaterial color="#252e3a" roughness={0.45} metalness={0.65} />
          </mesh>
          <mesh position={[x, 0.014, DECK_Z]} castShadow receiveShadow>
            <boxGeometry args={[0.07, 0.028, DECK_DEPTH + 0.08]} />
            <meshStandardMaterial color="#1f2733" roughness={0.5} metalness={0.6} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
