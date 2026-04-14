// lib/strava/types.ts
// Strava API response types for Finish Line mapper

export interface StravaActivity {
  id: number;
  name: string;
  type: string;                  // 'Run' | 'Ride' | 'Swim' | 'Open Water Swimming' etc.
  sport_type: string;
  start_date: string;            // ISO date string
  elapsed_time: number;          // seconds
  moving_time: number;           // seconds
  distance: number;              // meters
  average_speed: number;         // meters/second
  average_heartrate?: number;
}

export interface StravaAthlete {
  id: number;
  firstname: string;
  lastname: string;
  measurement_preference: 'feet' | 'meters';
}

export interface StravaMapperInput {
  activities: StravaActivity[];
  athlete: StravaAthlete;
  fetchedAt: string;             // ISO date string — when data was pulled
}

export interface StravaMapperOutput {
  swimLevel: 'cannot-swim' | 'basic-pool' | 'comfortable-pool' | 'open-water';
  bikeLevel: 'no-bike' | 'casual' | 'regular' | 'competitive';
  runLevel: 'non-runner' | 'occasional' | 'regular' | 'competitive';
  weeklyHours: number;
  confidence: 'high' | 'medium' | 'low';
  confidenceReason: string;      // human-readable explanation of confidence level
  dataWindowWeeks: number;       // how many weeks of data were available
}
