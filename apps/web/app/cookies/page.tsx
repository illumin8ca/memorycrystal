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
        <p className="mt-4 text-secondary text-sm">Last updated: February 28, 2026</p>

        <div className="mt-10 space-y-8 text-secondary leading-relaxed">
          <section>
            <h2 className="font-heading text-2xl text-primary mb-3">1. What Are Cookies</h2>
            <p>Cookies are small text files stored on your device when you visit a website. They help the site remember your preferences and improve your experience.</p>
          </section>

          <section>
            <h2 className="font-heading text-2xl text-primary mb-3">2. Cookies We Use</h2>

            <div className="mt-4 space-y-4">
              <div className="border-l-2 border-accent/45 pl-5">
                <h3 className="font-heading text-lg text-primary">Essential Cookies</h3>
                <p className="mt-1">Required for authentication, session management, and security. These cannot be disabled as they are necessary for the Service to function.</p>
                <p className="mt-1 text-xs font-mono text-accent">Examples: session token, CSRF token, auth state</p>
              </div>

              <div className="border-l-2 border-accent/45 pl-5">
                <h3 className="font-heading text-lg text-primary">Preference Cookies</h3>
                <p className="mt-1">Store your preferences such as cookie consent choice, theme settings, and dashboard layout.</p>
                <p className="mt-1 text-xs font-mono text-accent">Examples: mc-cookie-consent, mc-preferences</p>
              </div>

              <div className="border-l-2 border-accent/45 pl-5">
                <h3 className="font-heading text-lg text-primary">Analytics Cookies</h3>
                <p className="mt-1">Help us understand how visitors interact with the site. We use anonymized analytics to improve the Service. No personal data is shared with third parties for advertising.</p>
                <p className="mt-1 text-xs font-mono text-accent">Examples: page views, feature usage metrics</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="font-heading text-2xl text-primary mb-3">3. Third-Party Cookies</h2>
            <p>Our payment processor (Polar.sh) and authentication providers (GitHub, Google) may set their own cookies during the OAuth flow. These are governed by their respective privacy policies.</p>
          </section>

          <section>
            <h2 className="font-heading text-2xl text-primary mb-3">4. Managing Cookies</h2>
            <p className="mb-3">You can accept or decline non-essential cookies via the banner shown on your first visit. You can also clear cookies through your browser settings at any time.</p>
            <p>Note that disabling essential cookies will prevent you from using the Service.</p>
          </section>

          <section>
            <h2 className="font-heading text-2xl text-primary mb-3">5. Contact</h2>
            <p>Questions about our cookie practices? Contact us at <a href="mailto:privacy@memorycrystal.io" className="text-accent hover:underline">privacy@memorycrystal.io</a>.</p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
