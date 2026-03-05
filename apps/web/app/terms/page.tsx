import Header from "../components/Header";
import Footer from "../components/Footer";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-void text-primary">
      <Header />
      <main className="max-w-3xl mx-auto px-6 lg:px-8 py-16">
        <p className="text-xs font-mono text-secondary tracking-[0.28em] uppercase mb-4">
          <span className="text-accent">[ </span>LEGAL<span className="text-accent"> ]</span>
        </p>
        <h1 className="font-heading text-5xl md:text-6xl">Terms of Service</h1>
        <p className="mt-4 text-secondary text-sm">Last updated: February 28, 2026</p>

        <div className="mt-10 space-y-8 text-secondary leading-relaxed">
          <section>
            <h2 className="font-heading text-2xl text-primary mb-3">1. Acceptance of Terms</h2>
            <p>By accessing or using Memory Crystal (&quot;the Service&quot;), you agree to be bound by these Terms of Service. If you do not agree, do not use the Service.</p>
          </section>

          <section>
            <h2 className="font-heading text-2xl text-primary mb-3">2. Description of Service</h2>
            <p>Memory Crystal provides persistent cognitive memory infrastructure for AI assistants. The Service includes memory capture, storage, recall, and management through web dashboard, MCP servers, and plugin integrations.</p>
          </section>

          <section>
            <h2 className="font-heading text-2xl text-primary mb-3">3. Accounts</h2>
            <p>You are responsible for maintaining the security of your account credentials. You must provide accurate information when creating an account. You are responsible for all activity under your account.</p>
          </section>

          <section>
            <h2 className="font-heading text-2xl text-primary mb-3">4. Subscriptions and Billing</h2>
            <p className="mb-3">Memory Crystal offers Free, Starter (coming soon), Pro, and Ultra plans. Paid plans are billed monthly through Polar.sh. You may cancel at any time; access continues through the end of the billing period.</p>
            <p>We reserve the right to modify pricing with 30 days&apos; notice. Price changes do not affect existing billing periods.</p>
          </section>

          <section>
            <h2 className="font-heading text-2xl text-primary mb-3">5. Your Data</h2>
            <p className="mb-3">You retain ownership of all data you store in Memory Crystal. We do not claim any intellectual property rights over your memories, messages, or knowledge graph data.</p>
            <p>You grant us a limited license to process, store, and transmit your data solely for the purpose of providing the Service.</p>
          </section>

          <section>
            <h2 className="font-heading text-2xl text-primary mb-3">6. Acceptable Use</h2>
            <p>You agree not to use the Service to:</p>
            <ul className="list-disc list-inside space-y-2 mt-2">
              <li>Store or transmit malware, viruses, or harmful code</li>
              <li>Violate any applicable law or regulation</li>
              <li>Infringe on the intellectual property rights of others</li>
              <li>Attempt to gain unauthorized access to the Service or other accounts</li>
              <li>Use the Service to harass, abuse, or harm others</li>
              <li>Reverse-engineer or attempt to extract the source code of the Service</li>
              <li>Resell or redistribute the Service without authorization</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-2xl text-primary mb-3">7. Service Availability</h2>
            <p>We strive for high availability but do not guarantee uninterrupted access. We may perform maintenance or updates that temporarily affect availability. Ultra plan subscribers receive an SLA with defined uptime guarantees.</p>
          </section>

          <section>
            <h2 className="font-heading text-2xl text-primary mb-3">8. Limitation of Liability</h2>
            <p>To the maximum extent permitted by law, Memory Crystal shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of data, profits, or business opportunities.</p>
          </section>

          <section>
            <h2 className="font-heading text-2xl text-primary mb-3">9. Termination</h2>
            <p>We may suspend or terminate your account if you violate these Terms. You may close your account at any time through the dashboard. Upon termination, your data will be deleted within 30 days.</p>
          </section>

          <section>
            <h2 className="font-heading text-2xl text-primary mb-3">10. Changes to Terms</h2>
            <p>We may update these Terms from time to time. Continued use of the Service after changes constitutes acceptance of the revised Terms.</p>
          </section>

          <section>
            <h2 className="font-heading text-2xl text-primary mb-3">11. Governing Law</h2>
            <p>These Terms are governed by the laws of the Province of Ontario, Canada, without regard to conflict of law principles.</p>
          </section>

          <section>
            <h2 className="font-heading text-2xl text-primary mb-3">12. Contact</h2>
            <p>Questions about these Terms? Contact us at <a href="mailto:legal@memorycrystal.io" className="text-accent hover:underline">legal@memorycrystal.io</a>.</p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
