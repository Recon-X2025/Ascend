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

interface VolunteerWork {
  id: string;
  organization: string;
  role: string;
  cause: string | null;
}

export function VolunteerSection({ profile, onUpdate }: { profile: { volunteerWork?: VolunteerWork[] }; onUpdate: () => void }) {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ organization: "", role: "", cause: "" });
  const itemsFromProfile = useMemo(() => (profile.volunteerWork ?? []) as VolunteerWork[], [profile.volunteerWork]);
  const [items, setItems] = useState<VolunteerWork[]>(itemsFromProfile);
  useEffect(() => {
    setItems(itemsFromProfile);
  }, [itemsFromProfile]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((v) => v.id === active.id);
    const newIndex = items.findIndex((v) => v.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(items, oldIndex, newIndex);
    setItems(reordered);
    await fetch("/api/profile/me/volunteer/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: reordered.map((v, index) => ({ id: v.id, order: index })) }),
    });
  };

  const reset = () => { setForm({ organization: "", role: "", cause: "" }); setEditingId(null); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = { organization: form.organization, role: form.role, cause: form.cause || null };
    const url = editingId ? `/api/profile/me/volunteer/${editingId}` : "/api/profile/me/volunteer";
    const res = await fetch(url, { method: editingId ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    setSaving(false);
    if (!res.ok) { toast.error("Failed"); return; }
    toast.success(editingId ? "Updated" : "Added");
    setOpen(false); reset(); onUpdate();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete?")) return;
    const res = await fetch(`/api/profile/me/volunteer/${id}`, { method: "DELETE" });
    if (!res.ok) { toast.error("Failed"); return; }
    toast.success("Deleted");
    setOpen(false); reset(); onUpdate();
  };

  function SortableVolunteerItem({ vol, onEdit, onDelete }: { vol: VolunteerWork; onEdit: (v: VolunteerWork) => void; onDelete: (id: string) => void }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: vol.id });
    const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };
    return (
      <li ref={setNodeRef} style={style} className="flex items-start justify-between gap-2 p-3 rounded-lg border border-border">
        <div className="flex items-start gap-2 min-w-0">
          <button type="button" {...attributes} {...listeners} className="mt-0.5 cursor-grab active:cursor-grabbing text-text-secondary hover:text-text-primary focus:outline-none shrink-0" aria-label="Drag to reorder">
            <GripVertical className="h-4 w-4" />
          </button>
          <div><p className="font-medium text-text-primary">{vol.role} at {vol.organization}</p><p className="text-sm text-text-secondary">{vol.cause}</p></div>
        </div>
        <div className="flex gap-1 shrink-0">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(vol)}><Pencil className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-danger" onClick={() => onDelete(vol.id)}><Trash2 className="h-4 w-4" /></Button>
        </div>
      </li>
    );
  }

  return (
    <section className="ascend-card p-6">
      <div className="flex items-center justify-between">
        <h2 className="section-title">Volunteer Work</h2>
        <Sheet open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="sm" className="btn-ghost" onClick={() => { reset(); setOpen(true); }}><Plus className="h-4 w-4 mr-1" /> Add</Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader><SheetTitle>{editingId ? "Edit volunteer" : "Add volunteer"}</SheetTitle></SheetHeader>
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div><label className="ascend-label">Organization</label><Input className="ascend-input" value={form.organization} onChange={(e) => setForm((f) => ({ ...f, organization: e.target.value }))} required /></div>
              <div><label className="ascend-label">Role</label><Input className="ascend-input" value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))} required /></div>
              <div><label className="ascend-label">Cause</label><Input className="ascend-input" value={form.cause} onChange={(e) => setForm((f) => ({ ...f, cause: e.target.value }))} /></div>
              <Button type="submit" className="btn-primary" disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
              {editingId && <Button type="button" className="btn-danger ml-2" onClick={() => handleDelete(editingId)}>Delete</Button>}
            </form>
          </SheetContent>
        </Sheet>
      </div>
      {items.length === 0 ? <p className="text-text-secondary text-sm mt-2">Add volunteer work.</p> : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={items.map((v) => v.id)} strategy={verticalListSortingStrategy}>
            <ul className="mt-4 space-y-3">
              {items.map((v) => (
                <SortableVolunteerItem key={v.id} vol={v} onEdit={(vol) => { setForm({ organization: vol.organization, role: vol.role, cause: vol.cause ?? "" }); setEditingId(vol.id); setOpen(true); }} onDelete={handleDelete} />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}
    </section>
  );
}
