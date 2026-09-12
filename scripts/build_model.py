from __future__ import annotations

import math
from pathlib import Path
import numpy as np
import trimesh
from trimesh.visual.material import PBRMaterial
from trimesh.visual.texture import TextureVisuals

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "models" / "lunev-one.glb"


def mat(name, color, metallic=0.0, roughness=0.5):
    return PBRMaterial(name=name, baseColorFactor=np.array(color, dtype=float), metallicFactor=float(metallic), roughnessFactor=float(roughness))

METAL = mat("LUNEV_Metal", [0.38,0.36,0.33,1], .88, .31)
TRIM = mat("LUNEV_Trim", [0.62,0.59,0.55,1], .92, .22)
SOFT = mat("LUNEV_Soft", [0.055,0.052,0.049,1], 0, .91)
DARK = mat("LUNEV_Dark", [0.025,0.024,0.023,1], .20, .52)
DRIVER = mat("LUNEV_Driver", [0.07,0.058,0.048,1], .62, .34)
ACCENT = mat("LUNEV_Accent", [0.30,0.20,0.13,1], .72, .29)


def apply_material(mesh, material):
    mesh.visual = TextureVisuals(material=material)
    return mesh


def rounded_rect_loop(w, h, r, seg=12):
    r=min(r,w/2-1e-6,h/2-1e-6)
    centers=[(w/2-r,h/2-r,0,math.pi/2),(-w/2+r,h/2-r,math.pi/2,math.pi),(-w/2+r,-h/2+r,math.pi,3*math.pi/2),(w/2-r,-h/2+r,3*math.pi/2,2*math.pi)]
    pts=[]
    for cx,cy,a0,a1 in centers:
        for a in np.linspace(a0,a1,seg,endpoint=False): pts.append([cx+r*math.cos(a),cy+r*math.sin(a)])
    return np.asarray(pts,float)


def extrude_loop(loop, depth, z0=0):
    n=len(loop); zf=z0+depth/2; zb=z0-depth/2
    front=np.column_stack([loop,np.full(n,zf)]); back=np.column_stack([loop,np.full(n,zb)])
    verts=np.vstack([front,back,[[0,0,zf]],[[0,0,zb]]]); cf=2*n; cb=2*n+1
    faces=[]
    for i in range(n):
        j=(i+1)%n
        faces += [[cf,i,j],[cb,n+j,n+i],[i,n+i,n+j],[i,n+j,j]]
    return trimesh.Trimesh(vertices=verts,faces=np.asarray(faces),process=True)


def rounded_box(w,h,d,r,material=METAL,z0=0,seg=12):
    return apply_material(extrude_loop(rounded_rect_loop(w,h,r,seg),d,z0),material)


def rounded_ring(ow,oh,iw,ih,depth,ro,ri,material=SOFT,z0=0,seg=14):
    outer=rounded_rect_loop(ow,oh,ro,seg); inner=rounded_rect_loop(iw,ih,ri,seg); n=len(outer)
    zf=z0+depth/2; zb=z0-depth/2
    verts=np.vstack([np.column_stack([outer,np.full(n,zf)]),np.column_stack([inner,np.full(n,zf)]),np.column_stack([outer,np.full(n,zb)]),np.column_stack([inner,np.full(n,zb)])])
    of,inf,ob,inb=0,n,2*n,3*n; faces=[]
    for i in range(n):
        j=(i+1)%n
        faces += [[of+i,of+j,inf+j],[of+i,inf+j,inf+i],[ob+i,inb+j,ob+j],[ob+i,inb+i,inb+j],[of+i,ob+i,ob+j],[of+i,ob+j,of+j],[inf+i,inf+j,inb+j],[inf+i,inb+j,inb+i]]
    return apply_material(trimesh.Trimesh(vertices=verts,faces=np.asarray(faces),process=True),material)


def arc_sweep(rx,ry,ybase,cross_w,cross_d,start=math.pi,end=0,steps=64,material=METAL):
    ts=np.linspace(start,end,steps); path=np.column_stack([rx*np.cos(ts),ybase+ry*np.sin(ts),np.zeros(steps)])
    ring_n=18; verts=[]
    for idx,t in enumerate(ts):
        tangent=np.array([-rx*math.sin(t),ry*math.cos(t),0.]); tangent/=np.linalg.norm(tangent)
        normal=np.array([-tangent[1],tangent[0],0.]); binormal=np.array([0.,0.,1.]); p=path[idx]
        for a in np.linspace(0,2*math.pi,ring_n,endpoint=False): verts.append(p+normal*(cross_w/2*math.cos(a))+binormal*(cross_d/2*math.sin(a)))
    verts=np.asarray(verts); faces=[]
    for i in range(steps-1):
        for j in range(ring_n):
            k=(j+1)%ring_n; a=i*ring_n+j; b=i*ring_n+k; c=(i+1)*ring_n+j; d=(i+1)*ring_n+k
            faces += [[a,c,d],[a,d,b]]
    return apply_material(trimesh.Trimesh(vertices=verts,faces=np.asarray(faces),process=True),material)


def cyl(radius,depth,material,sections=48): return apply_material(trimesh.creation.cylinder(radius=radius,height=depth,sections=sections),material)
def box(extents,material): return apply_material(trimesh.creation.box(extents=extents),material)


def earcup():
    body=rounded_box(1.28,1.58,.38,.32,METAL)
    bevel=rounded_box(1.18,1.48,.055,.29,TRIM,z0=.214)
    face=rounded_box(1.10,1.38,.035,.27,METAL,z0=.255)
    lower=rounded_box(.74,.065,.045,.028,DARK,z0=.278); lower.apply_translation([0,-.54,0])
    return trimesh.util.concatenate([body,bevel,face,lower])


def cushion(): return rounded_ring(1.32,1.61,.73,1.01,.34,.35,.26,SOFT)


def driver():
    parts=[cyl(.40,.06,DRIVER,64),cyl(.29,.072,ACCENT,56),cyl(.14,.08,DRIVER,48)]
    for i in range(14):
        rib=box([.28,.018,.035],DRIVER); rib.apply_translation([.20,0,.045]); rib.apply_transform(trimesh.transformations.rotation_matrix(i*math.tau/14,[0,0,1])); parts.append(rib)
    return trimesh.util.concatenate(parts)


def yoke():
    parts=[]
    for z in (-.085,.085): parts.append(rounded_box(.095,.68,.065,.04,TRIM,z0=z,seg=10))
    bridge=rounded_box(.13,.17,.22,.045,TRIM); bridge.apply_translation([0,.27,0]); parts.append(bridge)
    return trimesh.util.concatenate(parts)


def dial():
    parts=[cyl(.13,.105,TRIM,56)]
    for i in range(20):
        a=i*math.tau/20; r=.133; bar=box([.014,.038,.108],DARK); bar.apply_translation([r*math.cos(a),r*math.sin(a),0]); bar.apply_transform(trimesh.transformations.rotation_matrix(a,[0,0,1])); parts.append(bar)
    return trimesh.util.concatenate(parts)


def add(scene,mesh,name,pos=(0,0,0),rot_y=0):
    T=trimesh.transformations.translation_matrix(pos)
    if rot_y: T=T@trimesh.transformations.rotation_matrix(rot_y,[0,1,0])
    scene.add_geometry(mesh,node_name=name,geom_name=name,transform=T)


def main():
    scene=trimesh.Scene()
    for side,x,ry in (("L",-.84,.12),("R",.84,-.08)):
        add(scene,earcup(),f"EarCup_{side}",(x,-.18,0),ry)
        add(scene,cushion(),f"Cushion_{side}",(x,-.18,-.34 if side=="R" else .34),ry)
        add(scene,driver(),f"Driver_{side}",(x,-.18,-.225),ry)

    shell=arc_sweep(1.42,1.33,.95,.22,.25,material=TRIM)
    inner=arc_sweep(1.31,1.23,.90,.28,.19,material=SOFT); inner.apply_translation([0,-.025,-.13])
    add(scene,shell,"Headband_Shell"); add(scene,inner,"Headband_Cushion")

    for side,x in (("L",-.98),("R",.98)):
        add(scene,yoke(),f"Yoke_{side}",(x,.64,.02))
        h=cyl(.125,.10,TRIM,48); h.apply_transform(trimesh.transformations.rotation_matrix(math.pi/2,[0,1,0])); add(scene,h,f"Hinge_{side}",(x,.22,.11))

    d=dial(); d.apply_transform(trimesh.transformations.rotation_matrix(math.pi/2,[0,1,0])); add(scene,d,"Control_Dial",(1.45,-.12,.15))
    add(scene,rounded_box(.10,.23,.07,.045,DARK),"Control_Button",(1.45,-.43,.14))
    add(scene,rounded_box(.18,.06,.03,.025,DARK),"Port_USBC",(1.24,-.78,.22))

    scene.metadata["product"]="LUNEV ONE"; scene.metadata["version"]="portfolio-v1"
    data=scene.export(file_type="glb"); OUT.parent.mkdir(parents=True,exist_ok=True); OUT.write_bytes(data)
    print(f"Wrote {OUT} ({OUT.stat().st_size/1024:.1f} KB)")
    print("Bounds",scene.bounds)

if __name__=="__main__": main()
