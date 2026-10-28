// Screen 7: my tree (FR-027). Visible only to this student (BR-13): the ledger policy allows nobody else.

import Image from "next/image";
import { LockSimple } from "@phosphor-icons/react/ssr";
import { stageName } from "@/components/gauge";
import { createClient } from "@/lib/db/server";
import { requireRole } from "@/lib/db/session";
import { loadWaterings } from "@/lib/db/student";
import { getTreeStage, TREE_STAGES, WATERINGS_PER_STAGE } from "@/lib/tree/tree";

const SHORT = ["Seed", "Sprout", "Sapling", "Young", "Full"];

export default async function MyTree() {
  const me = await requireRole("student");
  const supabase = await createClient();
  const waterings = await loadWaterings(supabase, me.id);
  const tree = getTreeStage(waterings);
  const current = TREE_STAGES.indexOf(tree.stage);
  const next = SHORT[current + 1];

  return (
    <>
      <h1 className="text-center font-semibold">My tree</h1>
      <div className="relative mt-5 aspect-square w-full rounded-[28px] bg-card">
        <Image src={tree.imagePath} alt={stageName(waterings)} fill priority className="object-contain p-10" />
      </div>

      <h2 className="mt-6 text-center text-3xl font-semibold tracking-[-0.03em]">{stageName(waterings)}</h2>
      <p className="mt-1 text-center text-muted">
        {waterings} {waterings === 1 ? "watering" : "waterings"}
        {tree.wateringsToNextStage !== null ? ` · ${tree.wateringsToNextStage} more to ${next}` : " · fully grown"}
      </p>

      <ol className="mt-6 grid grid-cols-5 text-center text-sm">
        {SHORT.map((name, i) => (
          <li key={name} className="flex flex-col items-center gap-1.5">
            <span className={`size-3.5 rounded-full ${i <= current ? "bg-primary" : "bg-gauge-empty"}`} aria-hidden />
            <span className={i === current ? "font-semibold" : "text-muted"}>{name}</span>
            <span className="text-xs text-muted">{i * WATERINGS_PER_STAGE}</span>
          </li>
        ))}
      </ol>

      <p className="mt-6 flex items-center justify-center gap-1.5 text-sm text-muted">
        <LockSimple size={16} aria-hidden /> Only you can see your tree
      </p>
    </>
  );
}
