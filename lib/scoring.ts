// lib/scoring.ts — fully deterministic scoring engine for FinishLine

export type ScoringInput = {
  distance: string;         // "Super Sprint" | "Sprint" | "Olympic" | "70.3" | "Full Ironman"
  raceDate: string;         // ISO date string "YYYY-MM-DD"
  weeklyHours: number;
  swimLevel: string;        // 'cannot-swim' | 'basic-pool' | 'comfortable-pool' | 'open-water'
  runLevel: string;         // 'non-runner' | 'occasional' | 'regular' | 'competitive'
  bikeLevel: string;        // 'no-bike' | 'casual' | 'regular' | 'competitive'
  workFamilyIntensity: string; // 'Low' | 'Medium' | 'High'
  priorExperience: string;  // 'none' | 'novice' | 'developing' | 'experienced' | 'veteran'
};

export type ScoreComponent = {
  score: number;
  max: number;
  label: string;
};

export type ScoringResult = {
  decision: "REGISTER" | "DEFER";
  confidence: "High" | "Medium" | "Low";
  score: number;
  hardDeferReason: string | null;
scoreBreakdown: {
    timeline: ScoreComponent;    // max 26
    swim: ScoreComponent;        // max 13
    run: ScoreComponent;         // max 13
    bike: ScoreComponent;        // max 9
    lifestyle: ScoreComponent;   // max 26
    experience: ScoreComponent;  // max 13
  };
  distanceInfo: {
    name: string;
    swim: string;
    bike: string;
    run: string;
  };
};

// ─── Distance Definitions ───────────────────────────────────────────────────

export const DISTANCE_INFO: Record<
  string,
  { swim: string; bike: string; run: string }
> = {
  "Super Sprint": {
    swim: "400m / 0.25mi",
    bike: "10km / 6.2mi",
    run: "2.5km / 1.6mi",
  },
  Sprint: {
    swim: "750m / 0.47mi",
    bike: "20km / 12.4mi",
    run: "5km / 3.1mi",
  },
  Olympic: {
    swim: "1.5km / 0.93mi",
    bike: "40km / 24.8mi",
    run: "10km / 6.2mi",
  },
  "70.3": {
    swim: "1.9km / 1.2mi",
    bike: "90km / 56mi",
    run: "21.1km / 13.1mi",
  },
  "Full Ironman": {
    swim: "3.8km / 2.4mi",
    bike: "180km / 112mi",
    run: "42.2km / 26.2mi",
  },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function weeksUntil(raceDate: string): number {
  const race = new Date(raceDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.floor(
    (race.getTime() - today.getTime()) / (7 * 24 * 60 * 60 * 1000)
  );
}

function clamp(value: number, min = 0, max = Infinity): number {
  return Math.max(min, Math.min(max, value));
}

function isLongDistance(distance: string): boolean {
  return distance === "70.3" || distance === "Full Ironman";
}

function isOlympicOrAbove(distance: string): boolean {
  return (
    distance === "Olympic" ||
    distance === "70.3" ||
    distance === "Full Ironman"
  );
}

// ─── Hard Defer Rules ────────────────────────────────────────────────────────

function checkHardDefer(
  input: ScoringInput,
  weeks: number
): string | null {
  const { distance, swimLevel, runLevel, bikeLevel, weeklyHours } = input;

  if (swimLevel === "cannot-swim") {
    return "Cannot swim — swimming is non-negotiable in triathlon.";
  }
  if (weeks < 4) {
    return "Race is fewer than 4 weeks away — insufficient preparation window.";
  }
  if (
    isOlympicOrAbove(distance) &&
    (swimLevel === "basic-pool" || swimLevel === "cannot-swim")
  ) {
    return "Olympic+ distances require open-water swimming comfort.";
  }
  if (
    isLongDistance(distance) &&
    runLevel === "non-runner"
  ) {
    return "70.3/Ironman run legs require a solid running base — 21km or 42km on foot demands consistent run training.";
  }
  if (
    distance === "Full Ironman" &&
    (bikeLevel === "no-bike" || bikeLevel === "casual")
  ) {
    return "Full Ironman requires a strong cycling base — the 180km / 112mi bike leg demands regular long rides.";
  }
  if (weeklyHours < 3 && weeks < 8) {
    return "Less than 3 hours/week training with under 8 weeks to race — critical training deficit for any triathlon distance.";
  }
  return null;
}

// ─── Timeline Scoring (0–30) ─────────────────────────────────────────────────

function scoreTimeline(distance: string, weeks: number): ScoreComponent {
  let score = 0;

  if (distance === "Super Sprint") {
    if (weeks >= 6) score = 30;
    else if (weeks >= 4) score = 15;
    else score = 0;
  } else if (distance === "Sprint") {
    if (weeks >= 12) score = 30;
    else if (weeks >= 8) score = 20;
    else if (weeks >= 6) score = 10;
    else score = 0;
  } else if (distance === "Olympic") {
    if (weeks >= 20) score = 30;
    else if (weeks >= 14) score = 20;
    else if (weeks >= 10) score = 10;
    else score = 0;
  } else if (distance === "70.3") {
    if (weeks >= 30) score = 30;
    else if (weeks >= 20) score = 15;
    else score = 0;
  } else if (distance === "Full Ironman") {
    if (weeks >= 52) score = 30;
    else if (weeks >= 36) score = 15;
    else score = 0;
  }

  const label =
    weeks <= 0
      ? "Race has already passed"
      : `${weeks} week${weeks === 1 ? "" : "s"} to race — ${
          score >= 20
            ? "strong preparation window"
            : score >= 10
            ? "tight but workable window"
            : "very limited preparation window"
        }`;

  return { score, max: 30, label };
}

// ─── Swim Scoring (0–15) ─────────────────────────────────────────────────────

function scoreSwim(distance: string, swimLevel: string): ScoreComponent {
  type SwimMatrix = Record<string, Record<string, number>>;

  const matrix: SwimMatrix = {
    "cannot-swim":     { "Super Sprint": 0,  Sprint: 0,  Olympic: 0,  "70.3": 0,  "Full Ironman": 0  },
    "basic-pool":      { "Super Sprint": 12, Sprint: 0,  Olympic: 0,  "70.3": 0,  "Full Ironman": 0  },
    "comfortable-pool":{ "Super Sprint": 15, Sprint: 8,  Olympic: 0,  "70.3": 0,  "Full Ironman": 0  },
    "open-water":      { "Super Sprint": 15, Sprint: 15, Olympic: 15, "70.3": 15, "Full Ironman": 12 },
  };

  const row = matrix[swimLevel] ?? { [distance]: 0 };
  const score = row[distance] ?? 0;

  const comfortLabels: Record<string, string> = {
    "cannot-swim": "Cannot swim",
    "basic-pool": "Basic pool swimmer",
    "comfortable-pool": "Comfortable pool swimmer",
    "open-water": "Open water swimmer",
  };

  const label = `${comfortLabels[swimLevel] ?? swimLevel} — ${
    score >= 12
      ? "well matched to this distance"
      : score >= 8
      ? "manageable with focused prep"
      : "significant swim gap for this distance"
  }`;

  return { score, max: 15, label };
}

// ─── Run Scoring (0–15) ──────────────────────────────────────────────────────

function scoreRun(distance: string, runLevel: string): ScoreComponent {
  const baseScores: Record<string, number> = {
    "non-runner": 3,
    occasional: 8,
    regular: 12,
    competitive: 15,
  };

  let score = baseScores[runLevel] ?? 0;

  if (isOlympicOrAbove(distance) && runLevel === "non-runner") {
    score -= 5;
  }
  if (isLongDistance(distance) && runLevel === "occasional") {
    score -= 3;
  }

  score = clamp(score, 0, 15);

  const baselineLabels: Record<string, string> = {
    "non-runner": "Non-runner",
    occasional: "Occasional runner",
    regular: "Regular runner",
    competitive: "Competitive runner",
  };

  const label = `${baselineLabels[runLevel] ?? runLevel} — ${
    score >= 12
      ? "solid running base for this distance"
      : score >= 8
      ? "adequate running fitness with training"
      : "running will be the primary challenge"
  }`;

  return { score, max: 15, label };
}

// ─── Cycle Scoring (0–10) ────────────────────────────────────────────────────

function scoreBike(
  distance: string,
  bikeLevel: string
): ScoreComponent {
  const baseScores: Record<string, number> = {
    "no-bike": 0,
    casual: 4,
    regular: 7,
    competitive: 10,
  };

  let score = baseScores[bikeLevel] ?? 0;

  if (isLongDistance(distance) && bikeLevel === "casual") {
    score -= 3;
  }
  if (
    distance === "Full Ironman" &&
    (bikeLevel === "regular" || bikeLevel === "casual" || bikeLevel === "no-bike")
  ) {
    score -= 3;
  }

  score = clamp(score, 0, 10);

  const expLabels: Record<string, string> = {
    "no-bike": "No cycling base",
    casual: "Casual cyclist",
    regular: "Regular cyclist",
    competitive: "Competitive cyclist",
  };

  const label = `${expLabels[bikeLevel] ?? bikeLevel} — ${
    score >= 7
      ? "comfortable on the bike at this distance"
      : score >= 4
      ? "cycling will need focused attention"
      : "significant cycling gap for this distance"
  }`;

  return { score, max: 10, label };
}

// ─── Lifestyle Scoring (0–30) ────────────────────────────────────────────────

function scoreLifestyle(
  distance: string,
  weeklyHours: number,
  workFamilyIntensity: string
): ScoreComponent {
  let score: number;
  if (weeklyHours >= 11) score = 30;
  else if (weeklyHours >= 7) score = 22;
  else if (weeklyHours >= 4) score = 15;
  else score = 5;

  if (workFamilyIntensity === "High") score -= 8;
  else if (workFamilyIntensity === "Medium") score -= 3;

  if (distance === "Olympic" && weeklyHours < 7) score -= 5;
  if (distance === "70.3" && weeklyHours < 10) score -= 8;
  if (distance === "Full Ironman" && weeklyHours < 15) score -= 12;

  score = clamp(score, 0, 30);

  const intensityLabel =
    workFamilyIntensity === "High"
      ? "high life load"
      : workFamilyIntensity === "Medium"
      ? "moderate life load"
      : "manageable life load";

  const label = `${weeklyHours} hrs/week, ${intensityLabel} — ${
    score >= 22
      ? "lifestyle well-suited to training demands"
      : score >= 12
      ? "workable with disciplined scheduling"
      : "lifestyle will be a significant constraint"
  }`;

  return { score, max: 30, label };
}


// ─── Experience Scoring (0–13) ───────────────────────────────────────────────

function scoreExperience(priorExperience: string): ScoreComponent {
  const scores: Record<string, number> = {
    "none":        0,
    "novice":      4,
    "developing":  7,
    "experienced": 10,
    "veteran":     13,
  };
  const score = scores[priorExperience] ?? 0;
  const labels: Record<string, string> = {
    "none":        "First-timer — no prior triathlon race experience",
    "novice":      "Getting started — 1–2 triathlons completed",
    "developing":  "Building experience — 3–5 races, Sprint or Olympic",
    "experienced": "Seasoned racer — 6+ Sprints/Olympics or 1–2 Half-Irons",
    "veteran":     "Veteran — 3+ Half-Irons or an Ironman finish",
  };
  return {
    score,
    max: 13,
    label: labels[priorExperience] ?? "Unknown experience level",
  };
}

// ─── Main Export ─────────────────────────────────────────────────────────────

export function calculateReadiness(input: ScoringInput): ScoringResult {
  const {
    distance,
    raceDate,
    weeklyHours,
    swimLevel,
    runLevel,
    bikeLevel,
    workFamilyIntensity,
  } = input;

  const weeks = weeksUntil(raceDate);

  // Check hard defers first
  const hardDeferReason = checkHardDefer(input, weeks);

  // Score all components regardless (used for display even on hard defer)
  const timeline = scoreTimeline(distance, weeks);
  const swim = scoreSwim(distance, swimLevel);
  const run = scoreRun(distance, runLevel);
  const bike = scoreBike(distance, bikeLevel);
  const lifestyle = scoreLifestyle(distance, weeklyHours, workFamilyIntensity);
  const experience = scoreExperience(input.priorExperience);

  const score = timeline.score + swim.score + run.score + bike.score + lifestyle.score + experience.score;

  // Distance info
  const distanceDef = DISTANCE_INFO[distance] ?? {
    swim: "—",
    bike: "—",
    run: "—",
  };
  const distanceInfo = { name: distance, ...distanceDef };

  // Hard defer overrides everything
  if (hardDeferReason) {
    return {
      decision: "DEFER",
      confidence: "High",
      score,
      hardDeferReason,
      scoreBreakdown: { timeline, swim, run, bike, lifestyle, experience },
      distanceInfo,
    };
  }

  // Apply decision thresholds
  let decision: "REGISTER" | "DEFER";
  let confidence: "High" | "Medium" | "Low";

  if (score >= 70) {
    decision = "REGISTER";
    confidence = "High";
  } else if (score >= 52) {
    decision = "REGISTER";
    confidence = "Medium";
  } else if (score >= 38) {
    decision = "DEFER";
    confidence = "Medium";
  } else {
    decision = "DEFER";
    confidence = "High";
  }

  return {
    decision,
    confidence,
    score,
    hardDeferReason: null,
    scoreBreakdown: { timeline, swim, run, bike, lifestyle, experience },
    distanceInfo,
  };
}
