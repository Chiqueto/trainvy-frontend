"use client";
import { forwardRef, useImperativeHandle, useRef } from "react";
import { Group } from "three";
import type { getStandingCalfPose } from "./standing-calf-pose";

export interface StandingCalfMachineHandle { update: (pose: ReturnType<typeof getStandingCalfPose>) => void }
export const StandingCalfMachine = forwardRef<StandingCalfMachineHandle>(function StandingCalfMachine(_, ref) {
  const moving = useRef<Group>(null);
  useImperativeHandle(ref, () => ({update(pose) { moving.current?.position.copy(pose.origin); }}), []);
  return <group>
    <mesh position={[0,0.055,-0.22]} castShadow receiveShadow><boxGeometry args={[1.15,0.11,0.45]}/><meshStandardMaterial color="#313b49" metalness={0.5} roughness={0.45}/></mesh>
    <mesh position={[0,0.12,0.235]} castShadow receiveShadow><boxGeometry args={[0.64,0.12,0.19]}/><meshStandardMaterial color="#596777" metalness={0.55} roughness={0.4}/></mesh>
    {[-1,1].map(side => <group key={side}>
      <mesh position={[side*0.43,1.04,-0.22]} castShadow><boxGeometry args={[0.075,1.96,0.075]}/><meshStandardMaterial color="#465467" metalness={0.65} roughness={0.35}/></mesh>
      <mesh position={[side*0.43,1.04,-0.11]}><cylinderGeometry args={[0.015,0.015,1.8,16]}/><meshStandardMaterial color="#b0bbc4" metalness={0.8} roughness={0.25}/></mesh>
    </group>)}
    <mesh position={[0,1.98,-0.22]}><boxGeometry args={[0.93,0.07,0.075]}/><meshStandardMaterial color="#465467" metalness={0.65} roughness={0.35}/></mesh>
    <group ref={moving}>
      <mesh position={[0,0.31,-0.10]}><boxGeometry args={[0.91,0.08,0.09]}/><meshStandardMaterial color="#465467" metalness={0.65} roughness={0.35}/></mesh>
      {[-1,1].map(side=><group key={side}>
        <mesh position={[side*0.215,0.30,0.13]} castShadow><boxGeometry args={[0.17,0.09,0.30]}/><meshStandardMaterial color="#252b35" roughness={0.65}/></mesh>
        <mesh position={[side*0.365,-0.01,0.34]}><cylinderGeometry args={[0.02,0.02,0.23,16]}/><meshStandardMaterial color="#252b35" roughness={0.6}/></mesh>
        <mesh position={[side*0.39,0.10,0.12]}><boxGeometry args={[0.04,0.4,0.04]}/><meshStandardMaterial color="#465467" metalness={0.65} roughness={0.35}/></mesh>
      </group>)}
    </group>
  </group>;
});
