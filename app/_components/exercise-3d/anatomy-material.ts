import * as THREE from "three";
import type { ExerciseAnimation } from "./exercises";

export const ANATOMY_COLORS = {
  neutral: "#b5b3ac",
  primary: "#bd5148",
  secondary: "#c99865",
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
        varying vec2 vTissue;
        varying vec2 vFibre;
        varying vec3 vExerciseMuscles;
        varying vec3 vRestSurface;`,
      )
      .replace(
        "#include <uv_vertex>",
        `#include <uv_vertex>
        vTissue = uv; vFibre = uv1;
        vExerciseMuscles = _exercisemuscles; vRestSurface = position;`,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
        varying vec2 vTissue; varying vec2 vFibre;
        varying vec3 vExerciseMuscles; varying vec3 vRestSurface;
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
        float mask = exerciseMode < 0.5 ? vExerciseMuscles.x : vExerciseMuscles.y;
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
  material.customProgramCacheKey = () => "trainvy-atelier-tissue-v2";
  const setAppearance = (exercise: ExerciseAnimation, highlighted = true) => {
    uniforms.exerciseMode.value = exercise === "bench-press" ? 1 : 0;
    uniforms.highlightMuscles.value = highlighted ? 1 : 0;
  };
  return { material, setAppearance };
}
