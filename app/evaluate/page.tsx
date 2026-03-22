"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type FormData = {
  raceName: string;
  raceDate: string;
  distance: string;
  location: string;
  raceUrl: string;
  weeklyHours: number;
  runningBaseline: string;
  swimmingComfort: string;
  cyclingExperience: string;
  workFamilyIntensity: string;
  travelTolerance: string;
  budget: string;
  ageBand: string;
  additionalNotes: string;
};

type PillOption = {
  value: string;
  label: string;
  description: string;
};

const PillGroup = ({
  options,
  selected,
  onSelect,
}: {
  options: PillOption[];
  selected: string;
  onSelect: (val: string) => void;
}) => (
  <div className="space-y-2">
    {options.map((opt) => {
      const isSelected = selected === opt.value;
      return (
        <button
          key={opt.value}
          type="button"
          onClick={() => onSelect(opt.value)}
          className="w-full text-left px-4 py-3 rounded-xl border-2 transition-all"
          style={
            isSelected
              ? {
                  backgroundColor: "#fff5f2",
                  borderColor: "#C8502A",
                  color: "#1f2937",
                }
              : {
                  backgroundColor: "white",
                  borderColor: "#e5e7eb",
                  color: "#374151",
                }
          }
        >
          <div className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center"
              style={{
                borderColor: isSelected ? "#C8502A" : "#d1d5db",
                backgroundColor: isSelected ? "#C8502A" : "transparent",
              }}
            >
              {isSelected && (
                <div className="w-1.5 h-1.5 rounded-full bg-white" />
              )}
            </div>
            <span className="font-semibold text-sm">{opt.label}</span>
          </div>
          <p className="text-xs text-gray-500 mt-1 ml-6 leading-snug">
            {opt.description}
          </p>
        </button>
      );
    })}
  </div>
);

const SectionCard = ({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children: React.ReactNode;
}) => (
  <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
    <div className="flex items-center gap-3 mb-6">
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
        style={{ backgroundColor: "#C8502A" }}
      >
        {number}
      </div>
      <h2 className="text-lg font-bold text-gray-900">{title}</h2>
    </div>
    <div className="space-y-6">{children}</div>
  </div>
);

// ─── Pill Option Definitions ─────────────────────────────────────────────────

const SWIM_OPTIONS: PillOption[] = [
  {
    value: "cannot-swim",
    label: "Can't swim",
    description: "Cannot complete one pool length continuously",
  },
  {
    value: "basic-pool",
    label: "Basic pool",
    description: "Can swim 400m continuously in a pool (Super Sprint ready)",
  },
  {
    value: "comfortable-pool",
    label: "Comfortable pool",
    description:
      "750m+ freestyle, some open water experience (Sprint ready with prep)",
  },
  {
    value: "open-water",
    label: "Open water",
    description:
      "Regularly swims open water, comfortable with sighting (Olympic/70.3 ready)",
  },
];

const RUN_OPTIONS: PillOption[] = [
  {
    value: "non-runner",
    label: "Non-runner",
    description: "Run less than once a week, struggle beyond 2km / 1.2mi",
  },
  {
    value: "occasional",
    label: "Occasional",
    description: "1–2x/week, comfortable up to 5km / 3.1mi",
  },
  {
    value: "regular",
    label: "Regular",
    description: "3–4x/week, comfortable at 10km / 6.2mi",
  },
  {
    value: "competitive",
    label: "Competitive",
    description: "Race regularly, comfortable at half marathon pace",
  },
];

const CYCLE_OPTIONS: PillOption[] = [
  {
    value: "no-bike",
    label: "No bike",
    description: "Don't own a road/tri bike",
  },
  {
    value: "casual",
    label: "Casual",
    description: "Occasional rides, comfortable up to 20km / 12mi",
  },
  {
    value: "regular",
    label: "Regular",
    description: "2–3x/week, comfortable at 40km / 25mi",
  },
  {
    value: "competitive",
    label: "Competitive",
    description: "60km+ / 37mi+ rides regularly",
  },
];

// ─── Page Component ───────────────────────────────────────────────────────────

export default function EvaluatePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState<FormData>({
    raceName: "",
    raceDate: "",
    distance: "",
    location: "",
    raceUrl: "",
    weeklyHours: 6,
    runningBaseline: "",
    swimmingComfort: "",
    cyclingExperience: "",
    workFamilyIntensity: "",
    travelTolerance: "",
    budget: "",
    ageBand: "",
    additionalNotes: "",
  });

  const set = (key: keyof FormData, value: string | number) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.raceName || !form.raceDate || !form.distance || !form.location) {
      setError("Please fill in all required fields in Race Details.");
      return;
    }
    if (!form.runningBaseline || !form.swimmingComfort || !form.cyclingExperience) {
      setError("Please select all training baseline options.");
      return;
    }
    if (!form.workFamilyIntensity || !form.travelTolerance) {
      setError("Please fill in all required life constraint fields.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Something went wrong. Please try again.");
      }

      const result = await res.json();
      sessionStorage.setItem("finishline-result", JSON.stringify(result));
      sessionStorage.setItem("finishline-form", JSON.stringify(form));
      router.push("/decision");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F7F5F0" }}>
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-3xl mx-auto">
        <Link href="/" className="text-2xl font-bold" style={{ color: "#C8502A" }}>
          FinishLine
        </Link>
        <span className="text-sm text-gray-500">Race Evaluation</span>
      </nav>

      <div className="max-w-3xl mx-auto px-6 pb-16">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Evaluate a Race</h1>
          <p className="text-gray-600">
            Answer honestly. The more accurate your inputs, the better your decision.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1 — Race Details */}
          <SectionCard number="1" title="Race Details">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Race Name <span style={{ color: "#C8502A" }}>*</span>
              </label>
              <input
                type="text"
                value={form.raceName}
                onChange={(e) => set("raceName", e.target.value)}
                placeholder="e.g. Lake Chelan Sprint Triathlon"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:border-transparent transition"
                style={{ "--tw-ring-color": "#C8502A" } as React.CSSProperties}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Race Date <span style={{ color: "#C8502A" }}>*</span>
                </label>
                <input
                  type="date"
                  value={form.raceDate}
                  onChange={(e) => set("raceDate", e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Distance <span style={{ color: "#C8502A" }}>*</span>
                </label>
                <select
                  value={form.distance}
                  onChange={(e) => set("distance", e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 transition"
                >
                  <option value="">Select distance</option>
                  <option value="Super Sprint">
                    Super Sprint (400m swim · 10km bike · 2.5km run)
                  </option>
                  <option value="Sprint">
                    Sprint (750m / 0.47mi swim · 20km / 12.4mi bike · 5km / 3.1mi run)
                  </option>
                  <option value="Olympic">
                    Olympic (1.5km / 0.93mi swim · 40km / 24.8mi bike · 10km / 6.2mi run)
                  </option>
                  <option value="70.3">
                    70.3 Half Iron (1.9km / 1.2mi swim · 90km / 56mi bike · 21.1km / 13.1mi run)
                  </option>
                  <option value="Full Ironman">
                    Full Ironman (3.8km / 2.4mi swim · 180km / 112mi bike · 42.2km / 26.2mi run)
                  </option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location <span style={{ color: "#C8502A" }}>*</span>
              </label>
              <input
                type="text"
                value={form.location}
                onChange={(e) => set("location", e.target.value)}
                placeholder="e.g. Chelan, WA"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Race URL{" "}
                <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                type="url"
                value={form.raceUrl}
                onChange={(e) => set("raceUrl", e.target.value)}
                placeholder="https://..."
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 transition"
              />
            </div>
          </SectionCard>

          {/* Section 2 — Training Baseline */}
          <SectionCard number="2" title="Training Baseline">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Average weekly training hours:{" "}
                <span className="font-bold" style={{ color: "#C8502A" }}>
                  {form.weeklyHours} hrs
                </span>
              </label>
              <input
                type="range"
                min={1}
                max={20}
                value={form.weeklyHours}
                onChange={(e) => set("weeklyHours", parseInt(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>1 hr</span>
                <span>20 hrs</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Swimming comfort <span style={{ color: "#C8502A" }}>*</span>
              </label>
              <PillGroup
                options={SWIM_OPTIONS}
                selected={form.swimmingComfort}
                onSelect={(v) => set("swimmingComfort", v)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Running baseline <span style={{ color: "#C8502A" }}>*</span>
              </label>
              <PillGroup
                options={RUN_OPTIONS}
                selected={form.runningBaseline}
                onSelect={(v) => set("runningBaseline", v)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Cycling experience <span style={{ color: "#C8502A" }}>*</span>
              </label>
              <PillGroup
                options={CYCLE_OPTIONS}
                selected={form.cyclingExperience}
                onSelect={(v) => set("cyclingExperience", v)}
              />
            </div>
          </SectionCard>

          {/* Section 3 — Life Constraints */}
          <SectionCard number="3" title="Life Constraints">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Work / family intensity <span style={{ color: "#C8502A" }}>*</span>
                </label>
                <select
                  value={form.workFamilyIntensity}
                  onChange={(e) => set("workFamilyIntensity", e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 transition"
                >
                  <option value="">Select...</option>
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Travel tolerance <span style={{ color: "#C8502A" }}>*</span>
                </label>
                <select
                  value={form.travelTolerance}
                  onChange={(e) => set("travelTolerance", e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 transition"
                >
                  <option value="">Select...</option>
                  <option>Local</option>
                  <option>Regional</option>
                  <option>Anywhere</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Budget{" "}
                  <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <select
                  value={form.budget}
                  onChange={(e) => set("budget", e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 transition"
                >
                  <option value="">Select...</option>
                  <option>{"<$500"}</option>
                  <option>$500–1,000</option>
                  <option>$1,000–2,000</option>
                  <option>$2,000+</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Age band{" "}
                  <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <select
                  value={form.ageBand}
                  onChange={(e) => set("ageBand", e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 transition"
                >
                  <option value="">Select...</option>
                  <option>Under 30</option>
                  <option>30–39</option>
                  <option>40–49</option>
                  <option>50+</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Anything else I should know?{" "}
                <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <textarea
                value={form.additionalNotes}
                onChange={(e) => set("additionalNotes", e.target.value)}
                placeholder="Injuries, previous race experience, specific concerns..."
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 transition resize-none"
              />
            </div>
          </SectionCard>

          {error && (
            <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-full text-white font-semibold text-lg transition-all hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            style={{ backgroundColor: "#C8502A" }}
          >
            {loading ? (
              <>
                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Analyzing your readiness...
              </>
            ) : (
              <>
                Get My Decision
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
