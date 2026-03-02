export default function CookiesPage() {
  return (
    <div className="page-container py-16 max-w-3xl mx-auto">
      <h1 className="font-display font-bold text-2xl text-ink">Cookie Policy</h1>
      <p className="font-body text-sm text-ink-3 mt-2">
        <strong>Effective Date:</strong> 28 February 2026 · <strong>Last Updated:</strong> 28 February 2026
      </p>

      <div className="mt-10 space-y-10 font-body text-[0.9375rem] text-ink-2 leading-relaxed">
        <section>
          <h2 className="font-display font-bold text-lg text-ink mb-3">1. What Are Cookies</h2>
          <p className="mb-3">
            Cookies are small text files placed on your device when you visit a website. They allow the Platform to remember information about your visit — such as your login session, preferences, and how you use the Platform.
          </p>
          <p className="mb-0">
            We also use similar technologies including local storage and session storage, which function like cookies and are covered by this Policy.
          </p>
        </section>

        <section>
          <h2 className="font-display font-bold text-lg text-ink mb-3">2. How We Use Cookies</h2>
          <p className="mb-4">
            We use cookies in three categories only. We do not use advertising or tracking cookies.
          </p>

          <h3 className="font-display font-semibold text-base text-ink mt-4 mb-2">Category 1 — Essential Cookies</h3>
          <p className="mb-2 text-ink-3 text-[0.875rem]">
            <strong>Always active — cannot be disabled</strong>
          </p>
          <p className="mb-3">
            These cookies are necessary for the Platform to function. Without them, core features like logging in and maintaining your session do not work.
          </p>
          <div className="overflow-x-auto -mx-4 sm:mx-0 mb-6">
            <table className="w-full border-collapse text-[0.8125rem] min-w-[360px]">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 pr-3 font-semibold text-ink">Cookie</th>
                  <th className="text-left py-2 pr-3 font-semibold text-ink">Purpose</th>
                  <th className="text-left py-2 font-semibold text-ink">Duration</th>
                </tr>
              </thead>
              <tbody className="text-ink-2">
                <tr className="border-b border-border"><td className="py-2 pr-3 font-mono text-[0.75rem]">ascend_session</td><td className="py-2 pr-3">Maintains your login session</td><td className="py-2">Session</td></tr>
                <tr className="border-b border-border"><td className="py-2 pr-3 font-mono text-[0.75rem]">ascend_auth_token</td><td className="py-2 pr-3">Secure authentication token</td><td className="py-2">30 days</td></tr>
                <tr className="border-b border-border"><td className="py-2 pr-3 font-mono text-[0.75rem]">csrf_token</td><td className="py-2 pr-3">Protects against cross-site request forgery</td><td className="py-2">Session</td></tr>
                <tr className="border-b border-border"><td className="py-2 pr-3 font-mono text-[0.75rem]">cookie_consent</td><td className="py-2 pr-3">Remembers your cookie preferences</td><td className="py-2">1 year</td></tr>
              </tbody>
            </table>
          </div>

          <h3 className="font-display font-semibold text-base text-ink mt-4 mb-2">Category 2 — Analytics Cookies</h3>
          <p className="mb-2 text-ink-3 text-[0.875rem]">
            <strong>Active by default — can be disabled</strong>
          </p>
          <p className="mb-3">
            These cookies help us understand how users interact with the Platform — which features are used, where users drop off, and how to improve the experience. We use PostHog for analytics. Data is anonymised and aggregated where possible.
          </p>
          <div className="overflow-x-auto -mx-4 sm:mx-0 mb-3">
            <table className="w-full border-collapse text-[0.8125rem] min-w-[400px]">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 pr-3 font-semibold text-ink">Cookie</th>
                  <th className="text-left py-2 pr-3 font-semibold text-ink">Provider</th>
                  <th className="text-left py-2 pr-3 font-semibold text-ink">Purpose</th>
                  <th className="text-left py-2 font-semibold text-ink">Duration</th>
                </tr>
              </thead>
              <tbody className="text-ink-2">
                <tr className="border-b border-border"><td className="py-2 pr-3 font-mono text-[0.75rem]">ph_*</td><td className="py-2 pr-3">PostHog</td><td className="py-2 pr-3">Product analytics, feature usage, funnel tracking</td><td className="py-2">1 year</td></tr>
                <tr className="border-b border-border"><td className="py-2 pr-3 font-mono text-[0.75rem]">ph_distinct_id</td><td className="py-2 pr-3">PostHog</td><td className="py-2 pr-3">Anonymous user identifier for session continuity</td><td className="py-2">1 year</td></tr>
              </tbody>
            </table>
          </div>
          <p className="mb-0 text-[0.875rem]">
            PostHog is configured to: anonymise IP addresses; not share data with third-party advertisers; respect Do Not Track browser signals.
          </p>

          <h3 className="font-display font-semibold text-base text-ink mt-6 mb-2">Category 3 — Preference Cookies</h3>
          <p className="mb-2 text-ink-3 text-[0.875rem]">
            <strong>Active by default — can be disabled</strong>
          </p>
          <p className="mb-3">
            These cookies remember your settings and preferences to personalise your experience.
          </p>
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <table className="w-full border-collapse text-[0.8125rem] min-w-[360px]">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 pr-3 font-semibold text-ink">Cookie</th>
                  <th className="text-left py-2 pr-3 font-semibold text-ink">Purpose</th>
                  <th className="text-left py-2 font-semibold text-ink">Duration</th>
                </tr>
              </thead>
              <tbody className="text-ink-2">
                <tr className="border-b border-border"><td className="py-2 pr-3 font-mono text-[0.75rem]">ascend_locale</td><td className="py-2 pr-3">Remembers your language preference (EN/हि)</td><td className="py-2">1 year</td></tr>
                <tr className="border-b border-border"><td className="py-2 pr-3 font-mono text-[0.75rem]">ascend_persona</td><td className="py-2 pr-3">Caches your persona selection for faster loading</td><td className="py-2">30 days</td></tr>
                <tr className="border-b border-border"><td className="py-2 pr-3 font-mono text-[0.75rem]">ascend_theme</td><td className="py-2 pr-3">Remembers display preferences</td><td className="py-2">1 year</td></tr>
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="font-display font-bold text-lg text-ink mb-3">3. What We Do Not Use</h2>
          <p className="mb-2">
            We do not use:
          </p>
          <ul className="list-disc pl-6 space-y-1 mb-0">
            <li><strong>Advertising cookies</strong> — we do not serve ads and do not use ad network cookies</li>
            <li><strong>Social media tracking pixels</strong> — no Facebook Pixel, no Twitter/X tracking</li>
            <li><strong>Session recording tools</strong> — we do not record individual user sessions (e.g. Hotjar)</li>
            <li><strong>Fingerprinting</strong> — we do not use browser fingerprinting as an alternative to cookies</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display font-bold text-lg text-ink mb-3">4. Managing Your Cookie Preferences</h2>
          <h3 className="font-display font-semibold text-base text-ink mt-4 mb-2">4.1 Cookie Banner</h3>
          <p className="mb-3">
            When you first visit the Platform, you will see a cookie consent banner. You can accept all cookies, accept essential cookies only, or customise your preferences.
          </p>
          <h3 className="font-display font-semibold text-base text-ink mt-4 mb-2">4.2 Updating Your Preferences</h3>
          <p className="mb-2">
            You can update your cookie preferences at any time via:
          </p>
          <ul className="list-disc pl-6 space-y-1 mb-3">
            <li><strong>Account Settings → Privacy → Cookie Preferences</strong></li>
            <li>The cookie settings link in the footer of every page</li>
          </ul>
          <h3 className="font-display font-semibold text-base text-ink mt-4 mb-2">4.3 Browser Controls</h3>
          <p className="mb-2">
            You can also control cookies through your browser settings. Note that disabling essential cookies will prevent the Platform from functioning correctly.
          </p>
          <p className="mb-2">
            Common browser cookie settings:
          </p>
          <ul className="list-disc pl-6 space-y-1 mb-3">
            <li><strong>Chrome:</strong> Settings → Privacy and Security → Cookies</li>
            <li><strong>Safari:</strong> Preferences → Privacy</li>
            <li><strong>Firefox:</strong> Options → Privacy and Security</li>
            <li><strong>Edge:</strong> Settings → Cookies and Site Permissions</li>
          </ul>
          <h3 className="font-display font-semibold text-base text-ink mt-4 mb-2">4.4 Opting Out of Analytics</h3>
          <p className="mb-0">
            To opt out of PostHog analytics specifically, you can: disable analytics cookies in your cookie preferences on the Platform; or visit{" "}
            <a href="https://posthog.com/privacy" target="_blank" rel="noopener noreferrer" className="text-green hover:underline">
              posthog.com/privacy
            </a>{" "}
            for PostHog&apos;s opt-out options.
          </p>
        </section>

        <section>
          <h2 className="font-display font-bold text-lg text-ink mb-3">5. Third-Party Cookies</h2>
          <p className="mb-3">
            The Platform integrates with the following third parties who may set their own cookies:
          </p>
          <div className="overflow-x-auto -mx-4 sm:mx-0 mb-3">
            <table className="w-full border-collapse text-[0.8125rem] min-w-[400px]">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 pr-3 font-semibold text-ink">Provider</th>
                  <th className="text-left py-2 pr-3 font-semibold text-ink">Purpose</th>
                  <th className="text-left py-2 font-semibold text-ink">Their Privacy Policy</th>
                </tr>
              </thead>
              <tbody className="text-ink-2">
                <tr className="border-b border-border">
                  <td className="py-2 pr-3">Google (OAuth)</td>
                  <td className="py-2 pr-3">Sign-in via Google</td>
                  <td className="py-2"><a href="https://google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-green hover:underline">google.com/privacy</a></td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-2 pr-3">LinkedIn (OAuth)</td>
                  <td className="py-2 pr-3">Sign-in via LinkedIn</td>
                  <td className="py-2"><a href="https://linkedin.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-green hover:underline">linkedin.com/legal/privacy-policy</a></td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-2 pr-3">Razorpay</td>
                  <td className="py-2 pr-3">Payment processing</td>
                  <td className="py-2"><a href="https://razorpay.com/privacy" target="_blank" rel="noopener noreferrer" className="text-green hover:underline">razorpay.com/privacy</a></td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mb-0">
            These cookies are subject to the respective third parties&apos; privacy policies. We do not control them.
          </p>
        </section>

        <section>
          <h2 className="font-display font-bold text-lg text-ink mb-3">6. Changes to This Policy</h2>
          <p className="mb-0">
            We may update this Cookie Policy from time to time. Material changes will be notified via the Platform or by email. The updated Policy will be effective from the date stated at the top of this document.
          </p>
        </section>

        <section>
          <h2 className="font-display font-bold text-lg text-ink mb-3">7. Contact</h2>
          <p className="mb-0">
            For questions about our use of cookies:
          </p>
          <p className="mt-3 mb-0">
            <strong>Coheron Tech Private Limited</strong><br />
            No. 5, 21st B Cross, Pragathi Layout, Doddanekkundi, Bengaluru 560037, Karnataka, India<br />
            GSTIN: 29AANCC3402A1Z3<br />
            Email: legal@coheron.tech
          </p>
        </section>

        <p className="font-body text-ink-4 text-[0.875rem] italic pt-6 border-t border-border">
          Ascend is a product of Coheron Tech Private Limited.
        </p>
      </div>
    </div>
  );
}
