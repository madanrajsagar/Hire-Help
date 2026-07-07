import { useEffect, useState } from 'react';
import { UploadZip } from './UploadZip';
import { UploadJD } from './UploadJD';

const tierFor = (score) => {
  if (score >= 0.65) return 'high';
  if (score >= 0.45) return 'mid';
  return 'low';
};

export function AppExperience({ onBackToLanding }) {
  const [sessionId, setSessionId] = useState('');
  const [candidates, setCandidates] = useState([]);

  useEffect(() => {
    setSessionId(`session-${Math.random().toString(36).substr(2, 9)}-${Date.now()}`);
  }, []);

  const ranked = [...candidates].sort((a, b) => b.score - a.score);
  const avgScore =
    ranked.length > 0 ? ranked.reduce((sum, candidate) => sum + candidate.score, 0) / ranked.length : 0;
  const topScore = ranked.length > 0 ? ranked[0].score : 0;

  return (
    <div className="experience-shell">
      <div className="experience-bg-glow experience-bg-glow-one" />
      <div className="experience-bg-glow experience-bg-glow-two" />
      <div className="experience-topbar">
        <div className="brand-lockup">
          <span className="brand-mark" />
          <div>
            <div className="brand-name">Hire Help</div>
            <div className="brand-tag">Resume intelligence for busy teams</div>
          </div>
        </div>
        <button className="ghost-button" onClick={onBackToLanding}>
          Back to landing
        </button>
      </div>

      <div className="app-shell">
        <header className="app-header">
          <div className="app-eyebrow">Candidate Matching</div>
          <h1 className="app-title">Rank resumes against any role</h1>
          <p className="app-subtitle">
            Load a batch of resumes, then upload a job description. Every resume is scored for fit,
            ranked for fast review, and linked back to the source document so the handoff stays
            clean.
          </p>
        </header>

        <div className="summary-strip">
          <div>
            <span>Step A</span>
            <strong>Upload ZIP</strong>
            <p>Prepare the candidate set in one quick pass.</p>
          </div>
          <div>
            <span>Step B</span>
            <strong>Add JD</strong>
            <p>Match the role against every resume semantically.</p>
          </div>
          <div>
            <span>Step C</span>
            <strong>Review shortlist</strong>
            <p>See scores, priorities, and resume links together.</p>
          </div>
        </div>

        <div className="step-grid">
          <UploadZip sessionId={sessionId} />
          <UploadJD sessionId={sessionId} setCandidates={setCandidates} />
        </div>

        <section>
          <div className="results-header">
            <h2 className="results-title">Ranked candidates</h2>
            {ranked.length > 0 && <span className="results-count">{ranked.length} scored</span>}
          </div>

          {ranked.length === 0 ? (
            <div className="results-empty">
              No candidates yet — complete steps 01 and 02 to see rankings here.
            </div>
          ) : (
            <>
              <div className="stat-row">
                <div className="stat-card">
                  <p className="stat-label">Candidates scored</p>
                  <p className="stat-value">{ranked.length}</p>
                </div>
                <div className="stat-card">
                  <p className="stat-label">Top match</p>
                  <p className={`stat-value tier-${tierFor(topScore)}`}>{topScore.toFixed(2)}</p>
                </div>
                <div className="stat-card">
                  <p className="stat-label">Average match</p>
                  <p className={`stat-value tier-${tierFor(avgScore)}`}>{avgScore.toFixed(2)}</p>
                </div>
              </div>

              <div className="results-table-wrap">
                <table className="results-table">
                  <thead>
                    <tr>
                      <th className="rank-cell-head">#</th>
                      <th>Resume</th>
                      <th>Match</th>
                      <th>Link</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ranked.map((candidate, index) => {
                      const tier = tierFor(candidate.score);
                      const pct = Math.max(0, Math.min(100, candidate.score * 100));
                      return (
                        <tr key={index} className={index === 0 ? 'top-match' : ''}>
                          <td className="rank-cell">
                            <span className="rank-pill">{index + 1}</span>
                          </td>
                          <td className="file-cell">
                            <div className="file-cell-name">
                              <span className="truncate" title={candidate.file_name}>
                                {candidate.file_name}
                              </span>
                              {index === 0 && <span className="top-badge">Top match</span>}
                            </div>
                          </td>
                          <td className="match-cell">
                            <div className="match-meter">
                              <div className="match-meter-track">
                                <div
                                  className={`match-meter-fill tier-${tier}`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <span className={`match-meter-value tier-${tier}`}>
                                {candidate.score.toFixed(4)}
                              </span>
                            </div>
                          </td>
                          <td className="link-cell">
                            <a href={candidate.resume_url} target="_blank" rel="noreferrer">
                              Open resume ↗
                            </a>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
