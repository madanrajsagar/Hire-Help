import { useState, useEffect } from 'react';

const RESUME_POOL = [
  "Pranv_Jha_resume.pdf",
  "Yash_Mulay_cv.pdf",
  "Pradnesh_Gawade.pdf",
  "Radhan_Dandekar_portfolio.pdf",
  "Sarthak_Godse_ux.docx",
  "Kunal_Yadav.pdf",
  "Mahesh_resume.pdf",
  "David_creative.docx",
  "Madan_cv.pdf",
  "Priyanka_Chopra_ux.pdf"
];

export default function MockRankingPreview() {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const getRandomScore = (min, max) => Math.random() * (max - min) + min;
    
    const shuffledNames = [...RESUME_POOL].sort(() => 0.5 - Math.random());
    const selectedNames = shuffledNames.slice(0, 4);

    const rawCandidates = [
      { id: 'c1', name: selectedNames[0], score: getRandomScore(0.85, 0.98) }, 
      { id: 'c2', name: selectedNames[1], score: getRandomScore(0.70, 0.82) }, 
      { id: 'c3', name: selectedNames[2], score: getRandomScore(0.55, 0.68) }, 
      { id: 'c4', name: selectedNames[3], score: getRandomScore(0.40, 0.53) }, 
    ];

    // Keep the DOM order static, but give them an initial random layoutIndex
    const initialIndices = [0, 1, 2, 3].sort(() => 0.5 - Math.random());
    
    setCandidates(
      rawCandidates.map((c, i) => ({
        ...c,
        displayScore: 0,
        top: false,
        layoutIndex: initialIndices[i] // Tracks physical layout position
      }))
    );
    setLoading(false);
    setIsVisible(true);

    // Step 1: Grow the progress bars smoothly
    const progressTimer = setTimeout(() => {
      setCandidates(prev => prev.map(c => ({ ...c, displayScore: c.score })));
    }, 600);

    // Step 2: Smoothly update the positioning coordinates (Rerank)
    const sortTimer = setTimeout(() => {
      setCandidates(prev => {
        // Find what the order SHOULD be based on score
        const sortedByScore = [...prev].sort((a, b) => b.score - a.score);
        
        return prev.map(c => {
          const newRankIndex = sortedByScore.findIndex(sorted => sorted.id === c.id);
          return {
            ...c,
            layoutIndex: newRankIndex,
            top: newRankIndex === 0
          };
        });
      });
    }, 2000);

    return () => {
      clearTimeout(progressTimer);
      clearTimeout(sortTimer);
    };
  }, []);

  if (loading) return null;

  // We multiply the index position by the exact box height + gap (approx 54px total per row)
  const ROW_HEIGHT_WITH_GAP = 54; 

  return (
    <div 
      className={`mt-20 md:mt-28 mx-auto max-w-[880px] w-full transition-all duration-1000 ease-out transform ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      }`}
    >
      <div className="mock-window overflow-hidden border border-black/5 dark:border-white/10 rounded-2xl shadow-xl bg-white dark:bg-[#1c1c1e]">
        {/* Top Window Header */}
        <div className="flex items-center gap-1.5 px-4 h-9 border-b border-black/5 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02]">
          <span className="w-3 h-3 rounded-full bg-[#ff5f57]" />
          <span className="w-3 h-3 rounded-full bg-[#febc2e]" />
          <span className="w-3 h-3 rounded-full bg-[#28c840]" />
          <span className="ml-4 text-[11px] font-mono text-neutral-500">hire-help.app / rank</span>
        </div>

        {/* Card Body */}
        <div className="p-6 md:p-8 text-left">
          <div className="flex items-center justify-between mb-5">
            <div>
              <div className="text-[11px] font-mono uppercase tracking-widest text-neutral-500">
                Ranked candidates
              </div>
              <div className="hl-headline text-[22px] mt-1 text-neutral-900 dark:text-white">
                Senior Product Designer
              </div>
            </div>
            <div className="text-[11px] font-mono text-neutral-500">
              {candidates.length} scored
            </div>
          </div>

          {/* Container must have an explicit height now because rows are absolutely positioned */}
          <div className="relative h-[216px]">
            {candidates.map((r) => (
              <div
                key={r.id} 
                className={`absolute left-0 right-0 flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-[800ms] ease-in-out transform`}
                style={{
                  transform: `translateY(${r.layoutIndex * ROW_HEIGHT_WITH_GAP}px)`,
                  backgroundColor: r.top ? "rgba(0, 113, 227, 0.05)" : "rgba(0, 0, 0, 0.02)",
                  borderColor: r.top ? "rgba(0, 113, 227, 0.2)" : "transparent",
                  borderWidth: "1px"
                }}
              >
                {/* Dynamically display actual rank position based on layout index */}
                <span className="w-6 text-center text-[12px] font-mono text-neutral-500">
                  {r.layoutIndex + 1}
                </span>
                
                <span className="flex-1 text-[14px] font-medium text-neutral-800 dark:text-neutral-100 truncate">
                  {r.name}
                </span>

                <div className="w-28 bg-neutral-200/50 dark:bg-neutral-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#0071e3] dark:bg-[#2997ff] rounded-full transition-all duration-[1200ms] ease-out"
                    style={{ width: `${(r.displayScore || 0) * 100}%` }}
                  />
                </div>

                <span className="w-14 text-right text-[13px] font-mono text-neutral-700 dark:text-neutral-200">
                  {(r.displayScore || 0).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}