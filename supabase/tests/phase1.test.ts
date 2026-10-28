// Phase 1 database tests (AGENTS.md §5 exit check). They run against the real
// Supabase project in .env.local and are skipped when it is missing.
//
// They use their own logins and a separate test organization, never the demo data.
// The ledger and audit tables are append-only, so test rows stay; every mission gets
// its own far-future time slot and the tests compare counts before and after.

import { randomBytes, randomInt } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { beforeAll, describe, expect, it } from "vitest";

try {
  process.loadEnvFile(".env.local");
} catch {
  // No .env.local: the tests below are skipped.
}
const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const hasDatabase = Boolean(URL && PUBLISHABLE_KEY && SERVICE_KEY);

const TIMEOUT = 60_000;
const TEST_ORG = "00000000-0000-4000-d000-000000000100";
const PASSWORD = `test-${randomBytes(12).toString("base64url")}`;

// Test logins. School and CGPA chosen for the eligibility cases (FR-029).
const people = {
  admin: { id: "00000000-0000-4000-d000-000000000001", role: "admin" },
  organizer: { id: "00000000-0000-4000-d000-000000000002", role: "organizer" },
  sciHigh: { id: "00000000-0000-4000-d000-000000000011", role: "student", school: "SCI", cgpa: 3.5 },
  sciExact: { id: "00000000-0000-4000-d000-000000000012", role: "student", school: "SCI", cgpa: 3.0 },
  otherSchool: { id: "00000000-0000-4000-d000-000000000013", role: "student", school: "SBSS", cgpa: 3.9 },
  noCgpa: { id: "00000000-0000-4000-d000-000000000014", role: "student", school: "SCI", cgpa: null },
  sciLow: { id: "00000000-0000-4000-d000-000000000015", role: "student", school: "SCI", cgpa: 2.9 },
  sehs: { id: "00000000-0000-4000-d000-000000000016", role: "student", school: "SEHS", cgpa: 3.2 },
} as const;
type Person = keyof typeof people;
const emailOf = (name: Person) => `test-${name.toLowerCase()}@voluntree.test`;

let service: SupabaseClient;
const as = {} as Record<Person, SupabaseClient>;

// Each run starts at a random hour between 2030 and about 2090; missions in a run follow on.
let nextSlot = Date.UTC(2030, 0, 1) + randomInt(0, 500_000) * 3_600_000;

async function createMission(fields: Record<string, unknown> = {}): Promise<string> {
  const start = nextSlot;
  nextSlot += 3 * 3_600_000;
  const { data, error } = await service
    .from("missions")
    .insert({
      organization_id: TEST_ORG,
      title: "Test mission",
      description: "Created by supabase/tests/phase1.test.ts",
      place: "Test hall",
      starts_at: new Date(start).toISOString(),
      ends_at: new Date(start + 2 * 3_600_000).toISOString(),
      capacity: 5,
      status: "PUBLISHED",
      created_by: people.organizer.id,
      ...fields,
    })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

async function accept(name: Person, missionId: string) {
  return as[name].rpc("accept_mission", { p_mission_id: missionId });
}

async function wateringsOf(name: Person): Promise<number> {
  const { data, error } = await service.from("watering_ledger").select("delta").eq("student_id", people[name].id);
  if (error) throw error;
  return data.reduce((sum, row) => sum + row.delta, 0);
}

/** Error message code, e.g. "MISSION_FULL", or null when the call succeeded. */
function codeOf(result: { error: { message: string } | null }): string | null {
  return result.error ? result.error.message.split(":")[0] : null;
}

describe.skipIf(!hasDatabase)("Phase 1 database", () => {
  beforeAll(async () => {
    service = createClient(URL!, SERVICE_KEY!, { auth: { persistSession: false } });

    for (const name of Object.keys(people) as Person[]) {
      const person = people[name];
      const created = await service.auth.admin.createUser({
        id: person.id,
        email: emailOf(name),
        password: PASSWORD,
        email_confirm: true,
      });
      if (created.error) {
        const updated = await service.auth.admin.updateUserById(person.id, { password: PASSWORD });
        if (updated.error) throw updated.error;
      }
      const profile = await service
        .from("profiles")
        .upsert({ id: person.id, role: person.role, display_name: `Test ${name}` });
      if (profile.error) throw profile.error;
      if ("school" in person) {
        const details = await service
          .from("student_profiles")
          .upsert({ user_id: person.id, school: person.school, cgpa: person.cgpa });
        if (details.error) throw details.error;
      }
    }

    const org = await service.from("organizations").upsert({ id: TEST_ORG, name: "Voluntree test organization" });
    if (org.error) throw org.error;
    const member = await service
      .from("organization_members")
      .upsert({ organization_id: TEST_ORG, user_id: people.organizer.id });
    if (member.error) throw member.error;

    for (const name of Object.keys(people) as Person[]) {
      const client = createClient(URL!, PUBLISHABLE_KEY!, { auth: { persistSession: false } });
      const { error } = await client.auth.signInWithPassword({ email: emailOf(name), password: PASSWORD });
      if (error) throw error;
      as[name] = client;
    }
  }, TIMEOUT);

  it("never exceeds capacity under concurrent accepts (FR-006)", async () => {
    const missionId = await createMission({ capacity: 2 });
    const students: Person[] = ["sciHigh", "sciExact", "otherSchool", "noCgpa", "sciLow", "sehs"];
    const results = await Promise.all(students.map((name) => accept(name, missionId)));

    expect(results.filter((r) => r.error === null)).toHaveLength(2);
    expect(results.filter((r) => codeOf(r) === "MISSION_FULL")).toHaveLength(4);
    const { count } = await service
      .from("mission_assignments")
      .select("*", { count: "exact", head: true })
      .eq("mission_id", missionId);
    expect(count).toBe(2);
  }, TIMEOUT);

  it("counts pending dean approvals toward capacity (FR-030)", async () => {
    const missionId = await createMission({ capacity: 2, dean_approval_required: true });
    const students: Person[] = ["sciHigh", "sciExact", "noCgpa", "sciLow"];
    const results = await Promise.all(students.map((name) => accept(name, missionId)));

    const accepted = results.filter((r) => r.error === null);
    expect(accepted).toHaveLength(2);
    for (const r of accepted) expect(r.data.status).toBe("PENDING_DEAN_APPROVAL");
    expect(results.filter((r) => codeOf(r) === "MISSION_FULL")).toHaveLength(2);
  }, TIMEOUT);

  it("gives one watering and one certificate for a repeated approval (FR-009, BR-07)", async () => {
    const missionId = await createMission();
    const assignment = await accept("sehs", missionId);
    expect(assignment.error).toBeNull();
    const before = await wateringsOf("sehs");

    const approvals = await Promise.all([
      as.organizer.rpc("approve_completion", { p_assignment_id: assignment.data.id }),
      as.organizer.rpc("approve_completion", { p_assignment_id: assignment.data.id }),
    ]);
    const again = await as.organizer.rpc("approve_completion", { p_assignment_id: assignment.data.id });
    for (const r of [...approvals, again]) expect(r.error).toBeNull();

    const completionId = again.data.id;
    expect(await wateringsOf("sehs")).toBe(before + 1);
    const ledger = await service.from("watering_ledger").select("id").eq("completion_id", completionId);
    expect(ledger.data).toHaveLength(1);
    const certificates = await service.from("certificates").select("id").eq("completion_id", completionId);
    expect(certificates.data).toHaveLength(1);
  }, TIMEOUT);

  it("rejects a revocation without a reason, and by anyone but an admin (FR-009)", async () => {
    const missionId = await createMission();
    const assignment = await accept("sciHigh", missionId);
    const completion = await as.organizer.rpc("approve_completion", { p_assignment_id: assignment.data.id });
    expect(completion.error).toBeNull();

    for (const reason of ["", "   "]) {
      const r = await as.admin.rpc("revoke_completion", { p_completion_id: completion.data.id, p_reason: reason });
      expect(codeOf(r)).toBe("REASON_REQUIRED");
    }
    const byOrganizer = await as.organizer.rpc("revoke_completion", {
      p_completion_id: completion.data.id,
      p_reason: "Test",
    });
    expect(codeOf(byOrganizer)).toBe("FORBIDDEN");
  }, TIMEOUT);

  it("rejects ineligible acceptance and hides the mission from ineligible students (FR-029)", async () => {
    const missionId = await createMission({ eligible_schools: ["SCI"], min_cgpa: 3.0 });

    expect(codeOf(await accept("otherSchool", missionId))).toBe("NOT_ELIGIBLE");
    expect(codeOf(await accept("noCgpa", missionId))).toBe("NOT_ELIGIBLE");
    expect(codeOf(await accept("sciLow", missionId))).toBe("NOT_ELIGIBLE");
    // A CGPA equal to the minimum is eligible.
    expect((await accept("sciExact", missionId)).error).toBeNull();

    const hidden = await as.otherSchool.from("missions").select("id").eq("id", missionId);
    expect(hidden.data).toEqual([]);
    const visible = await as.sciHigh.from("missions").select("id").eq("id", missionId);
    expect(visible.data).toHaveLength(1);
  }, TIMEOUT);

  it("stops organizers setting criteria or reading CGPA (FR-028, FR-029, BR-14)", async () => {
    const missionId = await createMission();
    const update = await as.organizer.from("missions").update({ min_cgpa: 2.5 }).eq("id", missionId);
    expect(codeOf(update)).toBe("FORBIDDEN");

    const insert = await as.organizer.from("missions").insert({
      organization_id: TEST_ORG,
      title: "Organizer draft",
      eligible_schools: ["SCI"],
      created_by: people.organizer.id,
    });
    expect(codeOf(insert)).toBe("FORBIDDEN");

    const cgpa = await as.organizer.from("student_profiles").select("cgpa");
    expect(cgpa.data).toEqual([]);
  }, TIMEOUT);

  it("frees the slot when the dean rejects (FR-030)", async () => {
    const missionId = await createMission({ capacity: 1, dean_approval_required: true });
    const first = await accept("sciHigh", missionId);
    expect(first.data.status).toBe("PENDING_DEAN_APPROVAL");
    expect(codeOf(await accept("sciExact", missionId))).toBe("MISSION_FULL");

    // A pending student cannot be approved for attendance.
    const early = await as.organizer.rpc("approve_completion", { p_assignment_id: first.data.id });
    expect(codeOf(early)).toBe("NOT_ACCEPTED");
    // Only an admin records the dean's decision.
    const byOrganizer = await as.organizer.rpc("record_dean_decision", {
      p_assignment_id: first.data.id,
      p_approved: true,
    });
    expect(codeOf(byOrganizer)).toBe("FORBIDDEN");

    const rejected = await as.admin.rpc("record_dean_decision", {
      p_assignment_id: first.data.id,
      p_approved: false,
      p_note: "Test rejection",
    });
    expect(rejected.data.status).toBe("DEAN_REJECTED");
    expect((await accept("sciExact", missionId)).error).toBeNull();
  }, TIMEOUT);

  it("locks criteria once a student has accepted (BR-14)", async () => {
    const missionId = await createMission({ eligible_schools: ["SCI"] });
    const beforeAccept = await as.admin.from("missions").update({ min_cgpa: 2.0 }).eq("id", missionId);
    expect(beforeAccept.error).toBeNull();

    expect((await accept("sciHigh", missionId)).error).toBeNull();
    const afterAccept = await as.admin.from("missions").update({ min_cgpa: 3.8 }).eq("id", missionId);
    expect(codeOf(afterAccept)).toBe("CRITERIA_LOCKED");
  }, TIMEOUT);

  it("rejects a revoked certificate download and reactivates the same serial on re-approval (FR-010)", async () => {
    const missionId = await createMission();
    const assignment = await accept("sciExact", missionId);
    const before = await wateringsOf("sciExact");
    const completion = await as.organizer.rpc("approve_completion", { p_assignment_id: assignment.data.id });

    const certificate = await as.sciExact
      .from("certificates")
      .select("id, serial")
      .eq("completion_id", completion.data.id)
      .single();
    const download = await as.sciExact.rpc("get_certificate_for_download", { p_certificate_id: certificate.data!.id });
    expect(download.error).toBeNull();
    expect(download.data[0].serial).toBe(certificate.data!.serial);
    // Someone else's certificate is refused.
    const stranger = await as.sehs.rpc("get_certificate_for_download", { p_certificate_id: certificate.data!.id });
    expect(codeOf(stranger)).toBe("FORBIDDEN");

    const revoked = await as.admin.rpc("revoke_completion", {
      p_completion_id: completion.data.id,
      p_reason: "Test revocation",
    });
    expect(revoked.error).toBeNull();
    expect(await wateringsOf("sciExact")).toBe(before);
    const blocked = await as.sciExact.rpc("get_certificate_for_download", { p_certificate_id: certificate.data!.id });
    expect(codeOf(blocked)).toBe("CERTIFICATE_REVOKED");

    const reapproved = await as.organizer.rpc("approve_completion", { p_assignment_id: assignment.data.id });
    expect(reapproved.error).toBeNull();
    expect(await wateringsOf("sciExact")).toBe(before + 1);
    const after = await service
      .from("certificates")
      .select("id, serial, status")
      .eq("completion_id", completion.data.id);
    expect(after.data).toEqual([{ id: certificate.data!.id, serial: certificate.data!.serial, status: "VALID" }]);
  }, TIMEOUT);

  it("audits a school or CGPA change with the old value (FR-028)", async () => {
    const { data: current } = await service
      .from("student_profiles")
      .select("cgpa")
      .eq("user_id", people.sehs.id)
      .single();
    const newCgpa = current!.cgpa === 3.2 ? 3.3 : 3.2;

    const update = await as.sehs.from("student_profiles").update({ cgpa: newCgpa }).eq("user_id", people.sehs.id);
    expect(update.error).toBeNull();

    const { data: audit } = await service
      .from("audit_events")
      .select("details")
      .eq("entity_id", people.sehs.id)
      .eq("action", "academic_changed")
      .order("id", { ascending: false })
      .limit(1)
      .single();
    expect(audit!.details).toEqual({
      old: { school: "SEHS", cgpa: current!.cgpa },
      new: { school: "SEHS", cgpa: newCgpa },
    });
  }, TIMEOUT);
});
