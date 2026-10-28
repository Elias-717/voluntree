"use client";

// Landing scroll story (FR-001, DEC-026): a sticky stage where scroll is the timeline.
// Each frame is one step of the journey, and the tree grows one stage per frame.

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowRight } from "@phosphor-icons/react";
import { TREE_STAGES } from "@/lib/tree/tree";

const FRAMES = [
  { label: "Show up", kicker: null, title: null, body: null },
  {
    label: "Missions",
    kicker: "01 · Seed to sprout",
    title: "An announcement becomes a mission.",
    body: "The organizer pastes an event notice. AI drafts the mission, and the organizer checks and publishes it. Nothing goes live on its own.",
  },
  {
    label: "Matching",
    kicker: "02 · Sprout to sapling",
    title: "Fair matching, with reasons.",
    body: "Every recommendation says why. Students who have had fewer chances get a boost, so the same few names don't take every spot.",
  },
  {
    label: "Watering",
    kicker: "03 · Sapling to young tree",
    title: "Show up. Get watered.",
    body: "When the organizer approves your attendance, your tree gets one watering, exactly once. A new stage every 3 waterings.",
  },
  {
    label: "Grow",
    kicker: "04 · Full tree",
    title: "Yours, and only yours.",
    body: "Each approval also gives you a certificate with your name, the mission, the date and an ID. Only you can see your tree.",
  },
];
const N = FRAMES.length;
// Share of each frame's slot where it holds still before the next morph starts.
const HOLD = 0.4;

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/** Scroll progress 0..1 → frame coordinate 0..N-1. Whole numbers are the frames. */
function frameCoord(progress: number) {
  const t = clamp01(progress) * (N - 1);
  const i = Math.min(Math.floor(t), N - 2);
  const h = HOLD / 2;
  return i + easeInOut(clamp01((t - i - h) / (1 - 2 * h)));
}

/** How present an element of frame `frame` is at `coord`, 0..1. `delay` staggers it. */
function reveal(coord: number, frame: number, delay: number) {
  const d = coord - frame;
  const lag = d < 0 ? delay : 1 - delay;
  return clamp01((0.6 - Math.abs(d) - lag * 0.2) / 0.25);
}

export function GrowingTree() {
  const rootRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const root = rootRef.current;
    const stage = stageRef.current;
    if (!root || !stage) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const items = Array.from(stage.querySelectorAll<HTMLElement>("[data-frame]"));
    const trees = Array.from(stage.querySelectorAll<HTMLElement>("[data-tree]"));

    let raf = 0;
    let shown = -1;
    const draw = () => {
      raf = 0;
      const r = root.getBoundingClientRect();
      const travel = r.height - window.innerHeight;
      const coord = frameCoord(travel > 0 ? -r.top / travel : 0);
      const still = reduced.matches;

      const frame = Math.round(coord);
      if (frame !== shown) {
        shown = frame;
        setActive(frame);
      }

      for (const el of items) {
        const f = Number(el.dataset.frame);
        const v = reveal(coord, f, Number(el.dataset.delay) || 0);
        el.style.opacity = String(v);
        el.style.visibility = v <= 0 ? "hidden" : "";
        if (still) continue;
        const dir = coord < f ? 1 : -1;
        el.style.transform = `translateY(${((1 - v) * 32 * dir).toFixed(1)}px)`;
        el.style.filter = v > 0.99 ? "" : `blur(${((1 - v) * 8).toFixed(1)}px)`;
      }

      // The tree cross-fades between stages and swells a little as it arrives.
      for (const el of trees) {
        const d = Math.abs(coord - Number(el.dataset.tree));
        const v = clamp01(1 - d * 1.6);
        el.style.opacity = String(v);
        el.style.transform = still ? "" : `scale(${(0.86 + 0.14 * v).toFixed(3)})`;
      }
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(draw);
    };
    draw();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const jump = (i: number) => {
    const root = rootRef.current;
    if (!root) return;
    const travel = root.offsetHeight - window.innerHeight;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: root.offsetTop + (i / (N - 1)) * travel, behavior: reduced ? "auto" : "smooth" });
  };

  // Frame 0 is visible before the script runs, so the hero never flashes empty.
  const hidden = (f: number) => (f === 0 ? undefined : { opacity: 0, visibility: "hidden" as const });

  return (
    <section ref={rootRef} className="relative" style={{ height: `${N * 100}svh` }} aria-label="How Voluntree works">
      <div ref={stageRef} className="sticky top-0 h-svh overflow-hidden">
        <div className="mx-auto grid h-full w-full max-w-6xl grid-rows-[1fr_auto] px-4 pb-8 pt-20 sm:px-8 md:grid-cols-[1.1fr_1fr] md:grid-rows-1 md:items-center md:gap-10 md:pb-0">
          {/* The tree: top half on phones, right column on wide screens. */}
          <div aria-hidden className="relative order-first mx-auto aspect-square h-full max-h-[44svh] md:order-last md:h-auto md:max-h-none md:w-full md:max-w-lg">
            <div className="absolute inset-[10%] rounded-full bg-tint" />
            {TREE_STAGES.map((stage, i) => (
              <div key={stage} data-tree={i} className="absolute inset-0 will-change-transform" style={i === 0 ? undefined : { opacity: 0 }}>
                <Image src={`/tree/${stage}.svg`} alt="" fill priority={i === 0} className="object-contain p-[16%]" />
              </div>
            ))}
          </div>

          {/* The type. Every frame sits in the same spot; scroll swaps them. */}
          <div className="relative min-h-[46svh] md:min-h-[420px]">
            <div className="absolute inset-x-0 bottom-0 md:bottom-auto md:top-1/2 md:-translate-y-1/2">
              <p data-frame={0} data-delay={0} className="text-xs font-medium uppercase tracking-[0.22em] text-accent">
                Volunteering at AIU, made fair
              </p>
              <h1 data-frame={0} data-delay={0.1} className="font-display mt-4 text-[clamp(3rem,9vw,6.5rem)] font-medium leading-[0.92] tracking-[-0.035em]">
                Show up.
                <br />
                <em className="text-accent">Grow</em> something.
              </h1>
              <p data-frame={0} data-delay={0.25} className="mt-5 max-w-md text-lg text-muted">
                Join AIU events and causes, and watch your own tree grow, one watering at a time.
              </p>
              <div data-frame={0} data-delay={0.35} className="mt-7 flex flex-wrap items-center gap-3">
                <Link href="/sign-in" className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3.5 font-medium text-on-primary">
                  Start growing <ArrowRight size={18} aria-hidden />
                </Link>
                <a href="#try" className="rounded-full border border-strong px-6 py-3.5 font-medium">
                  Try it live
                </a>
              </div>
            </div>

            {FRAMES.slice(1).map((f, k) => {
              const i = k + 1;
              return (
                <div key={f.label} className="absolute inset-x-0 bottom-0 md:bottom-auto md:top-1/2 md:-translate-y-1/2">
                  <p data-frame={i} data-delay={0} style={hidden(i)} className="text-xs font-medium uppercase tracking-[0.22em] text-accent">
                    {f.kicker}
                  </p>
                  <h2 data-frame={i} data-delay={0.12} style={hidden(i)} className="font-display mt-4 text-[clamp(2.4rem,6.5vw,4.75rem)] font-medium leading-[0.95] tracking-[-0.03em]">
                    {f.title}
                  </h2>
                  <p data-frame={i} data-delay={0.3} style={hidden(i)} className="mt-5 max-w-md text-lg text-muted">
                    {f.body}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Frame nav: a tick per frame, the current one long and green. */}
        <nav aria-label="Story steps" className="absolute right-4 top-1/2 hidden -translate-y-1/2 flex-col items-end sm:flex">
          {FRAMES.map((f, i) => (
            <button key={f.label} type="button" onClick={() => jump(i)} aria-current={active === i ? "step" : undefined}
              className="group flex items-center gap-2.5 py-1.5 text-xs text-muted">
              <span className="translate-x-1.5 opacity-0 transition group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100">
                {f.label}
              </span>
              <span className={`block h-px transition-all duration-500 ${active === i ? "w-8 bg-accent" : "w-3.5 bg-current opacity-50"}`} />
            </button>
          ))}
        </nav>

        <p aria-hidden className="absolute bottom-4 left-1/2 hidden -translate-x-1/2 text-[11px] uppercase tracking-[0.22em] text-muted transition-opacity md:block"
          style={{ opacity: active === 0 ? 1 : 0 }}>
          Scroll to grow
        </p>
      </div>
    </section>
  );
}
