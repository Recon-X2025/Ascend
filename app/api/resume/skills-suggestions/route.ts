import { NextRequest, NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/profile/api-helpers";
import { prisma } from "@/lib/prisma/client";
import {
  getTaxonomyForRole,
  getGroupForSkillName,
  getAllTaxonomySkillNames,
  type SkillGroup,
} from "@/lib/data/skills-taxonomy-api";

export async function GET(req: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const careerIntentId = searchParams.get("careerIntentId");
  if (!careerIntentId) {
    return NextResponse.json(
      { success: false, error: "careerIntentId is required" },
      { status: 400 }
    );
  }

  let missing: string[] = [];
  try {
    const missingParam = searchParams.get("missing");
    if (missingParam) {
      const parsed = JSON.parse(missingParam) as unknown;
      missing = Array.isArray(parsed) ? parsed.filter((s) => typeof s === "string") : [];
    }
  } catch {
    missing = [];
  }

  const intent = await prisma.careerIntent.findUnique({
    where: { id: careerIntentId },
    include: {
      profile: {
        include: {
          skills: {
            include: { skill: { select: { name: true } } },
            orderBy: { order: "asc" },
          },
        },
      },
    },
  });

  if (!intent || intent.userId !== userId) {
    return NextResponse.json({ success: false, error: "Career intent not found" }, { status: 404 });
  }

  const targetRole = intent.targetRole;
  const tax = getTaxonomyForRole(targetRole);
  const userSkills = intent.profile.skills.map((s) => ({
    id: s.id,
    skillId: s.skillId,
    name: s.skill?.name ?? "",
    proficiency: s.proficiency,
  }));

  const userSkillNamesSet = new Set(userSkills.map((s) => s.name.toLowerCase().trim()));

  let prioritised: { id: string; skillId: string; name: string; proficiency: string; group: SkillGroup; relevance: "high" | "low" }[] = [];
  const suggested: { name: string; group: SkillGroup }[] = [];
  const missingSet = new Set(missing.map((m) => m.toLowerCase().trim()));

  if (tax) {
    const orderOfGroups: SkillGroup[] = ["core", "technical", "tools", "soft"];
    const groupOrder = (g: SkillGroup) => orderOfGroups.indexOf(g);
    const taxSkillOrder = (name: string): number => {
      const n = name.toLowerCase().trim();
      for (let i = 0; i < tax.core.length; i++) if (tax.core[i].toLowerCase() === n) return i;
      for (let i = 0; i < tax.technical.length; i++) if (tax.technical[i].toLowerCase() === n) return 100 + i;
      for (let i = 0; i < tax.tools.length; i++) if (tax.tools[i].toLowerCase() === n) return 200 + i;
      for (let i = 0; i < tax.soft.length; i++) if (tax.soft[i].toLowerCase() === n) return 300 + i;
      return 999;
    };

    prioritised = userSkills
      .filter((s) => s.name)
      .map((us) => {
        const group = getGroupForSkillName(us.name, tax);
        const relevance: "high" | "low" = group === "core" || group === "technical" ? "high" : "low";
        return {
          id: us.id,
          skillId: us.skillId,
          name: us.name,
          proficiency: us.proficiency,
          group,
          relevance,
        };
      })
      .sort((a, b) => {
        const ga = groupOrder(a.group);
        const gb = groupOrder(b.group);
        if (ga !== gb) return ga - gb;
        return taxSkillOrder(a.name) - taxSkillOrder(b.name);
      });

    const allTaxNames = getAllTaxonomySkillNames(tax);
    for (const name of allTaxNames) {
      if (userSkillNamesSet.has(name.toLowerCase().trim())) continue;
      if (missingSet.has(name.toLowerCase().trim())) continue;
      suggested.push({ name, group: getGroupForSkillName(name, tax) });
    }
  } else {
    prioritised = userSkills.filter((s) => s.name).map((us) => ({
      id: us.id,
      skillId: us.skillId,
      name: us.name,
      proficiency: us.proficiency,
      group: "technical" as SkillGroup,
      relevance: "low" as const,
    }));
  }

  return NextResponse.json({
    success: true,
    data: {
      targetRole,
      prioritised,
      suggested,
      missing,
    },
  });
}
