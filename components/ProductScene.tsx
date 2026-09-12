"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer, OrbitControls, RoundedBox } from "@react-three/drei";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

export type Finish = "graphite" | "natural" | "warm";
export type Section = "hero" | "sound" | "silence" | "material" | "longevity" | "explore" | "customize" | "specs" | "purchase";

export const FINISHES: Record<Finish, { label: string; metal: string; cushion: string; trim: string }> = {
  graphite: { label: "Graphite", metal: "#5b554f", cushion: "#1d1b19", trim: "#b8afa4" },
  natural: { label: "Natural", metal: "#c9c0b5", cushion: "#d8d0c7", trim: "#eee8df" },
  warm: { label: "Warm Stone", metal: "#ad9881", cushion: "#68584e", trim: "#d6c4b0" },
};

const cameraStates: Record<Section, { position: [number, number, number]; target: [number, number, number]; fov: number }> = {
  hero: { position: [0.22, 0.52, 7.25], target: [0, 0.45, 0], fov: 38 },
  sound: { position: [1.45, 0.3, 5.8], target: [0.4, 0.08, 0], fov: 36 },
  silence: { position: [-1.45, 0.5, 5.95], target: [-0.18, 0.42, 0], fov: 37 },
  material: { position: [1.55, 0.4, 5.2], target: [0.48, 0.2, 0], fov: 34 },
  longevity: { position: [0.15, 0.62, 6.35], target: [0, 0.45, 0], fov: 38 },
  explore: { position: [0, 0.55, 6.45], target: [0, 0.43, 0], fov: 38 },
  customize: { position: [-0.45, 0.5, 6.2], target: [0, 0.4, 0], fov: 38 },
  specs: { position: [1.1, 0.42, 6.0], target: [0.2, 0.36, 0], fov: 38 },
  purchase: { position: [-1.0, 0.5, 6.0], target: [-0.08, 0.4, 0], fov: 38 },
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
      p.x *= 0.28;
      p.y += 0.02;
      p.z += 0.45;
    }
    const t = new THREE.Vector3(...state.target);
    const k = 1 - Math.exp(-3.2 * delta);
    camera.position.lerp(p, k);
    look.current.lerp(t, k);
    camera.lookAt(look.current);
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.fov = THREE.MathUtils.damp(camera.fov, mobile ? Math.max(40, state.fov + 1) : state.fov, 4, delta);
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
    roundedRectPath(shape, 0.86, 1.1, 0.26);
    const hole = new THREE.Path();
    roundedRectPath(hole, 0.46, 0.68, 0.17);
    shape.holes.push(hole);
    const g = new THREE.ExtrudeGeometry(shape, {
      depth: 0.2,
      steps: 1,
      bevelEnabled: true,
      bevelSegments: 6,
      bevelSize: 0.04,
      bevelThickness: 0.04,
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
  const rotationY = left ? 0.28 : -0.08;
  const cushionZ = left ? 0.31 : -0.31;
  return (
    <group position={[side * 0.68, -0.18, left ? 0.06 : 0]} rotation={[0, rotationY, side * 0.012]}>
      <RoundedBox args={[0.9, 1.14, 0.34]} radius={0.24} smoothness={10} material={metal} castShadow receiveShadow />
      <RoundedBox args={[0.76, 0.98, 0.055]} radius={0.2} smoothness={9} position={[0, 0, left ? -0.205 : 0.205]} material={metal} castShadow />

      {!left && (
        <>
          <mesh position={[0.16, -0.27, 0.245]} material={dark}>
            <boxGeometry args={[0.18, 0.012, 0.01]} />
          </mesh>
          <mesh position={[0.16, -0.31, 0.245]} material={dark}>
            <boxGeometry args={[0.085, 0.008, 0.01]} />
          </mesh>
        </>
      )}

      <group ref={cushionRef} position={[0, 0, cushionZ]}>
        <CushionRing material={soft} />
      </group>

      {left && (
        <group ref={driverRef} position={[0, 0, 0.286]}>
          <RoundedBox args={[0.44, 0.66, 0.045]} radius={0.16} smoothness={6} material={dark} />
          <mesh position={[0, 0, 0.035]} rotation={[Math.PI / 2, 0, 0]} material={driver}>
            <cylinderGeometry args={[0.19, 0.19, 0.03, 64]} />
          </mesh>
        </group>
      )}

      <mesh position={[side * 0.48, 0.35, 0]} rotation={[0, 0, Math.PI / 2]} material={trim} castShadow>
        <cylinderGeometry args={[0.105, 0.105, 0.085, 48]} />
      </mesh>

      {!left && (
        <>
          <mesh position={[0.47, 0.02, 0.045]} rotation={[0, 0, Math.PI / 2]} material={trim} castShadow>
            <cylinderGeometry args={[0.09, 0.09, 0.075, 48]} />
          </mesh>
          <mesh position={[0.51, 0.02, 0.045]} rotation={[0, 0, Math.PI / 2]} material={dark}>
            <torusGeometry args={[0.064, 0.01, 10, 48]} />
          </mesh>
          <RoundedBox args={[0.052, 0.18, 0.06]} radius={0.022} smoothness={4} position={[0.47, -0.22, 0.035]} material={dark} />
          <RoundedBox args={[0.04, 0.14, 0.022]} radius={0.011} smoothness={4} position={[0.22, -0.46, 0.195]} material={dark} />
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

function Pedestal({ visible }: { visible: boolean }) {
  const material = useMemo(() => new THREE.MeshStandardMaterial({ color: "#cfc1b3", roughness: 0.92, metalness: 0 }), []);
  useEffect(() => () => material.dispose(), [material]);
  if (!visible) return null;
  return (
    <group position={[0.15, -1.04, -0.16]}>
      <RoundedBox args={[4.6, 0.16, 2.5]} radius={0.06} smoothness={4} material={material} receiveShadow />
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

  const metal = useMemo(() => new THREE.MeshPhysicalMaterial({ color: "#5b554f", metalness: 0.78, roughness: 0.38, clearcoat: 0.16, clearcoatRoughness: 0.42, envMapIntensity: 1.15 }), []);
  const soft = useMemo(() => new THREE.MeshPhysicalMaterial({ color: "#1d1b19", metalness: 0, roughness: 0.82, sheen: 0.36, sheenRoughness: 0.82, sheenColor: new THREE.Color("#6f6258"), envMapIntensity: 0.38 }), []);
  const trim = useMemo(() => new THREE.MeshPhysicalMaterial({ color: "#b8afa4", metalness: 0.65, roughness: 0.32, clearcoat: 0.12, envMapIntensity: 1.2 }), []);
  const dark = useMemo(() => new THREE.MeshPhysicalMaterial({ color: "#11110f", metalness: 0.12, roughness: 0.55, envMapIntensity: 0.55 }), []);
  const driver = useMemo(() => new THREE.MeshPhysicalMaterial({ color: "#242321", metalness: 0.5, roughness: 0.36, emissive: new THREE.Color("#5a4938"), emissiveIntensity: 0, envMapIntensity: 0.9 }), []);

  const outerCurve = useMemo(() => new THREE.CatmullRomCurve3([
    new THREE.Vector3(-1.02, 0.84, -0.02),
    new THREE.Vector3(-0.88, 1.45, -0.05),
    new THREE.Vector3(-0.48, 1.92, -0.08),
    new THREE.Vector3(0, 2.08, -0.09),
    new THREE.Vector3(0.48, 1.92, -0.08),
    new THREE.Vector3(0.88, 1.45, -0.05),
    new THREE.Vector3(1.02, 0.84, -0.02),
  ]), []);
  const innerCurve = useMemo(() => new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.93, 0.92, 0.03),
    new THREE.Vector3(-0.77, 1.39, 0.01),
    new THREE.Vector3(-0.4, 1.74, -0.02),
    new THREE.Vector3(0, 1.85, -0.03),
    new THREE.Vector3(0.4, 1.74, -0.02),
    new THREE.Vector3(0.77, 1.39, 0.01),
    new THREE.Vector3(0.93, 0.92, 0.03),
  ]), []);

  useEffect(() => () => {
    metal.dispose(); soft.dispose(); trim.dispose(); dark.dispose(); driver.dispose();
  }, [metal, soft, trim, dark, driver]);

  useFrame((state, delta) => {
    const k = 1 - Math.exp(-4.2 * delta);
    metal.color.lerp(targetMetal, k);
    soft.color.lerp(targetSoft, k);
    trim.color.lerp(targetTrim, k);
    driver.emissiveIntensity = THREE.MathUtils.damp(driver.emissiveIntensity, section === "sound" ? 0.25 : 0, 4, delta);

    if (root.current) {
      let ry = -0.5;
      let rx = -0.03;
      if (section === "sound") ry = -0.72;
      if (section === "silence") ry = 0.16;
      if (section === "material") { ry = -0.8; rx = 0.02; }
      if (section === "longevity") ry = -0.18;
      if (section === "customize") ry = 0.3;
      if (section === "specs") ry = -0.42;
      if (section === "purchase") ry = 0.42;
      if (section === "hero") ry += Math.sin(state.clock.elapsedTime * 0.28) * 0.022;
      root.current.rotation.x = THREE.MathUtils.damp(root.current.rotation.x, rx, 3.2, delta);
      root.current.rotation.y = THREE.MathUtils.damp(root.current.rotation.y, ry, 3.2, delta);
      root.current.rotation.z = THREE.MathUtils.damp(root.current.rotation.z, 0.01, 3.2, delta);
      const targetScale = section === "material" ? 1.03 : 1;
      const s = THREE.MathUtils.damp(root.current.scale.x, targetScale, 3.2, delta);
      root.current.scale.setScalar(s);
    }

    if (leftDriver.current) {
      leftDriver.current.position.z = THREE.MathUtils.damp(leftDriver.current.position.z, section === "sound" ? 0.52 + progress * 0.1 : 0.286, 4.2, delta);
    }
    const life = section === "longevity" ? 0.26 + progress * 0.08 : 0;
    if (leftCushion.current) leftCushion.current.position.z = THREE.MathUtils.damp(leftCushion.current.position.z, 0.31 + life, 4.2, delta);
    if (rightCushion.current) rightCushion.current.position.z = THREE.MathUtils.damp(rightCushion.current.position.z, -0.31 - life, 4.2, delta);
    if (innerBand.current) innerBand.current.position.y = THREE.MathUtils.damp(innerBand.current.position.y, section === "longevity" ? 0.11 : 0, 4.2, delta);
  });

  return (
    <group ref={root} position={[0, -0.1, 0]} rotation={[-0.03, -0.5, 0.01]}>
      <Band curve={outerCurve} radius={0.085} material={trim} zScale={0.62} />
      <group ref={innerBand}>
        <Band curve={innerCurve} radius={0.145} material={soft} zScale={0.76} />
      </group>

      <RoundedBox args={[0.085, 0.48, 0.11]} radius={0.03} smoothness={5} position={[-1.05, 0.72, 0]} rotation={[0, 0, -0.06]} material={trim} castShadow />
      <RoundedBox args={[0.085, 0.48, 0.11]} radius={0.03} smoothness={5} position={[1.05, 0.72, 0]} rotation={[0, 0, 0.06]} material={trim} castShadow />
      <RoundedBox args={[0.09, 0.66, 0.12]} radius={0.032} smoothness={5} position={[-1.11, 0.34, 0]} rotation={[0, 0, 0.06]} material={trim} castShadow />
      <RoundedBox args={[0.09, 0.66, 0.12]} radius={0.032} smoothness={5} position={[1.11, 0.34, 0]} rotation={[0, 0, -0.06]} material={trim} castShadow />

      <Cup side={-1} metal={metal} soft={soft} trim={trim} dark={dark} driver={driver} cushionRef={leftCushion} driverRef={leftDriver} />
      <Cup side={1} metal={metal} soft={soft} trim={trim} dark={dark} driver={driver} cushionRef={rightCushion} driverRef={rightDriver} />
    </group>
  );
}

function SceneContent({ finish, section, progress, interactive }: { finish: Finish; section: Section; progress: number; interactive: boolean }) {
  const showPedestal = section === "hero" || section === "material" || section === "explore" || section === "customize";
  return (
    <>
      <CameraRig section={section} interactive={interactive} />
      <Environment resolution={256} frames={1}>
        <Lightformer intensity={3.5} position={[0, 5, 4]} scale={[6, 5, 1]} />
        <Lightformer intensity={1.8} position={[-4, 1.5, 1]} rotation={[0, Math.PI / 2, 0]} scale={[4, 3, 1]} />
        <Lightformer intensity={2.5} position={[4, 2, -2]} rotation={[0, -Math.PI / 2, 0]} scale={[4, 4, 1]} />
        <Lightformer intensity={1.0} position={[0, -3, 2]} scale={[5, 2, 1]} />
      </Environment>
      <ambientLight intensity={0.28} />
      <directionalLight position={[5, 6, 4]} intensity={1.8} color="#fff8ee" castShadow />
      <directionalLight position={[-4, 2, 2]} intensity={0.7} color="#d7c3b1" />
      <SilenceField active={section === "silence"} progress={progress} />
      <Pedestal visible={showPedestal} />
      <HeadphoneModel finish={finish} section={section} progress={progress} />
      <ContactShadows position={[0, -1.0, 0]} opacity={0.32} scale={5.8} blur={2.3} far={4} resolution={256} />
      <OrbitControls enabled={interactive} enablePan={false} enableZoom={false} minPolarAngle={Math.PI * 0.29} maxPolarAngle={Math.PI * 0.69} target={[0, 0.42, 0]} />
    </>
  );
}

export function ProductScene({ finish, section, progress, interactive }: { finish: Finish; section: Section; progress: number; interactive: boolean }) {
  return (
    <Canvas
      shadows
      camera={{ position: [0.22, 0.52, 7.25], fov: 38, near: 0.1, far: 100 }}
      dpr={[1, 1.6]}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 0.96;
        gl.outputColorSpace = THREE.SRGBColorSpace;
      }}
    >
      <SceneContent finish={finish} section={section} progress={progress} interactive={interactive} />
    </Canvas>
  );
}
