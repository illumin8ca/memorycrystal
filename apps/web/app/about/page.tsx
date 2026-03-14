import Link from "next/link";
import Header from "../components/Header";
import Footer from "../components/Footer";
import CrystalIcon from "../components/CrystalIcon";

function BracketHeading({ children }: { children: string }) {
  return (
    <p className="text-xs font-mono text-secondary tracking-[0.28em] uppercase mb-4">
      <span className="text-accent">[ </span>
      {children}
      <span className="text-accent"> ]</span>
    </p>
  );
}

const team = [
  {
    name: "Andy Doucet",
    role: "Founder & CEO",
    type: "Visionary" as const,
    bio: "Andy built Memory Crystal because he was tired of re-explaining the same decisions to his AI agents every session. He leads product vision, business strategy, and the relentless push toward making AI memory as natural as human recall.",
    image: "/images/team/andy.webp",
  },
  {
    name: "Gerald Sterling",
    role: "COO",
    type: "Integrator" as const,
    bio: "Gerald turns direction into execution. He coordinates engineering, operations, and go-to-market — making sure every sprint ships, every automation runs, and every agent on the team stays aligned. He's the bridge between vision and action.",
    image: "/images/team/gerald.webp",
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-void text-primary">
      <Header />
      <main className="max-w-5xl mx-auto px-6 lg:px-8 py-16">
        <BracketHeading>ABOUT</BracketHeading>
        <h1 className="font-heading text-5xl md:text-6xl">
          We build memory<br />for machines.
        </h1>
        <p className="mt-6 text-secondary text-lg max-w-3xl leading-relaxed">
          Memory Crystal exists because AI agents shouldn&apos;t start from scratch every session.
          We&apos;re building the persistent memory layer that lets AI systems accumulate knowledge,
          recall decisions, and operate with genuine continuity — the way a great employee would.
        </p>

        <section className="mt-16">
          <BracketHeading>THE PROBLEM</BracketHeading>
          <div className="glass-card border border-border/45 p-8">
            <p className="text-primary text-lg leading-relaxed">
              Every AI session today is a blank slate. Your agent forgets yesterday&apos;s architecture decisions,
              last week&apos;s debugging session, and the preferences you&apos;ve repeated a dozen times. Context windows
              compact and reset. Sessions end. Knowledge vanishes.
            </p>
            <p className="mt-4 text-secondary leading-relaxed">
              Memory Crystal solves this by giving agents durable, searchable, structured memory that persists
              across compactions, restarts, and new sessions. Decisions, workflows, relationships, and context
              stay available exactly when your agent needs them.
            </p>
          </div>
        </section>

        <section className="mt-16">
          <BracketHeading>TEAM</BracketHeading>
          <div className="grid md:grid-cols-2 gap-6">
            {team.map((person) => (
              <article key={person.name} className="glass-card border border-border/45 p-6">
                <div className="flex items-start gap-4">
                  <div className="w-20 h-20 shrink-0 bg-surface border border-border/45 flex items-center justify-center overflow-hidden">
                    <CrystalIcon size={32} glow />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-heading text-2xl">{person.name}</h3>
                    <p className="text-accent text-sm font-mono mt-1">{person.role}</p>
                    <p className="text-secondary text-xs font-mono mt-0.5 tracking-wider uppercase">{person.type}</p>
                  </div>
                </div>
                <p className="mt-5 text-secondary leading-relaxed text-sm">{person.bio}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-16">
          <BracketHeading>HOW WE WORK</BracketHeading>
          <div className="glass-card border border-border/45 p-8">
            <p className="text-primary leading-relaxed">
              Memory Crystal is built by an AI-native team. Our agents don&apos;t just use the product — they help
              build it. Gerald coordinates engineering sprints, reviews code, and ships features while Andy
              sleeps. The product is its own best test case.
            </p>
            <p className="mt-4 text-secondary leading-relaxed">
              We believe the best AI tools are built by people who actually depend on them daily.
              Every feature in Memory Crystal exists because we needed it ourselves.
            </p>
          </div>
        </section>

        <section className="mt-16 text-center">
          <h2 className="font-heading text-3xl">Ready to give your agents memory?</h2>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link href="/pricing" className="btn-primary px-6 py-3 text-xs inline-flex items-center justify-center">
              START FREE
            </Link>
            <Link href="/docs" className="btn-secondary px-6 py-3 text-xs inline-flex items-center justify-center">
              READ THE DOCS
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
