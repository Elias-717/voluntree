// Screen 3b: seed planted, the end of onboarding.

import Image from "next/image";
import Link from "next/link";
import { requireRole } from "@/lib/db/session";

export default async function SeedPlanted() {
  await requireRole("student");
  return (
    <div className="flex flex-1 flex-col items-center px-4 pb-6 pt-16 text-center">
      <div className="relative mt-6 aspect-square w-64 rounded-full bg-tint">
        <Image src="/tree/seed.svg" alt="A planted seed" fill priority className="object-contain p-8" />
      </div>
      <h1 className="mt-8 text-[28px] font-semibold tracking-[-0.03em]">Your seed is planted</h1>
      <p className="mt-2 text-muted">
        Every mission you complete waters it.
        <br />
        Three waterings and it sprouts.
      </p>
      <Link href="/student" className="mt-auto w-full rounded-full bg-primary py-4 font-medium text-on-primary">
        Find my first mission
      </Link>
    </div>
  );
}
