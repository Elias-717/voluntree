// Screen 0: public landing page (DEC-026, DEC-038). Interesting rather than informative.

import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight, BookOpen, Certificate, Drop, ForkKnife, HandHeart, LockSimple, Scales, Sparkle,
} from "@phosphor-icons/react/ssr";
import { Logo, PrototypeNote } from "@/components/logo";
import { getMe, homeFor } from "@/lib/db/session";

// Illustrative examples for the landing strip (DEC-038, synthetic). The live missions are behind sign-in.
const EXAMPLES = [
  { title: "New Student Arrival Welcome", when: "Sun 1 Nov · Main Gate", spots: 8, Icon: HandHeart, brown: true },
  { title: "Building D Cleaning Help", when: "Sat 7 Nov · Building D", spots: 10, Icon: Sparkle, brown: false },
  { title: "Red Cross Kedah Flood Aid", when: "Sat 14 Nov · Alor Setar", spots: 20, Icon: Drop, brown: false },
  { title: "Alor Setar Library Renovation", when: "Sat 21 Nov · Alor Setar", spots: 12, Icon: BookOpen, brown: true },
  { title: "Hari Raya Food Serving", when: "Hari Raya · Dining Hall", spots: 15, Icon: ForkKnife, brown: false },
];

export default async function Landing() {
  const me = await getMe();
  if (me) redirect(homeFor(me.role));

  return (
    <div className="flex min-h-svh flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-5 sm:px-8">
        <Logo />
        <nav className="flex items-center gap-5 text-sm">
          <Link href="/sign-in#demo" className="hidden text-muted hover:text-text sm:inline">Try the demo</Link>
          <Link href="/sign-in" className="rounded-full border border-strong px-4 py-2 font-medium">Sign in</Link>
        </nav>
      </header>

      <main className="mx-auto grid w-full max-w-6xl flex-1 gap-10 px-4 pb-10 sm:px-8 md:grid-cols-2 md:items-center">
        <section>
          <p className="inline-flex items-center gap-1.5 rounded-full bg-tint px-3 py-1 text-xs font-medium text-on-tint">
            <Sparkle size={14} weight="fill" aria-hidden /> Volunteering at AIU, made fair
          </p>
          <h1 className="mt-5 text-5xl font-semibold leading-[1.02] tracking-[-0.035em] sm:text-6xl">
            Show up.
            <br />
            Grow something.
          </h1>
          <p className="mt-5 max-w-md text-lg text-muted">
            Join AIU events and causes, and watch your own tree grow, one watering at a time.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link href="/sign-in" className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3.5 font-medium text-on-primary">
              Start growing <ArrowRight size={18} aria-hidden />
            </Link>
            <Link href="/sign-in#demo" className="rounded-full border border-strong px-6 py-3.5 font-medium">
              Try the demo
            </Link>
          </div>
          <p className="mt-6 flex gap-5 text-sm text-muted">
            <span className="inline-flex items-center gap-1.5"><Scales size={16} aria-hidden /> Fair by design</span>
            <span className="inline-flex items-center gap-1.5"><LockSimple size={16} aria-hidden /> Private by default</span>
          </p>
        </section>

        <section aria-hidden className="relative mx-auto aspect-square w-full max-w-md">
          <div className="absolute inset-[6%] rounded-full bg-tint" />
          <Image src="/tree/full-tree.svg" alt="" fill priority className="object-contain p-[14%]" />
          <Chip className="left-0 top-[12%]" Icon={Drop} title="Red Cross Kedah Flood Aid" sub="20 spots · Sat 14 Nov" />
          <Chip className="right-0 top-[40%]" Icon={ForkKnife} title="Hari Raya Food Serving" sub="15 spots · Dining Hall" />
          <Chip className="left-[4%] top-[58%]" Icon={Drop} title="+1 watering" />
          <Chip className="bottom-[6%] right-[8%]" Icon={Certificate} title="Certificate ready" />
        </section>
      </main>

      <section className="mx-auto w-full max-w-6xl px-4 pb-10 sm:px-8">
        <h2 className="text-xl font-semibold tracking-tight">Happening around AIU</h2>
        <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {EXAMPLES.map(({ title, when, spots, Icon, brown }) => (
            <li key={title} className="rounded-[18px] border border-line bg-card p-4">
              <span className={`grid size-10 place-items-center rounded-full ${brown ? "bg-brown-tint text-brown" : "bg-tint text-on-tint"}`}>
                <Icon size={20} aria-hidden />
              </span>
              <p className="mt-3 font-medium leading-snug">{title}</p>
              <p className="mt-1 text-xs text-muted">{when}</p>
              <p className={`mt-3 inline-block rounded-full px-2.5 py-1 text-xs font-medium ${brown ? "bg-brown-tint text-brown" : "bg-tint text-on-tint"}`}>
                {spots} spots
              </p>
            </li>
          ))}
        </ul>
      </section>

      <footer className="border-t border-line">
        <div className="mx-auto flex w-full max-w-6xl justify-between px-4 py-4 sm:px-8">
          <PrototypeNote />
          <p className="text-xs text-muted">Synthetic demo data</p>
        </div>
      </footer>
    </div>
  );
}

function Chip({ className, Icon, title, sub }: { className: string; Icon: typeof Drop; title: string; sub?: string }) {
  return (
    <div className={`absolute flex items-center gap-2 rounded-[14px] border border-line bg-card px-3 py-2 ${className}`}>
      <Icon size={16} className="text-accent" />
      <div>
        <p className="text-xs font-semibold">{title}</p>
        {sub && <p className="text-[11px] text-muted">{sub}</p>}
      </div>
    </div>
  );
}
