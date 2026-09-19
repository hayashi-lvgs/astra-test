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


ALUMINUM = mat("LUNEV_Aluminum", [0.33, 0.315, 0.295, 1], .86, .28)
EDGE = mat("LUNEV_Edge", [0.66, 0.625, 0.58, 1], .92, .22)
SOFT = mat("LUNEV_Soft", [0.050, 0.047, 0.044, 1], 0, .84)
TEXTILE = mat("LUNEV_Textile", [0.115, 0.105, 0.095, 1], 0, .9)
DARK = mat("LUNEV_Dark", [0.018, 0.018, 0.017, 1], .08, .52)
DRIVER = mat("LUNEV_Driver", [0.10, 0.078, 0.058, 1], .48, .34)
ACCENT = mat("LUNEV_Accent", [0.44, 0.31, 0.20, 1], .62, .27)


def apply_material(mesh, material):
    mesh.visual = TextureVisuals(material=material)
    return mesh


def superellipse_xy(w: float, h: float, power: float, theta):
    c = np.cos(theta)
    s = np.sin(theta)
    x = (w / 2) * np.sign(c) * np.abs(c) ** (2 / power)
    y = (h / 2) * np.sign(s) * np.abs(s) ** (2 / power)
    return x, y


def superellipse_loop(w: float, h: float, power: float = 3.0, count: int = 128):
    t = np.linspace(0, math.tau, count, endpoint=False)
    x, y = superellipse_xy(w, h, power, t)
    return np.column_stack([x, y])


def loft(layers, material):
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

    front_center = len(vertices)
    back_center = front_center + 1
    vertices.append([0, 0, layers[-1][0]])
    vertices.append([0, 0, layers[0][0]])
    last = (len(layers) - 1) * n
    for i in range(n):
        j = (i + 1) % n
        faces.append([front_center, last + i, last + j])
        faces.append([back_center, j, i])

    return apply_material(
        trimesh.Trimesh(vertices=np.asarray(vertices), faces=np.asarray(faces), process=True),
        material,
    )


def convex_plate(w, h, thickness=.075, crown=.075, power=2.55, rings=10, seg=128, material=ALUMINUM):
    """Shallow convex product face plate with rounded-square outline."""
    vertices = [[0, 0, crown]]
    faces = []
    for ri in range(1, rings + 1):
        r = ri / rings
        theta = np.linspace(0, math.tau, seg, endpoint=False)
        x, y = superellipse_xy(w * r, h * r, power, theta)
        z = crown * (1 - r ** 1.75)
        vertices.extend(np.column_stack([x, y, np.full(seg, z)]))

    # front surface
    for i in range(seg):
        j = (i + 1) % seg
        faces.append([0, 1 + i, 1 + j])
    for ri in range(1, rings):
        a0 = 1 + (ri - 1) * seg
        b0 = 1 + ri * seg
        for i in range(seg):
            j = (i + 1) % seg
            faces += [[a0 + i, b0 + i, b0 + j], [a0 + i, b0 + j, a0 + j]]

    # back perimeter + wall
    front_outer = 1 + (rings - 1) * seg
    back_outer = len(vertices)
    theta = np.linspace(0, math.tau, seg, endpoint=False)
    x, y = superellipse_xy(w, h, power, theta)
    vertices.extend(np.column_stack([x, y, np.full(seg, -thickness)]))
    back_center = len(vertices)
    vertices.append([0, 0, -thickness])

    for i in range(seg):
        j = (i + 1) % seg
        faces += [
            [front_outer + i, back_outer + i, back_outer + j],
            [front_outer + i, back_outer + j, front_outer + j],
            [back_center, back_outer + j, back_outer + i],
        ]

    return apply_material(
        trimesh.Trimesh(vertices=np.asarray(vertices), faces=np.asarray(faces), process=True),
        material,
    )


def ring_loft(layers, inner_ratio=(.60, .68), material=SOFT, count=128):
    n = count
    verts = []
    for z, ow, oh, p in layers:
        outer = superellipse_loop(ow, oh, p, n)
        inner = superellipse_loop(ow * inner_ratio[0], oh * inner_ratio[1], p, n)
        verts.extend(np.column_stack([outer, np.full(n, z)]))
        verts.extend(np.column_stack([inner, np.full(n, z)]))

    faces = []
    stride = n * 2
    for li in range(len(layers) - 1):
        a = li * stride
        b = (li + 1) * stride
        for i in range(n):
            j = (i + 1) % n
            faces += [[a + i, b + i, b + j], [a + i, b + j, a + j]]
            faces += [[a + n + i, b + n + j, b + n + i], [a + n + i, a + n + j, b + n + j]]

    for li in (0, len(layers) - 1):
        a = li * stride
        for i in range(n):
            j = (i + 1) % n
            if li == 0:
                faces += [[a + i, a + n + j, a + n + i], [a + i, a + j, a + n + j]]
            else:
                faces += [[a + i, a + n + i, a + n + j], [a + i, a + n + j, a + j]]

    return apply_material(
        trimesh.Trimesh(vertices=np.asarray(verts), faces=np.asarray(faces), process=True),
        material,
    )


def rounded_box(w, h, d, material=ALUMINUM, power=3.0):
    return loft([
        (-d / 2, w * .92, h * .92, power),
        (-d * .34, w, h, power),
        (d * .34, w, h, power),
        (d / 2, w * .92, h * .92, power),
    ], material)


def cyl(radius, depth, material, sections=80):
    return apply_material(trimesh.creation.cylinder(radius=radius, height=depth, sections=sections), material)


def box(extents, material):
    return apply_material(trimesh.creation.box(extents=extents), material)


def sweep_path(points, cross_w, cross_d, material, ring_n=22):
    points = np.asarray(points, dtype=float)
    verts = []
    for i, p in enumerate(points):
        if i == 0:
            tangent = points[1] - points[0]
        elif i == len(points) - 1:
            tangent = points[-1] - points[-2]
        else:
            tangent = points[i + 1] - points[i - 1]
        tangent /= np.linalg.norm(tangent)
        binormal = np.array([0.0, 0.0, 1.0])
        normal = np.cross(binormal, tangent)
        if np.linalg.norm(normal) < 1e-6:
            normal = np.array([1.0, 0.0, 0.0])
        normal /= np.linalg.norm(normal)
        binormal = np.cross(tangent, normal)
        binormal /= np.linalg.norm(binormal)
        for a in np.linspace(0, math.tau, ring_n, endpoint=False):
            verts.append(p + normal * (cross_w / 2 * math.cos(a)) + binormal * (cross_d / 2 * math.sin(a)))

    faces = []
    for i in range(len(points) - 1):
        for j in range(ring_n):
            k = (j + 1) % ring_n
            a = i * ring_n + j
            b = i * ring_n + k
            c = (i + 1) * ring_n + j
            d = (i + 1) * ring_n + k
            faces += [[a, c, d], [a, d, b]]

    return apply_material(
        trimesh.Trimesh(vertices=np.asarray(verts), faces=np.asarray(faces), process=True),
        material,
    )


def bezier_path(p0, p1, p2, p3, steps=64):
    ts = np.linspace(0, 1, steps)
    pts = []
    for t in ts:
        p = (
            (1 - t) ** 3 * np.asarray(p0)
            + 3 * (1 - t) ** 2 * t * np.asarray(p1)
            + 3 * (1 - t) * t ** 2 * np.asarray(p2)
            + t ** 3 * np.asarray(p3)
        )
        pts.append(p)
    return np.asarray(pts)


def arc_path(rx, ry, ybase, start=math.pi, end=0, steps=100):
    t = np.linspace(start, end, steps)
    return np.column_stack([rx * np.cos(t), ybase + ry * np.sin(t), np.zeros_like(t)])


def add(scene, mesh, name, pos=(0, 0, 0), rot=(0, 0, 0)):
    T = trimesh.transformations.translation_matrix(pos)
    for angle, axis in zip(rot, ([1, 0, 0], [0, 1, 0], [0, 0, 1])):
        if angle:
            T = T @ trimesh.transformations.rotation_matrix(angle, axis)
    scene.add_geometry(mesh, node_name=name, geom_name=name, transform=T)


def cup_transform(side):
    # Left cup exposes cushion toward camera, right cup exposes outer metal face.
    return .22 if side == "L" else -.14


def build_cup(scene, side: str, x: float):
    sign = -1 if side == "L" else 1
    rot_y = cup_transform(side)

    # Main body: softer, less boxy industrial silhouette.
    shell = loft([
        (-.18, 1.02, 1.34, 2.7),
        (-.12, 1.08, 1.40, 2.8),
        (.00, 1.11, 1.43, 2.85),
        (.12, 1.09, 1.41, 2.8),
        (.18, 1.02, 1.34, 2.7),
    ], ALUMINUM)
    add(scene, shell, f"EarCup_{side}", (x, -.20, 0), (0, rot_y, 0))

    # Inset polished perimeter.
    rim = loft([
        (-.028, .98, 1.30, 2.65),
        (0, 1.03, 1.35, 2.7),
        (.030, .98, 1.30, 2.65),
    ], EDGE)
    outer_z = -.205 if side == "L" else .205
    add(scene, rim, f"Cup_Rim_{side}", (x, -.20, outer_z), (0, rot_y, 0))

    # Convex machined face plate with subtle crown.
    face = convex_plate(.93, 1.20, thickness=.045, crown=.070, power=2.30, material=ALUMINUM)
    add(scene, face, f"Faceplate_{side}", (x, -.20, -.235 if side == "L" else .235), (0, rot_y if side == "R" else rot_y + math.pi, 0))

    # Soft oval cushion.
    cushion = ring_loft([
        (-.105, .98, 1.30, 2.45),
        (-.065, 1.05, 1.37, 2.5),
        (0.0, 1.08, 1.40, 2.52),
        (.065, 1.05, 1.37, 2.5),
        (.105, .98, 1.30, 2.45),
    ], inner_ratio=(.61, .69), material=SOFT)
    cushion_z = .30 if side == "L" else -.30
    add(scene, cushion, f"Cushion_{side}", (x, -.20, cushion_z), (0, rot_y, 0))

    # Cushion seam detail.
    seam = ring_loft([
        (-.012, 1.105, 1.415, 2.72),
        (0.012, 1.105, 1.415, 2.72),
    ], inner_ratio=(.61, .69), material=TEXTILE)
    add(scene, seam, f"Cushion_Seam_{side}", (x, -.20, cushion_z + (.112 if side == "L" else -.112)), (0, rot_y, 0))

    # Acoustic cloth, visible through the cushion opening.
    baffle = convex_plate(.54, .79, thickness=.012, crown=.012, power=2.35, material=TEXTILE)
    add(scene, baffle, f"Acoustic_Baffle_{side}", (x, -.20, .315 if side == "L" else -.315), (0, rot_y if side == "L" else rot_y + math.pi, 0))

    # Driver / ring only revealed in Sound section.
    drv = cyl(.23, .040, DRIVER, 96)
    drv.apply_transform(trimesh.transformations.rotation_matrix(math.pi / 2, [1, 0, 0]))
    add(scene, drv, f"Driver_{side}", (x, -.20, .34 if side == "L" else -.34), (0, rot_y, 0))

    ring = cyl(.275, .015, ACCENT, 96)
    ring.apply_transform(trimesh.transformations.rotation_matrix(math.pi / 2, [1, 0, 0]))
    add(scene, ring, f"Driver_Ring_{side}", (x, -.20, .328 if side == "L" else -.328), (0, rot_y, 0))

    # Compact hinge.
    hinge = cyl(.072, .060, EDGE, 72)
    hinge.apply_transform(trimesh.transformations.rotation_matrix(math.pi / 2, [0, 1, 0]))
    add(scene, hinge, f"Hinge_{side}", (x + sign * .56, .31, .02))

    # Slender curved yoke instead of block forks.
    p0 = [x + sign * .42, 1.18, -.01]
    p1 = [x + sign * .51, .92, -.01]
    p2 = [x + sign * .57, .56, .00]
    p3 = [x + sign * .56, .30, .02]
    yoke = sweep_path(bezier_path(p0, p1, p2, p3, 54), .165, .105, EDGE)
    add(scene, yoke, f"Yoke_{side}")

    # Telescopic inner rail.
    rail = sweep_path(bezier_path(
        [x + sign * .38, 1.45, -.02],
        [x + sign * .40, 1.37, -.02],
        [x + sign * .42, 1.28, -.015],
        [x + sign * .43, 1.19, -.01],
        28,
    ), .066, .070, DARK, ring_n=18)
    add(scene, rail, f"Slider_Rail_{side}")

    cap = rounded_box(.135, .20, .13, material=EDGE, power=2.8)
    add(scene, cap, f"Slider_Cap_{side}", (x + sign * .39, 1.49, -.02), (0, 0, -sign * .06))

    # Scale cues.
    screw = cyl(.016, .010, DARK, 32)
    add(scene, screw, f"Screw_{side}", (x + sign * .565, .31, .075), (0, math.pi / 2, 0))

    for i, yy in enumerate((-.47, -.33)):
        mic = cyl(.012, .010, DARK, 24)
        add(scene, mic, f"Mic_{side}_{i}", (x + sign * .49, yy, .15), (math.pi / 2, 0, 0))


def add_headband(scene):
    # One continuous padded band carries the visual weight.
    top = sweep_path(
        arc_path(1.10, 1.14, .96, math.pi * .93, math.pi * .07, 112),
        .315, .285, SOFT, ring_n=28,
    )
    add(scene, top, "Headband_Shell")

    # A shorter inner contact pad creates depth without reading as a second hoop.
    inner = sweep_path(
        arc_path(1.01, 1.01, .98, math.pi * .76, math.pi * .24, 76),
        .265, .135, TEXTILE, ring_n=24,
    )
    inner.apply_translation([0, -.035, -.105])
    add(scene, inner, "Headband_Cushion")

    # Short exposed rails connect the padded band to the cup yokes.
    left_rail = sweep_path(bezier_path(
        [-1.075, 1.37, -.02],
        [-1.10, 1.31, -.02],
        [-1.11, 1.25, -.015],
        [-1.10, 1.18, -.01],
        30,
    ), .145, .110, EDGE, ring_n=22)
    right_rail = sweep_path(bezier_path(
        [1.075, 1.37, -.02],
        [1.10, 1.31, -.02],
        [1.11, 1.25, -.015],
        [1.10, 1.18, -.01],
        30,
    ), .115, .105, EDGE, ring_n=22)
    add(scene, left_rail, "Headband_Core_L")
    add(scene, right_rail, "Headband_Core_R")

    # Machined end caps visually lock textile and metal together.
    add(scene, rounded_box(.20, .24, .19, material=EDGE, power=2.7), "Headband_End_L", (-1.075, 1.36, -.015), (0, 0, -.08))
    add(scene, rounded_box(.20, .24, .19, material=EDGE, power=2.7), "Headband_End_R", (1.075, 1.36, -.015), (0, 0, .08))

def add_controls(scene):
    # Right-side tactile crown.
    crown = cyl(.092, .075, EDGE, 96)
    crown.apply_transform(trimesh.transformations.rotation_matrix(math.pi / 2, [0, 1, 0]))
    add(scene, crown, "Control_Dial", (1.33, -.08, .16))

    for i in range(24):
        a = i * math.tau / 24
        tooth = box([.007, .022, .074], DARK)
        tooth.apply_translation([0, .093, 0])
        tooth.apply_transform(trimesh.transformations.rotation_matrix(a, [1, 0, 0]))
        add(scene, tooth, f"Dial_Knurl_{i}", (1.33, -.08, .16), (0, math.pi / 2, 0))

    add(scene, rounded_box(.070, .19, .052, material=DARK, power=2.6), "Control_Button", (1.33, -.37, .15))
    add(scene, rounded_box(.145, .050, .020, material=DARK, power=2.6), "Port_USBC", (1.09, -.78, .21))


def main():
    scene = trimesh.Scene()

    build_cup(scene, "L", -.68)
    build_cup(scene, "R", .72)
    add_headband(scene)
    add_controls(scene)

    scene.metadata["product"] = "LUNEV ONE"
    scene.metadata["version"] = "portfolio-v3-70-target"
    scene.metadata["purpose"] = "premium interactive product understanding"

    OUT.parent.mkdir(parents=True, exist_ok=True)
    data = scene.export(file_type="glb")
    OUT.write_bytes(data)

    print(f"Wrote {OUT} ({OUT.stat().st_size / 1024:.1f} KB)")
    print("Bounds", scene.bounds)


if __name__ == "__main__":
    main()
