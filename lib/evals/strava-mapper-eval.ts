// lib/evals/strava-mapper-eval.ts
// Run: npx tsx lib/evals/strava-mapper-eval.ts

import { mapStravaToScoringInput } from '../strava/mapper';
import { StravaMapperInput, StravaActivity } from '../strava/types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const BOLD  = "\x1b[1m";
const GREEN = "\x1b[32m";
const RED   = "\x1b[31m";
const DIM   = "\x1b[2m";
const RESET = "\x1b[0m";

function daysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

function makeActivity(
  type: string,
  daysBack: number,
  elapsedSeconds: number,
  distanceMeters: number = 0,
  avgSpeed: number = 0
): StravaActivity {
  return {
    id: Math.floor(Math.random() * 100000),
    name: `${type} activity`,
    type,
    sport_type: type,
    start_date: daysAgo(daysBack),
    elapsed_time: elapsedSeconds,
    moving_time: elapsedSeconds,
    distance: distanceMeters,
    average_speed: avgSpeed,
  };
}

const BASE_ATHLETE = {
  id: 12345,
  firstname: 'Test',
  lastname: 'Athlete',
  measurement_preference: 'meters' as const,
};

// ─── Test Cases ───────────────────────────────────────────────────────────────

interface EvalCase {
  id: string;
  description: string;
  input: StravaMapperInput;
  expected: {
    swimLevel: string;
    bikeLevel: string;
    runLevel: string;
    weeklyHours: number;
    confidence: string;
  };
}

const cases: EvalCase[] = [
  {
    id: 'SM-01',
    description: 'Active triathlete — swim/bike/run 3x week, open water swims',
    input: {
      athlete: BASE_ATHLETE,
      fetchedAt: new Date().toISOString(),
      activities: [
        // Swims — open water
        makeActivity('Open Water Swimming', 10, 2700, 1500),
        makeActivity('Open Water Swimming', 24, 3000, 1800),
        // Rides — regular
        makeActivity('Ride', 5,  4500, 40000, 4.0),
        makeActivity('Ride', 12, 4500, 40000, 4.0),
        makeActivity('Ride', 19, 5400, 50000, 4.2),
        makeActivity('Ride', 26, 4500, 40000, 4.0),
        makeActivity('Ride', 33, 4500, 40000, 4.0),
        // Runs — regular
        makeActivity('Run', 7,  3600, 10000, 2.8),
        makeActivity('Run', 14, 3600, 10000, 2.8),
        makeActivity('Run', 21, 3600, 10000, 2.8),
        makeActivity('Run', 28, 3600, 10000, 2.8),
        makeActivity('Run', 35, 3600, 10000, 2.8),
      ],
    },
    expected: { swimLevel: 'open-water', bikeLevel: 'casual', runLevel: 'occasional', weeklyHours: 2.5, confidence: 'medium' },
  },
  {
    id: 'SM-02',
    description: 'Inconsistent trainer — Ramki profile — sparse weeks, few swims',
    input: {
      athlete: BASE_ATHLETE,
      fetchedAt: new Date().toISOString(),
      activities: [
        makeActivity('Open Water Swimming', 45, 2400, 1200),
        makeActivity('Ride', 8,  3600, 30000, 3.5),
        makeActivity('Ride', 22, 4500, 40000, 4.0),
        makeActivity('Run',  6,  2700, 7000, 2.6),
        makeActivity('Run',  18, 2700, 7000, 2.6),
        makeActivity('Run',  30, 3600, 9000, 2.5),
      ],
    },
    expected: { swimLevel: 'open-water', bikeLevel: 'no-bike', runLevel: 'non-runner', weeklyHours: 1, confidence: 'medium' },
  },
  {
    id: 'SM-03',
    description: 'Pool swimmer only — no open water',
    input: {
      athlete: BASE_ATHLETE,
      fetchedAt: new Date().toISOString(),
      activities: [
        makeActivity('Swim', 7,  2700, 1500),
        makeActivity('Swim', 14, 2700, 1500),
        makeActivity('Swim', 21, 2700, 1500),
        makeActivity('Swim', 28, 2700, 1500),
        makeActivity('Swim', 35, 2700, 1500),
        makeActivity('Run',  5,  3600, 10000, 2.8),
        makeActivity('Run',  12, 3600, 10000, 2.8),
        makeActivity('Ride', 10, 4500, 40000, 4.0),
        makeActivity('Ride', 17, 4500, 40000, 4.0),
      ],
    },
    expected: { swimLevel: 'comfortable-pool', bikeLevel: 'no-bike', runLevel: 'non-runner', weeklyHours: 2, confidence: 'medium' },
  },
  {
    id: 'SM-04',
    description: 'Runner only — no swim or bike data',
    input: {
      athlete: BASE_ATHLETE,
      fetchedAt: new Date().toISOString(),
      activities: [
        makeActivity('Run', 3,  3600, 10000, 2.8),
        makeActivity('Run', 10, 3600, 10000, 2.8),
        makeActivity('Run', 17, 3600, 10000, 2.8),
        makeActivity('Run', 24, 3600, 10000, 2.8),
        makeActivity('Run', 31, 3600, 10000, 2.8),
        makeActivity('Run', 38, 3600, 10000, 2.8),
      ],
    },
    expected: { swimLevel: 'basic-pool', bikeLevel: 'no-bike', runLevel: 'occasional', weeklyHours: 1, confidence: 'medium' },
  },
  {
    id: 'SM-05',
    description: 'Zero activities — empty Strava account',
    input: {
      athlete: BASE_ATHLETE,
      fetchedAt: new Date().toISOString(),
      activities: [],
    },
    expected: { swimLevel: 'basic-pool', bikeLevel: 'no-bike', runLevel: 'non-runner', weeklyHours: 0, confidence: 'low' },
  },
  {
    id: 'SM-06',
    description: 'Competitive cyclist — long rides, fast pace',
    input: {
      athlete: BASE_ATHLETE,
      fetchedAt: new Date().toISOString(),
      activities: [
        makeActivity('Ride', 5,  10800, 100000, 4.5),
        makeActivity('Ride', 12, 10800, 100000, 4.5),
        makeActivity('Ride', 19, 10800, 100000, 4.5),
        makeActivity('Ride', 26, 10800, 100000, 4.5),
        makeActivity('Ride', 33, 10800, 100000, 4.5),
        makeActivity('Run',  8,  2700, 7000, 2.5),
        makeActivity('Swim', 15, 2700, 1500),
      ],
    },
    expected: { swimLevel: 'basic-pool', bikeLevel: 'competitive', runLevel: 'non-runner', weeklyHours: 3.5, confidence: 'medium' },
  },
  {
    id: 'SM-07',
    description: 'High volume — all three sports regularly, high confidence',
    input: {
      athlete: BASE_ATHLETE,
      fetchedAt: new Date().toISOString(),
      activities: [
        makeActivity('Swim', 4,  3600, 2000), makeActivity('Swim', 11, 3600, 2000),
        makeActivity('Swim', 18, 3600, 2000), makeActivity('Swim', 25, 3600, 2000),
        makeActivity('Swim', 32, 3600, 2000), makeActivity('Swim', 39, 3600, 2000),
        makeActivity('Ride', 6,  5400, 50000, 4.0), makeActivity('Ride', 13, 5400, 50000, 4.0),
        makeActivity('Ride', 20, 5400, 50000, 4.0), makeActivity('Ride', 27, 5400, 50000, 4.0),
        makeActivity('Ride', 34, 5400, 50000, 4.0), makeActivity('Ride', 41, 5400, 50000, 4.0),
        makeActivity('Run',  8,  3600, 10000, 2.8), makeActivity('Run', 15, 3600, 10000, 2.8),
        makeActivity('Run',  22, 3600, 10000, 2.8), makeActivity('Run', 29, 3600, 10000, 2.8),
        makeActivity('Run',  36, 3600, 10000, 2.8), makeActivity('Run', 43, 3600, 10000, 2.8),
      ],
    },
    expected: { swimLevel: 'comfortable-pool', bikeLevel: 'casual', runLevel: 'occasional', weeklyHours: 3.5, confidence: 'medium' },
  },
  {
    id: 'SM-08',
    description: 'Recent only — all activity in last 4 weeks, nothing older',
    input: {
      athlete: BASE_ATHLETE,
      fetchedAt: new Date().toISOString(),
      activities: [
        makeActivity('Run',  5,  3600, 10000, 2.8),
        makeActivity('Run',  12, 3600, 10000, 2.8),
        makeActivity('Ride', 8,  4500, 40000, 4.0),
        makeActivity('Swim', 10, 2700, 1500),
      ],
    },
    expected: { swimLevel: 'basic-pool', bikeLevel: 'no-bike', runLevel: 'non-runner', weeklyHours: 1, confidence: 'low' },
  },
];

// ─── Runner ───────────────────────────────────────────────────────────────────

console.log(`\n${BOLD}Strava Mapper Eval — ${cases.length} cases${RESET}`);
console.log('─'.repeat(64));

let passes = 0;
let failures = 0;

for (const c of cases) {
  const result = mapStravaToScoringInput(c.input);

  const swimOk  = result.swimLevel   === c.expected.swimLevel;
  const bikeOk  = result.bikeLevel   === c.expected.bikeLevel;
  const runOk   = result.runLevel    === c.expected.runLevel;
  const hoursOk = result.weeklyHours === c.expected.weeklyHours;
  const confOk  = result.confidence  === c.expected.confidence;

  const passed = swimOk && bikeOk && runOk && hoursOk && confOk;

  if (passed) {
    passes++;
    console.log(`${GREEN}✅ PASS${RESET} ${c.id} ${DIM}${c.description}${RESET}`);
  } else {
    failures++;
    console.log(`${RED}❌ FAIL${RESET} ${c.id} ${c.description}`);
    if (!swimOk)  console.log(`  swim:  expected ${c.expected.swimLevel}  got ${result.swimLevel}`);
    if (!bikeOk)  console.log(`  bike:  expected ${c.expected.bikeLevel}  got ${result.bikeLevel}`);
    if (!runOk)   console.log(`  run:   expected ${c.expected.runLevel}  got ${result.runLevel}`);
    if (!hoursOk) console.log(`  hours: expected ${c.expected.weeklyHours}  got ${result.weeklyHours}`);
    if (!confOk)  console.log(`  conf:  expected ${c.expected.confidence}  got ${result.confidence}`);
  }
}

console.log('─'.repeat(64));
console.log(`\n${BOLD}${passes}/${cases.length} passed${RESET}`);
if (failures === 0) {
  console.log(`${GREEN}All mapper cases passing.${RESET}\n`);
} else {
  console.log(`${RED}${failures} failure(s) — review thresholds above.${RESET}\n`);
}
