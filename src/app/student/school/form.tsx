"use client";

import { useActionState } from "react";
import { ChartBar, ChatCircle, Compass, Laptop, LockSimple, Notebook } from "@phosphor-icons/react";
import type { School } from "@/types/domain";
import { saveSchool } from "../actions";

const SCHOOLS: { code: School; Icon: typeof ChartBar }[] = [
  { code: "SBSS", Icon: ChartBar },
  { code: "SEHS", Icon: Notebook },
  { code: "SCI", Icon: Laptop },
  { code: "CFGS", Icon: Compass },
  { code: "LC", Icon: ChatCircle },
];

interface Props {
  school: School | null;
  cgpa: number | null;
  phone: string | null;
  fromMe: boolean;
}

export function SchoolForm({ school, cgpa, phone, fromMe }: Props) {
  const [error, formAction, pending] = useActionState(saveSchool, null);

  return (
    <form action={formAction} className="mt-6 flex flex-1 flex-col">
      {fromMe && <input type="hidden" name="back" value="me" />}
      <fieldset className="grid grid-cols-2 gap-3">
        <legend className="sr-only">School</legend>
        {SCHOOLS.map(({ code, Icon }) => (
          <label
            key={code}
            className="flex cursor-pointer flex-col items-center gap-1.5 rounded-[18px] border border-line bg-card py-4 font-semibold has-checked:border-primary has-checked:bg-primary has-checked:text-on-primary has-focus-visible:outline-2 has-focus-visible:outline-primary"
          >
            <input type="radio" name="school" value={code} defaultChecked={school === code} required className="sr-only" />
            <Icon size={22} aria-hidden />
            {code}
          </label>
        ))}
      </fieldset>

      <label className="mt-6 flex flex-col gap-1.5 text-sm">
        Your CGPA (optional)
        <input name="cgpa" inputMode="decimal" defaultValue={cgpa ?? ""} placeholder="3.50"
          className="rounded-[14px] border border-line bg-card px-4 py-3.5 text-base" />
      </label>
      <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted">
        <LockSimple size={14} aria-hidden /> Only you and admins can see it
      </p>

      <label className="mt-5 flex flex-col gap-1.5 text-sm">
        Phone number (optional)
        <input name="phone" type="tel" autoComplete="tel" defaultValue={phone ?? ""} placeholder="+60 12 345 6789"
          className="rounded-[14px] border border-line bg-card px-4 py-3.5 text-base" />
      </label>
      <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted">
        <LockSimple size={14} aria-hidden /> Shared only with the organizer of a mission you join
      </p>

      {error && <p role="alert" className="mt-4 text-sm text-brown">{error}</p>}

      <button disabled={pending} className="mt-auto rounded-full bg-primary py-4 font-medium text-on-primary disabled:opacity-60">
        {pending ? "Saving…" : "Continue"}
      </button>
      <button name="skip" value="1" disabled={pending} className="mt-3 text-sm font-medium">
        Skip CGPA for now
      </button>
    </form>
  );
}
