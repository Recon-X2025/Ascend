# Ascend AI Prompt Registry

All Claude prompts are centralised here. Every prompt has a version string, feature label, and description. No inline prompt strings exist anywhere else in the codebase.

## Prompt Versions

| Version | Feature | Status | Phase |
|---------|---------|--------|-------|
| resume-builder-v1 | RESUME_BUILDER | Pending | 2A |
| fit-score-v1 | FIT_SCORER | Pending | 5A |
| jd-optimiser-v1 | JD_OPTIMISER | Pending | 6A |
| interview-prep-v1 | INTERVIEW_PREP | Pending | 11 |
| career-intelligence-v1 | CAREER_INTELLIGENCE | Pending | 11 |

## Adding a New Prompt

1. Create or update the relevant file in lib/ai/prompts/
2. Call registerPrompt() with version, feature, description, build
3. Update this README with the new version
4. Log the version string in every AIInteraction created

## Versioning Convention

Format: `{feature-slug}-v{number}`  
Example: resume-builder-v1, resume-builder-v2

Increment version when prompt logic changes significantly. Keep old versions registered — never delete them.

## Performance Tracking

Each prompt version's performance is tracked via AIInteraction.rating. View aggregated ratings in the admin dashboard (Phase 16).
