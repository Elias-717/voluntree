// Certificate preview for organizers and admins (DEC-063): draws a sample certificate with the design
// chosen in the mission form, before anything is saved. Sample name and ID; nothing is issued or stored.

import { generateCertificatePdf } from "@/lib/certificate/certificate";
import { isAccent, isTemplate } from "@/lib/certificate/designs";
import { VOLUNTREE_LOGO_PNG_BASE64 } from "@/lib/certificate/logo";
import { getMe } from "@/lib/db/session";

export async function GET(request: Request) {
  const me = await getMe();
  if (!me || me.role === "student") return new Response("Only staff can preview certificates.", { status: 403 });

  const q = new URL(request.url).searchParams;
  const date = /^\d{4}-\d{2}-\d{2}$/.test(q.get("date") ?? "") ? q.get("date")! : new Date().toISOString().slice(0, 10);
  try {
    const pdf = await generateCertificatePdf({
      studentName: "Student Name",
      missionTitle: q.get("title")?.trim() || "Mission title",
      date,
      certificateId: "VT-PREVIEW",
      template: isTemplate(q.get("template")) ? (q.get("template") as "classic") : "classic",
      accent: isAccent(q.get("accent")) ? (q.get("accent") as "green") : "green",
      description: q.get("description"),
      logo: Buffer.from(VOLUNTREE_LOGO_PNG_BASE64, "base64"),
    });
    return new Response(Buffer.from(pdf), {
      headers: { "content-type": "application/pdf", "content-disposition": 'inline; filename="certificate-preview.pdf"', "cache-control": "no-store" },
    });
  } catch (e) {
    // The generator explains what's wrong, e.g. a character the certificate font can't show.
    return new Response(e instanceof Error ? e.message : "Couldn't draw the preview.", { status: 400, headers: { "content-type": "text/plain; charset=utf-8" } });
  }
}
