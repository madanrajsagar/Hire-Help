import { Link } from "react-router-dom";
import { ArrowRight, Target, Compass, Heart } from "lucide-react";
import Reveal from "@/components/Reveal";

const values = [
    { icon: Target, title: "Signal over noise", body: "We build tools that surface what matters and leave the rest behind." },
    { icon: Compass, title: "Calm software", body: "Great tools stay out of the way. Ours should feel like a good pen." },
    { icon: Heart, title: "Made for real workflows", body: "Every choice is tested against a real recruiter’s Tuesday morning." },
];

const timeline = [
    { year: "Idea", title: "A quiet frustration", body: "Recruiters shouldn’t have to open 80 PDFs to find the top 5. There had to be a better default." },
    { year: "Prototype", title: "Vectors over keywords", body: "Early experiments with sentence embeddings turned buzzword‑heavy JDs into signal, and the results felt right." },
    { year: "v1", title: "A tool worth shipping", body: "We paired a de‑buzzification retriever with a clean review UI. What you see today is that pairing." },
];

export default function About() {
    return (
        <div data-testid="about-page">
            <section className="hero-wash pt-20 pb-16 md:pt-28 md:pb-24">
                <div className="max-w-[900px] mx-auto px-6 text-center">
                    <Reveal>
                        <div className="text-[13px] font-medium tracking-tight text-[#0071e3] dark:text-[#2997ff] mb-3">
                            About
                        </div>
                    </Reveal>
                    <Reveal delay={80}>
                        <h1 className="hl-display text-[clamp(44px,6.5vw,76px)] text-neutral-900 dark:text-white">
                            Made for teams
                            <br />
                            who take hiring seriously.
                        </h1>
                    </Reveal>
                    <Reveal delay={160}>
                        <p className="mt-6 text-[19px] leading-relaxed text-neutral-600 dark:text-neutral-400 max-w-[640px] mx-auto">
                            Hire Help is a focused tool for recruiters and small hiring teams
                            who want fewer tabs, faster shortlists, and better first passes.
                        </p>
                    </Reveal>
                </div>
            </section>

            <section className="band-white py-16 md:py-24">
                <div className="max-w-[820px] mx-auto px-6">
                    <Reveal>
                        <h2 className="hl-headline text-[28px] md:text-[36px] text-neutral-900 dark:text-white">
                            Our story
                        </h2>
                    </Reveal>
                    <Reveal delay={80}>
                        <p className="mt-6 text-[19px] leading-[1.6] text-neutral-600 dark:text-neutral-400">
                            We built Hire Help because screening resumes shouldn't take all night. Keyword filters miss great people, traditional platforms are bloated, and strong candidates get buried under bad layout templates.

                            Hire Help changes that. It understands candidates by their core ideas, not just their buzzwords—matching true intent directly to your job description so you get a trusted shortlist in seconds
                        </p>
                    </Reveal>
                    
                    
                </div>
            </section>

            <section className="band-light py-16 md:py-24">
                <div className="max-w-[1080px] mx-auto px-6">
                    <Reveal>
                        <h2 className="hl-display text-[36px] md:text-[52px] text-neutral-900 dark:text-white text-center max-w-[680px] mx-auto">
                            What we care about.
                        </h2>
                    </Reveal>
                    <div className="grid md:grid-cols-3 gap-4 mt-14">
                        {values.map((v, i) => (
                            <Reveal key={v.title} delay={i * 80}>
                                <div className="apple-card p-8 h-full">
                                    <v.icon size={22} className="text-[#0071e3] dark:text-[#2997ff]" />
                                    <h3 className="hl-headline text-[22px] mt-4 text-neutral-900 dark:text-white">
                                        {v.title}
                                    </h3>
                                    <p className="mt-2 text-[15px] leading-[1.55] text-neutral-600 dark:text-neutral-400">
                                        {v.body}
                                    </p>
                                </div>
                            </Reveal>
                        ))}
                    </div>
                </div>
            </section>

            <section className="band-white py-16 md:py-24">
                <div className="max-w-[820px] mx-auto px-6">
                    <Reveal>
                        <h2 className="hl-headline text-[28px] md:text-[36px] text-neutral-900 dark:text-white mb-10">
                            How we got here
                        </h2>
                    </Reveal>
                    <div className="space-y-4">
                        {timeline.map((t, i) => (
                            <Reveal key={t.year} delay={i * 80}>
                                <div className="apple-card p-8 grid md:grid-cols-[140px_1fr] gap-6">
                                    <div className="text-[13px] font-mono tracking-widest text-[#0071e3] dark:text-[#2997ff] uppercase">
                                        {t.year}
                                    </div>
                                    <div>
                                        <h3 className="hl-headline text-[22px] text-neutral-900 dark:text-white">
                                            {t.title}
                                        </h3>
                                        <p className="mt-2 text-[16px] leading-[1.6] text-neutral-600 dark:text-neutral-400">
                                            {t.body}
                                        </p>
                                    </div>
                                </div>
                            </Reveal>
                        ))}
                    </div>
                </div>
            </section>

            <section className="band-light py-20 md:py-28">
                <div className="max-w-[720px] mx-auto px-6 text-center">
                    <Reveal>
                        <h2 className="hl-display text-[36px] md:text-[56px] text-neutral-900 dark:text-white">
                            Come see it in action.
                        </h2>
                    </Reveal>
                    <Reveal delay={100}>
                        <div className="mt-8">
                            <Link to="/app" className="btn-apple btn-primary-apple" data-testid="about-cta-launch">
                                Launch app <ArrowRight size={16} />
                            </Link>
                        </div>
                    </Reveal>
                </div>
            </section>
        </div>
    );
}