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
import toast from "react-hot-toast";

interface Award {
  id: string;
  title: string;
  issuer: string | null;
  year: number | null;
}

export function AwardsSection({ profile, onUpdate }: { profile: { awards?: Award[] }; onUpdate: () => void }) {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: "", issuer: "" });
  const awardsFromProfile = useMemo(() => (profile.awards ?? []) as Award[], [profile.awards]);
  const [awards, setAwards] = useState<Award[]>(awardsFromProfile);
  useEffect(() => {
    setAwards(awardsFromProfile);
  }, [awardsFromProfile]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = awards.findIndex((a) => a.id === active.id);
    const newIndex = awards.findIndex((a) => a.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(awards, oldIndex, newIndex);
    setAwards(reordered);
    await fetch("/api/profile/me/awards/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: reordered.map((a, index) => ({ id: a.id, order: index })) }),
    });
  };

  const reset = () => { setForm({ title: "", issuer: "" }); setEditingId(null); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = { title: form.title, issuer: form.issuer || null };
    const url = editingId ? `/api/profile/me/awards/${editingId}` : "/api/profile/me/awards";
    const res = await fetch(url, { method: editingId ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    setSaving(false);
    if (!res.ok) { toast.error("Failed"); return; }
    toast.success(editingId ? "Updated" : "Added");
    setOpen(false); reset(); onUpdate();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete?")) return;
    const res = await fetch(`/api/profile/me/awards/${id}`, { method: "DELETE" });
    if (!res.ok) { toast.error("Failed"); return; }
    toast.success("Deleted");
    setOpen(false); reset(); onUpdate();
  };

  function SortableAwardItem({ award, onEdit, onDelete }: { award: Award; onEdit: (a: Award) => void; onDelete: (id: string) => void }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: award.id });
    const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };
    return (
      <li ref={setNodeRef} style={style} className="flex items-start justify-between gap-2 p-3 rounded-lg border border-border">
        <div className="flex items-start gap-2 min-w-0">
          <button type="button" {...attributes} {...listeners} className="mt-0.5 cursor-grab active:cursor-grabbing text-text-secondary hover:text-text-primary focus:outline-none shrink-0" aria-label="Drag to reorder">
            <GripVertical className="h-4 w-4" />
          </button>
          <div><p className="font-medium text-text-primary">{award.title}</p><p className="text-sm text-text-secondary">{award.issuer}</p></div>
        </div>
        <div className="flex gap-1 shrink-0">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(award)}><Pencil className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-danger" onClick={() => onDelete(award.id)}><Trash2 className="h-4 w-4" /></Button>
        </div>
      </li>
    );
  }

  return (
    <section className="ascend-card p-6">
      <div className="flex items-center justify-between">
        <h2 className="section-title">Awards & Recognition</h2>
        <Sheet open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="sm" className="btn-ghost" onClick={() => { reset(); setOpen(true); }}><Plus className="h-4 w-4 mr-1" /> Add</Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader><SheetTitle>{editingId ? "Edit award" : "Add award"}</SheetTitle></SheetHeader>
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div><label className="ascend-label">Title</label><Input className="ascend-input" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required /></div>
              <div><label className="ascend-label">Issuer</label><Input className="ascend-input" value={form.issuer} onChange={(e) => setForm((f) => ({ ...f, issuer: e.target.value }))} /></div>
              <Button type="submit" className="btn-primary" disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
              {editingId && <Button type="button" className="btn-danger ml-2" onClick={() => handleDelete(editingId)}>Delete</Button>}
            </form>
          </SheetContent>
        </Sheet>
      </div>
      {awards.length === 0 ? <p className="text-text-secondary text-sm mt-2">Add awards.</p> : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={awards.map((a) => a.id)} strategy={verticalListSortingStrategy}>
            <ul className="mt-4 space-y-3">
              {awards.map((a) => (
                <SortableAwardItem key={a.id} award={a} onEdit={(aw) => { setForm({ title: aw.title, issuer: aw.issuer ?? "" }); setEditingId(aw.id); setOpen(true); }} onDelete={handleDelete} />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}
    </section>
  );
}
