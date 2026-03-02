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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { languageProficiencyValues } from "@/lib/validations/profile";
import toast from "react-hot-toast";

interface ProfileLanguage {
  id: string;
  language: string;
  proficiency: string;
}

export function LanguagesSection({ profile, onUpdate }: { profile: { languages?: ProfileLanguage[] }; onUpdate: () => void }) {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ language: "", proficiency: "PROFESSIONAL" });
  const languagesFromProfile = useMemo(() => (profile.languages ?? []) as ProfileLanguage[], [profile.languages]);
  const [languages, setLanguages] = useState<ProfileLanguage[]>(languagesFromProfile);
  useEffect(() => {
    setLanguages(languagesFromProfile);
  }, [languagesFromProfile]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = languages.findIndex((l) => l.id === active.id);
    const newIndex = languages.findIndex((l) => l.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(languages, oldIndex, newIndex);
    setLanguages(reordered);
    await fetch("/api/profile/me/languages/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: reordered.map((l, index) => ({ id: l.id, order: index })) }),
    });
  };

  const reset = () => { setForm({ language: "", proficiency: "PROFESSIONAL" }); setEditingId(null); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = { language: form.language, proficiency: form.proficiency };
    const url = editingId ? `/api/profile/me/languages/${editingId}` : "/api/profile/me/languages";
    const res = await fetch(url, { method: editingId ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    setSaving(false);
    if (!res.ok) { toast.error("Failed"); return; }
    toast.success(editingId ? "Updated" : "Added");
    setOpen(false); reset(); onUpdate();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete?")) return;
    const res = await fetch(`/api/profile/me/languages/${id}`, { method: "DELETE" });
    if (!res.ok) { toast.error("Failed"); return; }
    toast.success("Deleted");
    setOpen(false); reset(); onUpdate();
  };

  function SortableLanguageItem({ lang, onEdit, onDelete }: { lang: ProfileLanguage; onEdit: (l: ProfileLanguage) => void; onDelete: (id: string) => void }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: lang.id });
    const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };
    return (
      <li ref={setNodeRef} style={style} className="flex items-center justify-between gap-2 p-3 rounded-lg border border-border">
        <div className="flex items-start gap-2 min-w-0">
          <button type="button" {...attributes} {...listeners} className="mt-0.5 cursor-grab active:cursor-grabbing text-text-secondary hover:text-text-primary focus:outline-none shrink-0" aria-label="Drag to reorder">
            <GripVertical className="h-4 w-4" />
          </button>
          <div><p className="font-medium text-text-primary">{lang.language}</p><p className="text-sm text-text-secondary">{lang.proficiency}</p></div>
        </div>
        <div className="flex gap-1 shrink-0">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(lang)}><Pencil className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-danger" onClick={() => onDelete(lang.id)}><Trash2 className="h-4 w-4" /></Button>
        </div>
      </li>
    );
  }

  return (
    <section className="ascend-card p-6">
      <div className="flex items-center justify-between">
        <h2 className="section-title">Languages</h2>
        <Sheet open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="sm" className="btn-ghost" onClick={() => { reset(); setOpen(true); }}><Plus className="h-4 w-4 mr-1" /> Add</Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader><SheetTitle>{editingId ? "Edit language" : "Add language"}</SheetTitle></SheetHeader>
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div><label className="ascend-label">Language</label><Input className="ascend-input" value={form.language} onChange={(e) => setForm((f) => ({ ...f, language: e.target.value }))} required /></div>
              <div><label className="ascend-label">Proficiency</label><Select value={form.proficiency} onValueChange={(v) => setForm((f) => ({ ...f, proficiency: v }))}><SelectTrigger className="ascend-input"><SelectValue /></SelectTrigger><SelectContent>{languageProficiencyValues.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent></Select></div>
              <Button type="submit" className="btn-primary" disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
              {editingId && <Button type="button" className="btn-danger ml-2" onClick={() => handleDelete(editingId)}>Delete</Button>}
            </form>
          </SheetContent>
        </Sheet>
      </div>
      {languages.length === 0 ? <p className="text-text-secondary text-sm mt-2">Add languages.</p> : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={languages.map((l) => l.id)} strategy={verticalListSortingStrategy}>
            <ul className="mt-4 space-y-3">
              {languages.map((l) => (
                <SortableLanguageItem key={l.id} lang={l} onEdit={(lang) => { setForm({ language: lang.language, proficiency: lang.proficiency }); setEditingId(lang.id); setOpen(true); }} onDelete={handleDelete} />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}
    </section>
  );
}
