"use client";

// Screen 7b: "You grew a Sprout". Shown when the tree has reached a new stage since the student last
// saw it on this device. The last stage seen is kept on the device only (no database change).

import Image from "next/image";
import Link from "next/link";
import { useEffect, useSyncExternalStore } from "react";
import { Certificate } from "@phosphor-icons/react";
import { readDevice, subscribeDevice, writeDevice } from "@/lib/device-store";

interface Props {
  studentId: string;
  stageIndex: number;
  stageName: string;
  imagePath: string;
  waterings: number;
  latestMission: string | null;
}

export function GrowthCelebration({ studentId, stageIndex, stageName, imagePath, waterings, latestMission }: Props) {
  const key = `seen-stage:${studentId}`;
  const saved = useSyncExternalStore(subscribeDevice, () => readDevice(key), () => "server");
  const seen = saved === null || saved === "server" ? null : Number(saved);
  const show = saved !== "server" && seen !== null && stageIndex > seen;

  // First visit on this device, or the tree shrank after a revocation: remember without celebrating.
  useEffect(() => {
    if (saved !== "server" && (seen === null || stageIndex < seen)) writeDevice(key, String(stageIndex));
  }, [key, saved, seen, stageIndex]);

  if (!show) return null;
  const dismiss = () => writeDevice(key, String(stageIndex));
  return (
    <div role="dialog" aria-modal="true" aria-labelledby="grew-title"
      className="fixed inset-0 z-20 flex flex-col items-center bg-header px-4 pb-8 pt-20 text-center text-[#f4f7ef]">
      <div className="relative aspect-square w-72 rounded-full bg-white/15">
        <Image src={imagePath} alt="" fill className="object-contain p-10" />
      </div>
      <h2 id="grew-title" className="mt-8 text-3xl font-semibold tracking-[-0.03em]">You grew a {stageName}</h2>
      <p className="mt-2 text-sm opacity-85">
        {latestMission ? `${latestMission} approved · ` : ""}
        {waterings} waterings
      </p>
      <Link href="/student/tree" onClick={dismiss} autoFocus
        className="mt-auto w-full max-w-md rounded-full bg-[#f4f7ef] py-4 font-medium text-[#1c1c1a]">
        See my tree
      </Link>
      <Link href="/student/certificates" onClick={dismiss} className="mt-4 inline-flex items-center gap-1.5 text-sm">
        <Certificate size={16} aria-hidden /> Your certificate is ready
      </Link>
    </div>
  );
}
