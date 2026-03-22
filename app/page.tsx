import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F7F5F0" }}>
      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <div className="text-2xl font-bold" style={{ color: "#C8502A" }}>
          FinishLine
        </div>
        <div className="flex items-center gap-6 text-sm font-medium text-gray-600">
          <Link href="/evaluate" className="hover:text-gray-900 transition-colors">
            Evaluate a Race
          </Link>
          <Link
            href="/evaluate"
            className="px-4 py-2 rounded-full text-white text-sm font-semibold transition-colors"
            style={{ backgroundColor: "#C8502A" }}
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 py-20 text-center">
        <div className="inline-block mb-4 px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase" style={{ backgroundColor: "#f0e8e4", color: "#C8502A" }}>
          Triathlon Decision Tool
        </div>
        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
          Should you register
          <br />
          <span style={{ color: "#C8502A" }}>or defer?</span>
        </h1>
        <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
          Get a clear, honest answer based on your real readiness —{" "}
          <span className="font-medium text-gray-800">not optimism</span>
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/evaluate"
            className="inline-flex items-center justify-center px-8 py-4 rounded-full text-white font-semibold text-lg transition-all hover:opacity-90 hover:shadow-lg"
            style={{ backgroundColor: "#C8502A" }}
          >
            Evaluate a Race
            <svg className="ml-2 w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
          <Link
            href="/evaluate"
            className="inline-flex items-center justify-center px-8 py-4 rounded-full font-semibold text-lg border-2 transition-all hover:bg-white"
            style={{ borderColor: "#C8502A", color: "#C8502A" }}
          >
            Find a Race For Me
          </Link>
        </div>
      </section>

      {/* Feature Cards */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5" style={{ backgroundColor: "#f0e8e4" }}>
              <svg className="w-6 h-6" style={{ color: "#C8502A" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Evaluate a Race</h3>
            <p className="text-gray-600 leading-relaxed">
              Tell us about the race and your current training. We&apos;ll give you an honest readiness assessment.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5" style={{ backgroundColor: "#f0e8e4" }}>
              <svg className="w-6 h-6" style={{ color: "#C8502A" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Pick a Race</h3>
            <p className="text-gray-600 leading-relaxed">
              Not sure which race fits your current level? We&apos;ll match you with beginner-friendly options in your area.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5" style={{ backgroundColor: "#f0e8e4" }}>
              <svg className="w-6 h-6" style={{ color: "#C8502A" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Clear Decision</h3>
            <p className="text-gray-600 leading-relaxed">
              No vague advice. You get a direct REGISTER or DEFER verdict with the reasoning laid out clearly.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-8">
        <div className="max-w-6xl mx-auto px-6 text-center text-sm text-gray-500">
          <span className="font-semibold" style={{ color: "#C8502A" }}>FinishLine</span> — Built for triathletes who want honest answers, not hype.
        </div>
      </footer>
    </div>
  );
}
