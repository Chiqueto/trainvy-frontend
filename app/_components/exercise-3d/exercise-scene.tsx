"use client";

import { Suspense, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  Environment,
  Lightformer,
  OrbitControls,
  RoundedBox,
  useGLTF,
} from "@react-three/drei";
import { Bone, Group, Skeleton, SkinnedMesh, type BufferGeometry } from "three";
import { createFlyMuscleMask } from "./fly-muscles";
import { createPecDeckMuscleMask } from "./pec-deck-muscles";
import { HipThrustBench, HipThrustBarPad } from "./hip-thrust-bench";
import { createSmithBenchMuscleMask } from "./smith-bench-muscles";
import { SmithMachineFrame, SmithBarbell } from "./smith-machine";
import { PecDeckMachine, type PecDeckMachineHandle } from "./pec-deck-machine";
import { createMachineChestPressMuscleMask } from "./machine-chest-press-muscles";
import { MachineChestPress, type MachineChestPressHandle } from "./machine-chest-press";
import { createSmithSquatMuscleMask } from "./smith-squat-muscles";
import { LegExtensionMachine, type LegExtensionMachineHandle } from "./leg-extension-machine";
import { SeatedLegCurlMachine, type SeatedLegCurlMachineHandle } from "./seated-leg-curl-machine";
import { ProneLegCurlMachine, type ProneLegCurlMachineHandle } from "./prone-leg-curl-machine";
import { HackSquatMachine, type HackSquatMachineHandle } from "./hack-squat-machine";
import { LegPress45Machine, type LegPress45MachineHandle } from "./leg-press-45-machine";
import { HorizontalLegPressMachine, type HorizontalLegPressMachineHandle } from "./horizontal-leg-press-machine";
import { clone } from "three/addons/utils/SkeletonUtils.js";
import modelManifest from "../../../public/models/exercise-3d/model-manifest.json";
import { createLegDetailMuscleAttribute } from "./leg-detail-muscles";
import { createLowerBodyMuscleAttribute } from "./lower-body-muscles";
import { createTissueMaterial } from "./anatomy-material";
import {
  createPoseDriver,
  getExerciseDepth,
  INCLINE_BENCH_ANGLE,
  DECLINE_BENCH_ANGLE,
  DECLINE_ROLLER_RADIUS,
  getDeclineLegSupports,
} from "./kinematics";
import type { ExerciseAnimation } from "./exercises";

interface SceneProps {
  exercise: ExerciseAnimation;
  tick: (delta: number) => number;
  playing: boolean;
  view: "perspective" | "front" | "side" | "back";
  highlighted: boolean;
  onReady: () => void;
  onError: () => void;
  revision: number;
}

function Barbell() {
  return (
    <group>
      {/* Barra Olímpica cromada */}
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.014, 0.014, 2.2, 24]} />
        <meshStandardMaterial
          color="#d1d9e2"
          metalness={0.88}
          roughness={0.22}
        />
      </mesh>
      {/* Mangas e Anilhas de cada lado */}
      {[-1, 1].map((side) => (
        <group key={side} position={[side * 0.78, 0, 0]}>
          {/* Anilha Principal Olímpica (Laranja Trainvy) */}
          <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.2, 0.2, 0.06, 44]} />
            <meshStandardMaterial
              color="#f97316"
              roughness={0.5}
              metalness={0.2}
            />
          </mesh>
          {/* Relevo central da anilha */}
          <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.13, 0.13, 0.065, 36]} />
            <meshStandardMaterial
              color="#ea580c"
              roughness={0.6}
              metalness={0.15}
            />
          </mesh>
          {/* Anel central de aço */}
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.048, 0.048, 0.075, 24]} />
            <meshStandardMaterial
              color="#cbd5e1"
              metalness={0.85}
              roughness={0.2}
            />
          </mesh>
          {/* Presilha / Colarinho */}
          <mesh position={[side * 0.055, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.03, 0.03, 0.035, 20]} />
            <meshStandardMaterial
              color="#1e293b"
              metalness={0.7}
              roughness={0.3}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Bench() {
  return (
    <group>
      {/* Estofamento do Banco (Couro sintético esportivo premium) */}
      <RoundedBox
        args={[0.3, 0.08, 1.25]}
        radius={0.025}
        smoothness={4}
        position={[0, 0.42, 0.08]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial
          color="#182232"
          roughness={0.75}
          metalness={0.08}
        />
      </RoundedBox>
      {/* Friso estético central do estofado */}
      <mesh position={[0, 0.461, 0.08]}>
        <boxGeometry args={[0.015, 0.002, 1.2]} />
        <meshStandardMaterial color="#f97316" roughness={0.4} />
      </mesh>

      {/* Estrutura metálica de suporte */}
      {[-0.38, 0.5].map((z) => (
        <group key={z}>
          {/* Coluna vertical */}
          <mesh position={[0, 0.21, z]} castShadow>
            <boxGeometry args={[0.08, 0.38, 0.08]} />
            <meshStandardMaterial
              color="#334155"
              metalness={0.75}
              roughness={0.28}
            />
          </mesh>
          {/* Pés transversais com sapatas de borracha */}
          <mesh position={[0, 0.035, z]} castShadow>
            <boxGeometry args={[0.56, 0.07, 0.12]} />
            <meshStandardMaterial
              color="#1e293b"
              metalness={0.6}
              roughness={0.4}
            />
          </mesh>
          {/* Sapatas antiderrapantes nos extremos */}
          {[-0.26, 0.26].map((x) => (
            <mesh key={x} position={[x, 0.01, z]}>
              <boxGeometry args={[0.06, 0.02, 0.13]} />
              <meshStandardMaterial color="#0b0f17" roughness={0.9} />
            </mesh>
          ))}
        </group>
      ))}

      {/* Barra transversal de reforço */}
      <mesh position={[0, 0.12, 0.06]} castShadow>
        <boxGeometry args={[0.06, 0.06, 0.86]} />
        <meshStandardMaterial
          color="#334155"
          metalness={0.75}
          roughness={0.3}
        />
      </mesh>
    </group>
  );
}

function Dumbbell() {
  return (
    <group>
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.013, 0.013, 0.25, 20]} />
        <meshStandardMaterial
          color="#cbd5e1"
          metalness={0.85}
          roughness={0.3}
        />
      </mesh>
      {[-1, 1].map((side) => (
        <group key={side} position={[side * 0.105, 0, 0]}>
          <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.085, 0.085, 0.075, 6]} />
            <meshStandardMaterial
              color="#222c3c"
              roughness={0.7}
              metalness={0.15}
            />
          </mesh>
          <mesh position={[side * 0.04, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.045, 0.045, 0.008, 6]} />
            <meshStandardMaterial color="#f97316" roughness={0.6} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function InclineBench() {
  return (
    <group>
      <group position={[0, 0.4, 0.29]} rotation={[INCLINE_BENCH_ANGLE, 0, 0]}>
        <RoundedBox
          args={[0.3, 0.08, 0.92]}
          radius={0.025}
          smoothness={4}
          position={[0, 0, -0.46]}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial color="#182232" roughness={0.75} />
        </RoundedBox>
        <mesh position={[0, 0.041, -0.46]}>
          <boxGeometry args={[0.015, 0.002, 0.87]} />
          <meshStandardMaterial color="#f97316" />
        </mesh>
        <mesh position={[0, -0.075, -0.46]} castShadow>
          <boxGeometry args={[0.08, 0.06, 0.85]} />
          <meshStandardMaterial
            color="#334155"
            metalness={0.7}
            roughness={0.3}
          />
        </mesh>
      </group>
      <RoundedBox
        args={[0.3, 0.08, 0.34]}
        radius={0.025}
        smoothness={4}
        position={[0, 0.42, 0.49]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial color="#182232" roughness={0.75} />
      </RoundedBox>
      {[-0.27, 0.52].map((z) => (
        <group key={z}>
          <mesh position={[0, 0.21, z]} castShadow>
            <boxGeometry args={[0.08, 0.38, 0.08]} />
            <meshStandardMaterial
              color="#334155"
              metalness={0.7}
              roughness={0.3}
            />
          </mesh>
          <mesh position={[0, 0.035, z]} castShadow>
            <boxGeometry args={[0.6, 0.07, 0.13]} />
            <meshStandardMaterial color="#1e293b" roughness={0.6} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 0.46, -0.21]} rotation={[0.48, 0, 0]} castShadow>
        <boxGeometry args={[0.06, 0.75, 0.06]} />
        <meshStandardMaterial color="#334155" metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.12, 0.12]}>
        <boxGeometry args={[0.08, 0.06, 0.86]} />
        <meshStandardMaterial color="#334155" metalness={0.7} roughness={0.3} />
      </mesh>
    </group>
  );
}

function DeclineBench() {
  const { kneeRoller, ankleRoller } = getDeclineLegSupports();
  const supportRails = [
    { from: { y: 0.12, z: 0.38 }, to: kneeRoller },
    { from: kneeRoller, to: ankleRoller },
  ];
  return (
    <group>
      {/* Encosto Declinado a -18° */}
      <group position={[0, 0.44, 0.35]} rotation={[DECLINE_BENCH_ANGLE, 0, 0]}>
        <RoundedBox
          args={[0.3, 0.08, 1.15]}
          radius={0.025}
          smoothness={4}
          position={[0, 0, -0.52]}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial color="#182232" roughness={0.75} />
        </RoundedBox>
        {/* Friso central do estofado */}
        <mesh position={[0, 0.041, -0.52]}>
          <boxGeometry args={[0.015, 0.002, 1.1]} />
          <meshStandardMaterial color="#f97316" />
        </mesh>
        {/* Barra de reforço sob o estofado */}
        <mesh position={[0, -0.075, -0.52]} castShadow>
          <boxGeometry args={[0.08, 0.06, 1.08]} />
          <meshStandardMaterial
            color="#334155"
            metalness={0.7}
            roughness={0.3}
          />
        </mesh>
      </group>

      {/* Upper rollers support the back of the bent knees. */}
      <mesh position={kneeRoller} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.018, 0.018, 0.48, 24]} />
        <meshStandardMaterial
          color="#334155"
          metalness={0.75}
          roughness={0.25}
        />
      </mesh>
      {[-1, 1].map((side) => (
        <group key={side} position={[side * 0.16, kneeRoller.y, kneeRoller.z]}>
          <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry
              args={[DECLINE_ROLLER_RADIUS, DECLINE_ROLLER_RADIUS, 0.16, 24]}
            />
            <meshStandardMaterial color="#182232" roughness={0.8} />
          </mesh>
          <mesh position={[side * 0.085, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.025, 0.025, 0.015, 20]} />
            <meshStandardMaterial color="#f97316" roughness={0.5} />
          </mesh>
        </group>
      ))}

      {/* Lower rollers retain the insteps, above the feet, rather than below the soles. */}
      <mesh position={ankleRoller} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.018, 0.018, 0.48, 24]} />
        <meshStandardMaterial
          color="#334155"
          metalness={0.75}
          roughness={0.25}
        />
      </mesh>
      {[-1, 1].map((side) => (
        <group
          key={side}
          position={[side * 0.16, ankleRoller.y, ankleRoller.z]}
        >
          <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry
              args={[DECLINE_ROLLER_RADIUS, DECLINE_ROLLER_RADIUS, 0.16, 24]}
            />
            <meshStandardMaterial color="#182232" roughness={0.8} />
          </mesh>
          <mesh position={[side * 0.085, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.025, 0.025, 0.015, 20]} />
            <meshStandardMaterial color="#f97316" roughness={0.5} />
          </mesh>
        </group>
      ))}

      {/* Connect both roller axes to the bench frame, between the legs. */}
      {supportRails.map(({ from, to }, index) => (
        <mesh
          key={index}
          position={[0, (from.y + to.y) / 2, (from.z + to.z) / 2]}
          rotation={[Math.atan2(to.z - from.z, to.y - from.y), 0, 0]}
          castShadow
        >
          <boxGeometry
            args={[0.045, Math.hypot(to.y - from.y, to.z - from.z), 0.045]}
          />
          <meshStandardMaterial
            color="#334155"
            metalness={0.7}
            roughness={0.3}
          />
        </mesh>
      ))}

      {/* Colunas verticais e pés metálicos */}
      {[-0.45, 0.38].map((z, idx) => (
        <group key={z}>
          <mesh position={[0, idx === 0 ? 0.12 : 0.22, z]} castShadow>
            <boxGeometry args={[0.08, idx === 0 ? 0.22 : 0.42, 0.08]} />
            <meshStandardMaterial
              color="#334155"
              metalness={0.7}
              roughness={0.3}
            />
          </mesh>
          <mesh position={[0, 0.035, z]} castShadow>
            <boxGeometry args={[0.6, 0.07, 0.13]} />
            <meshStandardMaterial color="#1e293b" roughness={0.6} />
          </mesh>
        </group>
      ))}

      {/* Barra transversal de base */}
      <mesh position={[0, 0.12, -0.04]} castShadow>
        <boxGeometry args={[0.08, 0.06, 0.9]} />
        <meshStandardMaterial color="#334155" metalness={0.7} roughness={0.3} />
      </mesh>
    </group>
  );
}

function StudioPlatform() {
  return (
    <group position={[0, 0, 0]}>
      {/* Base elevada do pódio esportivo */}
      <mesh position={[0, -0.015, 0]} receiveShadow>
        <cylinderGeometry args={[2.0, 2.05, 0.03, 64]} />
        <meshStandardMaterial color="#0f172a" roughness={0.8} metalness={0.2} />
      </mesh>

      {/* Plataforma de treino emborrachada antiderrapante */}
      <mesh position={[0, 0.001, 0]} receiveShadow>
        <cylinderGeometry args={[1.92, 1.92, 0.005, 64]} />
        <meshStandardMaterial
          color="#111827"
          roughness={0.9}
          metalness={0.05}
        />
      </mesh>

      {/* Anel de destaque neon sutil (Laranja Trainvy) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.004, 0]}>
        <ringGeometry args={[1.88, 1.91, 64]} />
        <meshBasicMaterial color="#8a979f" transparent opacity={0.1} />
      </mesh>

      {/* Anel interno de referência de postura */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.003, 0]}>
        <ringGeometry args={[1.2, 1.215, 64]} />
        <meshBasicMaterial color="#334155" transparent opacity={0.4} />
      </mesh>

      {/* Piso exterior suave e escurecido */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.025, 0]}
        receiveShadow
      >
        <circleGeometry args={[6, 48]} />
        <meshStandardMaterial color="#080c14" roughness={1} />
      </mesh>
    </group>
  );
}

/** Keep the authored skeleton and tissue material isolated for each viewer. */
function Athlete({
  exercise,
  tick,
  onReady,
  highlighted,
}: Pick<SceneProps, "exercise" | "tick" | "onReady" | "highlighted">) {
  const { scene: source } = useGLTF(
    `/models/exercise-3d/trainvy-athlete.glb?v=${modelManifest.sha256.slice(0, 12)}`,
    false,
    true,
  );
  const bar = useRef<Group>(null);
  const leftDumbbell = useRef<Group>(null);
  const rightDumbbell = useRef<Group>(null);
  const pecDeckMachine = useRef<PecDeckMachineHandle>(null);
  const machineChestPress = useRef<MachineChestPressHandle>(null);
  const legExtensionMachine = useRef<LegExtensionMachineHandle>(null);
  const seatedLegCurlMachine = useRef<SeatedLegCurlMachineHandle>(null);
  const horizontalLegPressMachine = useRef<HorizontalLegPressMachineHandle>(null);
  const legPress45Machine = useRef<LegPress45MachineHandle>(null);
  const hackSquatMachine = useRef<HackSquatMachineHandle>(null);
  const proneLegCurlMachine = useRef<ProneLegCurlMachineHandle>(null);
  const rig = useMemo(() => {
    const scene = clone(source);
    const { material, setAppearance } = createTissueMaterial();
    const bones = new Map<string, Bone>();
    const skeletons = new Set<Skeleton>();
    const geometries = new Set<BufferGeometry>();
    scene.traverse((object) => {
      if (object instanceof Bone) bones.set(object.name, object);
      if (object instanceof SkinnedMesh) {
        object.geometry = object.geometry.clone();
        object.geometry.setAttribute("_pecdeckmuscles",createPecDeckMuscleMask(object.geometry));
        object.geometry.setAttribute("_flymuscles", createFlyMuscleMask(object.geometry));
        object.geometry.setAttribute("_smithbenchmuscles", createSmithBenchMuscleMask(object.geometry));
        object.geometry.setAttribute("_machinechestpressmuscles", createMachineChestPressMuscleMask(object.geometry));
        object.geometry.setAttribute("_smithsquatmuscles",createSmithSquatMuscleMask(object.geometry));
        object.geometry.setAttribute("_legdetailmuscles", createLegDetailMuscleAttribute(object.geometry));
        object.geometry.setAttribute("_lowerbodymuscles", createLowerBodyMuscleAttribute(object.geometry));
        geometries.add(object.geometry);
        object.material = material;
        object.castShadow = true;
        object.frustumCulled = false;
        skeletons.add(object.skeleton);
      }
    });
    return {
      scene,
      material,
      setAppearance,
      skeletons,
      geometries,
      applyPose: createPoseDriver(bones),
    };
  }, [source]);
  const invalidate = useThree((state) => state.invalidate);
  useEffect(() => {
    rig.setAppearance(exercise, highlighted);
    invalidate();
  }, [rig, exercise, highlighted, invalidate]);
  useEffect(() => {
    onReady();
    return () => {
      rig.material.dispose();
      rig.skeletons.forEach((skeleton) => skeleton.dispose());
      rig.geometries.forEach(geometry=>geometry.dispose());
    };
  }, [rig, onReady]);
  useFrame((_, delta) => {
    const phase = tick(delta);
    const depth = getExerciseDepth(phase);
    const pose = rig.applyPose(exercise, depth);
    bar.current?.position.copy(pose.bar);
    leftDumbbell.current?.position.copy(pose.limbs[0].grip);
    rightDumbbell.current?.position.copy(pose.limbs[1].grip);
    leftDumbbell.current?.quaternion.copy(pose.limbs[0].handRotation);
    rightDumbbell.current?.quaternion.copy(pose.limbs[1].handRotation);
    pecDeckMachine.current?.update(pose);
    machineChestPress.current?.update(pose);
    legExtensionMachine.current?.update(pose);
    seatedLegCurlMachine.current?.update(pose);
    proneLegCurlMachine.current?.update(pose);
    hackSquatMachine.current?.update(pose);
    legPress45Machine.current?.update(pose);
    horizontalLegPressMachine.current?.update(pose);
    rig.scene.updateMatrixWorld(true);
  });
  return (
    <>
      <primitive object={rig.scene} dispose={null} />
      {exercise === "horizontal-leg-press" ? (
        <HorizontalLegPressMachine ref={horizontalLegPressMachine} />
      ) : exercise === "leg-press-45" ? (
        <LegPress45Machine ref={legPress45Machine} />
      ) : exercise === "hack-squat" ? (
        <HackSquatMachine ref={hackSquatMachine} />
      ) : exercise === "prone-leg-curl" ? (
        <ProneLegCurlMachine ref={proneLegCurlMachine} />
      ) : exercise === "seated-leg-curl" ? (
        <SeatedLegCurlMachine ref={seatedLegCurlMachine} />
      ) : exercise === "leg-extension" ? (
        <LegExtensionMachine ref={legExtensionMachine} />
      ) : exercise === "machine-chest-press" ? (
        <MachineChestPress ref={machineChestPress} />
      ) : exercise === "machine-fly" ? (
        <PecDeckMachine ref={pecDeckMachine} handGrips />
      ) : exercise === "pec-deck" ? (
        <PecDeckMachine ref={pecDeckMachine} />
      ) : exercise === "smith-bench-press" ? (
        <group ref={bar}>
          <SmithBarbell />
        </group>
      ) : exercise === "incline-dumbbell-press" || exercise === "flat-dumbbell-press" || exercise === "flat-dumbbell-fly" ? (
        <>
          <group ref={leftDumbbell}>
            <Dumbbell />
          </group>
          <group ref={rightDumbbell}>
            <Dumbbell />
          </group>
        </>
      ) : exercise === "smith-squat" ? (
        <group ref={bar}>
          <SmithBarbell />
        </group>
      ) : (
        <group ref={bar}>
          <Barbell />
          {exercise === "hip-thrust" && <HipThrustBarPad />}
        </group>
      )}
    </>
  );
}

function ContextMonitor({ onError }: { onError: () => void }) {
  const canvas = useThree((state) => state.gl.domElement);
  useEffect(() => {
    const lost = (event: Event) => {
      event.preventDefault();
      onError();
    };
    canvas.addEventListener("webglcontextlost", lost);
    return () => canvas.removeEventListener("webglcontextlost", lost);
  }, [canvas, onError]);
  return null;
}

function getCameraParams(
  exercise: ExerciseAnimation,
  view: SceneProps["view"],
): { position: [number, number, number]; target: [number, number, number] } {
  if (exercise === "hip-thrust") {
    const target: [number, number, number] = [0, 0.5, 0.05];
    switch (view) {
      case "front": return { position: [0, 2.2, 3.6], target };
      case "side": return { position: [-3.7, 1.4, 0.05], target };
      case "back": return { position: [-2.7, 0.35, -1.8], target };
      default: return { position: [-2.7, 1.9, 2.5], target };
    }
  }
  if (exercise === "stiff") {
    const target: [number, number, number] = [0, 0.9, 0.1];
    switch (view) {
      case "front": return { position: [0, 1.7, 4.3], target };
      case "side": return { position: [-4.1, 1.55, 0.1], target };
      case "back": return { position: [0, 1.8, -4.2], target };
      default: return { position: [-2.5, 1.65, 2.5], target };
    }
  }
  if (exercise === "horizontal-leg-press") {
    const target: [number, number, number] = [0.15, 0.82, 0.02];
    switch (view) {
      case "front": return { position: [0.15, 3.4, 3.2], target };
      case "side": return { position: [-3.7, 1.65, 0.02], target };
      case "back": return { position: [0.15, 2, -3.8], target };
      default: return { position: [-3.8, 1.9, 0.02], target };
    }
  }
  if (exercise === "leg-press-45") {
    const target: [number, number, number] = [0, 0.8, -0.25];
    switch (view) {
      case "front": return { position: [0, 3.44, -3.19], target };
      case "side": return { position: [-3.7, 1.5, -0.25], target };
      case "back": return { position: [0, 1.8, 3.8], target };
      default: return { position: [-3.6, 2.36, -1.87], target };
    }
  }
  if (exercise === "hack-squat") {
    const target: [number, number, number] = [0, 0.9, -0.12];
    switch (view) {
      case "front": return { position: [0, 1.7, 3.8], target };
      case "side": return { position: [-3.7, 1.5, -0.12], target };
      case "back": return { position: [0, 2, -3.8], target };
      default: return { position: [-2.8, 1.9, 3], target };
    }
  }
  if (exercise === "prone-leg-curl") {
    const target: [number,number,number]=[0.1,0.72,0];
    switch(view) {
      case "front": return {position:[0,1.6,3.6],target};
      case "side": return {position:[-3.5,1.2,0],target};
      case "back": return {position:[0,2,-3.5],target};
      default: return {position:[-2.5,1.8,-2.6],target};
    }
  }
  if (exercise === "leg-extension" || exercise === "seated-leg-curl") {
    const target: [number, number, number] = [0.12, 0.75, 0.3];
    switch (view) {
      case "front": return { position: [0.12, 1.25, 3.65], target };
      case "side": return { position: [-3.2, 1.15, 0.3], target };
      case "back": return { position: [-0.4, 1.6, -3.1], target };
      default: return { position: [-2.4, 1.8, 2.8], target };
    }
  }
  if(exercise === "pec-deck" || exercise === "machine-fly") {
    const target: [number,number,number]=[0,0.86,0.03];
    switch(view) {
      case "front": return {position:[0,1.15,3.8],target};
      case "side": return {position:[3.5,1.25,0.08],target};
      case "back": return {position:[-0.5,1.4,-3.5],target};
      default: return {position:[2.6,1.7,3.1],target};
    }
  }
  if (exercise === "smith-squat") {
    const target: [number, number, number] = [0, 0.85, 0];
    switch (view) {
      case "front":
        return { position: [0, 1.25, 3.4], target: [0, 0.9, 0] };
      case "side":
        return { position: [3.4, 1.1, 0], target };
      case "back":
        return { position: [-0.35, 1.35, -3.2], target };
      case "perspective":
      default:
        return { position: [2.3, 1.55, 2.7], target };
    }
  }

  const squat = exercise === "squat";

  if (squat) {
    const target: [number, number, number] = [0, 0.82, 0];
    switch (view) {
      case "front":
        return { position: [0, 1.15, 3.25], target: [0, 0.88, 0] };
      case "side":
        return { position: [3.0, 1.0, 0], target };
      case "back":
        return { position: [-0.35, 1.3, -3.0], target };
      case "perspective":
      default:
        return { position: [2.12, 1.4, 2.53], target };
    }
  }

  if (
    exercise === "incline-dumbbell-press" ||
    exercise === "incline-bench-press"
  ) {
    const target: [number, number, number] = [0, 0.72, 0.12];
    switch (view) {
      case "front":
        return { position: [0, 1.8, 3.6], target };
      case "side":
        return { position: [3.2, 1.1, 0.12], target };
      case "back":
        return { position: [-0.35, 2.0, -3.0], target };
      default:
        return { position: [2.6, 1.9, 2.6], target };
    }
  }

  if (exercise === "decline-bench-press") {
    // Centre the full supported pose, including the feet at the raised end.
    const target: [number, number, number] = [0, 0.52, 0.18];
    switch (view) {
      case "front":
        return { position: [0, 1.7, 3.0], target };
      case "side":
        return { position: [2.9, 0.9, 0.18], target };
      case "back":
        return { position: [-0.35, 1.8, -2.6], target };
      case "perspective":
      default:
        return { position: [2.4, 1.6, 2.2], target };
    }
  }

  if (exercise === "machine-chest-press") {
    const target: [number, number, number] = [0, 0.86, 0.05];
    switch (view) {
      case "front": return { position: [0, 1.15, 3.8], target };
      case "side": return { position: [3.5, 1.25, 0.08], target };
      case "back": return { position: [-0.5, 1.4, -3.5], target };
      default: return { position: [2.6, 1.7, 3.1], target };
    }
  }
  if (exercise === "smith-bench-press") {
    const target: [number, number, number] = [0, 0.72, 0.0];
    switch (view) {
      case "front":
        return { position: [0, 1.65, 3.4], target };
      case "side":
        return { position: [3.4, 1.05, 0.0], target };
      case "back":
        return { position: [-0.35, 1.9, -3.0], target };
      case "perspective":
      default:
        return { position: [2.5, 1.7, 2.5], target };
    }
  }

  // Supino reto (barra ou halteres): foco central no tórax e trajetória da carga
  const target: [number, number, number] = [0, 0.6, 0.05];
  switch (view) {
    case "front":
      // Vista frontal elevada em direção ao peitoral
      return { position: [0, 1.8, 3.1], target };
    case "side":
      // Vista lateral pura para avaliar trajetória vertical da barra
      return { position: [2.9, 1.0, 0.05], target };
    case "back":
      return { position: [-0.35, 1.9, -2.6], target };
    case "perspective":
    default:
      // Vista 3/4 dinâmica destacando peitoral e braços
      return { position: [2.35, 1.75, 2.3], target };
  }
}

function CameraView({
  view,
  exercise,
  revision,
}: Pick<SceneProps, "view" | "exercise" | "revision">) {
  const { camera, invalidate, size } = useThree();
  useEffect(() => {
    const { position, target } = getCameraParams(exercise, view);
    const fit = Math.max(1, Math.min(2.1, (size.height / size.width) * 1.15));
    for (let i = 0; i < 3; i++)
      position[i] = target[i] + (position[i] - target[i]) * fit;
    camera.position.set(...position);
    camera.lookAt(...target);
    invalidate();
  }, [camera, exercise, view, invalidate, size.width, size.height]);
  useEffect(() => {
    invalidate();
  }, [revision, invalidate]);
  return null;
}

export default function ExerciseScene(props: SceneProps) {
  const benchPress = props.exercise === "bench-press";
  const { position, target } = getCameraParams(props.exercise, props.view);

  return (
    <Canvas
      shadows
      dpr={[1, 1.75]}
      frameloop={props.playing ? "always" : "demand"}
      camera={{ position, fov: 36, near: 0.1, far: 30 }}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      fallback={
        <p className="p-6 text-sm text-white">
          O navegador não oferece suporte a 3D. Use as ilustrações do exercício.
        </p>
      }
    >
      {/* Fundo do estúdio em tom escuro profundo de alto contraste */}
      <color attach="background" args={["#0b0f17"]} />

      {/* Iluminação ambiente equilibrada com luz de estúdio */}
      <hemisphereLight args={["#e8e3dc", "#161c25", 0.55]} />

      {/* Luz Principal Direcional (Key Light) com projeção de sombras refinadas */}
      <directionalLight
        position={[2.5, 4.5, 3.2]}
        intensity={3.2}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-2.2}
        shadow-camera-right={2.2}
        shadow-camera-top={2.8}
        shadow-camera-bottom={-1.8}
        shadow-bias={-0.0004}
      />

      {/* Luz de Contorno (Rim Light / Backlight) dourada/âmbar para destacar fibras musculares */}
      <directionalLight
        position={[-2.8, 3.2, -2.6]}
        intensity={2.5}
        color="#d8e5f1"
      />

      {/* Luz de Preenchimento Suave Frontal (Soft Fill) */}
      <directionalLight
        position={[0, 1.4, 3.0]}
        intensity={0.7}
        color="#e5d9ca"
      />

      <Environment resolution={128} environmentIntensity={0.35}>
        <Lightformer
          form="rect"
          intensity={3}
          position={[-3, 3, 2]}
          scale={[3, 4, 1]}
          rotation={[0, Math.PI / 4, 0]}
        />
        <Lightformer
          form="rect"
          intensity={1.5}
          position={[3, 2, -2]}
          scale={[2, 4, 1]}
          rotation={[0, -Math.PI / 3, 0]}
        />
      </Environment>

      {/* Palco esportivo / Pódio de treino com iluminação */}
      <StudioPlatform />

      {/* Banco olímpico / plano para supino reto (barra ou halteres) */}
      {(benchPress || props.exercise === "flat-dumbbell-press" || props.exercise === "flat-dumbbell-fly" || props.exercise === "smith-bench-press") && <Bench />}
      {props.exercise === "smith-bench-press" && <SmithMachineFrame />}
      {(props.exercise === "incline-dumbbell-press" ||
        props.exercise === "incline-bench-press") && <InclineBench />}
      {props.exercise === "decline-bench-press" && <DeclineBench />}
      {props.exercise === "hip-thrust" && <HipThrustBench />}
      {props.exercise === "smith-squat" && <SmithMachineFrame />}

      <Suspense fallback={null}>
        <Athlete {...props} />
      </Suspense>

      <OrbitControls
        key={`${props.exercise}-${props.view}`}
        target={target}
        enablePan={false}
        enableDamping
        dampingFactor={0.07}
        rotateSpeed={0.85}
        minDistance={1.3}
        maxDistance={5.5}
        maxPolarAngle={Math.PI / 2 - 0.02}
        minPolarAngle={0.15}
      />
      <ContextMonitor onError={props.onError} />
      <CameraView
        view={props.view}
        exercise={props.exercise}
        revision={props.revision}
      />
    </Canvas>
  );
}
