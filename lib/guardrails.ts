export type GuardResult =
  | { valid: true }
  | { valid: false; error: string };

export function validateInput(input: Record<string, unknown>): GuardResult {
  const weeklyHours = input.weeklyHours as number | undefined;
  const raceDate = input.raceDate as string | undefined;

  // 1. weeklyHours > 168
  if (typeof weeklyHours === "number" && weeklyHours > 168) {
    return {
      valid: false,
      error: "Weekly training hours can't exceed 168 (there are only 168 hours in a week)",
    };
  }

  // 2. weeklyHours < 0
  if (typeof weeklyHours === "number" && weeklyHours < 0) {
    return {
      valid: false,
      error: "Weekly training hours can't be negative",
    };
  }

  // 3. raceDate is in the past by more than 30 days
  if (typeof raceDate === "string" && raceDate) {
    const race = new Date(raceDate);
    const now = new Date();
    const diffMs = now.getTime() - race.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    if (diffDays > 30) {
      return {
        valid: false,
        error: "Race date appears to be in the past. Please check your date and try again",
      };
    }

    // 4. raceDate year before 2020
    if (race.getFullYear() < 2020) {
      return {
        valid: false,
        error: "Race date doesn't look right — please enter a future race date",
      };
    }
  }

  // 5 & 6. Prompt injection checks on all string fields
  for (const value of Object.values(input)) {
    if (typeof value !== "string") continue;
    const lower = value.toLowerCase();

    if (lower.includes("ignore") && lower.includes("instructions")) {
      return { valid: false, error: "Input contains invalid content" };
    }

    if (lower.includes("ignore all previous")) {
      return { valid: false, error: "Input contains invalid content" };
    }
  }

  return { valid: true };
}
