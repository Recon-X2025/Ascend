# Phase 15: Mobile Responsiveness Polish — Build Summary

## Overview

Phase 15 makes Ascend **mobile-first** for the seeker pilot. No new features were added; existing layout, touch targets, accessibility, dark mode, loading/error handling, i18n scaffolding, and performance were polished. All core seeker flows are usable at **390px** (e.g. iPhone 14) and **768px** (tablet).

## Deliverables

### 1. Breakpoint convention & global layout

- **Breakpoints:** mobile default (0–767px), `md:` 768–1023px, `lg:` 1024px+.
- **components/layout/Container.tsx:** Reusable container with `mx-auto w-full px-4 sm:px-6`, `max-w-6xl` (or `max-w-3xl` when `narrow`). Replaced ad-hoc `page-container` / `max-w-*` on jobs, job detail, and apply pages.
- **app/layout.tsx:** `<main className="flex-1 pb-16 lg:pb-0">` to reserve space for bottom nav on mobile; skip-to-content link (sr-only, focus visible); `min-h-screen bg-background text-foreground` on body; async layout for i18n (locale + messages from cookie).

### 2. Sticky bottom navigation (mobile only)

- **components/layout/BottomNav.tsx:** Five tabs — Home (`/dashboard`), Jobs (`/jobs`), Alerts (`/notifications`), Resume (`/resume`), Profile (`/profile/edit`). Visible only when authenticated and on mobile (`lg:hidden`). Fixed bottom, `bg-background/95 backdrop-blur-sm`, min 44×44px tap targets, active state with `stroke-[2.5]` on icon. Rendered after Footer in root layout.

### 3. Top navigation mobile

- **components/layout/Navbar.tsx:** Uses `Container`; desktop nav links `hidden md:flex`; NotificationCentre and ThemeToggle in header; avatar and hamburger with min 44×44px and `aria-label`. **NotificationCentre** dropdown: full-width on mobile (`left-0 right-0 rounded-t-xl`), `sm:w-[380px] sm:left-auto sm:right-0 sm:rounded-xl` on larger screens.

### 4. Job browse mobile

- **components/jobs/JobsListing.tsx:** On mobile, filters live in a **bottom Sheet** (ShadCN `Sheet` with `side="bottom"`, `h-[85vh]`). “Filters” trigger button with active filter count badge; “Show results” button at bottom of sheet closes it. Desktop keeps the sidebar (`hidden lg:block`).
- **components/jobs/JobCard.tsx:** Mobile-friendly layout: optional company logo `w-10 h-10 lg:w-14 lg:h-14`, title `line-clamp-2`, tags wrap; **SaveJobButton** has `min-w-[44px] min-h-[44px]`. Next.js `Image` used when company logo exists.
- **components/jobs/JobCardSkeleton.tsx:** Skeleton for job list loading state (used in JobsListing when `loading`).
- **app/jobs/page.tsx:** Wrapped in `Container`; `text-foreground` for heading.

### 5. Job detail mobile

- **app/jobs/[slug]/page.tsx:** Wrapped in `Container`. Layout: `lg:grid lg:grid-cols-3`; main content `lg:col-span-2`, sidebar `lg:sticky lg:top-20`. Apply/save block in **JobDetailSidebar** hidden on mobile (`hidden lg:flex`).
- **components/jobs/JobDetailStickyCTA.tsx:** Mobile-only sticky bar (`fixed bottom-16 left-0 right-0 lg:hidden`) with Optimise + Apply (or “Applied”), above the bottom nav. Rendered for seekers when job is active.
- **FitScoreCard** wrapped in **ErrorBoundary**.

### 6. Apply flow

- **app/jobs/[slug]/apply/page.tsx:** Uses `mx-auto max-w-6xl px-4 sm:px-6 py-8` (container-style layout).
- **components/ui/input.tsx:** `h-11 min-h-[44px]` for touch-friendly inputs.

### 7. Dashboard mobile

- **components/dashboard/seeker/ApplicationStatsCard.tsx:** Stage pills in `grid grid-cols-3` with `min-w-0` to avoid overflow.
- **components/dashboard/seeker/RecentApplicationsList.tsx:** Company logo/avatar hidden on very small screens (`hidden sm:block` / `hidden sm:flex`) so list is readable without images.
- **SeekerDashboardClient:** Grid remains single column on mobile; each card wrapped in **ErrorBoundary**.

### 8. Touch targets & accessibility

- **SaveJobButton:** `min-w-[44px] min-h-[44px]` and `aria-label` (Save job / Unsave job).
- **Sheet close button (components/ui/sheet.tsx):** `min-w-[44px] min-h-[44px]`, `aria-label="Close"`.
- **JobsListing** chip remove buttons: `min-w-[44px] min-h-[44px]` and `aria-label={`Remove filter ${c.label}`}`.
- Skip-to-content link and `id="main-content"` on `<main>` already present in layout.

### 9. Dark mode

- **components/providers/ThemeProvider.tsx:** `defaultTheme="dark"` so Ascend defaults to dark; theme persisted in `ascend-theme` storage key.
- **ThemeToggle:** Already had `aria-label="Toggle theme"`.

### 10. Skeleton loaders & error boundaries

- **components/ui/skeleton.tsx:** `Skeleton` component (`animate-pulse rounded-md bg-muted`).
- **JobCardSkeleton:** Used in JobsListing while jobs load. **SeekerDashboardSkeleton** already present in Phase 10.
- **components/ErrorBoundary.tsx:** Class component with fallback (“Something went wrong…”, “Try again” button). Wraps: each seeker dashboard card, FitScoreCard on job detail, NotificationCentre dropdown content, JobList (ul) in JobsListing.

### 11. i18n scaffolding (English + Hindi stub)

- **next-intl** installed. **messages/en.json** and **messages/hi.json** with keys for `nav`, `jobs`, `dashboard`, `common` (Phase 21 will add full Hindi translations; hi.json currently mirrors English).
- **app/layout.tsx:** Async layout; `getLocaleAndMessages()` reads `NEXT_LOCALE` cookie (default `en`), loads messages, and wraps children in **NextIntlClientProvider** with `locale` and `messages`. `<html lang={locale}>`.
- **components/layout/LanguageSwitcher.tsx:** EN / हि buttons; sets `NEXT_LOCALE` cookie and `router.refresh()`. Min 44×44px, `aria-label` and `aria-current`. Added to **Navbar** (desktop).

### 12. Performance

- **next.config.mjs:** `images.remotePatterns` for `**.amazonaws.com` and `res.cloudinary.com` so Next.js `Image` works for company logos.
- **JobCard:** Uses `next/image` for company logo when present.

## Key Files

| File | Purpose |
|------|---------|
| components/layout/Container.tsx | Responsive page container |
| components/layout/BottomNav.tsx | Mobile sticky bottom nav |
| components/layout/Navbar.tsx | Top nav + mobile behaviour |
| components/layout/ThemeToggle.tsx | Dark/light toggle |
| components/layout/LanguageSwitcher.tsx | EN / Hindi switcher |
| components/jobs/JobFilters.tsx | Unchanged; used in sidebar + sheet |
| components/jobs/JobsListing.tsx | Filter sheet (mobile), JobCardSkeleton, ErrorBoundary |
| components/jobs/JobCard.tsx | Mobile layout, optional logo, 44px save button |
| components/jobs/JobCardSkeleton.tsx | Job card skeleton |
| components/jobs/JobDetailStickyCTA.tsx | Mobile Apply + Optimise bar |
| components/jobs/JobDetailSidebar.tsx | Apply row hidden on mobile |
| components/notifications/NotificationCentre.tsx | Full-width dropdown on mobile, ErrorBoundary |
| components/ErrorBoundary.tsx | Generic error boundary |
| components/ui/skeleton.tsx | Skeleton component |
| components/ui/input.tsx | h-11 min-h-[44px] |
| components/ui/sheet.tsx | 44px close button, aria-label |
| components/providers/ThemeProvider.tsx | defaultTheme dark |
| messages/en.json | English i18n keys |
| messages/hi.json | Hindi stub (same keys) |
| app/layout.tsx | Skip link, pb-16, NextIntlClientProvider, locale/messages |
| app/jobs/page.tsx | Container |
| app/jobs/[slug]/page.tsx | Container, grid, sticky CTA, ErrorBoundary |
| app/jobs/[slug]/apply/page.tsx | Container-style wrapper |
| next.config.mjs | images.remotePatterns |

## Exit checklist

- [x] Bottom nav on mobile; hidden on desktop; all tabs link correctly
- [x] Top nav no horizontal overflow at 390px
- [x] Job filters open as bottom sheet on mobile
- [x] Job cards mobile-friendly; no overflow; Save 44px
- [x] Sticky apply CTA on job detail (above bottom nav)
- [x] Inputs min 44px height; apply page uses container layout
- [x] Dashboard single column on mobile; stage pills and recent list adjusted
- [x] Notification dropdown full-width on mobile
- [x] Touch targets ≥44×44px for icon buttons and key actions
- [x] Icon buttons have aria-label; skip-to-content in layout
- [x] Dark mode default; theme toggle works
- [x] JobCardSkeleton on jobs list; ErrorBoundary on dashboard cards, FitScoreCard, notifications, job list
- [x] next-intl installed; messages/en.json and hi.json; LanguageSwitcher in Navbar
- [x] Next.js Image for company logo; remotePatterns in next.config

## Not done in this phase (deferred)

- **Profile edit:** Accordion sections on mobile and edit modals as bottom sheets (Task 7) — left for a follow-up pass.
- **Resume builder / optimiser:** Progress indicator at top and gap analysis as cards on mobile (Task 9) — left for a follow-up pass.
- **Full [locale] URL routing:** Locale is cookie-based; Phase 21 can add `[locale]` segment and full Hindi translations.
- **All UI strings migrated to `t()`:** New/edited strings can use `useTranslations`; existing copy can be migrated incrementally.

## Dependencies

- **next-intl:** For locale and messages (cookie-based locale, no URL segment in this phase).
