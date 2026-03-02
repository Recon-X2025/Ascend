"use client";

import { useState, useEffect, useMemo } from "react";
import { Plus, Pencil, Trash2, GripVertical } from "lucide-react";
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { employmentTypeValues, workModeValues } from "@/lib/validations/profile";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import toast from "react-hot-toast";

const MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const YEARS = Array.from({ length: 50 }, (_, i) => new Date().getFullYear() - 30 + i);

interface Experience {
  id: string;
  company: string;
  designation: string;
  employmentType: string;
  location: string | null;
  workMode: string | null;
  startMonth: number;
  startYear: number;
  endMonth: number | null;
  endYear: number | null;
  isCurrent: boolean;
  description: string | null;
  achievements: string[];
}

export function ExperienceSection({
  profile,
  onUpdate,
}: {
  profile: { id: string; experiences?: Experience[] };
  onUpdate: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    company: "",
    designation: "",
    employmentType: "FULL_TIME",
    location: "",
    workMode: "",
    startMonth: new Date().getMonth() + 1,
    startYear: new Date().getFullYear(),
    endMonth: new Date().getMonth() + 1,
    endYear: new Date().getFullYear(),
    isCurrent: false,
    description: "",
    achievements: [] as string[],
  });

  const experiencesFromProfile = useMemo(() => (profile.experiences ?? []) as Experience[], [profile.experiences]);
  const [experiences, setExperiences] = useState<Experience[]>(experiencesFromProfile);
  useEffect(() => {
    setExperiences(experiencesFromProfile);
  }, [experiencesFromProfile]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = experiences.findIndex((e) => e.id === active.id);
    const newIndex = experiences.findIndex((e) => e.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(experiences, oldIndex, newIndex);
    setExperiences(reordered);
    await fetch("/api/profile/me/experiences/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: reordered.map((exp, index) => ({ id: exp.id, order: index })),
      }),
    });
  };

  const resetForm = () => {
    setForm({
      company: "",
      designation: "",
      employmentType: "FULL_TIME",
      location: "",
      workMode: "",
      startMonth: new Date().getMonth() + 1,
      startYear: new Date().getFullYear(),
      endMonth: new Date().getMonth() + 1,
      endYear: new Date().getFullYear(),
      isCurrent: false,
      description: "",
      achievements: [],
    });
    setEditingId(null);
  };

  const openEdit = (exp: Experience) => {
    setForm({
      company: exp.company,
      designation: exp.designation,
      employmentType: exp.employmentType,
      location: exp.location ?? "",
      workMode: exp.workMode ?? "",
      startMonth: exp.startMonth,
      startYear: exp.startYear,
      endMonth: exp.endMonth ?? new Date().getFullYear(),
      endYear: exp.endYear ?? new Date().getFullYear(),
      isCurrent: exp.isCurrent,
      description: exp.description ?? "",
      achievements: exp.achievements ?? [],
    });
    setEditingId(exp.id);
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      company: form.company,
      designation: form.designation,
      employmentType: form.employmentType,
      location: form.location || null,
      workMode: form.workMode || null,
      startMonth: form.startMonth,
      startYear: form.startYear,
      endMonth: form.isCurrent ? null : form.endMonth,
      endYear: form.isCurrent ? null : form.endYear,
      isCurrent: form.isCurrent,
      description: form.description || null,
      achievements: form.achievements,
    };
    const url = editingId
      ? `/api/profile/me/experiences/${editingId}`
      : "/api/profile/me/experiences";
    const res = await fetch(url, {
      method: editingId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      toast.error(j.error?.message ?? "Failed to save");
      return;
    }
    toast.success(editingId ? "Updated" : "Added");
    setOpen(false);
    resetForm();
    onUpdate();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this experience?")) return;
    const res = await fetch(`/api/profile/me/experiences/${id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Failed to delete");
      return;
    }
    toast.success("Deleted");
    setOpen(false);
    resetForm();
    onUpdate();
  };

  function SortableExperienceItem({
    experience,
    onEdit,
    onDelete,
  }: {
    experience: Experience;
    onEdit: (exp: Experience) => void;
    onDelete: (id: string) => void;
  }) {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: experience.id });
    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    };
    return (
      <li
        ref={setNodeRef}
        style={style}
        className="flex items-start justify-between gap-2 p-3 rounded-lg border border-border"
      >
        <div className="flex items-start gap-2 min-w-0">
          <button
            type="button"
            {...attributes}
            {...listeners}
            className="mt-0.5 cursor-grab active:cursor-grabbing text-text-secondary hover:text-text-primary focus:outline-none shrink-0"
            aria-label="Drag to reorder"
          >
            <GripVertical className="h-4 w-4" />
          </button>
          <div className="min-w-0">
            <p className="font-medium text-text-primary">{experience.designation} at {experience.company}</p>
            <p className="text-sm text-text-secondary">
              {experience.startMonth}/{experience.startYear} – {experience.isCurrent ? "Present" : `${experience.endMonth}/${experience.endYear}`}
            </p>
          </div>
        </div>
        <div className="flex gap-1 shrink-0">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(experience)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-danger"
            onClick={() => onDelete(experience.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </li>
    );
  }

  return (
    <section className="ascend-card p-6">
      <div className="flex items-center justify-between">
        <h2 className="section-title">Work Experience</h2>
        <Sheet open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="btn-ghost"
              onClick={() => { resetForm(); setOpen(true); }}
            >
              <Plus className="h-4 w-4 mr-1" /> Add
            </Button>
          </SheetTrigger>
          <SheetContent className="overflow-y-auto">
            <SheetHeader>
              <SheetTitle>{editingId ? "Edit experience" : "Add experience"}</SheetTitle>
            </SheetHeader>
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="ascend-label">Company</label>
                <Input
                  className="ascend-input"
                  value={form.company}
                  onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="ascend-label">Job title</label>
                <Input
                  className="ascend-input"
                  value={form.designation}
                  onChange={(e) => setForm((f) => ({ ...f, designation: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="ascend-label">Employment type</label>
                <Select
                  value={form.employmentType}
                  onValueChange={(v) => setForm((f) => ({ ...f, employmentType: v }))}
                >
                  <SelectTrigger className="ascend-input">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {employmentTypeValues.map((v) => (
                      <SelectItem key={v} value={v}>{v.replace(/_/g, " ")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="ascend-label">Location</label>
                <Input
                  className="ascend-input"
                  value={form.location}
                  onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                />
              </div>
              <div>
                <label className="ascend-label">Work mode</label>
                <Select value={form.workMode} onValueChange={(v) => setForm((f) => ({ ...f, workMode: v }))}>
                  <SelectTrigger className="ascend-input">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {workModeValues.map((v) => (
                      <SelectItem key={v} value={v}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="ascend-label">Start month</label>
                  <Select
                    value={String(form.startMonth)}
                    onValueChange={(v) => setForm((f) => ({ ...f, startMonth: Number(v) }))}
                  >
                    <SelectTrigger className="ascend-input">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MONTHS.map((m) => (
                        <SelectItem key={m} value={String(m)}>{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="ascend-label">Start year</label>
                  <Select
                    value={String(form.startYear)}
                    onValueChange={(v) => setForm((f) => ({ ...f, startYear: Number(v) }))}
                  >
                    <SelectTrigger className="ascend-input">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {YEARS.map((y) => (
                        <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <label className="flex items-center gap-2">
                <Checkbox
                  checked={form.isCurrent}
                  onCheckedChange={(c) => setForm((f) => ({ ...f, isCurrent: !!c }))}
                />
                <span className="text-sm">Currently working here</span>
              </label>
              {!form.isCurrent && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="ascend-label">End month</label>
                    <Select
                      value={String(form.endMonth)}
                      onValueChange={(v) => setForm((f) => ({ ...f, endMonth: Number(v) }))}
                    >
                      <SelectTrigger className="ascend-input">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {MONTHS.map((m) => (
                          <SelectItem key={m} value={String(m)}>{m}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="ascend-label">End year</label>
                    <Select
                      value={String(form.endYear)}
                      onValueChange={(v) => setForm((f) => ({ ...f, endYear: Number(v) }))}
                    >
                      <SelectTrigger className="ascend-input">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {YEARS.map((y) => (
                          <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
              <div>
                <label className="ascend-label">Description</label>
                <textarea
                  className="ascend-input min-h-[80px]"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? "Saving…" : editingId ? "Update" : "Add"}
                </Button>
                {editingId && (
                  <Button
                    type="button"
                    className="btn-danger"
                    onClick={() => handleDelete(editingId)}
                  >
                    Delete
                  </Button>
                )}
              </div>
            </form>
          </SheetContent>
        </Sheet>
      </div>
      {experiences.length === 0 ? (
        <p className="text-text-secondary text-sm mt-2">Add your work experience.</p>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={experiences.map((e) => e.id)} strategy={verticalListSortingStrategy}>
            <ul className="mt-4 space-y-3">
              {experiences.map((exp) => (
                <SortableExperienceItem
                  key={exp.id}
                  experience={exp}
                  onEdit={openEdit}
                  onDelete={handleDelete}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}
    </section>
  );
}
