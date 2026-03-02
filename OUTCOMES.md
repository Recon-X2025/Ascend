# Ascend — Pilot Outcome Data

This document tracks pilot metrics for the acquisition pitch. Updated throughout the pilot period.

## Target Metrics

| Metric | Target | Current |
|--------|--------|---------|
| Total pilot users | 1,000+ | — |
| AI feature adoption (% users) | > 60% | — |
| Resumes built via AI | — | — |
| Average ATS score improvement | > 20pts | — |
| Fit scores calculated | > 3 per user | — |
| Optimiser accept rate | > 70% | — |
| Applications submitted | > 5 per user | — |
| Day 7 retention | > 60% | — |
| Day 30 retention | > 40% | — |
| NPS score | > 50 | — |

## Phase 6 — Application System Events

| Event | Trigger | Data |
|-------|---------|------|
| `APPLICATION_SUBMITTED` | Seeker submits application | jobPostId, resumeVersionId, fitScoreSnapshot, hasScreeningResponses, hasCoverLetter |
| `APPLICATION_WITHDRAWN` | Seeker withdraws | jobPostId, applicationId, daysAfterSubmit |
| `APPLICATION_STATUS_CHANGED` | Recruiter changes status | applicationId, oldStatus, newStatus, jobPostId |
| `APPLY_FLOW_STARTED` | Seeker visits /apply page | jobPostId, fitScore (if available) |
| `APPLY_FLOW_ABANDONED` | Seeker leaves apply flow without submitting | jobPostId, lastStep |

## Key Finding (to be populated post-pilot)

[To be completed with pilot outcome data]
