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
import { Bone, Group, Skeleton, SkinnedMesh } from "three";
import { clone } from "three/addons/utils/SkeletonUtils.js";
import modelManifest from "../../../public/models/exercise-3d/model-manifest.json";
import { createTissueMaterial } from "./anatomy-material";
import { createPoseDriver, getExerciseDepth } from "./kinematics";
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
    return {
      scene,
      material,
      setAppearance,
      skeletons,
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
  view: SceneProps["view"],
): { position: [number, number, number]; target: [number, number, number] } {
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

  // Supino reto: foco central no tórax e trajetória da barra
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
