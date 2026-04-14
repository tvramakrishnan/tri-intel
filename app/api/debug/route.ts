import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    hasAnthropicKey: !!process.env.ANTHROPIC_API_KEY,
    anthropicKeyPrefix: process.env.ANTHROPIC_API_KEY?.slice(0, 10) ?? 'missing',
    hasStravaClientId: !!process.env.STRAVA_CLIENT_ID,
    hasStravaSecret: !!process.env.STRAVA_CLIENT_ID,
    nodeEnv: process.env.NODE_ENV,
  });
}
