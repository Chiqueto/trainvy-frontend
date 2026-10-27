"""Render the actual posed GLB vertices for anatomical and skinning review."""
import bpy, math, sys
from pathlib import Path
from mathutils import Vector

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'.tmp/anatomy-qa'

def point_at(obj,target): obj.rotation_euler=(Vector(target)-obj.location).to_track_quat('-Z','Y').to_euler()

def render(name,back=False,close=False):
    bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
    bpy.ops.import_scene.gltf(filepath=str(OUT/(name+'.glb')))
    for obj in bpy.context.scene.objects:
        if obj.type!='MESH':continue
        for poly in obj.data.polygons:poly.use_smooth=True
        if obj.name.startswith('Trainvy'):
            mat=bpy.data.materials.new('Atelier satin tissue');mat.use_nodes=True
            nt=mat.node_tree;p=nt.nodes.get('Principled BSDF')
            p.inputs['Roughness'].default_value=.51;p.inputs['Specular IOR Level'].default_value=.3
            vertex=nt.nodes.new('ShaderNodeVertexColor');vertex.layer_name=obj.data.color_attributes[0].name
            nt.links.new(vertex.outputs['Color'],p.inputs['Base Color'])
            if len(obj.data.uv_layers)>1:
                uv=nt.nodes.new('ShaderNodeUVMap');uv.uv_map=obj.data.uv_layers[1].name
                sep=nt.nodes.new('ShaderNodeSeparateXYZ');nt.links.new(uv.outputs['UV'],sep.inputs[0])
                wave=nt.nodes.new('ShaderNodeMath');wave.operation='SINE';nt.links.new(sep.outputs['X'],wave.inputs[0])
                bump=nt.nodes.new('ShaderNodeBump');bump.inputs['Strength'].default_value=.22;bump.inputs['Distance'].default_value=.0002
                nt.links.new(wave.outputs[0],bump.inputs['Height']);nt.links.new(bump.outputs[0],p.inputs['Normal'])
            obj.data.materials.clear();obj.data.materials.append(mat)
    bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,-.003))
    floor=bpy.context.object;mat=bpy.data.materials.new('Charcoal');mat.diffuse_color=(.018,.025,.032,1);floor.data.materials.append(mat)
    scene=bpy.context.scene;scene.render.engine='BLENDER_EEVEE'
    scene.world.use_nodes=True;scene.world.node_tree.nodes['Background'].inputs[0].default_value=(.10,.13,.17,1);scene.world.node_tree.nodes['Background'].inputs[1].default_value=.3
    for loc,energy,size,color in [((-2,-3,4),420,3,(1,.92,.83)),((2,-1,2.5),90,2,(.83,.91,1)),((1,2,3),350,2,(.77,.86,1))]:
        data=bpy.data.lights.new('Softbox','AREA');data.energy=energy;data.shape='DISK';data.size=size;data.color=color
        obj=bpy.data.objects.new('Softbox',data);scene.collection.objects.link(obj);obj.location=loc;point_at(obj,(0,0,.9))
    bpy.ops.object.camera_add();cam=bpy.context.object
    bench=name.startswith('bench');target=(0,-.02,.63 if bench else .90)
    cam.location=(-2,3.5,1.7) if back else (2.2,-3.8,1.8)
    if close:target=(0,-.14,1.48);cam.location=(.65,-2.8,1.62)
    point_at(cam,target);cam.data.type='ORTHO';cam.data.ortho_scale=.65 if close else 2.05;scene.camera=cam
    scene.view_settings.view_transform='AgX';scene.view_settings.look='AgX - Medium High Contrast'
    scene.render.resolution_x=800;scene.render.resolution_y=900;scene.render.resolution_percentage=100
    scene.render.image_settings.file_format='PNG';scene.render.filepath=str(OUT/(name+('-back' if back else '-head' if close else '')+'.png'))
    bpy.ops.render.render(write_still=True)

args=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else []
for name in (args or ['squat-0','squat-1','bench-press-0','bench-press-1']):render(name)
if not args:render('squat-0',back=True);render('squat-0',close=True)
