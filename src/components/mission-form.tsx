"use client";

// Screens 10 and 12: the mission form (FR-004). Admins also see eligibility criteria
// (FR-029); organizers are told only admins can set them. Save draft or publish.
// A new mission can start from an AI draft of a pasted announcement (FR-023); the person still
// checks and edits every field, and nothing is published automatically.

import { startTransition, useActionState, useState } from "react";
import { Check, Sparkle } from "@phosphor-icons/react";
import type { School } from "@/types/domain";
import { saveMission } from "@/lib/actions/staff";
import { IntakePanel } from "./intake-panel";

const SCHOOLS: School[] = ["SBSS", "SEHS", "SCI", "CFGS", "LC"];

export interface MissionDraft {
  id?: string;
  title?: string;
  description?: string;
  place?: string;
  skills?: string;
  date?: string;
  start?: string;
  end?: string;
  capacity?: number | null;
  safety?: string;
  eligibleSchools?: School[];
  minCgpa?: number | null;
  dean?: boolean;
}

interface Props {
  admin: boolean;
  draft?: MissionDraft;
  organizations?: { id: string; name: string }[];
  criteriaLocked?: boolean;
}

const input = "w-full rounded-[12px] border border-line bg-page px-3 py-2.5";

export function MissionForm({ admin, draft: saved = {}, organizations = [], criteriaLocked = false }: Props) {
  const [error, formAction, pending] = useActionState(saveMission, null);
  // An AI draft replaces the starting values; the key remounts the inputs with them.
  const [draft, setDraft] = useState<MissionDraft>(saved);
  const [ai, setAi] = useState<{ blanks: string[]; version: number } | null>(null);

  return (
    // Submitting through onSubmit, not the action prop, keeps what was typed when saving fails:
    // React resets a form after an action prop runs. The submitter carries the Publish or Save draft intent.
    <form
      key={ai?.version ?? 0}
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget, (e.nativeEvent as SubmitEvent).submitter);
        startTransition(() => formAction(data));
      }}
      className="grid gap-6 lg:grid-cols-[1fr_260px]"
    >
      {draft.id && <input type="hidden" name="id" value={draft.id} />}
      {ai && <input type="hidden" name="source" value="ai_draft" />}
      <div className="flex flex-col gap-4 rounded-[22px] border border-line bg-card p-5">
        {!draft.id && (
          <IntakePanel
            onDraft={(d, blanks) => {
              setDraft({
                ...draft,
                title: d.title ?? "", description: d.description ?? "", place: d.place ?? "",
                skills: d.skills.join(", "), date: d.date ?? "", start: d.start ?? "", end: d.end ?? "",
                capacity: d.capacity,
              });
              setAi({ blanks, version: (ai?.version ?? 0) + 1 });
            }}
          />
        )}
        {ai && (
          <p className="flex items-start gap-2 rounded-[14px] bg-brown-tint p-3 text-sm text-brown">
            <Sparkle size={18} weight="fill" aria-hidden className="mt-0.5 shrink-0" />
            <span>
              <strong>AI-generated draft.</strong> Check every field before publishing.
              {ai.blanks.length > 0 && ` Not in the announcement, so left blank: ${ai.blanks.join(", ")}.`}
            </span>
          </p>
        )}
        {admin && !draft.id && organizations.length > 0 && (
          <Field label="Organization">
            <select name="organization" defaultValue={organizations[0].id} className={input}>
              {organizations.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
          </Field>
        )}
        <Field label="Title"><input name="title" defaultValue={draft.title} maxLength={120} className={input} /></Field>
        <Field label="Description">
          <textarea name="description" defaultValue={draft.description} rows={3} className={input} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Place"><input name="place" defaultValue={draft.place} className={input} /></Field>
          <Field label="Skills (optional, comma separated)"><input name="skills" defaultValue={draft.skills} placeholder="cleaning, teamwork" className={input} /></Field>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Field label="Date"><input type="date" name="date" defaultValue={draft.date} className={input} /></Field>
          <Field label="Start"><input type="time" name="start" defaultValue={draft.start} className={input} /></Field>
          <Field label="End"><input type="time" name="end" defaultValue={draft.end} className={input} /></Field>
          <Field label="Slots"><input type="number" name="capacity" min={1} defaultValue={draft.capacity ?? ""} placeholder="Required" className={input} /></Field>
        </div>
        <Field label="Safety notes (optional)"><input name="safety" defaultValue={draft.safety} className={input} /></Field>

        {admin ? (
          <fieldset disabled={criteriaLocked} className="rounded-[18px] border border-line p-4">
            <legend className="px-1 font-semibold">Who can join</legend>
            <p className="text-sm text-muted">
              {criteriaLocked ? "Locked: a student has already accepted (BR-14)." : "Leave every school unticked to open it to all students."}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {SCHOOLS.map((s) => (
                <label key={s} className="flex cursor-pointer items-center gap-2 rounded-full border border-line px-3 py-1.5 text-sm has-checked:border-primary has-checked:bg-tint">
                  <input type="checkbox" name={`school-${s}`} defaultChecked={draft.eligibleSchools?.includes(s)} className="accent-[var(--primary)]" />
                  {s}
                </label>
              ))}
            </div>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <Field label="Minimum CGPA (optional)">
                <input name="minCgpa" inputMode="decimal" defaultValue={draft.minCgpa ?? ""} placeholder="3.00" className={input} />
              </Field>
              <label className="flex items-center gap-2 self-end pb-2.5 text-sm">
                <input type="checkbox" name="dean" defaultChecked={draft.dean} className="size-4 accent-[var(--primary)]" />
                Dean approval required
              </label>
            </div>
            <p className="mt-2 text-xs text-muted">CGPA is only a filter for who can join. It never changes anyone&apos;s ranking.</p>
          </fieldset>
        ) : (
          <p className="text-sm text-muted">Open to all students. Only admins can set eligibility criteria.</p>
        )}
      </div>

      <aside className="flex flex-col gap-3">
        <div className="rounded-[22px] border border-line bg-card p-5 text-sm">
          <p className="font-semibold">Ready to publish?</p>
          <ul className="mt-3 flex flex-col gap-2 text-muted">
            {["Title", "Description", "Place", "Date and time", "Slots"].map((t) => (
              <li key={t} className="flex items-center gap-2"><Check size={14} aria-hidden /> {t}</li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-muted">Drafts can be incomplete. Publishing needs every item.</p>
        </div>
        {error && <p role="alert" className="rounded-[14px] bg-brown-tint p-3 text-sm text-brown">{error}</p>}
        <button name="intent" value="publish" disabled={pending} className="rounded-full bg-primary py-3 font-medium text-on-primary disabled:opacity-60">
          {pending ? "Saving…" : "Publish"}
        </button>
        <button name="intent" value="draft" disabled={pending} className="rounded-full border border-strong py-3 font-medium">
          Save draft
        </button>
      </aside>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="text-muted">{label}</span>
      {children}
    </label>
  );
}
