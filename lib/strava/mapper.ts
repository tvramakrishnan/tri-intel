// lib/strava/mapper.ts
// Translates raw Strava activity data into Finish Line scoring engine enums.
// Pure logic — no API calls. 12-week lookback for sport levels, 4-week for weekly hours.

import { StravaActivity, StravaMapperInput, StravaMapperOutput } from './types';

const SPORT_LOOKBACK_WEEKS = 12;
const HOURS_LOOKBACK_WEEKS = 4;

// Activity types Strava uses
const SWIM_TYPES = ['Swim', 'Open Water Swimming'];
const OPEN_WATER_TYPES = ['Open Water Swimming'];
const RIDE_TYPES = ['Ride', 'VirtualRide', 'MountainBikeRide', 'GravelRide', 'EBikeRide'];
const RUN_TYPES = ['Run', 'TrailRun', 'VirtualRun', 'Treadmill'];

function weeksAgo(weeks: number, from: Date): Date {
  const d = new Date(from);
  d.setDate(d.getDate() - weeks * 7);
  return d;
}

function filterByWindow(activities: StravaActivity[], weeks: number, from: Date): StravaActivity[] {
  const cutoff = weeksAgo(weeks, from);
  return activities.filter(a => new Date(a.start_date) >= cutoff);
}

function avgWeeklyCount(activities: StravaActivity[], weeks: number): number {
  return activities.length / weeks;
}

function avgWeeklyMinutes(activities: StravaActivity[], weeks: number): number {
  const totalSeconds = activities.reduce((sum, a) => sum + a.elapsed_time, 0);
  return (totalSeconds / 60) / weeks;
}

// ─── Individual sport mappers ────────────────────────────────────────────────

function mapSwimLevel(activities: StravaActivity[]): StravaMapperOutput['swimLevel'] {
  const swims = activities.filter(a => SWIM_TYPES.includes(a.type));
  const openWaterSwims = activities.filter(a => OPEN_WATER_TYPES.includes(a.type));

  if (openWaterSwims.length >= 1) return 'open-water';
  if (swims.length >= 4) return 'comfortable-pool';
  if (swims.length >= 1) return 'basic-pool';
  return 'basic-pool'; // never assume cannot-swim from missing data — user confirms
}

function mapBikeLevel(activities: StravaActivity[], weeks: number): StravaMapperOutput['bikeLevel'] {
  const rides = activities.filter(a => RIDE_TYPES.includes(a.type));
  const weeklyCount = avgWeeklyCount(rides, weeks);
  const weeklyMins = avgWeeklyMinutes(rides, weeks);

  const hasLongRide = rides.some(a => a.distance > 90000);

  if (hasLongRide || weeklyMins >= 300) return 'competitive';
  if (weeklyCount >= 2.5 || weeklyMins >= 150) return 'regular';
  if (weeklyCount >= 0.5 || weeklyMins >= 30) return 'casual';
  return 'no-bike';
}

function mapRunLevel(activities: StravaActivity[], weeks: number): StravaMapperOutput['runLevel'] {
  const runs = activities.filter(a => RUN_TYPES.includes(a.type));
  const weeklyCount = avgWeeklyCount(runs, weeks);
  const weeklyMins = avgWeeklyMinutes(runs, weeks);

  const runsWithPace = runs.filter(a => a.average_speed > 0);
  const avgSpeed = runsWithPace.length > 0
    ? runsWithPace.reduce((sum, a) => sum + a.average_speed, 0) / runsWithPace.length
    : 0;
  const isCompetitivePace = avgSpeed >= 3.5;

  if (isCompetitivePace && weeklyCount >= 3) return 'competitive';
  if (weeklyCount >= 2.5 || weeklyMins >= 90) return 'regular';
  if (weeklyCount >= 0.5 || weeklyMins >= 20) return 'occasional';
  return 'non-runner';
}

function mapWeeklyHours(activities: StravaActivity[], weeks: number): number {
  const totalSeconds = activities.reduce((sum, a) => sum + a.elapsed_time, 0);
  const avgHours = (totalSeconds / 3600) / weeks;
  // Round to nearest 0.5
  return Math.round(avgHours * 2) / 2;
}

// ─── Confidence scoring ──────────────────────────────────────────────────────

function assessConfidence(
  activities: StravaActivity[],
  windowWeeks: number
): { confidence: StravaMapperOutput['confidence']; reason: string } {
  const weeksWithActivity = new Set(
    activities.map(a => {
      const d = new Date(a.start_date);
      return `${d.getFullYear()}-W${Math.ceil(d.getDate() / 7)}`;
    })
  ).size;

  const coverageRatio = weeksWithActivity / windowWeeks;

  if (coverageRatio >= 0.6) {
    return { confidence: 'high', reason: 'Consistent activity data across the training window' };
  }
  if (coverageRatio >= 0.3) {
    return {
      confidence: 'medium',
      reason: 'Moderate activity data — some gaps in training history detected'
    };
  }
  return {
    confidence: 'low',
    reason: 'Limited activity data found. These suggestions may not reflect your current fitness — please review and adjust'
  };
}

// ─── Main export ─────────────────────────────────────────────────────────────

export function mapStravaToScoringInput(input: StravaMapperInput): StravaMapperOutput {
  const now = new Date(input.fetchedAt);

  const sportWindow = filterByWindow(input.activities, SPORT_LOOKBACK_WEEKS, now);
  const hoursWindow = filterByWindow(input.activities, HOURS_LOOKBACK_WEEKS, now);

  const swimLevel = mapSwimLevel(sportWindow);
  const bikeLevel = mapBikeLevel(sportWindow, SPORT_LOOKBACK_WEEKS);
  const runLevel  = mapRunLevel(sportWindow, SPORT_LOOKBACK_WEEKS);
  const weeklyHours = mapWeeklyHours(hoursWindow, HOURS_LOOKBACK_WEEKS);

  const { confidence, reason } = assessConfidence(sportWindow, SPORT_LOOKBACK_WEEKS);

  return {
    swimLevel,
    bikeLevel,
    runLevel,
    weeklyHours,
    confidence,
    confidenceReason: reason,
    dataWindowWeeks: SPORT_LOOKBACK_WEEKS,
  };
}
