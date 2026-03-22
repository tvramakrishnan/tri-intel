"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type ScoreComponent = {
  score: number;
  max: number;
  label: string;
};

type DecisionResult = {
  decision: "REGISTER" | "DEFER";
  confidence: "High" | "Medium" | "Low";
  topDrivers: string[];
  keyRisks: string[];
  lifestyleImpact: string;
  assumptionsUsed: string[];
  nextStep: string;
  // Deterministic scoring fields
  score: number;
  hardDeferReason: string | null;
  scoreBreakdown: {
    timeline: ScoreComponent;
    swim: ScoreComponent;
    run: ScoreComponent;
    cycle: ScoreComponent;
    lifestyle: ScoreComponent;
  };
  distanceInfo: {
    name: string;
    swim: string;
    bike: string;
    run: string;
  };
};

const confidenceColors: Record<string, { bg: string; text: string }> = {
  High: { bg: "#dcfce7", text: "#15803d" },
  Medium: { bg: "#fef9c3", text: "#854d0e" },
  Low: { bg: "#fee2e2", text: "#b91c1c" },
};

function barColor(score: number, max: number): string {
  const ratio = max > 0 ? score / max : 0;
  if (ratio >= 0.7) return "#16a34a"; // green
  if (ratio >= 0.5) return "#d97706"; // amber
  return "#dc2626"; // red
}

function ScoreBar({
  label,
  component,
}: {
  label: string;
  component: ScoreComponent;
}) {
  const pct = component.max > 0 ? (component.score / component.max) * 100 : 0;
  const color = barColor(component.score, component.max);
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className="text-sm font-semibold" style={{ color }}>
          {component.score} / {component.max}
        </span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <p className="text-xs text-gray-400 mt-1 leading-snug">{component.label}</p>
    </div>
  );
}

function Card({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center gap-2 mb-4">
        <div style={{ color: "#C8502A" }}>{icon}</div>
        <h3 className="font-bold text-gray-900">{title}</h3>
      </div>
      {children}
    </div>
  );
}

export default function DecisionPage() {
  const [result, setResult] = useState<DecisionResult | null>(null);
  const [raceName, setRaceName] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("finishline-result");
      const formRaw = sessionStorage.getItem("finishline-form");
      if (!raw) {
        setError("No result found. Please go back and submit the form.");
        return;
      }
      setResult(JSON.parse(raw));
      if (formRaw) {
        const form = JSON.parse(formRaw);
        setRaceName(form.raceName || "");
      }
    } catch {
      setError("Could not load results. Please try again.");
    }
  }, []);

  if (error) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "#F7F5F0" }}
      >
        <div className="text-center">
          <p className="text-gray-600 mb-4">{error}</p>
          <Link
            href="/evaluate"
            className="px-6 py-3 rounded-full text-white font-semibold"
            style={{ backgroundColor: "#C8502A" }}
          >
            Back to Evaluation
          </Link>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "#F7F5F0" }}
      >
        <div className="text-center">
          <div
            className="animate-spin w-8 h-8 border-2 border-gray-300 border-t-current rounded-full mx-auto mb-4"
            style={{ borderTopColor: "#C8502A" }}
          />
          <p className="text-gray-600">Loading your decision...</p>
        </div>
      </div>
    );
  }

  const isRegister = result.decision === "REGISTER";
  const verdictColor = isRegister ? "#16a34a" : "#C8502A";
  const verdictBg = isRegister ? "#f0fdf4" : "#fff5f2";
  const confStyle = confidenceColors[result.confidence] || confidenceColors.Medium;

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F7F5F0" }}>
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-3xl mx-auto">
        <Link href="/" className="text-2xl font-bold" style={{ color: "#C8502A" }}>
          FinishLine
        </Link>
        <Link
          href="/evaluate"
          className="text-sm text-gray-500 hover:text-gray-800 transition-colors"
        >
          ← Adjust my inputs
        </Link>
      </nav>

      <div className="max-w-3xl mx-auto px-6 pb-16">
        {/* Verdict Hero */}
        <div
          className="rounded-3xl p-10 mb-6 text-center"
          style={{ backgroundColor: verdictBg }}
        >
          {raceName && (
            <p className="text-sm font-medium text-gray-500 mb-1 uppercase tracking-wider">
              {raceName}
            </p>
          )}
          {/* Distance info */}
          {result.distanceInfo && (
            <p className="text-xs text-gray-400 mb-4 tracking-wide">
              {result.distanceInfo.swim} · {result.distanceInfo.bike} ·{" "}
              {result.distanceInfo.run}
            </p>
          )}
          <p className="text-sm font-medium text-gray-500 mb-4">Our recommendation</p>
          <div
            className="text-7xl font-bold mb-5 tracking-tight"
            style={{
              color: verdictColor,
              fontFamily: "Georgia, 'Times New Roman', serif",
            }}
          >
            {result.decision}
          </div>

          <span
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold"
            style={{ backgroundColor: confStyle.bg, color: confStyle.text }}
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: confStyle.text }}
            />
            {result.confidence} Confidence
          </span>

          {/* Score pill */}
          {result.score !== undefined && (
            <div className="mt-4">
              <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold bg-white border border-gray-200 text-gray-700">
                Readiness Score:{" "}
                <span className="font-bold ml-1" style={{ color: verdictColor }}>
                  {result.score} / 100
                </span>
              </span>
            </div>
          )}
        </div>

        {/* Hard Defer Banner */}
        {result.hardDeferReason && (
          <div
            className="rounded-2xl p-5 mb-6 flex items-start gap-3"
            style={{ backgroundColor: "#fff7ed", border: "1px solid #fed7aa" }}
          >
            <span className="text-2xl flex-shrink-0">⚠️</span>
            <div>
              <p className="font-semibold text-orange-900 text-sm mb-1">
                Hard stop identified
              </p>
              <p className="text-orange-800 text-sm leading-relaxed">
                {result.hardDeferReason}
              </p>
            </div>
          </div>
        )}

        {/* Readiness Score Breakdown */}
        {result.scoreBreakdown && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-gray-900">Readiness Score</h3>
              <span className="text-2xl font-bold" style={{ color: verdictColor }}>
                {result.score} / 100
              </span>
            </div>
            <div className="space-y-5">
              <ScoreBar label="Timeline" component={result.scoreBreakdown.timeline} />
              <ScoreBar label="Swimming" component={result.scoreBreakdown.swim} />
              <ScoreBar label="Running" component={result.scoreBreakdown.run} />
              <ScoreBar label="Cycling" component={result.scoreBreakdown.cycle} />
              <ScoreBar label="Lifestyle" component={result.scoreBreakdown.lifestyle} />
            </div>
          </div>
        )}

        {/* Cards Grid */}
        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <Card
            title="Top Drivers"
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            }
          >
            <ul className="space-y-2">
              {result.topDrivers?.map((d, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <span
                    className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0"
                    style={{ backgroundColor: "#C8502A" }}
                  />
                  {d}
                </li>
              ))}
            </ul>
          </Card>

          <Card
            title="Key Risks"
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            }
          >
            <ul className="space-y-2">
              {result.keyRisks?.map((r, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0 bg-amber-400" />
                  {r}
                </li>
              ))}
            </ul>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <Card
            title="Lifestyle Impact"
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            }
          >
            <p className="text-sm text-gray-700 leading-relaxed">{result.lifestyleImpact}</p>
          </Card>

          <Card
            title="Next Step"
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            }
          >
            <p className="text-sm text-gray-700 leading-relaxed font-medium">
              {result.nextStep}
            </p>
          </Card>
        </div>

        {/* Assumptions */}
        {result.assumptionsUsed?.length > 0 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">
              Assumptions Used
            </h3>
            <ul className="space-y-1.5">
              {result.assumptionsUsed.map((a, i) => (
                <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                  <span className="text-gray-400 flex-shrink-0">—</span>
                  {a}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/evaluate"
            className="flex-1 py-3 rounded-full text-center font-semibold border-2 transition-all hover:bg-white"
            style={{ borderColor: "#C8502A", color: "#C8502A" }}
          >
            Adjust my inputs
          </Link>
          <Link
            href="/"
            className="flex-1 py-3 rounded-full text-center font-semibold text-white transition-all hover:opacity-90"
            style={{ backgroundColor: "#C8502A" }}
          >
            Evaluate another race
          </Link>
        </div>
      </div>
    </div>
  );
}
