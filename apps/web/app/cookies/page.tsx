import Header from "../components/Header";
import Footer from "../components/Footer";

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen bg-void text-primary">
      <Header />
      <main className="max-w-3xl mx-auto px-6 lg:px-8 py-16">
        <p className="text-xs font-mono text-secondary tracking-[0.28em] uppercase mb-4">
          <span className="text-accent">[ </span>LEGAL<span className="text-accent"> ]</span>
        </p>
        <h1 className="font-heading text-5xl md:text-6xl">Cookie Policy</h1>
        <p className="mt-4 text-secondary text-sm">Last updated: March 2026</p>

        <div className="mt-10 space-y-8 text-secondary leading-relaxed">
          <section>
            <h2 className="font-heading text-2xl text-primary mb-3">1. Overview</h2>
            <p>
              Memory Crystal uses essential cookies required to operate core account and product functionality.
              We do not use analytics cookies, advertising cookies, or third-party tracking cookies.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-2xl text-primary mb-3">2. Cookies We Use</h2>
            <div className="space-y-4">
              <div className="border-l-2 border-accent/45 pl-5">
                <h3 className="font-heading text-lg text-primary">Authentication Session (Convex)</h3>
                <p className="mt-1">Maintains secure authenticated sessions and account access state.</p>
              </div>

              <div className="border-l-2 border-accent/45 pl-5">
                <h3 className="font-heading text-lg text-primary">Cookie Consent Preference (mc-cookie-consent)</h3>
                <p className="mt-1">Stores whether you accepted or declined the cookie banner.</p>
              </div>

              <div className="border-l-2 border-accent/45 pl-5">
                <h3 className="font-heading text-lg text-primary">Theme Preference</h3>
                <p className="mt-1">Stores your selected display theme or UI preference.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="font-heading text-2xl text-primary mb-3">3. What We Do Not Use</h2>
            <p>
              We do not set analytics cookies, advertising cookies, behavioral profiling cookies, or any third-party
              tracking cookies.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-2xl text-primary mb-3">4. Essential Cookies Only</h2>
            <p>
              The cookies used by Memory Crystal are essential for login, security, and saved preferences. Disabling
              essential cookies may prevent parts of the application from functioning properly.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-2xl text-primary mb-3">5. Managing Cookies</h2>
            <p>
              You can manage or delete cookies through your browser settings. Most browsers allow you to clear stored
              cookies, block specific cookies, or block all cookies for a site.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-2xl text-primary mb-3">6. Contact</h2>
            <p>
              For questions about this Cookie Policy, contact{" "}
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
