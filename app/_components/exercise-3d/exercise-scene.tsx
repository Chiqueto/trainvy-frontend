"use client";

import { Suspense, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import { Bone, Group, Skeleton, SkinnedMesh } from "three";
import { clone } from "three/addons/utils/SkeletonUtils.js";
import { createTissueMaterial } from "./anatomy-material";
import { createPoseDriver, getExerciseDepth } from "./kinematics";
import type { ExerciseAnimation } from "./exercises";

interface SceneProps {
  exercise: ExerciseAnimation;
  tick: (delta: number) => number;
  playing: boolean;
  view: "perspective" | "front" | "side";
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
            <meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.3} />
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
      <mesh position={[0, 0.42, 0.08]} castShadow receiveShadow>
        <boxGeometry args={[0.3, 0.08, 1.25]} />
        <meshStandardMaterial color="#182232" roughness={0.75} metalness={0.08} />
      </mesh>
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
            <meshStandardMaterial color="#1e293b" metalness={0.6} roughness={0.4} />
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
        <meshStandardMaterial color="#334155" metalness={0.75} roughness={0.3} />
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
        <meshStandardMaterial color="#111827" roughness={0.9} metalness={0.05} />
      </mesh>

      {/* Anel de destaque neon sutil (Laranja Trainvy) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.004, 0]}>
        <ringGeometry args={[1.88, 1.91, 64]} />
        <meshBasicMaterial color="#f97316" transparent opacity={0.65} />
      </mesh>

      {/* Anel interno de referência de postura */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.003, 0]}>
        <ringGeometry args={[1.2, 1.215, 64]} />
        <meshBasicMaterial color="#334155" transparent opacity={0.4} />
      </mesh>

      {/* Piso exterior suave e escurecido */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.025, 0]} receiveShadow>
        <circleGeometry args={[6, 48]} />
        <meshStandardMaterial color="#080c14" roughness={1} />
      </mesh>
    </group>
  );
}

/** Adapted from first-app/AnatomicalAvatar: isolated bones/material per mount. */
function Athlete({
  exercise,
  tick,
  onReady,
}: Pick<SceneProps, "exercise" | "tick" | "onReady">) {
  const { scene: source } = useGLTF(
    "/models/exercise-3d/anatomical-lifter.glb",
  );
  const bar = useRef<Group>(null);
  const rig = useMemo(() => {
    const scene = clone(source);
    const { material, setAppearance } = createTissueMaterial();
    const bones = new Map<string, Bone>();
    const skeletons = new Set<Skeleton>();
    scene.traverse((object) => {
      if (object instanceof Bone) bones.set(object.name, object);
      if (object instanceof SkinnedMesh) {
        object.material = material;
        object.castShadow = true;
        object.frustumCulled = false;
        skeletons.add(object.skeleton);
      }
    });
    setAppearance("athlete", 0.5, false, exercise);
    return { scene, material, skeletons, applyPose: createPoseDriver(bones) };
  }, [source, exercise]);
  useEffect(() => {
    onReady();
    return () => {
      rig.material.dispose();
      rig.skeletons.forEach((skeleton) => skeleton.dispose());
    };
  }, [rig, onReady]);
  useFrame((_, delta) => {
    const phase = tick(delta);
    const depth = getExerciseDepth(phase);
    const pose = rig.applyPose(exercise, depth);
    bar.current?.position.copy(pose.bar);
    rig.scene.updateMatrixWorld(true);
  });
  return (
    <>
      <primitive object={rig.scene} dispose={null} />
      <group ref={bar}>
        <Barbell />
      </group>
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
  view: "perspective" | "front" | "side",
): { position: [number, number, number]; target: [number, number, number] } {
  const squat = exercise === "squat";

  if (squat) {
    const target: [number, number, number] = [0, 0.82, 0];
    switch (view) {
      case "front":
        return { position: [0, 0.95, 2.55], target };
      case "side":
        return { position: [2.65, 0.9, 0], target };
      case "perspective":
      default:
        return { position: [1.85, 1.25, 2.2], target };
    }
  }

  // Supino reto: foco central no tórax e trajetória da barra
  const target: [number, number, number] = [0, 0.6, 0.05];
  switch (view) {
    case "front":
      // Vista frontal elevada em direção ao peitoral
      return { position: [0, 1.25, 2.15], target };
    case "side":
      // Vista lateral pura para avaliar trajetória vertical da barra
      return { position: [2.35, 0.78, 0.05], target };
    case "perspective":
    default:
      // Vista 3/4 dinâmica destacando peitoral e braços
      return { position: [1.75, 1.3, 1.65], target };
  }
}

function CameraView({
  view,
  exercise,
  revision,
}: Pick<SceneProps, "view" | "exercise" | "revision">) {
  const { camera, invalidate } = useThree();
  useEffect(() => {
    const { position, target } = getCameraParams(exercise, view);
    camera.position.set(...position);
    camera.lookAt(...target);
    invalidate();
  }, [camera, exercise, view, invalidate]);
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
      dpr={[1, 1.5]}
      frameloop={props.playing ? "always" : "demand"}
      camera={{ position, fov: 36, near: 0.1, far: 30 }}
      gl={{ antialias: true, powerPreference: "low-power" }}
      fallback={
        <p className="p-6 text-sm text-white">
          O navegador não oferece suporte a 3D. Use as ilustrações do exercício.
        </p>
      }
    >
      {/* Fundo do estúdio em tom escuro profundo de alto contraste */}
      <color attach="background" args={["#0b0f17"]} />

      {/* Iluminação ambiente equilibrada com luz de estúdio */}
      <hemisphereLight args={["#e2ecff", "#1e293b", 1.8]} />

      {/* Luz Principal Direcional (Key Light) com projeção de sombras refinadas */}
      <directionalLight
        position={[2.5, 4.5, 3.2]}
        intensity={2.8}
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
        intensity={2.2}
        color="#fed7aa"
      />

      {/* Luz de Preenchimento Suave Frontal (Soft Fill) */}
      <directionalLight
        position={[0, 1.4, 3.0]}
        intensity={0.9}
        color="#bfdbfe"
      />

      {/* Palco esportivo / Pódio de treino com iluminação */}
      <StudioPlatform />

      {/* Banco olímpico exclusivo para supino reto */}
      {benchPress && <Bench />}

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
        maxDistance={4.5}
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
