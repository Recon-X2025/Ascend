/**
 * Phase 22: Marketplace email templates (Resend).
 */
import { resend } from "./resend";

const FROM = process.env.EMAIL_FROM ?? "Ascend <onboarding@resend.dev>";
const APP_NAME = "Ascend";

export async function sendProviderApprovedEmail(to: string) {
  if (!resend) return;
  await resend.emails.send({
    from: FROM,
    to: [to],
    subject: `You're approved as a provider — ${APP_NAME}`,
    html: `<p>Your marketplace provider profile has been approved. You can now receive orders from seekers.</p><p>— ${APP_NAME}</p>`,
  });
}

export async function sendProviderRejectedEmail(to: string, reason?: string) {
  if (!resend) return;
  await resend.emails.send({
    from: FROM,
    to: [to],
    subject: `Provider application update — ${APP_NAME}`,
    html: `<p>We couldn't approve your provider profile at this time.</p>${reason ? `<p>${reason}</p>` : ""}<p>You may reapply with additional documentation.</p><p>— ${APP_NAME}</p>`,
  });
}

export async function sendOrderReceivedEmail(to: string, serviceType: string, seekerName?: string) {
  if (!resend) return;
  await resend.emails.send({
    from: FROM,
    to: [to],
    subject: `New ${serviceType} order — ${APP_NAME}`,
    html: `<p>You have a new order${seekerName ? ` from ${seekerName}` : ""}. Check your provider dashboard to deliver.</p><p>— ${APP_NAME}</p>`,
  });
}

export async function sendOrderDeliveredEmail(to: string, serviceType: string) {
  if (!resend) return;
  await resend.emails.send({
    from: FROM,
    to: [to],
    subject: `Your ${serviceType} is ready — ${APP_NAME}`,
    html: `<p>Your provider has delivered your ${serviceType}. Check your dashboard to view and rate.</p><p>— ${APP_NAME}</p>`,
  });
}

export async function sendOrderDisputedEmail(to: string, orderId: string, serviceType: string) {
  if (!resend) return;
  await resend.emails.send({
    from: FROM,
    to: [to],
    subject: `Order disputed — ${APP_NAME}`,
    html: `<p>Order ${orderId} (${serviceType}) has been marked as disputed. Our team will review.</p><p>— ${APP_NAME}</p>`,
  });
}

export async function sendOrderRefundedEmail(to: string, serviceType: string) {
  if (!resend) return;
  await resend.emails.send({
    from: FROM,
    to: [to],
    subject: `Refund processed — ${APP_NAME}`,
    html: `<p>Your payment for the ${serviceType} order has been refunded.</p><p>— ${APP_NAME}</p>`,
  });
}

export async function sendBadgeRevokedEmail(to: string, provider: string, skill: string) {
  if (!resend) return;
  await resend.emails.send({
    from: FROM,
    to: [to],
    subject: `Badge revoked — ${APP_NAME}`,
    html: `<p>Your ${provider} badge for ${skill} has been revoked by our team.</p><p>— ${APP_NAME}</p>`,
  });
}
