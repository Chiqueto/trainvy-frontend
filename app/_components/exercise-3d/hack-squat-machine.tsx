"use client";

import { forwardRef, useImperativeHandle, useRef } from "react";
import { RoundedBox } from "@react-three/drei";
import { Group, Quaternion, Vector3 } from "three";
import {
  getHackSquatPose,
  HACK_HIP_TOP,
  HACK_PLATE_CENTER,
  HACK_FOOT_ANGLE,
  HACK_RAIL_DIRECTION,
  HACK_TILT,
} from "./hack-squat-pose";

const v = (x: number, y: number, z: number) => new Vector3(x, y, z);
const top = getHackSquatPose(0);
const railStart = HACK_HIP_TOP.clone()
  .add(v(0, -Math.SQRT1_2, -Math.SQRT1_2).multiplyScalar(0.19))
  .addScaledVector(HACK_RAIL_DIRECTION, -0.65);
export interface HackSquatMachineHandle {
  update: (pose: ReturnType<typeof getHackSquatPose>) => void;
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

export const HackSquatMachine = forwardRef<HackSquatMachineHandle>(
  function HackSquatMachine(_, ref) {
    const sled = useRef<Group>(null);
    useImperativeHandle(
      ref,
      () => ({
        update(pose) {
          sled.current?.position.copy(pose.bar).sub(HACK_HIP_TOP);
        },
      }),
      [],
    );
    return (
      <group>
        {[-0.5, 0.5].map((x) => (
          <group key={x}>
            <Beam a={v(x, 0.06, -1.22)} b={v(x, 0.06, 0.88)} width={0.1} />
            <Beam
              a={railStart.clone().setX(x)}
              b={railStart
                .clone()
                .addScaledVector(HACK_RAIL_DIRECTION, 1.85)
                .setX(x)}
              width={0.055}
            />
            <Beam
              a={v(x, 0.06, -1.18)}
              b={railStart
                .clone()
                .addScaledVector(HACK_RAIL_DIRECTION, 1.85)
                .setX(x)}
              width={0.08}
            />
            <Beam a={v(x, 0.06, 0.65)} b={railStart.clone().setX(x)} />
            <mesh
              position={railStart
                .clone()
                .addScaledVector(HACK_RAIL_DIRECTION, 0.24)
                .setX(x)}
              quaternion={HACK_TILT}
              castShadow
            >
              <boxGeometry args={[0.12, 0.045, 0.14]} />
              <meshStandardMaterial
                color="#f97316"
                roughness={0.4}
                metalness={0.4}
              />
            </mesh>
          </group>
        ))}
        {[-1.18, 0.65].map((z) => (
          <Beam key={z} a={v(-0.5, 0.06, z)} b={v(0.5, 0.06, z)} width={0.1} />
        ))}
        <RoundedBox
          args={[0.88, 0.07, 0.7]}
          radius={0.015}
          position={HACK_PLATE_CENTER.clone().add(
            v(0, -0.035, 0).applyAxisAngle(v(1, 0, 0), HACK_FOOT_ANGLE),
          )}
          rotation={[HACK_FOOT_ANGLE, 0, 0]}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial
            color="#334155"
            roughness={0.8}
            metalness={0.4}
          />
        </RoundedBox>
        <group ref={sled}>
          <group position={HACK_HIP_TOP} quaternion={HACK_TILT}>
            <RoundedBox
              args={[0.37, 0.7, 0.08]}
              radius={0.025}
              position={[0, 0.35, -0.123]}
              castShadow
              receiveShadow
            >
              <meshStandardMaterial color="#182232" roughness={0.8} />
            </RoundedBox>
            <Beam
              a={v(-0.4, 0.65, -0.18)}
              b={v(0.4, 0.65, -0.18)}
              width={0.07}
            />
            <Beam
              a={v(-0.5, 0.15, -0.19)}
              b={v(0.5, 0.15, -0.19)}
              width={0.07}
            />
            {[-1, 1].map((side) => (
              <group key={side}>
                <Beam
                  a={v(side * 0.22, 0.65, -0.18)}
                  b={v(side * 0.22, 0.65, 0.09)}
                  width={0.06}
                />
                <RoundedBox
                  args={[0.13, 0.1, 0.28]}
                  radius={0.023}
                  position={[side * 0.22, 0.586, 0.03]}
                  castShadow
                  receiveShadow
                >
                  <meshStandardMaterial color="#182232" roughness={0.8} />
                </RoundedBox>
                <Beam
                  a={v(side * 0.4, 0.25, -0.19)}
                  b={v(side * 0.76, 0.25, -0.19)}
                  width={0.035}
                />
                {[0, 1].map((i) => (
                  <mesh
                    key={i}
                    position={[side * (0.61 + i * 0.055), 0.25, -0.19]}
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
          {top.limbs.map((limb) => (
            <group key={limb.side}>
              <Beam
                a={v(limb.side * 0.22, 0.65, 0.03)
                  .applyQuaternion(HACK_TILT)
                  .add(HACK_HIP_TOP)}
                b={limb.grip.clone().add(v(limb.side * 0.06, 0, 0))}
                width={0.025}
              />
              <group position={limb.grip} quaternion={limb.handRotation}>
                <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
                  <cylinderGeometry args={[0.014, 0.014, 0.13, 24]} />
                  <meshStandardMaterial color="#0f172a" roughness={0.85} />
                </mesh>
              </group>
            </group>
          ))}
        </group>
      </group>
    );
  },
);
