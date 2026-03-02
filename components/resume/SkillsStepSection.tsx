"use client";

import { useEffect, useState, useCallback } from "react";
import { GripVertical, EyeOff } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useResumeBuildStore, type ResumeSkills, type SkillGroupKey } from "@/store/resume-build";
import { cn } from "@/lib/utils";
import type { PrioritisedUserSkill, SuggestedSkill } from "@/lib/data/skills-taxonomy-api";

const GROUP_LABELS: Record<SkillGroupKey, string> = {
  core: "Core Skills",
  technical: "Technical Skills",
  soft: "Soft Skills",
  tools: "Tools & Platforms",
};

const GROUP_ORDER: SkillGroupKey[] = ["core", "technical", "soft", "tools"];

function buildInitialSkills(prioritised: PrioritisedUserSkill[]): ResumeSkills {
  const out: ResumeSkills = { core: [], technical: [], soft: [], tools: [], hidden: [] };
  for (const s of prioritised) {
    out[s.group].push(s.name);
  }
  return out;
}

interface SkillsStepSectionProps {
  careerIntentId: string;
}

export function SkillsStepSection({ careerIntentId }: SkillsStepSectionProps) {
  const [targetRole, setTargetRole] = useState("");
  const contentSnapshot = useResumeBuildStore((s) => s.contentSnapshot);
  const setResumeSkills = useResumeBuildStore((s) => s.setResumeSkills);
  const updateResumeSkills = useResumeBuildStore((s) => s.updateResumeSkills);
  const addMissingSkillName = useResumeBuildStore((s) => s.addMissingSkillName);

  const [suggested, setSuggested] = useState<SuggestedSkill[]>([]);
  const [loading, setLoading] = useState(true);
  const [relevanceByName, setRelevanceByName] = useState<Record<string, "high" | "low">>({});

  const skills = contentSnapshot?.skills ?? { core: [], technical: [], soft: [], tools: [], hidden: [] };

  const fetchSuggestions = useCallback(async () => {
    setLoading(true);
    try {
      const currentMissing = useResumeBuildStore.getState().contentSnapshot?.missingSkillNames ?? [];
      const missingParam = currentMissing.length ? `&missing=${encodeURIComponent(JSON.stringify(currentMissing))}` : "";
      const res = await fetch(`/api/resume/skills-suggestions?careerIntentId=${encodeURIComponent(careerIntentId)}${missingParam}`);
      const json = await res.json();
      if (!json.success || !json.data) return;
      setTargetRole(json.data.targetRole ?? "");
      setSuggested(json.data.suggested ?? []);
      const rel: Record<string, "high" | "low"> = {};
      for (const s of json.data.prioritised ?? []) {
        rel[s.name] = s.relevance;
      }
      setRelevanceByName(rel);
      const existing = useResumeBuildStore.getState().contentSnapshot?.skills;
      if (!existing || (existing.core.length === 0 && existing.technical.length === 0 && existing.soft.length === 0 && existing.tools.length === 0)) {
        setResumeSkills(buildInitialSkills(json.data.prioritised ?? []));
      }
    } finally {
      setLoading(false);
    }
  }, [careerIntentId, setResumeSkills]);

  useEffect(() => {
    fetchSuggestions();
  }, [fetchSuggestions]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const activeStr = String(active.id);
    const overStr = String(over.id);
    const [activeGroup, activeName] = activeStr.includes("::") ? activeStr.split("::") : [null, null];
    const [overGroup, overName] = overStr.includes("::") ? overStr.split("::") : [null, null];
    if (!activeGroup || !overGroup || activeGroup !== overGroup || !activeName || !overName) return;
    const group = activeGroup as SkillGroupKey;
    const arr = skills[group];
    const oldIndex = arr.indexOf(activeName);
    const newIndex = arr.indexOf(overName);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(arr, oldIndex, newIndex);
    updateResumeSkills((prev) => ({ ...prev, [group]: reordered }));
  };

  const handleHide = (name: string, group: SkillGroupKey) => {
    updateResumeSkills((prev) => {
      const arr = prev[group].filter((n) => n !== name);
      return { ...prev, [group]: arr, hidden: [...prev.hidden, name] };
    });
  };

  const handleAddFromSuggested = (item: SuggestedSkill) => {
    updateResumeSkills((prev) => ({
      ...prev,
      [item.group]: [...prev[item.group], item.name],
    }));
    setRelevanceByName((r) => ({ ...r, [item.name]: "high" }));
    setSuggested((s) => s.filter((x) => x.name !== item.name));
  };

  const handleDismissSuggested = (name: string) => {
    addMissingSkillName(name);
    setSuggested((s) => s.filter((x) => x.name !== name));
  };

  if (loading) {
    return (
      <div className="ascend-card p-4">
        <h3 className="font-semibold text-text-primary">Skills for this role</h3>
        <p className="mt-2 text-sm text-muted-foreground">Loading suggestions…</p>
      </div>
    );
  }

  return (
    <div className="ascend-card p-4">
      <h3 className="font-semibold text-text-primary">Skills for this role</h3>
      <p className="mt-1 text-xs text-muted-foreground">
        Drag to reorder. Low-relevance skills can be hidden from the resume.
      </p>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="mt-4 space-y-4">
          {GROUP_ORDER.map((groupKey) => (
            <SkillGroupChips
              key={groupKey}
              groupKey={groupKey}
              names={skills[groupKey]}
              relevanceByName={relevanceByName}
              onHide={(name) => handleHide(name, groupKey)}
            />
          ))}
        </div>
      </DndContext>

      {suggested.length > 0 && (
        <div className="mt-6 border-t border-border pt-4">
          <h4 className="text-sm font-medium text-text-primary">
            {targetRole ? `Candidates for ${targetRole} often list: do you have these?` : "Suggested skills: do you have these?"}
          </h4>
          <ul className="mt-2 space-y-2">
            {suggested.map((item) => (
              <li key={item.name} className="flex flex-wrap items-center gap-2">
                <span className="rounded-md bg-muted/50 px-2 py-1 text-sm text-text-secondary">{item.name}</span>
                <button
                  type="button"
                  onClick={() => handleAddFromSuggested(item)}
                  className="text-xs font-medium text-accent-green hover:underline"
                >
                  Yes, I have this
                </button>
                <button
                  type="button"
                  onClick={() => handleDismissSuggested(item.name)}
                  className="text-xs text-muted-foreground hover:underline"
                >
                  No
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function SkillGroupChips({
  groupKey,
  names,
  relevanceByName,
  onHide,
}: {
  groupKey: SkillGroupKey;
  names: string[];
  relevanceByName: Record<string, "high" | "low">;
  onHide: (name: string) => void;
}) {
  const ids = names.map((n) => `${groupKey}::${n}`);
  return (
    <div>
      <h4 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {GROUP_LABELS[groupKey]}
      </h4>
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <div className="flex flex-wrap gap-2">
          {names.map((name) => (
            <SortableSkillChip
              key={`${groupKey}::${name}`}
              id={`${groupKey}::${name}`}
              name={name}
              isLowRelevance={relevanceByName[name] === "low"}
              onHide={() => onHide(name)}
            />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}

function SortableSkillChip({
  id,
  name,
  isLowRelevance,
  onHide,
}: {
  id: string;
  name: string;
  isLowRelevance: boolean;
  onHide: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-1 rounded-full border px-2 py-1 text-sm",
        isLowRelevance && "border-muted bg-muted/30 opacity-80",
        !isLowRelevance && "border-border bg-muted/20",
        isDragging && "z-10 shadow-md"
      )}
    >
      <button
        type="button"
        className="touch-none cursor-grab rounded p-0.5 hover:bg-muted active:cursor-grabbing"
        {...attributes}
        {...listeners}
        aria-label="Drag to reorder"
      >
        <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
      </button>
      <span className={cn("font-medium", isLowRelevance ? "text-muted-foreground" : "text-text-primary")}>
        {name}
      </span>
      {isLowRelevance && (
        <button
          type="button"
          onClick={onHide}
          className="ml-1 flex items-center gap-0.5 rounded p-0.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
          title="Hide from resume"
        >
          <EyeOff className="h-3 w-3" />
          <span className="sr-only">Hide from resume</span>
        </button>
      )}
    </div>
  );
}
