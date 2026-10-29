// Checks the five date palm stage drawings in public/tree/ (FR-027, DEC-033, DEC-051).
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { TREE_STAGES, WATERINGS_PER_STAGE, getTreeStage } from "./tree";

/** The existing green and brown palette; no new colours. */
const PALETTE = ["#2E7D32", "#4CAF50", "#81C784", "#8D5A3B", "#A97B5B", "#795548", "#5D4037"];

/** The soil mound, identical in every stage. */
const SOIL =
  '  <ellipse cx="100" cy="182" rx="72" ry="12" fill="#795548"/>\n' +
  '  <ellipse cx="100" cy="176" rx="62" ry="6" fill="#5D4037"/>';

const MOTION_QUERY = "@media (prefers-reduced-motion: no-preference)";

// Each stage's file, found through the same path the screens use.
const stages = TREE_STAGES.map((stage, i) => {
  const { imagePath } = getTreeStage(i * WATERINGS_PER_STAGE);
  const svg = readFileSync(new URL(`../../../public${imagePath}`, import.meta.url), "utf8");
  return { stage, imagePath, svg };
});

describe("tree stage SVGs", () => {
  it("has one file per stage at the path getTreeStage returns, each with different art", () => {
    expect(stages.map((s) => s.imagePath)).toEqual([
      "/tree/seed.svg",
      "/tree/sprout.svg",
      "/tree/sapling.svg",
      "/tree/young-tree.svg",
      "/tree/full-tree.svg",
    ]);
    expect(new Set(stages.map((s) => s.svg)).size).toBe(5);
  });

  describe.each(stages)("$stage", ({ svg }) => {
    it("uses the 200 × 200 canvas with no background", () => {
      expect(svg.startsWith('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">')).toBe(true);
      expect(svg.trimEnd().endsWith("</svg>")).toBe(true);
      expect(svg).not.toMatch(/<rect/);
      expect(svg.slice(0, svg.indexOf(">"))).not.toMatch(/fill=|style=/);
    });

    it("contains no text, images, scripts or external references", () => {
      expect(svg).not.toMatch(/<text|<image|<script|<foreignObject|href=|url\(|@import/i);
    });

    it("stays flat: no gradients, filters, shadows or transparency effects (DEC-033)", () => {
      expect(svg).not.toMatch(/gradient|<filter|filter:|shadow|<mask|opacity/i);
    });

    it("uses only the existing green and brown palette", () => {
      const colours = new Set(svg.match(/#[0-9A-Fa-f]{6}\b/g) ?? []);
      for (const colour of colours) expect(PALETTE).toContain(colour.toUpperCase());
    });

    it("keeps the same stationary soil at the bottom", () => {
      expect(svg).toContain(SOIL);
      // The soil is outside every animated group, so it never moves.
      const beforeSoil = svg.slice(0, svg.indexOf(SOIL));
      expect(beforeSoil).not.toMatch(/<g/);
    });

    it("animates only inside @media (prefers-reduced-motion: no-preference)", () => {
      const style = svg.match(/<style>([\s\S]*?)<\/style>/)?.[1].trim() ?? "";
      expect(style.startsWith(MOTION_QUERY)).toBe(true);
      // The media block must be the whole stylesheet: its closing brace is the last character.
      let depth = 0;
      let closedAt = -1;
      for (let i = style.indexOf("{"); i < style.length; i++) {
        if (style[i] === "{") depth++;
        if (style[i] === "}" && --depth === 0) {
          closedAt = i;
          break;
        }
      }
      expect(closedAt).toBe(style.length - 1);
      expect(svg.match(/<style>/g)).toHaveLength(1);
      // No animation attributes outside the stylesheet (no SMIL), and only rotation is animated.
      expect(svg).not.toMatch(/<animate|<set /);
      expect(style).toMatch(/@keyframes sway \{ from \{ transform: rotate\(-[\d.]+deg\); \} to \{ transform: rotate\([\d.]+deg\); \} \}/);
    });

    it("keeps the sway gentle: at most 3 degrees and at least 4 seconds per swing", () => {
      const amplitude = Number(svg.match(/rotate\(-([\d.]+)deg\)/)?.[1]);
      expect(amplitude).toBeGreaterThan(0);
      expect(amplitude).toBeLessThanOrEqual(3);
      const durations = [...svg.matchAll(/(?:animation-duration: |sway )([\d.]+)s/g)].map((m) => Number(m[1]));
      expect(durations.length).toBeGreaterThan(0);
      for (const d of durations) expect(d).toBeGreaterThanOrEqual(4);
    });

    it("stays small", () => {
      expect(svg.length).toBeLessThan(12_000);
    });
  });

  it("gives the fronds of the bigger stages different timings", () => {
    for (const { stage, svg } of stages.filter((s) => ["sapling", "young-tree", "full-tree"].includes(s.stage))) {
      const timings = [...svg.matchAll(/\.s\d+ \{ animation-duration: ([\d.]+)s; animation-delay: (-?[\d.]+)s; \}/g)].map(
        (m) => `${m[1]}/${m[2]}`,
      );
      expect(timings.length, stage).toBeGreaterThanOrEqual(4);
      expect(new Set(timings).size, stage).toBe(timings.length);
    }
  });

  it("draws the stages the brief asks for", () => {
    const [seed, sprout, sapling, young, full] = stages.map((s) => s.svg);
    const animatedGroups = (svg: string) => (svg.match(/class="sway s\d+"/g) ?? []).length;
    expect(animatedGroups(seed)).toBe(1);
    expect(animatedGroups(sprout)).toBe(1); // a single spear leaf
    expect(animatedGroups(sapling)).toBe(4); // four fronds at ground level
    expect(sapling).not.toContain('fill="#8D5A3B"'); // no trunk
    expect(young).toContain('fill="#8D5A3B"'); // a short ringed trunk…
    expect(young).toContain('stroke="#A97B5B"'); // …with rings
    expect(animatedGroups(young)).toBe(5); // a small crown
    expect(full.match(/<ellipse cx="[\d.]+" cy="[\d.]+" rx="2.4" ry="3.2"/g)?.length).toBeGreaterThanOrEqual(20); // date clusters
    expect(animatedGroups(full)).toBe(11); // 8 fronds + 3 date clusters, each with its own timing
  });
});
