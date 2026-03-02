import { z } from "zod";

export const targetLevelValues = ["IC", "TEAM_LEAD", "MANAGER", "DIRECTOR", "VP", "C_SUITE"] as const;

export const careerIntentSchema = z
  .object({
    targetRole: z.string().min(1, "Target role is required").max(120),
    targetIndustry: z.string().min(1, "Industry is required").max(120),
    targetLevel: z.enum(targetLevelValues),
    careerGoal: z.string().min(1, "Career goal is required").max(300),
    switchingIndustry: z.boolean(),
    fromIndustry: z.string().max(120).optional().nullable(),
    toIndustry: z.string().max(120).optional().nullable(),
  })
  .refine(
    (data) => {
      if (!data.switchingIndustry) return true;
      return Boolean(data.fromIndustry?.trim() && data.toIndustry?.trim());
    },
    { message: "From industry and To industry are required when switching industries", path: ["fromIndustry"] }
  );

export type CareerIntentInput = z.infer<typeof careerIntentSchema>;
