"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type FormData = {
  raceName: string;
  raceDate: string;
  distance: string;
  location: string;
  raceUrl: string;          // kept in state, not shown as input
  weeklyHours: number;
  runningBaseline: string;
  swimmingComfort: string;
  cyclingExperience: string;
  workFamilyIntensity: string;
  additionalNotes: string;
};

// ─── Horizontal Pill Group ────────────────────────────────────────────────────

type PillOption = {
  value: string;
  label: string;
  description: string;
};

const HorizontalPills = ({
  options,
  selected,
  onSelect,
}: {
  options: PillOption[];
  selected: string;
  onSelect: (val: string) => void;
}) => {
  const selectedDesc = options.find((o) => o.value === selected)?.description;
  return (
    <>
      <style>{`
        .fl-pill { font-size: 13px; }
        @media (max-width: 380px) { .fl-pill { font-size: 11px; } }
      `}</style>
      <div>
        {/* Pill row — no wrap, horizontal scroll on narrow screens */}
        <div className="flex flex-nowrap gap-2 mb-2 overflow-x-auto pb-1">
          {options.map((opt) => {
            const isSelected = selected === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => onSelect(opt.value)}
                className="fl-pill px-4 py-2 rounded-full font-medium border-2 transition-all whitespace-nowrap flex-shrink-0"
                style={
                  isSelected
                    ? { backgroundColor: "#C8502A", borderColor: "#C8502A", color: "white" }
                    : { backgroundColor: "white", borderColor: "#e5e7eb", color: "#6b7280" }
                }
              >
                {opt.label}
              </button>
            );
          })}
        </div>
        {/* Single description for selected pill only */}
        {selectedDesc && (
          <p
            className="text-xs italic text-gray-400 mt-2 px-3 py-2 rounded-lg"
            style={{ backgroundColor: "#F7F5F0" }}
          >
            {selectedDesc}
          </p>
        )}
      </div>
    </>
  );
};

// ─── Section Card ─────────────────────────────────────────────────────────────

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

// ─── Pill Option Definitions ──────────────────────────────────────────────────

const SWIM_OPTIONS: PillOption[] = [
  {
    value: "cannot-swim",
    label: "Can't swim",
    description: "Cannot complete one pool length continuously",
  },
  {
    value: "basic-pool",
    label: "Basic pool",
    description: "Can swim 400m continuously in pool — Super Sprint ready",
  },
  {
    value: "comfortable-pool",
    label: "Comfortable pool",
    description: "750m+ freestyle, some open water experience — Sprint ready with prep",
  },
  {
    value: "open-water",
    label: "Open water",
    description: "Regularly swims open water, comfortable sighting — Olympic / 70.3 ready",
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
    description: "1-2x/week, comfortable up to 5km / 3.1mi",
  },
  {
    value: "regular",
    label: "Regular",
    description: "3-4x/week, comfortable at 10km / 6.2mi",
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
    description: "Don't own a road or tri bike",
  },
  {
    value: "casual",
    label: "Casual",
    description: "Occasional rides, comfortable up to 20km / 12mi",
  },
  {
    value: "regular",
    label: "Regular",
    description: "2-3x/week, comfortable at 40km / 25mi",
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
    additionalNotes: "",
  });

  const set = (key: keyof FormData, value: string | number) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.raceName || !form.raceDate || !form.distance || !form.location) {
      setError("Please fill in all required fields in Section 1.");
      return;
    }
    if (!form.swimmingComfort || !form.runningBaseline || !form.cyclingExperience) {
      setError("Please select your swim, run, and cycling baseline.");
      return;
    }
    if (!form.workFamilyIntensity) {
      setError("Please select your work / family intensity.");
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
          <p className="text-gray-500">
            Answer honestly. The more accurate your inputs, the better your decision.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Section 1 — The race */}
          <SectionCard number="1" title="The race">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Race name <span style={{ color: "#C8502A" }}>*</span>
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
                  Race date <span style={{ color: "#C8502A" }}>*</span>
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
                    Super Sprint (400m · 10km · 2.5km)
                  </option>
                  <option value="Sprint">
                    Sprint (750m / 0.47mi · 20km / 12.4mi · 5km / 3.1mi)
                  </option>
                  <option value="Olympic">
                    Olympic (1.5km / 0.93mi · 40km / 24.8mi · 10km / 6.2mi)
                  </option>
                  <option value="70.3">
                    70.3 Half Iron (1.9km / 1.2mi · 90km / 56mi · 21.1km / 13.1mi)
                  </option>
                  <option value="Full Ironman">
                    Full Ironman (3.8km / 2.4mi · 180km / 112mi · 42.2km / 26.2mi)
                  </option>
                </select>
                <p className="text-xs text-gray-400 mt-1.5">
                  Distance affects how we weight each factor in your assessment
                </p>
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

            {/* Race URL — coming soon note */}
            <p className="text-sm italic text-gray-400">
              Paste a race URL to auto-fill — coming soon
            </p>
          </SectionCard>

          {/* Section 2 — Your training baseline */}
          <SectionCard number="2" title="Your training baseline">
            {/* Slider */}
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
                max={25}
                value={form.weeklyHours}
                onChange={(e) => set("weeklyHours", parseInt(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-2">
                <span>Casual (1–6)</span>
                <span>Moderate (7–12)</span>
                <span>Serious (13–18)</span>
                <span>Peak (19–25)</span>
              </div>
            </div>

            {/* Swimming */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Swimming comfort <span style={{ color: "#C8502A" }}>*</span>
              </label>
              <HorizontalPills
                options={SWIM_OPTIONS}
                selected={form.swimmingComfort}
                onSelect={(v) => set("swimmingComfort", v)}
              />
            </div>

            {/* Running */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Running baseline <span style={{ color: "#C8502A" }}>*</span>
              </label>
              <HorizontalPills
                options={RUN_OPTIONS}
                selected={form.runningBaseline}
                onSelect={(v) => set("runningBaseline", v)}
              />
            </div>

            {/* Cycling */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Cycling experience <span style={{ color: "#C8502A" }}>*</span>
              </label>
              <HorizontalPills
                options={CYCLE_OPTIONS}
                selected={form.cyclingExperience}
                onSelect={(v) => set("cyclingExperience", v)}
              />
            </div>
          </SectionCard>

          {/* Section 3 — Your life right now */}
          <SectionCard number="3" title="Your life right now">
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
                <option value="Low">Light — flexible schedule, train any time</option>
                <option value="Medium">Moderate — evenings and weekends free</option>
                <option value="High">Heavy — limited windows, high demands</option>
              </select>
            </div>
          </SectionCard>

          {/* Section 4 — Anything else? */}
          <SectionCard number="4" title="Anything else?">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Anything that should factor into your assessment?{" "}
                <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <textarea
                value={form.additionalNotes}
                onChange={(e) => set("additionalNotes", e.target.value)}
                placeholder="Injuries, upcoming travel during training, health factors..."
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 transition resize-none"
              />
              <p className="text-xs text-gray-400 mt-1.5">
                This is read directly and factors into your verdict
              </p>
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
            className="w-full py-4 rounded-full text-white font-semibold text-lg transition-all hover:opacity-90 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            style={{ backgroundColor: loading ? "#A8432A" : "#C8502A" }}
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
                Assessing your readiness...
              </>
            ) : (
              "Get my verdict →"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
