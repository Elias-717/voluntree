// LLM mission intake (FR-023, DEC-039, DEC-049). Server-only: the Groq key never reaches the browser.
// The model only drafts. A person reviews every field and publishes; nothing is published automatically.
// Missing or unclear details come back as null and are flagged, never invented.

import { createHash } from "node:crypto";
import { z } from "zod";

export const INTAKE_MODEL = "openai/gpt-oss-120b";
export const INTAKE_VERSION = "intake-v2";

const MAX_INPUT = 6000;

/** What the model must return. Every field may be null when the announcement does not say. */
export const DraftSchema = z.object({
  title: z.string().trim().min(1).max(120).nullable(),
  description: z.string().trim().min(1).max(600).nullable(),
  place: z.string().trim().min(1).max(120).nullable(),
  skills: z.array(z.string().trim().min(1).max(40)).max(6),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  start: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).nullable(),
  end: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).nullable(),
  capacity: z.number().int().min(1).max(1000).nullable(),
});
export type Draft = z.infer<typeof DraftSchema>;

/** Open question 8: emails and phone numbers are replaced before the text leaves our server. */
export function redact(text: string): string {
  return text
    .replace(/[\w.+-]+@[\w-]+(\.[\w-]+)+/g, "[email]")
    .replace(/(\+?\d[\d\s().-]{7,}\d)/g, "[phone]");
}

export function buildPrompt(announcement: string, today: string): string {
  return [
    "You turn a university event announcement into a volunteer mission draft for AIU in Malaysia.",
    `Today is ${today}, a ${weekdayOf(today)} (Malaysia time). Resolve relative dates like "next Saturday" against today.`,
    "Return JSON only, with exactly these keys:",
    '{"title": string|null, "description": string|null, "place": string|null, "skills": string[], "date": "YYYY-MM-DD"|null, "start": "HH:MM"|null, "end": "HH:MM"|null, "capacity": integer|null}',
    "Rules:",
    "- Use only facts stated in the announcement. If something is missing or unclear, use null. Never guess.",
    "- title: short and clear, at most 8 words, in English.",
    "- description: 1 to 3 plain English sentences about what volunteers will do. null if the text gives too little.",
    "- skills: up to 5 short lowercase skills volunteers need, only if implied by the tasks; otherwise [].",
    "- capacity: the number of volunteers needed, only if a number is given.",
    "- start and end: 24-hour times in Malaysia time.",
    "",
    "Announcement:",
    '"""',
    announcement,
    '"""',
  ].join("\n");
}

/** "Thursday" for "2026-10-29". Models get relative dates wrong when they must work out the weekday themselves. */
function weekdayOf(date: string): string {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString("en-GB", { weekday: "long", timeZone: "UTC" });
}

export function hashPrompt(prompt: string): string {
  return createHash("sha256").update(prompt).digest("hex");
}

/** Fields the organizer must fill in themselves. */
export function blanksOf(draft: Draft): string[] {
  const names: [keyof Draft, string][] = [
    ["title", "Title"], ["description", "Description"], ["place", "Place"],
    ["date", "Date"], ["start", "Start"], ["end", "End"], ["capacity", "Slots"],
  ];
  return names.filter(([key]) => draft[key] === null).map(([, label]) => label);
}

/** Calls Groq (OpenAI-compatible API) and validates the answer. Throws when the model fails or returns something unusable. */
export async function draftMission(announcement: string, today: string) {
  const text = redact(announcement.trim()).slice(0, MAX_INPUT);
  const prompt = buildPrompt(text, today);
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: INTAKE_MODEL,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.2,
    }),
  });
  if (!response.ok) throw new Error(`Groq returned ${response.status}`);
  const body = await response.json();
  const parsed = DraftSchema.safeParse(JSON.parse(body.choices?.[0]?.message?.content ?? "null"));
  return { prompt, draft: parsed.success ? parsed.data : null };
}
