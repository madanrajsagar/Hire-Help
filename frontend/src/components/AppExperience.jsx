import { useState } from "react";
import { ExternalLink } from "lucide-react";
import UploadZip from "@/components/UploadZip";
import UploadJD from "@/components/UploadJD";

export default function AppExperience() {
  const [sessionId] = useState(
    () => `session-${Math.random().toString(36).substring(2, 11)}-${Date.now()}`
  );
  const [candidates, setCandidates] = useState([]);

  const rows = [...candidates].sort((a, b) => (b.score || 0) - (a.score || 0));

  return (
    <div className="hero-wash min-h-screen" data-testid="app-experience-page">
      <section className="pt-16 pb-10 md:pt-24">
        <div className="max-w-[980px] mx-auto px-6 text-center">
          <div className="text-[13px] font-medium tracking-tight text-[#0071e3] dark:text-[#2997ff] mb-3">
            Candidate matching
          </div>
          <h1
            className="hl-display text-[clamp(38px,6vw,64px)] text-neutral-900 dark:text-white"
            data-testid="app-title"
          >
            Rank resumes against
            <br />
            any role.
          </h1>
          <p className="mt-5 text-[18px] leading-relaxed text-neutral-600 dark:text-neutral-400 max-w-[640px] mx-auto">
            Upload a batch of resumes, then upload the job description. The JD response will appear
            below as a table.
          </p>
        </div>  
      </section>

      <section className="pb-16">
        <div className="max-w-[980px] mx-auto px-6 grid md:grid-cols-2 gap-4">
          <UploadZip sessionId={sessionId} />
          <UploadJD sessionId={sessionId} setCandidates={setCandidates} />
        </div>
      </section>

      <section className="pb-24">
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
            {rows.length > 0 && (
              <div className="text-[12px] font-mono text-neutral-500">{rows.length} scored</div>
            )}
          </div>

          {rows.length === 0 ? (
            <div
              className="apple-card p-10 text-center text-[15px] text-neutral-500 dark:text-neutral-400"
              data-testid="results-empty"
            >
              No candidates yet — upload a JD to see the table.
            </div>
          ) : (
            <div className="apple-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-white/10">
                  <thead className="bg-black/[0.015] dark:bg-white/[0.02]">
                    <tr className="text-[11px] font-mono uppercase tracking-widest text-neutral-500">
                      <th className="px-6 py-3 text-left">Sr No.</th>
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

                      return (
                        <tr
                          key={candidate.id || `${resumeName}-${index}`}
                          data-testid={`result-row-${index}`}
                          className={`hover:bg-black/[0.02] dark:hover:bg-white/[0.03] transition-colors ${
                            index === 0 ? "bg-[#0071e3]/[0.02] dark:bg-[#2997ff]/[0.02]" : ""
                          }`}
                        >
                          <td className="px-6 py-4 text-[13px] font-mono text-neutral-500">
                            {index + 1}
                          </td>
                          <td className="px-6 py-4">
                            <div
                              className="text-[14px] font-medium text-neutral-800 dark:text-neutral-100 truncate max-w-[360px]"
                              title={resumeName}
                            >
                              {resumeName}
                            </div>
                          </td>
                          {/* Upgraded layout cell featuring inline visual progress markers */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-4 min-w-[180px]">
                              <div className="w-24 bg-neutral-200/60 dark:bg-neutral-800 h-2 rounded-full overflow-hidden flex-shrink-0">
                                <div
                                  className="h-full bg-[#0071e3] dark:bg-[#2997ff] rounded-full transition-all duration-1000 ease-out"
                                  style={{ width: `${scoreValue}%` }}
                                />
                              </div>
                              <span className="text-[13px] font-mono text-neutral-700 dark:text-neutral-200">
                                {scoreValue}%
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
                                className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#0071e3] dark:text-[#2997ff] hover:underline"
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