# Phase 10: Dashboards (Seeker-First) — Build Summary

## Overview

Phase 10 implements **role-specific dashboards** for all four user types, with the **Job Seeker dashboard** built first as the centrepiece. It also adds the **in-app Notification Centre** (bell icon, unread count, mark-read, deep links) used across all roles.

## Deliverables

### Prisma
- **Notification** model: id, userId, type (NotificationType), title, body, linkUrl, isRead, createdAt.
- **NotificationType** enum: APPLICATION_STATUS_CHANGED, JOB_ALERT_MATCH, FIT_SCORE_IMPROVED, PROFILE_VIEW, RESUME_OPTIMISED, CONNECTION_REQUEST, MESSAGE_RECEIVED, SYSTEM.
- **JobSeekerProfile**: added `profileViews Int @default(0)`.
- **User**: added `notifications Notification[]`.
- Migration: `phase-10-dashboards`.

### Notification API & helpers
- **GET /api/notifications**: Paginated list, `?unreadOnly=true`, `?limit=20&cursor=`, returns notifications + nextCursor + unreadCount.
- **PATCH /api/notifications/read**: Body `{ notificationId?: string }`; mark one or all as read.
- **lib/notifications/create.ts**: createNotification, notifyApplicationStatusChanged, notifyFitScoreImproved, notifyProfileView, notifyResumeOptimised.

### Notification Centre UI
- **components/notifications/NotificationCentre.tsx**: Bell icon + dropdown, unread badge, mark all read, click to navigate + mark read. Uses date-fns for relative time.
- Rendered in **Navbar** for all authenticated users.
- **/notifications** page with NotificationsListClient for “View all notifications”.

### Dashboard APIs
- **GET /api/dashboard/seeker**: Single aggregated response: profile (completionScore, profileViews, headline, name, image), applications (recent 10 + stats by status), savedJobs (5), alerts (5 active), optimisedResumes (3), unreadNotifications count. Uses applicantId for JobApplication.
- **GET /api/dashboard/recruiter**: activeJobs (recruiterId), recentApplications (8), pipeline (groupBy status).
- **GET /api/dashboard/admin**: userCount, companyCount, jobCount, applicationCount, pendingReviews (CompanyReview PENDING). Platform admin only.

### Seeker dashboard
- **app/dashboard/seeker/page.tsx**: Server auth, redirect non-seeker; renders SeekerDashboardClient.
- **SeekerDashboardClient**: SWR on /api/dashboard/seeker, 60s refresh; header with greeting + Browse Jobs; grid: ProfileCompletionCard, ApplicationStatsCard, RecentApplicationsList, SavedJobsCard, AlertsCard, OptimisedResumesCard (if any).
- Sub-components in **components/dashboard/seeker/**: ProfileCompletionCard, ApplicationStatsCard, RecentApplicationsList, SavedJobsCard, AlertsCard, OptimisedResumesCard.

### Recruiter dashboard
- **app/dashboard/recruiter/page.tsx**: Auth for RECRUITER or COMPANY_ADMIN; RecruiterDashboardClient.
- **RecruiterDashboardClient**: Active jobs list (applicant counts, deadline soon warning), pipeline summary (status pills), recent applicants (8) with link to job applications.

### Admin dashboard
- **app/dashboard/admin/page.tsx**: Platform admin only; AdminDashboardClient.
- **AdminDashboardClient**: Stat tiles (users, companies, jobs, applications, pending reviews); quick links (Manage Users, Companies, Moderation, Feature Flags).

### Dashboard router
- **app/dashboard/page.tsx**: Already redirects by role (JOB_SEEKER → /dashboard/seeker, RECRUITER → /dashboard/recruiter, etc.).

### Profile views & notifications wired
- **app/profile/[username]/page.tsx**: When viewer is not owner, increment JobSeekerProfile.profileViews; when viewer is RECRUITER, call notifyProfileView(profileOwnerId, recruiterCompanyName).
- **PATCH /api/applications/[id]/status**: After status update, call notifyApplicationStatusChanged(applicantId, companyName, jobTitle, newStatus, jobSlug).
- **jd-optimiser.worker.ts**: After session DONE, call notifyResumeOptimised(userId, jobTitle, sessionId).
- **notifyFitScoreImproved**: Helper implemented; can be wired in fit-score flow when new score ≥ previous + 5 (e.g. in GET fit-score refresh or profile-update flow).

## Key Files

| File | Purpose |
|------|---------|
| prisma/schema.prisma | Notification, NotificationType, User.notifications, JobSeekerProfile.profileViews |
| lib/notifications/create.ts | Notification helpers |
| app/api/notifications/route.ts | GET list + unreadCount |
| app/api/notifications/read/route.ts | PATCH mark read |
| app/api/dashboard/seeker/route.ts | Aggregated seeker data |
| app/api/dashboard/recruiter/route.ts | Recruiter data |
| app/api/dashboard/admin/route.ts | Admin stats |
| app/dashboard/page.tsx | Role redirect |
| app/dashboard/seeker/page.tsx | Seeker dashboard page |
| app/dashboard/recruiter/page.tsx | Recruiter dashboard page |
| app/dashboard/admin/page.tsx | Admin dashboard page |
| components/notifications/NotificationCentre.tsx | Bell + dropdown in nav |
| components/dashboard/seeker/SeekerDashboardClient.tsx | Seeker dashboard root |
| components/dashboard/recruiter/RecruiterDashboardClient.tsx | Recruiter dashboard root |
| components/dashboard/admin/AdminDashboardClient.tsx | Admin dashboard root |

## Dependencies

- **date-fns**: Used in NotificationCentre and dashboard cards (formatDistanceToNow).
- **swr**: Used in SeekerDashboardClient and Recruiter/AdminDashboardClient for dashboard data.

## Exit checklist

- [x] Notification model migrated; NotificationType enum; User.notifications; JobSeekerProfile.profileViews
- [x] GET /api/notifications returns paginated list + unreadCount
- [x] PATCH /api/notifications/read marks one or all read
- [x] NotificationCentre in nav; unread badge; mark-all-read; deep links
- [x] GET /api/dashboard/seeker returns all buckets in one request
- [x] Seeker dashboard: profile, application stats, recent applications, saved jobs, alerts, optimised resumes
- [x] Application stats use correct status keys (SUBMITTED → applied, etc.)
- [x] Recruiter dashboard: active jobs, pipeline, recent applicants
- [x] Admin dashboard: stat tiles with live data
- [x] /dashboard redirects by role
- [x] Profile view count increments (non-owner); profile view notification when recruiter views
- [x] Application status change triggers notification
- [x] Resume optimised notification from Phase 6A worker
- [x] No direct Prisma in client components; date-fns and swr installed
