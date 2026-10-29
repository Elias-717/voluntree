// QR check-in codes (FR-016, DEC-052). Must match public.check_in_code in the database:
// the first 12 hex characters of HMAC-SHA256(secret, "<mission id>:<minute>"). The code changes
// every minute; the database also accepts the previous minute's code.

import { createHmac } from "node:crypto";

export const CODE_SECONDS = 60;

export function minuteOf(time: number): number {
  return Math.floor(time / 1000 / CODE_SECONDS);
}

export function checkInCode(secret: string, missionId: string, minute: number): string {
  return createHmac("sha256", secret).update(`${missionId}:${minute}`).digest("hex").slice(0, 12);
}

/** The link inside the QR. Scanning it with the phone camera opens the student's check-in screen. */
export function checkInUrl(origin: string, missionId: string, code: string): string {
  return `${origin}/student/check-in/${missionId}?c=${code}`;
}
