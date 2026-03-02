import { create } from "zustand";

export interface ExperienceContent {
  company?: string;
  designation?: string;
  rewrittenBullets: string[];
  actionVerbs: string[];
  transferableSkillSurfaced?: boolean;
  originalBullets?: string[];
}

export type SkillGroupKey = "core" | "technical" | "soft" | "tools";

export interface ResumeSkills {
  core: string[];
  technical: string[];
  soft: string[];
  tools: string[];
  hidden: string[];
}

/** Keyword analysis result from ATS (2A.7). */
export interface KeywordAnalysisSnapshot {
  present: string[];
  missing: string[];
  coverageScore: number;
  missingWithSuggestions: { keyword: string; suggestion: string }[];
  totalKeywords: number;
}

export interface ContentSnapshot {
  status: "DRAFT";
  experiences: Record<string, ExperienceContent>;
  /** AI-generated professional summary options (3). */
  summaries?: string[];
  /** Index of the selected summary (default 0). */
  selectedSummaryIndex?: number;
  /** Step 3 skills: four groups + hidden (order within each array is display order). */
  skills?: ResumeSkills;
  /** Skills user confirmed they don't have (for gap awareness). */
  missingSkillNames?: string[];
  /** Keyword analysis (present/missing, coverage) from ats-score. */
  keywordAnalysis?: KeywordAnalysisSnapshot;
}

export interface ResumeBuildState {
  /** Career intent used for this build (set when moving from Step 1 to Step 2). */
  careerIntentId: string | null;
  /** Selected profile item IDs for inclusion in the resume (Step 2). */
  selectedExperienceIds: string[];
  selectedEducationIds: string[];
  selectedSkillIds: string[];
  selectedCertificationIds: string[];
  selectedProjectIds: string[];
  selectedAwardIds: string[];
  /** Experience IDs to condense to max 2 bullets (from profile-map). */
  condenseExperienceIds: string[];
  /** Step 3: BullMQ job id for content generation. */
  generateJobId: string | null;
  /** Step 3: AI-generated content (from job result or loaded). */
  contentSnapshot: ContentSnapshot | null;
  /** Step 3: User-edited bullets per experience (overrides contentSnapshot for display). */
  editedBulletsByExperienceId: Record<string, string[]>;
  /** Step 3: Regeneration count per experience (max 3 per session). */
  regenerationCountByExperienceId: Record<string, number>;
  /** Step 3: BullMQ job id for summary generation. */
  summaryJobId: string | null;
  /** Step 3: User-edited summary text (overrides selected summary for display when set). */
  editedSummary: string | null;
  /** Step 4: Latest ATS score (0–100) from POST /api/resume/ats-score. */
  atsScore: number | null;
  /** Step 4: Latest ATS compliance issues (for UI). */
  atsIssues: { rule: string; severity: "error" | "warning"; suggestion: string }[] | null;
  /** Step 4: Per-category ATS scores (format, keyword, completeness, impact). */
  atsCategoryScores: { format: number; keyword: number; completeness: number; impact: number } | null;
  /** Step 4: Keyword analysis (present/missing, coverage). */
  keywordAnalysis: KeywordAnalysisSnapshot | null;
  /** Step 4 (Template): selected template id. */
  templateId: string | null;

  setCareerIntentId: (id: string | null) => void;
  setCondenseExperienceIds: (ids: string[]) => void;
  setSelectedExperiences: (ids: string[]) => void;
  setSelectedEducations: (ids: string[]) => void;
  setSelectedSkills: (ids: string[]) => void;
  setSelectedCertifications: (ids: string[]) => void;
  setSelectedProjects: (ids: string[]) => void;
  setSelectedAwards: (ids: string[]) => void;
  toggleExperience: (id: string) => void;
  toggleEducation: (id: string) => void;
  toggleSkill: (id: string) => void;
  toggleCertification: (id: string) => void;
  toggleProject: (id: string) => void;
  toggleAward: (id: string) => void;
  /** Initialize selections from API suggested flags (e.g. when loading profile-map). */
  setSelectionsFromSuggested: (payload: {
    experiences: { id: string; suggested: boolean }[];
    educations: { id: string; suggested: boolean }[];
    skills: { id: string; suggested: boolean }[];
    certifications: { id: string; suggested: boolean }[];
    projects: { id: string; suggested: boolean }[];
    awards: { id: string; suggested: boolean }[];
  }) => void;
  setGenerateJobId: (id: string | null) => void;
  setContentSnapshot: (snapshot: ContentSnapshot | null) => void;
  setEditedBullets: (experienceId: string, bullets: string[]) => void;
  incrementRegenerationCount: (experienceId: string) => number;
  setSummaryJobId: (id: string | null) => void;
  setEditedSummary: (text: string | null) => void;
  /** Merge summary job result into contentSnapshot (summaries + selectedSummaryIndex: 0). */
  mergeSummaryResult: (summaries: string[]) => void;
  setSelectedSummaryIndex: (index: number) => void;
  /** Set or replace resume skills (four groups + hidden). */
  setResumeSkills: (skills: ResumeSkills) => void;
  /** Update resume skills with a function (e.g. reorder, add, remove, hide). */
  updateResumeSkills: (updater: (prev: ResumeSkills) => ResumeSkills) => void;
  /** Add skill name to missing (user said they don't have it). */
  addMissingSkillName: (name: string) => void;
  /** Set missing skill names (e.g. from API or initial load). */
  setMissingSkillNames: (names: string[]) => void;
  setTemplateId: (id: string | null) => void;
  /** Set latest ATS result (score, issues, categoryScores, keywordAnalysis). Merges keywordAnalysis into contentSnapshot. */
  setATSResult: (payload: {
    score: number | null;
    issues: { rule: string; severity: "error" | "warning"; suggestion: string }[] | null;
    categoryScores?: { format: number; keyword: number; completeness: number; impact: number } | null;
    keywordAnalysis?: KeywordAnalysisSnapshot | null;
  }) => void;
  reset: () => void;
}

const defaultSelected = () => [];

export const useResumeBuildStore = create<ResumeBuildState>((set, get) => ({
  careerIntentId: null,
  selectedExperienceIds: [],
  selectedEducationIds: [],
  selectedSkillIds: [],
  selectedCertificationIds: [],
  selectedProjectIds: [],
  selectedAwardIds: [],
  condenseExperienceIds: [],
  generateJobId: null,
  contentSnapshot: null,
  editedBulletsByExperienceId: {},
  regenerationCountByExperienceId: {},
  summaryJobId: null,
  editedSummary: null,
  atsScore: null,
  atsIssues: null,
  atsCategoryScores: null,
  keywordAnalysis: null,
  templateId: null,

  setCareerIntentId: (id) => set({ careerIntentId: id }),
  setTemplateId: (id) => set({ templateId: id }),
  setCondenseExperienceIds: (ids) => set({ condenseExperienceIds: ids }),
  setGenerateJobId: (id) => set({ generateJobId: id }),
  setContentSnapshot: (snapshot) => set({ contentSnapshot: snapshot }),
  setEditedBullets: (experienceId, bullets) =>
    set((s) => ({
      editedBulletsByExperienceId: { ...s.editedBulletsByExperienceId, [experienceId]: bullets },
    })),
  incrementRegenerationCount: (experienceId) => {
    const prev = get().regenerationCountByExperienceId[experienceId] ?? 0;
    const next = prev + 1;
    set((s) => ({
      regenerationCountByExperienceId: { ...s.regenerationCountByExperienceId, [experienceId]: next },
    }));
    return next;
  },
  setSummaryJobId: (id) => set({ summaryJobId: id }),
  setEditedSummary: (text) => set({ editedSummary: text }),
  mergeSummaryResult: (summaries) =>
    set((s) => ({
      contentSnapshot: s.contentSnapshot
        ? { ...s.contentSnapshot, summaries, selectedSummaryIndex: 0 }
        : null,
    })),
  setSelectedSummaryIndex: (index) =>
    set((s) => ({
      contentSnapshot: s.contentSnapshot
        ? { ...s.contentSnapshot, selectedSummaryIndex: index }
        : null,
    })),
  setResumeSkills: (skills) =>
    set((s) => ({
      contentSnapshot: s.contentSnapshot
        ? { ...s.contentSnapshot, skills }
        : null,
    })),
  updateResumeSkills: (updater) =>
    set((s) => {
      const prev = s.contentSnapshot?.skills ?? { core: [], technical: [], soft: [], tools: [], hidden: [] };
      const next = updater(prev);
      return {
        contentSnapshot: s.contentSnapshot ? { ...s.contentSnapshot, skills: next } : null,
      };
    }),
  addMissingSkillName: (name) =>
    set((s) => {
      const missing = s.contentSnapshot?.missingSkillNames ?? [];
      if (missing.includes(name)) return {};
      return {
        contentSnapshot: s.contentSnapshot
          ? { ...s.contentSnapshot, missingSkillNames: [...missing, name] }
          : null,
      };
    }),
  setMissingSkillNames: (names) =>
    set((s) => ({
      contentSnapshot: s.contentSnapshot
        ? { ...s.contentSnapshot, missingSkillNames: names }
        : null,
    })),
  setATSResult: (payload) =>
    set((s) => ({
      atsScore: payload.score,
      atsIssues: payload.issues,
      atsCategoryScores: payload.categoryScores ?? null,
      keywordAnalysis: payload.keywordAnalysis ?? null,
      contentSnapshot:
        payload.keywordAnalysis && s.contentSnapshot
          ? { ...s.contentSnapshot, keywordAnalysis: payload.keywordAnalysis }
          : s.contentSnapshot,
    })),

  setSelectedExperiences: (ids) => set({ selectedExperienceIds: ids }),
  setSelectedEducations: (ids) => set({ selectedEducationIds: ids }),
  setSelectedSkills: (ids) => set({ selectedSkillIds: ids }),
  setSelectedCertifications: (ids) => set({ selectedCertificationIds: ids }),
  setSelectedProjects: (ids) => set({ selectedProjectIds: ids }),
  setSelectedAwards: (ids) => set({ selectedAwardIds: ids }),

  toggleExperience: (id) =>
    set((s) => ({
      selectedExperienceIds: s.selectedExperienceIds.includes(id)
        ? s.selectedExperienceIds.filter((x) => x !== id)
        : [...s.selectedExperienceIds, id],
    })),
  toggleEducation: (id) =>
    set((s) => ({
      selectedEducationIds: s.selectedEducationIds.includes(id)
        ? s.selectedEducationIds.filter((x) => x !== id)
        : [...s.selectedEducationIds, id],
    })),
  toggleSkill: (id) =>
    set((s) => ({
      selectedSkillIds: s.selectedSkillIds.includes(id)
        ? s.selectedSkillIds.filter((x) => x !== id)
        : [...s.selectedSkillIds, id],
    })),
  toggleCertification: (id) =>
    set((s) => ({
      selectedCertificationIds: s.selectedCertificationIds.includes(id)
        ? s.selectedCertificationIds.filter((x) => x !== id)
        : [...s.selectedCertificationIds, id],
    })),
  toggleProject: (id) =>
    set((s) => ({
      selectedProjectIds: s.selectedProjectIds.includes(id)
        ? s.selectedProjectIds.filter((x) => x !== id)
        : [...s.selectedProjectIds, id],
    })),
  toggleAward: (id) =>
    set((s) => ({
      selectedAwardIds: s.selectedAwardIds.includes(id)
        ? s.selectedAwardIds.filter((x) => x !== id)
        : [...s.selectedAwardIds, id],
    })),

  setSelectionsFromSuggested: (payload) =>
    set({
      selectedExperienceIds: payload.experiences.filter((e) => e.suggested).map((e) => e.id),
      selectedEducationIds: payload.educations.filter((e) => e.suggested).map((e) => e.id),
      selectedSkillIds: payload.skills.filter((s) => s.suggested).map((s) => s.id),
      selectedCertificationIds: payload.certifications.filter((c) => c.suggested).map((c) => c.id),
      selectedProjectIds: payload.projects.filter((p) => p.suggested).map((p) => p.id),
      selectedAwardIds: payload.awards.filter((a) => a.suggested).map((a) => a.id),
    }),

  reset: () =>
    set({
      careerIntentId: null,
      selectedExperienceIds: defaultSelected(),
      selectedEducationIds: defaultSelected(),
      selectedSkillIds: defaultSelected(),
      selectedCertificationIds: defaultSelected(),
      selectedProjectIds: defaultSelected(),
      selectedAwardIds: defaultSelected(),
      condenseExperienceIds: [],
      generateJobId: null,
      contentSnapshot: null,
      editedBulletsByExperienceId: {},
      regenerationCountByExperienceId: {},
      summaryJobId: null,
      editedSummary: null,
      atsScore: null,
      atsIssues: null,
      atsCategoryScores: null,
      keywordAnalysis: null,
      templateId: null,
    }),
}));
