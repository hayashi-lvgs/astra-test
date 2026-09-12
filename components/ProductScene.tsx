"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer, OrbitControls, RoundedBox } from "@react-three/drei";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

export type Finish = "graphite" | "natural" | "warm";
export type Section = "hero" | "sound" | "silence" | "material" | "longevity" | "explore" | "customize" | "specs" | "purchase";

export const FINISHES: Record<Finish, { label: string; metal: string; cushion: string; trim: string }> = {
  graphite: { label: "Graphite", metal: "#57514b", cushion: "#171614", trim: "#bdb5aa" },
  natural: { label: "Natural", metal: "#c8beb2", cushion: "#d8d0c6", trim: "#eee8df" },
  warm: { label: "Warm Stone", metal: "#ae9982", cushion: "#66564b", trim: "#dac9b4" },
};

const cameraStates: Record<Section, { position: [number, number, number]; target: [number, number, number]; fov: number }> = {
  hero: { position: [0.2, 0.55, 7.35], target: [0, 0.52, 0], fov: 38 },
  sound: { position: [1.55, 0.35, 5.9], target: [0.45, 0.15, 0], fov: 36 },
  silence: { position: [-1.5, 0.55, 6.1], target: [-0.2, 0.45, 0], fov: 37 },
  material: { position: [1.65, 0.45, 5.35], target: [0.55, 0.25, 0], fov: 34 },
  longevity: { position: [0.15, 0.65, 6.5], target: [0, 0.5, 0], fov: 38 },
  explore: { position: [0, 0.55, 6.7], target: [0, 0.48, 0], fov: 38 },
  customize: { position: [-0.55, 0.55, 6.35], target: [0, 0.42, 0], fov: 38 },
  specs: { position: [1.2, 0.45, 6.1], target: [0.25, 0.38, 0], fov: 38 },
  purchase: { position: [-1.15, 0.55, 6.1], target: [-0.1, 0.42, 0], fov: 38 },
};

function CameraRig({ section, interactive }: { section: Section; interactive: boolean }) {
  const { camera, size } = useThree();
  const look = useRef(new THREE.Vector3(0, 0.45, 0));
  const state = cameraStates[section];

  useFrame((_, delta) => {
    if (interactive) return;
    const mobile = size.width < 760;
    const p = new THREE.Vector3(...state.position);
    if (mobile) {
      p.x *= 0.35;
      p.y += 0.08;
      p.z += 1.5;
    }
    const t = new THREE.Vector3(...state.target);
    const k = 1 - Math.exp(-3.2 * delta);
    camera.position.lerp(p, k);
    look.current.lerp(t, k);
    camera.lookAt(look.current);
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.fov = THREE.MathUtils.damp(camera.fov, mobile ? Math.max(42, state.fov + 2) : state.fov, 4, delta);
      camera.updateProjectionMatrix();
    }
  });
  return null;
}

function roundedRectPath(path: THREE.Path | THREE.Shape, width: number, height: number, radius: number) {
  const x = -width / 2;
  const y = -height / 2;
  path.moveTo(x + radius, y);
  path.lineTo(x + width - radius, y);
  path.quadraticCurveTo(x + width, y, x + width, y + radius);
  path.lineTo(x + width, y + height - radius);
  path.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  path.lineTo(x + radius, y + height);
  path.quadraticCurveTo(x, y + height, x, y + height - radius);
  path.lineTo(x, y + radius);
  path.quadraticCurveTo(x, y, x + radius, y);
}

function CushionRing({ material }: { material: THREE.Material }) {
  const geometry = useMemo(() => {
    const shape = new THREE.Shape();
    roundedRectPath(shape, 0.82, 1.08, 0.25);
    const hole = new THREE.Path();
    roundedRectPath(hole, 0.48, 0.72, 0.18);
    shape.holes.push(hole);
    const g = new THREE.ExtrudeGeometry(shape, {
      depth: 0.18,
      steps: 1,
      bevelEnabled: true,
      bevelSegments: 5,
      bevelSize: 0.035,
      bevelThickness: 0.035,
    });
    g.center();
    return g;
  }, []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <mesh geometry={geometry} material={material} castShadow receiveShadow />;
}

function Band({ curve, radius, material, zScale = 0.72 }: { curve: THREE.CatmullRomCurve3; radius: number; material: THREE.Material; zScale?: number }) {
  return (
    <mesh material={material} castShadow receiveShadow scale={[1, 1, zScale]}>
      <tubeGeometry args={[curve, 96, radius, 18, false]} />
    </mesh>
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
  driver: THREE.Material;
  cushionRef: React.RefObject<THREE.Group | null>;
  driverRef: React.RefObject<THREE.Group | null>;
}) {
  const left = side === -1;
  const rotationY = left ? 0.26 : -0.1;
  const cushionZ = left ? 0.31 : -0.31;
  return (
    <group position={[side * 0.76, -0.22 + (left ? 0.02 : 0), left ? 0.06 : 0]} rotation={[0, rotationY, side * 0.015]}>
      <RoundedBox args={[0.94, 1.18, 0.34]} radius={0.22} smoothness={8} material={metal} castShadow receiveShadow />
      <RoundedBox args={[0.78, 1.01, 0.07]} radius={0.18} smoothness={7} position={[0, 0, left ? -0.205 : 0.205]} material={trim} castShadow />
      {!left && (
        <>
          <RoundedBox args={[0.69, 0.91, 0.045]} radius={0.16} smoothness={7} position={[0, 0, 0.258]} material={metal} />
          <mesh position={[0.2, 0.03, 0.292]} material={dark}>
            <boxGeometry args={[0.19, 0.012, 0.01]} />
          </mesh>
        </>
      )}

      <group ref={cushionRef} position={[0, 0, cushionZ]}>
        <CushionRing material={soft} />
      </group>

      {left && (
        <group ref={driverRef} position={[0, 0, 0.285]}>
          <RoundedBox args={[0.47, 0.68, 0.045]} radius={0.16} smoothness={6} material={dark} />
          <mesh position={[0, 0, 0.035]} rotation={[Math.PI / 2, 0, 0]} material={driver}>
            <cylinderGeometry args={[0.205, 0.205, 0.035, 64]} />
          </mesh>
        </group>
      )}

      <mesh position={[side * 0.51, 0.34, 0]} rotation={[0, 0, Math.PI / 2]} material={trim} castShadow>
        <cylinderGeometry args={[0.125, 0.125, 0.11, 48]} />
      </mesh>
      <mesh position={[side * 0.51, 0.34, 0]} rotation={[0, 0, Math.PI / 2]} material={dark}>
        <torusGeometry args={[0.09, 0.012, 10, 48]} />
      </mesh>

      {!left && (
        <>
          <mesh position={[0.5, 0.05, 0.05]} rotation={[0, 0, Math.PI / 2]} material={trim} castShadow>
            <cylinderGeometry args={[0.115, 0.115, 0.095, 48]} />
          </mesh>
          <mesh position={[0.55, 0.05, 0.05]} rotation={[0, 0, Math.PI / 2]} material={dark}>
            <torusGeometry args={[0.082, 0.012, 10, 48]} />
          </mesh>
          <RoundedBox args={[0.06, 0.21, 0.07]} radius={0.025} smoothness={4} position={[0.5, -0.22, 0.04]} material={dark} />
          <RoundedBox args={[0.045, 0.15, 0.025]} radius={0.012} smoothness={4} position={[0.25, -0.48, 0.195]} material={dark} />
        </>
      )}
    </group>
  );
}

function SilenceField({ active, progress }: { active: boolean; progress: number }) {
  const group = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (!group.current) return;
    const target = active ? 0.72 + progress * 0.06 : 1.28;
    const s = THREE.MathUtils.damp(group.current.scale.x, target, 3.5, delta);
    group.current.scale.setScalar(s);
    group.current.rotation.z += delta * 0.025;
  });
  return (
    <group ref={group} position={[0, 0.42, -0.9]} visible={active}>
      {[1.15, 1.45, 1.78].map((r, i) => (
        <mesh key={r} rotation={[0, 0, i * 0.11]}>
          <torusGeometry args={[r, 0.006, 5, 128]} />
          <meshBasicMaterial color="#c8b9aa" transparent opacity={0.2 - i * 0.04} toneMapped={false} />
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

  const metal = useMemo(() => new THREE.MeshPhysicalMaterial({ color: "#57514b", metalness: 0.88, roughness: 0.29, clearcoat: 0.24, clearcoatRoughness: 0.34, envMapIntensity: 1.35 }), []);
  const soft = useMemo(() => new THREE.MeshPhysicalMaterial({ color: "#171614", metalness: 0, roughness: 0.76, sheen: 0.42, sheenRoughness: 0.78, sheenColor: new THREE.Color("#72665d"), envMapIntensity: 0.42 }), []);
  const trim = useMemo(() => new THREE.MeshPhysicalMaterial({ color: "#bdb5aa", metalness: 0.72, roughness: 0.25, clearcoat: 0.2, envMapIntensity: 1.4 }), []);
  const dark = useMemo(() => new THREE.MeshPhysicalMaterial({ color: "#11110f", metalness: 0.16, roughness: 0.5, envMapIntensity: 0.65 }), []);
  const driver = useMemo(() => new THREE.MeshPhysicalMaterial({ color: "#242321", metalness: 0.58, roughness: 0.32, emissive: new THREE.Color("#5a4938"), emissiveIntensity: 0, envMapIntensity: 1 }), []);

  const outerCurve = useMemo(() => new THREE.CatmullRomCurve3([
    new THREE.Vector3(-1.08, 0.96, -0.02),
    new THREE.Vector3(-0.92, 1.55, -0.05),
    new THREE.Vector3(-0.5, 2.0, -0.08),
    new THREE.Vector3(0, 2.16, -0.09),
    new THREE.Vector3(0.5, 2.0, -0.08),
    new THREE.Vector3(0.92, 1.55, -0.05),
    new THREE.Vector3(1.08, 0.96, -0.02),
  ]), []);
  const innerCurve = useMemo(() => new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.98, 1.02, 0.03),
    new THREE.Vector3(-0.8, 1.49, 0.01),
    new THREE.Vector3(-0.42, 1.82, -0.02),
    new THREE.Vector3(0, 1.93, -0.03),
    new THREE.Vector3(0.42, 1.82, -0.02),
    new THREE.Vector3(0.8, 1.49, 0.01),
    new THREE.Vector3(0.98, 1.02, 0.03),
  ]), []);

  useEffect(() => () => {
    metal.dispose(); soft.dispose(); trim.dispose(); dark.dispose(); driver.dispose();
  }, [metal, soft, trim, dark, driver]);

  useFrame((state, delta) => {
    const k = 1 - Math.exp(-4.2 * delta);
    metal.color.lerp(targetMetal, k);
    soft.color.lerp(targetSoft, k);
    trim.color.lerp(targetTrim, k);
    driver.emissiveIntensity = THREE.MathUtils.damp(driver.emissiveIntensity, section === "sound" ? 0.28 : 0, 4, delta);

    if (root.current) {
      let ry = -0.48;
      let rx = -0.035;
      if (section === "sound") ry = -0.72;
      if (section === "silence") ry = 0.18;
      if (section === "material") { ry = -0.82; rx = 0.02; }
      if (section === "longevity") ry = -0.18;
      if (section === "customize") ry = 0.32;
      if (section === "specs") ry = -0.44;
      if (section === "purchase") ry = 0.44;
      if (section === "hero") ry += Math.sin(state.clock.elapsedTime * 0.28) * 0.025;
      root.current.rotation.x = THREE.MathUtils.damp(root.current.rotation.x, rx, 3.2, delta);
      root.current.rotation.y = THREE.MathUtils.damp(root.current.rotation.y, ry, 3.2, delta);
      root.current.rotation.z = THREE.MathUtils.damp(root.current.rotation.z, 0.012, 3.2, delta);
      const targetScale = section === "material" ? 1.03 : 1;
      const s = THREE.MathUtils.damp(root.current.scale.x, targetScale, 3.2, delta);
      root.current.scale.setScalar(s);
    }

    if (leftDriver.current) {
      leftDriver.current.position.z = THREE.MathUtils.damp(leftDriver.current.position.z, section === "sound" ? 0.54 + progress * 0.12 : 0.285, 4.2, delta);
    }
    const life = section === "longevity" ? 0.28 + progress * 0.08 : 0;
    if (leftCushion.current) leftCushion.current.position.z = THREE.MathUtils.damp(leftCushion.current.position.z, 0.31 + life, 4.2, delta);
    if (rightCushion.current) rightCushion.current.position.z = THREE.MathUtils.damp(rightCushion.current.position.z, -0.31 - life, 4.2, delta);
    if (innerBand.current) innerBand.current.position.y = THREE.MathUtils.damp(innerBand.current.position.y, section === "longevity" ? 0.12 : 0, 4.2, delta);
  });

  return (
    <group ref={root} position={[0, -0.16, 0]} rotation={[-0.035, -0.48, 0.012]}>
      <Band curve={outerCurve} radius={0.115} material={metal} zScale={0.66} />
      <group ref={innerBand}>
        <Band curve={innerCurve} radius={0.13} material={soft} zScale={0.78} />
      </group>

      <RoundedBox args={[0.09, 0.64, 0.12]} radius={0.035} smoothness={5} position={[-1.0, 1.18, 0]} rotation={[0, 0, -0.11]} material={trim} castShadow />
      <RoundedBox args={[0.09, 0.64, 0.12]} radius={0.035} smoothness={5} position={[1.0, 1.18, 0]} rotation={[0, 0, 0.11]} material={trim} castShadow />
      <RoundedBox args={[0.08, 0.58, 0.11]} radius={0.03} smoothness={5} position={[-0.86, 0.73, 0]} rotation={[0, 0, 0.08]} material={trim} castShadow />
      <RoundedBox args={[0.08, 0.58, 0.11]} radius={0.03} smoothness={5} position={[0.86, 0.73, 0]} rotation={[0, 0, -0.08]} material={trim} castShadow />

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
        <Lightformer intensity={4.2} position={[0, 5, 4]} scale={[6, 5, 1]} />
        <Lightformer intensity={2.2} position={[-4, 1.5, 1]} rotation={[0, Math.PI / 2, 0]} scale={[4, 3, 1]} />
        <Lightformer intensity={3.2} position={[4, 2, -2]} rotation={[0, -Math.PI / 2, 0]} scale={[4, 4, 1]} />
        <Lightformer intensity={1.3} position={[0, -3, 2]} scale={[5, 2, 1]} />
      </Environment>
      <ambientLight intensity={0.34} />
      <directionalLight position={[5, 6, 4]} intensity={2.2} color="#fff8ee" castShadow />
      <directionalLight position={[-4, 2, 2]} intensity={0.9} color="#d7c3b1" />
      <SilenceField active={section === "silence"} progress={progress} />
      <HeadphoneModel finish={finish} section={section} progress={progress} />
      <ContactShadows position={[0, -1.02, 0]} opacity={0.25} scale={5.8} blur={2.6} far={4} resolution={256} />
      <OrbitControls enabled={interactive} enablePan={false} enableZoom={false} minPolarAngle={Math.PI * 0.29} maxPolarAngle={Math.PI * 0.69} target={[0, 0.45, 0]} />
    </>
  );
}

export function ProductScene({ finish, section, progress, interactive }: { finish: Finish; section: Section; progress: number; interactive: boolean }) {
  return (
    <Canvas
      shadows
      camera={{ position: [0.2, 0.55, 7.35], fov: 38, near: 0.1, far: 100 }}
      dpr={[1, 1.6]}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.04;
        gl.outputColorSpace = THREE.SRGBColorSpace;
      }}
    >
      <SceneContent finish={finish} section={section} progress={progress} interactive={interactive} />
    </Canvas>
  );
}
