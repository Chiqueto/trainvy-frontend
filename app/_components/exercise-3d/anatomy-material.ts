import * as THREE from "three";
type AvatarMode = "athlete" | "cyber" | "heatmap";

export function createTissueMaterial() {
  const material = new THREE.MeshPhysicalMaterial({
    color: "#ffffff",
    vertexColors: true,
    roughness: 0.54,
    metalness: 0,
    clearcoat: 0.12,
    clearcoatRoughness: 0.58,
    sheen: 0.18,
    sheenColor: new THREE.Color("#b07766"),
    sheenRoughness: 0.8,
    specularIntensity: 0.38,
  });
  material.defines = { ...material.defines, USE_UV1: "" };
  const uniforms = {
    anatomyMode: { value: 0 },
    exerciseMode: { value: 0 },
    squatDepth: { value: 0 },
  };

  // UVs carry muscle activation and a tissue mask. Appearance changes keep
  // the sculpted geometry and skinning intact.
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        "#include <common>\nattribute vec3 _exercisemuscles;\nvarying vec2 vAnatomy;\nvarying vec2 vMuscleDetail;\nvarying vec3 vExerciseMuscles;",
      )
      .replace(
        "#include <uv_vertex>",
        "#include <uv_vertex>\nvAnatomy = uv;\nvMuscleDetail = uv1;\nvExerciseMuscles = _exercisemuscles;",
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
        varying vec2 vAnatomy;
        varying vec2 vMuscleDetail;
        varying vec3 vExerciseMuscles;
        uniform float anatomyMode;
        uniform float exerciseMode;
        uniform float squatDepth;
        vec3 activationColor(float t) {
          vec3 cool = mix(vec3(0.025, 0.19, 0.29), vec3(0.025, 0.63, 0.66), smoothstep(0.0, 0.35, t));
          vec3 warm = mix(vec3(0.77, 0.57, 0.08), vec3(0.84, 0.075, 0.035), smoothstep(0.65, 1.0, t));
          return mix(cool, warm, smoothstep(0.3, 0.7, t));
        }
      `,
      )
      .replace(
        "#include <normal_fragment_maps>",
        `#include <normal_fragment_maps>
        // Surface-gradient relief in metres; no added tessellation or texture
        // fetches. The baked fibre frame follows skeletal deformation.
        float fibreHeight = 0.00012 * vMuscleDetail.y * strandVisibility * strand;
        vec3 surfaceX = dFdx(-vViewPosition);
        vec3 surfaceY = dFdy(-vViewPosition);
        vec3 gradientX = cross(surfaceY, normal);
        vec3 gradientY = cross(normal, surfaceX);
        float determinant = dot(surfaceX, gradientX) * faceDirection;
        vec3 surfaceGradient = sign(determinant) * (dFdx(fibreHeight) * gradientX + dFdy(fibreHeight) * gradientY);
        normal = normalize(max(abs(determinant), 1e-8) * normal - surfaceGradient);
      `,
      )
      .replace(
        "#include <color_fragment>",
        `#include <color_fragment>
        float tissueBlend = clamp(vAnatomy.y, 0.0, 1.0);
        if (tissueBlend > 0.0) {
          float detail = clamp(dot(vColor.rgb, vec3(0.2126, 0.7152, 0.0722)) * 0.35 + 0.78, 0.78, 1.0);
          vec3 tissueColor;
          if (anatomyMode > 1.5) {
            float activation = vAnatomy.x * (0.22 + 0.78 * squatDepth);
            tissueColor = activationColor(activation) * detail;
          } else if (anatomyMode > 0.5) {
            tissueColor = mix(vec3(0.26, 0.34, 0.41), vec3(0.55, 0.66, 0.71), vAnatomy.x) * detail;
          } else {
            // Highlight only vertices explicitly marked for this exercise.
            // Other muscles, stabilisers and tendons retain the neutral tint.
            float exerciseMask = exerciseMode < 0.5 ? vExerciseMuscles.x : (exerciseMode < 1.5 ? vExerciseMuscles.y : vExerciseMuscles.z);
            float workedMuscle = smoothstep(0.2, 0.5, exerciseMask) * smoothstep(0.08, 0.38, vMuscleDetail.y);
            vec3 neutralTissue = vec3(0.52, 0.54, 0.53) * detail;
            vec3 activeTissue = diffuseColor.rgb * (0.88 + 0.24 * squatDepth);
            tissueColor = mix(neutralTissue, activeTissue, workedMuscle);
          }
          diffuseColor.rgb = mix(diffuseColor.rgb, tissueColor, tissueBlend);
        }
        // Fade subpixel fibres to avoid shimmering while the camera moves.
        float strandVisibility = 1.0 - smoothstep(0.7, 2.5, fwidth(vMuscleDetail.x));
        float strand = sin(vMuscleDetail.x + 0.35 * sin(vMuscleDetail.x * 0.37));
        float fascicle = sin(vMuscleDetail.x * 0.19);
        diffuseColor.rgb *= 1.0 - vMuscleDetail.y * (0.13 * strandVisibility * (0.5 + 0.5 * strand) + 0.045 * (0.5 + 0.5 * fascicle));
      `,
      )
      .replace(
        "#include <roughnessmap_fragment>",
        `#include <roughnessmap_fragment>
        roughnessFactor = clamp(roughnessFactor + 0.1 * (1.0 - vMuscleDetail.y) - 0.04 * strandVisibility * strand * vMuscleDetail.y, 0.3, 0.85);
      `,
      );
  };
  material.customProgramCacheKey = () =>
    "anatomical-tissue-v14-exercise-muscles";
  const setAppearance = (
    mode: AvatarMode,
    progress: number,
    wireframe: boolean,
    exercise: "squat" | "bench-press",
  ) => {
    uniforms.anatomyMode.value =
      mode === "heatmap" ? 2 : mode === "cyber" ? 1 : 0;
    uniforms.squatDepth.value = progress;
    uniforms.exerciseMode.value =
      exercise === "bench-press" ? 1 : 0;
    material.wireframe = wireframe;
    material.metalness = mode === "cyber" ? 0.48 : 0;
  };
  return { material, setAppearance };
}
