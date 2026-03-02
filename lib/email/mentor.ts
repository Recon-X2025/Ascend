import { resend } from "./resend";

const FROM = process.env.EMAIL_FROM ?? "Ascend <onboarding@resend.dev>";
const APP_NAME = "Ascend";

export async function sendMentorProfileReceivedEmail(to: string) {
  if (!resend) return;
  await resend.emails.send({
    from: FROM,
    to: [to],
    subject: `Your mentor profile has been received — ${APP_NAME}`,
    html: `<p>Thanks for submitting your mentor profile. We'll review it within 48 hours.</p><p>— ${APP_NAME}</p>`,
  });
}

export async function sendMentorApprovedEmail(to: string, profileLive: boolean) {
  if (!resend) return;
  const message = profileLive
    ? "Your identity has been verified. Your mentor profile is now live in our matching system."
    : "Your identity has been verified. Complete your mentor profile to become discoverable.";
  await resend.emails.send({
    from: FROM,
    to: [to],
    subject: `You're verified — ${APP_NAME}`,
    html: `<p>${message}</p><p>— ${APP_NAME}</p>`,
  });
}

export async function sendMentorMoreInfoEmail(to: string, reason?: string) {
  if (!resend) return;
  await resend.emails.send({
    from: FROM,
    to: [to],
    subject: `More information needed for verification — ${APP_NAME}`,
    html: `<p>We need more information to complete your verification.</p>${reason ? `<p>${reason}</p>` : ""}<p>— ${APP_NAME}</p>`,
  });
}

export async function sendMentorRejectedEmail(to: string, reason?: string) {
  if (!resend) return;
  await resend.emails.send({
    from: FROM,
    to: [to],
    subject: `Verification update — ${APP_NAME}`,
    html: `<p>We couldn't verify your profile at this time.</p>${reason ? `<p>${reason}</p>` : ""}<p>You may reapply with additional documentation.</p><p>— ${APP_NAME}</p>`,
  });
}
