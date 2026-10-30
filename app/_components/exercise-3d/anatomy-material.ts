import * as THREE from "three";
import type { ExerciseAnimation } from "./exercises";

export const ANATOMY_COLORS = {
  neutral: "#b5b3ac",
  primary: "#bd5148",
  secondary: "#d97d75",
} as const;

/** Local tissue shading; fibre coordinates stay attached to the skeleton. */
export function createTissueMaterial() {
  const material = new THREE.MeshPhysicalMaterial({
    color: "#ffffff",
    vertexColors: true,
    roughness: 0.51,
    metalness: 0,
    ior: 1.4,
    clearcoat: 0.035,
    clearcoatRoughness: 0.65,
    sheen: 0.09,
    sheenColor: new THREE.Color("#e6c7b4"),
    sheenRoughness: 0.85,
    specularIntensity: 0.3,
  });
  material.name = "Trainvy / satin anatomical tissue";
  material.defines = { ...material.defines, USE_UV1: "" };
  const uniforms = {
    exerciseMode: { value: 0 },
    highlightMuscles: { value: 1 },
    neutralTissue: { value: new THREE.Color(ANATOMY_COLORS.neutral) },
    primaryTissue: { value: new THREE.Color(ANATOMY_COLORS.primary) },
    secondaryTissue: { value: new THREE.Color(ANATOMY_COLORS.secondary) },
  };
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        `#include <common>
        attribute vec3 _exercisemuscles;
        attribute float _pecdeckmuscles;
        attribute float _flymuscles;
        varying float vFlyMuscles;
        attribute float _smithbenchmuscles;
        attribute float _machinechestpressmuscles;
        varying float vPecDeckMuscles;
        varying float vSmithBenchMuscles;
        varying float vMachineChestPressMuscles;
        attribute float _smithsquatmuscles;
        attribute float _legextensionmuscles;
        varying float vLegExtensionMuscles;
        attribute float _seatedlegcurlmuscles;
        varying float vSeatedLegCurlMuscles;
        attribute vec3 _lowerbodymuscles;
        varying float vLegPress45Muscles;
        varying float vHackSquatMuscles;
        varying float vProneLegCurlMuscles;
        varying float vSmithSquatMuscles;
        varying vec2 vTissue;
        varying vec2 vFibre;
        varying vec3 vExerciseMuscles;
        varying vec3 vRestSurface;`,
      )
      .replace(
        "#include <uv_vertex>",
        `#include <uv_vertex>
        vTissue = uv; vFibre = uv1; vFlyMuscles = _flymuscles; vLegExtensionMuscles = _legextensionmuscles; vSeatedLegCurlMuscles = _seatedlegcurlmuscles; vProneLegCurlMuscles = _lowerbodymuscles.x; vHackSquatMuscles = _lowerbodymuscles.y; vLegPress45Muscles = _lowerbodymuscles.z;
        vExerciseMuscles = _exercisemuscles; vPecDeckMuscles = _pecdeckmuscles; vSmithBenchMuscles = _smithbenchmuscles; vMachineChestPressMuscles = _machinechestpressmuscles; vSmithSquatMuscles = _smithsquatmuscles; vRestSurface = position;`,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
        varying vec2 vTissue; varying vec2 vFibre;
        varying vec3 vExerciseMuscles; varying vec3 vRestSurface;
        varying float vPecDeckMuscles; varying float vFlyMuscles; varying float vSmithBenchMuscles; varying float vMachineChestPressMuscles;
        varying float vSmithSquatMuscles; varying float vLegExtensionMuscles; varying float vSeatedLegCurlMuscles; varying float vProneLegCurlMuscles; varying float vHackSquatMuscles; varying float vLegPress45Muscles;
        uniform float exerciseMode; uniform float highlightMuscles;
        uniform vec3 neutralTissue; uniform vec3 primaryTissue; uniform vec3 secondaryTissue;`,
      )
      .replace(
        "#include <color_fragment>",
        `#include <color_fragment>
        float tissue = clamp(vTissue.y, 0.0, 1.0);
        float fibreAmount = clamp(vFibre.y, 0.0, 1.0);
        float fibreVisibility = 1.0 - smoothstep(0.65, 2.0, fwidth(vFibre.x));
        float strand = sin(vFibre.x + 0.26 * sin(vFibre.x * 0.17));
        float fascicle = sin(vFibre.x * 0.127 + sin(vFibre.x * 0.019));
        float inclineZ = vExerciseMuscles.z;
        if (exerciseMode > 1.5 && exerciseMode < 2.5 && vExerciseMuscles.y > 0.72 && inclineZ < 0.12) {
          inclineZ = 0.45;
        }
        float mask = exerciseMode < 0.5 ? vExerciseMuscles.x
          : exerciseMode < 1.5 ? vExerciseMuscles.y
          : exerciseMode < 2.5 ? inclineZ : 0.0;
        if (exerciseMode > 2.5 && exerciseMode < 3.5) {
          // Supino reto com halteres:
          // Motor primário: Peitoral maior (feixe esternocostal / médio e inferior) -> primaryTissue (0.95)
          // Sinergistas / Secundários: Peitoral superior (feixe clavicular), Tríceps braquial e Deltoide anterior -> secondaryTissue (0.45)
          if (vExerciseMuscles.y > 0.72 && vExerciseMuscles.z < 0.12) {
            mask = 0.95;
          } else if (vExerciseMuscles.z > 0.72) {
            mask = 0.45;
          } else if (vExerciseMuscles.y > 0.15) {
            mask = 0.45;
          } else {
            mask = 0.0;
          }
        }
        if (exerciseMode > 3.5 && exerciseMode < 4.5) mask = vPecDeckMuscles;
        if (exerciseMode > 4.5 && exerciseMode < 5.5) mask = vSmithBenchMuscles;
        if (exerciseMode > 5.5 && exerciseMode < 6.5) mask = vMachineChestPressMuscles;
        if (exerciseMode > 6.5 && exerciseMode < 7.5) mask = vFlyMuscles;
        if (exerciseMode > 7.5 && exerciseMode < 8.5) mask = vSmithSquatMuscles;
        if (exerciseMode > 8.5 && exerciseMode < 9.5) mask = vLegExtensionMuscles;
        if (exerciseMode > 9.5 && exerciseMode < 10.5) mask = vSeatedLegCurlMuscles;
        if (exerciseMode > 10.5 && exerciseMode < 11.5) mask = vProneLegCurlMuscles;
        if (exerciseMode > 11.5 && exerciseMode < 12.5) mask = vHackSquatMuscles;
        if (exerciseMode > 12.5 && exerciseMode < 13.5) mask = vLegPress45Muscles;
        float selected = smoothstep(0.12, 0.40, mask) * highlightMuscles;
        float primary = smoothstep(0.72, 0.93, mask);
        // Constant categorical colours, never a measurement of activation.
        vec3 highlighted = mix(secondaryTissue, primaryTissue, primary);
        vec3 anatomical = mix(neutralTissue, highlighted, selected);
        float relief = 1.0 - fibreAmount * (0.065 * fibreVisibility * strand + 0.022 * fascicle);
        diffuseColor.rgb = mix(diffuseColor.rgb, anatomical * relief, tissue);
        vec3 poreCoord = vRestSurface * 1900.0;
        float pores = sin(poreCoord.x + sin(poreCoord.y)) * sin(poreCoord.z + poreCoord.y * 0.73);
        float poreVisibility = 1.0 - smoothstep(0.45, 2.0, length(fwidth(poreCoord)));
        float tissueHeight = 0.00011 * fibreAmount * fibreVisibility * strand
          + 0.000018 * poreVisibility * pores;`,
      )
      .replace(
        "#include <normal_fragment_maps>",
        `#include <normal_fragment_maps>
        vec3 surfaceX = dFdx(-vViewPosition); vec3 surfaceY = dFdy(-vViewPosition);
        vec3 gradientX = cross(surfaceY, normal); vec3 gradientY = cross(normal, surfaceX);
        float determinant = dot(surfaceX, gradientX) * faceDirection;
        vec3 surfaceGradient = sign(determinant) *
          (dFdx(tissueHeight) * gradientX + dFdy(tissueHeight) * gradientY);
        normal = normalize(max(abs(determinant), 1e-8) * normal - surfaceGradient);`,
      )
      .replace(
        "#include <roughnessmap_fragment>",
        `#include <roughnessmap_fragment>
        roughnessFactor = clamp(roughnessFactor + 0.08 * (1.0 - fibreAmount)
          - 0.035 * fibreVisibility * strand * fibreAmount
          + (1.0-tissue) * (1.0-smoothstep(0.02,0.12,dot(diffuseColor.rgb,vec3(0.333)))) * 0.28, 0.38, 0.88);`,
      );
  };
  material.customProgramCacheKey = () => "trainvy-atelier-tissue-v15-leg-press-45";
  const setAppearance = (exercise: ExerciseAnimation, highlighted = true) => {
    const modes: Record<ExerciseAnimation, number> = {
      squat: 0,
      "bench-press": 1,
      "incline-dumbbell-press": 2,
      "flat-dumbbell-press": 3,
      "incline-bench-press": 2,
      "decline-bench-press": 3,
      "pec-deck": 4,
      "machine-fly": 7, // Same validated participants as dumbbell fly: pec, anterior deltoid, biceps.
      "smith-squat": 8,
      "leg-extension": 9,
      "seated-leg-curl": 10,
      "prone-leg-curl": 11,
      "hack-squat": 12,
      "leg-press-45": 13,
      "flat-dumbbell-fly": 7,
      "smith-bench-press": 5,
      "machine-chest-press": 6,
    };
    uniforms.exerciseMode.value = modes[exercise];
    uniforms.highlightMuscles.value = highlighted ? 1 : 0;
  };
  return { material, setAppearance };
}

