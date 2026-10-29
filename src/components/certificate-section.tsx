"use client";

// The certificate part of the mission form (DEC-063), for organizers and admins. Choose one of the
// three approved presets, an accent and an optional line about the role. "Suggest with AI" fills all
// three from the mission's title and description; the person checks and edits before saving.
// "Preview PDF" draws a sample certificate with the current choices. Certificates already issued keep
// the design they were issued with.

import { useState, useTransition } from "react";
import { Eye, Sparkle } from "@phosphor-icons/react";
import { suggestCertificate } from "@/lib/actions/staff";
import {
  CERTIFICATE_ACCENTS, CERTIFICATE_TEMPLATES, DESCRIPTION_MAX, TEMPLATE_LABELS, isAccent, isTemplate,
  type CertificateAccent, type CertificateTemplate,
} from "@/lib/certificate/designs";

interface Props {
  template?: string;
  accent?: string;
  description?: string;
}

export function CertificateSection({ template: t, accent: a, description: d = "" }: Props) {
  const [template, setTemplate] = useState<CertificateTemplate>(isTemplate(t) ? t : "classic");
  const [accent, setAccent] = useState<CertificateAccent>(isAccent(a) ? a : "green");
  const [description, setDescription] = useState(d);
  const [ai, setAi] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // The mission's own fields, read from the surrounding form when a button is pressed.
  const fieldOf = (el: HTMLElement, name: string) =>
    ((el.closest("form")?.elements.namedItem(name) as HTMLInputElement | null)?.value ?? "").trim();

  const suggest = (button: HTMLElement) =>
    startTransition(async () => {
      setError(null);
      const result = await suggestCertificate(fieldOf(button, "title"), fieldOf(button, "description"));
      if ("error" in result) return setError(result.error);
      setTemplate(result.template);
      setAccent(result.accent);
      setDescription(result.description);
      setAi(true);
    });

  const preview = (button: HTMLElement) => {
    const q = new URLSearchParams({ template, accent, description, title: fieldOf(button, "title"), date: fieldOf(button, "date") });
    window.open(`/certificates/preview?${q}`, "_blank", "noopener");
  };

  return (
    <fieldset className="rounded-[18px] border border-line p-4">
      <legend className="px-1 font-semibold">Certificate</legend>
      <p className="text-sm text-muted">Students get this when their attendance is approved. Changes apply to new certificates only.</p>

      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        {CERTIFICATE_TEMPLATES.map((key) => (
          <label key={key} className="cursor-pointer rounded-[14px] border border-line p-3 text-sm has-checked:border-primary has-checked:bg-tint">
            <input type="radio" name="certTemplate" value={key} checked={template === key} onChange={() => setTemplate(key)} className="sr-only" />
            <TemplateSketch template={key} color={CERTIFICATE_ACCENTS[accent]} />
            <span className="mt-2 block font-medium">{TEMPLATE_LABELS[key].name}</span>
            <span className="block text-xs text-muted">{TEMPLATE_LABELS[key].hint}</span>
          </label>
        ))}
      </div>

      <div className="mt-3 flex items-center gap-2" role="radiogroup" aria-label="Accent colour">
        <span className="mr-1 text-sm text-muted">Accent</span>
        {(Object.keys(CERTIFICATE_ACCENTS) as CertificateAccent[]).map((key) => (
          <label key={key} className="cursor-pointer" title={key}>
            <input type="radio" name="certAccent" value={key} checked={accent === key} onChange={() => setAccent(key)} className="peer sr-only" />
            <span className="block size-7 rounded-full ring-offset-2 ring-offset-card peer-checked:ring-2 peer-checked:ring-primary peer-focus-visible:ring-2"
              style={{ background: CERTIFICATE_ACCENTS[key] }} />
            <span className="sr-only">{key}</span>
          </label>
        ))}
      </div>

      <label className="mt-3 flex flex-col gap-1.5 text-sm">
        <span className="text-muted">Line about the role (optional, same for everyone on the mission)</span>
        <textarea name="certDescription" value={description} onChange={(e) => { setDescription(e.target.value); setAi(false); }}
          maxLength={DESCRIPTION_MAX} rows={2} placeholder="Guided visiting families around campus and helped at the information booth."
          className="w-full rounded-[12px] border border-line bg-page px-3 py-2.5" />
        <span className="self-end text-xs text-muted">{description.length} / {DESCRIPTION_MAX}</span>
      </label>
      {ai && (
        <p className="flex items-start gap-2 rounded-[14px] bg-brown-tint p-3 text-sm text-brown">
          <Sparkle size={18} weight="fill" aria-hidden className="mt-0.5 shrink-0" />
          <span><strong>AI-suggested.</strong> Check the design and the line before saving. It describes the role, never a person.</span>
        </p>
      )}
      {error && <p role="alert" className="mt-2 text-sm text-brown">{error}</p>}

      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" onClick={(e) => suggest(e.currentTarget)} disabled={pending}
          className="inline-flex items-center gap-2 rounded-full border border-strong px-4 py-2 text-sm font-medium disabled:opacity-60">
          <Sparkle size={16} aria-hidden /> {pending ? "Suggesting…" : "Suggest with AI"}
        </button>
        <button type="button" onClick={(e) => preview(e.currentTarget)}
          className="inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 text-sm font-medium">
          <Eye size={16} aria-hidden /> Preview PDF
        </button>
      </div>
    </fieldset>
  );
}

/** A tiny drawing of each preset, so the choice is visual. */
function TemplateSketch({ template, color }: { template: CertificateTemplate; color: string }) {
  return (
    <svg viewBox="0 0 84 60" className="w-full rounded-[8px] bg-white" aria-hidden>
      {template === "classic" && (
        <>
          <rect x="2.5" y="2.5" width="79" height="55" fill="none" stroke="#C9A227" strokeWidth="1.5" />
          <rect x="5.5" y="5.5" width="73" height="49" fill="none" stroke="#C9A227" strokeWidth="0.6" />
        </>
      )}
      {template === "modern" && <rect x="0" y="0" width="18" height="60" fill={color} />}
      {template === "minimal" && (
        <>
          <line x1="8" y1="4" x2="76" y2="4" stroke={color} strokeWidth="1" />
          <line x1="8" y1="56" x2="76" y2="56" stroke={color} strokeWidth="1" />
        </>
      )}
      {/* title, name and mission lines */}
      <g transform={template === "modern" ? "translate(9 0)" : undefined}>
        <rect x="27" y="14" width="30" height="4" rx="1" fill={template === "classic" ? color : "#333"} />
        <rect x="31" y="25" width="22" height="3" rx="1" fill="#555" />
        <rect x="29" y="34" width="26" height="3" rx="1" fill={color} />
        <rect x="22" y="47" width="40" height="0.8" fill={template === "classic" ? "#C9A227" : color} />
      </g>
    </svg>
  );
}
