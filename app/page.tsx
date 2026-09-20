"use client";

import { useEffect, useRef, useState } from "react";

const ASSET_PREFIX = process.env.NEXT_PUBLIC_ASSET_PREFIX ?? "";
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
  const [finish, setFinish] = useState<Finish>("natural");
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
        const selector = '[data-section="' + id + '"]';
        const element = document.querySelector<HTMLElement>(selector);
        if (!element) continue;

        const rect = element.getBoundingClientRect();
        const centerDistance = Math.abs(rect.top + rect.height / 2 - vh / 2);
        const score = -centerDistance;
        const localProgress = Math.min(
          1,
          Math.max(0, (vh - rect.top) / (vh + rect.height))
        );

        if (!best || score > best.score) {
          best = { id, score, progress: localProgress };
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

  const siteClass =
    "site section-" + active + (darkNav ? " nav-on-dark" : "");
  const canvasClass =
    "product-canvas" +
    (interactive ? " is-interactive" : "") +
    (canvasHidden ? " is-hidden" : "");

  return (
    <main className={siteClass}>
      <header className="nav-shell">
        <a className="brand-mark" href="#hero" aria-label="LUNEV home">
          LUNEV
        </a>

        <nav className="desktop-nav" aria-label="Primary navigation">
          <a href="#sound">Product</a>
          <a href="#material">Design</a>
          <a href="#explore">3D Explore</a>
          <a href="#specs">Specifications</a>
        </nav>

        <button
          className="bag-button"
          onClick={() => setBag((value) => value + 1)}
          aria-label={"Bag, " + bag + " items"}
        >
          Bag <span>{bag > 0 ? "(" + bag + ")" : ""}</span>
        </button>

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
          <button
            className="menu-close"
            onClick={() => setMenuOpen(false)}
          >
            Close
          </button>
          {[
            ["Product", "#sound"],
            ["Design", "#material"],
            ["3D Explore", "#explore"],
            ["Specifications", "#specs"],
          ].map(([label, href]) => (
            <a
              key={label}
              href={href}
              onClick={() => setMenuOpen(false)}
            >
              {label}
            </a>
          ))}
        </div>
      )}

      <aside className="section-progress" aria-hidden="true">
        <span>{String(index).padStart(2, "0")}</span>
        <i>
          <b style={{ transform: "scaleY(" + index / sectionOrder.length + ")" }} />
        </i>
        <em>{String(sectionOrder.length).padStart(2, "0")}</em>
      </aside>

      <div
        className={canvasClass}
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
        <div className="hero-grid">
          <div className="hero-copy">
            <p className="eyebrow">LUNEV ONE / Wireless ANC Headphones</p>
            <h1>
              Quiet,
              <br />
              engineered.
            </h1>
            <p className="hero-summary">
              A listening object shaped around material clarity,
              physical control and long-term ownership.
            </p>

            <div className="hero-actions">
              <a className="primary-link" href="#explore">
                Experience in 3D <span>↘</span>
              </a>
              <span className="hero-price">¥148,000</span>
            </div>
          </div>

          <div className="hero-stage">
            <img className="hero-render" src={ASSET_PREFIX + "/hero-image"} alt="LUNEV ONE premium wireless headphones in Natural finish" />
            <div className="stage-topline" aria-hidden="true">
              <span>Object 01</span>
              <span>Natural / 320 g</span>
            </div>
            <div className="stage-crosshair stage-crosshair-a" />
            <div className="stage-crosshair stage-crosshair-b" />
            <div className="stage-surface" />
            <div className="stage-note">
              <small>Industrial design</small>
              <strong>Soft geometry × machined precision</strong>
            </div>
          </div>
        </div>

        <div className="hero-footer">
          <span>40 mm custom dynamic driver</span>
          <span>Adaptive ANC</span>
          <span>Up to 40 h battery</span>
        </div>

        <a className="scroll-cue" href="#sound">
          <i />
          <span>Discover the object</span>
        </a>
      </section>

      <section
        id="sound"
        data-section="sound"
        className="story dark-section sound-section"
      >
        <div className="section-index">01</div>
        <div className="story-copy left-copy">
          <p className="eyebrow light">Sound / Driver architecture</p>
          <h2>
            Detail,
            <br />
            without force.
          </h2>
          <p>
            A custom 40 mm dynamic driver is revealed only when the
            product needs to explain itself. The 3D view turns a
            specification into something spatial and understandable.
          </p>

          <div className="metric-rail">
            <div>
              <strong>40 mm</strong>
              <span>Custom dynamic driver</span>
            </div>
            <div>
              <strong>USB-C</strong>
              <span>Digital audio</span>
            </div>
          </div>
        </div>

        <div className="story-caption">
          <span>Driver reveal</span>
          <span>Scroll-controlled separation</span>
        </div>
      </section>

      <section
        id="silence"
        data-section="silence"
        className="story dark-section silence-section"
      >
        <div className="section-index">02</div>
        <div className="story-copy right-copy">
          <p className="eyebrow light">Silence / Adaptive ANC</p>
          <h2>
            Make space
            <br />
            for less.
          </h2>
          <p>
            Noise control is presented as a reduction of visual
            pressure rather than another technical dashboard. As the
            field contracts, the product remains still.
          </p>

          <div className="metric-rail single">
            <div>
              <strong>Adaptive</strong>
              <span>Noise cancellation + transparency</span>
            </div>
          </div>
        </div>
      </section>

      <section
        id="material"
        data-section="material"
        className="story material-section"
      >
        <div className="section-index dark-number">03</div>
        <div className="material-grid">
          <div className="story-copy left-copy compact-copy">
            <p className="eyebrow">Material / CMF</p>
            <h2>
              Made to be
              <br />
              touched.
            </h2>
            <p>
              Metal, textile and cushion are tuned to read differently
              before the product is ever held. Reflectance is part of
              the interface.
            </p>
          </div>

          <div className="material-ledger">
            <div>
              <span>01</span>
              <strong>Machined aluminium</strong>
              <p>Directional metal response and controlled edge light.</p>
            </div>
            <div>
              <span>02</span>
              <strong>Soft contact surfaces</strong>
              <p>Lower reflectance and a muted sheen for perceived comfort.</p>
            </div>
            <div>
              <span>03</span>
              <strong>Tactile controls</strong>
              <p>Physical actions remain visible, reachable and deliberate.</p>
            </div>
          </div>
        </div>
      </section>

      <section
        id="longevity"
        data-section="longevity"
        className="story longevity-section"
      >
        <div className="section-index dark-number">04</div>
        <div className="story-copy right-copy">
          <p className="eyebrow">Longevity / Serviceability</p>
          <h2>
            Built to stay
            <br />
            in use.
          </h2>
          <p>
            Ear cushions and the inner headband separate from the
            product in 3D to make maintenance part of the ownership
            story—not an afterthought.
          </p>
          <a className="text-link" href="#explore">
            Inspect the construction <span>↘</span>
          </a>
        </div>

        <div className="longevity-note">
          <span>Replaceable</span>
          <strong>Cushions / inner headband</strong>
        </div>
      </section>

      <section
        id="explore"
        data-section="explore"
        className="story explore-section"
      >
        <div className="explore-head">
          <div>
            <p className="eyebrow">05 / Interactive object</p>
            <h2>
              Every angle.
              <br />
              Nothing hidden.
            </h2>
          </div>
          <p>
            Drag directly on the product. The interaction is here to
            improve product understanding—not to decorate the page.
          </p>
        </div>

        <div className="control-pill">
          <i />
          <span>3D controls active</span>
        </div>

        <div className="explore-instruction">
          Drag to rotate <span>·</span> Scroll to continue
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
            One object.
            <br />
            Three tones.
          </h2>
        </div>

        <div className="customize-panel">
          <div className="finish-current">
            <span>Selected finish</span>
            <strong>{FINISHES[finish].label}</strong>
          </div>

          <div
            className="finish-list"
            role="radiogroup"
            aria-label="Product finish"
          >
            {(Object.keys(FINISHES) as Finish[]).map((key) => (
              <button
                key={key}
                role="radio"
                aria-checked={finish === key}
                onClick={() => setFinish(key)}
                className={
                  finish === key
                    ? "finish-option active"
                    : "finish-option"
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

      <section
        id="specs"
        data-section="specs"
        className="specs-section"
      >
        <div className="specs-heading">
          <p className="eyebrow light">07 / Specifications</p>
          <h2>
            Less,
            <br />
            precisely.
          </h2>
          <p>
            The specification layer is deliberately quiet: enough
            information to make a decision without turning the
            experience into a comparison sheet.
          </p>
        </div>

        <dl className="spec-grid">
          <div>
            <dt>Driver</dt>
            <dd>40 mm custom dynamic</dd>
          </div>
          <div>
            <dt>Noise control</dt>
            <dd>Adaptive ANC + transparency</dd>
          </div>
          <div>
            <dt>Battery</dt>
            <dd>Up to 40 hours</dd>
          </div>
          <div>
            <dt>Connectivity</dt>
            <dd>Bluetooth 5.3 / USB-C audio</dd>
          </div>
          <div>
            <dt>Materials</dt>
            <dd>Machined aluminium / soft textile</dd>
          </div>
          <div>
            <dt>Weight</dt>
            <dd>Approx. 320 g</dd>
          </div>
          <div>
            <dt>Serviceability</dt>
            <dd>Replaceable cushions / inner headband</dd>
          </div>
          <div>
            <dt>Finish</dt>
            <dd>{FINISHES[finish].label}</dd>
          </div>
        </dl>
      </section>

      <section
        id="purchase"
        data-section="purchase"
        className="purchase-section"
      >
        <div className="purchase-copy">
          <p className="eyebrow">LUNEV ONE / Concept product</p>
          <h2>
            Keep the
            <br />
            quiet.
          </h2>
          <p>
            Premium wireless ANC headphones in {FINISHES[finish].label}.
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
            <span>Delivery</span>
            <strong>Concept only</strong>
          </div>

          <button onClick={() => setBag((value) => value + 1)}>
            <span>Add to bag</span>
            <span>↗</span>
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
