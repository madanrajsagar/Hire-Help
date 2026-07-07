import { Link } from "react-router-dom";
import { ArrowRight, Sparkles, Search, Zap, FileText, BarChart3, Shield } from "lucide-react";
import Reveal from "@/components/Reveal";
import MockRankingPreview from '@/components/MockRankingPreview';

export default function Landing() {
    return (
        <div data-testid="landing-page">
            {/* HERO SECTION - Now cleanly focused on just the text and CTAs */}
            <section className="hero-wash pt-20 pb-16 md:pt-32 md:pb-20 min-h-[75vh] flex flex-col justify-center">
                <div className="max-w-[980px] mx-auto px-6 text-center">
                    <Reveal>
                        <div className="inline-flex items-center gap-2 text-[12px] font-medium tracking-tight text-neutral-500 dark:text-neutral-400 mb-4" data-testid="hero-eyebrow">
                            <Sparkles size={13} className="text-[#0071e3] dark:text-[#2997ff]" />
                            Introducing Hire Help — resume intelligence
                        </div>
                    </Reveal>

                    <Reveal delay={80}>
                        <h1 className="hl-display text-[clamp(48px,7.5vw,88px)] text-neutral-900 dark:text-white leading-[1.1]" data-testid="hero-title">
                            Screen resumes.
                            <br />
                            <span className="bg-gradient-to-r from-[#0071e3] to-[#5e5ce6] dark:from-[#2997ff] dark:to-[#8f80ff] bg-clip-text text-transparent">
                                Effortlessly.
                            </span>
                        </h1>
                    </Reveal>

                    <Reveal delay={160}>
                        <p className="mt-6 text-[19px] md:text-[22px] leading-relaxed text-neutral-600 dark:text-neutral-400 max-w-[720px] mx-auto">
                            Turn a folder of resumes into a ranked shortlist in seconds.
                            Powered by semantic embeddings and job‑description de‑buzzification.
                        </p>
                    </Reveal>

                    <Reveal delay={220}>
                        <div className="mt-8 flex items-center justify-center gap-3 flex-wrap">
                            <Link to="/app" className="btn-apple btn-primary-apple" data-testid="hero-cta-launch">
                                Launch app <ArrowRight size={16} />
                            </Link>
                            <Link to="/features" className="link-apple text-[17px]" data-testid="hero-cta-features">
                                Learn more <ArrowRight size={14} />
                            </Link>
                        </div>
                    </Reveal>
                </div>
            </section>

            {/* DEDICATED PREVIEW WRAPPER */}
            {/* This pushes the window down so it requires a scroll to fully experience, rather than clipping awkwardly */}
            <section className="pb-24 md:pb-32 px-6">
                <div className="max-w-[1080px] mx-auto">
                    <MockRankingPreview />
                </div>
            </section>

            {/* Value tiles */}
            <section className="band-light py-14 md:py-20">
                <div className="max-w-[1080px] mx-auto px-6 grid md:grid-cols-2 gap-4">
                    <Reveal>
                        <div className="apple-card p-10 md:p-14 h-full">
                            <div className="text-[13px] font-medium text-[#0071e3] dark:text-[#2997ff] mb-3">Semantic</div>
                            <h3 className="hl-headline text-[32px] md:text-[40px] mb-3 text-neutral-900 dark:text-white">
                                Meaning, not keywords.
                            </h3>
                            <p className="text-[17px] leading-[1.5] text-neutral-600 dark:text-neutral-400 max-w-[52ch]">
                                Vector embeddings compare candidates by intent — so a "front‑end
                                engineer" and a "UI developer" surface together, without brittle
                                keyword lists.
                            </p>
                            <Link to="/features" className="link-apple mt-6 inline-flex text-[15px]" data-testid="tile-link-semantic">
                                See how it works <ArrowRight size={13} />
                            </Link>
                        </div>
                    </Reveal>
                    <Reveal delay={100}>
                        <div className="apple-card p-10 md:p-14 h-full">
                            <div className="text-[13px] font-medium text-[#0071e3] dark:text-[#2997ff] mb-3">De‑buzzified</div>
                            <h3 className="hl-headline text-[32px] md:text-[40px] mb-3 text-neutral-900 dark:text-white">
                                Job specs, decoded.
                            </h3>
                            <p className="text-[17px] leading-[1.5] text-neutral-600 dark:text-neutral-400 max-w-[52ch]">
                                We strip the buzzwords from every JD and retain the real
                                requirements. What's left is a signal your ranking can trust.
                            </p>
                            <Link to="/features" className="link-apple mt-6 inline-flex text-[15px]" data-testid="tile-link-debuzzified">
                                Explore the pipeline <ArrowRight size={13} />
                            </Link>
                        </div>
                    </Reveal>
                </div>
            </section>

            {/* Three column features */}
            <section className="band-white py-16 md:py-24">
                <div className="max-w-[1080px] mx-auto px-6">
                    <Reveal>
                        <h2 className="hl-display text-[36px] md:text-[52px] text-neutral-900 dark:text-white text-center max-w-[720px] mx-auto">
                            Built for the way you actually hire.
                        </h2>
                    </Reveal>

                    <div className="grid md:grid-cols-3 gap-4 mt-12 md:mt-16">
                        {[
                            { icon: FileText, title: "Batch upload", body: "Drop a ZIP of resumes. We handle extraction and preparation automatically." },
                            { icon: Search, title: "JD‑aware search", body: "Paste the role and the retriever surfaces the closest candidates by intent." },
                            { icon: BarChart3, title: "Ranked results", body: "Score bars, top matches and direct links to every resume, in one screen." },
                            { icon: Zap, title: "Fast pipeline", body: "Embeddings computed once; queries feel instant even on large sets." },
                            { icon: Shield, title: "Private by default", body: "Session‑scoped storage — your candidate set stays isolated per run." },
                            { icon: Sparkles, title: "No signup", body: "Open the app and start screening. Zero friction, immediate value." },
                        ].map((f, i) => (
                            <Reveal key={f.title} delay={i * 60}>
                                <div className="apple-card p-8 h-full">
                                    <f.icon size={22} className="text-[#0071e3] dark:text-[#2997ff]" />
                                    <h3 className="hl-headline text-[22px] mt-4 text-neutral-900 dark:text-white">{f.title}</h3>
                                    <p className="mt-2 text-[15px] leading-[1.55] text-neutral-600 dark:text-neutral-400">{f.body}</p>
                                </div>
                            </Reveal>
                        ))}
                    </div>
                </div>
            </section>

            {/* How it works */}
            <section className="band-light py-16 md:py-24">
                <div className="max-w-[1080px] mx-auto px-6">
                    <div className="text-center mb-14">
                        <Reveal>
                            <div className="text-[13px] font-medium tracking-tight text-[#0071e3] dark:text-[#2997ff] mb-3">
                                How it works
                            </div>
                        </Reveal>
                        <Reveal delay={80}>
                            <h2 className="hl-display text-[36px] md:text-[52px] text-neutral-900 dark:text-white max-w-[760px] mx-auto">
                                Three steps between chaos and clarity.
                            </h2>
                        </Reveal>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4">
                        {[
                            { step: "01", title: "Upload", body: "A ZIP of resumes is all we need. Files are parsed and embedded on ingest." },
                            { step: "02", title: "Describe", body: "Add your job description. The retriever de‑buzzes and prepares the query." },
                            { step: "03", title: "Review", body: "Ranked candidates appear instantly with score bars and direct resume links." },
                        ].map((s, i) => (
                            <Reveal key={s.step} delay={i * 100}>
                                <div className="apple-card p-8">
                                    <div className="text-[12px] font-mono tracking-widest text-neutral-400 mb-4">STEP {s.step}</div>
                                    <h3 className="hl-headline text-[26px] text-neutral-900 dark:text-white">{s.title}</h3>
                                    <p className="mt-2 text-[15px] leading-[1.55] text-neutral-600 dark:text-neutral-400">{s.body}</p>
                                </div>
                            </Reveal>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="band-white py-20 md:py-28">
                <div className="max-w-[820px] mx-auto px-6 text-center">
                    <Reveal>
                        <h2 className="hl-display text-[40px] md:text-[64px] text-neutral-900 dark:text-white">
                            Ready to see the top of the pile?
                        </h2>
                    </Reveal>
                    <Reveal delay={100}>
                        <p className="mt-5 text-[19px] text-neutral-600 dark:text-neutral-400">
                            Open the app and rank your first batch in under a minute.
                        </p>
                    </Reveal>
                    <Reveal delay={200}>
                        <div className="mt-8 flex items-center justify-center gap-3 flex-wrap">
                            <Link to="/app" className="btn-apple btn-primary-apple" data-testid="cta-launch-bottom">
                                Launch app <ArrowRight size={16} />
                            </Link>
                            <Link to="/about" className="btn-apple btn-ghost-apple" data-testid="cta-about-bottom">
                                About Hire Help
                            </Link>
                        </div>
                    </Reveal>
                </div>
            </section>
        </div>
    );
}