"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer, OrbitControls, RoundedBox } from "@react-three/drei";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

export type Finish = "graphite" | "natural" | "warm";
export type Section = "hero" | "sound" | "silence" | "material" | "longevity" | "explore" | "customize" | "specs" | "purchase";

export const FINISHES: Record<Finish, { label: string; metal: string; cushion: string; trim: string }> = {
  graphite: { label: "Graphite", metal: "#514d49", cushion: "#171615", trim: "#b9b1a7" },
  natural: { label: "Natural", metal: "#c7beb2", cushion: "#d8d0c6", trim: "#eee9e1" },
  warm: { label: "Warm Stone", metal: "#ae9982", cushion: "#6f6055", trim: "#d6c4ae" },
};

const cameraStates: Record<Section, { position: [number, number, number]; target: [number, number, number]; fov: number }> = {
  hero: { position: [0.15, 0.55, 5.65], target: [0, 0.5, 0], fov: 36 },
  sound: { position: [2.15, 0.15, 4.0], target: [0.82, 0.0, 0], fov: 32 },
  silence: { position: [-1.85, 0.55, 4.7], target: [-0.3, 0.45, 0], fov: 35 },
  material: { position: [2.55, 0.45, 3.4], target: [1.0, 0.1, 0], fov: 30 },
  longevity: { position: [0.1, 0.75, 5.1], target: [0, 0.55, 0], fov: 36 },
  explore: { position: [0, 0.62, 5.55], target: [0, 0.5, 0], fov: 36 },
  customize: { position: [-0.3, 0.55, 5.25], target: [0, 0.42, 0], fov: 36 },
  specs: { position: [1.55, 0.45, 4.65], target: [0.35, 0.35, 0], fov: 36 },
  purchase: { position: [-1.35, 0.55, 4.8], target: [-0.15, 0.4, 0], fov: 36 },
};

function CameraRig({ section, interactive }: { section: Section; interactive: boolean }) {
  const { camera, size } = useThree();
  const look = useRef(new THREE.Vector3());
  const state = cameraStates[section];

  useFrame((_, delta) => {
    if (interactive) return;
    const mobile = size.width < 760;
    const p = new THREE.Vector3(...state.position);
    if (mobile) {
      p.x *= 0.42;
      p.y += 0.2;
      p.z += 1.45;
    }
    const t = new THREE.Vector3(...state.target);
    const k = 1 - Math.exp(-3.4 * delta);
    camera.position.lerp(p, k);
    look.current.lerp(t, k);
    camera.lookAt(look.current);
    if (camera instanceof THREE.PerspectiveCamera) {
      const targetFov = mobile ? Math.max(state.fov, 42) : state.fov;
      camera.fov = THREE.MathUtils.damp(camera.fov, targetFov, 4, delta);
      camera.updateProjectionMatrix();
    }
  });

  return null;
}

function Band({ curve, radius, material }: { curve: THREE.CatmullRomCurve3; radius: number; material: THREE.Material }) {
  return (
    <mesh material={material} castShadow receiveShadow>
      <tubeGeometry args={[curve, 96, radius, 14, false]} />
    </mesh>
  );
}

function CushionRing({ material }: { material: THREE.Material }) {
  return (
    <group>
      <RoundedBox args={[0.64, 0.18, 0.18]} radius={0.08} smoothness={6} position={[0, 0.43, 0]} material={material} castShadow />
      <RoundedBox args={[0.64, 0.18, 0.18]} radius={0.08} smoothness={6} position={[0, -0.43, 0]} material={material} castShadow />
      <RoundedBox args={[0.18, 0.72, 0.18]} radius={0.08} smoothness={6} position={[-0.31, 0, 0]} material={material} castShadow />
      <RoundedBox args={[0.18, 0.72, 0.18]} radius={0.08} smoothness={6} position={[0.31, 0, 0]} material={material} castShadow />
    </group>
  );
}

function Cup({
  side,
  metal,
  soft,
  trim,
  dark,
  driver,
  cushionRef,
  driverRef,
}: {
  side: -1 | 1;
  metal: THREE.Material;
  soft: THREE.Material;
  trim: THREE.Material;
  dark: THREE.Material;
  driver: THREE.MeshPhysicalMaterial;
  cushionRef: React.RefObject<THREE.Group | null>;
  driverRef: React.RefObject<THREE.Group | null>;
}) {
  const x = side * 1.08;
  return (
    <group position={[x, 0, 0]}>
      <RoundedBox args={[0.84, 1.16, 0.38]} radius={0.19} smoothness={8} material={metal} castShadow receiveShadow />
      <RoundedBox args={[0.71, 1.02, 0.055]} radius={0.15} smoothness={7} position={[0, 0, 0.218]} material={trim} castShadow />
      <RoundedBox args={[0.59, 0.88, 0.035]} radius={0.13} smoothness={7} position={[0, 0, 0.253]} material={dark} />
      <group ref={driverRef} position={[0, 0, 0.285]}>
        <mesh rotation={[Math.PI / 2, 0, 0]} material={driver} castShadow>
          <cylinderGeometry args={[0.235, 0.235, 0.04, 64]} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.028]} material={dark}>
          <torusGeometry args={[0.17, 0.018, 12, 64]} />
        </mesh>
      </group>

      <group ref={cushionRef} position={[0, 0, -0.31]}>
        <CushionRing material={soft} />
      </group>

      <mesh position={[side * 0.49, 0.42, 0]} rotation={[0, 0, Math.PI / 2]} material={metal} castShadow>
        <cylinderGeometry args={[0.16, 0.16, 0.12, 48]} />
      </mesh>
      <mesh position={[side * 0.49, 0.42, 0]} rotation={[0, 0, Math.PI / 2]} material={dark}>
        <torusGeometry args={[0.115, 0.016, 10, 48]} />
      </mesh>

      <RoundedBox args={[0.09, 0.7, 0.11]} radius={0.035} smoothness={5} position={[side * 0.52, 0.76, 0]} rotation={[0, 0, side * -0.07]} material={metal} castShadow />
      <RoundedBox args={[0.09, 0.7, 0.11]} radius={0.035} smoothness={5} position={[side * 0.34, 0.78, 0]} rotation={[0, 0, side * 0.05]} material={metal} castShadow />
      <RoundedBox args={[0.28, 0.08, 0.12]} radius={0.035} smoothness={5} position={[side * 0.43, 1.08, 0]} material={metal} castShadow />

      {side === 1 && (
        <>
          <mesh position={[0.51, 0.08, 0.04]} rotation={[0, 0, Math.PI / 2]} material={metal} castShadow>
            <cylinderGeometry args={[0.145, 0.145, 0.11, 64]} />
          </mesh>
          <mesh position={[0.565, 0.08, 0.04]} rotation={[0, 0, Math.PI / 2]} material={dark}>
            <torusGeometry args={[0.108, 0.018, 12, 64]} />
          </mesh>
          <RoundedBox args={[0.09, 0.23, 0.08]} radius={0.035} smoothness={5} position={[0.51, -0.23, 0.03]} material={dark} />
          <RoundedBox args={[0.065, 0.17, 0.035]} radius={0.018} smoothness={4} position={[0.22, -0.48, 0.205]} material={dark} />
        </>
      )}
    </group>
  );
}

function SilenceField({ active, progress }: { active: boolean; progress: number }) {
  const group = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (!group.current) return;
    const target = active ? 0.72 + progress * 0.08 : 1.35;
    const s = THREE.MathUtils.damp(group.current.scale.x, target, 3.5, delta);
    group.current.scale.setScalar(s);
    group.current.rotation.z += delta * 0.035;
  });

  return (
    <group ref={group} position={[0, 0.55, -1.0]} visible={active}>
      {[1.15, 1.45, 1.78, 2.12].map((r, i) => (
        <mesh key={r} rotation={[0, 0, i * 0.13]}>
          <torusGeometry args={[r, 0.008, 5, 128]} />
          <meshBasicMaterial color="#c8b9aa" transparent opacity={0.24 - i * 0.035} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

function HeadphoneModel({ finish, section, progress }: { finish: Finish; section: Section; progress: number }) {
  const root = useRef<THREE.Group>(null);
  const leftCushion = useRef<THREE.Group>(null);
  const rightCushion = useRef<THREE.Group>(null);
  const leftDriver = useRef<THREE.Group>(null);
  const rightDriver = useRef<THREE.Group>(null);
  const innerBand = useRef<THREE.Group>(null);

  const palette = FINISHES[finish];
  const targetMetal = useMemo(() => new THREE.Color(palette.metal), [palette.metal]);
  const targetSoft = useMemo(() => new THREE.Color(palette.cushion), [palette.cushion]);
  const targetTrim = useMemo(() => new THREE.Color(palette.trim), [palette.trim]);

  const metal = useMemo(() => new THREE.MeshPhysicalMaterial({ color: "#514d49", metalness: 0.82, roughness: 0.24, clearcoat: 0.38, clearcoatRoughness: 0.28, envMapIntensity: 1.55 }), []);
  const soft = useMemo(() => new THREE.MeshPhysicalMaterial({ color: "#171615", metalness: 0, roughness: 0.84, sheen: 0.45, sheenRoughness: 0.76, sheenColor: new THREE.Color("#7b6d61"), envMapIntensity: 0.5 }), []);
  const trim = useMemo(() => new THREE.MeshPhysicalMaterial({ color: "#b9b1a7", metalness: 0.58, roughness: 0.3, clearcoat: 0.24, envMapIntensity: 1.25 }), []);
  const dark = useMemo(() => new THREE.MeshPhysicalMaterial({ color: "#11110f", metalness: 0.18, roughness: 0.48, envMapIntensity: 0.72 }), []);
  const driver = useMemo(() => new THREE.MeshPhysicalMaterial({ color: "#20201e", metalness: 0.68, roughness: 0.3, emissive: new THREE.Color("#5a4938"), emissiveIntensity: 0, envMapIntensity: 1 }), []);

  const outerCurve = useMemo(() => new THREE.CatmullRomCurve3([
    new THREE.Vector3(-1.29, 1.04, 0),
    new THREE.Vector3(-1.05, 1.7, -0.03),
    new THREE.Vector3(-0.55, 2.14, -0.06),
    new THREE.Vector3(0, 2.28, -0.07),
    new THREE.Vector3(0.55, 2.14, -0.06),
    new THREE.Vector3(1.05, 1.7, -0.03),
    new THREE.Vector3(1.29, 1.04, 0),
  ]), []);
  const innerCurve = useMemo(() => new THREE.CatmullRomCurve3([
    new THREE.Vector3(-1.19, 1.19, -0.02),
    new THREE.Vector3(-0.88, 1.65, -0.07),
    new THREE.Vector3(-0.45, 1.93, -0.1),
    new THREE.Vector3(0, 2.02, -0.11),
    new THREE.Vector3(0.45, 1.93, -0.1),
    new THREE.Vector3(0.88, 1.65, -0.07),
    new THREE.Vector3(1.19, 1.19, -0.02),
  ]), []);

  useEffect(() => () => {
    metal.dispose(); soft.dispose(); trim.dispose(); dark.dispose(); driver.dispose();
  }, [metal, soft, trim, dark, driver]);

  useFrame((state, delta) => {
    const k = 1 - Math.exp(-4.4 * delta);
    metal.color.lerp(targetMetal, k);
    soft.color.lerp(targetSoft, k);
    trim.color.lerp(targetTrim, k);
    driver.emissiveIntensity = THREE.MathUtils.damp(driver.emissiveIntensity, section === "sound" ? 0.42 : 0, 4, delta);

    if (root.current) {
      let ry = -0.36;
      let rx = -0.05;
      let rz = 0.015;
      if (section === "sound") { ry = -0.72; rx = -0.03; }
      if (section === "silence") { ry = 0.2; rx = -0.03; }
      if (section === "material") { ry = -0.88; rx = 0.03; }
      if (section === "longevity") { ry = -0.18; rx = -0.07; }
      if (section === "customize") { ry = 0.42; rx = -0.04; }
      if (section === "specs") { ry = -0.52; }
      if (section === "purchase") { ry = 0.52; }
      if (section === "hero") ry += Math.sin(state.clock.elapsedTime * 0.32) * 0.045;
      root.current.rotation.x = THREE.MathUtils.damp(root.current.rotation.x, rx, 3.2, delta);
      root.current.rotation.y = THREE.MathUtils.damp(root.current.rotation.y, ry, 3.2, delta);
      root.current.rotation.z = THREE.MathUtils.damp(root.current.rotation.z, rz, 3.2, delta);
      const scaleTarget = section === "material" ? 1.07 : section === "sound" ? 1.02 : 1;
      const s = THREE.MathUtils.damp(root.current.scale.x, scaleTarget, 3.3, delta);
      root.current.scale.setScalar(s);
    }

    const soundOut = section === "sound" ? 0.44 + progress * 0.16 : 0;
    if (rightDriver.current) rightDriver.current.position.z = THREE.MathUtils.damp(rightDriver.current.position.z, 0.285 + soundOut, 4.2, delta);
    if (leftDriver.current) leftDriver.current.position.z = THREE.MathUtils.damp(leftDriver.current.position.z, 0.285, 4.2, delta);

    const life = section === "longevity" ? 0.34 + progress * 0.1 : 0;
    if (leftCushion.current) {
      leftCushion.current.position.z = THREE.MathUtils.damp(leftCushion.current.position.z, -0.31 - life, 4.2, delta);
      leftCushion.current.position.x = THREE.MathUtils.damp(leftCushion.current.position.x, -life * 0.28, 4.2, delta);
    }
    if (rightCushion.current) {
      rightCushion.current.position.z = THREE.MathUtils.damp(rightCushion.current.position.z, -0.31 - life, 4.2, delta);
      rightCushion.current.position.x = THREE.MathUtils.damp(rightCushion.current.position.x, life * 0.28, 4.2, delta);
    }
    if (innerBand.current) innerBand.current.position.y = THREE.MathUtils.damp(innerBand.current.position.y, section === "longevity" ? 0.14 : 0, 4.2, delta);
  });

  return (
    <group ref={root} position={[0, -0.28, 0]} rotation={[-0.05, -0.36, 0.015]}>
      <Band curve={outerCurve} radius={0.09} material={metal} />
      <group ref={innerBand}>
        <Band curve={innerCurve} radius={0.12} material={soft} />
      </group>
      <RoundedBox args={[0.11, 0.58, 0.13]} radius={0.035} smoothness={5} position={[-1.18, 1.31, 0]} rotation={[0, 0, -0.12]} material={metal} castShadow />
      <RoundedBox args={[0.11, 0.58, 0.13]} radius={0.035} smoothness={5} position={[1.18, 1.31, 0]} rotation={[0, 0, 0.12]} material={metal} castShadow />

      <Cup side={-1} metal={metal} soft={soft} trim={trim} dark={dark} driver={driver} cushionRef={leftCushion} driverRef={leftDriver} />
      <Cup side={1} metal={metal} soft={soft} trim={trim} dark={dark} driver={driver} cushionRef={rightCushion} driverRef={rightDriver} />
    </group>
  );
}

function SceneContent({ finish, section, progress, interactive }: { finish: Finish; section: Section; progress: number; interactive: boolean }) {
  return (
    <>
      <CameraRig section={section} interactive={interactive} />
      <Environment resolution={256} frames={1}>
        <Lightformer intensity={4.4} position={[0, 5, 4]} scale={[6, 6, 1]} />
        <Lightformer intensity={2.3} position={[-4, 1.5, 1]} rotation={[0, Math.PI / 2, 0]} scale={[4, 3, 1]} />
        <Lightformer intensity={3.1} position={[4, 2, -2]} rotation={[0, -Math.PI / 2, 0]} scale={[4, 4, 1]} />
        <Lightformer intensity={1.4} position={[0, -3, 2]} scale={[5, 2, 1]} />
      </Environment>
      <ambientLight intensity={0.38} />
      <directionalLight position={[5, 6, 4]} intensity={2.5} color="#fff8ee" castShadow />
      <directionalLight position={[-4, 2, 2]} intensity={1.15} color="#d9c7b7" />
      <SilenceField active={section === "silence"} progress={progress} />
      <HeadphoneModel finish={finish} section={section} progress={progress} />
      <ContactShadows position={[0, -1.12, 0]} opacity={0.28} scale={6.2} blur={2.8} far={4.5} resolution={256} />
      <OrbitControls enabled={interactive} enablePan={false} enableZoom={false} minPolarAngle={Math.PI * 0.28} maxPolarAngle={Math.PI * 0.7} target={[0, 0.45, 0]} />
    </>
  );
}

export function ProductScene({ finish, section, progress, interactive }: { finish: Finish; section: Section; progress: number; interactive: boolean }) {
  return (
    <Canvas
      shadows
      camera={{ position: [0.15, 0.55, 5.65], fov: 36, near: 0.1, far: 100 }}
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.05;
        gl.outputColorSpace = THREE.SRGBColorSpace;
      }}
    >
      <SceneContent finish={finish} section={section} progress={progress} interactive={interactive} />
    </Canvas>
  );
}
