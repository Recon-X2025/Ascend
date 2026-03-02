export default function PrivacyPage() {
  return (
    <div className="page-container py-16 max-w-3xl mx-auto">
      <h1 className="font-display font-bold text-2xl text-ink">Privacy Policy</h1>
      <p className="font-body text-sm text-ink-3 mt-2">
        <strong>Effective Date:</strong> 28 February 2026 · <strong>Last Updated:</strong> 28 February 2026
      </p>

      <div className="mt-10 space-y-10 font-body text-[0.9375rem] text-ink-2 leading-relaxed">
        <section>
          <h2 className="font-display font-bold text-lg text-ink mb-3">1. Introduction</h2>
          <p className="mb-3">
            Ascend, a product of Coheron Tech Private Limited (&quot;Coheron&quot;, &quot;we&quot;, &quot;us&quot;, &quot;our&quot;), is committed to protecting your privacy. This Privacy Policy explains how we collect, use, store, share, and protect your personal data when you use the Ascend platform (&quot;Platform&quot;).
          </p>
          <p className="mb-3">
            This Policy applies to all users of the Platform globally. It is drafted in compliance with:
          </p>
          <ul className="list-disc pl-6 space-y-1 mb-3">
            <li>The Digital Personal Data Protection Act, 2023 (India) (&quot;DPDP Act&quot;)</li>
            <li>The Information Technology Act, 2000 (India) and associated rules</li>
            <li>Applicable international data protection standards</li>
          </ul>
          <p className="mb-3">
            <strong>Coheron Tech Private Limited</strong><br />
            No. 5, 21st B Cross, Pragathi Layout, Doddanekkundi, Bengaluru 560037, Karnataka, India<br />
            GSTIN: 29AANCC3402A1Z3<br />
            Email: legal@coheron.tech
          </p>
          <p className="mb-0">
            If you have questions about this Policy or wish to exercise your rights, contact us at legal@coheron.tech.
          </p>
        </section>

        <section>
          <h2 className="font-display font-bold text-lg text-ink mb-3">2. Data We Collect</h2>
          <h3 className="font-display font-semibold text-base text-ink mt-4 mb-2">2.1 Information You Provide Directly</h3>
          <p className="mb-2 font-semibold text-ink">Account Information</p>
          <ul className="list-disc pl-6 space-y-1 mb-3">
            <li>Full name, email address, password (hashed, never stored in plain text)</li>
            <li>Phone number (optional)</li>
            <li>Profile photograph (optional)</li>
            <li>Date of birth (to verify age eligibility)</li>
            <li>Persona selection (active seeker, passive seeker, early career, recruiter)</li>
          </ul>
          <p className="mb-2 font-semibold text-ink">Professional Information</p>
          <ul className="list-disc pl-6 space-y-1 mb-3">
            <li>Work history — employer names, roles, dates, descriptions</li>
            <li>Educational background — institutions, degrees, dates</li>
            <li>Skills, certifications, and achievements</li>
            <li>Target roles, industries, and locations</li>
            <li>Current and expected compensation (optional)</li>
            <li>Resume documents you upload</li>
          </ul>
          <p className="mb-2 font-semibold text-ink">Recruiter Information (if applicable)</p>
          <ul className="list-disc pl-6 space-y-1 mb-3">
            <li>Organisation name and size</li>
            <li>Role and hiring authority</li>
            <li>Job listings you post</li>
            <li>Candidate interactions and pipeline data</li>
          </ul>
          <p className="mb-2 font-semibold text-ink">Communications</p>
          <ul className="list-disc pl-6 space-y-1 mb-3">
            <li>Messages sent through the Platform</li>
            <li>Support requests and correspondence with our team</li>
            <li>Feedback and survey responses</li>
          </ul>
          <h3 className="font-display font-semibold text-base text-ink mt-4 mb-2">2.2 Information We Collect Automatically</h3>
          <p className="mb-2 font-semibold text-ink">Usage Data</p>
          <ul className="list-disc pl-6 space-y-1 mb-3">
            <li>Pages visited, features used, time spent on the Platform</li>
            <li>Search queries and job listings viewed</li>
            <li>Fit Score calculations and resume optimisation requests</li>
            <li>Clicks, scrolls, and interaction patterns</li>
          </ul>
          <p className="mb-2 font-semibold text-ink">Technical Data</p>
          <ul className="list-disc pl-6 space-y-1 mb-3">
            <li>IP address</li>
            <li>Browser type and version</li>
            <li>Operating system</li>
            <li>Device type and identifiers</li>
            <li>Referring URLs</li>
            <li>Session duration and timestamps</li>
          </ul>
          <p className="mb-2 font-semibold text-ink">Cookies and Tracking</p>
          <p className="mb-3">
            See our Cookie Policy for full details. In summary, we use essential cookies for Platform operation, analytics cookies (PostHog) to understand feature usage, and preference cookies to remember your settings.
          </p>
          <h3 className="font-display font-semibold text-base text-ink mt-4 mb-2">2.3 Information From Third Parties</h3>
          <p className="mb-2 font-semibold text-ink">OAuth Sign-In</p>
          <p className="mb-3">
            If you sign in via Google or LinkedIn, we receive your name, email address, and profile photograph from those providers. We do not receive your passwords.
          </p>
          <p className="mb-2 font-semibold text-ink">Publicly Available Information</p>
          <p className="mb-0">
            We may supplement your profile with publicly available professional information to improve match quality, with your consent.
          </p>
        </section>

        <section>
          <h2 className="font-display font-bold text-lg text-ink mb-3">3. How We Use Your Data</h2>
          <p className="mb-3">
            We use your personal data only for the purposes listed below. Each purpose is grounded in a lawful basis under the DPDP Act.
          </p>
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <table className="w-full border-collapse text-[0.8125rem] min-w-[520px]">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 pr-3 font-semibold text-ink">Purpose</th>
                  <th className="text-left py-2 pr-3 font-semibold text-ink">Data Used</th>
                  <th className="text-left py-2 font-semibold text-ink">Lawful Basis</th>
                </tr>
              </thead>
              <tbody className="text-ink-2">
                <tr className="border-b border-border"><td className="py-2 pr-3">Creating and managing your account</td><td className="py-2 pr-3">Account information</td><td className="py-2">Contract</td></tr>
                <tr className="border-b border-border"><td className="py-2 pr-3">Providing job matching and Fit Score</td><td className="py-2 pr-3">Professional information, usage data</td><td className="py-2">Contract</td></tr>
                <tr className="border-b border-border"><td className="py-2 pr-3">Resume Optimiser and ATS Score</td><td className="py-2 pr-3">Resume, job descriptions you submit</td><td className="py-2">Contract</td></tr>
                <tr className="border-b border-border"><td className="py-2 pr-3">Salary Intelligence (anonymised)</td><td className="py-2 pr-3">Compensation data (aggregated)</td><td className="py-2">Legitimate interest</td></tr>
                <tr className="border-b border-border"><td className="py-2 pr-3">Career Graph and connections</td><td className="py-2 pr-3">Professional information, network activity</td><td className="py-2">Contract</td></tr>
                <tr className="border-b border-border"><td className="py-2 pr-3">Mentorship matching</td><td className="py-2 pr-3">Profile, transition goals, persona</td><td className="py-2">Contract</td></tr>
                <tr className="border-b border-border"><td className="py-2 pr-3">Platform analytics and improvement</td><td className="py-2 pr-3">Usage data, technical data</td><td className="py-2">Legitimate interest</td></tr>
                <tr className="border-b border-border"><td className="py-2 pr-3">Error tracking and debugging</td><td className="py-2 pr-3">Technical data, error logs</td><td className="py-2">Legitimate interest</td></tr>
                <tr className="border-b border-border"><td className="py-2 pr-3">Sending transactional emails</td><td className="py-2 pr-3">Email address</td><td className="py-2">Contract</td></tr>
                <tr className="border-b border-border"><td className="py-2 pr-3">Sending product updates (if opted in)</td><td className="py-2 pr-3">Email address</td><td className="py-2">Consent</td></tr>
                <tr className="border-b border-border"><td className="py-2 pr-3">Legal compliance and fraud prevention</td><td className="py-2 pr-3">All categories as necessary</td><td className="py-2">Legal obligation</td></tr>
                <tr className="border-b border-border"><td className="py-2 pr-3">Enforcing our Terms of Service</td><td className="py-2 pr-3">All categories as necessary</td><td className="py-2">Legitimate interest</td></tr>
              </tbody>
            </table>
          </div>
          <p className="mt-3 mb-0">
            We do not use your data to make fully automated decisions that produce legal or similarly significant effects without human review.
          </p>
        </section>

        <section>
          <h2 className="font-display font-bold text-lg text-ink mb-3">4. Salary and Compensation Data</h2>
          <p className="mb-3">
            Salary data you provide is used to:
          </p>
          <ul className="list-disc pl-6 space-y-1 mb-3">
            <li>Power the Salary Intelligence feature for all users in anonymised, aggregated form</li>
            <li>Inform your personal compensation positioning</li>
            <li>Improve match quality</li>
          </ul>
          <p className="mb-0 font-semibold text-ink">
            We never display your individual compensation data to any other user. Salary Intelligence shows ranges and aggregates only — never individual records. Compensation data is anonymised before being included in any aggregate dataset.
          </p>
        </section>

        <section>
          <h2 className="font-display font-bold text-lg text-ink mb-3">5. How We Share Your Data</h2>
          <h3 className="font-display font-semibold text-base text-ink mt-4 mb-2">5.1 With Other Users</h3>
          <p className="mb-2"><strong>Job Seekers:</strong> Your profile is visible to recruiters on the Platform according to your privacy settings. You control what is visible. By default, your profile is visible to verified recruiters. You may set your profile to private at any time.</p>
          <p className="mb-2"><strong>Recruiters:</strong> Your job listings and organisation information are visible to job seekers on the Platform.</p>
          <p className="mb-3"><strong>Connections:</strong> Users you connect with can see the information you share in your career graph profile.</p>
          <h3 className="font-display font-semibold text-base text-ink mt-4 mb-2">5.2 With Service Providers (Sub-Processors)</h3>
          <p className="mb-3">
            We share data with trusted third-party service providers who process data on our behalf. All sub-processors are contractually bound to protect your data and process it only for the purposes we specify.
          </p>
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <table className="w-full border-collapse text-[0.8125rem] min-w-[400px]">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 pr-3 font-semibold text-ink">Sub-Processor</th>
                  <th className="text-left py-2 pr-3 font-semibold text-ink">Purpose</th>
                  <th className="text-left py-2 font-semibold text-ink">Location</th>
                </tr>
              </thead>
              <tbody className="text-ink-2">
                <tr className="border-b border-border"><td className="py-2 pr-3">Vercel</td><td className="py-2 pr-3">Platform hosting and deployment</td><td className="py-2">USA (SCCs in place)</td></tr>
                <tr className="border-b border-border"><td className="py-2 pr-3">Amazon Web Services</td><td className="py-2 pr-3">Cloud infrastructure and storage</td><td className="py-2">India / Global</td></tr>
                <tr className="border-b border-border"><td className="py-2 pr-3">PostHog</td><td className="py-2 pr-3">Product analytics and feature usage</td><td className="py-2">USA (SCCs in place)</td></tr>
                <tr className="border-b border-border"><td className="py-2 pr-3">Sentry</td><td className="py-2 pr-3">Error tracking and debugging</td><td className="py-2">USA (SCCs in place)</td></tr>
                <tr className="border-b border-border"><td className="py-2 pr-3">Resend</td><td className="py-2 pr-3">Transactional email delivery</td><td className="py-2">USA (SCCs in place)</td></tr>
                <tr className="border-b border-border"><td className="py-2 pr-3">Razorpay</td><td className="py-2 pr-3">Payment processing (paid plans)</td><td className="py-2">India</td></tr>
              </tbody>
            </table>
          </div>
          <p className="mt-2 mb-3 text-[0.875rem] text-ink-3">
            &quot;SCCs&quot; refers to Standard Contractual Clauses — contractual safeguards for international data transfers.
          </p>
          <h3 className="font-display font-semibold text-base text-ink mt-4 mb-2">5.3 Legal Requirements</h3>
          <p className="mb-3">
            We may disclose your data where required by law, court order, or government authority, or where necessary to protect the rights, property, or safety of Ascend, our users, or the public.
          </p>
          <h3 className="font-display font-semibold text-base text-ink mt-4 mb-2">5.4 Business Transfers</h3>
          <p className="mb-3">
            If Coheron Tech Private Limited is involved in a merger, acquisition, or sale of assets, your data may be transferred to the successor entity. We will notify you before your data is transferred and becomes subject to a different privacy policy. The successor entity will assume all obligations under this Policy.
          </p>
          <h3 className="font-display font-semibold text-base text-ink mt-4 mb-2">5.5 What We Never Do</h3>
          <ul className="list-disc pl-6 space-y-1 mb-0">
            <li>We never sell your personal data to third parties</li>
            <li>We never share your individual salary data with any other user or third party</li>
            <li>We never share your data with advertisers for targeting purposes</li>
            <li>We never share your resume or uploaded documents with employers without your explicit action (applying to a role)</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display font-bold text-lg text-ink mb-3">6. Data Retention</h2>
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <table className="w-full border-collapse text-[0.8125rem] min-w-[360px]">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 pr-3 font-semibold text-ink">Data Category</th>
                  <th className="text-left py-2 font-semibold text-ink">Retention Period</th>
                </tr>
              </thead>
              <tbody className="text-ink-2">
                <tr className="border-b border-border"><td className="py-2 pr-3">Active account data</td><td className="py-2">For the duration of your account</td></tr>
                <tr className="border-b border-border"><td className="py-2 pr-3">Account data after deletion request</td><td className="py-2">90 days (recoverable)</td></tr>
                <tr className="border-b border-border"><td className="py-2 pr-3">Permanent deletion</td><td className="py-2">180 days after deletion request</td></tr>
                <tr className="border-b border-border"><td className="py-2 pr-3">Anonymised/aggregated analytics</td><td className="py-2">Indefinitely (cannot be linked to you)</td></tr>
                <tr className="border-b border-border"><td className="py-2 pr-3">Legal compliance records</td><td className="py-2">As required by applicable law (typically 7 years)</td></tr>
                <tr className="border-b border-border"><td className="py-2 pr-3">Payment records</td><td className="py-2">7 years (as required by Indian tax law)</td></tr>
                <tr className="border-b border-border"><td className="py-2 pr-3">Support correspondence</td><td className="py-2">3 years from last interaction</td></tr>
              </tbody>
            </table>
          </div>
          <p className="mt-3 mb-0">
            When your data is deleted, it is removed from our active systems and queued for deletion from backups within the timeframes above.
          </p>
        </section>

        <section>
          <h2 className="font-display font-bold text-lg text-ink mb-3">7. Your Rights</h2>
          <p className="mb-3">
            Under the DPDP Act 2023 and applicable law, you have the following rights:
          </p>
          <h3 className="font-display font-semibold text-base text-ink mt-4 mb-2">7.1 Right to Access</h3>
          <p className="mb-3">
            You may request a copy of the personal data we hold about you. We will respond within 30 days.
          </p>
          <h3 className="font-display font-semibold text-base text-ink mt-4 mb-2">7.2 Right to Correction</h3>
          <p className="mb-3">
            You may request correction of inaccurate or incomplete personal data. Most profile data can be updated directly in your account settings.
          </p>
          <h3 className="font-display font-semibold text-base text-ink mt-4 mb-2">7.3 Right to Erasure</h3>
          <p className="mb-3">
            You may request deletion of your personal data. See Section 3.3 of our Terms of Service for the deletion timeline. Note that we may retain certain data where required by law.
          </p>
          <h3 className="font-display font-semibold text-base text-ink mt-4 mb-2">7.4 Right to Data Portability</h3>
          <p className="mb-3">
            You may request an export of your personal data in a structured, machine-readable format (JSON or CSV).
          </p>
          <h3 className="font-display font-semibold text-base text-ink mt-4 mb-2">7.5 Right to Withdraw Consent</h3>
          <p className="mb-3">
            Where processing is based on consent (e.g. marketing emails), you may withdraw consent at any time without affecting the lawfulness of prior processing.
          </p>
          <h3 className="font-display font-semibold text-base text-ink mt-4 mb-2">7.6 Right to Grievance Redressal</h3>
          <p className="mb-3">
            You have the right to have your privacy grievances addressed in a timely and effective manner.
          </p>
          <h3 className="font-display font-semibold text-base text-ink mt-4 mb-2">7.7 Right to Nominate</h3>
          <p className="mb-3">
            You may nominate another individual to exercise your rights in the event of your death or incapacity.
          </p>
          <p className="mb-3">
            <strong>To exercise any of these rights</strong>, contact us at legal@coheron.tech with the subject line &quot;Privacy Rights Request — [Your Name]&quot;. We will respond within 30 days. We may need to verify your identity before processing your request.
          </p>
          <p className="mb-0">
            If you are unsatisfied with our response, you have the right to lodge a complaint with the Data Protection Board of India once established under the DPDP Act.
          </p>
        </section>

        <section>
          <h2 className="font-display font-bold text-lg text-ink mb-3">8. Data Security</h2>
          <p className="mb-2">
            We implement industry-standard technical and organisational measures to protect your data, including:
          </p>
          <ul className="list-disc pl-6 space-y-1 mb-3">
            <li>Passwords hashed using bcrypt with appropriate salt rounds</li>
            <li>All data transmitted over HTTPS/TLS encryption</li>
            <li>Database encryption at rest</li>
            <li>Access controls — staff access to personal data is limited to those with a legitimate need</li>
            <li>Regular security assessments</li>
            <li>Incident response procedures — we will notify affected users of data breaches within 72 hours of discovery where required by law</li>
          </ul>
          <p className="mb-0">
            No security measure is 100% effective. If you believe your account has been compromised, contact us immediately at legal@coheron.tech.
          </p>
        </section>

        <section>
          <h2 className="font-display font-bold text-lg text-ink mb-3">9. Children&apos;s Privacy</h2>
          <p className="mb-0">
            The Platform is not directed at individuals under the age of 18. We do not knowingly collect personal data from anyone under 18. If we discover we have collected data from a minor, we will delete it immediately. If you believe a minor has created an account, please contact us at legal@coheron.tech.
          </p>
        </section>

        <section>
          <h2 className="font-display font-bold text-lg text-ink mb-3">10. International Data Transfers</h2>
          <p className="mb-0">
            Ascend operates globally. Your data may be transferred to and processed in countries other than India, including the United States. Where we transfer data internationally, we ensure appropriate safeguards are in place, including Standard Contractual Clauses with our sub-processors.
          </p>
        </section>

        <section>
          <h2 className="font-display font-bold text-lg text-ink mb-3">11. Third-Party Links and Integrations</h2>
          <p className="mb-0">
            The Platform may contain links to third-party websites or integrate with third-party services (such as LinkedIn or Google for sign-in). This Policy does not apply to third-party services. We encourage you to review the privacy policies of any third-party services you use.
          </p>
        </section>

        <section>
          <h2 className="font-display font-bold text-lg text-ink mb-3">12. Changes to This Policy</h2>
          <p className="mb-3">
            We may update this Policy from time to time. For material changes, we will provide at least 14 days&apos; notice via email or a prominent notice on the Platform. The updated Policy will be effective from the date stated at the top of this document.
          </p>
          <p className="mb-0">
            Your continued use of the Platform after the effective date constitutes acceptance of the updated Policy.
          </p>
        </section>

        <section>
          <h2 className="font-display font-bold text-lg text-ink mb-3">13. Contact and Grievance Officer</h2>
          <p className="mb-3">
            For privacy-related questions, requests, or complaints:
          </p>
          <p className="mb-0">
            <strong>Privacy and Grievance Officer</strong><br />
            Coheron Tech Private Limited<br />
            No. 5, 21st B Cross, Pragathi Layout, Doddanekkundi, Bengaluru 560037, Karnataka, India<br />
            GSTIN: 29AANCC3402A1Z3<br />
            Email: legal@coheron.tech
          </p>
          <p className="mt-3 mb-0 text-ink-3 text-[0.875rem]">
            We will acknowledge your request within 48 hours and respond fully within 30 days.
          </p>
        </section>

        <p className="font-body text-ink-4 text-[0.875rem] italic pt-6 border-t border-border">
          Ascend is a product of Coheron Tech Private Limited. This Privacy Policy will be updated to reflect Ascend as an independent legal entity upon incorporation.
        </p>
      </div>
    </div>
  );
}
