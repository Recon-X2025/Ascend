import { resend } from "@/lib/email/resend";

const FROM = process.env.EMAIL_FROM ?? "Ascend <onboarding@resend.dev>";
const APP_NAME = "Ascend";

export async function sendReviewRejectedEmail(
  to: string,
  reason: string,
  type: "company" | "interview" | "salary"
) {
  if (!resend) return;
  const label = type === "company" ? "company review" : type === "interview" ? "interview review" : "salary submission";
  await resend.emails.send({
    from: FROM,
    to: [to],
    subject: `Your ${label} was not approved — ${APP_NAME}`,
    html: `<p>Your ${label} could not be approved.</p><p>Reason: ${reason}</p><p>You may submit again with updated information.</p><p>— ${APP_NAME}</p>`,
  });
}
