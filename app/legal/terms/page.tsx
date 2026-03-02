import type { Metadata } from "next";
import Link from "next/link";
import { LegalSidebar } from "@/components/legal/LegalSidebar";

const TERMS_HEADINGS = [
  { id: "1-introduction", label: "1. Introduction" },
  { id: "2-eligibility", label: "2. Eligibility" },
  { id: "3-account-registration", label: "3. Account Registration" },
  { id: "4-platform-services", label: "4. The Platform and Services" },
  { id: "5-user-conduct", label: "5. User Conduct" },
  { id: "6-content-ip", label: "6. Content and Intellectual Property" },
  { id: "7-privacy", label: "7. Privacy" },
  { id: "8-payments", label: "8. Payments and Subscriptions" },
  { id: "9-disclaimers", label: "9. Disclaimers" },
  { id: "10-liability", label: "10. Limitation of Liability" },
  { id: "11-indemnification", label: "11. Indemnification" },
  { id: "12-third-party", label: "12. Third-Party Services and Links" },
  { id: "13-dispute-resolution", label: "13. Dispute Resolution" },
  { id: "14-governing-law", label: "14. Governing Law" },
  { id: "15-general", label: "15. General Provisions" },
  { id: "16-changes", label: "16. Changes to These Terms" },
  { id: "17-contact", label: "17. Contact" },
];

export const metadata: Metadata = {
  title: "Terms of Service — Ascend",
  description: "Read Ascend's Terms of Service. Governs your use of the Ascend career platform.",
};

export default function LegalTermsPage() {
  return (
    <>
      <article className="legal-prose min-w-0 max-w-[760px]">
        <h1>Terms of Service</h1>
        <p className="legal-date">
          <strong>Effective Date:</strong> 28 February 2026 · <strong>Last Updated:</strong> 28 February 2026
        </p>

        <section>
          <h2 id="1-introduction">1. Introduction</h2>
          <p>
            Welcome to Ascend (&quot;Ascend&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;), a product of Coheron Tech Private Limited (&quot;Coheron&quot;). Ascend is an intelligent career platform that provides job matching, resume optimisation, salary intelligence, career graph, and mentorship services.
          </p>
          <p>
            These Terms of Service (&quot;Terms&quot;) govern your access to and use of the Ascend platform, including our website at ascend.coheron.tech, mobile applications, and all associated services (collectively, the &quot;Platform&quot;).
          </p>
          <p>
            By creating an account or using the Platform in any way, you agree to be bound by these Terms. If you do not agree, do not use the Platform.
          </p>
          <p>
            Ascend is operated by:<br />
            <strong>Coheron Tech Private Limited</strong><br />
            No. 5, 21st B Cross, Pragathi Layout, Doddanekkundi, Bengaluru 560037, Karnataka, India<br />
            GSTIN: 29AANCC3402A1Z3<br />
            Email: legal@coheron.tech
          </p>
        </section>

        <section>
          <h2 id="2-eligibility">2. Eligibility</h2>
          <p>
            You must be at least <strong>18 years of age</strong> to use the Platform. By using the Platform, you represent and warrant that:
          </p>
          <ul>
            <li>You are at least 18 years old</li>
            <li>You have the legal capacity to enter into a binding agreement</li>
            <li>You are not barred from using the Platform under applicable law</li>
            <li>All information you provide is accurate, current, and complete</li>
          </ul>
          <p>
            If you are using the Platform on behalf of an organisation, you represent that you have authority to bind that organisation to these Terms.
          </p>
        </section>

        <section>
          <h2 id="3-account-registration">3. Account Registration</h2>
          <h3>3.1 Account Creation</h3>
          <p>To access most features of the Platform, you must create an account. You agree to:</p>
          <ul>
            <li>Provide accurate, complete, and current information</li>
            <li>Maintain the security of your password</li>
            <li>Notify us immediately at legal@coheron.tech of any unauthorised access</li>
            <li>Accept responsibility for all activity under your account</li>
          </ul>
          <h3>3.2 Account Types</h3>
          <p>Ascend offers two account types:</p>
          <ul>
            <li><strong>Job Seeker Account</strong> — for individuals seeking employment or career development</li>
            <li><strong>Recruiter Account</strong> — for individuals and organisations sourcing candidates</li>
          </ul>
          <p>Each account type has different features, permissions, and applicable terms within this agreement.</p>
          <h3>3.3 Account Termination by You</h3>
          <p>You may delete your account at any time through your account settings. Upon deletion:</p>
          <ul>
            <li>Your profile will be immediately removed from public view</li>
            <li>Your data will be retained for 90 days in recoverable form</li>
            <li>Permanent deletion of all personal data will occur at 180 days</li>
            <li>Certain data may be retained longer where required by law</li>
          </ul>
          <h3>3.4 Suspension or Termination by Us</h3>
          <p>We reserve the right to suspend or terminate your account at any time, with or without notice, for:</p>
          <ul>
            <li>Violation of these Terms</li>
            <li>Fraudulent, abusive, or illegal activity</li>
            <li>Conduct harmful to other users or to Ascend</li>
            <li>Extended inactivity (accounts inactive for more than 24 months)</li>
          </ul>
        </section>

        <section>
          <h2 id="4-platform-services">4. The Platform and Services</h2>
          <h3>4.1 Job Seeker Services</h3>
          <p>Ascend provides job seekers with:</p>
          <ul>
            <li>Intelligent job matching based on profile and preferences</li>
            <li>Fit Score — a compatibility score between your profile and job listings</li>
            <li>Resume Optimiser — tailored resume analysis against specific job descriptions</li>
            <li>ATS Score — assessment of resume compatibility with automated screening systems</li>
            <li>Salary Intelligence — anonymised compensation data by role, company, and location</li>
            <li>Career Graph — a network of career-contextual connections</li>
            <li>Mentorship — structured connections with vetted career mentors</li>
          </ul>
          <h3>4.2 Recruiter Services</h3>
          <p>Ascend provides recruiters with:</p>
          <ul>
            <li>Access to candidate profiles and search tools</li>
            <li>Candidate sourcing and pipeline management tools</li>
            <li>Job posting and promotion services</li>
            <li>Analytics on job posting performance</li>
          </ul>
          <p>Recruiter access is subject to separate eligibility requirements and may require verification of employment or organisational affiliation.</p>
          <h3>4.3 Service Availability</h3>
          <p>We do not guarantee uninterrupted or error-free access to the Platform. We may modify, suspend, or discontinue any part of the Platform at any time. We will provide reasonable notice of material changes where practicable.</p>
          <h3>4.4 Beta Features</h3>
          <p>Some features may be offered in beta or preview. These features are provided &quot;as is&quot; without warranty and may be modified or discontinued without notice.</p>
        </section>

        <section>
          <h2 id="5-user-conduct">5. User Conduct</h2>
          <h3>5.1 Permitted Use</h3>
          <p>You may use the Platform only for lawful purposes and in accordance with these Terms.</p>
          <h3>5.2 Prohibited Conduct</h3>
          <p>You agree not to:</p>
          <ul>
            <li>Post false, misleading, or fraudulent information</li>
            <li>Impersonate any person or entity</li>
            <li>Scrape, crawl, or extract data from the Platform by automated means</li>
            <li>Use the Platform to send unsolicited communications (spam)</li>
            <li>Harass, threaten, or harm other users</li>
            <li>Post content that is defamatory, obscene, or discriminatory</li>
            <li>Attempt to gain unauthorised access to any part of the Platform</li>
            <li>Use the Platform for any commercial purpose not expressly permitted</li>
            <li>Post job listings that are fraudulent, misleading, or non-existent</li>
            <li>Collect or harvest personal information of other users</li>
            <li>Interfere with the operation of the Platform</li>
            <li>Circumvent any security or access control measures</li>
            <li>Use the Platform to discriminate against candidates on the basis of age, gender, religion, caste, disability, or any other protected characteristic under applicable law</li>
          </ul>
          <h3>5.3 Content Standards</h3>
          <p>All content you post must:</p>
          <ul>
            <li>Be accurate and not misleading</li>
            <li>Not infringe any third-party intellectual property rights</li>
            <li>Not contain malware, viruses, or harmful code</li>
            <li>Comply with applicable laws and regulations</li>
          </ul>
        </section>

        <section>
          <h2 id="6-content-ip">6. Content and Intellectual Property</h2>
          <h3>6.1 Your Content</h3>
          <p>You retain ownership of content you submit to the Platform (&quot;User Content&quot;), including your profile, resume, and messages. By submitting User Content, you grant Ascend a worldwide, non-exclusive, royalty-free licence to use, store, display, reproduce, and distribute your User Content solely for the purpose of operating and improving the Platform. This licence ends when you delete your content or your account, subject to the data retention periods in <Link href="#3-account-registration">Section 3.3</Link>.</p>
          <h3>6.2 Ascend&apos;s Intellectual Property</h3>
          <p>The Platform, including its design, software, algorithms, and content created by Ascend, is owned by Coheron Tech Private Limited and protected by applicable intellectual property laws. You may not copy, modify, distribute, or create derivative works from any part of the Platform without our express written permission.</p>
          <h3>6.3 Feedback</h3>
          <p>If you submit feedback, suggestions, or ideas about the Platform, you grant us the right to use that feedback without restriction or compensation to you.</p>
          <h3>6.4 Copyright Complaints</h3>
          <p>If you believe content on the Platform infringes your copyright, please contact us at legal@coheron.tech with: a description of the copyrighted work; the location of the infringing content on the Platform; your contact information; and a statement of good faith belief that the use is not authorised.</p>
        </section>

        <section>
          <h2 id="7-privacy">7. Privacy</h2>
          <p>Your use of the Platform is subject to our <Link href="/legal/privacy">Privacy Policy</Link>, which is incorporated into these Terms by reference. By using the Platform, you consent to the collection and use of your information as described in our Privacy Policy.</p>
        </section>

        <section>
          <h2 id="8-payments">8. Payments and Subscriptions</h2>
          <h3>8.1 Free Tier</h3>
          <p>Ascend offers a free tier with access to core features as defined on our pricing page.</p>
          <h3>8.2 Paid Subscriptions</h3>
          <p>Certain features require a paid subscription. By subscribing:</p>
          <ul>
            <li>You authorise us to charge your payment method on a recurring basis</li>
            <li>Subscriptions auto-renew unless cancelled before the renewal date</li>
            <li>All fees are exclusive of applicable taxes</li>
          </ul>
          <h3>8.3 Refunds</h3>
          <p>We do not offer refunds for partial subscription periods. If you cancel, you retain access until the end of the billing period.</p>
          <h3>8.4 Price Changes</h3>
          <p>We will provide at least 30 days&apos; notice before changing subscription prices. Continued use after the effective date constitutes acceptance of the new pricing.</p>
          <h3>8.5 Payment Processing</h3>
          <p>Payments are processed by third-party payment providers. We do not store complete payment card information.</p>
        </section>

        <section>
          <h2 id="9-disclaimers">9. Disclaimers</h2>
          <h3>9.1 No Employment Guarantee</h3>
          <p>Ascend does not guarantee employment, interviews, or any specific outcome from using the Platform. Job listings are posted by third parties and we do not verify the accuracy of all listings.</p>
          <h3>9.2 No Professional Advice</h3>
          <p>Nothing on the Platform constitutes legal, financial, or career advice. Salary data is provided for informational purposes and may not reflect actual compensation at any specific organisation.</p>
          <h3>9.3 Platform Provided &quot;As Is&quot;</h3>
          <p style={{ textTransform: "uppercase", fontSize: "0.85rem", color: "var(--ink-3)" }}>
            The Platform is provided &quot;as is&quot; and &quot;as available&quot; without warranty of any kind, express or implied, including warranties of merchantability, fitness for a particular purpose, or non-infringement. We do not warrant that the Platform will be uninterrupted, error-free, or free of viruses.
          </p>
        </section>

        <section>
          <h2 id="10-liability">10. Limitation of Liability</h2>
          <p style={{ textTransform: "uppercase", fontSize: "0.85rem", color: "var(--ink-3)" }}>
            To the maximum extent permitted by applicable law, Coheron Tech Private Limited shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or goodwill, arising from your use of or inability to use the Platform.
          </p>
          <p style={{ textTransform: "uppercase", fontSize: "0.85rem", color: "var(--ink-3)" }}>
            Our total liability to you for any claim arising from these Terms or your use of the Platform shall not exceed the amount you paid to Ascend in the 12 months preceding the claim, or INR 1,000, whichever is greater.
          </p>
          <p style={{ textTransform: "uppercase", fontSize: "0.85rem", color: "var(--ink-3)" }}>
            Nothing in these Terms limits liability for fraud, death, or personal injury caused by negligence.
          </p>
        </section>

        <section>
          <h2 id="11-indemnification">11. Indemnification</h2>
          <p>You agree to indemnify and hold harmless Coheron Tech Private Limited, its officers, directors, employees, and agents from any claims, damages, losses, or expenses (including reasonable legal fees) arising from: your use of the Platform; your violation of these Terms; your violation of any third-party rights; and any content you submit to the Platform.</p>
        </section>

        <section>
          <h2 id="12-third-party">12. Third-Party Services and Links</h2>
          <p>The Platform may contain links to third-party websites or integrate with third-party services. We are not responsible for the content, privacy practices, or terms of third-party services. Your use of third-party services is at your own risk and subject to their terms.</p>
        </section>

        <section>
          <h2 id="13-dispute-resolution">13. Dispute Resolution</h2>
          <h3>13.1 Informal Resolution</h3>
          <p>Before initiating formal proceedings, you agree to contact us at legal@coheron.tech and attempt to resolve the dispute informally for at least 30 days.</p>
          <h3>13.2 Arbitration</h3>
          <p>If informal resolution fails, disputes shall be resolved by binding arbitration under the Arbitration and Conciliation Act, 1996 (India). Arbitration shall be conducted in Bangalore, Karnataka, India. The language of arbitration shall be English.</p>
          <h3>13.3 Exceptions</h3>
          <p>Either party may seek emergency injunctive or equitable relief in the courts of Bangalore, Karnataka, India, without waiving the right to arbitration.</p>
          <h3>13.4 Class Action Waiver</h3>
          <p>You agree to resolve disputes with us individually and not as part of any class or representative action.</p>
        </section>

        <section>
          <h2 id="14-governing-law">14. Governing Law</h2>
          <p>These Terms are governed by the laws of India. Subject to the arbitration clause above, you submit to the exclusive jurisdiction of the courts of Bangalore, Karnataka, India.</p>
        </section>

        <section>
          <h2 id="15-general">15. General Provisions</h2>
          <h3>15.1 Entire Agreement</h3>
          <p>These Terms, together with our Privacy Policy and Cookie Policy, constitute the entire agreement between you and Ascend regarding the Platform.</p>
          <h3>15.2 Severability</h3>
          <p>If any provision of these Terms is found unenforceable, the remaining provisions will continue in full force.</p>
          <h3>15.3 Waiver</h3>
          <p>Our failure to enforce any right or provision of these Terms does not constitute a waiver of that right or provision.</p>
          <h3>15.4 Assignment</h3>
          <p>You may not assign your rights under these Terms without our written consent. We may assign our rights to a successor entity in connection with a merger, acquisition, or sale of assets. In such event, the successor entity assumes all obligations under these Terms and your rights are unaffected.</p>
          <h3>15.5 Force Majeure</h3>
          <p>We are not liable for any failure or delay caused by circumstances beyond our reasonable control, including natural disasters, government actions, or internet outages.</p>
          <h3>15.6 Notices</h3>
          <p>We may provide notices to you via email or through the Platform. You may provide notices to us at legal@coheron.tech.</p>
        </section>

        <section>
          <h2 id="16-changes">16. Changes to These Terms</h2>
          <p>We may update these Terms from time to time. For material changes, we will provide at least 14 days&apos; notice via email or a prominent notice on the Platform. Your continued use after the effective date constitutes acceptance of the updated Terms.</p>
          <p>If you do not agree to the updated Terms, you must stop using the Platform and may delete your account.</p>
        </section>

        <section>
          <h2 id="17-contact">17. Contact</h2>
          <p>For questions about these Terms:</p>
          <p>
            <strong>Coheron Tech Private Limited</strong><br />
            No. 5, 21st B Cross, Pragathi Layout, Doddanekkundi, Bengaluru 560037, Karnataka, India<br />
            GSTIN: 29AANCC3402A1Z3<br />
            Email: legal@coheron.tech
          </p>
        </section>

        <hr />
        <p style={{ fontSize: "0.875rem", color: "var(--ink-4)", fontStyle: "italic" }}>
          Ascend is a product of Coheron Tech Private Limited. These Terms will be updated to reflect Ascend as an independent legal entity upon incorporation, with no requirement for users to re-consent.
        </p>
      </article>
      <LegalSidebar headings={TERMS_HEADINGS} />
    </>
  );
}
