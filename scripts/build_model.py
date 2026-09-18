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
    return PBRMaterial(
        name=name,
        baseColorFactor=np.array(color, dtype=float),
        metallicFactor=float(metallic),
        roughnessFactor=float(roughness),
    )


ALUMINUM = mat("LUNEV_Aluminum", [0.31, 0.295, 0.275, 1], .82, .33)
EDGE = mat("LUNEV_Edge", [0.63, 0.595, 0.55, 1], .9, .24)
SOFT = mat("LUNEV_Soft", [0.042, 0.04, 0.038, 1], 0, .88)
DARK = mat("LUNEV_Dark", [0.018, 0.018, 0.017, 1], .12, .5)
DRIVER = mat("LUNEV_Driver", [0.095, 0.075, 0.057, 1], .55, .35)
ACCENT = mat("LUNEV_Accent", [0.42, 0.30, 0.19, 1], .62, .28)


def apply_material(mesh, material):
    mesh.visual = TextureVisuals(material=material)
    return mesh


def superellipse_loop(w: float, h: float, power: float = 4.6, count: int = 96):
    t = np.linspace(0, math.tau, count, endpoint=False)
    c = np.cos(t)
    s = np.sin(t)
    x = (w / 2) * np.sign(c) * np.abs(c) ** (2 / power)
    y = (h / 2) * np.sign(s) * np.abs(s) ** (2 / power)
    return np.column_stack([x, y])


def loft(layers, material, cap=True):
    """layers: [(z, width, height, power), ...]"""
    loops = [superellipse_loop(w, h, p) for z, w, h, p in layers]
    n = len(loops[0])
    vertices = []
    for (z, _, _, _), loop in zip(layers, loops):
        vertices.extend(np.column_stack([loop, np.full(n, z)]))
    faces = []
    for li in range(len(layers) - 1):
        a0 = li * n
        b0 = (li + 1) * n
        for i in range(n):
            j = (i + 1) % n
            faces += [[a0 + i, b0 + i, b0 + j], [a0 + i, b0 + j, a0 + j]]

    if cap:
        front_center = len(vertices)
        back_center = front_center + 1
        vertices.append([0, 0, layers[-1][0]])
        vertices.append([0, 0, layers[0][0]])
        last = (len(layers) - 1) * n
        for i in range(n):
            j = (i + 1) % n
            faces.append([front_center, last + i, last + j])
            faces.append([back_center, j, i])

    mesh = trimesh.Trimesh(vertices=np.asarray(vertices), faces=np.asarray(faces), process=True)
    return apply_material(mesh, material)


def ring_loft(layers, inner_ratio=(.60, .68), material=SOFT):
    """Bulged cushion ring with continuous outer/inner surfaces."""
    n = 96
    verts = []
    outer_loops = []
    inner_loops = []
    for z, ow, oh, p in layers:
        outer = superellipse_loop(ow, oh, p, n)
        iw, ih = ow * inner_ratio[0], oh * inner_ratio[1]
        inner = superellipse_loop(iw, ih, p, n)
        outer_loops.append(outer)
        inner_loops.append(inner)
        verts.extend(np.column_stack([outer, np.full(n, z)]))
        verts.extend(np.column_stack([inner, np.full(n, z)]))

    faces = []
    stride = n * 2
    for li in range(len(layers) - 1):
        a = li * stride
        b = (li + 1) * stride
        for i in range(n):
            j = (i + 1) % n
            # outer wall
            faces += [[a + i, b + i, b + j], [a + i, b + j, a + j]]
            # inner wall (reverse winding)
            faces += [[a + n + i, b + n + j, b + n + i], [a + n + i, a + n + j, b + n + j]]

    # close front/back annulus
    for li in (0, len(layers) - 1):
        a = li * stride
        for i in range(n):
            j = (i + 1) % n
            if li == 0:
                faces += [[a + i, a + n + j, a + n + i], [a + i, a + j, a + n + j]]
            else:
                faces += [[a + i, a + n + i, a + n + j], [a + i, a + n + j, a + j]]

    mesh = trimesh.Trimesh(vertices=np.asarray(verts), faces=np.asarray(faces), process=True)
    return apply_material(mesh, material)


def rounded_box(w, h, d, radius=.06, material=ALUMINUM):
    # Superellipse loft gives much cleaner continuous bevels than primitive boxes.
    layers = [
        (-d / 2, w * .94, h * .94, 4.2),
        (-d * .36, w, h, 4.8),
        (d * .36, w, h, 4.8),
        (d / 2, w * .94, h * .94, 4.2),
    ]
    return loft(layers, material)


def tube_arc(rx, ry, ybase, cross_w, cross_d, start=math.pi, end=0, steps=92, material=ALUMINUM):
    ts = np.linspace(start, end, steps)
    ring_n = 24
    verts = []
    for t in ts:
        p = np.array([rx * math.cos(t), ybase + ry * math.sin(t), 0.0])
        tangent = np.array([-rx * math.sin(t), ry * math.cos(t), 0.0])
        tangent /= np.linalg.norm(tangent)
        normal = np.array([-tangent[1], tangent[0], 0.0])
        binormal = np.array([0.0, 0.0, 1.0])
        for a in np.linspace(0, math.tau, ring_n, endpoint=False):
            # slightly flattened / architectural cross section
            q = p + normal * (cross_w / 2 * math.cos(a)) + binormal * (cross_d / 2 * math.sin(a))
            verts.append(q)
    faces = []
    for i in range(steps - 1):
        for j in range(ring_n):
            k = (j + 1) % ring_n
            a = i * ring_n + j
            b = i * ring_n + k
            c = (i + 1) * ring_n + j
            d = (i + 1) * ring_n + k
            faces += [[a, c, d], [a, d, b]]
    return apply_material(trimesh.Trimesh(vertices=np.asarray(verts), faces=np.asarray(faces), process=True), material)


def cyl(radius, depth, material, sections=64):
    return apply_material(trimesh.creation.cylinder(radius=radius, height=depth, sections=sections), material)


def box(extents, material):
    return apply_material(trimesh.creation.box(extents=extents), material)


def add(scene, mesh, name, pos=(0, 0, 0), rot=(0, 0, 0)):
    T = trimesh.transformations.translation_matrix(pos)
    for angle, axis in zip(rot, ([1, 0, 0], [0, 1, 0], [0, 0, 1])):
        if angle:
            T = T @ trimesh.transformations.rotation_matrix(angle, axis)
    scene.add_geometry(mesh, node_name=name, geom_name=name, transform=T)


def build_cup_parts(scene, side: str, x: float, rot_y: float):
    sign = -1 if side == "L" else 1
    cup_z = .03 if side == "L" else -.03

    shell = loft([
        (-.22, 1.06, 1.40, 4.5),
        (-.17, 1.15, 1.49, 4.8),
        (-.03, 1.19, 1.53, 5.0),
        (.10, 1.18, 1.52, 5.0),
        (.17, 1.13, 1.46, 4.7),
        (.21, 1.04, 1.38, 4.5),
    ], ALUMINUM)
    add(scene, shell, f"EarCup_{side}", (x, -.20, cup_z), (0, rot_y, sign * .015))

    rim = loft([
        (-.025, 1.105, 1.405, 4.6),
        (0, 1.145, 1.445, 4.8),
        (.035, 1.08, 1.37, 4.5),
    ], EDGE)
    add(scene, rim, f"Cup_Rim_{side}", (x, -.20, .258 if side == "L" else .196), (0, rot_y, 0))

    cushion = ring_loft([
        (-.14, 1.08, 1.42, 4.6),
        (-.08, 1.14, 1.49, 4.8),
        (0.0, 1.17, 1.52, 4.9),
        (.08, 1.14, 1.49, 4.8),
        (.14, 1.08, 1.42, 4.6),
    ])
    cushion_z = .36 if side == "L" else -.36
    add(scene, cushion, f"Cushion_{side}", (x, -.20, cushion_z), (0, rot_y, 0))

    # Inner acoustic surface / driver.
    inner = loft([(-.025, .67, .89, 4.4), (0, .71, .93, 4.7), (.025, .67, .89, 4.4)], DARK)
    add(scene, inner, f"Acoustic_Baffle_{side}", (x, -.20, .31 if side == "L" else -.31), (0, rot_y, 0))

    drv = cyl(.305, .052, DRIVER, 80)
    drv.apply_transform(trimesh.transformations.rotation_matrix(math.pi / 2, [1, 0, 0]))
    add(scene, drv, f"Driver_{side}", (x, -.20, .345 if side == "L" else -.345), (0, rot_y, 0))

    ring = cyl(.35, .022, ACCENT, 80)
    ring.apply_transform(trimesh.transformations.rotation_matrix(math.pi / 2, [1, 0, 0]))
    add(scene, ring, f"Driver_Ring_{side}", (x, -.20, .327 if side == "L" else -.327), (0, rot_y, 0))

    # Precision hinge plate.
    hinge = cyl(.12, .085, EDGE, 64)
    hinge.apply_transform(trimesh.transformations.rotation_matrix(math.pi / 2, [0, 1, 0]))
    add(scene, hinge, f"Hinge_{side}", (x + sign * .61, .27, .04), (0, 0, 0))

    # Cup-side yoke forks.
    for dz in (-.13, .13):
        fork = rounded_box(.105, .72, .075, material=EDGE)
        add(scene, fork, f"YokeFork_{side}_{'A' if dz < 0 else 'B'}", (x + sign * .59, .69, dz), (0, 0, -sign * .035))

    bridge = rounded_box(.12, .18, .34, material=EDGE)
    add(scene, bridge, f"Yoke_{side}", (x + sign * .59, 1.035, 0), (0, 0, 0))

    # Telescopic rail from yoke into headband.
    rail = rounded_box(.09, .58, .10, material=DARK)
    add(scene, rail, f"Slider_Rail_{side}", (x + sign * .50, 1.35, -.01), (0, 0, -sign * .11))
    cap = rounded_box(.14, .28, .14, material=EDGE)
    add(scene, cap, f"Slider_Cap_{side}", (x + sign * .47, 1.60, -.01), (0, 0, -sign * .11))

    # Microphone dots and service screw give scale.
    for i, yy in enumerate((-.43, -.31, -.19)):
        mic = cyl(.018, .018, DARK, 24)
        add(scene, mic, f"Mic_{side}_{i}", (x + sign * .51, yy, .17), (math.pi / 2, 0, 0))
    screw = cyl(.023, .014, DARK, 32)
    add(scene, screw, f"Screw_{side}", (x + sign * .59, .26, .10), (0, math.pi / 2, 0))


def add_controls(scene):
    # Knurled crown.
    crown = cyl(.145, .105, EDGE, 80)
    crown.apply_transform(trimesh.transformations.rotation_matrix(math.pi / 2, [0, 1, 0]))
    add(scene, crown, "Control_Dial", (1.46, -.06, .17))
    for i in range(28):
        a = i * math.tau / 28
        tooth = box([.012, .035, .11], DARK)
        tooth.apply_translation([0, .145, 0])
        tooth.apply_transform(trimesh.transformations.rotation_matrix(a, [1, 0, 0]))
        add(scene, tooth, f"Dial_Knurl_{i}", (1.46, -.06, .17), (0, math.pi / 2, 0))

    add(scene, rounded_box(.095, .245, .065, material=DARK), "Control_Button", (1.46, -.40, .16))
    add(scene, rounded_box(.18, .062, .028, material=DARK), "Port_USBC", (1.18, -.85, .23))


def main():
    scene = trimesh.Scene()

    # Slight asymmetric splay reads more naturally in a hero three-quarter view.
    build_cup_parts(scene, "L", -.69, .28)
    build_cup_parts(scene, "R", .74, -.16)

    # Outer spring band + softer inner contact band.
    shell = tube_arc(1.30, 1.35, .90, .205, .255, material=EDGE)
    inner = tube_arc(1.18, 1.20, .91, .29, .19, material=SOFT)
    inner.apply_translation([0, -.02, -.10])
    add(scene, shell, "Headband_Shell")
    add(scene, inner, "Headband_Cushion")

    # Small end caps visually resolve the band into the sliders.
    add(scene, rounded_box(.18, .30, .24, material=EDGE), "Headband_End_L", (-1.19, 1.23, -.015), (0, 0, -.13))
    add(scene, rounded_box(.18, .30, .24, material=EDGE), "Headband_End_R", (1.19, 1.23, -.015), (0, 0, .13))

    add_controls(scene)

    scene.metadata["product"] = "LUNEV ONE"
    scene.metadata["version"] = "portfolio-v2"
    scene.metadata["purpose"] = "interactive product understanding"

    OUT.parent.mkdir(parents=True, exist_ok=True)
    data = scene.export(file_type="glb")
    OUT.write_bytes(data)
    print(f"Wrote {OUT} ({OUT.stat().st_size / 1024:.1f} KB)")
    print("Bounds", scene.bounds)


if __name__ == "__main__":
    main()
