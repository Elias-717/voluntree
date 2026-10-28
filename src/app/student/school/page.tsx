// Screen 3: school, optional CGPA and optional phone (FR-028, DEC-040). Editable again later in Me.

import { createClient } from "@/lib/db/server";
import { requireRole } from "@/lib/db/session";
import { Progress } from "../progress";
import { SchoolForm } from "./form";

export default async function YourSchool() {
  const me = await requireRole("student");
  const supabase = await createClient();
  const { data } = await supabase
    .from("student_profiles")
    .select("school, cgpa, phone")
    .eq("user_id", me.id)
    .single();

  return (
    <div className="flex flex-1 flex-col px-4 pb-6 pt-5">
      <Progress step={2} />
      <h1 className="mt-8 text-[28px] font-semibold leading-tight tracking-[-0.03em]">
        Which school
        <br />
        are you in?
      </h1>
      <SchoolForm school={data?.school ?? null} cgpa={data?.cgpa ?? null} phone={data?.phone ?? null} />
    </div>
  );
}
