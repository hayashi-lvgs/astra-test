"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer, OrbitControls, RoundedBox, useGLTF } from "@react-three/drei";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

export type Finish = "graphite" | "natural" | "warm";
export type Section = "hero" | "sound" | "silence" | "material" | "longevity" | "explore" | "customize" | "specs" | "purchase";

export const FINISHES: Record<Finish, { label: string; metal: string; cushion: string; trim: string }> = {
  graphite: { label: "Graphite", metal: "#4f4a45", cushion: "#171513", trim: "#b8afa4" },
  natural: { label: "Natural", metal: "#746a62", cushion: "#9f958b", trim: "#94887e" },
  warm: { label: "Warm Stone", metal: "#a9937d", cushion: "#67584e", trim: "#d7c4af" },
};

const cameraStates: Record<Section, { position: [number, number, number]; target: [number, number, number]; fov: number }> = {
  hero: { position: [0.18, 0.60, 5.95], target: [0.04, 0.58, 0], fov: 34 },
  sound: { position: [1.75, 0.28, 4.35], target: [0.5, 0.05, 0], fov: 31 },
  silence: { position: [-1.7, 0.62, 5.05], target: [-0.22, 0.48, 0], fov: 34 },
  material: { position: [2.25, 0.42, 3.95], target: [0.60, 0.22, 0], fov: 28 },
  longevity: { position: [0.12, 0.76, 5.2], target: [0, 0.58, 0], fov: 34 },
  explore: { position: [0, 0.60, 5.30], target: [0, 0.52, 0], fov: 34 },
  customize: { position: [-0.35, 0.60, 5.25], target: [0, 0.50, 0], fov: 34 },
  specs: { position: [1.2, 0.52, 5.0], target: [0.2, 0.42, 0], fov: 34 },
  purchase: { position: [-1.0, 0.56, 5.0], target: [-0.08, 0.42, 0], fov: 34 },
};

function CameraRig({ section, interactive }: { section: Section; interactive: boolean }) {
  const { camera, size } = useThree();
  const look = useRef(new THREE.Vector3(0, 0.52, 0));
  const state = cameraStates[section];

  useFrame((_, delta) => {
    if (interactive) return;
    const mobile = size.width < 760;
    const p = new THREE.Vector3(...state.position);
    if (mobile) {
      p.x *= 0.12;
      p.y += 0.12;
      p.z += 0.82;
    }
    const t = new THREE.Vector3(...state.target);
    const k = 1 - Math.exp(-3.6 * delta);
    camera.position.lerp(p, k);
    look.current.lerp(t, k);
    camera.lookAt(look.current);
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.fov = THREE.MathUtils.damp(camera.fov, mobile ? Math.max(40, state.fov + 4) : state.fov, 4.2, delta);
      camera.updateProjectionMatrix();
    }
  });
  return null;
}

function SilenceField({ active, progress }: { active: boolean; progress: number }) {
  const group = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (!group.current) return;
    const target = active ? 0.7 + progress * 0.05 : 1.2;
    const s = THREE.MathUtils.damp(group.current.scale.x, target, 3.5, delta);
    group.current.scale.setScalar(s);
    group.current.rotation.z += delta * 0.018;
  });
  return (
    <group ref={group} position={[0, 0.58, -0.72]} visible={active}>
      {[1.15, 1.46, 1.80].map((r, i) => (
        <mesh key={r} rotation={[0, 0, i * 0.12]}>
          <torusGeometry args={[r, 0.005, 5, 160]} />
          <meshBasicMaterial color="#cabaaa" transparent opacity={0.15 - i * 0.025} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

function Pedestal({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <group position={[0.45, -1.06, -0.22]}>
      <RoundedBox args={[4.8, 0.16, 2.65]} radius={0.045} smoothness={5} receiveShadow>
        <meshStandardMaterial color="#c9bbae" roughness={0.96} metalness={0} />
      </RoundedBox>
      <RoundedBox args={[3.7, 0.055, 2.10]} radius={0.025} smoothness={4} position={[0.15, 0.105, 0.05]} receiveShadow>
        <meshStandardMaterial color="#d9cec3" roughness={0.9} metalness={0} />
      </RoundedBox>
    </group>
  );
}

function ProductModel({ finish, section, progress }: { finish: Finish; section: Section; progress: number }) {
  const root = useRef<THREE.Group>(null);
  const { scene } = useGLTF("/models/lunev-one.glb");
  const palette = FINISHES[finish];
  const targetMetal = useMemo(() => new THREE.Color(palette.metal), [palette.metal]);
  const targetSoft = useMemo(() => new THREE.Color(palette.cushion), [palette.cushion]);
  const targetTrim = useMemo(() => new THREE.Color(palette.trim), [palette.trim]);
  const targetFace = useMemo(() => new THREE.Color(palette.metal).lerp(new THREE.Color(palette.trim), 0.24), [palette.metal, palette.trim]);

  const model = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse((obj) => {
      if (!(obj instanceof THREE.Mesh)) return;
      const isTextile = obj.name.includes("Acoustic_Baffle") || obj.name.includes("Cushion_Seam");
      const isFaceplate = obj.name.includes("Faceplate");
      const isSoft = obj.name.includes("Cushion_") || obj.name.includes("Headband_Shell") || obj.name.includes("Headband_Cushion");
      const isDriver = obj.name.includes("Driver");
      const isDark = obj.name.includes("Mic") || obj.name.includes("Port") || obj.name.includes("Rail") || obj.name.includes("Screw") || obj.name.includes("Knurl");
      const isTrim = obj.name.includes("Rim") || obj.name.includes("Hinge") || obj.name.includes("Yoke") || obj.name.includes("Control") || obj.name.includes("End") || obj.name.includes("Cap") || obj.name.includes("Core");

      let material: THREE.MeshPhysicalMaterial;

      if (isFaceplate) {
        material = new THREE.MeshPhysicalMaterial({
          color: new THREE.Color(palette.metal).lerp(new THREE.Color(palette.trim), 0.42),
          metalness: 0.72,
          roughness: 0.43,
          clearcoat: 0.03,
          clearcoatRoughness: 0.48,
          anisotropy: 0.68,
          envMapIntensity: 0.82,
        });
      } else if (isTextile) {
        material = new THREE.MeshPhysicalMaterial({
          color: "#24211f",
          metalness: 0,
          roughness: 0.92,
          sheen: 0.72,
          sheenRoughness: 0.86,
          sheenColor: new THREE.Color("#7b7067"),
          envMapIntensity: 0.42,
        });
      } else if (isSoft) {
        material = new THREE.MeshPhysicalMaterial({
          color: palette.cushion,
          metalness: 0,
          roughness: 0.78,
          sheen: 0.82,
          sheenRoughness: 0.8,
          sheenColor: new THREE.Color("#82756b"),
          envMapIntensity: 0.58,
        });
      } else if (isDriver) {
        material = new THREE.MeshPhysicalMaterial({
          color: "#2b211a",
          metalness: 0.54,
          roughness: 0.32,
          emissive: new THREE.Color("#5b4430"),
          emissiveIntensity: 0,
          envMapIntensity: 1.15,
        });
      } else if (isDark) {
        material = new THREE.MeshPhysicalMaterial({
          color: "#151412",
          metalness: 0.14,
          roughness: 0.5,
          envMapIntensity: 0.7,
        });
      } else if (isTrim) {
        material = new THREE.MeshPhysicalMaterial({
          color: palette.trim,
          metalness: 0.82,
          roughness: 0.31,
          clearcoat: 0.10,
          clearcoatRoughness: 0.34,
          anisotropy: 0.5,
          envMapIntensity: 1.08,
        });
      } else {
        material = new THREE.MeshPhysicalMaterial({
          color: palette.metal,
          metalness: 0.86,
          roughness: 0.29,
          clearcoat: 0.06,
          clearcoatRoughness: 0.4,
          anisotropy: 0.42,
          envMapIntensity: 1.28,
        });
      }

      obj.material = material;
      obj.castShadow = true;
      obj.receiveShadow = true;
    });
    return clone;
  }, [scene]);

  const base = useMemo(() => {
    const map = new Map<string, THREE.Vector3>();
    model.traverse((obj) => map.set(obj.name, obj.position.clone()));
    return map;
  }, [model]);

  useEffect(() => () => {
    model.traverse((obj) => {
      if (obj instanceof THREE.Mesh && obj.material) (obj.material as THREE.Material).dispose();
    });
  }, [model]);

  useFrame((state, delta) => {
    const a = 1 - Math.exp(-delta * 5);
    model.traverse((obj) => {
      if (!(obj instanceof THREE.Mesh)) return;
      if (obj.name.includes("Driver_") || obj.name.includes("Driver_Ring_")) {
        obj.visible = section === "sound";
      }
      const m = obj.material as THREE.MeshPhysicalMaterial;
      if (obj.name.includes("Faceplate")) {
        m.color.lerp(targetFace, a);
      } else if (obj.name.includes("Cushion") || obj.name.includes("Headband_Cushion") || obj.name.includes("Headband_Shell")) {
        m.color.lerp(targetSoft, a);
      } else if (
        obj.name.includes("Rim") || obj.name.includes("Hinge") || obj.name.includes("Yoke") ||
        obj.name.includes("Control") || obj.name.includes("End") || obj.name.includes("Cap")
      ) {
        m.color.lerp(targetTrim, a);
      } else if (
        !obj.name.includes("Driver") && !obj.name.includes("Port") &&
        !obj.name.includes("Mic") && !obj.name.includes("Rail")
      ) {
        m.color.lerp(targetMetal, a);
      }
      if (obj.name.includes("Driver")) {
        m.emissiveIntensity = THREE.MathUtils.damp(m.emissiveIntensity ?? 0, section === "sound" ? 0.35 : 0, 4, delta);
      }
    });

    if (root.current) {
      let ry = -0.20;
      let rx = -0.045;
      let rz = 0.012;
      if (section === "hero") ry += Math.sin(state.clock.elapsedTime * 0.24) * 0.010;
      if (section === "sound") { ry = -0.72; rx = -0.025; }
      if (section === "silence") ry = 0.16;
      if (section === "material") { ry = -0.92; rx = 0.015; }
      if (section === "longevity") ry = -0.10;
      if (section === "customize") ry = 0.34;
      if (section === "purchase") ry = 0.48;

      root.current.rotation.x = THREE.MathUtils.damp(root.current.rotation.x, rx, 3.4, delta);
      root.current.rotation.y = THREE.MathUtils.damp(root.current.rotation.y, ry, 3.4, delta);
      root.current.rotation.z = THREE.MathUtils.damp(root.current.rotation.z, rz, 3.4, delta);
    }

    const targets = new Map<string, THREE.Vector3>();
    base.forEach((v, k) => targets.set(k, v.clone()));

    if (section === "sound") {
      for (const key of ["Driver_R", "Driver_Ring_R", "Acoustic_Baffle_R"]) {
        const d = targets.get(key);
        if (d) d.z -= 0.28 + progress * 0.20;
      }
    }

    if (section === "longevity") {
      const l = targets.get("Cushion_L");
      const r = targets.get("Cushion_R");
      const h = targets.get("Headband_Cushion");
      if (l) l.z += 0.34 + progress * 0.12;
      if (r) r.z -= 0.34 + progress * 0.12;
      if (h) h.y += 0.20 + progress * 0.10;
    }

    model.traverse((obj) => {
      const t = targets.get(obj.name);
      if (!t) return;
      obj.position.x = THREE.MathUtils.damp(obj.position.x, t.x, 6, delta);
      obj.position.y = THREE.MathUtils.damp(obj.position.y, t.y, 6, delta);
      obj.position.z = THREE.MathUtils.damp(obj.position.z, t.z, 6, delta);
    });
  });

  return (
    <group ref={root} scale={0.84} position={[0, -0.10, 0]} rotation={[-0.035, -0.20, 0.012]}>
      <primitive object={model} />
    </group>
  );
}

function SceneContent({ finish, section, progress, interactive }: { finish: Finish; section: Section; progress: number; interactive: boolean }) {
  const pedestal = section === "material" || section === "explore" || section === "customize";

  return (
    <>
      <CameraRig section={section} interactive={interactive} />
      <Environment resolution={512} frames={1}>
        <Lightformer intensity={3.15} position={[0, 5.5, 4]} scale={[7, 4.5, 1]} />
        <Lightformer intensity={1.75} position={[-4.5, 1.8, 2]} rotation={[0, Math.PI / 2, 0]} scale={[5, 3, 1]} />
        <Lightformer intensity={2.25} position={[4.5, 2.2, -1.5]} rotation={[0, -Math.PI / 2, 0]} scale={[5, 4.5, 1]} />
        <Lightformer intensity={1.0} position={[0, -3, 1.5]} scale={[5, 2, 1]} />
        <Lightformer intensity={1.5} position={[0, 2, -5]} rotation={[0, Math.PI, 0]} scale={[4, 4, 1]} />
      </Environment>

      <ambientLight intensity={0.22} />
      <directionalLight position={[5, 7, 5]} intensity={1.35} color="#fff8ef" castShadow />
      <directionalLight position={[-4, 3, 2]} intensity={0.52} color="#d9c5b4" />
      <pointLight position={[0, 2, -3]} intensity={0.34} color="#b99b7e" />

      <SilenceField active={section === "silence"} progress={progress} />
      <Pedestal visible={pedestal} />
      <ProductModel finish={finish} section={section} progress={progress} />

      <ContactShadows position={[0, -1.0, 0]} opacity={0.34} scale={6.2} blur={2.2} far={4.5} resolution={512} />
      <OrbitControls
        enabled={interactive}
        enablePan={false}
        enableZoom={false}
        dampingFactor={0.08}
        enableDamping
        minPolarAngle={Math.PI * 0.30}
        maxPolarAngle={Math.PI * 0.68}
        target={[0, 0.50, 0]}
      />
    </>
  );
}

export function ProductScene({ finish, section, progress, interactive }: { finish: Finish; section: Section; progress: number; interactive: boolean }) {
  return (
    <Canvas
      shadows
      camera={{ position: [0.18, 0.60, 5.95], fov: 34, near: 0.1, far: 100 }}
      dpr={[1, 1.8]}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 0.74;
        gl.outputColorSpace = THREE.SRGBColorSpace;
      }}
    >
      <SceneContent finish={finish} section={section} progress={progress} interactive={interactive} />
    </Canvas>
  );
}

useGLTF.preload("/models/lunev-one.glb");
