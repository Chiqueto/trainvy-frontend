"""Author a retargetable surface atlas from the licensed local anatomical sources.
Run in Blender. The output asset is a CC BY-SA 4.0 adaptation of Z-Anatomy.
MakeHuman's CC0 head and Trainvy's equipment keep their original provenance.
"""
import bpy,bmesh,json,math
from pathlib import Path
from mathutils import Matrix,Vector
from mathutils.bvhtree import BVHTree

ROOT=Path(__file__).resolve().parents[1];POC=ROOT.parent/'trainvy-3d-poc';OUT=ROOT/'.tmp/anatomy-qa'
TERMS=('pectoralis major','deltoid muscle','biceps brachii','triceps brachii','brachialis muscle','coracobrachialis',
 'brachioradialis','pronator teres','supinator','extensor carpi','extensor digitorum','flexor carpi','flexor digitorum','palmaris longus',
 'rectus abdominis','external abdominal oblique','linea alba','serratus anterior','latissimus dorsi','trapezius muscle','rhomboid',
 'infraspinatus','teres major','teres minor','iliocostalis','longissimus thoracis','spinalis thoracis','sternocleidomastoid',
 'rectus femoris','vastus lateralis','vastus medialis','vastus intermedius','gluteus maximus','gluteus medius','adductor magnus',
 'adductor longus','adductor brevis','biceps femoris','semitendinosus','semimembranosus','sartorius','gracilis','tensor fasciae latae',
 'gastrocnemius','soleus','tibialis anterior','fibularis longus','fibularis brevis','extensor digitorum longus','calcaneal tendon')

def choose(name):
    n=name.lower()
    return not any(t in n for t in ('fascia','bursa','sheath','retinaculum')) and any(t in n for t in TERMS)

def bake(o,world):
    o.data=o.data.copy();o.parent=None;o.data.transform(world)
    if world.determinant()<0:o.data.flip_normals()
    o.matrix_world=Matrix.Identity(4)
    for f in o.data.polygons:f.use_smooth=True
    o.data.materials.clear()
    for mod in list(o.modifiers):o.modifiers.remove(mod)

def clip(o,axis,value,above=True):
    bm=bmesh.new();bm.from_mesh(o.data)
    normal=Vector((0,0,0));normal[axis]=1
    co=Vector((0,0,0));co[axis]=value
    bmesh.ops.bisect_plane(bm,geom=list(bm.verts)+list(bm.edges)+list(bm.faces),plane_co=co,plane_no=normal,dist=1e-6,clear_inner=above,clear_outer=not above)
    bm.to_mesh(o.data);bm.free()

def retarget(p,name):
    # Atlas is Z-up, anterior -Y. Output remains Blender Z-up and exports as glTF Y-up.
    x,z,front=p.x,p.z,-p.y;side=-1 if x<0 else 1;a=abs(x)
    y=z*.988-.0074;tx=x*1.10;tz=.12+front*.95
    n=name.lower()
    arm=any(t in n for t in ('biceps brachii','triceps brachii','brachialis','coracobrachialis','deltoid','brachioradialis','pronator','supinator','carpi','digitorum','palmaris','humerus','radius','ulna'))
    leg=z<1.0 and any(t in n for t in ('femor','femur','vastus','adductor','gluteus','semitendin','semimembr','sartorius','gracilis','tensor fasciae','gastrocnemius','soleus','tibia','fibula','calcaneal','patella'))
    if arm:
        t=max(0,min(1,(1.38-z)/.28));u=max(0,min(1,(1.10-z)/.265))
        tx+=side*(.006+.047*t-.030*u);tz+=.042-.004*t-.035*u
    if leg:
        t=max(0,min(1,(.88-z)/.45));u=max(0,min(1,(.43-z)/.375))
        tx+=side*(.035+.030*t+.020*u)
        tz+=-.04+.12*t-.155*u
    return Vector((tx,-tz,y))

bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.fbx(filepath=str(POC/'assets/poc06/z_anatomy/MuscularSystem100.fbx'),use_anim=False,use_custom_normals=False)
objects=[]
for o,world in [(o,o.matrix_world.copy()) for o in list(bpy.data.objects)]:
    if o.type!='MESH' or not choose(o.name):bpy.data.objects.remove(o,do_unlink=True);continue
    bake(o,world);objects.append(o)

# Expose the native rectus geometry beneath the external oblique's broad sheet.
recti=[o for o in objects if o.name.startswith('Rectus abdominis')]
trees=[BVHTree.FromPolygons([v.co for v in o.data.vertices],[list(p.vertices) for p in o.data.polygons]) for o in recti]
for o in objects:
    if not o.name.startswith('External abdominal oblique'):continue
    bm=bmesh.new();bm.from_mesh(o.data);remove=[]
    for f in bm.faces:
        c=f.calc_center_median()
        for tree in trees:
            hit,_,_,_=tree.ray_cast(Vector((c.x,-1,c.z)),Vector((0,1,0)),2)
            if hit is not None and c.y<hit.y+.002:remove.append(f);break
    bmesh.ops.delete(bm,geom=remove,context='FACES');bm.to_mesh(o.data);bm.free()

before=set(bpy.data.objects)
bpy.ops.import_scene.fbx(filepath=str(POC/'assets/poc06/z_anatomy/SkeletalSystem100.fbx'),use_anim=False,use_custom_normals=False)
for o,world in [(o,o.matrix_world.copy()) for o in bpy.data.objects if o not in before]:
    n=o.name
    choose_bone=n in ('Body of sternum','Manubrium of sternum','Xiphoid process') or (n.endswith(('.l','.r')) and '.j' not in n and any(n.startswith(t) for t in ('Clavicle.','Scapula.','Humerus.','Radius.','Ulna.','Femur.','Patella.','Tibia.','Fibula.')))
    if o.type!='MESH' or not choose_bone:bpy.data.objects.remove(o,do_unlink=True);continue
    bake(o,world);o.name='Bone_'+n;objects.append(o)

rows=[]
for o in objects:
    if any(t in o.name for t in ('carpi','digitorum','palmaris')):clip(o,2,.845,above=True)
    if o.name.startswith('Sternocleidomastoid'):clip(o,2,(1.46+.0074)/.988,above=False)
    for vertex in o.data.vertices:vertex.co=retarget(vertex.co,o.name)
    if 'abdom' in o.name.lower() or 'linea alba' in o.name.lower():clip(o,2,.975,above=True)
    if o.name.startswith('Bone_Femur'):clip(o,2,.80,above=False)
    # Preserve the source striations, relaxing only the coarsest atlas triangles.
    if len(o.data.polygons)>1400:
        dec=o.modifiers.new('Web surface budget','DECIMATE');dec.ratio=.22 if o.name.startswith('Bone_') else .34
        bpy.context.view_layer.objects.active=o;bpy.ops.object.modifier_apply(modifier=dec.name)
    rows.append({'name':o.name,'vertices':len(o.data.vertices),'faces':len(o.data.polygons)})

# Append the evaluated, unposed CC0 human face; preserve real eyelids and lips.
with bpy.data.libraries.load(str(POC/'scenes/trainvy_bench_press_poc04.blend'),link=False) as (src,dst):
    dst.objects=[n for n in src.objects if n in ('POC04_Human_hm08','POC04_Eyes_CC0')]
for o in dst.objects:
    bpy.context.scene.collection.objects.link(o)
    for mod in o.modifiers:
        if mod.type=='ARMATURE':mod.show_viewport=False;mod.show_render=False
        if mod.type=='SUBSURF':mod.levels=1;mod.render_levels=1
        if mod.type=='MASK':mod.show_viewport=True;mod.show_render=True
    deps=bpy.context.evaluated_depsgraph_get();deps.update()
    data=bpy.data.meshes.new_from_object(o.evaluated_get(deps));o.modifiers.clear();o.parent=None;o.data=data;o.matrix_world=Matrix.Identity(4)
    is_head='Human' in o.name
    o.name='Trainvy_Head' if is_head else 'Trainvy_Eyes'
    if is_head:clip(o,2,1.39,above=True)
    # Local MakeHuman coordinates are already metres, Z-up, anterior -Y.
    for vertex in o.data.vertices:vertex.co=Vector((vertex.co.x*.96,vertex.co.y-.12,vertex.co.z+.10))
    for poly in o.data.polygons:poly.use_smooth=True
    o.data.materials.clear();objects.append(o)

bpy.ops.object.select_all(action='DESELECT')
mat=bpy.data.materials.new('Trainvy atlas neutral');mat.diffuse_color=(.5,.48,.44,1)
for o in objects:o.select_set(True);o.data.materials.append(mat)
bpy.context.view_layer.objects.active=objects[0]
OUT.mkdir(exist_ok=True,parents=True)
bpy.ops.export_scene.gltf(filepath=str(OUT/'atlas-surfaces.glb'),export_format='GLB',use_selection=True,export_materials='EXPORT',export_yup=True)
(OUT/'atlas-surfaces.json').write_text(json.dumps(rows,indent=2))
print(json.dumps({'anatomical_structures':len(rows),'source_vertices':sum(o['vertices'] for o in rows)}))
