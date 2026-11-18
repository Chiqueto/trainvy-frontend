"use client";

import { forwardRef, useImperativeHandle, useRef } from "react";
import { Group, Mesh, Vector3 } from "three";
import type { UpperEquipmentHandle } from "./upper-exercise-equipment";

const pulley = new Vector3(0, 2.045, 0.64);
const up = new Vector3(0, 1, 0);
const tailLength = 0.39;
const sleeveHalfLength = 0.052;

function placeSegment(mesh: Mesh | null, from: Vector3, to: Vector3) {
  if (!mesh) return;
  const direction = to.clone().sub(from);
  mesh.position.copy(from).lerp(to, 0.5);
  mesh.scale.y = direction.length();
  mesh.quaternion.setFromUnitVectors(up, direction.normalize());
}

export function getRopePushdownAttachment(
  pose: Parameters<UpperEquipmentHandle["update"]>[0],
) {
  const ends = pose.limbs.map(({ grip, side, handRotation }) => {
    const axis = new Vector3(side, 0, 0).applyQuaternion(handRotation);
    return {
      top: grip.clone().addScaledVector(axis, sleeveHalfLength),
      stopper: grip.clone().addScaledVector(axis, -sleeveHalfLength),
      axis,
    };
  });
  const center = ends[0].top.clone().lerp(ends[1].top, 0.5);
  const halfWidth = ends[0].top.distanceTo(center);
  const towardPulley = pulley.clone().sub(center).setX(0).normalize();
  const junction = center.addScaledVector(
    towardPulley,
    Math.sqrt(tailLength ** 2 - halfWidth ** 2),
  );
  return { ends, junction };
}

export const RopePushdownMachine = forwardRef<UpperEquipmentHandle>(
  function RopePushdownMachine(_, ref) {
    const cable = useRef<Mesh>(null);
    const junction = useRef<Mesh>(null);
    const tails = useRef<(Mesh | null)[]>([]);
    const grips = useRef<(Group | null)[]>([]);

    useImperativeHandle(
      ref,
      () => ({
        update(pose) {
          const attachment = getRopePushdownAttachment(pose);
          placeSegment(cable.current, pulley, attachment.junction);
          junction.current?.position.copy(attachment.junction);
          attachment.ends.forEach(({ top, stopper, axis }, index) => {
            placeSegment(tails.current[index], attachment.junction, top);
            grips.current[index]?.position.copy(stopper);
            grips.current[index]?.quaternion.setFromUnitVectors(up, axis);
          });
        },
      }),
      [],
    );

    return (
      <group>
        <mesh position={[0.48, 1.07, 0.67]} castShadow>
          <boxGeometry args={[0.13, 2.14, 0.22]} />
          <meshStandardMaterial color="#293748" metalness={0.55} />
        </mesh>
        <mesh position={[0.25, 2.1, 0.66]} castShadow>
          <boxGeometry args={[0.55, 0.09, 0.18]} />
          <meshStandardMaterial color="#293748" metalness={0.55} />
        </mesh>
        <mesh position={[0.38, 0.035, 0.7]} castShadow>
          <boxGeometry args={[0.67, 0.07, 0.5]} />
          <meshStandardMaterial color="#293748" metalness={0.55} />
        </mesh>
        <mesh position={[0, 2.085, 0.64]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.053, 0.053, 0.047, 20]} />
          <meshStandardMaterial color="#121823" metalness={0.4} />
        </mesh>
        <mesh ref={cable}>
          <cylinderGeometry args={[0.004, 0.004, 1, 10]} />
          <meshStandardMaterial color="#536273" metalness={0.65} />
        </mesh>
        <mesh ref={junction}>
          <sphereGeometry args={[0.017, 12, 12]} />
          <meshStandardMaterial color="#bfc5cc" metalness={0.75} />
        </mesh>
        {[0, 1].map((index) => (
          <group key={index}>
            <mesh
              ref={(node) => {
                tails.current[index] = node;
              }}
              castShadow
            >
              <cylinderGeometry args={[0.011, 0.011, 1, 12]} />
              <meshStandardMaterial color="#222d3c" roughness={0.92} />
            </mesh>
            <group
              ref={(node) => {
                grips.current[index] = node;
              }}
            >
              <mesh position={[0, sleeveHalfLength, 0]} castShadow>
                <cylinderGeometry
                  args={[0.011, 0.011, 2 * sleeveHalfLength, 12]}
                />
                <meshStandardMaterial color="#222d3c" roughness={0.92} />
              </mesh>
              <mesh castShadow>
                <cylinderGeometry args={[0.026, 0.031, 0.035, 18]} />
                <meshStandardMaterial color="#101521" roughness={0.85} />
              </mesh>
            </group>
          </group>
        ))}
      </group>
    );
  },
);
