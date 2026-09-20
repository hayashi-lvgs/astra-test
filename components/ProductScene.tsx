"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  ContactShadows,
  Environment,
  Lightformer,
  OrbitControls,
  RoundedBox,
  useGLTF,
} from "@react-three/drei";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

const ASSET_PREFIX = process.env.NEXT_PUBLIC_ASSET_PREFIX ?? "";
const MODEL_URL = `${ASSET_PREFIX}/models/lunev-one.glb`;

export type Finish = "graphite" | "natural" | "warm";
export type Section =
  | "hero"
  | "sound"
  | "silence"
  | "material"
  | "longevity"
  | "explore"
  | "customize"
  | "specs"
  | "purchase";

export const FINISHES: Record<
  Finish,
  { label: string; metal: string; cushion: string; trim: string }
> = {
  graphite: {
    label: "Graphite",
    metal: "#302d2a",
    cushion: "#11100f",
    trim: "#756d66",
  },
  natural: {
    label: "Natural",
    metal: "#81776e",
    cushion: "#a9a097",
    trim: "#a3988d",
  },
  warm: {
    label: "Warm Stone",
    metal: "#8d735f",
    cushion: "#66574c",
    trim: "#ad927a",
  },
};

const cameraStates: Record<
  Section,
  {
    position: [number, number, number];
    target: [number, number, number];
    fov: number;
  }
> = {
  hero: { position: [0.18, 0.62, 5.45], target: [0.02, 0.54, 0], fov: 32 },
  sound: { position: [1.7, 0.3, 4.5], target: [0.45, 0.08, 0], fov: 31 },
  silence: { position: [-1.6, 0.6, 5.1], target: [-0.18, 0.48, 0], fov: 34 },
  material: { position: [2.0, 0.45, 4.15], target: [0.58, 0.2, 0], fov: 29 },
  longevity: { position: [0.1, 0.75, 5.35], target: [0, 0.55, 0], fov: 35 },
  explore: { position: [0.0, 0.62, 5.05], target: [0, 0.5, 0], fov: 33 },
  customize: { position: [-0.3, 0.58, 5.35], target: [0, 0.48, 0], fov: 35 },
  specs: { position: [1.1, 0.5, 5.2], target: [0.2, 0.4, 0], fov: 35 },
  purchase: { position: [-1.0, 0.55, 5.2], target: [-0.1, 0.4, 0], fov: 35 },
};

function CameraRig({
  section,
  interactive,
}: {
  section: Section;
  interactive: boolean;
}) {
  const { camera, size } = useThree();
  const look = useRef(new THREE.Vector3(0, 0.5, 0));
  const state = cameraStates[section];

  useFrame((_, delta) => {
    if (interactive) return;

    const mobile = size.width < 760;
    const destination = new THREE.Vector3(...state.position);
    if (mobile) {
      destination.x *= 0.16;
      destination.y += 0.08;
      destination.z += section === "hero" ? 0.35 : 0.68;
    }

    const target = new THREE.Vector3(...state.target);
    const k = 1 - Math.exp(-3.8 * delta);

    camera.position.lerp(destination, k);
    look.current.lerp(target, k);
    camera.lookAt(look.current);

    if (camera instanceof THREE.PerspectiveCamera) {
      const fov = mobile ? Math.max(40, state.fov + 4) : state.fov;
      camera.fov = THREE.MathUtils.damp(camera.fov, fov, 4.2, delta);
      camera.updateProjectionMatrix();
    }
  });

  return null;
}

function SilenceField({
  active,
  progress,
}: {
  active: boolean;
  progress: number;
}) {
  const group = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (!group.current) return;
    const targetScale = active ? 0.68 + progress * 0.06 : 1.2;
    const s = THREE.MathUtils.damp(
      group.current.scale.x,
      targetScale,
      3.5,
      delta
    );
    group.current.scale.setScalar(s);
    group.current.rotation.z += delta * 0.014;
  });

  return (
    <group ref={group} position={[0, 0.58, -0.72]} visible={active}>
      {[1.14, 1.44, 1.78, 2.12].map((radius, index) => (
        <mesh key={radius} rotation={[0, 0, index * 0.11]}>
          <torusGeometry args={[radius, 0.0045, 5, 180]} />
          <meshBasicMaterial
            color="#cdb9a6"
            transparent
            opacity={0.14 - index * 0.022}
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  );
}

function Pedestal({ visible }: { visible: boolean }) {
  if (!visible) return null;

  return (
    <group position={[0.3, -1.07, -0.25]}>
      <RoundedBox
        args={[4.5, 0.13, 2.45]}
        radius={0.045}
        smoothness={6}
        receiveShadow
      >
        <meshStandardMaterial color="#b9aa9c" roughness={0.96} />
      </RoundedBox>
      <RoundedBox
        args={[3.35, 0.035, 1.9]}
        radius={0.02}
        smoothness={5}
        position={[0.15, 0.085, 0.04]}
        receiveShadow
      >
        <meshStandardMaterial color="#d7cbc0" roughness={0.93} />
      </RoundedBox>
    </group>
  );
}

function ProductModel({
  finish,
  section,
  progress,
}: {
  finish: Finish;
  section: Section;
  progress: number;
}) {
  const root = useRef<THREE.Group>(null);
  const { scene } = useGLTF(MODEL_URL);
  const palette = FINISHES[finish];

  const targetMetal = useMemo(
    () => new THREE.Color(palette.metal),
    [palette.metal]
  );
  const targetSoft = useMemo(
    () => new THREE.Color(palette.cushion),
    [palette.cushion]
  );
  const targetTrim = useMemo(
    () => new THREE.Color(palette.trim),
    [palette.trim]
  );
  const targetFace = useMemo(
    () =>
      new THREE.Color(palette.metal).lerp(
        new THREE.Color(palette.trim),
        0.10
      ),
    [palette.metal, palette.trim]
  );

  const model = useMemo(() => {
    const clone = scene.clone(true);

    clone.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;

      const name = object.name;
      const isFaceplate = name.includes("Faceplate");
      const isTextile =
        name.includes("Acoustic_Baffle") || name.includes("Cushion_Seam");
      const isSoft =
        name.includes("Cushion_") ||
        name.includes("Headband_Shell") ||
        name.includes("Headband_Cushion");
      const isDriver = name.includes("Driver");
      const isDark =
        name.includes("Mic") ||
        name.includes("Port") ||
        name.includes("Rail") ||
        name.includes("Screw") ||
        name.includes("Knurl") ||
        name.includes("BrandMark");
      const isTrim =
        name.includes("Rim") ||
        name.includes("Hinge") ||
        name.includes("Yoke") ||
        name.includes("Control") ||
        name.includes("End") ||
        name.includes("Cap") ||
        name.includes("Core");

      let material: THREE.MeshPhysicalMaterial;

      if (isFaceplate) {
        material = new THREE.MeshPhysicalMaterial({
          color: targetFace.clone(),
          metalness: 0.10,
          roughness: 0.82,
          anisotropy: 0.22,
          clearcoat: 0.0,
          clearcoatRoughness: 0.8,
          envMapIntensity: 0.16,
        });
      } else if (isTextile) {
        material = new THREE.MeshPhysicalMaterial({
          color: "#26221f",
          metalness: 0,
          roughness: 0.96,
          sheen: 0.72,
          sheenRoughness: 0.9,
          sheenColor: new THREE.Color("#766a61"),
          envMapIntensity: 0.34,
        });
      } else if (isSoft) {
        material = new THREE.MeshPhysicalMaterial({
          color: targetSoft.clone(),
          metalness: 0,
          roughness: 0.82,
          sheen: 0.9,
          sheenRoughness: 0.82,
          sheenColor: new THREE.Color("#8b8076"),
          envMapIntensity: 0.46,
        });
      } else if (isDriver) {
        material = new THREE.MeshPhysicalMaterial({
          color: "#2b211a",
          metalness: 0.54,
          roughness: 0.34,
          emissive: new THREE.Color("#604731"),
          emissiveIntensity: 0,
          envMapIntensity: 1.0,
        });
      } else if (isDark) {
        material = new THREE.MeshPhysicalMaterial({
          color: "#171513",
          metalness: 0.12,
          roughness: 0.54,
          envMapIntensity: 0.58,
        });
      } else if (isTrim) {
        material = new THREE.MeshPhysicalMaterial({
          color: targetTrim.clone(),
          metalness: 0.56,
          roughness: 0.48,
          anisotropy: 0.38,
          envMapIntensity: 0.52,
        });
      } else {
        material = new THREE.MeshPhysicalMaterial({
          color: targetMetal.clone(),
          metalness: 0.62,
          roughness: 0.5,
          anisotropy: 0.34,
          envMapIntensity: 0.60,
        });
      }

      object.material = material;
      object.castShadow = true;
      object.receiveShadow = true;
    });

    return clone;
  }, [scene, targetFace, targetMetal, targetSoft, targetTrim]);

  const basePositions = useMemo(() => {
    const positions = new Map<string, THREE.Vector3>();
    model.traverse((object) => {
      positions.set(object.name, object.position.clone());
    });
    return positions;
  }, [model]);

  useEffect(
    () => () => {
      model.traverse((object) => {
        if (object instanceof THREE.Mesh && object.material) {
          (object.material as THREE.Material).dispose();
        }
      });
    },
    [model]
  );

  useFrame((state, delta) => {
    const blend = 1 - Math.exp(-delta * 5);

    model.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;

      const name = object.name;
      const material = object.material as THREE.MeshPhysicalMaterial;

      if (name.includes("Driver_") || name.includes("Driver_Ring_")) {
        object.visible = section === "sound";
      }

      if (name.includes("Faceplate")) {
        material.color.lerp(targetFace, blend);
      } else if (
        name.includes("Acoustic_Baffle") ||
        name.includes("Cushion_Seam")
      ) {
        material.color.lerp(new THREE.Color("#26221f"), blend);
      } else if (
        name.includes("Cushion_") ||
        name.includes("Headband_Cushion") ||
        name.includes("Headband_Shell")
      ) {
        material.color.lerp(targetSoft, blend);
      } else if (
        name.includes("Rim") ||
        name.includes("Hinge") ||
        name.includes("Yoke") ||
        name.includes("Control") ||
        name.includes("End") ||
        name.includes("Cap") ||
        name.includes("Core")
      ) {
        material.color.lerp(targetTrim, blend);
      } else if (
        name.includes("Mic") ||
        name.includes("Port") ||
        name.includes("Rail") ||
        name.includes("Screw") ||
        name.includes("Knurl") ||
        name.includes("BrandMark")
      ) {
        material.color.lerp(new THREE.Color("#171513"), blend);
      } else if (!name.includes("Driver")) {
        material.color.lerp(targetMetal, blend);
      }

      if (name.includes("Driver")) {
        material.emissiveIntensity = THREE.MathUtils.damp(
          material.emissiveIntensity ?? 0,
          section === "sound" ? 0.32 : 0,
          4,
          delta
        );
      }
    });

    if (root.current) {
      let rotationY = -0.50;
      let rotationX = -0.035;
      let rotationZ = 0.012;

      if (section === "hero") {
        rotationY += Math.sin(state.clock.elapsedTime * 0.18) * 0.008;
      }
      if (section === "sound") {
        rotationY = -0.68;
        rotationX = -0.02;
      }
      if (section === "silence") rotationY = 0.18;
      if (section === "material") {
        rotationY = -0.82;
        rotationX = 0.015;
      }
      if (section === "longevity") rotationY = -0.06;
      if (section === "explore") rotationY = -0.3;
      if (section === "customize") rotationY = 0.3;
      if (section === "purchase") rotationY = 0.42;

      root.current.rotation.x = THREE.MathUtils.damp(
        root.current.rotation.x,
        rotationX,
        3.5,
        delta
      );
      root.current.rotation.y = THREE.MathUtils.damp(
        root.current.rotation.y,
        rotationY,
        3.5,
        delta
      );
      root.current.rotation.z = THREE.MathUtils.damp(
        root.current.rotation.z,
        rotationZ,
        3.5,
        delta
      );
    }

    const targets = new Map<string, THREE.Vector3>();
    basePositions.forEach((position, key) =>
      targets.set(key, position.clone())
    );

    if (section === "sound") {
      for (const key of [
        "Driver_R",
        "Driver_Ring_R",
        "Acoustic_Baffle_R",
      ]) {
        const target = targets.get(key);
        if (target) target.z -= 0.28 + progress * 0.18;
      }
    }

    if (section === "longevity") {
      const left = targets.get("Cushion_L");
      const right = targets.get("Cushion_R");
      const headband = targets.get("Headband_Cushion");
      if (left) left.z += 0.32 + progress * 0.12;
      if (right) right.z -= 0.32 + progress * 0.12;
      if (headband) headband.y += 0.2 + progress * 0.1;
    }

    model.traverse((object) => {
      const target = targets.get(object.name);
      if (!target) return;
      object.position.x = THREE.MathUtils.damp(
        object.position.x,
        target.x,
        6,
        delta
      );
      object.position.y = THREE.MathUtils.damp(
        object.position.y,
        target.y,
        6,
        delta
      );
      object.position.z = THREE.MathUtils.damp(
        object.position.z,
        target.z,
        6,
        delta
      );
    });
  });

  return (
    <group
      ref={root}
      scale={0.9}
      position={[0, -0.08, 0]}
      rotation={[-0.03, -0.42, 0.012]}
    >
      <primitive object={model} />
    </group>
  );
}

function SceneContent({
  finish,
  section,
  progress,
  interactive,
}: {
  finish: Finish;
  section: Section;
  progress: number;
  interactive: boolean;
}) {
  const showPedestal =
    section === "material" ||
    section === "explore" ||
    section === "customize";

  return (
    <>
      <CameraRig section={section} interactive={interactive} />

      <Environment resolution={512} frames={1}>
        <Lightformer
          intensity={2.55}
          position={[0, 5.5, 4]}
          scale={[7, 4.2, 1]}
        />
        <Lightformer
          intensity={1.6}
          position={[-4.5, 1.6, 2]}
          rotation={[0, Math.PI / 2, 0]}
          scale={[5, 3, 1]}
        />
        <Lightformer
          intensity={2.05}
          position={[4.5, 2.2, -1.5]}
          rotation={[0, -Math.PI / 2, 0]}
          scale={[5, 4, 1]}
        />
        <Lightformer
          intensity={0.8}
          position={[0, -3, 1.5]}
          scale={[5, 2, 1]}
        />
        <Lightformer
          intensity={1.05}
          position={[0, 2, -5]}
          rotation={[0, Math.PI, 0]}
          scale={[4, 4, 1]}
        />
      </Environment>

      <ambientLight intensity={0.13} />
      <directionalLight
        position={[5, 7, 5]}
        intensity={0.88}
        color="#fff8ef"
        castShadow
      />
      <directionalLight
        position={[-4, 3, 2]}
        intensity={0.48}
        color="#d6c3b2"
      />
      <pointLight
        position={[0, 2, -3]}
        intensity={0.28}
        color="#b99b7e"
      />

      <SilenceField active={section === "silence"} progress={progress} />
      <Pedestal visible={showPedestal} />
      <ProductModel finish={finish} section={section} progress={progress} />

      <ContactShadows
        position={[0, -1.0, 0]}
        opacity={0.36}
        scale={5.9}
        blur={2.1}
        far={4.5}
        resolution={512}
      />

      <OrbitControls
        enabled={interactive}
        enablePan={false}
        enableZoom={false}
        enableDamping
        dampingFactor={0.07}
        minPolarAngle={Math.PI * 0.31}
        maxPolarAngle={Math.PI * 0.67}
        target={[0, 0.5, 0]}
      />
    </>
  );
}

export function ProductScene({
  finish,
  section,
  progress,
  interactive,
}: {
  finish: Finish;
  section: Section;
  progress: number;
  interactive: boolean;
}) {
  return (
    <Canvas
      shadows
      camera={{
        position: [0.18, 0.62, 5.45],
        fov: 32,
        near: 0.1,
        far: 100,
      }}
      dpr={[1, 1.65]}
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 0.70;
        gl.outputColorSpace = THREE.SRGBColorSpace;
      }}
    >
      <SceneContent
        finish={finish}
        section={section}
        progress={progress}
        interactive={interactive}
      />
    </Canvas>
  );
}

useGLTF.preload(MODEL_URL);
