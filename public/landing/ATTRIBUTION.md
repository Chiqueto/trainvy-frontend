# Trainvy landing page — movement preview

`movement-preview.webp` is a rendered preview of the existing Trainvy exercise
viewer and `public/models/exercise-3d/trainvy-athlete.glb`. No exercise, anatomy,
muscle mapping or kinematics was changed for this landing page.

Anatomy adapted from [Z-Anatomy](https://github.com/LluisV/Z-Anatomy), by
Gauthier Kervyn and Lluís Vinent Juanico, derived from BodyParts3D © The Database
Center for Life Science / Kousaku Okubo. Head based on MakeHuman assets (CC0).
Assembly, materials, rig, exercise pose and rendering: Trainvy.

The model and rendered preview are distributed under
[CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/).
See [full provenance](../models/exercise-3d/ATTRIBUTION.md) and the retained
[license](../models/exercise-3d/LICENSE-CC-BY-SA-4.0.txt).
This asset license does not change the application code's license.

Reproduce the preview with the frontend running on port 3100:

```sh
node scripts/landing-qa.mjs --poster
```

The script uses a disposable Chrome profile, captures the existing rendered
scene, and then runs the landing page browser checks. Chrome is required at the
Windows installation path declared in the script. Override the local server
origin with `QA_BASE_URL` if necessary.
