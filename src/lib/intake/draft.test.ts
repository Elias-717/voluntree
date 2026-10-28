import { describe, expect, it } from "vitest";
import { blanksOf, buildPrompt, DraftSchema, redact } from "./draft";

describe("LLM intake (FR-023)", () => {
  it("strips emails and phone numbers before sending (open question 8)", () => {
    const out = redact("Contact aisha.r@student.aiu.edu.my or +60 12-345 6789, or call 04 928 4000.");
    expect(out).toBe("Contact [email] or [phone], or call [phone].");
  });

  it("keeps dates, times and slot numbers", () => {
    expect(redact("Sat 7 Nov, 09:00 to 12:00, 10 volunteers needed")).toBe("Sat 7 Nov, 09:00 to 12:00, 10 volunteers needed");
  });

  it("asks for nulls instead of guesses and includes today's date", () => {
    const prompt = buildPrompt("Beach clean-up next Saturday", "2026-10-29");
    expect(prompt).toContain("Today is 2026-10-29");
    expect(prompt).toContain("Never guess");
    expect(prompt).toContain("Beach clean-up next Saturday");
  });

  it("accepts a valid draft and flags its blanks", () => {
    const draft = DraftSchema.parse({
      title: "Beach Clean-Up", description: null, place: "Pantai Merdeka", skills: ["teamwork"],
      date: "2026-10-31", start: "08:00", end: null, capacity: null,
    });
    expect(blanksOf(draft)).toEqual(["Description", "End", "Slots"]);
  });

  it("rejects malformed model output", () => {
    expect(DraftSchema.safeParse({ title: "x", description: null, place: null, skills: [], date: "31/10/2026", start: null, end: null, capacity: null }).success).toBe(false);
    expect(DraftSchema.safeParse({ title: "x", description: null, place: null, skills: [], date: null, start: "25:00", end: null, capacity: null }).success).toBe(false);
    expect(DraftSchema.safeParse({ title: "x", description: null, place: null, skills: [], date: null, start: null, end: null, capacity: 2.5 }).success).toBe(false);
  });
});
