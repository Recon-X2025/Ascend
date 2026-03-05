import { prisma } from "@/lib/prisma/client";
import { NotificationType } from "@prisma/client";

export interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  body?: string;
  linkUrl?: string;
}

export async function createNotification(input: CreateNotificationInput) {
  return prisma.notification.create({ data: input });
}

export async function notifyApplicationStatusChanged(
  userId: string,
  companyName: string,
  jobTitle: string,
  newStatus: string
) {
  return createNotification({
    userId,
    type: NotificationType.APPLICATION_STATUS_CHANGED,
    title: `Application update from ${companyName}`,
    body: `Your application for ${jobTitle} is now ${newStatus.toLowerCase()}.`,
    linkUrl: "/dashboard/seeker/applications",
  });
}

export async function notifyFitScoreImproved(
  userId: string,
  jobTitle: string,
  oldScore: number,
  newScore: number,
  jobSlug: string
) {
  return createNotification({
    userId,
    type: NotificationType.FIT_SCORE_IMPROVED,
    title: `Your fit score improved for ${jobTitle}`,
    body: `Score went from ${oldScore}% to ${newScore}% after your profile update.`,
    linkUrl: `/jobs/${jobSlug}`,
  });
}

export async function notifyProfileView(userId: string, recruiterCompany?: string | null) {
  const body = recruiterCompany
    ? `A recruiter from ${recruiterCompany} viewed your profile.`
    : "A recruiter viewed your profile.";
  return createNotification({
    userId,
    type: NotificationType.PROFILE_VIEW,
    title: "Your profile was viewed",
    body,
    linkUrl: "/dashboard/seeker",
  });
}

export async function notifyResumeOptimised(
  userId: string,
  jobTitle: string,
  sessionId: string
) {
  return createNotification({
    userId,
    type: NotificationType.RESUME_OPTIMISED,
    title: "Your optimised resume is ready",
    body: `Resume tailored for ${jobTitle} is ready to review and download.`,
    linkUrl: `/dashboard/resume/optimise/${sessionId}`,
  });
}

export async function notifyConnectionRequest(
  recipientId: string,
  requesterName: string,
  connectionId: string
) {
  return createNotification({
    userId: recipientId,
    type: NotificationType.CONNECTION_REQUEST,
    title: "Connect request",
    body: `${requesterName} wants to connect with you.`,
    linkUrl: `/network?connection=${connectionId}`,
  });
}

export async function notifyMessageReceived(
  recipientId: string,
  senderName: string,
  conversationId: string
) {
  return createNotification({
    userId: recipientId,
    type: NotificationType.MESSAGE_RECEIVED,
    title: "New message",
    body: `${senderName} sent you a message.`,
    linkUrl: `/messages?conversation=${conversationId}`,
  });
}

export async function notifyMentorSessionRequested(
  mentorUserId: string,
  menteeName: string,
  sessionGoal: string
) {
  const preview = sessionGoal.length > 80 ? `${sessionGoal.slice(0, 80)}…` : sessionGoal;
  return createNotification({
    userId: mentorUserId,
    type: NotificationType.MENTOR_SESSION_REQUESTED,
    title: "New mentorship request",
    body: `${menteeName} requested a session: "${preview}"`,
    linkUrl: "/mentorship/dashboard",
  });
}

export async function notifyMentorSessionAccepted(
  menteeId: string,
  mentorName: string,
  scheduledAt: Date | null
) {
  const body = scheduledAt
    ? `Your session with ${mentorName} is confirmed${scheduledAt ? ` for ${scheduledAt.toLocaleDateString()}` : ""}.`
    : `${mentorName} accepted your request. They'll propose a time soon.`;
  return createNotification({
    userId: menteeId,
    type: NotificationType.MENTOR_SESSION_ACCEPTED,
    title: "Mentorship session accepted",
    body,
    linkUrl: "/mentorship/dashboard",
  });
}

export async function notifyMentorSessionDeclined(
  menteeId: string,
  mentorName: string
) {
  return createNotification({
    userId: menteeId,
    type: NotificationType.MENTOR_SESSION_DECLINED,
    title: "Mentorship request declined",
    body: `${mentorName} is unable to take on this session right now.`,
    linkUrl: "/mentorship",
  });
}

export async function notifyMentorSessionCompleted(
  menteeId: string,
  mentorName: string,
  sessionId: string
) {
  return createNotification({
    userId: menteeId,
    type: NotificationType.MENTOR_SESSION_COMPLETED,
    title: "How did your session go?",
    body: `Leave a review for ${mentorName} to help other mentees.`,
    linkUrl: `/mentorship/dashboard?review=${sessionId}`,
  });
}
