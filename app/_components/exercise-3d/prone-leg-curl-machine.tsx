"use client";

import { forwardRef, useImperativeHandle, useRef } from "react";
import { RoundedBox } from "@react-three/drei";
import { Group, Quaternion, Vector3 } from "three";
import {
  getProneLegCurlPads,
  getProneLegCurlPose,
  getProneLegCurlRoller,
  getProneLegCurlLeverAngle,
  PRONE_CURL_KNEE,
  PRONE_CURL_PAD_ANGLE,
  PRONE_CURL_TORSO_PAD_ANGLE,
  PRONE_CURL_ROLLER_RADIUS,
} from "./prone-leg-curl-pose";

const pads = getProneLegCurlPads();
const extended = getProneLegCurlPose(1);
const radius = getProneLegCurlRoller(extended).distanceTo(PRONE_CURL_KNEE);

export interface ProneLegCurlMachineHandle {
  update: (pose: ReturnType<typeof getProneLegCurlPose>) => void;
}

function Beam({
  a,
  b,
  width = 0.05,
}: {
  a: Vector3;
  b: Vector3;
  width?: number;
}) {
  const direction = b.clone().sub(a);
  return (
    <mesh
      position={a.clone().lerp(b, 0.5)}
      quaternion={new Quaternion().setFromUnitVectors(
        new Vector3(0, 1, 0),
        direction.clone().normalize(),
      )}
      castShadow
    >
      <boxGeometry args={[width, direction.length(), width]} />
      <meshStandardMaterial color="#334155" metalness={0.65} roughness={0.3} />
    </mesh>
  );
}

export const ProneLegCurlMachine = forwardRef<ProneLegCurlMachineHandle>(
  function ProneLegCurlMachine(_, ref) {
    const lever = useRef<Group>(null),
      stack = useRef<Group>(null);
    useImperativeHandle(
      ref,
      () => ({
        update(pose) {
          if (lever.current)
            lever.current.rotation.x = getProneLegCurlLeverAngle(pose);
          if (stack.current)
            stack.current.position.y =
              (pose.limbs[0].ankle.y - extended.limbs[0].ankle.y) * 0.32;
        },
      }),
      [],
    );
    return (
      <group>
        {[-0.44, 0.48].map((z) => (
          <mesh key={z} position={[0.12, 0.055, z]} castShadow receiveShadow>
            <boxGeometry args={[1.02, 0.09, 0.14]} />
            <meshStandardMaterial
              color="#1e293b"
              metalness={0.55}
              roughness={0.4}
            />
          </mesh>
        ))}
        <Beam
          a={new Vector3(0, 0.12, -0.44)}
          b={new Vector3(0, 0.12, 0.48)}
          width={0.07}
        />
        {[-0.44, 0.48].map((z) => (
          <Beam
            key={z}
            a={new Vector3(0, 0.09, z)}
            b={new Vector3(0, z < 0 ? 0.55 : 0.43, z * 0.65)}
            width={0.08}
          />
        ))}
        <Beam
          a={new Vector3(0, 0.55, -0.3)}
          b={new Vector3(0, 0.43, 0.35)}
          width={0.08}
        />
        <RoundedBox
          args={[0.47, 0.08, 0.6]}
          radius={0.024}
          position={pads.torso}
          rotation={[PRONE_CURL_TORSO_PAD_ANGLE, 0, 0]}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial color="#182232" roughness={0.8} />
        </RoundedBox>
        <RoundedBox
          args={[0.47, 0.08, pads.thighLength]}
          radius={0.024}
          position={pads.thigh}
          rotation={[-PRONE_CURL_PAD_ANGLE, 0, 0]}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial color="#182232" roughness={0.8} />
        </RoundedBox>
        <RoundedBox
          args={[0.47, 0.08, pads.hipLength]}
          radius={0.018}
          position={pads.hip}
          rotation={[pads.hipAngle, 0, 0]}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial color="#182232" roughness={0.8} />
        </RoundedBox>
        {extended.limbs.map((limb) => (
          <group key={limb.side}>
            <Beam
              a={new Vector3(limb.side * 0.28, 0.44, 0.35)}
              b={limb.grip}
              width={0.025}
            />
            <mesh
              position={limb.grip}
              rotation={[0, 0, Math.PI / 2]}
              castShadow
            >
              <cylinderGeometry args={[0.016, 0.016, 0.14, 24]} />
              <meshStandardMaterial color="#0f172a" roughness={0.85} />
            </mesh>
            <Beam
              a={new Vector3(limb.side * 0.35, 0.12, -0.44)}
              b={PRONE_CURL_KNEE.clone().setX(limb.side * 0.35)}
            />
            <mesh
              position={PRONE_CURL_KNEE.clone().setX(limb.side * 0.35)}
              rotation={[0, 0, Math.PI / 2]}
              castShadow
            >
              <cylinderGeometry args={[0.053, 0.053, 0.075, 28]} />
              <meshStandardMaterial
                color="#f97316"
                metalness={0.5}
                roughness={0.35}
              />
            </mesh>
          </group>
        ))}
        <group ref={lever} position={PRONE_CURL_KNEE}>
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
                  PRONE_CURL_ROLLER_RADIUS,
                  PRONE_CURL_ROLLER_RADIUS,
                  0.23,
                  32,
                ]}
              />
              <meshStandardMaterial color="#182232" roughness={0.85} />
            </mesh>
          ))}
        </group>
        <Beam
          a={PRONE_CURL_KNEE.clone().setX(0.35)}
          b={PRONE_CURL_KNEE.clone().setX(0.66)}
          width={0.025}
        />
        <mesh
          position={PRONE_CURL_KNEE.clone().setX(0.66)}
          rotation={[0, 0, Math.PI / 2]}
        >
          <cylinderGeometry args={[0.12, 0.12, 0.035, 36]} />
          <meshStandardMaterial
            color="#475569"
            metalness={0.7}
            roughness={0.35}
          />
        </mesh>
        {[-0.35, -0.09].map((z) => (
          <Beam
            key={z}
            a={new Vector3(0.66, 0.1, z)}
            b={new Vector3(0.66, 1.26, z)}
            width={0.022}
          />
        ))}
        <Beam
          a={new Vector3(0.66, 1.26, -0.35)}
          b={new Vector3(0.66, 1.26, -0.09)}
        />
        <group ref={stack}>
          {Array.from({ length: 7 }, (_, i) => (
            <mesh key={i} position={[0.66, 0.16 + i * 0.035, -0.22]} castShadow>
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
          a={new Vector3(0.66, 1.07, -0.22)}
          b={PRONE_CURL_KNEE.clone()
            .setX(0.66)
            .add(new Vector3(0, 0.09, 0))}
          width={0.009}
        />
        <Beam
          a={new Vector3(0.66, 1.07, -0.22)}
          b={new Vector3(0.66, 0.52, -0.22)}
          width={0.009}
        />
      </group>
    );
  },
);
