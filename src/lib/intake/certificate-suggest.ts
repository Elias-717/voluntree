// AI suggestion for a mission's certificate (DEC-063): a one-line description of the volunteering role,
// and one of the preset designs and accents. Same pattern as mission intake (draft.ts): server only,
// Groq, emails and phone numbers removed, the answer checked with Zod, and a person edits and approves
// it in the form. It sees only the mission's title and description, never student data, and it writes
// about the role, not about any one student.

import { z } from "zod";
import { CERTIFICATE_ACCENTS, CERTIFICATE_TEMPLATES, DESCRIPTION_MAX } from "@/lib/certificate/designs";
import { INTAKE_MODEL, redact } from "./draft";

export const CERTIFICATE_SUGGEST_VERSION = "certificate-v1";

/** Characters the certificate's standard fonts can draw (Latin): plain ASCII, Latin-1 and common quotes and dashes. */
const LATIN_ONLY = /^[\x20-\x7E -ÿ–—‘’“”]+$/;

export const CertificateSuggestionSchema = z.object({
  description: z.string().trim().min(10).max(DESCRIPTION_MAX).regex(LATIN_ONLY),
  template: z.enum(CERTIFICATE_TEMPLATES),
  accent: z.enum(Object.keys(CERTIFICATE_ACCENTS) as [keyof typeof CERTIFICATE_ACCENTS]),
});
export type CertificateSuggestion = z.infer<typeof CertificateSuggestionSchema>;

export function buildCertificatePrompt(title: string, details: string): string {
  return [
    "You help design a volunteer certificate for a university event at AIU in Malaysia.",
    "Return JSON only, with exactly these keys:",
    `{"description": string, "template": ${CERTIFICATE_TEMPLATES.map((t) => `"${t}"`).join("|")}, "accent": ${Object.keys(CERTIFICATE_ACCENTS).map((a) => `"${a}"`).join("|")}}`,
    "Rules:",
    `- description: one plain English sentence, at most ${DESCRIPTION_MAX} characters, saying what the volunteers did in this role, e.g. "Guided visiting families around campus and helped at the information booth."`,
    "- Describe the role only. Never praise or judge a person, never mention hours, and never invent facts that are not in the mission text.",
    "- Use only English letters, digits and ordinary punctuation.",
    "- template: classic for formal or ceremonial events, modern for tech, sports or youthful events, minimal for academic or quiet events.",
    "- accent: green for nature or community, teal for health or water, navy for academic or formal, plum for arts or culture.",
    "",
    "Mission:",
    '"""',
    `Title: ${title}`,
    `Description: ${details}`,
    '"""',
  ].join("\n");
}

/** Calls Groq and checks the answer. Returns null when the model fails or answers something unusable. */
export async function suggestCertificateDesign(title: string, details: string) {
  const prompt = buildCertificatePrompt(redact(title.trim()).slice(0, 200), redact(details.trim()).slice(0, 1500));
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: INTAKE_MODEL,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.3,
    }),
  });
  if (!response.ok) throw new Error(`Groq returned ${response.status}`);
  const body = await response.json();
  const parsed = CertificateSuggestionSchema.safeParse(JSON.parse(body.choices?.[0]?.message?.content ?? "null"));
  return { prompt, suggestion: parsed.success ? parsed.data : null };
}
