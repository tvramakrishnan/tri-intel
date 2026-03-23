import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F7F5F0" }}>
      {/* Navigation */}
      <nav className="px-6 py-4 max-w-2xl mx-auto">
        <div className="text-2xl font-bold" style={{ color: "#C8502A" }}>
          FinishLine
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-6">
        {/* Hero */}
        <section className="py-16 text-center">
          <div
            className="inline-block mb-5 px-3 py-1 rounded-full text-xs font-semibold tracking-widest uppercase"
            style={{ backgroundColor: "#FFFFFF", border: "1px solid #C8502A", color: "#C8502A" }}
          >
            Triathlon Decision Tool
          </div>

          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-5 leading-tight">
            Should you{" "}
            <em style={{ color: "#1A1816", fontStyle: "italic", fontWeight: 600 }}>register</em>
            <br />
            or defer?
          </h1>

          <p className="text-xl text-gray-600 mb-3 leading-relaxed">
            Get a clear, honest answer based on your real readiness — not optimism
          </p>

          <p className="text-base text-gray-400 mb-10">
            Most first-timers get this wrong. Finish Line gets it right.
          </p>

          <div className="flex flex-col items-center gap-3">
            <Link
              href="/evaluate"
              className="w-full max-w-xs py-4 rounded-full text-white font-semibold text-lg text-center transition-all hover:opacity-90"
              style={{ backgroundColor: "#C8502A" }}
            >
              Evaluate a Race →
            </Link>
            <p className="text-sm text-gray-400">
              Free · Under 90 seconds · No account needed
            </p>
          </div>
        </section>

        {/* How it works */}
        <section className="pb-16">
          <p className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-6 text-center">
            How it works
          </p>
          <div className="space-y-4">
            {[
              {
                n: "1",
                title: "Tell us about your race and training",
                body: "Race date, distance, your swim, bike and run baseline, and how busy life is right now",
              },
              {
                n: "2",
                title: "Our scoring engine assesses your readiness",
                body: "A deterministic system built on real triathlon knowledge — not guesswork",
              },
              {
                n: "3",
                title: "Get a clear REGISTER or DEFER verdict",
                body: "With score breakdown, key risks, and one specific next step",
              },
            ].map((step) => (
              <div
                key={step.n}
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center"
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mx-auto mb-3"
                  style={{ backgroundColor: "#FFFFFF", border: "1px solid #C8502A", color: "#C8502A" }}
                >
                  {step.n}
                </div>
                <p className="font-semibold text-gray-900 mb-1">{step.title}</p>
                <p className="text-sm text-gray-500 leading-relaxed">{step.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Founder quote */}
        <section className="pb-16">
          <div
            className="bg-white rounded-2xl p-7 shadow-sm border border-gray-100"
            style={{ borderLeft: "3px solid #C8502A" }}
          >
            <p className="text-gray-700 leading-relaxed mb-4 italic">
              &ldquo;I signed up for my first triathlon with no open water experience. My wetsuit
              arrived the day before the race. Finish Line is the conversation I wish I&apos;d
              had.&rdquo;
            </p>
            <p className="text-sm font-medium text-gray-500">
              — Ramki Vaidyanathan, triathlete
            </p>
          </div>
        </section>

        {/* Coming soon teaser */}
        <section className="pb-20 text-center">
          <p className="text-sm text-gray-400">
            Race finder coming soon — we&apos;ll match you with beginner-friendly events near you
          </p>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-8">
        <div className="max-w-2xl mx-auto px-6 text-center text-sm text-gray-500">
          <span className="font-semibold" style={{ color: "#C8502A" }}>
            FinishLine
          </span>{" "}
          — Built for triathletes who want honest answers, not hype.
          <div className="mt-2">
            <a
              href="https://www.linkedin.com/in/ramkiv/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-gray-400 hover:text-gray-500 transition-colors"
            >
              Built by Ramki Vaidyanathan →
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
