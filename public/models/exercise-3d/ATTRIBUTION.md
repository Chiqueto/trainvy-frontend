# Anatomical model provenance

## Current model — trainvy-athlete.glb

The current asset adapts the Z-Anatomy / BodyParts3D superficial muscular and skeletal surfaces.
Z-Anatomy anatomy/design/3D: **Gauthier Kervyn**. FBX distribution: **Lluís Vinent Juanico**.
Derived from **BodyParts3D © The Database Center for Life Science / Kousaku Okubo**.

Anatomical sources: https://github.com/LluisV/Z-Anatomy/tree/PC-Version/Resources/Models/FBX

The adapted GLB is distributed under **Creative Commons Attribution-ShareAlike 4.0 International**:
https://creativecommons.org/licenses/by-sa/4.0/
The full license is preserved in `LICENSE-CC-BY-SA-4.0.txt`, with upstream notices in `UPSTREAM-NOTICES.txt`.
This asset license does not change the license of the application code.

The head is adapted from MakeHuman hm08 / MPFB core assets (**CC0**).
Core asset license: https://static.makehumancommunity.org/about/license.html
The training shorts, neutral connective foundation, closed hands, footwear, anatomical rig, joint supports, fibre coordinates, exercise-specific
muscle masks, studio, equipment and materials are authored/adapted for Trainvy.

Changes: selection of superficial structures, local abdominal exposure, corrected reflected
normals, adaptive web decimation, neutral-pose retargeting, articulated skin weights, elbow
hip and shoulder support joints, original muscle-group highlighting, head fitting,
and meshopt compression. No claim of original authorship is made for the anatomical source meshes.
The complete structure list and asset SHA-256 are published in `model-manifest.json`.

Generation: `scripts/generate-anatomy-scaffold.mjs`, `scripts/build-anatomical-atlas.py`,
`scripts/anatomy-foundation.mjs`, `scripts/finalize-anatomical-atlas.mjs`. Build inputs are the licensed source assets retained
in the sibling `trainvy-3d-poc` project; the application loads only the self-contained output GLB.

## Previous model — anatomical-lifter.glb

The following notice is retained for the previous, source-derived prototype, which is no longer
loaded by the current viewer. It does not describe the head in `trainvy-athlete.glb`.

### Head model attribution

The head in `anatomical-lifter.glb` is adapted from **Superhero Male**, from **Universal Base Characters (Standard)** by **Quaternius**.

License: [CC0 1.0 Universal](https://creativecommons.org/publicdomain/zero/1.0/).

Author and pack: [Quaternius — Universal Base Characters](https://quaternius.com/packs/universalbasecharacters.html).

The source-preserving GLB conversion is from [programasweights/avatar](https://github.com/programasweights/avatar/blob/main/public/assets/character.glb).

Changes: the head, eyes and eyebrows are cropped from the character, resized, welded to the body's neck with shared normals, rendered in grayscale with a short hair cap and irises, and bound to the athlete's skeleton.

## Trainvy exercise prototype

Body mesh and anatomical material reused from the user's `digital-twin/first-app` project. The Trainvy derivative adds upper-arm, forearm and hand bones (13 bones total), reweights the arms, removes the hack-squat activation mask, and applies procedural free-squat/bench-press poses. Original head attribution and CC0 license above are preserved.
