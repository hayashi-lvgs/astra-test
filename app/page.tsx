"use client";

import { useEffect, useRef, useState } from "react";
import {
  FINISHES,
  ProductScene,
  type Finish,
  type Section,
} from "../components/ProductScene";

const sectionOrder: Section[] = [
  "hero",
  "sound",
  "silence",
  "material",
  "longevity",
  "explore",
  "customize",
  "specs",
  "purchase",
];

const sectionNames: Record<Section, string> = {
  hero: "Introduction",
  sound: "Sound",
  silence: "Silence",
  material: "Material",
  longevity: "Longevity",
  explore: "Explore",
  customize: "Finish",
  specs: "Specifications",
  purchase: "Purchase",
};

export default function Page() {
  const [finish, setFinish] = useState<Finish>("graphite");
  const [active, setActive] = useState<Section>("hero");
  const [progress, setProgress] = useState(0);
  const [bag, setBag] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const activeRef = useRef<Section>("hero");

  useEffect(() => {
    const update = () => {
      const vh = window.innerHeight;
      let best: { id: Section; score: number; progress: number } | undefined;

      for (const id of sectionOrder) {
        const el = document.querySelector<HTMLElement>(
          '[data-section="' + id + '"]'
        );
        if (!el) continue;

        const rect = el.getBoundingClientRect();
        const centerDistance = Math.abs(rect.top + rect.height / 2 - vh / 2);
        const localProgress = Math.min(
          1,
          Math.max(0, (vh - rect.top) / (vh + rect.height))
        );

        if (!best || -centerDistance > best.score) {
          best = { id, score: -centerDistance, progress: localProgress };
        }
      }

      if (!best) return;
      setProgress(best.progress);

      if (best.id !== activeRef.current) {
        activeRef.current = best.id;
        setActive(best.id);
      }
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);

    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  const interactive = active === "explore";
  const darkNav =
    active === "sound" || active === "silence" || active === "specs";
  const canvasHidden = active === "specs" || active === "purchase";
  const index = sectionOrder.indexOf(active) + 1;

  return (
    <main
      className={
        "site section-" + active + (darkNav ? " nav-on-dark" : "")
      }
    >
      <header className="nav-shell">
        <a className="brand-mark" href="#hero" aria-label="LUNEV home">
          LUNEV
        </a>

        <nav className="desktop-nav" aria-label="Primary navigation">
          <a href="#sound">Experience</a>
          <a href="#material">Design</a>
          <a href="#explore">3D Object</a>
          <a href="#specs">Specifications</a>
        </nav>

        <a className="bag-button" href="#purchase">
          Bag <span>{bag > 0 ? "(" + bag + ")" : "0"}</span>
        </a>

        <button
          className="menu-button"
          onClick={() => setMenuOpen(true)}
          aria-label="Open menu"
        >
          Menu
        </button>
      </header>

      {menuOpen && (
        <div className="mobile-menu">
          <div className="mobile-menu-top">
            <span>LUNEV ONE</span>
            <button onClick={() => setMenuOpen(false)}>Close</button>
          </div>

          {[
            ["Experience", "#sound"],
            ["Design", "#material"],
            ["3D Object", "#explore"],
            ["Specifications", "#specs"],
            ["Purchase", "#purchase"],
          ].map(([label, href], i) => (
            <a
              key={label}
              href={href}
              onClick={() => setMenuOpen(false)}
            >
              <span>0{i + 1}</span>
              {label}
            </a>
          ))}
        </div>
      )}

      <aside className="section-progress" aria-hidden="true">
        <span>{String(index).padStart(2, "0")}</span>
        <i>
          <b
            style={{
              transform:
                "scaleY(" + index / sectionOrder.length + ")",
            }}
          />
        </i>
        <em>{String(sectionOrder.length).padStart(2, "0")}</em>
      </aside>

      <div
        className={
          "product-canvas" +
          (interactive ? " is-interactive" : "") +
          (canvasHidden ? " is-hidden" : "")
        }
        aria-hidden={!interactive}
      >
        <ProductScene
          finish={finish}
          section={active}
          progress={progress}
          interactive={interactive}
        />
      </div>

      <section id="hero" data-section="hero" className="hero-section">
        <div className="architectural-light" aria-hidden="true">
          <span className="light-panel light-panel-a" />
          <span className="light-panel light-panel-b" />
          <span className="light-shadow" />
        </div>

        <div className="hero-copy">
          <p className="eyebrow">
            LUNEV ONE / Premium Wireless ANC Headphones
          </p>
          <h1>
            Silence,
            <br />
            made tangible.
          </h1>
          <p className="hero-summary">
            A premium listening object designed around material clarity,
            physical control and long-term ownership.
          </p>

          <div className="hero-actions">
            <a className="primary-link" href="#explore">
              Explore the object <span>↘</span>
            </a>
            <span className="hero-price">¥148,000</span>
          </div>
        </div>

        <div className="hero-object-frame" aria-hidden="true">
          <div className="object-frame-top">
            <span>Object 01</span>
            <span>Graphite / 320 g</span>
          </div>

          <div className="object-frame-corner corner-a" />
          <div className="object-frame-corner corner-b" />

          <div className="hero-plinth" />

          <div className="hero-object-note">
            <span>Premium audio object</span>
            <strong>Machined aluminium / soft contact surfaces</strong>
          </div>
        </div>

        <div className="hero-spec-rail">
          <div>
            <span>Driver</span>
            <strong>40 mm</strong>
          </div>
          <div>
            <span>Noise control</span>
            <strong>Adaptive ANC</strong>
          </div>
          <div>
            <span>Battery</span>
            <strong>40 h</strong>
          </div>
        </div>

        <a className="scroll-cue" href="#sound">
          <i />
          <span>Scroll to discover</span>
        </a>

        <div className="hero-chapter" aria-hidden="true">
          <span>01</span>
          <strong>Premium audio object</strong>
        </div>
      </section>

      <section
        id="sound"
        data-section="sound"
        className="story dark-section sound-section"
      >
        <div className="section-watermark">SOUND</div>

        <div className="story-copy left-copy">
          <p className="eyebrow light">01 / Acoustic architecture</p>
          <h2>
            Hear the
            <br />
            space between.
          </h2>
          <p>
            The driver becomes visible only when it adds understanding.
            Scroll separates the acoustic assembly from the object so
            a specification becomes spatial, physical and memorable.
          </p>

          <div className="metric-rail">
            <div>
              <strong>40 mm</strong>
              <span>Custom dynamic driver</span>
            </div>
            <div>
              <strong>USB-C</strong>
              <span>Lossless digital audio</span>
            </div>
          </div>
        </div>

        <div className="sound-rings" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>

        <div className="section-footnote">
          <span>Driver reveal</span>
          <span>Scroll / 01—02</span>
        </div>
      </section>

      <section
        id="silence"
        data-section="silence"
        className="story dark-section silence-section"
      >
        <div className="section-watermark quiet-watermark">QUIET</div>

        <div className="story-copy right-copy">
          <p className="eyebrow light">02 / Adaptive silence</p>
          <h2>
            Less noise.
            <br />
            More object.
          </h2>
          <p>
            Noise cancellation is visualized as a field that contracts
            around the product. The interface removes information at
            the same moment the product removes noise.
          </p>

          <div className="metric-rail single">
            <div>
              <strong>Adaptive</strong>
              <span>ANC + transparency / context aware</span>
            </div>
          </div>
        </div>

        <div className="silence-orbit" aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
        </div>
      </section>

      <section
        id="material"
        data-section="material"
        className="story material-section"
      >
        <div className="material-title">
          <p className="eyebrow">03 / Material intelligence</p>
          <h2>
            Designed
            <br />
            to be touched.
          </h2>
        </div>

        <div className="material-ledger">
          <div>
            <span>01</span>
            <strong>Machined aluminium</strong>
            <p>
              Restrained reflections expose the geometry without making
              the product feel ornamental.
            </p>
          </div>
          <div>
            <span>02</span>
            <strong>Woven contact textile</strong>
            <p>
              Low reflectance and soft edge light communicate comfort
              before physical contact.
            </p>
          </div>
          <div>
            <span>03</span>
            <strong>Physical controls</strong>
            <p>
              Tactile input remains visible and intentional instead of
              disappearing into a touch surface.
            </p>
          </div>
        </div>

        <div className="material-type" aria-hidden="true">
          ALUMINIUM
        </div>
      </section>

      <section
        id="longevity"
        data-section="longevity"
        className="story longevity-section"
      >
        <div className="story-copy right-copy">
          <p className="eyebrow">04 / Long-term ownership</p>
          <h2>
            Built to stay
            <br />
            in use.
          </h2>
          <p>
            Replaceable contact parts separate from the product in 3D.
            Maintenance is treated as part of the ownership experience,
            not hidden in documentation.
          </p>
        </div>

        <div className="service-label service-label-a">
          <span>01</span>
          <strong>Ear cushions</strong>
          <i />
        </div>
        <div className="service-label service-label-b">
          <span>02</span>
          <strong>Inner headband</strong>
          <i />
        </div>

        <div className="longevity-statement">
          <span>Replace what wears.</span>
          <strong>Keep what matters.</strong>
        </div>
      </section>

      <section
        id="explore"
        data-section="explore"
        className="story explore-section"
      >
        <div className="explore-top">
          <div>
            <p className="eyebrow">05 / Free exploration</p>
            <h2>
              Inspect
              <br />
              the object.
            </h2>
          </div>

          <p>
            Guided storytelling ends here. Drag directly on LUNEV ONE
            to inspect proportion, surface, control placement and
            construction from any angle.
          </p>
        </div>

        <div className="explore-reticle" aria-hidden="true">
          <i />
          <i />
        </div>

        <div className="control-pill">
          <i />
          <span>Drag to rotate</span>
        </div>

        <div className="explore-status">
          <span>3D controls active</span>
          <span>Scroll to finish</span>
        </div>
      </section>

      <section
        id="customize"
        data-section="customize"
        className="story customize-section"
      >
        <div className="finish-header">
          <p className="eyebrow">06 / Finish</p>
          <h2>
            Three tones.
            <br />
            One character.
          </h2>
        </div>

        <div className="finish-name" aria-hidden="true">
          {FINISHES[finish].label}
        </div>

        <div className="customize-panel">
          <div className="finish-current">
            <span>Selected finish</span>
            <strong>{FINISHES[finish].label}</strong>
          </div>

          <div className="finish-list" role="radiogroup" aria-label="Product finish">
            {(Object.keys(FINISHES) as Finish[]).map((key) => (
              <button
                key={key}
                role="radio"
                aria-checked={finish === key}
                onClick={() => setFinish(key)}
                className={
                  finish === key ? "finish-option active" : "finish-option"
                }
              >
                <span
                  className="finish-dot"
                  style={{ background: FINISHES[key].metal }}
                />
                <span>{FINISHES[key].label}</span>
                <span className="finish-state">
                  {finish === key ? "Selected" : "View"}
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section id="specs" data-section="specs" className="specs-section">
        <div className="specs-heading">
          <p className="eyebrow light">07 / Specifications</p>
          <h2>
            Everything
            <br />
            essential.
          </h2>
          <p>
            Enough information to make a decision. Nothing included
            simply because a specification table can hold it.
          </p>
        </div>

        <dl className="spec-grid">
          <div>
            <dt>Driver</dt>
            <dd>40 mm custom dynamic</dd>
            <span>01</span>
          </div>
          <div>
            <dt>Noise control</dt>
            <dd>Adaptive ANC + transparency</dd>
            <span>02</span>
          </div>
          <div>
            <dt>Battery</dt>
            <dd>Up to 40 hours</dd>
            <span>03</span>
          </div>
          <div>
            <dt>Connectivity</dt>
            <dd>Bluetooth 5.3 / USB-C audio</dd>
            <span>04</span>
          </div>
          <div>
            <dt>Materials</dt>
            <dd>Machined aluminium / woven textile</dd>
            <span>05</span>
          </div>
          <div>
            <dt>Weight</dt>
            <dd>Approx. 320 g</dd>
            <span>06</span>
          </div>
          <div>
            <dt>Serviceability</dt>
            <dd>Replaceable cushions / inner headband</dd>
            <span>07</span>
          </div>
          <div>
            <dt>Finish</dt>
            <dd>{FINISHES[finish].label}</dd>
            <span>08</span>
          </div>
        </dl>
      </section>

      <section
        id="purchase"
        data-section="purchase"
        className="purchase-section"
      >
        <div className="purchase-kicker">LUNEV / OBJECT 01</div>

        <div className="purchase-copy">
          <p className="eyebrow">Premium wireless ANC headphones</p>
          <h2>
            Own the
            <br />
            quiet.
          </h2>
          <p>
            LUNEV ONE in {FINISHES[finish].label}.
            <br />
            Concept product / ¥148,000.
          </p>
        </div>

        <div className="purchase-card">
          <div className="purchase-row">
            <span>Finish</span>
            <strong>{FINISHES[finish].label}</strong>
          </div>
          <div className="purchase-row">
            <span>Price</span>
            <strong>¥148,000</strong>
          </div>
          <div className="purchase-row">
            <span>Availability</span>
            <strong>Concept release</strong>
          </div>

          <button onClick={() => setBag((value) => value + 1)}>
            <span>{bag > 0 ? "Added to bag" : "Add to bag"}</span>
            <span>{bag > 0 ? "✓" : "↗"}</span>
          </button>

          <small>Portfolio concept. No payment is processed.</small>
        </div>
      </section>

      <footer>
        <span>LUNEV ONE / Interactive product concept</span>
        <span>{sectionNames[active]}</span>
        <a href="#hero">Back to top ↑</a>
      </footer>
    </main>
  );
}
