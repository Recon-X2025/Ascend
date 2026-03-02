# Ascend — Persona Architecture
## The Intelligence Layer Behind Every User Experience
### Strategy Document — Not a build prompt

---

## The Problem With Simple Personas

The current `user.persona` field captures one dimension: what type of user are you?
That is necessary but nowhere near sufficient.

Two users both select "Actively looking." One is a senior engineer in Bangalore with
8 years of experience, a ₹28L current salary, targeting FAANG, with a 3-month notice
period and no relocation constraints. The other is a fresher in Tier-2 India, 6 months
out of college, targeting their first job, willing to relocate anywhere, open to any role
adjacent to their degree.

Same persona. Completely different product experience needed.

The goal of this architecture is to build a **User Intelligence Model** — a living,
multi-dimensional understanding of every user that powers every surface of the platform:
matching, recommendations, mentor pairing, dashboard, salary benchmarking, resume
optimisation, job alerts, and eventual monetisation.

---

## Design Principles

**1. Never feel like a form.**
Every question is conversational, purposeful, and immediately useful. Users never feel
interrogated. They feel understood.

**2. Progressive, not upfront.**
We capture the most essential signal at signup. Everything else is gathered over time —
through behaviour, through explicit micro-interactions, through natural use of the product.

**3. Immediately actionable.**
Every piece of data we capture must change something the user sees within the same session.
If it doesn't change anything, we don't ask it.

**4. Owned by the user.**
Every field is visible and editable in their profile. Nothing is hidden or inferred without
the user being able to see and correct it.

**5. Powers the platform, not just the UI.**
This data feeds matching algorithms, mentor pairing, salary benchmarking, and eventually
recruiter search filters. It is not decoration — it is infrastructure.

---

## The User Intelligence Model

### Layer 1 — Identity (captured at signup, already exists)

```
user.persona          ACTIVE_SEEKER | PASSIVE_SEEKER | EARLY_CAREER | RECRUITER
user.personaSetAt     DateTime
user.role             JOB_SEEKER | RECRUITER | COMPANY_ADMIN | PLATFORM_ADMIN
```

### Layer 2 — Career Context (new model: UserCareerContext)

```prisma
model UserCareerContext {
  id                  String    @id @default(cuid())
  userId              String    @unique
  user                User      @relation(fields: [userId], references: [id])

  // Where they are now
  currentRole         String?
  currentCompany      String?
  currentSalary       Int?           // INR per annum
  yearsOfExperience   Int?
  experienceBand      ExperienceBand?

  // Where they want to go
  targetRole          String?
  targetIndustry      String[]
  targetCompanySize   CompanySize?
  targetCompanyType   String[]
  targetSalaryMin     Int?
  targetLocations     String[]
  openToRelocation    Boolean        @default(false)
  openToRemote        Boolean        @default(true)

  // Current situation
  employmentStatus    EmploymentStatus?
  noticePeriod        NoticePeriod?
  urgency             SearchUrgency?
  searchReason        SearchReason?

  // What kind of help they need
  primaryNeed         PrimaryNeed?
  secondaryNeeds      PrimaryNeed[]

  // Career stage signal
  isFirstJob          Boolean        @default(false)
  isSwitchingField    Boolean        @default(false)
  targetGeography     TargetGeography?

  // Completion
  completionScore     Int            @default(0)
  createdAt           DateTime       @default(now())
  updatedAt           DateTime       @updatedAt
}
```

### Layer 3 — Behavioural Signal (inferred, never asked)

```prisma
model UserBehaviourSignal {
  id                    String    @id @default(cuid())
  userId                String    @unique
  user                  User      @relation(fields: [userId], references: [id])

  jobViewCount          Int       @default(0)
  jobApplyCount         Int       @default(0)
  companiesViewed       String[]
  salaryPagesViewed     Int       @default(0)
  mentorProfilesViewed  Int       @default(0)
  resumeOptimiseCount   Int       @default(0)
  fitScoreChecksCount   Int       @default(0)

  inferredUrgency       SearchUrgency?
  inferredTopRoles      String[]
  inferredTopCompanies  String[]
  inferredSalaryBand    String?

  lastActiveAt          DateTime?
  sessionCount          Int       @default(0)
  avgSessionMinutes     Float?
  updatedAt             DateTime  @updatedAt
}
```

### Layer 4 — Mentorship Context (for EARLY_CAREER + career switchers)

```prisma
model UserMentorshipContext {
  id                    String    @id @default(cuid())
  userId                String    @unique
  user                  User      @relation(fields: [userId], references: [id])

  mentorshipGoal        MentorshipGoal?
  targetTransition      String?
  targetTimeline        String?
  previousMentorship    Boolean      @default(false)
  preferredMentorStyle  MentorStyle?
  currentSkills         String[]
  skillsToLearn         String[]
  currentCity           String?
  targetCity            String?
  crossBorderAspiration Boolean      @default(false)

  createdAt             DateTime     @default(now())
  updatedAt             DateTime     @updatedAt
}
```

### Layer 5 — Recruiter Context (for RECRUITER persona only)

```prisma
model UserRecruiterContext {
  id                    String    @id @default(cuid())
  userId                String    @unique
  user                  User      @relation(fields: [userId], references: [id])

  hiringFor             String[]
  hiringVolume          HiringVolume?
  typicalBudget         SalaryBand?
  industryFocus         String[]
  companySizeContext    CompanySize?
  painPoints            RecruiterPainPoint[]

  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
}
```

---

## The Enums

```prisma
enum ExperienceBand {
  FRESHER      // 0 years
  EARLY        // 1-3 years
  MID          // 3-7 years
  SENIOR       // 7-12 years
  LEADERSHIP   // 12+ years
}

enum EmploymentStatus {
  EMPLOYED_ACTIVE
  EMPLOYED_LOOKING
  NOTICE_PERIOD
  UNEMPLOYED
  FREELANCE
  STUDENT
  SABBATICAL
}

enum NoticePeriod {
  IMMEDIATE
  TWO_WEEKS
  ONE_MONTH
  TWO_MONTHS
  THREE_MONTHS
  NEGOTIABLE
}

enum SearchUrgency {
  BROWSING      // Just exploring, no pressure
  WARMING_UP    // Starting to look seriously
  ACTIVE        // Actively applying
  URGENT        // Need to move within 4-6 weeks
}

enum SearchReason {
  GROWTH
  COMPENSATION
  CULTURE
  LAYOFF
  RELOCATION
  CAREER_SWITCH
  FIRST_JOB
  RETURNING
  ENTREPRENEURSHIP
  CURIOSITY
}

enum PrimaryNeed {
  FIND_JOBS
  BENCHMARK_SALARY
  IMPROVE_RESUME
  FIND_MENTOR
  BUILD_NETWORK
  UNDERSTAND_COMPANIES
  PREPARE_INTERVIEWS
}

enum CompanySize {
  STARTUP      // <50
  SCALEUP      // 50-500
  MIDSIZE      // 500-5000
  LARGE        // 5000-50000
  ENTERPRISE   // 50000+
  ANY
}

enum TargetGeography {
  INDIA_ONLY
  INDIA_TO_GLOBAL
  GLOBAL_ONLY
  FLEXIBLE
}

enum MentorshipGoal {
  CAREER_TRANSITION
  LEVEL_UP
  CROSS_BORDER
  FIRST_JOB
  STARTUP_TO_LARGE
  LARGE_TO_STARTUP
  SALARY_NEGOTIATION
  INTERVIEW_PREP
}

enum MentorStyle {
  STRUCTURED
  ASYNC
  AD_HOC
}

enum HiringVolume {
  OCCASIONAL   // 1-5/month
  REGULAR      // 6-20/month
  HIGH_VOLUME  // 20+/month
}

enum RecruiterPainPoint {
  CANDIDATE_QUALITY
  TIME_TO_HIRE
  PIPELINE_VISIBILITY
  JD_WRITING
  SOURCING
  OFFER_ACCEPTANCE
}

enum SalaryBand {
  BAND_0_5
  BAND_5_10
  BAND_10_20
  BAND_20_35
  BAND_35_60
  BAND_60_PLUS
}
```

---

## The Onboarding Flow — What Gets Asked When

### Step 1 — Persona selection (DS-4, already built)
One question. Four cards. 10 seconds.

### Step 2 — Context questions (DS-4B, to be built)
3 questions max, immediately after persona. Conversational cards, not a form.
Each question set is persona-specific.

**ACTIVE_SEEKER:**
```
Q1: "What's your current situation?"
    Cards: Currently employed | Serving notice | Between jobs | Freelancing
    → Sets employmentStatus + urgency

Q2: "What's driving the move?"
    Cards: Growth | Better pay | Culture | Was laid off | Relocating | Something else
    → Sets searchReason

Q3: "What kind of role are you targeting?"
    Free text with autocomplete from JD taxonomy
    → Sets targetRole, seeds CareerIntent
```

**PASSIVE_SEEKER:**
```
Q1: "What would make you seriously consider a move?"
    Cards: Better comp | Bigger scope | Dream company | Right team | Not sure yet
    → Sets primaryNeed + searchReason

Q2: "Where are you in your career?"
    Visual band selector: 0-2 yrs | 3-7 yrs | 7-12 yrs | 12+ yrs
    → Sets experienceBand

Q3: "Any locations or company types on your radar?"
    Multi-select chips: cities + company types
    → Sets targetLocations + targetCompanyType
```

**EARLY_CAREER:**
```
Q1: "Where are you right now?"
    Cards: Final year student | Recent grad | 0-2 years in | Switching fields
    → Sets employmentStatus + isFirstJob + isSwitchingField

Q2: "What are you aiming for?"
    Free text: "I want to work in ___"
    → Sets targetRole, seeds mentor matching

Q3: "What kind of help matters most right now?"
    Cards: Find a mentor | Improve my resume | Discover companies | Get my first job
    → Sets primaryNeed, personalises dashboard immediately
```

**RECRUITER:**
```
Q1: "What roles do you typically hire for?"
    Multi-select from taxonomy
    → Sets hiringFor

Q2: "How many hires in the next 3 months?"
    Cards: 1-5 | 6-20 | 20+ | Not sure yet
    → Sets hiringVolume, determines plan recommendation

Q3: "What's your biggest hiring challenge?"
    Cards: Candidate quality | Time-to-hire | Pipeline visibility | JD writing | Sourcing
    → Sets painPoints, personalises recruiter dashboard
```

### Step 3 — Progressive profiling (over first 7 days)
One question, at the right moment, inline and dismissible. Never a modal.

```
Day 1 — after first job view:
"What's your notice period?"
Small card above job listings. Feeds fit score immediately.

Day 2 — after first salary page view:
"What are you currently earning?"
Inline on salary page. Powers gap analysis immediately.

Day 3 — after first career graph interaction:
"What's your target company?"
Shown in network section. Seeds career path discovery.

Day 7 — if resume not uploaded:
"Upload your resume to see your market fit score"
Core activation nudge.
```

---

## How This Data Powers Each Feature

| Feature | Fields Used |
|---------|-------------|
| Job feed | targetRole, targetLocations, experienceBand, employmentStatus |
| Fit Score | currentRole, yearsOfExperience, targetRole, skills |
| Salary Intelligence | currentSalary, experienceBand, targetRole, targetLocations |
| Resume Optimiser | currentRole, targetRole, inferredTopRoles |
| Mentor matching | targetTransition, mentorshipGoal, targetGeography, crossBorderAspiration |
| Dashboard cards | persona, urgency, primaryNeed, completionScore |
| Job alerts | targetRole, targetLocations, targetSalaryMin, noticePeriod |
| Career graph | targetCompany, targetTransition, currentCompany |
| Recruiter search | All seeker fields become search/filter dimensions |
| Cohort analytics | persona, searchReason, urgency, experienceBand |

---

## The Completion Score

`completionScore` is a weighted sum of filled fields. Shown as a progress bar on dashboard.

```
Core fields — 15 points each:
  currentRole, targetRole, yearsOfExperience, targetLocations, employmentStatus
  Max: 75 points

Supporting fields — 5 points each:
  currentSalary, noticePeriod, searchReason, targetSalaryMin, openToRemote
  Max: 25 points

Total: 100 points
```

Threshold gates:
- 0–30:  "Complete your profile to unlock your market fit score"
- 31–60: Fit score enabled, job alerts enabled
- 61–85: Mentor matching enabled, salary benchmarking fully unlocked
- 86–100: Full access + "You're in the top X% of complete profiles on Ascend"

---

## User Stories — Canonical, By Persona

### ACTIVE_SEEKER
```
As an active seeker, I want to see only roles I'm a strong fit for
so that I don't waste time on applications where I'll be screened out.

As an active seeker, I want my resume automatically aligned to each JD
so that I clear ATS screening without manual effort every time.

As an active seeker, I want to know my salary market position before every negotiation
so that I never accept below my market rate out of uncertainty.

As an active seeker, I want to track all my applications in one place
so that I don't lose track across 10 concurrent processes.
```

### PASSIVE_SEEKER
```
As a passive seeker, I want to understand my market value without actively searching
so that I know when a role is genuinely worth pursuing.

As a passive seeker, I want to be notified only when a role matches my specific criteria
so that I don't have to check job boards manually.

As a passive seeker, I want to see which companies are growing in my space
so that I can position myself for the right opportunity at the right time.

As a passive seeker, I want to see career paths others have taken from my current role
so that I can plan my trajectory intentionally, not reactively.
```

### EARLY_CAREER
```
As an early career professional, I want to find a mentor who has made my exact transition
so that I can learn from real experience, not generic advice.

As an early career professional, I want to know which skills are most in-demand
so that I invest my learning time in the right areas.

As an early career professional, I want my profile to show what I'm capable of
so that I'm not penalised purely for having less experience.

As an early career professional, I want to understand the differences between companies
so that my first or second job sets me up for the trajectory I want.
```

### RECRUITER
```
As a recruiter, I want to see candidates who are likely to accept and join
so that I don't waste sourcing effort on people who won't convert.

As a recruiter, I want to write better JDs that attract the right candidates
so that my pipeline quality improves from the top of the funnel.

As a recruiter, I want to understand my time-to-hire vs industry benchmark
so that I can identify and fix bottlenecks in my hiring process.

As a recruiter, I want candidates to come pre-matched to my open roles
so that I spend time evaluating, not sourcing.
```

---

## Organisation / Admin Console Gap

**What exists today:**
- Company Admin Dashboard (Phase 3B) — profile, reviews, benefits, team members
- Recruiter Dashboard (Phase 10) — individual recruiter's jobs + pipeline
- Platform Admin (Phase 13) — Coheron internal use only

**What is missing (Phase 18):**
- Org-level seat management (who has recruiter access under this company)
- Team hiring analytics (aggregate pipeline across all recruiters at one company)
- Role-based permissions within an organisation (hiring manager / sourcer / admin)
- Org-level job posting limits and billing
- SSO / SAML for enterprise orgs

The `UserRecruiterContext` model above feeds directly into this when Phase 18 is built.

---

## Build Sequence

```
DS-4B  Persona Deepening             ← NEXT — 3-question context flow
                                        Creates UserCareerContext model
                                        Wires into fit score + dashboard immediately

Phase 9B  Mentorship Layer           Creates UserMentorshipContext
                                     Mentor matching uses targetTransition + goals

Phase 10B Candidate Intelligence     Creates UserBehaviourSignal
                                     Inferred signals from usage

Phase 16  Analytics                  Persona cohort analysis
                                     Who converts, retains, churns by persona

Phase 18  B2B / Enterprise           UserRecruiterContext feeds org console
                                     Team seat management, org analytics
```

---

## Summary

The current single `user.persona` field is a starting point, not a destination.
This architecture turns it into a living intelligence layer.

The user never fills out a form. They answer three questions after signup,
and the product gets smarter with every interaction.

Every field powers something real. Nothing is collected for its own sake.

---
*Ascend Persona Architecture v1.0 — 2026-02-28*
*Next immediate build: DS-4B — Persona Deepening*
