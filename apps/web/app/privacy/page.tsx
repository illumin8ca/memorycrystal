import Header from "../components/Header";
import Footer from "../components/Footer";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-void text-primary">
      <Header />
      <main className="max-w-3xl mx-auto px-6 lg:px-8 py-16">
        <p className="text-xs font-mono text-secondary tracking-[0.28em] uppercase mb-4">
          <span className="text-accent">[ </span>LEGAL<span className="text-accent"> ]</span>
        </p>
        <h1 className="font-heading text-5xl md:text-6xl">Privacy Policy</h1>
        <p className="mt-4 text-secondary text-sm">Last updated: March 2026</p>

        <div className="mt-10 space-y-8 text-secondary leading-relaxed">
          <section>
            <h2 className="font-heading text-2xl text-primary mb-3">1. Data We Collect</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>Email address and account profile details used for login and account management</li>
              <li>Conversation data, including messages and memories created through the product</li>
              <li>Usage metadata such as feature usage, request timing, and operational telemetry</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-2xl text-primary mb-3">2. How We Use Data</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>Provide and maintain Memory Crystal services</li>
              <li>Deliver account, billing, and security-related communications</li>
              <li>Improve reliability, product quality, and feature performance</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-2xl text-primary mb-3">3. Data Storage and Hosting</h2>
            <p>
              Data is stored in Convex cloud infrastructure and encrypted at rest. Services are hosted on US-based
              servers.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-2xl text-primary mb-3">4. Third-Party Processors</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>Polar.sh for billing and subscription processing</li>
              <li>SendGrid for transactional email delivery</li>
              <li>OpenAI for embedding generation used in semantic recall</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-2xl text-primary mb-3">5. Data Retention</h2>
            <p>
              Message and memory retention follow tier-specific TTL and storage limits. Users can delete records from
              the dashboard at any time. Account deletion requests remove stored user data according to operational
              deletion workflows.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-2xl text-primary mb-3">6. No Sale, Advertising, or Tracking</h2>
            <p>
              We do not sell personal data. We do not run advertising profiles. We do not use third-party behavioral
              tracking.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-2xl text-primary mb-3">7. Your Rights</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>Access your account data</li>
              <li>Request deletion of your data</li>
              <li>Request data export (coming soon)</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-2xl text-primary mb-3">8. GDPR</h2>
            <p>
              Memory Crystal supports GDPR compliance practices. Contact us for data access, correction, deletion, or
              portability requests.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-2xl text-primary mb-3">9. Contact</h2>
            <p>
              Questions about privacy can be sent to{" "}
              <a href="mailto:support@memorycrystal.ai" className="text-accent hover:underline">
                support@memorycrystal.ai
              </a>
              .
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
