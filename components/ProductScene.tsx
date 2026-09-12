"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer, OrbitControls, RoundedBox, useGLTF } from "@react-three/drei";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

export type Finish = "graphite" | "natural" | "warm";
export type Section = "hero" | "sound" | "silence" | "material" | "longevity" | "explore" | "customize" | "specs" | "purchase";

export const FINISHES: Record<Finish, { label: string; metal: string; cushion: string; trim: string }> = {
  graphite: { label: "Graphite", metal: "#57514b", cushion: "#161513", trim: "#b9b0a5" },
  natural: { label: "Natural", metal: "#c6bdb1", cushion: "#d5cdc3", trim: "#eee8df" },
  warm: { label: "Warm Stone", metal: "#aa957f", cushion: "#63554b", trim: "#d8c6b1" },
};

const cameraStates: Record<Section, { position: [number, number, number]; target: [number, number, number]; fov: number }> = {
  hero: { position: [0.15, 0.56, 6.0], target: [0, 0.62, 0], fov: 37 },
  sound: { position: [1.8, 0.25, 4.8], target: [0.55, 0.12, 0], fov: 34 },
  silence: { position: [-1.8, 0.55, 5.35], target: [-0.25, 0.48, 0], fov: 36 },
  material: { position: [2.2, 0.42, 4.35], target: [0.65, 0.2, 0], fov: 30 },
  longevity: { position: [0.1, 0.72, 5.65], target: [0, 0.58, 0], fov: 37 },
  explore: { position: [0, 0.58, 5.8], target: [0, 0.5, 0], fov: 37 },
  customize: { position: [-0.35, 0.58, 5.6], target: [0, 0.48, 0], fov: 37 },
  specs: { position: [1.35, 0.5, 5.3], target: [0.25, 0.4, 0], fov: 37 },
  purchase: { position: [-1.2, 0.55, 5.4], target: [-0.15, 0.42, 0], fov: 37 },
};

function CameraRig({ section, interactive }: { section: Section; interactive: boolean }) {
  const { camera, size } = useThree();
  const look = useRef(new THREE.Vector3(0, 0.5, 0));
  const state = cameraStates[section];
  useFrame((_, delta) => {
    if (interactive) return;
    const mobile = size.width < 760;
    const p = new THREE.Vector3(...state.position);
    if (mobile) {
      p.x *= 0.28;
      p.z += 1.2;
      p.y += 0.12;
    }
    const t = new THREE.Vector3(...state.target);
    const k = 1 - Math.exp(-3.3 * delta);
    camera.position.lerp(p, k);
    look.current.lerp(t, k);
    camera.lookAt(look.current);
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.fov = THREE.MathUtils.damp(camera.fov, mobile ? Math.max(42, state.fov + 3) : state.fov, 4, delta);
      camera.updateProjectionMatrix();
    }
  });
  return null;
}

function SilenceField({ active, progress }: { active: boolean; progress: number }) {
  const group = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (!group.current) return;
    const target = active ? 0.72 + progress * 0.06 : 1.28;
    const s = THREE.MathUtils.damp(group.current.scale.x, target, 3.5, delta);
    group.current.scale.setScalar(s);
    group.current.rotation.z += delta * 0.022;
  });
  return (
    <group ref={group} position={[0, 0.55, -0.9]} visible={active}>
      {[1.2, 1.5, 1.82].map((r, i) => (
        <mesh key={r} rotation={[0, 0, i * 0.13]}>
          <torusGeometry args={[r, 0.006, 5, 128]} />
          <meshBasicMaterial color="#c8b9aa" transparent opacity={0.18 - i * 0.035} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

function Pedestal({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <RoundedBox args={[4.6, 0.22, 2.5]} radius={0.055} smoothness={4} position={[0.2, -1.02, -0.28]} receiveShadow>
      <meshStandardMaterial color="#cabbae" roughness={0.92} metalness={0} />
    </RoundedBox>
  );
}

function ProductModel({ finish, section, progress }: { finish: Finish; section: Section; progress: number }) {
  const root = useRef<THREE.Group>(null);
  const { scene } = useGLTF("/models/lunev-one.glb");
  const palette = FINISHES[finish];
  const targetMetal = useMemo(() => new THREE.Color(palette.metal), [palette.metal]);
  const targetSoft = useMemo(() => new THREE.Color(palette.cushion), [palette.cushion]);
  const targetTrim = useMemo(() => new THREE.Color(palette.trim), [palette.trim]);

  const model = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse((obj) => {
      if (!(obj instanceof THREE.Mesh)) return;
      obj.material = (obj.material as THREE.Material).clone();
      obj.castShadow = true;
      obj.receiveShadow = true;
      const m = obj.material as THREE.MeshStandardMaterial;
      m.envMapIntensity = 1.15;
      if (obj.name.includes("Cushion") || obj.name.includes("Headband_Cushion")) {
        m.metalness = 0;
        m.roughness = 0.82;
      } else if (obj.name.includes("Driver")) {
        m.metalness = 0.55;
        m.roughness = 0.34;
        m.emissive = new THREE.Color("#5a4938");
        m.emissiveIntensity = 0;
      } else if (obj.name.includes("Port") || obj.name.includes("Mic")) {
        m.metalness = 0.08;
        m.roughness = 0.62;
      } else {
        m.metalness = 0.82;
        m.roughness = obj.name.includes("Control") ? 0.23 : 0.31;
      }
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
      const m = obj.material as THREE.MeshStandardMaterial;
      if (obj.name.includes("Cushion") || obj.name.includes("Headband_Cushion")) m.color.lerp(targetSoft, a);
      else if (obj.name.includes("Hinge") || obj.name.includes("Yoke") || obj.name.includes("Control")) m.color.lerp(targetTrim, a);
      else if (!obj.name.includes("Driver") && !obj.name.includes("Port") && !obj.name.includes("Mic")) m.color.lerp(targetMetal, a);
      if (obj.name.includes("Driver")) m.emissiveIntensity = THREE.MathUtils.damp(m.emissiveIntensity ?? 0, section === "sound" ? 0.28 : 0, 4, delta);
    });

    if (root.current) {
      let ry = -0.43;
      let rx = -0.04;
      if (section === "sound") ry = -0.7;
      if (section === "silence") ry = 0.18;
      if (section === "material") { ry = -0.88; rx = 0.02; }
      if (section === "longevity") ry = -0.12;
      if (section === "customize") ry = 0.38;
      if (section === "purchase") ry = 0.5;
      if (section === "hero") ry += Math.sin(state.clock.elapsedTime * 0.28) * 0.025;
      root.current.rotation.x = THREE.MathUtils.damp(root.current.rotation.x, rx, 3.2, delta);
      root.current.rotation.y = THREE.MathUtils.damp(root.current.rotation.y, ry, 3.2, delta);
      root.current.rotation.z = THREE.MathUtils.damp(root.current.rotation.z, 0.012, 3.2, delta);
    }

    const targets = new Map<string, THREE.Vector3>();
    base.forEach((v, k) => targets.set(k, v.clone()));
    if (section === "sound") {
      const d = targets.get("Driver_R");
      if (d) d.z += 0.38 + progress * 0.22;
    }
    if (section === "longevity") {
      const l = targets.get("Cushion_L"); const r = targets.get("Cushion_R"); const h = targets.get("Headband_Cushion");
      if (l) l.z += 0.34 + progress * 0.14;
      if (r) r.z -= 0.34 + progress * 0.14;
      if (h) h.y += 0.23 + progress * 0.12;
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
    <group ref={root} scale={0.9} position={[0, -0.18, 0]} rotation={[-0.04, -0.43, 0.012]}>
      <primitive object={model} />
    </group>
  );
}

function SceneContent({ finish, section, progress, interactive }: { finish: Finish; section: Section; progress: number; interactive: boolean }) {
  const pedestal = section === "hero" || section === "material" || section === "explore" || section === "customize";
  return (
    <>
      <CameraRig section={section} interactive={interactive} />
      <Environment resolution={256} frames={1}>
        <Lightformer intensity={3.8} position={[0, 5, 4]} scale={[6, 5, 1]} />
        <Lightformer intensity={2.0} position={[-4, 1.5, 1]} rotation={[0, Math.PI / 2, 0]} scale={[4, 3, 1]} />
        <Lightformer intensity={2.8} position={[4, 2, -2]} rotation={[0, -Math.PI / 2, 0]} scale={[4, 4, 1]} />
        <Lightformer intensity={1.0} position={[0, -3, 2]} scale={[5, 2, 1]} />
      </Environment>
      <ambientLight intensity={0.26} />
      <directionalLight position={[5, 6, 4]} intensity={1.8} color="#fff8ee" castShadow />
      <directionalLight position={[-4, 2, 2]} intensity={0.72} color="#d7c3b1" />
      <SilenceField active={section === "silence"} progress={progress} />
      <Pedestal visible={pedestal} />
      <ProductModel finish={finish} section={section} progress={progress} />
      <ContactShadows position={[0, -1.0, 0]} opacity={0.3} scale={6.0} blur={2.4} far={4.5} resolution={256} />
      <OrbitControls enabled={interactive} enablePan={false} enableZoom={false} minPolarAngle={Math.PI * 0.29} maxPolarAngle={Math.PI * 0.69} target={[0, 0.5, 0]} />
    </>
  );
}

export function ProductScene({ finish, section, progress, interactive }: { finish: Finish; section: Section; progress: number; interactive: boolean }) {
  return (
    <Canvas shadows camera={{ position: [0.15, 0.56, 6.0], fov: 37, near: 0.1, far: 100 }} dpr={[1, 1.6]} gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }} onCreated={({ gl }) => {
      gl.toneMapping = THREE.ACESFilmicToneMapping;
      gl.toneMappingExposure = 0.98;
      gl.outputColorSpace = THREE.SRGBColorSpace;
    }}>
      <SceneContent finish={finish} section={section} progress={progress} interactive={interactive} />
    </Canvas>
  );
}

useGLTF.preload("/models/lunev-one.glb");
