// Certificate designs (DEC-063). The three presets are the admin-approved templates (BR-12):
// organizers and admins choose among them per mission, but cannot create new ones. Every preset
// keeps the title, name, mission, date, ID and the prototype watermark (DEC-008, BR-12).
// Kept apart from certificate.ts so screens can use these lists without loading pdf-lib.

export const CERTIFICATE_TEMPLATES = ["classic", "modern", "minimal"] as const;
export type CertificateTemplate = (typeof CERTIFICATE_TEMPLATES)[number];

export const TEMPLATE_LABELS: Record<CertificateTemplate, { name: string; hint: string }> = {
  classic: { name: "Classic", hint: "Gold double frame" },
  modern: { name: "Modern", hint: "Colour band on the left" },
  minimal: { name: "Minimal", hint: "Clean lines, lots of white" },
};

/** Accent colours from the app palette, as hex for the screens. */
export const CERTIFICATE_ACCENTS = {
  green: "#2E7D32",
  teal: "#1F6F78",
  navy: "#1F3A5F",
  plum: "#6B3E75",
} as const;
export type CertificateAccent = keyof typeof CERTIFICATE_ACCENTS;

/** The optional line describing the volunteering role: the same for everyone on the mission. */
export const DESCRIPTION_MAX = 160;

export function isTemplate(value: unknown): value is CertificateTemplate {
  return typeof value === "string" && (CERTIFICATE_TEMPLATES as readonly string[]).includes(value);
}

export function isAccent(value: unknown): value is CertificateAccent {
  return typeof value === "string" && value in CERTIFICATE_ACCENTS;
}
