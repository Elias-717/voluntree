// A simple icon per mission, picked from words in its title. Missions have no icon field.

import { BookOpen, Broom, Drop, ForkKnife, HandHeart, Leaf, Sparkle } from "@phosphor-icons/react/ssr";

const RULES: [RegExp, typeof Sparkle, boolean][] = [
  [/welcome|arrival|orientation|desk/i, HandHeart, true],
  [/clean|tidy|sweep/i, Broom, false],
  [/flood|blood|red cross|aid/i, Drop, false],
  [/book|library|tutor/i, BookOpen, true],
  [/food|raya|serving|meal/i, ForkKnife, false],
  [/garden|tree|plant|recycl/i, Leaf, false],
];

export function MissionIcon({ title, size = "md" }: { title: string; size?: "md" | "lg" }) {
  const [, Icon, brown] = RULES.find(([re]) => re.test(title)) ?? [null, Sparkle, false];
  const box = size === "lg" ? "size-20" : "size-11";
  return (
    <span className={`grid ${box} shrink-0 place-items-center rounded-full ${brown ? "bg-brown-tint text-brown" : "bg-tint text-on-tint"}`}>
      <Icon size={size === "lg" ? 40 : 22} aria-hidden />
    </span>
  );
}
