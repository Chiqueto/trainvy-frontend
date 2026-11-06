// @vitest-environment node
import { readFile } from "node:fs/promises";
import { beforeAll, describe, expect, it } from "vitest";
import { Bone, SkinnedMesh, Vector3 } from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "meshoptimizer";
import { ARM_LENGTH, FOREARM_LENGTH, createPoseDriver, getExercisePose, getExerciseDepth } from "../app/_components/exercise-3d/kinematics";
import { CALF_FOOT_CONTACT, CALF_TOE_PIVOT } from "../app/_components/exercise-3d/standing-calf-pose";
import { createStandingCalfMuscleMask } from "../app/_components/exercise-3d/standing-calf-muscles";
import { createGobletSumoDeadliftAttribute } from "../app/_components/exercise-3d/sumo-deadlift-muscles";
import { EXERCISE_ANIMATIONS, getExerciseAnimation } from "../app/_components/exercise-3d/exercises";
import calf from "../app/_components/exercise-3d/standing-calf-muscle-map.json";

let mesh: SkinnedMesh, apply: ReturnType<typeof createPoseDriver>;
beforeAll(async()=>{
  const b=await readFile(new URL("../public/models/exercise-3d/trainvy-athlete.glb",import.meta.url));
  const {scene}=await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),"");
  const bones=new Map<string,Bone>();
  scene.traverse(o=>{if(o instanceof Bone) bones.set(o.name,o);if(o instanceof SkinnedMesh)mesh=o;});
  apply=createPoseDriver(bones);
});
describe("standing calf raise machine",()=>{
  it("selects the exact machine variant, not seated or unilateral exercises",()=>{
    expect(getExerciseAnimation(EXERCISE_ANIMATIONS["standing-calf"].id)).toBe("standing-calf");
    expect(getExerciseAnimation(null,"Panturrilha em Pé")).toBe("standing-calf");
    expect(getExerciseAnimation(null,"Panturrilha Sentado")).toBe("seated-calf");
    expect(getExerciseAnimation(null,"Panturrilha Unilateral em Pé")).toBeNull();
  });
  it("keeps forefoot contact, bone lengths, straight knees and synchronized shoulder travel",()=>{
    const top=getExercisePose("standing-calf",0),bottom=getExercisePose("standing-calf",1);
    expect(top.limbs[0].ankle.y-bottom.limbs[0].ankle.y).toBeGreaterThan(0.08);
    for(let i=0;i<=100;i++){
      const pose=getExercisePose("standing-calf",i/100);
      for(const limb of pose.limbs){
        const contact=CALF_FOOT_CONTACT.clone().applyQuaternion(limb.footRotation).add(limb.ankle);
        expect(contact.distanceTo(CALF_TOE_PIVOT.clone().setX(limb.side*0.14))).toBeLessThan(1e-8);
        expect(limb.hip.distanceTo(limb.knee)).toBeCloseTo(0.44,7);
        expect(limb.knee.distanceTo(limb.ankle)).toBeCloseTo(0.42,7);
        expect(limb.shoulder.distanceTo(limb.elbow)).toBeCloseTo(ARM_LENGTH,7);
        expect(limb.elbow.distanceTo(limb.wrist)).toBeCloseTo(FOREARM_LENGTH,7);
        expect(limb.shoulder.y-pose.origin.y).toBeCloseTo(0.224,7);
      }
    }
    expect(getExerciseDepth(0.5)).toBe(1);
  });
  it("marks gastrocnemius and soleus on both sides independently of the packed neighboring masks",()=>{
    const mask=createStandingCalfMuscleMask(mesh.geometry),packed=createGobletSumoDeadliftAttribute(mesh.geometry);
    for(const label of ["Lateral_head_of_gastrocnemius","Medial_head_of_gastrocnemius","Soleus_muscle"])for(const side of ["l","r"]){
      const surface=calf.selections.find(s=>s.name===label+side)!;
      expect(surface.confidence).toBeGreaterThanOrEqual(0.8);
      expect(mask.getX(surface.indices[0])).toBe(1);
    }
    expect(packed.itemSize).toBe(4);
    for(let i=0;i<mask.count;i++)expect(packed.getZ(i)).toBe(mask.getX(i));
  });
  it("keeps the skinned model finite throughout the motion",()=>{
    for(const d of [0,0.25,0.5,0.75,1]){
      apply("standing-calf",d);mesh.parent!.updateMatrixWorld(true);mesh.skeleton.update();
      for(let i=0;i<mesh.geometry.attributes.position.count;i+=17) expect(mesh.getVertexPosition(i,new Vector3()).toArray().every(Number.isFinite)).toBe(true);
      const soles=[Infinity,Infinity];
      for(let i=0;i<mesh.geometry.attributes.position.count;i+=2){const p=mesh.getVertexPosition(i,new Vector3());if(Math.abs(p.x)<0.24&&p.z>0.14&&p.z<0.33&&p.y<0.25){const side=p.x<0?0:1;soles[side]=Math.min(soles[side],p.y);}}
      for(const sole of soles){expect(sole).toBeGreaterThan(0.175);expect(sole).toBeLessThan(0.185);}
    }
  });
});
