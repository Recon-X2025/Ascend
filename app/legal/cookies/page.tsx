import type { Metadata } from "next";
import { LegalSidebar } from "@/components/legal/LegalSidebar";

const COOKIES_HEADINGS = [
  { id: "1-what-are-cookies", label: "1. What Are Cookies" },
  { id: "2-how-we-use", label: "2. How We Use Cookies" },
  { id: "3-what-we-do-not-use", label: "3. What We Do Not Use" },
  { id: "4-managing-preferences", label: "4. Managing Your Cookie Preferences" },
  { id: "5-third-party", label: "5. Third-Party Cookies" },
  { id: "6-changes", label: "6. Changes to This Policy" },
  { id: "7-contact", label: "7. Contact" },
];

export const metadata: Metadata = {
  title: "Cookie Policy — Ascend",
  description: "Read Ascend's Cookie Policy. How we use cookies and how to manage them.",
};

export default function LegalCookiesPage() {
  return (
    <>
      <article className="legal-prose min-w-0 max-w-[760px]">
        <h1>Cookie Policy</h1>
        <p className="legal-date">
          <strong>Effective Date:</strong> 28 February 2026 · <strong>Last Updated:</strong> 28 February 2026
        </p>

        <section>
          <h2 id="1-what-are-cookies">1. What Are Cookies</h2>
          <p>Cookies are small text files placed on your device when you visit a website. They allow the Platform to remember information about your visit — such as your login session, preferences, and how you use the Platform.</p>
          <p>We also use similar technologies including local storage and session storage, which function like cookies and are covered by this Policy.</p>
        </section>

        <section>
          <h2 id="2-how-we-use">2. How We Use Cookies</h2>
          <p>We use cookies in three categories only. We do not use advertising or tracking cookies.</p>
          <h3>Category 1 — Essential Cookies</h3>
          <p><strong>Always active — cannot be disabled</strong></p>
          <p>These cookies are necessary for the Platform to function. Without them, core features like logging in and maintaining your session do not work.</p>
          <table>
            <thead>
              <tr><th>Cookie</th><th>Purpose</th><th>Duration</th></tr>
            </thead>
            <tbody>
              <tr><td><code>ascend_session</code></td><td>Maintains your login session</td><td>Session</td></tr>
              <tr><td><code>ascend_auth_token</code></td><td>Secure authentication token</td><td>30 days</td></tr>
              <tr><td><code>csrf_token</code></td><td>Protects against cross-site request forgery</td><td>Session</td></tr>
              <tr><td><code>cookie_consent</code></td><td>Remembers your cookie preferences</td><td>1 year</td></tr>
            </tbody>
          </table>
          <h3>Category 2 — Analytics Cookies</h3>
          <p><strong>Active by default — can be disabled</strong></p>
          <p>These cookies help us understand how users interact with the Platform — which features are used, where users drop off, and how to improve the experience. We use PostHog for analytics. Data is anonymised and aggregated where possible.</p>
          <table>
            <thead>
              <tr><th>Cookie</th><th>Provider</th><th>Purpose</th><th>Duration</th></tr>
            </thead>
            <tbody>
              <tr><td><code>ph_*</code></td><td>PostHog</td><td>Product analytics, feature usage, funnel tracking</td><td>1 year</td></tr>
              <tr><td><code>ph_distinct_id</code></td><td>PostHog</td><td>Anonymous user identifier for session continuity</td><td>1 year</td></tr>
            </tbody>
          </table>
          <p>PostHog is configured to: anonymise IP addresses; not share data with third-party advertisers; respect Do Not Track browser signals.</p>
          <h3>Category 3 — Preference Cookies</h3>
          <p><strong>Active by default — can be disabled</strong></p>
          <p>These cookies remember your settings and preferences to personalise your experience.</p>
          <table>
            <thead>
              <tr><th>Cookie</th><th>Purpose</th><th>Duration</th></tr>
            </thead>
            <tbody>
              <tr><td><code>ascend_locale</code></td><td>Remembers your language preference (EN/हि)</td><td>1 year</td></tr>
              <tr><td><code>ascend_persona</code></td><td>Caches your persona selection for faster loading</td><td>30 days</td></tr>
              <tr><td><code>ascend_theme</code></td><td>Remembers display preferences</td><td>1 year</td></tr>
            </tbody>
          </table>
        </section>

        <section>
          <h2 id="3-what-we-do-not-use">3. What We Do Not Use</h2>
          <p>We do not use:</p>
          <ul>
            <li><strong>Advertising cookies</strong> — we do not serve ads and do not use ad network cookies</li>
            <li><strong>Social media tracking pixels</strong> — no Facebook Pixel, no Twitter/X tracking</li>
            <li><strong>Session recording tools</strong> — we do not record individual user sessions (e.g. Hotjar)</li>
            <li><strong>Fingerprinting</strong> — we do not use browser fingerprinting as an alternative to cookies</li>
          </ul>
        </section>

        <section>
          <h2 id="4-managing-preferences">4. Managing Your Cookie Preferences</h2>
          <h3>4.1 Cookie Banner</h3>
          <p>When you first visit the Platform, you will see a cookie consent banner. You can accept all cookies, accept essential cookies only, or customise your preferences.</p>
          <h3>4.2 Updating Your Preferences</h3>
          <p>You can update your cookie preferences at any time via:</p>
          <ul>
            <li><strong>Account Settings → Privacy → Cookie Preferences</strong></li>
            <li>The cookie settings link in the footer of every page</li>
          </ul>
          <h3>4.3 Browser Controls</h3>
          <p>You can also control cookies through your browser settings. Note that disabling essential cookies will prevent the Platform from functioning correctly.</p>
          <p>Common browser cookie settings:</p>
          <ul>
            <li><strong>Chrome:</strong> Settings → Privacy and Security → Cookies</li>
            <li><strong>Safari:</strong> Preferences → Privacy</li>
            <li><strong>Firefox:</strong> Options → Privacy and Security</li>
            <li><strong>Edge:</strong> Settings → Cookies and Site Permissions</li>
          </ul>
          <h3>4.4 Opting Out of Analytics</h3>
          <p>To opt out of PostHog analytics specifically, you can: disable analytics cookies in your cookie preferences on the Platform; or visit <a href="https://posthog.com/privacy" target="_blank" rel="noopener noreferrer">posthog.com/privacy</a> for PostHog&apos;s opt-out options.</p>
        </section>

        <section>
          <h2 id="5-third-party">5. Third-Party Cookies</h2>
          <p>The Platform integrates with the following third parties who may set their own cookies:</p>
          <table>
            <thead>
              <tr><th>Provider</th><th>Purpose</th><th>Their Privacy Policy</th></tr>
            </thead>
            <tbody>
              <tr>
                <td>Google (OAuth)</td>
                <td>Sign-in via Google</td>
                <td><a href="https://google.com/privacy" target="_blank" rel="noopener noreferrer">google.com/privacy</a></td>
              </tr>
              <tr>
                <td>LinkedIn (OAuth)</td>
                <td>Sign-in via LinkedIn</td>
                <td><a href="https://linkedin.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer">linkedin.com/legal/privacy-policy</a></td>
              </tr>
              <tr>
                <td>Razorpay</td>
                <td>Payment processing</td>
                <td><a href="https://razorpay.com/privacy" target="_blank" rel="noopener noreferrer">razorpay.com/privacy</a></td>
              </tr>
            </tbody>
          </table>
          <p>These cookies are subject to the respective third parties&apos; privacy policies. We do not control them.</p>
        </section>

        <section>
          <h2 id="6-changes">6. Changes to This Policy</h2>
          <p>We may update this Cookie Policy from time to time. Material changes will be notified via the Platform or by email. The updated Policy will be effective from the date stated at the top of this document.</p>
        </section>

        <section>
          <h2 id="7-contact">7. Contact</h2>
          <p>For questions about our use of cookies:</p>
          <p><strong>Coheron Tech Private Limited</strong><br />No. 5, 21st B Cross, Pragathi Layout, Doddanekkundi, Bengaluru 560037, Karnataka, India<br />GSTIN: 29AANCC3402A1Z3<br />Email: legal@coheron.tech</p>
        </section>

        <hr />
        <p style={{ fontSize: "0.875rem", color: "var(--ink-4)", fontStyle: "italic" }}>
          Ascend is a product of Coheron Tech Private Limited.
        </p>
      </article>
      <LegalSidebar headings={COOKIES_HEADINGS} />
    </>
  );
}
