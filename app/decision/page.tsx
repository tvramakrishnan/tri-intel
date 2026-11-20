"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// ─── Color constants ──────────────────────────────────────────────────────────
const REGISTER_COLOR = "#2E7D4F";
const DEFER_COLOR = "#BA7517";
const ACCENT_COLOR = "#C8502A";

// ─── Types ────────────────────────────────────────────────────────────────────
type ScoreComponent = { score: number; max: number; label: string };

type DecisionResult = {
  decision: "REGISTER" | "DEFER";
  confidence: "High" | "Medium" | "Low";
  topDrivers: string[];
  keyRisks: string[];
  lifestyleImpact: string;
  assumptionsUsed: string[];
  nextStep: string;
  score: number;
  hardDeferReason: string | null;
  scoreBreakdown: {
    timeline: ScoreComponent;
    swim: ScoreComponent;
    run: ScoreComponent;
    bike: ScoreComponent;
    experience: ScoreComponent;
    lifestyle: ScoreComponent;
  };
  distanceInfo: { name: string; swim: string; bike: string; run: string };
  explanationPending?: boolean;
};

type ExplainState = "loading" | "ready" | "failed";

// ─── Tooltip ──────────────────────────────────────────────────────────────────
function Tooltip({ text }: { text: string }) {
  const [show, setShow] = useState(false);
  return (
    <span className="relative inline-flex items-center">
      <button
        type="button"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        className="w-4 h-4 rounded-full border border-gray-300 text-gray-400 text-xs flex items-center justify-center ml-1.5 hover:border-gray-500 transition flex-shrink-0"
        aria-label="More info"
      >
        ?
      </button>
      {show && (
        <span className="absolute left-6 top-0 z-20 w-56 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 leading-relaxed shadow-xl">
          {text}
        </span>
      )}
    </span>
  );
}

// ─── Score bar ────────────────────────────────────────────────────────────────
function barColor(score: number, max: number): string {
  const ratio = max > 0 ? score / max : 0;
  if (ratio >= 0.7) return REGISTER_COLOR;
  if (ratio >= 0.5) return DEFER_COLOR;
  return ACCENT_COLOR;
}

function ScoreBar({ label, component }: { label: string; component: ScoreComponent }) {
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

// ─── Card ─────────────────────────────────────────────────────────────────────
function Card({ title, children }: { title: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div className="mb-4">{title}</div>
      {children}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function DecisionPage() {
  const router = useRouter();
  const [result, setResult] = useState<DecisionResult | null>(null);
  const [raceName, setRaceName] = useState("");
  const [assessedDate, setAssessedDate] = useState("");
  const [error, setError] = useState("");
  const [showAssumptions, setShowAssumptions] = useState(false);
  const [feedback, setFeedback] = useState<"up" | "down" | null>(null);
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [explainState, setExplainState] = useState<ExplainState>("ready");

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("finishline-result");
      const formRaw = sessionStorage.getItem("finishline-form");
      if (!raw) {
        setError("No result found. Please go back and submit the form.");
        return;
      }
      const parsed: DecisionResult = JSON.parse(raw);
      setResult(parsed);
      if (formRaw) setRaceName(JSON.parse(formRaw).raceName || "");
      if (parsed.explanationPending && formRaw) {
        loadExplanation(JSON.parse(formRaw));
      }
      setAssessedDate(
        new Date().toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        })
      );
    } catch {
      setError("Could not load results. Please try again.");
    }
  }, []);

  // The verdict is already on screen; the explanation fills in when Claude returns.
  // If the model call fails, the verdict and breakdown still stand on their own.
  async function loadExplanation(form: Record<string, unknown>) {
    setExplainState("loading");
    try {
      const res = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, mode: "explain" }),
      });
      if (!res.ok) throw new Error("explain failed");
      const full: DecisionResult = await res.json();
      setResult(full);
      try { sessionStorage.setItem("finishline-result", JSON.stringify(full)); } catch {}
      setExplainState("ready");
    } catch {
      setExplainState("failed");
    }
  }

  const retryExplanation = () => {
    try {
      const formRaw = sessionStorage.getItem("finishline-form");
      if (formRaw) loadExplanation(JSON.parse(formRaw));
    } catch {
      setExplainState("failed");
    }
  };

  const sendFeedback = async (type: "up" | "down") => {
    setFeedback(type);
    try {
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          race: raceName,
          distance: result?.distanceInfo?.name ?? "",
          decision: result?.decision ?? "",
        }),
      });
    } catch {
      // non-critical
    }
    setFeedbackSent(true);
    if (type === "down") {
      window.open(
        "https://docs.google.com/forms/d/e/1FAIpQLScYBixRda15aHyXOpodI16vCPkfWcvuhmpK1-mhGNkxNA7RRA/viewform?usp=pp_url",
        "_blank"
      );
    }
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#F7F5F0" }}>
        <div className="text-center">
          <p className="text-gray-600 mb-4">{error}</p>
          <Link href="/evaluate" className="px-6 py-3 rounded-full text-white font-semibold" style={{ backgroundColor: ACCENT_COLOR }}>
            Back to Evaluation
          </Link>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#F7F5F0" }}>
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-gray-300 rounded-full mx-auto mb-4" style={{ borderTopColor: ACCENT_COLOR }} />
          <p className="text-gray-600">Loading your decision...</p>
        </div>
      </div>
    );
  }

  const isRegister = result.decision === "REGISTER";
  const verdictColor = isRegister ? REGISTER_COLOR : DEFER_COLOR;
  const verdictBg = isRegister ? "#f0fdf4" : "#fffbeb";
  const scoreColor =
    result.score >= 70 ? "#2E7D4F"
    : result.score >= 50 ? "#BA7517"
    : "#C8502A";

  const confidenceColors: Record<string, { bg: string; text: string }> = {
    High: { bg: "#dcfce7", text: "#15803d" },
    Medium: { bg: "#fef9c3", text: "#854d0e" },
    Low: { bg: "#fee2e2", text: "#b91c1c" },
  };
  const confStyle = confidenceColors[result.confidence] || confidenceColors.Medium;

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F7F5F0" }}>
      {/* Nav — 3-column */}
      <nav className="max-w-3xl mx-auto px-6 py-4 grid grid-cols-3 items-center">
        <Link href="/evaluate" className="text-sm text-gray-500 hover:text-gray-800 transition-colors">
          ← Adjust inputs
        </Link>
        <p className="text-sm font-semibold text-gray-700 text-center">Your verdict</p>
        <div />
      </nav>

      <div className="max-w-3xl mx-auto px-6 pb-16 space-y-5">

        {/* Verdict hero */}
        <div className="rounded-3xl p-10 text-center" style={{ backgroundColor: verdictBg }}>
          {raceName && result.distanceInfo && (
            <p className="text-sm font-semibold text-gray-500 mb-1 uppercase tracking-wider">
              {raceName} · {result.distanceInfo.name}
            </p>
          )}
          {result.distanceInfo && (
            <p className="text-xs text-gray-400 mb-1">
              {result.distanceInfo.swim} · {result.distanceInfo.bike} · {result.distanceInfo.run}
            </p>
          )}
          {assessedDate && (
            <p className="text-xs text-gray-400 mb-6">
              Based on your inputs · assessed {assessedDate}
            </p>
          )}

          <div
            className="text-7xl font-bold mb-5 tracking-tight"
            style={{ color: verdictColor, fontFamily: "Georgia, 'Times New Roman', serif" }}
          >
            {result.decision}
          </div>

          {/* Confidence badge + tooltip */}
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <span
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold"
              style={{ backgroundColor: confStyle.bg, color: confStyle.text }}
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: confStyle.text }} />
              {result.confidence} Confidence
              <Tooltip text="How certain we are based on the completeness and clarity of your inputs" />
            </span>

            {/* Score badge + tooltip */}
            {result.score !== undefined && (
              <span className="inline-flex items-center gap-1 px-4 py-1.5 rounded-full text-sm font-semibold bg-white border border-gray-200 text-gray-700">
                Score:{" "}
                <span className="font-bold ml-0.5" style={{ color: scoreColor }}>
                  {result.score} / 100
                </span>
                <Tooltip text="Your total score across timeline, swim, bike, run, lifestyle and experience. 70+ = strong readiness for this distance" />
              </span>
            )}
          </div>
        </div>

        {/* Hard defer banner */}
        {result.hardDeferReason && (
          <div className="rounded-2xl p-5 flex items-start gap-3" style={{ backgroundColor: "#fffbeb", border: "1px solid #BA7517" }}>
            <span className="text-xl flex-shrink-0">⚠️</span>
            <div>
              <p className="font-semibold text-sm mb-0.5" style={{ color: "#BA7517" }}>Hard stop identified</p>
              <p className="text-amber-800 text-sm leading-relaxed">{result.hardDeferReason}</p>
            </div>
          </div>
        )}

        {explainState === "loading" && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="animate-spin w-4 h-4 border-2 border-gray-300 rounded-full" style={{ borderTopColor: ACCENT_COLOR }} />
              <p className="text-sm font-medium text-gray-700">Writing your personalised explanation…</p>
            </div>
            <div className="space-y-2 animate-pulse">
              <div className="h-3 bg-gray-100 rounded w-11/12" />
              <div className="h-3 bg-gray-100 rounded w-10/12" />
              <div className="h-3 bg-gray-100 rounded w-8/12" />
            </div>
            <p className="text-xs text-gray-400 mt-4">Your verdict and score above are final. They come from the scoring engine, not the AI.</p>
          </div>
        )}

        {explainState === "failed" && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <p className="text-sm text-gray-700 mb-3">
              The written explanation didn&apos;t load this time. Your verdict and the readiness breakdown below come from the scoring engine and don&apos;t depend on it.
            </p>
            <button
              type="button"
              onClick={retryExplanation}
              className="px-4 py-2 rounded-full text-white text-sm font-semibold"
              style={{ backgroundColor: ACCENT_COLOR }}
            >
              Try the explanation again
            </button>
          </div>
        )}

        {explainState === "ready" && (
        <>
        {/* Top Drivers + Key Risks */}
        <div className="grid md:grid-cols-2 gap-5">
          <Card
            title={
              <div className="flex items-center gap-2">
                <span>⚡</span>
                <h3 className="font-bold text-gray-900">Top Drivers</h3>
              </div>
            }
          >
            <ul className="space-y-2">
              {result.topDrivers?.map((d, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0" style={{ backgroundColor: ACCENT_COLOR }} />
                  {d}
                </li>
              ))}
            </ul>
          </Card>

          <Card
            title={
              <div className="flex items-center gap-2">
                <span>⚠️</span>
                <h3 className="font-bold text-gray-900">Key Risks</h3>
              </div>
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

        {/* Lifestyle Impact — full width */}
        <Card
          title={
            <div className="flex items-center gap-2">
              <span>👤</span>
              <h3 className="font-bold text-gray-900">Lifestyle Impact</h3>
            </div>
          }
        >
          <p className="text-sm text-gray-700 leading-relaxed">{result.lifestyleImpact}</p>
        </Card>

        {/* Next Step — elevated, burnt orange border */}
        <div
          className="bg-white rounded-2xl p-6 shadow-sm"
          style={{ border: `1.5px solid ${ACCENT_COLOR}` }}
        >
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: ACCENT_COLOR }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
            <span className="text-xs font-bold tracking-widest uppercase" style={{ color: ACCENT_COLOR }}>
              Your next step
            </span>
          </div>
          <p className="text-gray-800 leading-relaxed" style={{ fontSize: 15, fontWeight: 500 }}>
            {result.nextStep}
          </p>
        </div>

        {/* Assumptions — collapsed toggle */}
        {result.assumptionsUsed?.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <button
              type="button"
              onClick={() => setShowAssumptions((v) => !v)}
              className="w-full flex items-center justify-between px-6 py-4 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
            >
              <span>See assumptions used</span>
              <span className="text-lg leading-none">{showAssumptions ? "−" : "+"}</span>
            </button>
            {showAssumptions && (
              <div className="px-6 pb-5 border-t border-gray-100 pt-4">
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
          </div>
        )}
        </>
        )}

        {/* Readiness breakdown */}
        {result.scoreBreakdown && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center">
                <h3 className="font-bold text-gray-900">Readiness breakdown</h3>
                <Tooltip text="Where your score came from. Green = strong, amber = needs work, red = significant gap for this distance" />
              </div>
              <span className="text-2xl font-bold" style={{ color: verdictColor }}>
                {result.score} / 100
              </span>
            </div>
            <div className="space-y-5">
              <ScoreBar label="Timeline" component={result.scoreBreakdown.timeline} />
              <ScoreBar label="Swimming" component={result.scoreBreakdown.swim} />
              <ScoreBar label="Running" component={result.scoreBreakdown.run} />
              <ScoreBar label="Cycling" component={result.scoreBreakdown.bike} />
              <ScoreBar label="Lifestyle" component={result.scoreBreakdown.lifestyle} />
              {result.scoreBreakdown.experience && (
                <ScoreBar label="Experience" component={result.scoreBreakdown.experience} />
              )}
            </div>
          </div>
        )}

        {/* Feedback */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center">
          <p className="text-sm font-medium text-gray-700 mb-4">
            Was this recommendation helpful?
          </p>
          {!feedbackSent ? (
            <div className="flex items-center justify-center gap-4">
              <button
                type="button"
                onClick={() => sendFeedback("up")}
                className="w-12 h-12 rounded-full border-2 border-gray-200 text-xl hover:border-green-400 hover:bg-green-50 transition-all"
                aria-label="Thumbs up"
              >
                👍
              </button>
              <button
                type="button"
                onClick={() => sendFeedback("down")}
                className="w-12 h-12 rounded-full border-2 border-gray-200 text-xl hover:border-amber-400 hover:bg-amber-50 transition-all"
                aria-label="Thumbs down"
              >
                👎
              </button>
            </div>
          ) : feedback === "up" ? (
            <p className="text-green-700 font-medium">Glad it helped! 🎉</p>
          ) : (
            <div>
              <p className="text-sm text-gray-500 mb-1">What missed the mark?</p>
              <p className="text-sm text-gray-500">Thanks — this helps us improve</p>
            </div>
          )}
        </div>

        {/* Disclaimer */}
        <p className="text-xs text-gray-400 text-center">
          Finish Line provides decision support — not medical or coaching advice
        </p>

        {/* Single CTA */}
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => {
              try { sessionStorage.removeItem("finishline-form-draft"); } catch {}
              router.push("/evaluate");
            }}
            className="px-8 py-3 rounded-full font-semibold border-2 transition-all hover:bg-white text-center"
            style={{ borderColor: ACCENT_COLOR, color: ACCENT_COLOR }}
          >
            Evaluate another race
          </button>
        </div>
      </div>
    </div>
  );
}
