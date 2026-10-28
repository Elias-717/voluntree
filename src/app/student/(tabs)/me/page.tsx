// Screen 16: Me. School, CGPA and phone (FR-028, DEC-040), appearance (DEC-031),
// the matching opt-out (FR-025) and sign out.

import Link from "next/link";
import { Buildings, LockSimple, Phone } from "@phosphor-icons/react/ssr";
import { Appearance } from "@/components/appearance";
import { createClient } from "@/lib/db/server";
import { requireRole } from "@/lib/db/session";
import { signOut } from "@/app/sign-in/actions";
import { SuggestSwitch } from "./suggest-switch";

export default async function Me() {
  const me = await requireRole("student");
  const supabase = await createClient();
  const { data } = await supabase
    .from("student_profiles")
    .select("school, cgpa, phone, matching_opt_out")
    .eq("user_id", me.id)
    .single();
  const initials = me.displayName.split(" ").map((w) => w[0]).slice(0, 2).join("");

  return (
    <>
      <h1 className="text-center font-semibold">Me</h1>
      <div className="mt-5 flex flex-col items-center">
        <span className="grid size-20 place-items-center rounded-full bg-tint text-2xl font-semibold text-on-tint">{initials}</span>
        <p className="mt-3 text-xl font-semibold">{me.displayName}</p>
        <p className="text-sm text-muted">{data?.school} · Student</p>
      </div>

      <ul className="mt-6 divide-y divide-line rounded-[22px] border border-line bg-card">
        <Row Icon={Buildings} title="School" sub={data?.school ?? "Not set"} />
        <Row Icon={LockSimple} title={data?.cgpa != null ? `CGPA ${Number(data.cgpa).toFixed(2)}` : "No CGPA"} sub="Only you and admins" />
        <Row Icon={Phone} title={data?.phone ?? "No phone number"} sub="Only the organizer of a mission you join" />
      </ul>

      <section className="mt-4 rounded-[22px] border border-line bg-card p-4">
        <h2 className="mb-3 font-medium">Appearance</h2>
        <Appearance />
      </section>

      <SuggestSwitch on={!data?.matching_opt_out} />

      <form action={signOut} className="mt-4">
        <button className="w-full rounded-full border border-strong py-4 font-medium">Sign out</button>
      </form>
    </>
  );
}

function Row({ Icon, title, sub }: { Icon: typeof Phone; title: string; sub: string }) {
  return (
    <li className="flex items-center gap-3 p-4">
      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-tint text-on-tint">
        <Icon size={18} aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-medium">{title}</p>
        <p className="text-xs text-muted">{sub}</p>
      </div>
      <Link href="/student/school?back=me" className="text-sm font-medium">Change</Link>
    </li>
  );
}
