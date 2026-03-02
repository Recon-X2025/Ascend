"use client";

import { useState, useEffect, useMemo } from "react";
import { Plus, Trash2, GripVertical } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { skillProficiencyValues } from "@/lib/validations/profile";
import toast from "react-hot-toast";

interface UserSkill {
  id: string;
  proficiency: string;
  skill: { name: string };
}

export function SkillsSection({
  profile,
  onUpdate,
}: {
  profile: { skills?: UserSkill[] };
  onUpdate: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [skillName, setSkillName] = useState("");
  const [proficiency, setProficiency] = useState("INTERMEDIATE");
  const [suggestions, setSuggestions] = useState<{ id: string; name: string }[]>([]);
  const [saving, setSaving] = useState(false);

  const skillsFromProfile = useMemo(() => (profile.skills ?? []) as UserSkill[], [profile.skills]);
  const [skills, setSkills] = useState<UserSkill[]>(skillsFromProfile);
  useEffect(() => {
    setSkills(skillsFromProfile);
  }, [skillsFromProfile]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = skills.findIndex((s) => s.id === active.id);
    const newIndex = skills.findIndex((s) => s.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(skills, oldIndex, newIndex);
    setSkills(reordered);
    await fetch("/api/profile/me/skills/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: reordered.map((s, index) => ({ id: s.id, order: index })) }),
    });
  };

  const searchSkills = async (q: string) => {
    if (q.length < 2) { setSuggestions([]); return; }
    const res = await fetch(`/api/skills/search?q=${encodeURIComponent(q)}`);
    const json = await res.json();
    if (json.success && json.data) setSuggestions(json.data);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!skillName.trim()) return;
    setSaving(true);
    const res = await fetch("/api/profile/me/skills", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ skillName: skillName.trim(), proficiency }),
    });
    setSaving(false);
    if (!res.ok) { toast.error("Failed to add"); return; }
    toast.success("Skill added");
    setOpen(false);
    setSkillName("");
    setProficiency("INTERMEDIATE");
    setSuggestions([]);
    onUpdate();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this skill?")) return;
    const res = await fetch(`/api/profile/me/skills/${id}`, { method: "DELETE" });
    if (!res.ok) { toast.error("Failed"); return; }
    toast.success("Removed");
    onUpdate();
  };

  function SortableSkillItem({ skill, onDelete }: { skill: UserSkill; onDelete: (id: string) => void }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: skill.id });
    const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };
    return (
      <li ref={setNodeRef} style={style} className="flex items-center gap-2 p-3 rounded-lg border border-border">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-text-secondary hover:text-text-primary focus:outline-none shrink-0"
          aria-label="Drag to reorder"
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <span className="font-medium text-text-primary">{skill.skill.name}</span>
        <span className="text-text-secondary text-sm">· {skill.proficiency}</span>
        <Button variant="ghost" size="icon" className="h-8 w-8 ml-auto" onClick={() => onDelete(skill.id)}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </li>
    );
  }

  return (
    <section className="ascend-card p-6">
      <div className="flex items-center justify-between">
        <h2 className="section-title">Skills</h2>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="sm" className="btn-ghost">
              <Plus className="h-4 w-4 mr-1" /> Add
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader><SheetTitle>Add skill</SheetTitle></SheetHeader>
            <form onSubmit={handleAdd} className="mt-6 space-y-4">
              <div>
                <label className="ascend-label">Skill name</label>
                <Input
                  className="ascend-input"
                  value={skillName}
                  onChange={(e) => { setSkillName(e.target.value); searchSkills(e.target.value); }}
                  placeholder="Type to search or add new"
                />
                {suggestions.length > 0 && (
                  <ul className="mt-1 border border-border rounded-lg divide-y divide-border max-h-32 overflow-auto">
                    {suggestions.slice(0, 5).map((s) => (
                      <li
                        key={s.id}
                        className="px-3 py-2 text-sm cursor-pointer hover:bg-muted"
                        onClick={() => { setSkillName(s.name); setSuggestions([]); }}
                      >
                        {s.name}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <label className="ascend-label">Proficiency</label>
                <Select value={proficiency} onValueChange={setProficiency}>
                  <SelectTrigger className="ascend-input">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {skillProficiencyValues.map((v) => (
                      <SelectItem key={v} value={v}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="btn-primary" disabled={saving || !skillName.trim()}>
                {saving ? "Adding…" : "Add skill"}
              </Button>
            </form>
          </SheetContent>
        </Sheet>
      </div>
      {skills.length === 0 ? (
        <p className="text-text-secondary text-sm mt-2">Add at least 3 skills.</p>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={skills.map((s) => s.id)} strategy={verticalListSortingStrategy}>
            <ul className="mt-4 space-y-2">
              {skills.map((s) => (
                <SortableSkillItem key={s.id} skill={s} onDelete={handleDelete} />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}
    </section>
  );
}
