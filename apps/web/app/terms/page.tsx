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
        <p className="mt-4 text-secondary text-sm">Last updated: March 2026</p>

        <div className="mt-10 space-y-8 text-secondary leading-relaxed">
          <section>
            <h2 className="font-heading text-2xl text-primary mb-3">1. Service Description</h2>
            <p>
              Memory Crystal provides persistent memory infrastructure for AI assistants, including storage, recall,
              dashboard tools, and integration endpoints.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-2xl text-primary mb-3">2. Account Responsibilities</h2>
            <p>
              You are responsible for account security, credential confidentiality, and all activity performed through
              your account.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-2xl text-primary mb-3">3. Acceptable Use</h2>
            <p>You agree not to use the service to:</p>
            <ul className="list-disc list-inside space-y-2 mt-2">
              <li>Violate laws or regulations</li>
              <li>Transmit malicious code, abuse, or harmful content</li>
              <li>Attempt unauthorized access to systems or data</li>
              <li>Interfere with service operations or security controls</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-2xl text-primary mb-3">4. Billing</h2>
            <p>
              Paid plans are billed on a recurring monthly basis. Prices may change in the future with prior notice.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-2xl text-primary mb-3">5. Refunds</h2>
            <p>All sales are final. No refunds.</p>
          </section>

          <section>
            <h2 className="font-heading text-2xl text-primary mb-3">6. Termination</h2>
            <p>
              We may suspend or terminate accounts that violate these terms. You may stop using the service at any
              time and may request account deletion through support.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-2xl text-primary mb-3">7. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, Memory Crystal is not liable for indirect, incidental,
              consequential, special, or punitive damages, including lost profits, lost data, or business interruption.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-2xl text-primary mb-3">8. Changes to Terms</h2>
            <p>
              We may update these terms periodically. Continued use of the service after updates indicates acceptance
              of the revised terms.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-2xl text-primary mb-3">9. Governing Law</h2>
            <p>These terms are governed by the laws of Alberta, Canada, without regard to conflict of law rules.</p>
          </section>

          <section>
            <h2 className="font-heading text-2xl text-primary mb-3">10. Contact</h2>
            <p>
              Questions about these terms can be sent to{" "}
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
