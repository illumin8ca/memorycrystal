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
        <p className="mt-4 text-secondary text-sm">Last updated: February 28, 2026</p>

        <div className="mt-10 space-y-8 text-secondary leading-relaxed">
          <section>
            <h2 className="font-heading text-2xl text-primary mb-3">1. Introduction</h2>
            <p>Memory Crystal (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) operates the memorycrystal.io website and related services. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our service.</p>
          </section>

          <section>
            <h2 className="font-heading text-2xl text-primary mb-3">2. Information We Collect</h2>
            <p className="mb-3"><strong className="text-primary">Account Information:</strong> When you create an account, we collect your email address and, if you use OAuth, your name and profile information from GitHub or Google.</p>
            <p className="mb-3"><strong className="text-primary">Memory Data:</strong> We store the memories, messages, and knowledge graph data that you or your AI agents create through our service. This data is encrypted at rest and is only accessible to your account.</p>
            <p className="mb-3"><strong className="text-primary">Usage Data:</strong> We collect anonymized usage metrics such as memory count, recall frequency, and session duration to improve service quality.</p>
            <p><strong className="text-primary">Payment Information:</strong> Payment processing is handled by Polar.sh. We do not store credit card numbers or banking details directly.</p>
          </section>

          <section>
            <h2 className="font-heading text-2xl text-primary mb-3">3. How We Use Your Information</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>To provide, maintain, and improve the Memory Crystal service</li>
              <li>To process transactions and manage your subscription</li>
              <li>To send service-related communications (account verification, security alerts, billing)</li>
              <li>To detect and prevent fraud or abuse</li>
              <li>To comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-2xl text-primary mb-3">4. Data Retention</h2>
            <p>Short-term memory (messages) is retained for the duration specified by your plan (7 or 90 days). Long-term memories are retained indefinitely until you delete them or close your account. Upon account deletion, all data is permanently removed within 30 days.</p>
          </section>

          <section>
            <h2 className="font-heading text-2xl text-primary mb-3">5. Data Sharing</h2>
            <p>We do not sell your personal information. We may share data with:</p>
            <ul className="list-disc list-inside space-y-2 mt-2">
              <li><strong className="text-primary">Service Providers:</strong> Convex (database), OpenAI (embeddings), Polar.sh (billing), and cloud hosting providers</li>
              <li><strong className="text-primary">Legal Requirements:</strong> When required by law, subpoena, or legal process</li>
              <li><strong className="text-primary">Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-2xl text-primary mb-3">6. Your Rights</h2>
            <p>You have the right to access, correct, export, or delete your data at any time through the dashboard or by contacting us. Pro and Ultra plans include Obsidian vault sync for human-readable data export.</p>
          </section>

          <section>
            <h2 className="font-heading text-2xl text-primary mb-3">7. Security</h2>
            <p>We use industry-standard encryption, access controls, and security practices to protect your data. All data is encrypted in transit (TLS) and at rest. However, no method of transmission over the Internet is 100% secure.</p>
          </section>

          <section>
            <h2 className="font-heading text-2xl text-primary mb-3">8. Children&apos;s Privacy</h2>
            <p>Memory Crystal is not intended for users under 16 years of age. We do not knowingly collect information from children.</p>
          </section>

          <section>
            <h2 className="font-heading text-2xl text-primary mb-3">9. Changes to This Policy</h2>
            <p>We may update this Privacy Policy from time to time. We will notify you of material changes by posting the new policy on this page and updating the &quot;last updated&quot; date.</p>
          </section>

          <section>
            <h2 className="font-heading text-2xl text-primary mb-3">10. Contact</h2>
            <p>If you have questions about this Privacy Policy, contact us at <a href="mailto:privacy@memorycrystal.io" className="text-accent hover:underline">privacy@memorycrystal.io</a>.</p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
