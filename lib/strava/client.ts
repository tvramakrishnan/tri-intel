// Client-side helper to read and clear the Strava mapped cookie

import { StravaMapperOutput } from './types';

export function readStravaMappedCookie(): StravaMapperOutput | null {
  if (typeof document === 'undefined') return null;

  const match = document.cookie
    .split('; ')
    .find(row => row.startsWith('strava_mapped='));

  if (!match) return null;

  try {
    const value = decodeURIComponent(match.split('=').slice(1).join('='));
    return JSON.parse(value) as StravaMapperOutput;
  } catch {
    return null;
  }
}

export function clearStravaMappedCookie(): void {
  if (typeof document === 'undefined') return;
  document.cookie = 'strava_mapped=; Max-Age=0; path=/';
}
