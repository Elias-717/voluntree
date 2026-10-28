// Certificate PDF download (FR-010). The database decides who may download and rejects revoked
// certificates (get_certificate_for_download); the PDF is drawn by Khathera's generator.

import { generateCertificatePdf } from "@/lib/certificate/certificate";
import { createClient } from "@/lib/db/server";

export async function GET(_request: Request, { params }: RouteContext<"/certificates/[id]">) {
  const { id } = await params;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_certificate_for_download", { p_certificate_id: id }).single();

  if (error || !data) {
    const code = error?.message.split(":")[0];
    const status = code === "CERTIFICATE_REVOKED" ? 410 : code === "FORBIDDEN" ? 403 : 404;
    const text = code === "CERTIFICATE_REVOKED" ? "This certificate was revoked and can't be downloaded." : "Certificate not found.";
    return new Response(text, { status, headers: { "content-type": "text/plain; charset=utf-8" } });
  }

  const row = data as { serial: string; student_name: string; mission_title: string; mission_date: string };
  const pdf = await generateCertificatePdf({
    studentName: row.student_name,
    missionTitle: row.mission_title,
    date: row.mission_date,
    certificateId: row.serial,
  });
  return new Response(Buffer.from(pdf), {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `attachment; filename="voluntree-${row.serial}.pdf"`,
      "cache-control": "private, no-store",
    },
  });
}
