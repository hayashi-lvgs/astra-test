"use client";

import { useEffect, useRef, useState } from "react";
import { FINISHES, ProductScene, type Finish, type Section } from "../components/ProductScene";

const sections: Section[] = ["hero", "sound", "silence", "material", "longevity", "explore", "customize", "specs", "purchase"];

export default function Page() {
  const [finish, setFinish] = useState<Finish>("natural");
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
  const canvasHidden = active === "specs" || active === "purchase";

  return (
    <main className={`site section-${active} ${darkNav ? "nav-on-dark" : ""}`}>
      <style>{`
        .hero-section{min-height:100svh;overflow:hidden;background:
          radial-gradient(circle at 74% 23%,rgba(255,255,255,.90),rgba(255,255,255,0) 28%),
          radial-gradient(circle at 88% 68%,rgba(173,146,119,.24),rgba(173,146,119,0) 32%),
          linear-gradient(116deg,#f3eee7 0%,#ece4da 42%,#d8cabe 72%,#c6b4a2 100%)!important;isolation:isolate}
        .hero-section:before{content:"";position:absolute;z-index:2;right:-4vw;bottom:-7vh;width:61vw;height:34vh;background:linear-gradient(180deg,#ddd1c5,#bba994);clip-path:polygon(10% 4%,100% 0,100% 100%,0 100%);box-shadow:0 -1px 0 rgba(255,255,255,.52),0 -30px 80px rgba(83,62,44,.06)}
        .hero-section:after{content:"";position:absolute;inset:0;z-index:4;background:
          linear-gradient(90deg,rgba(242,237,230,.97) 0%,rgba(242,237,230,.83) 28%,rgba(242,237,230,.22) 47%,rgba(242,237,230,0) 63%),
          linear-gradient(180deg,rgba(255,255,255,.12),rgba(35,28,22,.03));pointer-events:none}
        .hero-visual{position:absolute!important;display:block!important;z-index:3!important;right:0!important;top:0!important;width:55%!important;height:100%!important;border-left:1px solid rgba(255,255,255,.2)!important;background:
          linear-gradient(112deg,rgba(255,255,255,.12),transparent 38%),
          radial-gradient(circle at 58% 28%,rgba(255,255,255,.28),transparent 29%)!important;pointer-events:none}
        .hero-copy{z-index:30!important;width:min(520px,40vw)!important;margin-top:3vh!important}
        .hero-copy h1{font-size:clamp(76px,7vw,116px)!important;line-height:.86!important;font-weight:360!important;letter-spacing:-.075em!important}
        .hero-summary{max-width:30ch!important;color:rgba(24,22,20,.62)!important}
        .hero-actions{margin-top:38px!important}
        .hero-meta,.scroll-cue{z-index:30!important}
        .hero-meta{right:5vw!important;color:#2b2723!important;opacity:.52!important}
        .section-hero .product-canvas{transform:translate3d(24vw,3vh,0) scale(.94)!important}
        .product-canvas{transition:opacity .5s ease,transform .8s cubic-bezier(.2,.7,.2,1)!important}
        .metric-rail strong{font-weight:360!important}
        .purchase-card{box-shadow:0 30px 90px rgba(51,42,32,.08)}
        @media(max-width:900px){
          .hero-section{display:block!important;padding-top:15vh!important;padding-left:22px!important;padding-right:22px!important;min-height:110svh!important;background:
            radial-gradient(circle at 70% 62%,rgba(255,255,255,.55),transparent 25%),
            linear-gradient(180deg,#f2ede6 0%,#e7ded4 53%,#cdbdad 100%)!important}
          .hero-section:before{right:-24vw!important;bottom:-2vh!important;width:125vw!important;height:27vh!important;clip-path:polygon(18% 4%,100% 0,100% 100%,0 100%)!important}
          .hero-section:after{background:linear-gradient(180deg,rgba(242,237,230,.98) 0%,rgba(242,237,230,.9) 37%,rgba(242,237,230,.28) 55%,rgba(242,237,230,0) 70%)!important}
          .hero-visual{display:none!important}
          .hero-copy{width:100%!important;max-width:520px!important;margin:0!important}
          .hero-copy h1{font-size:clamp(62px,15vw,92px)!important;max-width:7ch!important}
          .hero-summary{font-size:15px!important;max-width:28ch!important;margin-top:21px!important}
          .hero-actions{margin-top:23px!important;gap:12px!important}
          .hero-meta{display:none!important}
          .scroll-cue{bottom:18px!important;color:#2c2723!important;opacity:.48!important}
          .product-canvas{top:2vh!important;height:80vh!important}
          .section-hero .product-canvas{transform:translate3d(13vw,23vh,0) scale(.95)!important}
        }
        @media(max-width:560px){
          .hero-section{min-height:108svh!important}
          .hero-copy h1{font-size:14.8vw!important}
          .hero-summary{font-size:14.5px!important}
          .product-canvas{height:78vh!important}
          .section-hero .product-canvas{transform:translate3d(14vw,24vh,0) scale(.94)!important}
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
        <div className="hero-visual" aria-hidden="true" />
        <div className="hero-copy">
          <p className="kicker">LUNEV ONE / Wireless ANC Headphones</p>
          <h1>Silence,<br />made tangible.</h1>
          <p className="hero-summary">A premium listening object designed around material clarity, physical control and long-term ownership.</p>
          <div className="hero-actions">
            <a className="primary-link" href="#sound">Explore the product <span>↘</span></a>
            <span className="hero-price">¥148,000</span>
          </div>
        </div>
        <div className="hero-meta"><span>Natural</span><span>320 g</span><span>40 h battery</span></div>
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
