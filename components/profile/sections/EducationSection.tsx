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
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import toast from "react-hot-toast";

const YEARS = Array.from({ length: 40 }, (_, i) => new Date().getFullYear() - 35 + i);

interface Education {
  id: string;
  institution: string;
  degree: string | null;
  fieldOfStudy: string | null;
  startYear: number | null;
  endYear: number | null;
  isCurrent: boolean;
  grade: string | null;
}

export function EducationSection({
  profile,
  onUpdate,
}: {
  profile: { educations?: Education[] };
  onUpdate: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    institution: "",
    degree: "",
    fieldOfStudy: "",
    startYear: new Date().getFullYear(),
    endYear: new Date().getFullYear(),
    isCurrent: false,
    grade: "",
    activities: "",
    description: "",
  });

  const educationsFromProfile = useMemo(() => (profile.educations ?? []) as Education[], [profile.educations]);
  const [educations, setEducations] = useState<Education[]>(educationsFromProfile);
  useEffect(() => {
    setEducations(educationsFromProfile);
  }, [educationsFromProfile]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = educations.findIndex((e) => e.id === active.id);
    const newIndex = educations.findIndex((e) => e.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(educations, oldIndex, newIndex);
    setEducations(reordered);
    await fetch("/api/profile/me/educations/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: reordered.map((e, index) => ({ id: e.id, order: index })) }),
    });
  };

  const resetForm = () => {
    setForm({
      institution: "",
      degree: "",
      fieldOfStudy: "",
      startYear: new Date().getFullYear(),
      endYear: new Date().getFullYear(),
      isCurrent: false,
      grade: "",
      activities: "",
      description: "",
    });
    setEditingId(null);
  };

  const openEdit = (ed: Education) => {
    setForm({
      institution: ed.institution,
      degree: ed.degree ?? "",
      fieldOfStudy: ed.fieldOfStudy ?? "",
      startYear: ed.startYear ?? new Date().getFullYear(),
      endYear: ed.endYear ?? new Date().getFullYear(),
      isCurrent: ed.isCurrent,
      grade: ed.grade ?? "",
      activities: "",
      description: "",
    });
    setEditingId(ed.id);
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      institution: form.institution,
      degree: form.degree || null,
      fieldOfStudy: form.fieldOfStudy || null,
      startYear: form.startYear,
      endYear: form.isCurrent ? null : form.endYear,
      isCurrent: form.isCurrent,
      grade: form.grade || null,
      activities: form.activities || null,
      description: form.description || null,
    };
    const url = editingId ? `/api/profile/me/educations/${editingId}` : "/api/profile/me/educations";
    const res = await fetch(url, {
      method: editingId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    if (!res.ok) { toast.error("Failed to save"); return; }
    toast.success(editingId ? "Updated" : "Added");
    setOpen(false);
    resetForm();
    onUpdate();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete?")) return;
    const res = await fetch(`/api/profile/me/educations/${id}`, { method: "DELETE" });
    if (!res.ok) { toast.error("Failed"); return; }
    toast.success("Deleted");
    setOpen(false);
    resetForm();
    onUpdate();
  };

  function SortableEducationItem({
    education,
    onEdit,
    onDelete,
  }: {
    education: Education;
    onEdit: (ed: Education) => void;
    onDelete: (id: string) => void;
  }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: education.id });
    const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };
    return (
      <li ref={setNodeRef} style={style} className="flex items-start justify-between gap-2 p-3 rounded-lg border border-border">
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
          <div>
            <p className="font-medium text-text-primary">{education.institution}</p>
            <p className="text-sm text-text-secondary">{education.degree} {education.fieldOfStudy && `· ${education.fieldOfStudy}`}</p>
          </div>
        </div>
        <div className="flex gap-1 shrink-0">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(education)}><Pencil className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-danger" onClick={() => onDelete(education.id)}><Trash2 className="h-4 w-4" /></Button>
        </div>
      </li>
    );
  }

  return (
    <section className="ascend-card p-6">
      <div className="flex items-center justify-between">
        <h2 className="section-title">Education</h2>
        <Sheet open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="sm" className="btn-ghost" onClick={() => { resetForm(); setOpen(true); }}>
              <Plus className="h-4 w-4 mr-1" /> Add
            </Button>
          </SheetTrigger>
          <SheetContent className="overflow-y-auto">
            <SheetHeader><SheetTitle>{editingId ? "Edit education" : "Add education"}</SheetTitle></SheetHeader>
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="ascend-label">Institution</label>
                <Input className="ascend-input" value={form.institution} onChange={(e) => setForm((f) => ({ ...f, institution: e.target.value }))} required />
              </div>
              <div>
                <label className="ascend-label">Degree</label>
                <Input className="ascend-input" value={form.degree} onChange={(e) => setForm((f) => ({ ...f, degree: e.target.value }))} />
              </div>
              <div>
                <label className="ascend-label">Field of study</label>
                <Input className="ascend-input" value={form.fieldOfStudy} onChange={(e) => setForm((f) => ({ ...f, fieldOfStudy: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="ascend-label">Start year</label>
                  <select
                    className="ascend-input"
                    value={form.startYear}
                    onChange={(e) => setForm((f) => ({ ...f, startYear: Number(e.target.value) }))}
                  >
                    {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <div>
                  <label className="ascend-label">End year</label>
                  <select
                    className="ascend-input"
                    value={form.endYear}
                    onChange={(e) => setForm((f) => ({ ...f, endYear: Number(e.target.value) }))}
                    disabled={form.isCurrent}
                  >
                    {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>
              <label className="flex items-center gap-2">
                <Checkbox checked={form.isCurrent} onCheckedChange={(c) => setForm((f) => ({ ...f, isCurrent: !!c }))} />
                <span className="text-sm">Currently studying here</span>
              </label>
              <div>
                <label className="ascend-label">Grade / CGPA</label>
                <Input className="ascend-input" value={form.grade} onChange={(e) => setForm((f) => ({ ...f, grade: e.target.value }))} />
              </div>
              <Button type="submit" className="btn-primary" disabled={saving}>{saving ? "Saving…" : editingId ? "Update" : "Add"}</Button>
              {editingId && <Button type="button" className="btn-danger ml-2" onClick={() => handleDelete(editingId)}>Delete</Button>}
            </form>
          </SheetContent>
        </Sheet>
      </div>
      {educations.length === 0 ? (
        <p className="text-text-secondary text-sm mt-2">Add your education.</p>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={educations.map((e) => e.id)} strategy={verticalListSortingStrategy}>
            <ul className="mt-4 space-y-3">
              {educations.map((ed) => (
                <SortableEducationItem key={ed.id} education={ed} onEdit={openEdit} onDelete={handleDelete} />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}
    </section>
  );
}
