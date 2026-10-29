// Screen 2: welcome and consent (FR-025). Shown until the student agrees to the current notice.

import { LockSimple, Target, UserCheck } from "@phosphor-icons/react/ssr";
import { requireRole } from "@/lib/db/session";
import { giveConsent } from "../actions";
import { Progress } from "../progress";

const PROMISES = [
  { Icon: Target, text: "Students with fewer chances so far are suggested first." },
  { Icon: LockSimple, text: "School and CGPA only check who can join. Some missions are for one school." },
  { Icon: UserCheck, text: "It is always your choice. People decide, not the AI." },
];

export default async function Welcome() {
  const me = await requireRole("student");
  const firstName = me.displayName.split(" ")[0];

  return (
    <form action={giveConsent} className="flex flex-1 flex-col px-4 pb-6 pt-5">
      <Progress step={1} />
      <h1 className="mt-8 text-[28px] font-semibold leading-tight tracking-[-0.03em]">
        Hi {firstName},
        <br />a quick promise
      </h1>

      <ul className="mt-6 flex flex-col gap-4">
        {PROMISES.map(({ Icon, text }) => (
          <li key={text} className="flex gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-tint text-on-tint">
              <Icon size={18} aria-hidden />
            </span>
            <p className="text-muted">{text}</p>
          </li>
        ))}
      </ul>

      <label className="mt-6 flex items-center justify-between rounded-[18px] border border-line bg-card px-4 py-4 font-medium">
        Suggest missions for me
        <input type="checkbox" name="suggest" defaultChecked className="peer sr-only" />
        <span aria-hidden className="relative h-7 w-12 rounded-full bg-gauge-empty transition-colors peer-checked:bg-primary after:absolute after:left-1 after:top-1 after:size-5 after:rounded-full after:bg-card after:transition-transform peer-checked:after:translate-x-5 peer-focus-visible:outline-2 peer-focus-visible:outline-primary" />
      </label>
      <p className="mt-2 px-1 text-xs text-muted">
        Turn this off to opt out of suggestions. You can still browse every mission you can join.
      </p>

      <details className="mt-4 rounded-[14px] px-1 text-sm text-muted">
        <summary className="cursor-pointer font-medium text-text">Read the full notice</summary>
        <div className="mt-2 flex flex-col gap-2">
          <p>Voluntree suggests missions using how many missions you have taken part in so far (fewer comes first, for fair access), and only suggests missions that don&apos;t clash with ones you have already joined. Your declared school and CGPA are used only to check whether you can join missions that set school or CGPA criteria, and some missions are open to one school only.</p>
          <p>Suggestions are advisory: you decide whether to accept, and organizers and admins make the final decisions. Taking part is optional and saying no costs you nothing.</p>
          <p>You can opt out of suggestions here or later in Me. Only you and admins can see your CGPA. This is a prototype with synthetic demo data, not an official AIU system.</p>
        </div>
      </details>

      <button className="mt-auto rounded-full bg-primary py-4 font-medium text-on-primary">I agree, continue</button>
    </form>
  );
}
