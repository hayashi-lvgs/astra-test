"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

type Finish = "graphite" | "natural" | "warm";

const finishes: Record<Finish, { label: string; metal: string; cushion: string }> = {
  graphite: { label: "Graphite", metal: "#4a4642", cushion: "#181716" },
  natural: { label: "Natural", metal: "#c9c1b7", cushion: "#e7dfd5" },
  warm: { label: "Warm Stone", metal: "#b9a895", cushion: "#8d7767" },
};

function Headphones({ finish, interactive }: { finish: Finish; interactive: boolean }) {
  const group = useRef<THREE.Group>(null);
  const palette = finishes[finish];
  const metal = useMemo(() => new THREE.MeshStandardMaterial({ color: palette.metal, roughness: 0.32, metalness: 0.78 }), [palette.metal]);
  const soft = useMemo(() => new THREE.MeshStandardMaterial({ color: palette.cushion, roughness: 0.9, metalness: 0 }), [palette.cushion]);
  const dark = useMemo(() => new THREE.MeshStandardMaterial({ color: "#171717", roughness: 0.58, metalness: 0.18 }), []);

  useFrame((state, delta) => {
    if (!group.current || interactive) return;
    group.current.rotation.y = THREE.MathUtils.damp(group.current.rotation.y, -0.32 + Math.sin(state.clock.elapsedTime * 0.3) * 0.07, 2.5, delta);
    group.current.rotation.x = THREE.MathUtils.damp(group.current.rotation.x, -0.08, 2.5, delta);
  });

  return (
    <group ref={group} position={[0, -0.1, 0]} rotation={[-0.08, -0.32, 0]}>
      <mesh position={[-1.12, 0.05, 0]} material={metal}>
        <boxGeometry args={[0.48, 1.65, 0.56]} />
      </mesh>
      <mesh position={[1.12, 0.05, 0]} material={metal}>
        <boxGeometry args={[0.48, 1.65, 0.56]} />
      </mesh>

      <mesh position={[-1.05, 0.04, 0.34]} material={soft} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.72, 0.2, 28, 80]} />
      </mesh>
      <mesh position={[1.05, 0.04, 0.34]} material={soft} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.72, 0.2, 28, 80]} />
      </mesh>

      <mesh position={[-1.05, 0.04, 0.28]} material={dark}>
        <cylinderGeometry args={[0.49, 0.49, 0.12, 64]} />
      </mesh>
      <mesh position={[1.05, 0.04, 0.28]} material={dark}>
        <cylinderGeometry args={[0.49, 0.49, 0.12, 64]} />
      </mesh>

      <mesh position={[0, 1.58, 0]} material={metal} rotation={[0, 0, Math.PI]}>
        <torusGeometry args={[1.48, 0.12, 24, 96, Math.PI]} />
      </mesh>
      <mesh position={[0, 1.54, 0.01]} material={soft} rotation={[0, 0, Math.PI]}>
        <torusGeometry args={[1.37, 0.13, 24, 96, Math.PI]} />
      </mesh>

      <mesh position={[-1.03, 1.0, 0]} material={metal} rotation={[0, 0, -0.08]}>
        <boxGeometry args={[0.15, 0.95, 0.18]} />
      </mesh>
      <mesh position={[1.03, 1.0, 0]} material={metal} rotation={[0, 0, 0.08]}>
        <boxGeometry args={[0.15, 0.95, 0.18]} />
      </mesh>

      <mesh position={[1.39, 0.35, 0.05]} material={metal} rotation={[Math.PI / 2, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.14, 0.14, 0.12, 40]} />
      </mesh>
    </group>
  );
}

function ProductScene({ finish, interactive }: { finish: Finish; interactive: boolean }) {
  return (
    <Canvas camera={{ position: [0, 0.7, 5.4], fov: 38 }} dpr={[1, 1.6]} gl={{ antialias: true, alpha: true }}>
      <ambientLight intensity={1.4} />
      <directionalLight position={[4, 6, 5]} intensity={4.2} color="#fff4e8" />
      <directionalLight position={[-4, 2, 1]} intensity={2.1} color="#c8b8a7" />
      <pointLight position={[0, -1, 3]} intensity={1.2} />
      <Headphones finish={finish} interactive={interactive} />
      <OrbitControls enabled={interactive} enablePan={false} enableZoom={false} target={[0, 0.55, 0]} />
    </Canvas>
  );
}

export default function Page() {
  const [finish, setFinish] = useState<Finish>("graphite");
  const [active, setActive] = useState("hero");
  const [bag, setBag] = useState(0);

  useEffect(() => {
    const sections = Array.from(document.querySelectorAll<HTMLElement>("[data-section]"));
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible) setActive((visible.target as HTMLElement).dataset.section || "hero");
    }, { threshold: [0.35, 0.55, 0.75] });
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  const interactive = active === "explore";

  return (
    <main>
      <header className="nav">
        <a href="#hero" className="brand">LUNEV</a>
        <nav>
          <a href="#sound">Product</a>
          <a href="#explore">Explore</a>
          <a href="#specs">Specs</a>
          <span>Bag {bag > 0 ? `(${bag})` : ""}</span>
        </nav>
      </header>

      <div className={interactive ? "canvas interactive" : "canvas"}>
        <ProductScene finish={finish} interactive={interactive} />
      </div>

      <section id="hero" data-section="hero" className="panel hero">
        <div className="copy">
          <p className="eyebrow">Premium wireless headphones</p>
          <h1>LUNEV ONE</h1>
          <p className="lead">Precision you can see.<br />Silence you can feel.</p>
          <a href="#sound" className="link">Explore the product ↓</a>
        </div>
      </section>

      <section id="sound" data-section="sound" className="panel dark">
        <div className="copy">
          <p className="eyebrow">01 — Sound</p>
          <h2>Hear the detail.</h2>
          <p>40 mm custom dynamic drivers tuned for clarity, depth and a natural presentation.</p>
        </div>
      </section>

      <section id="silence" data-section="silence" className="panel">
        <div className="copy right">
          <p className="eyebrow">02 — Silence</p>
          <h2>Control the space around you.</h2>
          <p>Adaptive noise cancelling reduces distraction while preserving a natural sense of space.</p>
        </div>
      </section>

      <section id="material" data-section="material" className="panel stone">
        <div className="copy">
          <p className="eyebrow">03 — Material</p>
          <h2>Made to be touched.</h2>
          <p>Machined aluminium, soft cushioning and tactile physical controls make premium value visible.</p>
        </div>
      </section>

      <section id="longevity" data-section="longevity" className="panel">
        <div className="copy right">
          <p className="eyebrow">04 — Longevity</p>
          <h2>Designed beyond the upgrade cycle.</h2>
          <p>Replaceable cushions and headband components extend the useful life of the product.</p>
        </div>
      </section>

      <section id="explore" data-section="explore" className="panel explore">
        <div className="copy">
          <p className="eyebrow">05 — Explore</p>
          <h2>Discover every angle.</h2>
          <p>Drag directly on the product to inspect the form. Scroll remains available to continue the story.</p>
          <span className="hint">{interactive ? "3D controls active" : "Scroll into the scene"}</span>
        </div>
      </section>

      <section id="customize" data-section="customize" className="panel customize">
        <div className="copy wide">
          <p className="eyebrow">06 — Customize</p>
          <h2>Find your balance.</h2>
          <div className="swatches">
            {(Object.keys(finishes) as Finish[]).map((key) => (
              <button key={key} onClick={() => setFinish(key)} className={finish === key ? "swatch active" : "swatch"}>
                <i style={{ background: finishes[key].metal }} />
                {finishes[key].label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section id="specs" data-section="specs" className="specs">
        <div>
          <p className="eyebrow">07 — Specifications</p>
          <h2>Thoughtfully engineered.</h2>
          <dl>
            <div><dt>Driver</dt><dd>40 mm custom dynamic</dd></div>
            <div><dt>ANC</dt><dd>Adaptive noise cancelling</dd></div>
            <div><dt>Battery</dt><dd>Up to 40 hours</dd></div>
            <div><dt>Connectivity</dt><dd>Bluetooth 5.3 / USB-C audio</dd></div>
            <div><dt>Materials</dt><dd>Machined aluminium / soft textile</dd></div>
            <div><dt>Weight</dt><dd>Approx. 320 g</dd></div>
          </dl>
        </div>
      </section>

      <section id="purchase" data-section="purchase" className="purchase">
        <div className="card">
          <p className="eyebrow">LUNEV ONE</p>
          <h2>A quieter, brighter you.</h2>
          <strong className="price">¥148,000</strong>
          <p>Selected finish — {finishes[finish].label}</p>
          <button className="buy" onClick={() => setBag((v) => v + 1)}>Add to Bag →</button>
          <small>Portfolio concept — checkout is mocked.</small>
        </div>
      </section>
    </main>
  );
}
