// lib/evals/eval-runner.ts
// Run: npx tsx lib/evals/eval-runner.ts
import * as fs from "fs";
import * as path from "path";
import { calculateReadiness, ScoringInput } from "../scoring";

// ─── Types ────────────────────────────────────────────────────────────────────

interface EvalInputFields {
  distance: string;
  swimLevel: string;
  runLevel: string;
  bikeLevel: string;
  weeklyHours: number;
  priorExperience: string;
  workFamilyIntensity: string;
}

interface EvalCase {
  id: string;
  persona: string;
  description: string;
  weeks: number;
  input: EvalInputFields;
  expected_verdict: "REGISTER" | "DEFER";
  expected_confidence: "High" | "Medium" | "Low";
  expected_mechanism: string;
  will_fail: boolean;
  notes: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getRaceDate(weeks: number): string {
  const d = new Date();
  d.setDate(d.getDate() + weeks * 7);
  return d.toISOString().slice(0, 10);
}

function pad(s: string, n: number): string {
  return s.padEnd(n);
}

const RESET  = "\x1b[0m";
const GREEN  = "\x1b[32m";
const RED    = "\x1b[31m";
const YELLOW = "\x1b[33m";
const DIM    = "\x1b[2m";
const BOLD   = "\x1b[1m";

// ─── Main ─────────────────────────────────────────────────────────────────────

const datasetPath = path.join(__dirname, "eval-dataset.json");
const cases: EvalCase[] = JSON.parse(fs.readFileSync(datasetPath, "utf-8"));

console.log(`\n${BOLD}FinishLine Scoring Eval — ${cases.length} cases${RESET}`);
console.log("─".repeat(72));

let passes = 0;
let expectedFailures = 0;  // will_fail=true and indeed fails
let bonusPasses = 0;        // will_fail=true but actually passes
let unexpectedFailures = 0; // will_fail=false but fails

const unexpectedFailureDetails: string[] = [];
const bonusPassDetails: string[] = [];
const knownGapDetails: string[] = [];

for (const c of cases) {
  const input: ScoringInput = {
    ...c.input,
    raceDate: getRaceDate(c.weeks),
  };

  const result = calculateReadiness(input);

  const verdictMatch     = result.decision   === c.expected_verdict;
  const confidenceMatch  = result.confidence === c.expected_confidence;
  const passed           = verdictMatch && confidenceMatch;

  const actualLabel   = `${result.decision}/${result.confidence}`;
  const expectedLabel = `${c.expected_verdict}/${c.expected_confidence}`;

  if (passed) {
    if (c.will_fail) {
      // expected to fail but passed — bonus
      bonusPasses++;
      const line = `${GREEN}✅ BONUS${RESET} ${pad(c.id, 6)} ${DIM}[${c.persona.split(",")[0]}]${RESET} ${actualLabel} ${DIM}— expected to fail but passed${RESET}`;
      console.log(line);
      bonusPassDetails.push(`  ${c.id}: ${c.description}`);
    } else {
      passes++;
      const mechanism = c.expected_mechanism ? `  ${DIM}(${c.expected_mechanism})${RESET}` : "";
      console.log(`${GREEN}✅${RESET} ${pad(c.id, 6)} ${DIM}[${c.persona.split(",")[0]}]${RESET} ${pad(actualLabel, 16)}${mechanism}`);
    }
  } else {
    if (c.will_fail) {
      // known gap
      expectedFailures++;
      const line = `${YELLOW}⚠️  KNOWN${RESET} ${pad(c.id, 6)} ${DIM}[${c.persona.split(",")[0]}]${RESET} Expected ${expectedLabel} → Got ${actualLabel}`;
      console.log(line);
      knownGapDetails.push(`  ${c.id}: Expected ${expectedLabel} → Got ${actualLabel}  (${c.notes})`);
    } else {
      // unexpected failure
      unexpectedFailures++;
      const line = `${RED}❌ FAIL  ${RESET} ${pad(c.id, 6)} ${DIM}[${c.persona.split(",")[0]}]${RESET} Expected ${expectedLabel} → Got ${actualLabel}`;
      console.log(line);
      const scoreInfo = `score=${result.score}${result.hardDeferReason ? `, hardDefer="${result.hardDeferReason.slice(0, 60)}…"` : ""}`;
      unexpectedFailureDetails.push(`  ${c.id}: Expected ${expectedLabel} → Got ${actualLabel}  [${scoreInfo}]`);
      if (c.notes) unexpectedFailureDetails.push(`       note: ${c.notes}`);
    }
  }
}

// ─── Summary ─────────────────────────────────────────────────────────────────

console.log("─".repeat(72));

const cleanPasses = passes + bonusPasses;
const total       = cases.length;
const pct         = Math.round((cleanPasses / total) * 100);

console.log(
  `\n${BOLD}Results:${RESET}  ${GREEN}${cleanPasses}/${total} passed${RESET} (${pct}%)` +
  `  |  known gaps: ${YELLOW}${expectedFailures}${RESET}` +
  `  |  unexpected failures: ${unexpectedFailures > 0 ? RED : ""}${unexpectedFailures}${RESET}`
);

if (bonusPassDetails.length > 0) {
  console.log(`\n${BOLD}${GREEN}Bonus passes (will_fail=true but passed — consider updating dataset):${RESET}`);
  bonusPassDetails.forEach((l) => console.log(l));
}

if (knownGapDetails.length > 0) {
  console.log(`\n${BOLD}${YELLOW}Known gaps (calibration findings — expected):${RESET}`);
  knownGapDetails.forEach((l) => console.log(l));
}

if (unexpectedFailureDetails.length > 0) {
  console.log(`\n${BOLD}${RED}Unexpected failures (action required):${RESET}`);
  unexpectedFailureDetails.forEach((l) => console.log(l));
}

console.log();
