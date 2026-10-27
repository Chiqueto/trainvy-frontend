# Anatomical connections build input

`anatomical-connections.glb` adapts selected pelvic bones, lower abdominal muscles and
cervical muscles from **Z-Anatomy / BodyParts3D**. It is distributed under
**Creative Commons Attribution-ShareAlike 4.0 International (CC BY-SA 4.0)**.

Z-Anatomy anatomy/design/3D: Gauthier Kervyn. FBX distribution: Lluís Vinent Juanico.
Derived from BodyParts3D © The Database Center for Life Science / Kousaku Okubo.

Sources: https://github.com/LluisV/Z-Anatomy/tree/PC-Version/Resources/Models/FBX

Adaptations: selection from `SkeletalSystem100.fbx` and `MuscularSystem100.fbx`, conversion
to metres and the athlete's coordinate system, pelvic alignment, clipped abdominal and
cervical joins, welded vertices and recomputed normals. The original FBX SHA-256 hashes
are embedded in the GLB's metadata. No claim of original authorship is made for these surfaces.

Regeneration: `node scripts/prepare-anatomical-connections.mjs <SkeletalSystem100.fbx> <MuscularSystem100.fbx>`.
This is an offline build input. The application loads only the final compressed athlete GLB.

Complete credits: [model attribution](../../public/models/exercise-3d/ATTRIBUTION.md).
Full license: [CC BY-SA 4.0](../../public/models/exercise-3d/LICENSE-CC-BY-SA-4.0.txt).

`incline-muscle-map.json` is a CC BY-SA 4.0 semantic selection derived from the same
Z-Anatomy / BodyParts3D muscular source. It identifies bilateral clavicular heads
of pectoralis major, clavicular deltoid parts and all three triceps heads by source
labels and corresponding connected surfaces. The source checksum, match confidence
and checksum-bound v7 vertex membership are preserved in the file. This is a build
input; it is not an activation measurement or a map copied from another exercise.
`node scripts/add-incline-muscle-mask.mjs --apply` adds the Z mask while retaining
the original anatomical geometry and X/Y masks.
