import Header from "../components/Header";
import Footer from "../components/Footer";

export default function AcceptableUsePage() {
  return (
    <div className="min-h-screen bg-void text-primary">
      <Header />
      <main className="max-w-3xl mx-auto px-6 lg:px-8 py-16">
        <p className="text-xs font-mono text-secondary tracking-[0.28em] uppercase mb-4">
          <span className="text-accent">[ </span>LEGAL<span className="text-accent"> ]</span>
        </p>
        <h1 className="font-heading text-5xl md:text-6xl">Acceptable Use Policy</h1>
        <p className="mt-4 text-secondary text-sm">Last updated: February 28, 2026</p>

        <div className="mt-10 space-y-8 text-secondary leading-relaxed">
          <section>
            <h2 className="font-heading text-2xl text-primary mb-3">1. Purpose</h2>
            <p>This Acceptable Use Policy outlines what is and is not permitted when using Memory Crystal. It supplements our Terms of Service.</p>
          </section>

          <section>
            <h2 className="font-heading text-2xl text-primary mb-3">2. Permitted Use</h2>
            <p>Memory Crystal is designed for storing AI-generated memories, decisions, facts, and contextual data to improve AI assistant continuity. You may use the Service for:</p>
            <ul className="list-disc list-inside space-y-2 mt-2">
              <li>Personal and commercial AI assistant memory management</li>
              <li>Team and organizational knowledge persistence</li>
              <li>Integration with supported AI platforms via MCP servers and plugins</li>
              <li>Data export and archival through supported sync tools</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-2xl text-primary mb-3">3. Prohibited Use</h2>
            <p>You may not use Memory Crystal to:</p>
            <ul className="list-disc list-inside space-y-2 mt-2">
              <li>Store content that is illegal, threatening, abusive, defamatory, or obscene</li>
              <li>Store personally identifiable information of third parties without their consent</li>
              <li>Store financial data (credit card numbers, bank accounts, SSNs) outside of encrypted fields</li>
              <li>Conduct automated scraping, data harvesting, or denial-of-service attacks</li>
              <li>Circumvent rate limits, storage quotas, or security controls</li>
              <li>Redistribute API access or resell the Service to third parties</li>
              <li>Use the Service in a way that degrades performance for other users</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-2xl text-primary mb-3">4. Rate Limits and Fair Use</h2>
            <p>Each plan includes defined memory and API limits. Exceeding these limits may result in throttling or temporary suspension. Ultra plan subscribers may negotiate custom limits.</p>
          </section>

          <section>
            <h2 className="font-heading text-2xl text-primary mb-3">5. Enforcement</h2>
            <p>Violations may result in warnings, temporary suspension, or permanent account termination at our discretion. We will attempt to notify you before taking action unless immediate action is required to protect the Service or other users.</p>
          </section>

          <section>
            <h2 className="font-heading text-2xl text-primary mb-3">6. Reporting Violations</h2>
            <p>If you become aware of any violation of this policy, please report it to <a href="mailto:abuse@memorycrystal.io" className="text-accent hover:underline">abuse@memorycrystal.io</a>.</p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
