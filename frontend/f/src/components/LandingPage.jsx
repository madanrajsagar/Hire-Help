import { useEffect, useState } from 'react';

const spotlightItems = [
  'Rank a pile of resumes in seconds.',
  'See the strongest candidates first.',
  'Share a shortlist with one click.',
];

const featureCards = [
  {
    title: 'Batch resume screening',
    detail: 'Upload a ZIP and let the pipeline extract, embed, and score candidates automatically.',
  },
  {
    title: 'JD-aware matching',
    detail: 'Paste a job description and get ranked results based on relevance, not guesswork.',
  },
  {
    title: 'Direct candidate links',
    detail: 'Each match includes a resume link so reviewers can move from score to action quickly.',
  },
];

const processSteps = [
  {
    label: '01',
    title: 'Upload resumes',
    body: 'Drop a zipped folder of candidate resumes and the backend prepares every file for scoring.',
  },
  {
    label: '02',
    title: 'Add the role',
    body: 'Paste the job description you are hiring for and let semantic matching do the heavy lifting.',
  },
  {
    label: '03',
    title: 'Review ranked matches',
    body: 'The app returns the best-fit candidates first, with score bars, links, and a clean summary.',
  },
];

export function LandingPage({ onTryForFree }) {
  const [spotlightIndex, setSpotlightIndex] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setSpotlightIndex((current) => (current + 1) % spotlightItems.length);
    }, 2600);

    return () => window.clearInterval(interval);
  }, []);

  return (
    <div className="landing-shell">
      <div className="landing-grid-overlay" />
      <div className="landing-orb landing-orb-one" />
      <div className="landing-orb landing-orb-two" />

      <header className="landing-nav">
        <div className="brand-lockup">
          <span className="brand-mark" />
          <div>
            <div className="brand-name">Hire Help</div>
            <div className="brand-tag">Screen resumes with less drag</div>
          </div>
        </div>

        <button className="cta-button cta-button-top" onClick={onTryForFree}>
          Try for free
        </button>
      </header>

      <main className="landing-hero">
        <div className="landing-copy">
          <div className="hero-pill">Fast hiring workflow</div>
          <h1>Turn a folder of resumes into a ranked shortlist.</h1>
          <p>
            Hire Help turns unstructured resume piles into a guided review experience. Upload a ZIP,
            describe the role, and get a ranked shortlist with score-based ordering, direct resume
            links, and a workflow your team can understand at a glance.
          </p>

          <div className="hero-spotlight">
            <span className="hero-spotlight-label">Live message</span>
            <span className="hero-spotlight-text">{spotlightItems[spotlightIndex]}</span>
          </div>

          <div className="hero-actions">
            <button className="cta-button" onClick={onTryForFree}>
              Try for free
            </button>
            <span className="hero-note">No signup friction, just start screening.</span>
          </div>

          <div className="hero-metrics">
            <div>
              <strong>2-step flow</strong>
              <span>upload and rank</span>
            </div>
            <div>
              <strong>Semantic search</strong>
              <span>vector-based matching</span>
            </div>
            <div>
              <strong>Direct access</strong>
              <span>resume links in every result</span>
            </div>
          </div>

          <div className="feature-grid">
            {featureCards.map((card) => (
              <article key={card.title} className="feature-card">
                <h3>{card.title}</h3>
                <p>{card.detail}</p>
              </article>
            ))}
          </div>
        </div>

        <div className="hero-card hero-preview">
          <div className="preview-header">
            <div>
              <span className="preview-eyebrow">Product preview</span>
              <h2>What users see after clicking Try for free</h2>
            </div>
            <div className="preview-dot-row">
              <span className="preview-dot" />
              <span className="preview-dot" />
              <span className="preview-dot" />
            </div>
          </div>

          <div className="preview-mock">
            <div className="preview-stack preview-stack-primary">
              <div>
                <span className="preview-stack-label">Step 01</span>
                <strong>Upload resumes</strong>
              </div>
              <span className="preview-stack-score">92%</span>
            </div>
            <div className="preview-stack preview-stack-secondary">
              <div>
                <span className="preview-stack-label">Step 02</span>
                <strong>Upload job description</strong>
              </div>
              <span className="preview-stack-score">Ready</span>
            </div>
            <div className="preview-feed">
              {processSteps.map((step) => (
                <div key={step.label} className="preview-feed-item">
                  <span>{step.label}</span>
                  <div>
                    <strong>{step.title}</strong>
                    <p>{step.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="preview-footnote">
            A polished landing experience built to explain the product before the workflow starts.
          </div>
        </div>
      </main>

      <section className="landing-info-grid">
        <article className="landing-info-panel landing-info-panel-primary">
          <span className="info-kicker">Why teams use it</span>
          <h3>Clearer shortlist reviews, less manual sorting.</h3>
          <p>
            Instead of opening each resume one by one, hiring teams can compare relative fit,
            surface the strongest matches early, and keep the review process consistent.
          </p>
        </article>

        <article className="landing-info-panel">
          <span className="info-kicker">Built for</span>
          <div className="chip-row">
            <span>Recruiters</span>
            <span>Founders</span>
            <span>HR teams</span>
            <span>Agency workflows</span>
          </div>
          <p>
            Ideal when you want a clean interface, quick interpretation, and a strong first-pass
            ranking before deeper review.
          </p>
        </article>
      </section>
    </div>
  );
}
