import { useState, useEffect, useRef, useCallback } from "react";
import { ExternalLink, Check, Trophy, FileSearch } from "lucide-react";
import UploadZip from "@/components/UploadZip";
import UploadJD from "@/components/UploadJD";

const STEPS = [
  { key: "resumes", label: "Upload resumes" },
  { key: "jd", label: "Add job description" },
  { key: "results", label: "Review ranking" },
];

// Colour-code a match score so the best candidates stand out at a glance
const scoreTone = (score) => {
  if (score >= 75)
    return {
      bar: "bg-[#34c759]",
      text: "text-[#1f9d45] dark:text-[#34c759]",
      chip: "bg-[#34c759]/12 text-[#1f9d45] dark:text-[#34c759]",
      label: "Strong match",
    };
  if (score >= 50)
    return {
      bar: "bg-[#0071e3] dark:bg-[#2997ff]",
      text: "text-[#0071e3] dark:text-[#2997ff]",
      chip: "bg-[#0071e3]/10 text-[#0071e3] dark:bg-[#2997ff]/15 dark:text-[#2997ff]",
      label: "Good match",
    };
  return {
    bar: "bg-[#ff9f0a]",
    text: "text-[#c77700] dark:text-[#ff9f0a]",
    chip: "bg-[#ff9f0a]/12 text-[#c77700] dark:text-[#ff9f0a]",
    label: "Partial match",
  };
};

// "john_doe-resume.pdf" -> "John Doe Resume"
const prettyName = (name) =>
  name
    .replace(/\.[^.]+$/, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());

// Animates a number from 0 up to `to` (ease-out), starting after `delay` ms
function CountUp({ to, delay = 0, duration = 1100 }) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let raf;
    let start;
    const timer = setTimeout(() => {
      const tick = (t) => {
        if (start === undefined) start = t;
        const p = Math.min(1, (t - start) / duration);
        setValue(Math.round(to * (1 - Math.pow(1 - p, 3))));
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }, delay);
    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(raf);
    };
  }, [to, delay, duration]);
  return <>{value}</>;
}

function Stepper({ current }) {
  return (
    <ol className="flex items-center justify-center gap-2 sm:gap-3 mt-8 flex-wrap" data-testid="app-stepper">
      {STEPS.map((step, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={step.key} className="flex items-center gap-2 sm:gap-3">
            <div
              className={`flex items-center gap-2 rounded-full pl-1.5 pr-3.5 py-1.5 text-[13px] border transition-all duration-300 ${
                active
                  ? "step-active bg-[#0071e3]/10 dark:bg-[#2997ff]/15 border-[#0071e3]/30 dark:border-[#2997ff]/40 text-[#0071e3] dark:text-[#2997ff] font-medium"
                  : done
                  ? "border-[#34c759]/30 text-[#1f9d45] dark:text-[#34c759] bg-[#34c759]/8"
                  : "border-black/10 dark:border-white/10 text-neutral-500 dark:text-neutral-400"
              }`}
              aria-current={active ? "step" : undefined}
            >
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-semibold ${
                  done
                    ? "bg-[#34c759] text-white"
                    : active
                    ? "bg-[#0071e3] dark:bg-[#2997ff] text-white dark:text-black"
                    : "bg-black/8 dark:bg-white/10"
                }`}
              >
                {done ? <Check size={12} strokeWidth={3} className="pop-in" /> : i + 1}
              </span>
              {step.label}
            </div>
            {i < STEPS.length - 1 && (
              <span
                className={`hidden sm:block w-6 h-px ${
                  done ? "bg-[#34c759]/50" : "bg-black/15 dark:bg-white/15"
                }`}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}

function ResultsSkeleton() {
  return (
    <div className="apple-card overflow-hidden animate-fade-in" data-testid="results-loading">
      <div className="divide-y divide-black/5 dark:divide-white/10">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-6 px-6 py-5">
            <div className="skeleton h-4 w-6" />
            <div className="skeleton h-4 flex-1 max-w-[280px]" />
            <div className="skeleton h-3 w-32 hidden sm:block" />
            <div className="skeleton h-4 w-14 ml-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AppExperience() {
  const [sessionId] = useState(() => {
    const cached = sessionStorage.getItem("hire_help_session_id");
    if (cached) return cached;
    const generated = `session-${Math.random().toString(36).substring(2, 11)}-${Date.now()}`;
    sessionStorage.setItem("hire_help_session_id", generated);
    return generated;
  });
  const [candidates, setCandidates] = useState([]);
  const [zipStatus, setZipStatus] = useState("idle");
  const [jdStatus, setJdStatus] = useState("idle");
  const resultsRef = useRef(null);

  // Show each resume once: if the same file appears more than once (e.g. the ZIP was
  // uploaded twice in one session) keep only its highest-scoring entry.
  const uniqueByName = new Map();
  for (const c of candidates) {
    const key = (c.file_name || c.name || c.fileName || c.id || "").toString().toLowerCase();
    const existing = uniqueByName.get(key);
    if (!existing || (c.score || 0) > (existing.score || 0)) uniqueByName.set(key, c);
  }
  const rows = [...uniqueByName.values()].sort((a, b) => (b.score || 0) - (a.score || 0));

  const resumesReady = zipStatus === "success";
  const ranking = jdStatus === "uploading";
  const currentStep = rows.length > 0 ? 2 : resumesReady ? 1 : 0;

  // Bring the fresh results into view once ranking finishes
  useEffect(() => {
    if (jdStatus === "success" && rows.length > 0) {
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jdStatus]);

  const handleZipStatus = useCallback((s) => {
    setZipStatus(s);
    if (s === "uploading") setCandidates([]);
  }, []);
  const handleJdStatus = useCallback((s) => setJdStatus(s), []);

  return (
    <div className="hero-wash min-h-screen relative" data-testid="app-experience-page">
      <div className="hero-orbs" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <section className="pt-16 pb-6 md:pt-24 relative z-10">
        <div className="max-w-[980px] mx-auto px-6 text-center">
          <div className="rise-in text-[13px] font-medium tracking-tight text-[#0071e3] dark:text-[#2997ff] mb-3">
            Candidate matching
          </div>
          <h1
            className="rise-in hl-display text-[clamp(38px,6vw,64px)] text-neutral-900 dark:text-white"
            style={{ "--d": "120ms" }}
            data-testid="app-title"
          >
            Rank resumes against
            <br />
            <span className="text-gradient">any role.</span>
          </h1>
          <p
            className="rise-in mt-5 text-[18px] leading-relaxed text-neutral-600 dark:text-neutral-400 max-w-[640px] mx-auto"
            style={{ "--d": "240ms" }}
          >
            Upload a batch of resumes, then add the job description. Your best-fit candidates
            appear below, ranked by match score.
          </p>
          <div className="rise-in" style={{ "--d": "360ms" }}>
            <Stepper current={currentStep} />
          </div>
        </div>
      </section>

      <section className="pt-6 pb-16 relative z-10">
        <div className="max-w-[980px] mx-auto px-6 grid md:grid-cols-2 gap-4">
          <div className="rise-in" style={{ "--d": "480ms" }}>
            <UploadZip sessionId={sessionId} onStatusChange={handleZipStatus} />
          </div>
          <div className="rise-in" style={{ "--d": "600ms" }}>
            <UploadJD
              sessionId={sessionId}
              setCandidates={setCandidates}
              onStatusChange={handleJdStatus}
              resumesReady={resumesReady}
            />
          </div>
        </div>
      </section>

      <section className="pb-24 scroll-mt-20 relative z-10" ref={resultsRef}>
        <div className="max-w-[980px] mx-auto px-6">
          <div className="flex items-end justify-between mb-6">
            <div>
              <div className="text-[13px] font-medium tracking-tight text-[#0071e3] dark:text-[#2997ff] mb-1">
                Results
              </div>
              <h2 className="hl-headline text-[26px] md:text-[34px] text-neutral-900 dark:text-white">
                Ranked candidates
              </h2>
            </div>
            {rows.length > 0 && !ranking && (
              <div className="text-[12px] font-mono text-neutral-500 pb-1">
                Top {rows.length} of your resumes
              </div>
            )}
          </div>

          {ranking ? (
            <ResultsSkeleton />
          ) : rows.length === 0 ? (
            <div
              className="apple-card p-10 md:p-14 text-center"
              data-testid="results-empty"
            >
              <div className="w-12 h-12 mx-auto rounded-2xl bg-[#0071e3]/10 dark:bg-[#2997ff]/15 flex items-center justify-center text-[#0071e3] dark:text-[#2997ff]">
                <FileSearch size={22} />
              </div>
              <div className="mt-4 text-[17px] font-medium text-neutral-800 dark:text-neutral-100">
                No rankings yet
              </div>
              <p className="mt-1.5 text-[14px] text-neutral-500 dark:text-neutral-400 max-w-[420px] mx-auto">
                {resumesReady
                  ? "Your resumes are ready. Upload a job description in Step 02 to see who fits best."
                  : "Upload your resumes in Step 01, then add a job description in Step 02 to see the ranked table here."}
              </p>
            </div>
          ) : (
            <div className="apple-card overflow-hidden animate-fade-in">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-white/10">
                  <thead className="bg-black/[0.015] dark:bg-white/[0.02]">
                    <tr className="text-[11px] font-mono uppercase tracking-widest text-neutral-500">
                      <th className="px-6 py-3 text-left w-16">Rank</th>
                      <th className="px-6 py-3 text-left">Resume</th>
                      <th className="px-6 py-3 text-left">Match Score</th>
                      <th className="px-6 py-3 text-right">Link to Resume</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-white/10 bg-white dark:bg-[#1c1c1e]">
                    {rows.map((candidate, index) => {
                      const resumeName =
                        candidate.file_name || candidate.name || candidate.fileName || "Unknown Document";

                      // Pull directly as a clean base number out of 100
                      const scoreValue = typeof candidate.score === "number" ? candidate.score : 0;
                      const tone = scoreTone(scoreValue);

                      return (
                        <tr
                          key={candidate.id || `${resumeName}-${index}`}
                          data-testid={`result-row-${index}`}
                          style={{ "--d": `${index * 90}ms` }}
                          className={`row-in hover:bg-black/[0.02] dark:hover:bg-white/[0.03] transition-colors ${
                            index === 0 ? "bg-[#0071e3]/[0.04] dark:bg-[#2997ff]/[0.05]" : ""
                          }`}
                        >
                          <td className="px-6 py-4">
                            {index === 0 ? (
                              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#ffcc00]/20 text-[#b38600] dark:text-[#ffd60a]">
                                <Trophy size={14} className="trophy-bob" />
                              </span>
                            ) : (
                              <span className="text-[13px] font-mono text-neutral-500 pl-2">
                                {index + 1}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div
                              className="text-[14px] font-medium text-neutral-800 dark:text-neutral-100 truncate max-w-[360px]"
                              title={resumeName}
                            >
                              {prettyName(resumeName) || resumeName}
                            </div>
                            <div className="mt-0.5 flex items-center gap-2 min-w-0">
                              <span className="text-[11px] font-mono text-neutral-400 truncate max-w-[240px]">
                                {resumeName}
                              </span>
                              {index === 0 && (
                                <span className="pop-in text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded-full bg-[#ffcc00]/20 text-[#b38600] dark:text-[#ffd60a]" style={{ animationDelay: "700ms" }}>
                                  Best match
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-4 min-w-[220px]">
                              <div className="w-24 bg-neutral-200/60 dark:bg-neutral-800 h-2 rounded-full overflow-hidden flex-shrink-0">
                                <div
                                  className={`bar-grow h-full rounded-full ${tone.bar}`}
                                  style={{
                                    width: `${Math.min(100, Math.max(0, scoreValue))}%`,
                                    "--d": `${index * 90 + 250}ms`,
                                  }}
                                />
                              </div>
                              <span className={`text-[13px] font-mono font-medium w-10 tabular-nums ${tone.text}`}>
                                <CountUp to={scoreValue} delay={index * 90 + 250} />%
                              </span>
                              <span
                                className={`hidden md:inline text-[10px] font-medium px-2 py-0.5 rounded-full ${tone.chip}`}
                              >
                                {tone.label}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            {candidate.resume_url ? (
                              <a
                                href={candidate.resume_url}
                                target="_blank"
                                rel="noreferrer"
                                data-testid={`result-link-${index}`}
                                className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#0071e3] dark:text-[#2997ff] px-3 py-1.5 rounded-full hover:bg-[#0071e3]/10 dark:hover:bg-[#2997ff]/15 transition-colors"
                              >
                                Open <ExternalLink size={12} />
                              </a>
                            ) : (
                              <span className="text-[13px] text-neutral-400">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
