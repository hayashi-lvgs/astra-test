"use client";

import { useEffect, useRef, useState } from "react";
import { FINISHES, ProductScene, type Finish, type Section } from "../components/ProductScene";

const sections: Section[] = ["hero", "sound", "silence", "material", "longevity", "explore", "customize", "specs", "purchase"];

export default function Page() {
  const [finish, setFinish] = useState<Finish>("graphite");
  const [active, setActive] = useState<Section>("hero");
  const [progress, setProgress] = useState(0);
  const [bag, setBag] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const activeRef = useRef<Section>("hero");

  useEffect(() => {
    const onScroll = () => {
      const vh = window.innerHeight;
      let best: { id: Section; score: number; progress: number } | null = null;
      for (const id of sections) {
        const el = document.querySelector<HTMLElement>(`[data-section="${id}"]`);
        if (!el) continue;
        const r = el.getBoundingClientRect();
        const center = Math.abs(r.top + r.height / 2 - vh / 2);
        const score = -center;
        const p = Math.min(1, Math.max(0, (vh - r.top) / (vh + r.height)));
        if (!best || score > best.score) best = { id, score, progress: p };
      }
      if (!best) return;
      setProgress(best.progress);
      if (best.id !== activeRef.current) {
        activeRef.current = best.id;
        setActive(best.id);
      }
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const interactive = active === "explore";
  const darkNav = active === "sound" || active === "silence" || active === "specs";
  const canvasHidden = active === "hero" || active === "specs" || active === "purchase";

  return (
    <main className={`site section-${active} ${darkNav ? "nav-on-dark" : ""}`}>
      <style>{`
        .hero-section{min-height:100svh;overflow:hidden;background:#eee8df!important;isolation:isolate}
        .hero-section:before{display:none!important}
        .hero-section:after{content:"";position:absolute;inset:0;z-index:6;background:linear-gradient(90deg,rgba(239,233,225,.98) 0%,rgba(239,233,225,.92) 28%,rgba(239,233,225,.24) 49%,rgba(239,233,225,0) 66%),linear-gradient(180deg,rgba(255,255,255,.16),rgba(58,46,35,.04));pointer-events:none}
        .hero-visual{position:absolute!important;display:block!important;z-index:3!important;inset:0 0 0 auto!important;width:71%!important;height:100%!important;border:0!important;background-repeat:no-repeat!important;background-size:cover!important;background-position:center center!important;filter:saturate(.86) contrast(1.02)}
        .hero-visual:after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,rgba(238,232,224,.42),transparent 23%),linear-gradient(180deg,transparent 70%,rgba(51,39,29,.08))}
        .hero-copy{z-index:15!important;width:min(540px,42vw)!important;margin-right:auto!important;margin-top:4vh!important}
        .hero-copy h1{font-size:clamp(78px,7.4vw,122px)!important;line-height:.86!important;font-weight:360!important;letter-spacing:-.075em!important}
        .hero-summary{max-width:31ch!important;color:rgba(24,22,20,.62)!important}
        .hero-actions{margin-top:38px!important}
        .hero-price{font-variant-numeric:tabular-nums}
        .hero-meta,.scroll-cue{z-index:15!important}
        .hero-meta{right:4vw!important;color:#f4eee8!important;opacity:.76!important;text-shadow:0 1px 18px rgba(0,0,0,.18)}
        .nav-shell{mix-blend-mode:normal}
        .story-copy,.explore-copy,.customize-panel,.specs-heading,.purchase-copy,.purchase-card{transition:transform .5s ease,opacity .5s ease}
        .metric-rail strong{font-weight:360!important}
        .material-chips span{backdrop-filter:blur(8px)}
        .purchase-card{box-shadow:0 30px 90px rgba(51,42,32,.08)}
        @media(max-width:900px){
          .hero-section{padding-top:14vh!important;padding-left:22px!important;padding-right:22px!important;min-height:112svh!important;background:linear-gradient(180deg,#efe9e2 0%,#ebe4db 48%,#d3c6b8 100%)!important}
          .hero-section:after{z-index:6;background:linear-gradient(180deg,rgba(239,233,225,.99) 0%,rgba(239,233,225,.93) 38%,rgba(239,233,225,.42) 53%,rgba(239,233,225,0) 68%)}
          .hero-visual{top:auto!important;bottom:0!important;left:0!important;width:100%!important;height:61%!important;background-size:cover!important;background-position:58% 48%!important;filter:saturate(.84) contrast(1.02)}
          .hero-visual:after{background:linear-gradient(180deg,rgba(238,232,224,.7),transparent 18%,transparent 82%,rgba(50,38,28,.08))}
          .hero-copy{width:100%!important;max-width:530px!important;margin:0!important}
          .hero-copy h1{font-size:clamp(62px,15vw,94px)!important;line-height:.87!important;max-width:7ch!important}
          .hero-summary{max-width:29ch!important;margin-top:21px!important;font-size:15px!important;line-height:1.48!important}
          .hero-actions{margin-top:24px!important;gap:12px!important}
          .hero-meta{display:none!important}
          .scroll-cue{bottom:18px!important;color:#f5eee7!important;opacity:.82!important;text-shadow:0 1px 14px rgba(0,0,0,.2)}
        }
        @media(max-width:560px){
          .hero-section{min-height:108svh!important}
          .hero-visual{height:56%!important;background-position:60% 50%!important}
          .hero-copy h1{font-size:14.8vw!important}
          .hero-summary{font-size:14.5px!important}
          .primary-link{font-size:10px}
        }
      `}</style>

      <header className="nav-shell">
        <a href="#hero" className="brand-mark" aria-label="LUNEV home">LUNEV</a>
        <nav className="desktop-nav" aria-label="Primary">
          <a href="#sound">Product</a>
          <a href="#explore">Explore</a>
          <a href="#specs">Specifications</a>
          <a href="#purchase">Configure</a>
        </nav>
        <button className="bag-button" aria-label={`Bag ${bag} items`}>Bag {bag ? `(${bag})` : ""}</button>
        <button className="menu-button" onClick={() => setMenuOpen((v) => !v)} aria-expanded={menuOpen}>Menu</button>
      </header>

      {menuOpen && (
        <div className="mobile-menu">
          <button className="menu-close" onClick={() => setMenuOpen(false)} aria-label="Close menu">Close</button>
          {[["Product", "#sound"], ["Explore", "#explore"], ["Specifications", "#specs"], ["Configure", "#purchase"]].map(([label, href]) => (
            <a key={href} href={href} onClick={() => setMenuOpen(false)}>{label}</a>
          ))}
        </div>
      )}

      <div className={`product-canvas ${interactive ? "is-interactive" : ""} ${canvasHidden ? "is-hidden" : ""}`} aria-hidden="true">
        <ProductScene finish={finish} section={active} progress={progress} interactive={interactive} />
      </div>

      <section id="hero" data-section="hero" className="story hero-section">
        <div className="hero-visual" style={{ backgroundImage: "url(/hero-image)" }} aria-hidden="true" />
        <div className="hero-copy">
          <p className="kicker">LUNEV ONE / Wireless ANC Headphones</p>
          <h1>Silence,<br />made tangible.</h1>
          <p className="hero-summary">A premium listening object designed around material clarity, physical control and long-term ownership.</p>
          <div className="hero-actions">
            <a className="primary-link" href="#sound">Explore the product <span>↘</span></a>
            <span className="hero-price">¥148,000</span>
          </div>
        </div>
        <div className="hero-meta"><span>Graphite</span><span>320 g</span><span>40 h battery</span></div>
        <div className="scroll-cue"><i />Scroll to discover</div>
      </section>

      <section id="sound" data-section="sound" className="story dark-section sound-section">
        <div className="story-copy left-copy">
          <p className="kicker light">01 / Sound</p><h2>Hear the detail,<br />not the hardware.</h2>
          <p>40 mm custom dynamic drivers are presented as part of the physical product architecture—not hidden behind marketing imagery.</p>
          <div className="metric-rail"><div><strong>40 mm</strong><span>Custom dynamic driver</span></div><div><strong>24 bit</strong><span>High-resolution playback</span></div></div>
        </div>
      </section>

      <section id="silence" data-section="silence" className="story dark-section silence-section">
        <div className="story-copy right-copy">
          <p className="kicker light">02 / Silence</p><h2>Control the space<br />around you.</h2>
          <p>Adaptive ANC is expressed as a quieter visual field, turning an invisible feature into something users can understand at a glance.</p>
          <div className="metric-rail single"><div><strong>Adaptive</strong><span>Noise cancelling + transparency</span></div></div>
        </div>
      </section>

      <section id="material" data-section="material" className="story material-section">
        <div className="material-backdrop" aria-hidden="true" />
        <div className="story-copy left-copy compact-copy">
          <p className="kicker">03 / Material</p><h2>Made to be touched.</h2>
          <p>Machined aluminium, soft cushioning and deliberate physical controls create a product that feels considered before it is even worn.</p>
          <div className="material-chips"><span>Bead-blasted aluminium</span><span>Soft-touch cushion</span><span>Knurled dial</span></div>
        </div>
      </section>

      <section id="longevity" data-section="longevity" className="story longevity-section">
        <div className="story-copy right-copy compact-copy">
          <p className="kicker">04 / Longevity</p><h2>Designed beyond<br />the upgrade cycle.</h2>
          <p>Replaceable ear cushions and inner headband components support longer ownership and make the product easier to maintain.</p>
          <a className="text-link" href="#explore">Inspect the construction →</a>
        </div>
      </section>

      <section id="explore" data-section="explore" className="story explore-section">
        <div className="explore-copy"><p className="kicker">05 / Explore</p><h2>Every angle.<br />Nothing hidden.</h2><p>Drag directly on the product to inspect proportion, controls and construction.</p><span className="control-status"><i /> 3D controls active</span></div>
        <div className="explore-instruction">Drag to rotate · Scroll to continue</div>
      </section>

      <section id="customize" data-section="customize" className="story customize-section">
        <div className="customize-panel">
          <p className="kicker">06 / Finish</p><h2>Choose your tone.</h2><p>The finish changes the character of the product without changing its identity.</p>
          <div className="finish-list" role="radiogroup" aria-label="Product finish">
            {(Object.keys(FINISHES) as Finish[]).map((key) => <button key={key} role="radio" aria-checked={finish === key} onClick={() => setFinish(key)} className={finish === key ? "finish-option active" : "finish-option"}><span className="finish-dot" style={{ background: FINISHES[key].metal }} /><span>{FINISHES[key].label}</span><span className="finish-check">{finish === key ? "Selected" : ""}</span></button>)}
          </div>
        </div>
      </section>

      <section id="specs" data-section="specs" className="specs-section">
        <div className="specs-heading"><p className="kicker light">07 / Specifications</p><h2>Engineered<br />with restraint.</h2><p>Only the details that matter to everyday use, ownership and product understanding.</p></div>
        <dl className="spec-grid"><div><dt>Driver</dt><dd>40 mm custom dynamic</dd></div><div><dt>Noise control</dt><dd>Adaptive ANC + transparency</dd></div><div><dt>Battery</dt><dd>Up to 40 hours</dd></div><div><dt>Connectivity</dt><dd>Bluetooth 5.3 / USB-C audio</dd></div><div><dt>Materials</dt><dd>Machined aluminium / soft textile</dd></div><div><dt>Weight</dt><dd>Approx. 320 g</dd></div><div><dt>Serviceability</dt><dd>Replaceable cushions / inner headband</dd></div><div><dt>Finish</dt><dd>{FINISHES[finish].label}</dd></div></dl>
      </section>

      <section id="purchase" data-section="purchase" className="purchase-section">
        <div className="purchase-copy"><p className="kicker">LUNEV ONE</p><h2>Own the quiet.</h2><p>Premium wireless ANC headphones in {FINISHES[finish].label}.</p></div>
        <div className="purchase-card"><div><span>Selected finish</span><strong>{FINISHES[finish].label}</strong></div><div><span>Price</span><strong>¥148,000</strong></div><button onClick={() => setBag((v) => v + 1)}>Add to Bag <span>→</span></button><small>Portfolio concept. No payment is processed.</small></div>
      </section>

      <footer><span>LUNEV / Concept Portfolio Project</span><a href="#hero">Back to top ↑</a></footer>
    </main>
  );
}
