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
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.014, 0.014, 2.1, 20]} />
        <meshStandardMaterial
          color="#c7d0db"
          metalness={0.8}
          roughness={0.28}
        />
      </mesh>
      {[-1, 1].map((side) => (
        <group key={side} position={[side * 0.77, 0, 0]}>
          <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.19, 0.19, 0.07, 40]} />
            <meshStandardMaterial
              color="#ed7044"
              roughness={0.65}
              metalness={0.15}
            />
          </mesh>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.045, 0.045, 0.09, 24]} />
            <meshStandardMaterial
              color="#bcc8d8"
              metalness={0.8}
              roughness={0.25}
            />
          </mesh>
          <mesh position={[side * 0.065, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.032, 0.032, 0.04, 16]} />
            <meshStandardMaterial color="#202733" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Bench() {
  return (
    <group>
      <mesh position={[0, 0.4, 0.08]} castShadow receiveShadow>
        <boxGeometry args={[0.29, 0.09, 1.23]} />
        <meshStandardMaterial color="#263245" roughness={0.9} />
      </mesh>
      {[-0.36, 0.48].map((z) => (
        <group key={z}>
          <mesh position={[0, 0.2, z]} castShadow>
            <boxGeometry args={[0.08, 0.36, 0.08]} />
            <meshStandardMaterial
              color="#77859a"
              metalness={0.65}
              roughness={0.35}
            />
          </mesh>
          <mesh position={[0, 0.035, z]} castShadow>
            <boxGeometry args={[0.55, 0.07, 0.16]} />
            <meshStandardMaterial color="#303b4b" />
          </mesh>
        </group>
      ))}
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

function CameraView({
  view,
  exercise,
  revision,
}: Pick<SceneProps, "view" | "exercise" | "revision">) {
  const { camera, invalidate } = useThree();
  useEffect(() => {
    camera.position.set(
      ...((view === "front"
        ? exercise === "bench-press"
          ? [0, 3.8, 0]
          : [0, 1.1, 3.8]
        : view === "side"
          ? [3.8, 1.2, 0]
          : [2.8, 1.9, 3.3]) as [number, number, number]),
    );
    camera.lookAt(0, exercise === "squat" ? 0.85 : 0.6, 0);
    invalidate();
  }, [camera, exercise, view, invalidate]);
  useEffect(() => {
    invalidate();
  }, [revision, invalidate]);
  return null;
}

export default function ExerciseScene(props: SceneProps) {
  const squat = props.exercise === "squat";
  const benchPress = props.exercise === "bench-press";
  const target: [number, number, number] = [0, squat ? 0.85 : 0.6, 0];
  const position: [number, number, number] =
    props.view === "front"
      ? squat
        ? [0, 1.1, 3.8]
        : [0, 3.8, 0]
      : props.view === "side"
        ? [3.8, 1.2, 0]
        : [2.8, 1.9, 3.3];
  return (
    <Canvas
      shadows
      dpr={[1, 1.5]}
      frameloop={props.playing ? "always" : "demand"}
      camera={{ position, fov: 38, near: 0.1, far: 30 }}
      gl={{ antialias: true, powerPreference: "low-power" }}
      fallback={
        <p className="p-6 text-sm text-white">
          O navegador não oferece suporte a 3D. Use as ilustrações do exercício.
        </p>
      }
    >
      <color attach="background" args={["#101722"]} />
      <hemisphereLight args={["#e2ecff", "#536277", 2]} />
      <directionalLight
        position={[3, 5, 4]}
        intensity={3}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-2}
        shadow-camera-right={2}
        shadow-camera-top={3}
        shadow-camera-bottom={-2}
        shadow-bias={-0.0005}
      />
      <directionalLight position={[-3, 3, -2]} intensity={2} color="#b0cfff" />
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.005, 0]}
        receiveShadow
      >
        <circleGeometry args={[4, 64]} />
        <meshStandardMaterial color="#192333" roughness={1} />
      </mesh>
      <gridHelper
        args={[8, 32, "#303f53", "#202d40"]}
        position={[0, 0.001, 0]}
      />
      {benchPress && <Bench />}
      <Suspense fallback={null}>
        <Athlete {...props} />
      </Suspense>
      <OrbitControls
        key={props.view}
        target={target}
        enablePan={false}
        minDistance={2}
        maxDistance={6}
        maxPolarAngle={Math.PI / 2 - 0.03}
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
