/** The two-step onboarding progress bar at the top of screens 2 and 3. */
export function Progress({ step }: { step: 1 | 2 }) {
  return (
    <div className="flex gap-1.5" aria-label={`Step ${step} of 2`}>
      <span className="h-1 flex-1 rounded-full bg-primary" />
      <span className={`h-1 flex-1 rounded-full ${step === 2 ? "bg-primary" : "bg-gauge-empty"}`} />
    </div>
  );
}
