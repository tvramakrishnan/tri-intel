import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { calculateReadiness } from "@/lib/scoring";
import { validateInput } from "@/lib/guardrails";

const PROMPT_VERSION = "1.0.0";

console.log("PROMPT_VERSION check:", process.env.ANTHROPIC_API_KEY?.slice(0, 15) ?? "missing");

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: NextRequest) {
  console.log('ENV KEY:', process.env.ANTHROPIC_API_KEY?.slice(0,20))
  console.log('ENV KEYS AVAILABLE:', Object.keys(process.env).filter(k => k.includes('ANTHROPIC')))
  try {
    const body = await req.json();

    const guard = validateInput(body);
    if (!guard.valid) {
      return NextResponse.json({ error: guard.error }, { status: 400 });
    }

    const {
      raceName,
      raceDate,
      distance,
      location,
      raceUrl,
      weeklyHours,
      runLevel,
      swimLevel,
      bikeLevel,
      workFamilyIntensity,
      travelTolerance,
      budget,
      ageBand,
      additionalNotes,
    } = body;

    // ── Deterministic scoring (runs before any AI call) ──────────────────────
    const scoring = calculateReadiness({
      distance,
      raceDate,
      weeklyHours,
      swimLevel,
      runLevel,
      bikeLevel,
      workFamilyIntensity,
      priorExperience: body.priorExperience ?? "none",
    });

    const { scoreBreakdown, distanceInfo, hardDeferReason } = scoring;

    // ── Build prompt for AI explanation ──────────────────────────────────────
    const prompt = `DETERMINISTIC DECISION: ${scoring.decision} (${scoring.confidence} confidence)
TOTAL READINESS SCORE: ${scoring.score} / 100
${hardDeferReason ? `\nHARD DEFER REASON: ${hardDeferReason}` : ""}

SCORE BREAKDOWN:
- Timeline: ${scoreBreakdown.timeline.score}/${scoreBreakdown.timeline.max} — ${scoreBreakdown.timeline.label}
- Swimming: ${scoreBreakdown.swim.score}/${scoreBreakdown.swim.max} — ${scoreBreakdown.swim.label}
- Running: ${scoreBreakdown.run.score}/${scoreBreakdown.run.max} — ${scoreBreakdown.run.label}
- Cycling: ${scoreBreakdown.bike.score}/${scoreBreakdown.bike.max} — ${scoreBreakdown.bike.label}
- Lifestyle: ${scoreBreakdown.lifestyle.score}/${scoreBreakdown.lifestyle.max} — ${scoreBreakdown.lifestyle.label}
- Experience: ${scoreBreakdown.experience.score}/${scoreBreakdown.experience.max} — ${scoreBreakdown.experience.label}

RACE DETAILS:
- Race Name: ${raceName}
- Race Date: ${raceDate}
- Distance: ${distance} (Swim: ${distanceInfo.swim} · Bike: ${distanceInfo.bike} · Run: ${distanceInfo.run})
- Location: ${location}
${raceUrl ? `- Race URL: ${raceUrl}` : ""}

ATHLETE PROFILE:
- Weekly training hours: ${weeklyHours} hrs/week
- Swimming comfort: ${swimLevel}
- Running baseline: ${runLevel}
- Cycling experience: ${bikeLevel}
- Work/family intensity: ${workFamilyIntensity}
- Travel tolerance: ${travelTolerance}
${budget ? `- Budget: ${budget}` : ""}
${ageBand ? `- Age band: ${ageBand}` : ""}
${additionalNotes ? `- Additional context: ${additionalNotes}` : ""}

The decision is ${scoring.decision} with ${scoring.confidence} confidence. Explain this decision to the athlete.
Use the score breakdown to inform your reasoning. Reference the specific distances in both metric and imperial where helpful.
${scoring.decision === "DEFER" ? "Frame deferring as the smart, positive choice — not a failure. Focus on what they can do to prepare." : "Be encouraging but honest about what commitment this requires."}

Return ONLY this JSON:
{
  "decision": "${scoring.decision}",
  "confidence": "${scoring.confidence}",
  "topDrivers": ["3 key reasons for this decision, based on the score breakdown"],
  "keyRisks": ["2-3 specific risks or things to watch"],
  "lifestyleImpact": "2-3 sentences on how training for this race will affect daily life and what trade-offs are required",
  "assumptionsUsed": ["2-3 assumptions made based on the inputs"],
  "nextStep": "One specific, actionable recommendation for what to do right now"
}`;

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      temperature: 0,
      system:
        "[PROMPT v1.0.0]\nYou are Finish Line, a structured triathlon decision tool built for first-time triathletes. The REGISTER/DEFER decision and confidence level have already been determined by a deterministic scoring system based on expert triathlon knowledge. Your job is ONLY to explain this decision to the athlete in a supportive, honest, and direct way. Never override or second-guess the decision. Never say you are an AI. Use the score breakdown to inform your reasoning. Reference specific distances in both metric and imperial when relevant. Normalize DEFER as a smart, positive decision — not a failure. Always respond with only valid JSON, no markdown.",
      messages: [{ role: "user", content: prompt }],
    });

    console.log("LLM usage:", {
      model: response.model,
      input_tokens: response.usage.input_tokens,
      output_tokens: response.usage.output_tokens,
      prompt_version: PROMPT_VERSION,
      decision: scoring.decision,
      confidence: scoring.confidence,
      score: scoring.score,
    });

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json(
        { error: "No response from AI" },
        { status: 500 }
      );
    }

    let parsed;
    try {
      parsed = JSON.parse(textBlock.text);
    } catch {
      // Try to extract JSON from the response if model added any extra text
      const match = textBlock.text.match(/\{[\s\S]*\}/);
      if (match) {
        parsed = JSON.parse(match[0]);
      } else {
        return NextResponse.json(
          { error: "Could not parse AI response" },
          { status: 500 }
        );
      }
    }

    // Merge AI explanation with deterministic scoring fields
    return NextResponse.json({
      ...parsed,
      decision: scoring.decision,       // always trust the deterministic decision
      confidence: scoring.confidence,   // always trust the deterministic confidence
      score: scoring.score,
      scoreBreakdown: scoring.scoreBreakdown,
      distanceInfo: scoring.distanceInfo,
      hardDeferReason: scoring.hardDeferReason,
    });
  } catch (err) {
    console.error("Evaluate API error:", err);
    if (err instanceof Anthropic.AuthenticationError) {
      return NextResponse.json(
        { error: "Invalid API key. Please check your ANTHROPIC_API_KEY." },
        { status: 401 }
      );
    }
    if (err instanceof Anthropic.RateLimitError) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a moment and try again." },
        { status: 429 }
      );
    }
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
