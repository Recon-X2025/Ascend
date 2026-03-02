# Ascend AI Prompt Documentation

This document tracks all Claude AI prompts used in Ascend, their versions, performance metrics, and evolution over time.

This is a living document — updated as prompts are implemented and improved.

## Prompt Inventory

| Prompt Version | Feature | Status | Avg Rating | Notes |
|----------------|---------|--------|------------|-------|
| resume-builder-v1 | Resume Builder | Pending Phase 2A | — | — |
| fit-score-v1 | Fit Scorer | Pending Phase 5A | — | — |
| jd-optimiser-v1 | JD Optimiser | Pending Phase 6A | — | — |
| interview-prep-v1 | Interview Prep | Pending Phase 11 | — | — |
| career-intelligence-v1 | Career Intelligence | Pending Phase 11 | — | — |

## Prompt Design Principles

1. **Never fabricate** — prompts must instruct Claude to only work with information the user has provided.
2. **Structured output** — all prompts return parseable JSON.
3. **Fallback handling** — all prompts handle edge cases gracefully.
4. **Version on change** — any significant prompt change gets a new version string.

## Performance Metrics (updated post-pilot)

To be populated during pilot phase with:

- Average user rating per prompt version
- Outcome correlation (did users who got high scores get interviews?)
- A/B test results where applicable
