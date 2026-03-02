import type { Metadata } from "next";
import Link from "next/link";
import { LegalSidebar } from "@/components/legal/LegalSidebar";

const PRIVACY_HEADINGS = [
  { id: "1-introduction", label: "1. Introduction" },
  { id: "2-data-we-collect", label: "2. Data We Collect" },
  { id: "3-how-we-use", label: "3. How We Use Your Data" },
  { id: "4-salary", label: "4. Salary and Compensation Data" },
  { id: "5-how-we-share", label: "5. How We Share Your Data" },
  { id: "6-data-retention", label: "6. Data Retention" },
  { id: "7-your-rights", label: "7. Your Rights" },
  { id: "8-data-security", label: "8. Data Security" },
  { id: "9-children", label: "9. Children's Privacy" },
  { id: "10-international", label: "10. International Data Transfers" },
  { id: "11-third-party", label: "11. Third-Party Links and Integrations" },
  { id: "12-changes", label: "12. Changes to This Policy" },
  { id: "13-contact", label: "13. Contact and Grievance Officer" },
];

export const metadata: Metadata = {
  title: "Privacy Policy — Ascend",
  description: "Read Ascend's Privacy Policy. How we collect, use, and protect your data.",
};

export default function LegalPrivacyPage() {
  return (
    <>
      <article className="legal-prose min-w-0 max-w-[760px]">
        <h1>Privacy Policy</h1>
        <p className="legal-date">
          <strong>Effective Date:</strong> 28 February 2026 · <strong>Last Updated:</strong> 28 February 2026
        </p>

        <section>
          <h2 id="1-introduction">1. Introduction</h2>
          <p>Ascend, a product of Coheron Tech Private Limited (&quot;Coheron&quot;, &quot;we&quot;, &quot;us&quot;, &quot;our&quot;), is committed to protecting your privacy. This Privacy Policy explains how we collect, use, store, share, and protect your personal data when you use the Ascend platform (&quot;Platform&quot;).</p>
          <p>This Policy applies to all users of the Platform globally. It is drafted in compliance with:</p>
          <ul>
            <li>The Digital Personal Data Protection Act, 2023 (India) (&quot;DPDP Act&quot;)</li>
            <li>The Information Technology Act, 2000 (India) and associated rules</li>
            <li>Applicable international data protection standards</li>
          </ul>
          <p><strong>Coheron Tech Private Limited</strong><br />No. 5, 21st B Cross, Pragathi Layout, Doddanekkundi, Bengaluru 560037, Karnataka, India<br />GSTIN: 29AANCC3402A1Z3<br />Email: legal@coheron.tech</p>
          <p>If you have questions about this Policy or wish to exercise your rights, contact us at legal@coheron.tech.</p>
        </section>

        <section>
          <h2 id="2-data-we-collect">2. Data We Collect</h2>
          <h3>2.1 Information You Provide Directly</h3>
          <p><strong>Account Information</strong></p>
          <ul>
            <li>Full name, email address, password (hashed, never stored in plain text)</li>
            <li>Phone number (optional)</li>
            <li>Profile photograph (optional)</li>
            <li>Date of birth (to verify age eligibility)</li>
            <li>Persona selection (active seeker, passive seeker, early career, recruiter)</li>
          </ul>
          <p><strong>Professional Information</strong></p>
          <ul>
            <li>Work history — employer names, roles, dates, descriptions</li>
            <li>Educational background — institutions, degrees, dates</li>
            <li>Skills, certifications, and achievements</li>
            <li>Target roles, industries, and locations</li>
            <li>Current and expected compensation (optional)</li>
            <li>Resume documents you upload</li>
          </ul>
          <p><strong>Recruiter Information (if applicable)</strong></p>
          <ul>
            <li>Organisation name and size</li>
            <li>Role and hiring authority</li>
            <li>Job listings you post</li>
            <li>Candidate interactions and pipeline data</li>
          </ul>
          <p><strong>Communications</strong></p>
          <ul>
            <li>Messages sent through the Platform</li>
            <li>Support requests and correspondence with our team</li>
            <li>Feedback and survey responses</li>
          </ul>
          <h3>2.2 Information We Collect Automatically</h3>
          <p><strong>Usage Data</strong></p>
          <ul>
            <li>Pages visited, features used, time spent on the Platform</li>
            <li>Search queries and job listings viewed</li>
            <li>Fit Score calculations and resume optimisation requests</li>
            <li>Clicks, scrolls, and interaction patterns</li>
          </ul>
          <p><strong>Technical Data</strong></p>
          <ul>
            <li>IP address</li>
            <li>Browser type and version</li>
            <li>Operating system</li>
            <li>Device type and identifiers</li>
            <li>Referring URLs</li>
            <li>Session duration and timestamps</li>
          </ul>
          <p><strong>Cookies and Tracking</strong></p>
          <p>See our <Link href="/legal/cookies">Cookie Policy</Link> for full details. In summary, we use essential cookies for Platform operation, analytics cookies (PostHog) to understand feature usage, and preference cookies to remember your settings.</p>
          <h3>2.3 Information From Third Parties</h3>
          <p><strong>OAuth Sign-In</strong></p>
          <p>If you sign in via Google or LinkedIn, we receive your name, email address, and profile photograph from those providers. We do not receive your passwords.</p>
          <p><strong>Publicly Available Information</strong></p>
          <p>We may supplement your profile with publicly available professional information to improve match quality, with your consent.</p>
        </section>

        <section>
          <h2 id="3-how-we-use">3. How We Use Your Data</h2>
          <p>We use your personal data only for the purposes listed below. Each purpose is grounded in a lawful basis under the DPDP Act.</p>
          <table>
            <thead>
              <tr><th>Purpose</th><th>Data Used</th><th>Lawful Basis</th></tr>
            </thead>
            <tbody>
              <tr><td>Creating and managing your account</td><td>Account information</td><td>Contract</td></tr>
              <tr><td>Providing job matching and Fit Score</td><td>Professional information, usage data</td><td>Contract</td></tr>
              <tr><td>Resume Optimiser and ATS Score</td><td>Resume, job descriptions you submit</td><td>Contract</td></tr>
              <tr><td>Salary Intelligence (anonymised)</td><td>Compensation data (aggregated)</td><td>Legitimate interest</td></tr>
              <tr><td>Career Graph and connections</td><td>Professional information, network activity</td><td>Contract</td></tr>
              <tr><td>Mentorship matching</td><td>Profile, transition goals, persona</td><td>Contract</td></tr>
              <tr><td>Platform analytics and improvement</td><td>Usage data, technical data</td><td>Legitimate interest</td></tr>
              <tr><td>Error tracking and debugging</td><td>Technical data, error logs</td><td>Legitimate interest</td></tr>
              <tr><td>Sending transactional emails</td><td>Email address</td><td>Contract</td></tr>
              <tr><td>Sending product updates (if opted in)</td><td>Email address</td><td>Consent</td></tr>
              <tr><td>Legal compliance and fraud prevention</td><td>All categories as necessary</td><td>Legal obligation</td></tr>
              <tr><td>Enforcing our Terms of Service</td><td>All categories as necessary</td><td>Legitimate interest</td></tr>
            </tbody>
          </table>
          <p>We do not use your data to make fully automated decisions that produce legal or similarly significant effects without human review.</p>
        </section>

        <section>
          <h2 id="4-salary">4. Salary and Compensation Data</h2>
          <p>Salary data you provide is used to:</p>
          <ul>
            <li>Power the Salary Intelligence feature for all users in anonymised, aggregated form</li>
            <li>Inform your personal compensation positioning</li>
            <li>Improve match quality</li>
          </ul>
          <p><strong>We never display your individual compensation data to any other user.</strong> Salary Intelligence shows ranges and aggregates only — never individual records. Compensation data is anonymised before being included in any aggregate dataset.</p>
        </section>

        <section>
          <h2 id="5-how-we-share">5. How We Share Your Data</h2>
          <h3>5.1 With Other Users</h3>
          <p><strong>Job Seekers:</strong> Your profile is visible to recruiters on the Platform according to your privacy settings. You control what is visible. By default, your profile is visible to verified recruiters. You may set your profile to private at any time.</p>
          <p><strong>Recruiters:</strong> Your job listings and organisation information are visible to job seekers on the Platform.</p>
          <p><strong>Connections:</strong> Users you connect with can see the information you share in your career graph profile.</p>
          <h3>5.2 With Service Providers (Sub-Processors)</h3>
          <p>We share data with trusted third-party service providers who process data on our behalf. All sub-processors are contractually bound to protect your data and process it only for the purposes we specify.</p>
          <table>
            <thead>
              <tr><th>Sub-Processor</th><th>Purpose</th><th>Location</th></tr>
            </thead>
            <tbody>
              <tr><td>Vercel</td><td>Platform hosting and deployment</td><td>USA (SCCs in place)</td></tr>
              <tr><td>Amazon Web Services</td><td>Cloud infrastructure and storage</td><td>India / Global</td></tr>
              <tr><td>PostHog</td><td>Product analytics and feature usage</td><td>USA (SCCs in place)</td></tr>
              <tr><td>Sentry</td><td>Error tracking and debugging</td><td>USA (SCCs in place)</td></tr>
              <tr><td>Resend</td><td>Transactional email delivery</td><td>USA (SCCs in place)</td></tr>
              <tr><td>Razorpay</td><td>Payment processing (paid plans)</td><td>India</td></tr>
            </tbody>
          </table>
          <p style={{ fontSize: "0.875rem", color: "var(--ink-4)" }}>&quot;SCCs&quot; refers to Standard Contractual Clauses — contractual safeguards for international data transfers.</p>
          <h3>5.3 Legal Requirements</h3>
          <p>We may disclose your data where required by law, court order, or government authority, or where necessary to protect the rights, property, or safety of Ascend, our users, or the public.</p>
          <h3>5.4 Business Transfers</h3>
          <p>If Coheron Tech Private Limited is involved in a merger, acquisition, or sale of assets, your data may be transferred to the successor entity. We will notify you before your data is transferred and becomes subject to a different privacy policy. The successor entity will assume all obligations under this Policy.</p>
          <h3>5.5 What We Never Do</h3>
          <ul>
            <li>We never sell your personal data to third parties</li>
            <li>We never share your individual salary data with any other user or third party</li>
            <li>We never share your data with advertisers for targeting purposes</li>
            <li>We never share your resume or uploaded documents with employers without your explicit action (applying to a role)</li>
          </ul>
        </section>

        <section>
          <h2 id="6-data-retention">6. Data Retention</h2>
          <table>
            <thead>
              <tr><th>Data Category</th><th>Retention Period</th></tr>
            </thead>
            <tbody>
              <tr><td>Active account data</td><td>For the duration of your account</td></tr>
              <tr><td>Account data after deletion request</td><td>90 days (recoverable)</td></tr>
              <tr><td>Permanent deletion</td><td>180 days after deletion request</td></tr>
              <tr><td>Anonymised/aggregated analytics</td><td>Indefinitely (cannot be linked to you)</td></tr>
              <tr><td>Legal compliance records</td><td>As required by applicable law (typically 7 years)</td></tr>
              <tr><td>Payment records</td><td>7 years (as required by Indian tax law)</td></tr>
              <tr><td>Support correspondence</td><td>3 years from last interaction</td></tr>
            </tbody>
          </table>
          <p>When your data is deleted, it is removed from our active systems and queued for deletion from backups within the timeframes above.</p>
        </section>

        <section>
          <h2 id="7-your-rights">7. Your Rights</h2>
          <p>Under the DPDP Act 2023 and applicable law, you have the following rights:</p>
          <h3>7.1 Right to Access</h3>
          <p>You may request a copy of the personal data we hold about you. We will respond within 30 days.</p>
          <h3>7.2 Right to Correction</h3>
          <p>You may request correction of inaccurate or incomplete personal data. Most profile data can be updated directly in your account settings.</p>
          <h3>7.3 Right to Erasure</h3>
          <p>You may request deletion of your personal data. See <Link href="/legal/terms#3-account-registration">Section 3.3 of our Terms of Service</Link> for the deletion timeline. Note that we may retain certain data where required by law.</p>
          <h3>7.4 Right to Data Portability</h3>
          <p>You may request an export of your personal data in a structured, machine-readable format (JSON or CSV).</p>
          <h3>7.5 Right to Withdraw Consent</h3>
          <p>Where processing is based on consent (e.g. marketing emails), you may withdraw consent at any time without affecting the lawfulness of prior processing.</p>
          <h3>7.6 Right to Grievance Redressal</h3>
          <p>You have the right to have your privacy grievances addressed in a timely and effective manner.</p>
          <h3>7.7 Right to Nominate</h3>
          <p>You may nominate another individual to exercise your rights in the event of your death or incapacity.</p>
          <p><strong>To exercise any of these rights</strong>, contact us at legal@coheron.tech with the subject line &quot;Privacy Rights Request — [Your Name]&quot;. We will respond within 30 days. We may need to verify your identity before processing your request.</p>
          <p>If you are unsatisfied with our response, you have the right to lodge a complaint with the Data Protection Board of India once established under the DPDP Act.</p>
        </section>

        <section>
          <h2 id="8-data-security">8. Data Security</h2>
          <p>We implement industry-standard technical and organisational measures to protect your data, including:</p>
          <ul>
            <li>Passwords hashed using bcrypt with appropriate salt rounds</li>
            <li>All data transmitted over HTTPS/TLS encryption</li>
            <li>Database encryption at rest</li>
            <li>Access controls — staff access to personal data is limited to those with a legitimate need</li>
            <li>Regular security assessments</li>
            <li>Incident response procedures — we will notify affected users of data breaches within 72 hours of discovery where required by law</li>
          </ul>
          <p>No security measure is 100% effective. If you believe your account has been compromised, contact us immediately at legal@coheron.tech.</p>
        </section>

        <section>
          <h2 id="9-children">9. Children&apos;s Privacy</h2>
          <p>The Platform is not directed at individuals under the age of 18. We do not knowingly collect personal data from anyone under 18. If we discover we have collected data from a minor, we will delete it immediately. If you believe a minor has created an account, please contact us at legal@coheron.tech.</p>
        </section>

        <section>
          <h2 id="10-international">10. International Data Transfers</h2>
          <p>Ascend operates globally. Your data may be transferred to and processed in countries other than India, including the United States. Where we transfer data internationally, we ensure appropriate safeguards are in place, including Standard Contractual Clauses with our sub-processors.</p>
        </section>

        <section>
          <h2 id="11-third-party">11. Third-Party Links and Integrations</h2>
          <p>The Platform may contain links to third-party websites or integrate with third-party services (such as LinkedIn or Google for sign-in). This Policy does not apply to third-party services. We encourage you to review the privacy policies of any third-party services you use.</p>
        </section>

        <section>
          <h2 id="12-changes">12. Changes to This Policy</h2>
          <p>We may update this Policy from time to time. For material changes, we will provide at least 14 days&apos; notice via email or a prominent notice on the Platform. The updated Policy will be effective from the date stated at the top of this document.</p>
          <p>Your continued use of the Platform after the effective date constitutes acceptance of the updated Policy.</p>
        </section>

        <section>
          <h2 id="13-contact">13. Contact and Grievance Officer</h2>
          <p>For privacy-related questions, requests, or complaints:</p>
          <p><strong>Privacy and Grievance Officer</strong><br />Coheron Tech Private Limited<br />No. 5, 21st B Cross, Pragathi Layout, Doddanekkundi, Bengaluru 560037, Karnataka, India<br />GSTIN: 29AANCC3402A1Z3<br />Email: legal@coheron.tech</p>
          <p style={{ fontSize: "0.875rem", color: "var(--ink-4)" }}>We will acknowledge your request within 48 hours and respond fully within 30 days.</p>
        </section>

        <hr />
        <p style={{ fontSize: "0.875rem", color: "var(--ink-4)", fontStyle: "italic" }}>
          Ascend is a product of Coheron Tech Private Limited. This Privacy Policy will be updated to reflect Ascend as an independent legal entity upon incorporation.
        </p>
      </article>
      <LegalSidebar headings={PRIVACY_HEADINGS} />
    </>
  );
}
