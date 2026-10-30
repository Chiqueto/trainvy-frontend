"use client";

import { forwardRef, useImperativeHandle, useRef } from "react";
import { RoundedBox } from "@react-three/drei";
import { Group, Quaternion, Vector3 } from "three";
import {
  getHorizontalLegPressPose,
  HORIZONTAL_PRESS_HIP,
  HORIZONTAL_PRESS_TILT,
  HORIZONTAL_PRESS_FOOT_ANGLE,
  HORIZONTAL_PRESS_PLATE_TOP,
  HORIZONTAL_PRESS_SEAT_CENTER,
  HORIZONTAL_PRESS_SEAT_ANGLE,
} from "./horizontal-leg-press-pose";

const v = (x: number, y: number, z: number) => new Vector3(x, y, z);
const top = getHorizontalLegPressPose(0);
const bottom = getHorizontalLegPressPose(1);
export interface HorizontalLegPressMachineHandle {
  update: (pose: ReturnType<typeof getHorizontalLegPressPose>) => void;
}

function Beam({
  a,
  b,
  width = 0.06,
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
        v(0, 1, 0),
        direction.clone().normalize(),
      )}
      castShadow
    >
      <boxGeometry args={[width, direction.length(), width]} />
      <meshStandardMaterial color="#475569" metalness={0.7} roughness={0.3} />
    </mesh>
  );
}

export const HorizontalLegPressMachine =
  forwardRef<HorizontalLegPressMachineHandle>(
    function HorizontalLegPressMachine(_, ref) {
      const carriage = useRef<Group>(null),
        stack = useRef<Group>(null);
      useImperativeHandle(
        ref,
        () => ({
          update(pose) {
            carriage.current?.position
              .copy(pose.bar)
              .sub(HORIZONTAL_PRESS_PLATE_TOP);
            if (stack.current)
              stack.current.position.y = (pose.bar.z - bottom.bar.z) * 0.65;
          },
        }),
        [],
      );
      return (
        <group>
          {[-0.44, 0.44].map((x) => (
            <group key={x}>
              <Beam a={v(x, 0.06, -1.02)} b={v(x, 0.06, 1.02)} width={0.1} />
              <Beam a={v(x, 0.25, -0.03)} b={v(x, 0.25, 1.02)} width={0.05} />
              {[0, 0.96].map((z) => (
                <Beam key={z} a={v(x, 0.06, z)} b={v(x, 0.25, z)} />
              ))}
              <mesh position={[x, 0.25, 0.04]} castShadow>
                <boxGeometry args={[0.12, 0.09, 0.045]} />
                <meshStandardMaterial
                  color="#f97316"
                  roughness={0.5}
                  metalness={0.4}
                />
              </mesh>
            </group>
          ))}
          {[-0.95, 0.96].map((z) => (
            <Beam
              key={z}
              a={v(-0.44, 0.06, z)}
              b={v(0.91, 0.06, z)}
              width={0.09}
            />
          ))}
          <Beam a={v(0, 0.06, -0.75)} b={v(0, 0.5, -0.58)} width={0.08} />
          <Beam a={v(0, 0.06, -0.27)} b={v(0, 0.48, -0.35)} width={0.08} />
          <group
            position={HORIZONTAL_PRESS_HIP}
            quaternion={HORIZONTAL_PRESS_TILT}
          >
            <RoundedBox
              args={[0.39, 0.7, 0.08]}
              radius={0.025}
              position={[0, 0.38, -0.123]}
              castShadow
              receiveShadow
            >
              <meshStandardMaterial color="#182232" roughness={0.8} />
            </RoundedBox>
            <Beam a={v(0, 0.06, -0.19)} b={v(0, 0.73, -0.19)} width={0.065} />
          </group>
          <RoundedBox
            args={[0.48, 0.08, 0.32]}
            radius={0.025}
            position={HORIZONTAL_PRESS_SEAT_CENTER}
            rotation={[HORIZONTAL_PRESS_SEAT_ANGLE, 0, 0]}
            castShadow
            receiveShadow
          >
            <meshStandardMaterial color="#182232" roughness={0.8} />
          </RoundedBox>
          {top.limbs.map((l) => (
            <group key={l.side}>
              <Beam
                a={v(l.side * 0.24, 0.48, -0.45)}
                b={l.grip.clone().add(v(l.side * 0.07, 0, 0))}
                width={0.025}
              />
              <group position={l.grip} quaternion={l.handRotation}>
                <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
                  <cylinderGeometry args={[0.014, 0.014, 0.14, 24]} />
                  <meshStandardMaterial color="#0f172a" roughness={0.85} />
                </mesh>
              </group>
            </group>
          ))}
          <group ref={carriage}>
            <RoundedBox
              args={[0.84, 0.07, 0.52]}
              radius={0.015}
              position={HORIZONTAL_PRESS_PLATE_TOP.clone().add(v(0, 0, 0.035))}
              rotation={[HORIZONTAL_PRESS_FOOT_ANGLE, 0, 0]}
              castShadow
              receiveShadow
            >
              <meshStandardMaterial
                color="#334155"
                roughness={0.85}
                metalness={0.4}
              />
            </RoundedBox>
            <Beam
              a={v(0, 0.25, HORIZONTAL_PRESS_PLATE_TOP.z + 0.07)}
              b={HORIZONTAL_PRESS_PLATE_TOP.clone().add(v(0, 0, 0.07))}
              width={0.075}
            />
            <Beam
              a={v(-0.44, 0.25, HORIZONTAL_PRESS_PLATE_TOP.z + 0.07)}
              b={v(0.44, 0.25, HORIZONTAL_PRESS_PLATE_TOP.z + 0.07)}
              width={0.06}
            />
            {[-0.44, 0.44].map((x) => (
              <mesh
                key={x}
                position={[x, 0.25, HORIZONTAL_PRESS_PLATE_TOP.z + 0.07]}
                castShadow
              >
                <boxGeometry args={[0.11, 0.11, 0.22]} />
                <meshStandardMaterial
                  color="#64748b"
                  roughness={0.4}
                  metalness={0.7}
                />
              </mesh>
            ))}
          </group>
          <Beam a={v(0.76, 0.06, -0.02)} b={v(0.76, 0.06, 0.96)} width={0.11} />
          {[-0.02, 0.9].map((z) => (
            <Beam
              key={z}
              a={v(0.76, 0.06, z)}
              b={v(0.76, 1.5, z)}
              width={0.065}
            />
          ))}
          <Beam a={v(0.76, 1.5, -0.02)} b={v(0.76, 1.5, 0.9)} width={0.065} />
          {[-0.02, 0.9].map((z) => (
            <mesh key={z} position={[0.76, 0.77, z]} castShadow>
              <boxGeometry args={[0.3, 1.38, 0.04]} />
              <meshStandardMaterial
                color="#263244"
                roughness={0.55}
                metalness={0.3}
              />
            </mesh>
          ))}
          {[0.2, 0.68].map((z) => (
            <Beam
              key={z}
              a={v(0.76, 0.13, z)}
              b={v(0.76, 1.43, z)}
              width={0.018}
            />
          ))}
          <group ref={stack}>
            {Array.from({ length: 8 }, (_, i) => (
              <mesh
                key={i}
                position={[0.76, 0.17 + i * 0.036, 0.44]}
                castShadow
              >
                <boxGeometry args={[0.26, 0.028, 0.54]} />
                <meshStandardMaterial
                  color={i === 7 ? "#f97316" : "#334155"}
                  roughness={0.5}
                  metalness={0.5}
                />
              </mesh>
            ))}
          </group>
          {/* Transmission is enclosed; weights illustrate travel, not a force simulation. */}
          <mesh position={[0.3, 0.14, 0.45]} castShadow>
            <boxGeometry args={[0.85, 0.13, 0.92]} />
            <meshStandardMaterial
              color="#1e293b"
              roughness={0.6}
              metalness={0.4}
            />
          </mesh>
        </group>
      );
    },
  );
