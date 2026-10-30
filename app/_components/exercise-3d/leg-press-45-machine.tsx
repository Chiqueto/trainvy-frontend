"use client";

import { forwardRef, useImperativeHandle, useRef } from "react";
import { RoundedBox } from "@react-three/drei";
import { Group, Quaternion, Vector3 } from "three";
import {
  LEG_PRESS_SEAT_CENTER,
  LEG_PRESS_SEAT_ANGLE,
  getLegPress45Pose,
  LEG_PRESS_HIP,
  LEG_PRESS_TILT,
  LEG_PRESS_FOOT_ANGLE,
  LEG_PRESS_PLATE_TOP,
  LEG_PRESS_RAIL,
} from "./leg-press-45-pose";

const v = (x: number, y: number, z: number) => new Vector3(x, y, z);
const top = getLegPress45Pose(0);
const railStart = LEG_PRESS_PLATE_TOP.clone().addScaledVector(
  LEG_PRESS_RAIL,
  -0.7,
);
export interface LegPress45MachineHandle {
  update: (pose: ReturnType<typeof getLegPress45Pose>) => void;
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

export const LegPress45Machine = forwardRef<LegPress45MachineHandle>(
  function LegPress45Machine(_, ref) {
    const sled = useRef<Group>(null);
    useImperativeHandle(
      ref,
      () => ({
        update(pose) {
          sled.current?.position.copy(pose.bar).sub(LEG_PRESS_PLATE_TOP);
        },
      }),
      [],
    );
    return (
      <group>
        {[-0.51, 0.51].map((x) => (
          <group key={x}>
            <Beam a={v(x, 0.06, -1.35)} b={v(x, 0.06, 0.9)} width={0.1} />
            <Beam
              a={railStart.clone().setX(x)}
              b={railStart.clone().addScaledVector(LEG_PRESS_RAIL, 1.6).setX(x)}
              width={0.055}
            />
            <Beam
              a={v(x, 0.06, 0.8)}
              b={railStart.clone().addScaledVector(LEG_PRESS_RAIL, 1.6).setX(x)}
              width={0.08}
            />
            <Beam a={v(x, 0.06, -0.6)} b={railStart.clone().setX(x)} />
            <mesh
              position={LEG_PRESS_PLATE_TOP.clone()
                .addScaledVector(LEG_PRESS_RAIL, -0.37)
                .setX(x)}
              rotation={[Math.PI / 4, 0, 0]}
              castShadow
            >
              <boxGeometry args={[0.13, 0.04, 0.14]} />
              <meshStandardMaterial
                color="#f97316"
                roughness={0.4}
                metalness={0.4}
              />
            </mesh>
          </group>
        ))}
        {[-1.22, 0.8].map((z) => (
          <Beam
            key={z}
            a={v(-0.51, 0.06, z)}
            b={v(0.51, 0.06, z)}
            width={0.1}
          />
        ))}
        <Beam a={v(0, 0.06, -1.22)} b={v(0, 0.7, -1.02)} width={0.08} />
        <Beam a={v(0, 0.06, -0.35)} b={v(0, 0.35, -0.5)} width={0.08} />
        <group position={LEG_PRESS_HIP} quaternion={LEG_PRESS_TILT}>
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
          position={LEG_PRESS_SEAT_CENTER}
          rotation={[LEG_PRESS_SEAT_ANGLE, 0, 0]}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial color="#182232" roughness={0.8} />
        </RoundedBox>
        {top.limbs.map((l) => (
          <group key={l.side}>
            <Beam
              a={v(l.side * 0.24, 0.35, -0.5)}
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
        <group ref={sled}>
          <RoundedBox
            args={[0.92, 0.07, 0.5]}
            radius={0.015}
            position={LEG_PRESS_PLATE_TOP.clone().add(v(0, 0, 0.035))}
            rotation={[LEG_PRESS_FOOT_ANGLE, 0, 0]}
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
            a={LEG_PRESS_PLATE_TOP.clone()
              .setX(-0.72)
              .addScaledVector(LEG_PRESS_RAIL, 0.08)}
            b={LEG_PRESS_PLATE_TOP.clone()
              .setX(0.72)
              .addScaledVector(LEG_PRESS_RAIL, 0.08)}
            width={0.035}
          />
          {[-1, 1].map((side) => (
            <group key={side}>
              <mesh
                position={LEG_PRESS_PLATE_TOP.clone().setX(side * 0.51)}
                rotation={[Math.PI / 4, 0, 0]}
                castShadow
              >
                <boxGeometry args={[0.11, 0.23, 0.12]} />
                <meshStandardMaterial
                  color="#64748b"
                  roughness={0.4}
                  metalness={0.7}
                />
              </mesh>
              {[0, 1].map((i) => (
                <mesh
                  key={i}
                  position={LEG_PRESS_PLATE_TOP.clone()
                    .setX(side * (0.61 + i * 0.055))
                    .addScaledVector(LEG_PRESS_RAIL, 0.08)}
                  rotation={[0, 0, Math.PI / 2]}
                  castShadow
                >
                  <cylinderGeometry args={[0.2, 0.2, 0.045, 48]} />
                  <meshStandardMaterial
                    color={i ? "#263244" : "#0f172a"}
                    metalness={0.55}
                    roughness={0.45}
                  />
                </mesh>
              ))}
            </group>
          ))}
        </group>
      </group>
    );
  },
);
