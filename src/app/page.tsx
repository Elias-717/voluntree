// Screen 0: public landing page (DEC-026, DEC-038). Interesting rather than informative.

import Link from "next/link";
import { Fraunces } from "next/font/google";
import { ArrowRight, LockSimple, Scales, UserCircle } from "@phosphor-icons/react/ssr";
import { PrototypeNote } from "@/components/logo";
import { GrowingTree } from "@/components/growing-tree";
import { WaterDemo } from "@/components/water-demo";

// Display face for the landing headlines only. The app itself stays in DM Sans.
const fraunces = Fraunces({ variable: "--font-fraunces", subsets: ["latin"], style: ["normal", "italic"] });

// Illustrative examples for the landing strip (DEC-038, synthetic). The live missions are behind sign-in.
const EXAMPLES = [
  { title: "New Student Arrival Welcome", day: "Sun 1 Nov", place: "Main Gate", spots: 8 },
  { title: "Building D Cleaning Help", day: "Sat 7 Nov", place: "Building D", spots: 10 },
  { title: "Red Cross Kedah Flood Aid", day: "Sat 14 Nov", place: "Alor Setar", spots: 20 },
  { title: "Alor Setar Library Renovation", day: "Sat 21 Nov", place: "Alor Setar", spots: 12 },
  { title: "Hari Raya Food Serving", day: "Hari Raya", place: "Dining Hall", spots: 15 },
];

export default function Landing() {
  return (
    <div className={`${fraunces.variable} flex min-h-svh flex-col`}>

      <main className="flex-1">
        <GrowingTree />

        <section id="try" className="mx-auto grid w-full max-w-6xl scroll-mt-8 gap-10 px-4 py-20 sm:px-8 md:grid-cols-2 md:items-center">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.22em] text-accent">Live demo</p>
            <h2 className="font-display mt-4 text-[clamp(2.4rem,5.5vw,4rem)] font-medium leading-[0.95] tracking-[-0.03em]">
              Be the organizer for a moment.
            </h2>
            <p className="mt-5 max-w-md text-lg text-muted">
              Approve a student&apos;s attendance and their tree gets one watering. Every 3 waterings it grows a stage,
              from seed to full tree. This is the same gauge students see on their home screen.
            </p>
            <Link href="/sign-in#demo" className="mt-7 inline-flex items-center gap-2 font-medium text-accent underline-offset-4 hover:underline">
              <UserCircle size={20} aria-hidden /> Or sign in as a demo student, organizer or admin <ArrowRight size={16} aria-hidden />
            </Link>
          </div>
          <WaterDemo />
        </section>

        <section className="mx-auto w-full max-w-6xl px-4 pb-20 sm:px-8">
          <div className="flex items-end justify-between gap-4 border-b border-strong pb-4">
            <h2 className="font-display text-3xl font-medium tracking-[-0.02em] sm:text-4xl">Happening around AIU</h2>
            <p className="text-xs text-muted">Examples</p>
          </div>
          <ul>
            {EXAMPLES.map(({ title, day, place, spots }) => (
              <li key={title} className="grid grid-cols-[1fr_auto] items-baseline gap-x-6 gap-y-1 border-b border-line py-5 sm:grid-cols-[9rem_1fr_10rem_auto]">
                <span className="order-2 text-sm text-muted sm:order-none">{day}</span>
                <span className="col-span-2 text-lg font-medium sm:col-span-1">{title}</span>
                <span className="hidden text-sm text-muted sm:inline">{place}</span>
                <span className="order-3 text-right text-sm font-medium text-accent sm:order-none">{spots} spots</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="bg-header text-on-nav-active">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-16 sm:px-8 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="font-display text-[clamp(2.4rem,6vw,4.5rem)] font-medium leading-[0.95] tracking-[-0.03em]">
                Plant your seed.
              </h2>
              <p className="mt-4 flex flex-wrap gap-5 text-sm opacity-80">
                <span className="inline-flex items-center gap-1.5"><Scales size={16} aria-hidden /> Fair by design</span>
                <span className="inline-flex items-center gap-1.5"><LockSimple size={16} aria-hidden /> Private by default</span>
              </p>
            </div>
            <Link href="/sign-in" className="inline-flex items-center gap-2 self-start rounded-full bg-on-nav-active px-6 py-3.5 font-medium text-header md:self-auto">
              Start growing <ArrowRight size={18} aria-hidden />
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex w-full max-w-6xl justify-between px-4 py-4 sm:px-8">
          <PrototypeNote />
          <p className="text-xs text-muted">Synthetic demo data</p>
        </div>
      </footer>
    </div>
  );
}
