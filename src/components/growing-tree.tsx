"use client";

// Landing scroll story (FR-001, DEC-026), adapted from the Lycoris Specimen component
// (21st.dev/@kedhareswer): a scroll-scrubbed sticky stage built around one object, here a
// procedurally modelled palm tree lit as green chrome in raw WebGL. Scroll is the timeline.
// Six frames: cover, crown, missions, matching, watering, grow. Between frames the camera
// orbits, the palm flies, turns and keeps growing, and the type morphs into the next layout.

import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import Image from "next/image";

// #region tree model
type V3 = [number, number, number];
type Curve = {
  pts: V3[];
  /** 0 leaf ribbon, 1 frond stem tube, 2 trunk tube, 3 plinth (grows with the trunk, never moves) */
  kind: 0 | 1 | 2 | 3;
  /** half-width of a leaf, radius of a tube */
  w: number;
  /** leaf width direction */
  lat: V3;
  phase: number;
  /** growth time 0..1 when this curve starts to grow */
  start: number;
  base: V3;
};

const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const mul = (a: V3, s: number): V3 => [a[0] * s, a[1] * s, a[2] * s];
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = (a: V3): V3 => {
  const l = Math.hypot(a[0], a[1], a[2]) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
};
const perp = (d: V3): V3 => norm(cross(d, Math.abs(d[1]) > 0.9 ? [1, 0, 0] : [0, 1, 0]));

const rng = (seed: number) => {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const UP: V3 = [0, 1, 0];
/** How long one frond or leaflet takes to grow, in growth time. */
const GROW = 0.18;
/** How long the trunk takes to rise, in growth time. It carries the crown up with it. */
const TRUNK_GROW = 0.9;
const ROOT_Y = -1.6;
const FRONDS = 16;
/** The round base the palm stands on: radius and height. */
const PLINTH_R = 0.22;
const PLINTH_H = 0.095;
const LEAFLETS = 18;
/** Golden angle, so each new frond sits between the older ones, as on a real palm. */
const GOLDEN = Math.PI * (3 - Math.sqrt(5));

/**
 * The palm as centrelines. A tall, slightly curved trunk and a crown of feather fronds at its
 * top: each frond a stem with pairs of narrow leaflets along both sides. The oldest fronds are
 * the longest and droop; each newer one points higher, ending in an upright spear. Fronds open
 * one after another and their leaflets unfold from base to tip, while the trunk rises slowly
 * underneath (see the vertex shader), so the palm starts as a tuft of fronds on the ground.
 */
const buildPalm = (seed: number) => {
  const r = rng(seed);
  const leaves: Curve[] = [];

  // the trunk: leans a little, then turns back towards the sky
  // six rings to every row of scales, so their edges stay sharp
  const steps = BARK_ROWS * 6;
  const root: V3 = [0, ROOT_Y, 0];
  const pts: V3[] = [root];
  let p = root;
  let d = norm([0.12, 1, 0.05]);
  for (let k = 1; k <= steps; k++) {
    d = norm(add(d, [-0.235 / steps, 0, -0.1 / steps]));
    p = add(p, mul(d, 2.45 / steps));
    pts.push(p);
  }
  const top = pts[steps];
  const trunk: Curve = { pts, kind: 2, w: 0.1, lat: perp(d), phase: 0, start: 0, base: root };

  for (let i = 0; i < FRONDS; i++) {
    // 0 for the oldest frond, 1 for the newest
    const age = i / (FRONDS - 1);
    const phi = i * GOLDEN + (r() - 0.5) * 0.3;
    const el = -0.15 + 1.35 * age + (r() - 0.5) * 0.12;
    const out: V3 = [Math.cos(phi), 0, Math.sin(phi)];
    let fd = norm(add(mul(out, Math.cos(el)), [0, Math.sin(el), 0]));
    const len = 1.4 - 0.55 * age + r() * 0.12;
    const sag = 0.02 + 0.075 * (1 - age);
    const start = 0.02 + 0.6 * age + r() * 0.02;
    const n = 14;
    const from = add(top, mul(out, 0.04));
    const fp: V3[] = [from];
    const fds: V3[] = [fd];
    let q = from;
    for (let k = 1; k <= n; k++) {
      fd = norm(add(fd, [0, -sag, 0]));
      q = add(q, mul(fd, len / n));
      fp.push(q);
      fds.push(fd);
    }
    // the stem is drawn with the leaves, so it takes their green
    leaves.push({ pts: fp, kind: 1, w: 0.02, lat: perp(fds[0]), phase: r() * 6, start, base: from });

    for (let j = 0; j < LEAFLETS; j++) {
      const t = 0.12 + (0.88 * j) / (LEAFLETS - 1);
      const at = Math.round(t * n);
      const fdir = fds[at];
      const side = norm(cross(UP, fdir));
      const L = 0.05 + 0.3 * Math.sin(Math.PI * (0.1 + 0.9 * t)) * (0.75 + 0.25 * (1 - age));
      for (const sign of [1, -1]) {
        // angled forward along the stem and lifted a little, so each pair makes a shallow V
        const ldir = norm(add(add(mul(side, sign), mul(fdir, 0.7)), [0, 0.2, 0]));
        const lp: V3[] = [fp[at]];
        let c = fp[at];
        for (let k = 1; k <= 8; k++) {
          c = add(c, mul(norm(add(ldir, [0, -0.45 * (k / 8), 0])), L / 8));
          lp.push(c);
        }
        leaves.push({
          pts: lp, kind: 0, w: 0.022 + r() * 0.006, lat: norm(sub(fdir, mul(ldir, dot(fdir, ldir)))),
          phase: r() * Math.PI * 2, start: start + (1 - Math.cbrt(1 - t)) * GROW + r() * 0.02, base: fp[at],
        });
      }
    }
  }

  // The camera looks at the middle of the crown; the framing radius is the crown's reach.
  const heart: V3 = [0, 0, 0];
  for (const l of leaves) for (let i = 0; i < 3; i++) heart[i] += l.base[i] / leaves.length;
  let radius = 0;
  for (const c of leaves)
    for (const q of c.pts) radius = Math.max(radius, Math.hypot(q[0] - heart[0], q[1] - heart[1], q[2] - heart[2]));
  return { curves: [trunk, ...leaves], leafFrom: 1, heart, radius, rise: sub(top, root) };
};

/** Diamond scales around the trunk, and rows of them from foot to crown. */
const BARK_AROUND = 7;
const BARK_ROWS = 17;
const fract = (x: number) => x - Math.floor(x);

/**
 * How far the trunk's surface stands out at height s (0 foot, 1 top) and angle a: the cut-off
 * bases of old fronds, as diamond scales in two crossing spirals with sharp grooves between
 * them. Smooth at the very foot, and softer near the crown, as on a real date palm.
 */
const bark = (s: number, a: number) => {
  const x = (a / (Math.PI * 2)) * BARK_AROUND + s * 4;
  const y = s * BARK_ROWS;
  const p = fract(x + y);
  const q = fract(x - y);
  // 0 in a groove, 1 at a scale's centre
  const d = Math.min(p, 1 - p, q, 1 - q) * 2;
  const fade = smoothstep(0.03, 0.1, s) * (1 - 0.6 * smoothstep(0.75, 1, s));
  return 0.32 * Math.pow(d, 0.6) * fade;
};

/** Interleaved vertex layout: pos 3, normal 3, aux 4 (s, phase, kind, start), base 3. */
const STRIDE = 13;

const buildMesh = (curves: Curve[], leafFrom: number) => {
  const v: number[] = [];
  const idx: number[] = [];
  let count = 0;
  let leafIndex = 0;
  const push = (p: V3, n: V3, s: number, c: Curve) => {
    v.push(p[0], p[1], p[2], n[0], n[1], n[2], s, c.phase, c.kind, c.start, c.base[0], c.base[1], c.base[2]);
    return count++;
  };
  const tangent = (pts: V3[], i: number) => norm(sub(pts[Math.min(i + 1, pts.length - 1)], pts[Math.max(i - 1, 0)]));

  // The plinth: a low disc turned on a lathe, its profile rounded over at both rims. Each band
  // of the profile gets one normal, so the faces read flat and the rims catch a bright line.
  const plinth: Curve = { pts: [], kind: 3, w: 0, lat: UP, phase: 0, start: 0, base: [0, ROOT_Y, 0] };
  const top = ROOT_Y + 0.02;
  const bevel = 0.035;
  const profile: [number, number][] = [[0, top], [PLINTH_R - bevel, top]];
  for (let j = 1; j <= 4; j++) {
    const a = (j / 4) * (Math.PI / 2);
    profile.push([PLINTH_R - bevel + Math.sin(a) * bevel, top - bevel + Math.cos(a) * bevel]);
  }
  for (let j = 0; j <= 4; j++) {
    const a = (j / 4) * (Math.PI / 2);
    profile.push([PLINTH_R - bevel + Math.cos(a) * bevel, top - PLINTH_H + bevel - Math.sin(a) * bevel]);
  }
  profile.push([0, top - PLINTH_H]);
  const AROUND = 64;
  for (let j = 0; j < profile.length - 1; j++) {
    const [r0, y0] = profile[j];
    const [r1, y1] = profile[j + 1];
    const first = count;
    for (let k = 0; k <= AROUND; k++) {
      const a = (k / AROUND) * Math.PI * 2;
      const cx = Math.cos(a);
      const cz = Math.sin(a);
      const nr = norm([(y1 - y0) * cx, r0 - r1, (y1 - y0) * cz]);
      const n2: V3 = dot(nr, [cx, (y0 + y1) / 2 - (top - PLINTH_H / 2), cz]) < 0 ? mul(nr, -1) : nr;
      push([r0 * cx, y0, r0 * cz], n2, 1, plinth);
      push([r1 * cx, y1, r1 * cz], n2, 1, plinth);
    }
    for (let k = 0; k < AROUND; k++) {
      const q = first + k * 2;
      idx.push(q, q + 1, q + 2, q + 1, q + 3, q + 2);
    }
  }
  const woodIndex = idx.length;

  curves.forEach((c, ci) => {
    if (ci === leafFrom) leafIndex = idx.length;
    const n = c.pts.length;
    if (c.kind === 0) {
      // A leaf: a thin strap with real thickness, pointed at both ends, so the chrome picks up
      // a bright line along each rim.
      const rings: number[][] = [];
      for (let i = 0; i < n; i++) {
        const s = i / (n - 1);
        const T = tangent(c.pts, i);
        const N = norm(cross(T, c.lat));
        const W = cross(N, T);
        const hw = c.w * Math.pow(Math.sin(Math.PI * Math.min(1, 0.06 + s * 0.94)), 0.8) + 0.003;
        const th = 0.006;
        const p = c.pts[i];
        const k0 = add(add(p, mul(W, hw)), mul(N, th));
        const k1 = add(sub(p, mul(W, hw)), mul(N, th));
        const k2 = sub(sub(p, mul(W, hw)), mul(N, th));
        const k3 = sub(add(p, mul(W, hw)), mul(N, th));
        const mW = mul(W, -1);
        const mN = mul(N, -1);
        rings.push([
          push(k0, N, s, c), push(k1, N, s, c), push(k1, mW, s, c), push(k2, mW, s, c),
          push(k2, mN, s, c), push(k3, mN, s, c), push(k3, W, s, c), push(k0, W, s, c),
        ]);
      }
      for (let i = 0; i < n - 1; i++) {
        const a = rings[i];
        const b = rings[i + 1];
        for (let f = 0; f < 4; f++) {
          const x = f * 2;
          idx.push(a[x], a[x + 1], b[x], a[x + 1], b[x + 1], b[x]);
        }
      }
    } else {
      // Round tube on a parallel-transport frame, so it never corkscrews. Tapers to the tip.
      // The trunk is wrapped in diamond scales, so its points come first and its normals are
      // taken from the bumpy surface itself; otherwise the chrome would light it as a smooth pipe.
      const seg = c.kind === 2 ? BARK_AROUND * 6 : 6;
      let N = perp(tangent(c.pts, 0));
      const grid: V3[][] = [];
      const radial: V3[][] = [];
      for (let i = 0; i < n; i++) {
        const s = i / (n - 1);
        const T = tangent(c.pts, i);
        N = norm(sub(N, mul(T, dot(N, T))));
        const B = cross(T, N);
        const row: V3[] = [];
        const dirs: V3[] = [];
        for (let k = 0; k <= seg; k++) {
          const a = (k / seg) * Math.PI * 2;
          const nr = add(mul(N, Math.cos(a)), mul(B, Math.sin(a)));
          const rad = c.kind === 2 ? c.w * (1 - 0.25 * s) * (s < 0.06 ? 1.5 - s * 8.3 : 1) * (1 + bark(s, a)) : c.w * (1 - 0.45 * s);
          row.push(add(c.pts[i], mul(nr, rad)));
          dirs.push(nr);
        }
        grid.push(row);
        radial.push(dirs);
      }
      const rings: number[] = [];
      for (let i = 0; i < n; i++) {
        const s = i / (n - 1);
        rings.push(count);
        for (let k = 0; k <= seg; k++) {
          const around = sub(grid[i][(k + 1) % seg], grid[i][(k - 1 + seg) % seg]);
          const up = sub(grid[Math.min(i + 1, n - 1)][k], grid[Math.max(i - 1, 0)][k]);
          let nr = norm(cross(around, up));
          if (dot(nr, radial[i][k]) < 0) nr = mul(nr, -1);
          push(grid[i][k], nr, s, c);
        }
      }
      for (let i = 0; i < n - 1; i++) {
        for (let k = 0; k < seg; k++) {
          const a = rings[i] + k;
          const b = rings[i + 1] + k;
          idx.push(a, a + 1, b, a + 1, b + 1, b);
        }
      }
    }
  });
  return { data: new Float32Array(v), index: new Uint16Array(idx), woodIndex, leafIndex };
};
// #endregion

// #region scroll
const clamp01 = (x: number) => (x <= 0 ? 0 : x > 1 ? 1 : x);
const smoothstep = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/** 0 while the root's top sits at the stage's top, 1 when its bottom does. */
const progressFrom = (top: number, height: number, viewport: number) => {
  const travel = height - viewport;
  if (travel <= 0) return 0;
  return clamp01(-top / travel);
};

/** Scroll progress → frame coordinate 0..n-1. Whole numbers are the frames; each holds for `hold` of its slot. */
const sceneCoord = (p: number, n: number, hold: number) => {
  if (n <= 1) return 0;
  const t = clamp01(p) * (n - 1);
  const i = Math.min(Math.floor(t), n - 2);
  const h = hold / 2;
  return i + easeInOut(clamp01((t - i - h) / (1 - 2 * h)));
};

/** How present one element of frame `scene` is at `coord`. `delay` 0..1 staggers it in, and mirrored, out. */
const reveal = (coord: number, scene: number, delay: number) => {
  const d = coord - scene;
  const lag = d < 0 ? delay : 1 - delay;
  return clamp01((0.6 - Math.abs(d) - lag * 0.2) / 0.25);
};
// #endregion

// #region camera frames
type Key = {
  /** turn of the tree about its trunk, radians */
  spin: number;
  /** camera elevation, degrees; +90 looks straight down */
  el: number;
  /** crown radius as a fraction of the stage's short side */
  size: number;
  /** where the crown lands, in clip space (-1..1, +y up) */
  ox: number;
  oy: number;
};

const KEYS: Key[] = [
  { spin: 0.2, el: 9, size: 0.48, ox: 0, oy: 0.14 },
  { spin: 1.4, el: 88, size: 0.58, ox: 0, oy: 0 },
  { spin: 2.3, el: 12, size: 0.27, ox: 0, oy: 0.42 },
  { spin: 3.1, el: -30, size: 0.8, ox: 0, oy: -0.42 },
  { spin: 4.1, el: 16, size: 0.92, ox: 0.6, oy: 0.12 },
  { spin: 5.0, el: -74, size: 0.86, ox: 0, oy: 1.02 },
];
// Portrait stages move the tree rather than squeezing the type.
const KEYS_TALL: Partial<Key>[] = [
  { size: 0.64, oy: 0.2 },
  { size: 0.56 },
  { size: 0.34, oy: 0.5 },
  { size: 0.9, oy: -0.3 },
  { size: 0.82, ox: 0.3, oy: 0.4 },
  { size: 0.96, oy: 1.0 },
];
const SCENES = KEYS.length;
/** How grown the palm is at the top of the page: a young palm, its first fronds on a short trunk. */
const SPROUT = 0.3;
/** Where the camera looks while the palm is still young: its low crown. */
const SEEDLING_Y = ROOT_Y + 0.6;
const HOLD = 0.34;
const NAV = ["Cover", "Crown", "Missions", "Matching", "Watering", "Grow"];

const keyAt = (coord: number, tall: boolean): Key => {
  const i = Math.max(0, Math.min(SCENES - 1, Math.floor(coord)));
  const j = Math.min(SCENES - 1, i + 1);
  const f = coord - i;
  const a = { ...KEYS[i], ...(tall ? KEYS_TALL[i] : {}) };
  const b = { ...KEYS[j], ...(tall ? KEYS_TALL[j] : {}) };
  const l = (x: number, y: number) => x + (y - x) * f;
  return { spin: l(a.spin, b.spin), el: l(a.el, b.el), size: l(a.size, b.size), ox: l(a.ox, b.ox), oy: l(a.oy, b.oy) };
};
// #endregion

// #region matrices (column-major)
type M4 = Float32Array;
const perspective = (fovy: number, aspect: number, near: number, far: number): M4 => {
  const f = 1 / Math.tan(fovy / 2);
  const m = new Float32Array(16);
  m[0] = f / aspect;
  m[5] = f;
  m[10] = (far + near) / (near - far);
  m[11] = -1;
  m[14] = (2 * far * near) / (near - far);
  return m;
};
const lookAt = (eye: V3, at: V3): M4 => {
  const z = norm(sub(eye, at));
  const x = norm(cross([0, 1, 0], z));
  const y = cross(z, x);
  const m = new Float32Array(16);
  m[0] = x[0]; m[4] = x[1]; m[8] = x[2];
  m[1] = y[0]; m[5] = y[1]; m[9] = y[2];
  m[2] = z[0]; m[6] = z[1]; m[10] = z[2];
  m[12] = -dot(x, eye); m[13] = -dot(y, eye); m[14] = -dot(z, eye); m[15] = 1;
  return m;
};
const multiply = (a: M4, b: M4): M4 => {
  const o = new Float32Array(16);
  for (let c = 0; c < 4; c++)
    for (let r = 0; r < 4; r++)
      o[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3];
  return o;
};
const rotY = (t: number): M4 => {
  const c = Math.cos(t);
  const s = Math.sin(t);
  return new Float32Array([c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, 0, 0, 0, 1]);
};
const rotX = (t: number): M4 => {
  const c = Math.cos(t);
  const s = Math.sin(t);
  return new Float32Array([1, 0, 0, 0, 0, c, s, 0, 0, -s, c, 0, 0, 0, 0, 1]);
};

const hexToLinear = (hex: string): V3 => {
  const n = parseInt(hex.replace("#", ""), 16);
  const ch = (x: number) => Math.pow(x / 255, 2.2);
  return [ch((n >> 16) & 255), ch((n >> 8) & 255), ch(n & 255)];
};
// #endregion

// #region shaders
const VERT = `
attribute vec3 a_pos;
attribute vec3 a_nrm;
attribute vec4 a_aux;
attribute vec3 a_base;
uniform mat4 u_vp;
uniform mat4 u_model;
uniform vec2 u_offset;
uniform float u_time;
uniform float u_grow;
uniform float u_sway;
uniform vec3 u_rise;
varying vec3 v_n;
varying vec3 v_w;
varying float v_s;
void main() {
  vec3 p = a_pos;
  float g = clamp((u_grow - a_aux.w) / ${GROW.toFixed(2)}, 0.0, 1.0);
  g = 1.0 - pow(1.0 - g, 3.0);
  // the trunk rises slowly from the root and lifts the whole crown with it
  float t = clamp(u_grow / ${TRUNK_GROW.toFixed(2)}, 0.0, 1.0);
  t = t * t * (3.0 - 2.0 * t);
  if (a_aux.z > 2.5) {
    // the plinth widens with the trunk, from just wider than a young palm's foot to full size
    p = a_base + (p - a_base) * mix(0.15, 1.0, t);
  } else if (a_aux.z > 1.5) {
    p = a_base + (p - a_base) * t;
  } else {
    p = a_base + (p - a_base) * g + u_rise * (t - 1.0);
  }
  if (a_aux.z < 0.5) {
    float amp = 0.025 * u_sway * (0.3 + a_aux.x);
    p += amp * vec3(sin(u_time * 1.7 + a_aux.y), 0.6 * sin(u_time * 2.3 + a_aux.y * 1.7), cos(u_time * 1.3 + a_aux.y * 1.3));
  }
  // the whole crown leans in a slow breeze; position-based, so every twig stays on its branch
  float h = max(p.y - ${ROOT_Y.toFixed(1)}, 0.0);
  p.x += u_sway * 0.012 * h * h * sin(u_time * 0.7);
  p.z += u_sway * 0.008 * h * h * cos(u_time * 0.5);
  vec4 w = u_model * vec4(p, 1.0);
  v_w = w.xyz;
  v_n = (u_model * vec4(a_nrm, 0.0)).xyz;
  v_s = a_aux.x;
  gl_Position = u_vp * w;
  gl_Position.xy += u_offset * gl_Position.w;
}
`;

// Chrome: almost no diffuse, everything is the reflection of a dark studio with one overhead
// softbox, a tall side strip and a back rim, tinted by the material, running to white only
// where the highlight is hottest.
const FRAG = `
precision highp float;
uniform vec3 u_eye;
uniform vec3 u_col;
uniform vec3 u_hot;
varying vec3 v_n;
varying vec3 v_w;
varying float v_s;
float studio(vec3 r) {
  float key = pow(max(dot(r, normalize(vec3(-0.45, 0.85, 0.35))), 0.0), 14.0) * 2.6;
  float strip = smoothstep(0.55, 0.8, r.x) * smoothstep(-0.7, 0.3, r.y) * 1.4;
  float rim = smoothstep(0.55, 0.95, -r.z) * smoothstep(-0.2, 0.5, r.y) * 0.9;
  float hz = exp(-abs(r.y - 0.05) * 7.0) * 0.4;
  return key + strip + rim + hz;
}
void main() {
  vec3 n = normalize(v_n);
  vec3 v = normalize(u_eye - v_w);
  if (dot(n, v) < 0.0) n = -n;
  vec3 r = reflect(-v, n);
  float e = studio(r);
  float fr = pow(1.0 - max(dot(n, v), 0.0), 3.0);
  float dif = max(dot(n, normalize(vec3(-0.3, 0.8, 0.6))), 0.0);
  vec3 col = u_col * (0.05 + 0.25 * dif);
  col += u_col * e * 1.15;
  col += u_hot * pow(e, 3.0) * 0.3;
  col += u_col * fr * 1.1;
  col *= 0.8 + 0.2 * smoothstep(0.0, 0.25, v_s);
  col = col / (1.0 + col);
  col = pow(col, vec3(1.0 / 2.2));
  gl_FragColor = vec4(col, 1.0);
}
`;
// #endregion

// #region copy
const DISPLAY = "var(--font-fraunces), Georgia, serif";
const INK = "#0d0f0c";
const BONE = "#d8d5c0";
const PLINTH_CHROME = "#6f6a58";
const LEAF = "#8dbb6e";
const LEAF_CHROME = "#4f9a3c";
const WOOD_CHROME = "#8a5a36";

const SPECS = ["Fair, explained matching", "One approval, one watering", "Five stages of growth", "A certificate every time", "A private tree"];

// Frame 2: an organizer's announcement, and the mission the AI drafts from it.
// Hovering a field lights up the words it came from. Illustrative, synthetic (DEC-038).
const ANNOUNCEMENT: [string, string?][] = [
  ["Hi all! "], ["Red Cross Kedah", "title"], [" needs "], ["20 volunteers", "spots"], [" for "], ["flood aid", "title"],
  [" this "], ["Saturday 14 November", "when"], [", "], ["8am to 2pm", "when"], [", meeting at the "], ["Alor Setar", "where"],
  [" centre. Bring water and comfy shoes."],
];
const DRAFT: { label: string; value: string; k?: string }[] = [
  { label: "Title", value: "Red Cross Kedah Flood Aid", k: "title" },
  { label: "When", value: "Sat 14 Nov · 08:00–14:00", k: "when" },
  { label: "Where", value: "Alor Setar", k: "where" },
  { label: "Spots", value: "20", k: "spots" },
  { label: "Skills", value: "Not stated · check" },
];

// Frame 3: an illustrative ranking. Fewer past chances lift a student up the list.
const RANKING = [
  { who: "Student A", past: "0 past missions", score: 0.84, why: "Skills match · fewer past chances" },
  { who: "Student B", past: "2 past missions", score: 0.66, why: "Skills match" },
  { who: "Student C", past: "7 past missions", score: 0.42, why: "Many past chances" },
];

const TAGLINE = [{ text: "Show up." }, { text: "the organizer approves", small: true }, { text: "Get watered." }, { text: "exactly once", small: true }];
// #endregion

// Scoped by the vt- prefix.
const CSS =
  ".vt-stage{container-type:size;container-name:vt}" +
  ".vt-char{display:inline-block;animation:vt-in 1.3s cubic-bezier(.2,.8,.2,1) both}" +
  "@keyframes vt-in{from{opacity:0;transform:translateY(0.35em) rotate(4deg);filter:blur(10px)}to{opacity:1;transform:none;filter:blur(0)}}" +
  ".vt-hl{transition:color .25s,background-color .25s;border-radius:4px}" +
  ".vt-field{transition:transform .3s cubic-bezier(.2,.8,.2,1),color .25s;cursor:default}" +
  ".vt-field:hover{transform:translateX(-0.3em);color:var(--vt-leaf)}" +
  ".vt-nav button{display:flex;align-items:center;gap:10px;justify-content:flex-end;background:none;border:0;padding:5px 0;cursor:pointer;color:inherit;font:inherit}" +
  ".vt-nav .vt-tick{display:block;height:1px;width:14px;background:currentColor;opacity:.45;transition:width .4s cubic-bezier(.2,.8,.2,1),opacity .3s,background-color .3s}" +
  ".vt-nav .vt-lab{opacity:0;transform:translateX(6px);transition:opacity .3s,transform .3s}" +
  ".vt-nav button:hover .vt-lab,.vt-nav button:focus-visible .vt-lab{opacity:1;transform:none}" +
  ".vt-nav button[aria-current=step] .vt-tick{width:34px;opacity:1;background:var(--vt-leaf)}" +
  ".vt-ring{stroke-dasharray:1;stroke-dashoffset:calc(1 - var(--v, 0))}" +
  ".vt-tall{display:none}" +
  "@container vt (orientation: portrait){.vt-tall{display:block}.vt-cover-top{display:none!important}" +
  ".vt-bloom{left:7cqw!important;top:auto!important;bottom:13cqh}" +
  ".vt-fin{flex-direction:column!important;gap:4cqh!important;top:44cqh!important}" +
  ".vt-spec{grid-template-columns:1fr!important;top:30cqh!important}.vt-spec-mid{display:none!important}.vt-spec-src{display:none!important}" +
  ".vt-rank{top:13cqh!important}}" +
  "@container vt (max-width: 720px){.vt-hide-sm{display:none!important}}" +
  "@container vt (max-width: 1020px){.vt-hide-md{display:none!important}}" +
  "@media (prefers-reduced-motion: reduce){.vt-char{animation:none}.vt-field{transition:none}}";

type Fx = "rise" | "clip" | "line" | "fade" | "draw";

/** Everything that belongs to one frame registers itself through this. */
const sc = (scene: number, fx: Fx = "rise", delay = 0) => ({ "data-sc": scene, "data-fx": fx, "data-d": delay });

const NAME = "Voluntree";
// The cover word's first and last letters flank the crown in frame 1.
const FIRST = 0;
const LAST = NAME.length - 1;

export function GrowingTree() {
  const rootRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wordRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [hover, setHover] = useState<string | null>(null);

  const letters = Array.from(NAME);

  useEffect(() => {
    const root = rootRef.current;
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    const word = wordRef.current;
    if (!root || !stage || !canvas || !word) return;
    const reducedMq = window.matchMedia("(prefers-reduced-motion: reduce)");

    const { curves, leafFrom, heart, radius, rise } = buildPalm(11);
    const mesh = buildMesh(curves, leafFrom);

    // ---- GL ------------------------------------------------------------------
    let gl: WebGLRenderingContext | null = null;
    let prog: WebGLProgram | null = null;
    let vbo: WebGLBuffer | null = null;
    let ibo: WebGLBuffer | null = null;
    const loc: Record<string, WebGLUniformLocation | null> = {};

    const initGL = () => {
      gl = canvas.getContext("webgl", { alpha: true, antialias: true, premultipliedAlpha: true });
      if (!gl) return false;
      const g = gl;
      const compile = (type: number, src: string) => {
        const sh = g.createShader(type)!;
        g.shaderSource(sh, src);
        g.compileShader(sh);
        return g.getShaderParameter(sh, g.COMPILE_STATUS) ? sh : null;
      };
      const vs = compile(g.VERTEX_SHADER, VERT);
      const fs = compile(g.FRAGMENT_SHADER, FRAG);
      if (!vs || !fs) return false;
      const p = g.createProgram()!;
      g.attachShader(p, vs);
      g.attachShader(p, fs);
      g.linkProgram(p);
      g.deleteShader(vs);
      g.deleteShader(fs);
      if (!g.getProgramParameter(p, g.LINK_STATUS)) return false;
      prog = p;
      g.useProgram(p);
      vbo = g.createBuffer();
      g.bindBuffer(g.ARRAY_BUFFER, vbo);
      g.bufferData(g.ARRAY_BUFFER, mesh.data, g.STATIC_DRAW);
      ibo = g.createBuffer();
      g.bindBuffer(g.ELEMENT_ARRAY_BUFFER, ibo);
      g.bufferData(g.ELEMENT_ARRAY_BUFFER, mesh.index, g.STATIC_DRAW);
      const attr = (n: string, size: number, off: number) => {
        const a = g.getAttribLocation(p, n);
        if (a < 0) return;
        g.enableVertexAttribArray(a);
        g.vertexAttribPointer(a, size, g.FLOAT, false, STRIDE * 4, off * 4);
      };
      attr("a_pos", 3, 0);
      attr("a_nrm", 3, 3);
      attr("a_aux", 4, 6);
      attr("a_base", 3, 10);
      for (const n of ["u_vp", "u_model", "u_offset", "u_time", "u_grow", "u_sway", "u_rise", "u_eye", "u_col", "u_hot"])
        loc[n] = g.getUniformLocation(p, n);
      g.enable(g.DEPTH_TEST);
      g.clearColor(0, 0, 0, 0);
      return true;
    };
    if (!initGL()) gl = null;
    const onLost = (e: Event) => {
      e.preventDefault();
      gl = null;
    };
    const onRestored = () => {
      if (!initGL()) gl = null;
    };
    canvas.addEventListener("webglcontextlost", onLost);
    canvas.addEventListener("webglcontextrestored", onRestored);

    // ---- measuring ---------------------------------------------------------------
    let W = 1;
    let H = 1;
    const chars = Array.from(word.querySelectorAll<HTMLElement>("[data-ch]"));
    let nat: { x: number; y: number; w: number }[] = [];
    const measure = () => {
      const sr = stage.getBoundingClientRect();
      W = Math.max(1, sr.width);
      H = Math.max(1, sr.height);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const cw = Math.round(W * dpr);
      const ch = Math.round(H * dpr);
      if (canvas.width !== cw || canvas.height !== ch) {
        canvas.width = cw;
        canvas.height = ch;
      }
      const saved = chars.map((c) => c.style.transform);
      chars.forEach((c) => (c.style.transform = "none"));
      nat = chars.map((c) => {
        const r = c.getBoundingClientRect();
        return { x: r.left + r.width / 2 - sr.left, y: r.top + r.height / 2 - sr.top, w: r.width };
      });
      chars.forEach((c, i) => (c.style.transform = saved[i]));
    };
    const ro = new ResizeObserver(measure);
    ro.observe(stage);
    measure();
    const fonts = document.fonts;
    const onFonts = () => measure();
    fonts?.addEventListener?.("loadingdone", onFonts);
    fonts?.ready.then(onFonts);

    // ---- frame elements ------------------------------------------------------------
    const items = Array.from(stage.querySelectorAll<HTMLElement>("[data-sc]")).map((el) => ({
      el, scene: Number(el.dataset.sc), fx: el.dataset.fx as Fx, delay: Number(el.dataset.d) || 0, last: -1,
    }));

    // ---- input: pointer tilt, and drag to spin --------------------------------------
    const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
    let spin = 0;
    let spinVel = 0;
    let drag: { id: number; x: number } | null = null;
    const onMove = (e: PointerEvent) => {
      const r = stage.getBoundingClientRect();
      pointer.tx = ((e.clientX - r.left) / r.width) * 2 - 1;
      pointer.ty = ((e.clientY - r.top) / r.height) * 2 - 1;
      if (drag && drag.id === e.pointerId) {
        spinVel += (e.clientX - drag.x) * 0.0022;
        drag.x = e.clientX;
      }
    };
    const onDown = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      if ((e.target as HTMLElement).closest("a,button,[data-k]")) return;
      drag = { id: e.pointerId, x: e.clientX };
      stage.style.cursor = "grabbing";
    };
    const onUp = () => {
      drag = null;
      stage.style.cursor = "";
    };
    stage.addEventListener("pointermove", onMove);
    stage.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);

    const leaf = hexToLinear(LEAF_CHROME);
    const wood = hexToLinear(WOOD_CHROME);
    const stone = hexToLinear(PLINTH_CHROME);

    // ---- loop ----------------------------------------------------------------------
    let raf = 0;
    let running = false;
    let visible = true;
    let last = performance.now();
    const born = last;
    let time = 0;
    let prog01 = -1;
    let shownScene = -1;

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const reduced = reducedMq.matches;
      const moving = !reduced;
      if (moving) time += dt;

      const r = root.getBoundingClientRect();
      const p = progressFrom(r.top, r.height, H);
      prog01 = prog01 < 0 || reduced ? p : prog01 + (p - prog01) * (1 - Math.exp(-dt * 9));
      const coord = sceneCoord(prog01, SCENES, HOLD);
      const scene = Math.round(coord);
      if (scene !== shownScene) {
        shownScene = scene;
        setActive(scene);
      }

      // camera
      const tall = H > W * 1.05;
      const k = keyAt(coord, tall);
      pointer.x += (pointer.tx - pointer.x) * (1 - Math.exp(-dt * 4));
      pointer.y += (pointer.ty - pointer.y) * (1 - Math.exp(-dt * 4));
      if (moving) {
        spin += spinVel + dt * 0.1;
        spinVel *= Math.exp(-dt * 3);
      } else {
        spin += spinVel;
        spinVel = 0;
      }
      const px = moving ? pointer.x : 0;
      const py = moving ? pointer.y : 0;
      // The tree grows with the scroll itself, not with the frames, so it never pauses:
      // a leafy sapling on the cover, branches through the middle, a full crown at the end.
      // On load it sprouts from nothing up to wherever the scroll already is.
      const intro = reduced ? 1 : easeInOut(clamp01((now - born) / 1800));
      const grow = (SPROUT + (1 - SPROUT) * prog01) * intro;
      // The camera frames what has grown so far: close on the sapling, pulling back and
      // rising as the crown fills out, so the tree always fills the frame.
      const f = smoothstep(SPROUT, 0.85, grow);
      const target: V3 = [heart[0] * f, SEEDLING_Y + (heart[1] - SEEDLING_Y) * f, heart[2] * f];
      const reach = radius * (0.62 + 0.38 * f);
      const fov = (30 * Math.PI) / 180;
      const minDim = Math.min(W, H);
      const dist = (reach * H) / (k.size * minDim * Math.tan(fov / 2));
      const el = Math.max(-88, Math.min(88, k.el + py * 9)) * (Math.PI / 180);
      const eye: V3 = [target[0], target[1] + Math.sin(el) * dist, target[2] + Math.cos(el) * dist];
      const proj = perspective(fov, W / H, Math.max(0.05, dist - 6), dist + 8);
      const vp = multiply(proj, lookAt(eye, target));
      // the tree turns about its own trunk, not about the crown's centre
      const model = multiply(rotY(k.spin + spin + px * 0.35), rotX(py * 0.05));

      if (gl && prog) {
        const g = gl;
        g.viewport(0, 0, canvas.width, canvas.height);
        g.clear(g.COLOR_BUFFER_BIT | g.DEPTH_BUFFER_BIT);
        g.uniformMatrix4fv(loc.u_vp, false, vp);
        g.uniformMatrix4fv(loc.u_model, false, model);
        g.uniform2f(loc.u_offset, k.ox, k.oy);
        g.uniform1f(loc.u_time, time);
        g.uniform1f(loc.u_grow, grow);
        g.uniform1f(loc.u_sway, moving ? 1 : 0);
        g.uniform3f(loc.u_rise, rise[0], rise[1], rise[2]);
        g.uniform3f(loc.u_eye, eye[0], eye[1], eye[2]);
        // plinth, wood, then leaves: same mesh, three ranges, three chrome tints
        g.uniform3f(loc.u_col, stone[0] * 2.2, stone[1] * 2.2, stone[2] * 2.2);
        g.uniform3f(loc.u_hot, 1, 1, 0.95);
        g.drawElements(g.TRIANGLES, mesh.woodIndex, g.UNSIGNED_SHORT, 0);
        g.uniform3f(loc.u_col, wood[0] * 2.2, wood[1] * 2.2, wood[2] * 2.2);
        g.uniform3f(loc.u_hot, 1, 0.8, 0.6);
        g.drawElements(g.TRIANGLES, mesh.leafIndex - mesh.woodIndex, g.UNSIGNED_SHORT, mesh.woodIndex * 2);
        g.uniform3f(loc.u_col, leaf[0] * 2.2, leaf[1] * 2.2, leaf[2] * 2.2);
        g.uniform3f(loc.u_hot, 0.85, 1, 0.7);
        g.drawElements(g.TRIANGLES, mesh.index.length - mesh.leafIndex, g.UNSIGNED_SHORT, mesh.leafIndex * 2);
      }

      // ---- the type ---------------------------------------------------------------
      const still = reduced;
      for (const it of items) {
        const v = reveal(coord, it.scene, it.delay);
        const q = Math.round(v * 500) / 500;
        if (q === it.last) continue;
        it.last = q;
        const s = it.el.style;
        const dir = coord < it.scene ? 1 : -1;
        s.visibility = q <= 0 ? "hidden" : "";
        if (it.fx === "draw") {
          s.setProperty("--v", String(q));
          s.opacity = String(Math.min(1, q * 3));
          continue;
        }
        if (it.fx === "line") {
          s.transform = "scaleX(" + q + ")";
          s.opacity = String(Math.min(1, q * 2));
          continue;
        }
        s.opacity = String(q);
        if (still || it.fx === "fade") continue;
        if (it.fx === "clip") {
          const hid = ((1 - q) * 100).toFixed(1);
          s.clipPath = dir > 0 ? "inset(0 0 " + hid + "% 0)" : "inset(" + hid + "% 0 0 0)";
          s.transform = "translateY(" + ((1 - q) * 0.4 * dir).toFixed(3) + "em)";
        } else {
          s.transform = "translateY(" + ((1 - q) * 34 * dir).toFixed(1) + "px)";
          s.filter = q > 0.995 ? "" : "blur(" + ((1 - q) * 8).toFixed(1) + "px)";
        }
      }

      // The cover word morphs into the crown: its first and last letters slide out to flank
      // the tree seen from above, the rest fall into it.
      const m = easeInOut(clamp01(coord));
      const out = clamp01(coord - 1);
      const r1 = keyAt(1, tall).size * minDim * 0.5;
      const cy1 = (0.5 - keyAt(1, tall).oy / 2) * H;
      chars.forEach((c, i) => {
        const n0 = nat[i];
        if (!n0) return;
        if (i === FIRST || i === LAST) {
          const side = i === FIRST ? -1 : 1;
          const tx = W / 2 + side * (r1 + n0.w * 0.55 + minDim * 0.02);
          const dx = (tx - n0.x) * m;
          const dy = (cy1 - n0.y) * m - out * 60;
          const o = coord < 1 ? 1 : 1 - smoothstep(0.1, 0.45, out);
          c.style.transform = "translate(" + dx.toFixed(1) + "px," + dy.toFixed(1) + "px)";
          c.style.opacity = String(o);
          c.style.filter = still || out < 0.05 ? "" : "blur(" + (out * 14).toFixed(1) + "px)";
        } else {
          const dx = (W / 2 - n0.x) * m * 0.75;
          const dy = (cy1 - n0.y) * m;
          const o = 1 - smoothstep(0.0, 0.4, m);
          c.style.transform = still
            ? ""
            : "translate(" + dx.toFixed(1) + "px," + dy.toFixed(1) + "px) scale(" + (1 - m * 0.7).toFixed(3) + ")";
          c.style.opacity = String(o);
          c.style.filter = still || m < 0.02 ? "" : "blur(" + (m * 12).toFixed(1) + "px)";
        }
        c.style.visibility = coord > 1.6 ? "hidden" : "";
      });
    };

    const start = () => {
      if (running || !visible || document.hidden) return;
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible) start();
      else stop();
    });
    io.observe(root);
    const onVis = () => (document.hidden ? stop() : start());
    document.addEventListener("visibilitychange", onVis);
    start();

    return () => {
      stop();
      io.disconnect();
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      fonts?.removeEventListener?.("loadingdone", onFonts);
      stage.removeEventListener("pointermove", onMove);
      stage.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("webglcontextlost", onLost);
      canvas.removeEventListener("webglcontextrestored", onRestored);
      const g = gl as WebGLRenderingContext | null;
      if (g) {
        g.deleteBuffer(vbo);
        g.deleteBuffer(ibo);
        g.deleteProgram(prog);
      }
    };
  }, []);

  const jump = (i: number) => {
    const root = rootRef.current;
    const stage = stageRef.current;
    if (!root || !stage) return;
    const r = root.getBoundingClientRect();
    const travel = r.height - stage.clientHeight;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollBy({ top: (i / (SCENES - 1)) * travel + r.top, behavior: reduced ? "auto" : "smooth" });
  };

  const display: CSSProperties = { fontFamily: DISPLAY, fontWeight: 400 };
  const hidden: CSSProperties = { opacity: 0 };
  const small: CSSProperties = { fontSize: 9, letterSpacing: "0.25em", textTransform: "uppercase" };

  return (
    <section ref={rootRef} className="relative w-full" style={{ height: "calc(100svh * " + (1 + (SCENES - 1) * 1.2).toFixed(3) + ")", background: INK }}
      aria-label="How Voluntree works">
      <style>{CSS}</style>
      <div ref={stageRef} className="vt-stage sticky top-0 w-full select-none overflow-hidden"
        style={{ height: "100svh", color: BONE, background: INK, ["--vt-leaf" as string]: LEAF } as CSSProperties}>
        {/* a faint green bleed at the edges */}
        <div aria-hidden className="pointer-events-none absolute inset-0"
          style={{ background: "radial-gradient(120% 90% at 50% 45%, transparent 55%, " + LEAF + "14 100%)" }} />
        <canvas ref={canvasRef} aria-hidden className="absolute inset-0 block" style={{ width: "100%", height: "100%", maxWidth: "none" }} />

        {/* always on top: brand and sign in */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-center justify-between" style={{ padding: "3cqh 5cqw" }}>
          <Link href="/" className="pointer-events-auto flex items-center gap-2 text-lg font-semibold tracking-tight">
            {/* The hero is always dark, so the original cream-rooted logo shows here (DEC-062). */}
            <Image src="/brand/logo-on-dark.png" alt="" width={36} height={36} priority />
            Voluntree
          </Link>
          <Link href="/sign-in" className="pointer-events-auto rounded-full border px-4 py-2 text-sm font-medium transition-colors hover:bg-[#d8d5c0] hover:text-[#0d0f0c]"
            style={{ borderColor: BONE + "80" }}>
            Sign in
          </Link>
        </div>

        {/* ================================ 0 · cover ================================ */}
        <div className="pointer-events-none absolute inset-0">
          <div className="vt-cover-top absolute flex items-start justify-between gap-6" style={{ left: "5cqw", right: "5cqw", top: "13cqh" }}>
            <div {...sc(0, "clip", 0)} style={{ ...display, ...hidden, fontSize: "clamp(20px, 3.3cqw, 46px)", lineHeight: 0.88, letterSpacing: "0.02em", textTransform: "uppercase" }}>
              Fair
              <br />
              Volunteering
            </div>
            <p {...sc(0, "rise", 0.2)} className="vt-hide-md" style={{ ...display, ...hidden, maxWidth: "25cqw", fontSize: "clamp(11px, 1cqw, 14px)", lineHeight: 1.4, margin: 0, textAlign: "justify" }}>
              Voluntree fills AIU event volunteer spots fairly. AI drafts missions from announcements, matching explains every
              recommendation and lifts students who have had fewer chances, and every approved attendance waters a tree that
              only you can see.
            </p>
            <ul {...sc(0, "rise", 0.35)} className="vt-hide-md" style={{ ...display, ...hidden, listStyle: "none", margin: 0, padding: 0, fontSize: "clamp(11px, 1cqw, 14px)", lineHeight: 1.4 }}>
              {SPECS.map((s) => <li key={s}>{s}</li>)}
            </ul>
            <div {...sc(0, "clip", 0.5)} className="vt-hide-sm" style={{ ...display, ...hidden, fontSize: "clamp(18px, 2.6cqw, 38px)", lineHeight: 0.9, textAlign: "right", textTransform: "uppercase" }}>
              Show up
              <br />
              Grow
              <br />
              <span style={{ color: LEAF }}>Something</span>
            </div>
          </div>

          <div ref={wordRef} className="absolute whitespace-nowrap"
            style={{ ...display, left: "50%", top: "64%", transform: "translate(-50%, -50%)", fontSize: "min(17cqw, 30cqh)", lineHeight: 1, letterSpacing: "-0.03em" }}>
            <span {...sc(0, "rise", 0.6)} style={{ ...hidden, position: "absolute", right: "0.04em", bottom: "88%", fontSize: "0.22em", fontStyle: "italic", color: LEAF }}>
              at AIU
            </span>
            <h1 style={{ margin: 0, font: "inherit" }} aria-label="Voluntree: show up, grow something">
              {letters.map((c, i) => (
                <span key={i} data-ch className="inline-block" style={{ willChange: "transform" }} aria-hidden>
                  <span className="vt-char" style={{ animationDelay: 0.15 + i * 0.07 + "s" }}>{c}</span>
                </span>
              ))}
            </h1>
          </div>

          {/* phones only: the top row is hidden, so the tagline sits under the word instead */}
          <div className="vt-tall absolute text-center" style={{ left: "6cqw", right: "6cqw", top: "73cqh" }}>
            <div {...sc(0, "clip", 0.4)} style={{ ...display, ...hidden, fontSize: "6.4cqw", lineHeight: 1.05, whiteSpace: "nowrap" }}>
              Show up. <span style={{ fontStyle: "italic", color: LEAF }}>Grow something.</span>
            </div>
            <p {...sc(0, "rise", 0.5)} style={{ ...hidden, margin: "1.6cqh auto 0", maxWidth: "80cqw", fontSize: 14, lineHeight: 1.45, opacity: 0 }}>
              Fair volunteering at AIU. Every approved attendance waters a tree only you can see.
            </p>
          </div>

          <div className="absolute flex items-end justify-between gap-6" style={{ left: "5cqw", right: "5cqw", bottom: "5cqh" }}>
            <div {...sc(0, "rise", 0.3)} className="pointer-events-auto flex flex-wrap items-center gap-3" style={hidden}>
              <Link href="/sign-in" className="rounded-full px-6 py-3 text-sm font-semibold transition hover:-translate-y-0.5" style={{ background: LEAF, color: INK }}>
                Start growing →
              </Link>
              <a href="#try" className="rounded-full border px-6 py-3 text-sm font-medium transition hover:-translate-y-0.5" style={{ borderColor: BONE + "80" }}>
                Try it live
              </a>
              <span className="vt-hide-sm" style={{ ...small, fontSize: 9, borderBottom: "1px solid " + BONE + "80", paddingBottom: 6, paddingRight: "5cqw", marginLeft: 12, lineHeight: 1.3 }}>
                Scroll to
                <br />
                grow it
              </span>
            </div>
            <div {...sc(0, "rise", 0.5)} className="vt-hide-sm flex gap-5" style={{ ...hidden, color: LEAF, fontSize: 9, lineHeight: 1.3, letterSpacing: "0.06em", textTransform: "uppercase" }}>
              <span>Fair<br />by design</span>
              <span>Private<br />by default</span>
              <span>AI drafts<br />people decide</span>
              <span>2026<br />Prototype</span>
            </div>
          </div>
        </div>

        {/* ================================ 1 · crown ================================ */}
        <div className="pointer-events-none absolute inset-0">
          <div {...sc(1, "fade", 0.5)} className="absolute text-center" style={{ ...display, ...hidden, left: "50%", top: "50%", transform: "translate(-50%,-50%)", fontSize: "clamp(11px, 1.2cqw, 15px)", color: INK, background: BONE, padding: "4px 10px", borderRadius: 999 }}>
            your tree
          </div>
          <div {...sc(1, "rise", 0.7)} className="absolute" style={{ ...small, ...hidden, left: "5cqw", bottom: "5cqh" }}>
            <span style={{ color: LEAF }}>01</span> — The crown, from above
          </div>
          <div {...sc(1, "rise", 0.8)} className="absolute vt-hide-sm text-right" style={{ ...display, ...hidden, right: "5cqw", bottom: "5cqh", fontSize: "clamp(14px, 1.5cqw, 20px)", maxWidth: "28cqw", lineHeight: 1.25 }}>
            Every leaf is a mission
            <br />
            someone showed up for.
          </div>
        </div>

        {/* ============================== 2 · missions ============================== */}
        <div className="pointer-events-none absolute inset-0" style={display}>
          <div className="vt-spec pointer-events-auto absolute grid items-center"
            style={{ left: "6cqw", right: "6cqw", top: "14cqh", bottom: "20cqh", gridTemplateColumns: "1fr min(28cqw, 32cqh) 1fr", columnGap: "3cqw" }}
            onPointerLeave={() => setHover(null)}>
            <div className="vt-spec-src relative">
              <div {...sc(2, "rise", 0)} style={{ ...small, ...hidden, color: LEAF, marginBottom: "2.4cqh" }}>The announcement</div>
              <p {...sc(2, "clip", 0.1)} style={{ ...hidden, margin: 0, fontSize: "min(2.5cqw, 3.6cqh)", lineHeight: 1.22 }}>
                {ANNOUNCEMENT.map(([t, k], i) => (
                  <span key={i} className="vt-hl" style={k && hover === k ? { color: INK, background: LEAF } : k ? { borderBottom: "1px dashed " + BONE + "55" } : undefined}>
                    {t}
                  </span>
                ))}
              </p>
            </div>
            <div className="vt-spec-mid relative h-full text-center">
              <div {...sc(2, "rise", 0.35)} className="absolute w-full" style={{ ...hidden, top: "52%", fontSize: "min(3.4cqw, 4.6cqh)", lineHeight: 1 }}>
                AI drafts.
                <div style={{ fontStyle: "italic", color: LEAF }}>You publish.</div>
              </div>
              <div {...sc(2, "rise", 0.45)} className="absolute w-full" style={{ ...small, ...hidden, top: "74%", opacity: 0, fontSize: 8 }}>
                {hover ? "Matched in the announcement" : "Hover a field"}
              </div>
            </div>
            <div className="relative text-right">
              <div {...sc(2, "rise", 0.1)} style={{ ...small, ...hidden, color: LEAF, marginBottom: "2.4cqh" }}>The drafted mission</div>
              {DRAFT.map((f, i) => (
                <div key={f.label} {...sc(2, "clip", 0.15 + i * 0.07)} style={hidden}>
                  <div data-k={f.k} className="vt-field flex items-baseline justify-end gap-4" onPointerEnter={() => setHover(f.k ?? null)}
                    style={{ borderBottom: "1px solid " + BONE + "26", padding: "0.9cqh 0" }}>
                    <span style={{ ...small, fontSize: 8, opacity: 0.6 }}>{f.label}</span>
                    <span style={{ fontSize: "min(2.6cqw, 3.4cqh)", lineHeight: 1.1, color: f.k ? undefined : LEAF, fontStyle: f.k ? undefined : "italic" }}>{f.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div {...sc(2, "line", 0.5)} className="absolute origin-left" style={{ ...hidden, left: "6cqw", right: "6cqw", bottom: "15.5cqh", height: 1, background: BONE + "40" }} />
          <div className="absolute flex items-start justify-between gap-6" style={{ left: "6cqw", right: "6cqw", bottom: "6cqh" }}>
            <div {...sc(2, "rise", 0.55)} style={{ ...small, ...hidden }}><span style={{ color: LEAF }}>02</span> — Missions</div>
            <div {...sc(2, "rise", 0.65)} className="vt-hide-sm text-right" style={{ ...hidden, fontSize: "clamp(13px, 1.3cqw, 18px)", maxWidth: "40cqw", lineHeight: 1.3 }}>
              The organizer checks every field, and blanks are flagged. Nothing is published on its own.
            </div>
          </div>
        </div>

        {/* ============================== 3 · matching ============================== */}
        <div className="pointer-events-none absolute inset-0" style={display}>
          <div className="vt-rank absolute" style={{ left: "50%", top: "11cqh", transform: "translateX(-50%)", width: "min(88cqw, 980px)" }}>
            <div {...sc(3, "clip", 0)} className="text-center" style={{ ...hidden, fontSize: "min(6.4cqw, 9cqh)", lineHeight: 0.95, letterSpacing: "-0.03em" }}>
              Fair matching, <span style={{ fontStyle: "italic", color: LEAF }}>with reasons.</span>
            </div>
            <div style={{ marginTop: "4cqh" }}>
              {RANKING.map((s, i) => (
                <div key={s.who} {...sc(3, "rise", 0.2 + i * 0.1)} className="grid items-center gap-4"
                  style={{ ...hidden, gridTemplateColumns: "minmax(0,1.5fr) minmax(0,1.6fr) minmax(0,1.3fr)", borderBottom: "1px solid " + BONE + "26", padding: "1.4cqh 0" }}>
                  <span style={{ fontSize: "min(2.4cqw, 3.4cqh)" }}>
                    {s.who} <span className="vt-hide-sm" style={{ ...small, fontSize: 8, opacity: 0.6, marginLeft: 8, whiteSpace: "nowrap" }}>{s.past}</span>
                  </span>
                  <span className="relative block h-[3px]" style={{ background: BONE + "1f" }}>
                    <span {...sc(3, "line", 0.3 + i * 0.1)} className="absolute inset-y-0 left-0 block origin-left" style={{ ...hidden, width: s.score * 100 + "%", background: LEAF }} />
                  </span>
                  <span className="text-right" style={{ ...small, fontSize: 8, color: i === 0 ? LEAF : undefined }}>{s.why}</span>
                </div>
              ))}
            </div>
          </div>
          <div {...sc(3, "rise", 0.7)} className="absolute" style={{ ...small, ...hidden, left: "5cqw", bottom: "5cqh" }}>
            <span style={{ color: LEAF }}>03</span> — Matching · example
          </div>
          <div {...sc(3, "rise", 0.8)} className="absolute vt-hide-sm text-right" style={{ ...hidden, right: "5cqw", bottom: "5cqh", fontSize: "clamp(13px, 1.3cqw, 18px)", maxWidth: "30cqw", lineHeight: 1.3 }}>
            Every recommendation says why. The same few names don&apos;t take every spot.
          </div>
        </div>

        {/* ============================== 4 · watering ============================== */}
        <div className="pointer-events-none absolute inset-0" style={display}>
          <div className="vt-bloom absolute" style={{ left: "6cqw", top: "50%", transform: "translateY(-50%)" }}>
            {TAGLINE.map((t, i) => (
              <div key={t.text} {...sc(4, "clip", i * 0.12)}
                style={{ ...hidden, fontSize: t.small ? "min(2.6cqw, 3.6cqh)" : "min(10cqw, 15cqh)", lineHeight: t.small ? 1.4 : 0.9, letterSpacing: t.small ? undefined : "-0.035em",
                  marginLeft: t.small ? "0.4em" : undefined, fontStyle: t.small ? "italic" : undefined, color: t.small ? LEAF : undefined }}>
                {t.text}
              </div>
            ))}
          </div>
          <div {...sc(4, "rise", 0.6)} className="absolute" style={{ ...small, ...hidden, left: "6cqw", bottom: "5cqh" }}>
            <span style={{ color: LEAF }}>04</span> — Watering · a new stage every 3
          </div>
        </div>

        {/* ================================ 5 · grow ================================ */}
        <div className="pointer-events-none absolute inset-0" style={display}>
          <div className="vt-fin absolute flex items-center justify-center" style={{ left: 0, right: 0, top: "48cqh", gap: "4cqw" }}>
            <div {...sc(5, "clip", 0)} className="relative" style={{ ...hidden, fontSize: "min(11cqw, 17cqh)", lineHeight: 1, letterSpacing: "-0.035em" }}>
              {"Grow·some·thing".split("·").map((part, i, all) => (
                <span key={i}>
                  {part}
                  {i < all.length - 1 && <span style={{ color: LEAF }}>·</span>}
                </span>
              ))}
              <svg {...sc(5, "draw", 0.3)} aria-hidden viewBox="0 0 100 40" preserveAspectRatio="none" className="absolute"
                style={{ ...hidden, left: "-4%", top: "-8%", width: "38%", height: "120%", overflow: "visible" }}>
                <ellipse className="vt-ring" cx="50" cy="20" rx="48" ry="18" pathLength={1} fill="none" stroke={LEAF} strokeWidth="0.8" vectorEffect="non-scaling-stroke" />
              </svg>
            </div>
          </div>
          <div {...sc(5, "rise", 0.4)} className="absolute mx-auto text-center" style={{ ...hidden, left: 0, right: 0, top: "70cqh", width: "min(90cqw, 560px)", fontSize: "clamp(14px, 1.4cqw, 19px)", lineHeight: 1.35 }}>
            Every approval comes with a certificate. Your tree is private: only you can see it.
          </div>
          <div {...sc(5, "rise", 0.55)} className="pointer-events-auto absolute flex justify-between gap-4"
            style={{ ...small, ...hidden, left: "5cqw", right: "5cqw", bottom: "5cqh", borderTop: "1px solid " + BONE + "40", paddingTop: "2cqh" }}>
            <Link href="/sign-in" className="transition-colors hover:text-[#8dbb6e]">Start growing →</Link>
            <a href="#try" className="transition-colors hover:text-[#8dbb6e]">Try it live ↓</a>
          </div>
        </div>

        {/* frame nav */}
        <nav className="vt-nav absolute z-10 hidden flex-col items-end sm:flex" style={{ right: "2.2cqw", top: "50%", transform: "translateY(-50%)", fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase" }}
          aria-label="Story frames">
          {NAV.map((label, i) => (
            <button key={label} type="button" onClick={() => jump(i)} aria-current={active === i ? "step" : undefined}>
              <span className="vt-lab">{label}</span>
              <span className="vt-tick" />
            </button>
          ))}
        </nav>
      </div>
    </section>
  );
}
