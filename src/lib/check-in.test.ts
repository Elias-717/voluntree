import { describe, expect, it } from "vitest";
import { checkInCode, checkInUrl, minuteOf } from "./check-in";

describe("QR check-in codes (FR-016)", () => {
  const mission = "00000000-0000-4000-c000-000000002004";

  it("changes every minute and stays the same within one", () => {
    const start = Date.UTC(2026, 10, 5, 1, 0, 0);
    expect(minuteOf(start)).toBe(minuteOf(start + 59_000));
    expect(minuteOf(start + 60_000)).toBe(minuteOf(start) + 1);
    expect(checkInCode("s", mission, 100)).not.toBe(checkInCode("s", mission, 101));
  });

  it("depends on the secret and the mission", () => {
    expect(checkInCode("a", mission, 100)).not.toBe(checkInCode("b", mission, 100));
    expect(checkInCode("a", mission, 100)).not.toBe(checkInCode("a", "other", 100));
    expect(checkInCode("a", mission, 100)).toMatch(/^[0-9a-f]{12}$/);
  });

  it("links to the student's check-in screen", () => {
    expect(checkInUrl("https://voluntree-nine.vercel.app", mission, "abc123def456"))
      .toBe(`https://voluntree-nine.vercel.app/student/check-in/${mission}?c=abc123def456`);
  });
});
