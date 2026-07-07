import { Link } from "react-router-dom";
import {
  ArrowRight, UploadCloud, Layers, Cpu, Filter, Gauge, Link2,
  Sparkles, Lock, Users,
} from "lucide-react";
import Reveal from "@/components/Reveal";

const featureBlocks = [
  { tag: "Ingest",           icon: UploadCloud, title: "One ZIP. Every resume, ready.",
    body: "Upload a compressed archive of resumes and our pipeline extracts each document, normalises the text and indexes it in the background. Works with PDF and DOCX; large batches are chunked and processed in parallel." },
  { tag: "Embeddings",       icon: Cpu,        title: "Vector embeddings, on every ingest.",
    body: "Each resume becomes a dense vector representation trained to capture skills, seniority and domain. This is the foundation of semantic retrieval — the same query surfaces different phrasings of the same idea." },
  { tag: "De‑buzzification", icon: Filter,     title: "Strip the noise from job descriptions.",
    body: "JDs are cluttered with buzzwords. We remove filler like ‘rockstar’, ‘ninja’ and ‘synergy’ so the retriever operates on real signals — responsibilities, technologies and required experience." },
  { tag: "Retrieval",        icon: Layers,     title: "A retriever built for hiring.",
    body: "Cosine similarity across the cleaned JD vector and every candidate vector, weighted for section relevance. The result is an ordered shortlist ranked by fit, not keyword count." },
  { tag: "Ranking",          icon: Gauge,      title: "Scores you can read at a glance.",
    body: "Every candidate returns with a normalised match score, colour‑coded meter and a top‑match flag. Recruiters spot the strongest fits in seconds." },
  { tag: "Access",           icon: Link2,      title: "Straight to the source resume.",
    body: "Every ranked row links directly to the original file, so reviewers move from score to context without breaking flow." },
];

const pillars = [
  { icon: Sparkles, title: "Delightful",   body: "A calm, focused interface that stays out of your way." },
  { icon: Lock,     title: "Private",      body: "Session‑scoped storage — data doesn’t leak between runs." },
  { icon: Users,    title: "Collaborative",body: "Share ranked lists with the rest of your hiring team." },
];

export default function Features() {
  return (
    <div data-testid="features-page">
      <section className="hero-wash pt-20 pb-16 md:pt-28 md:pb-24">
        <div className="max-w-[900px] mx-auto px-6 text-center">
          <Reveal>
            <div className="text-[13px] font-medium tracking-tight text-[#0071e3] dark:text-[#2997ff] mb-3">
              Features
            </div>
          </Reveal>
          <Reveal delay={80}>
            <h1 className="hl-display text-[clamp(44px,6.5vw,76px)] text-neutral-900 dark:text-white">
              Everything you need to
              <br />
              find the right candidate.
            </h1>
          </Reveal>
          <Reveal delay={160}>
            <p className="mt-6 text-[19px] leading-relaxed text-neutral-600 dark:text-neutral-400 max-w-[640px] mx-auto">
              A focused set of capabilities, engineered together to move you
              from a folder of resumes to a shortlist you trust.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="band-white py-16 md:py-24">
        <div className="max-w-[980px] mx-auto px-6 space-y-8">
          {featureBlocks.map((f, i) => (
            <Reveal key={f.title}>
              <div
                className="apple-card p-8 md:p-12 grid md:grid-cols-[220px_1fr] gap-8 items-start"
                data-testid={`feature-block-${f.tag.toLowerCase()}`}
              >
                <div>
                  <div className="text-[12px] font-mono tracking-widest text-neutral-400">
                    0{i + 1}
                  </div>
                  <div className="mt-2 text-[13px] font-medium text-[#0071e3] dark:text-[#2997ff]">
                    {f.tag}
                  </div>
                  <f.icon size={28} className="mt-6 text-neutral-800 dark:text-neutral-200" />
                </div>
                <div>
                  <h3 className="hl-headline text-[26px] md:text-[34px] text-neutral-900 dark:text-white">
                    {f.title}
                  </h3>
                  <p className="mt-4 text-[17px] leading-[1.55] text-neutral-600 dark:text-neutral-400">
                    {f.body}
                  </p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="band-light py-16 md:py-24">
        <div className="max-w-[1080px] mx-auto px-6">
          <Reveal>
            <h2 className="hl-display text-[36px] md:text-[52px] text-neutral-900 dark:text-white text-center max-w-[720px] mx-auto">
              Small tool. Serious principles.
            </h2>
          </Reveal>
          <div className="grid md:grid-cols-3 gap-4 mt-14">
            {pillars.map((p, i) => (
              <Reveal key={p.title} delay={i * 80}>
                <div className="apple-card p-8">
                  <p.icon size={22} className="text-[#0071e3] dark:text-[#2997ff]" />
                  <h3 className="hl-headline text-[22px] mt-4 text-neutral-900 dark:text-white">
                    {p.title}
                  </h3>
                  <p className="mt-2 text-[15px] leading-[1.55] text-neutral-600 dark:text-neutral-400">
                    {p.body}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="band-white py-20 md:py-28">
        <div className="max-w-[720px] mx-auto px-6 text-center">
          <Reveal>
            <h2 className="hl-display text-[36px] md:text-[56px] text-neutral-900 dark:text-white">
              Try it with your own resumes.
            </h2>
          </Reveal>
          <Reveal delay={100}>
            <div className="mt-8">
              <Link to="/app" className="btn-apple btn-primary-apple" data-testid="features-cta-launch">
                Open the app <ArrowRight size={16} />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}