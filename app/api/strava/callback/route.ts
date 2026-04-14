// Handles OAuth callback from Strava, fetches activities, runs mapper

import { NextRequest, NextResponse } from 'next/server';
import { mapStravaToScoringInput } from '@/lib/strava/mapper';
import { StravaActivity, StravaAthlete } from '@/lib/strava/types';

const ACTIVITIES_PER_PAGE = 100;
const LOOKBACK_DAYS = 730; // 2 years — matches SWIM_LOOKBACK_WEEKS

async function exchangeToken(code: string): Promise<{ access_token: string }> {
  const res = await fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      code,
      grant_type: 'authorization_code',
    }),
  });

  if (!res.ok) {
    throw new Error('Failed to exchange Strava auth code for token');
  }

  return res.json();
}

async function fetchAthlete(accessToken: string): Promise<StravaAthlete> {
  const res = await fetch('https://www.strava.com/api/v3/athlete', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) throw new Error('Failed to fetch Strava athlete profile');
  return res.json();
}

async function fetchActivities(accessToken: string): Promise<StravaActivity[]> {
  const after = Math.floor((Date.now() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000) / 1000);
  const allActivities: StravaActivity[] = [];
  let page = 1;

  while (true) {
    const res = await fetch(
      `https://www.strava.com/api/v3/athlete/activities?after=${after}&per_page=${ACTIVITIES_PER_PAGE}&page=${page}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!res.ok) throw new Error('Failed to fetch Strava activities');

    const activities: StravaActivity[] = await res.json();
    if (activities.length === 0) break;

    allActivities.push(...activities);
    if (activities.length < ACTIVITIES_PER_PAGE) break;
    page++;
  }

  return allActivities;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  // User denied access
  if (error || !code) {
    return NextResponse.redirect(
      new URL('/evaluate?strava=denied', req.url)
    );
  }

  try {
    const { access_token } = await exchangeToken(code);
    const [athlete, activities] = await Promise.all([
      fetchAthlete(access_token),
      fetchActivities(access_token),
    ]);

    const mapped = mapStravaToScoringInput({
      activities,
      athlete,
      fetchedAt: new Date().toISOString(),
    });

    // Store mapped result in a short-lived cookie and redirect to form
    const response = NextResponse.redirect(
      new URL('/evaluate?strava=connected', req.url)
    );

    response.cookies.set('strava_mapped', JSON.stringify(mapped), {
      httpOnly: false, // needs to be readable by client JS to pre-fill form
      maxAge: 300,     // 5 minutes — just enough to fill the form
      path: '/',
      sameSite: 'lax',
    });

    return response;
  } catch (err) {
    console.error('Strava callback error:', err);
    return NextResponse.redirect(
      new URL('/evaluate?strava=error', req.url)
    );
  }
}
