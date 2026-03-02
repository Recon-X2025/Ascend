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

interface Certification {
  id: string;
  name: string;
  issuingOrg: string;
  issueYear: number | null;
  doesNotExpire: boolean;
}

export function CertificationsSection({ profile, onUpdate }: { profile: { certifications?: Certification[] }; onUpdate: () => void }) {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", issuingOrg: "", issueMonth: 0, issueYear: 0, doesNotExpire: false, expiryMonth: 0, expiryYear: 0, credentialId: "", credentialUrl: "" });
  const certsFromProfile = useMemo(() => (profile.certifications ?? []) as Certification[], [profile.certifications]);
  const [certs, setCerts] = useState<Certification[]>(certsFromProfile);
  useEffect(() => {
    setCerts(certsFromProfile);
  }, [certsFromProfile]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = certs.findIndex((c) => c.id === active.id);
    const newIndex = certs.findIndex((c) => c.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(certs, oldIndex, newIndex);
    setCerts(reordered);
    await fetch("/api/profile/me/certifications/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: reordered.map((c, index) => ({ id: c.id, order: index })) }),
    });
  };

  const reset = () => { setForm({ name: "", issuingOrg: "", issueMonth: 0, issueYear: 0, doesNotExpire: false, expiryMonth: 0, expiryYear: 0, credentialId: "", credentialUrl: "" }); setEditingId(null); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = { name: form.name, issuingOrg: form.issuingOrg, issueMonth: form.issueMonth || undefined, issueYear: form.issueYear || undefined, doesNotExpire: form.doesNotExpire, expiryMonth: form.doesNotExpire ? undefined : form.expiryMonth, expiryYear: form.doesNotExpire ? undefined : form.expiryYear, credentialId: form.credentialId || undefined, credentialUrl: form.credentialUrl || undefined };
    const url = editingId ? `/api/profile/me/certifications/${editingId}` : "/api/profile/me/certifications";
    const res = await fetch(url, { method: editingId ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    setSaving(false);
    if (!res.ok) { toast.error("Failed"); return; }
    toast.success(editingId ? "Updated" : "Added");
    setOpen(false); reset(); onUpdate();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete?")) return;
    const res = await fetch(`/api/profile/me/certifications/${id}`, { method: "DELETE" });
    if (!res.ok) { toast.error("Failed"); return; }
    toast.success("Deleted");
    setOpen(false); reset(); onUpdate();
  };

  function SortableCertItem({ cert, onEdit, onDelete }: { cert: Certification; onEdit: (c: Certification) => void; onDelete: (id: string) => void }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: cert.id });
    const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };
    return (
      <li ref={setNodeRef} style={style} className="flex items-start justify-between gap-2 p-3 rounded-lg border border-border">
        <div className="flex items-start gap-2 min-w-0">
          <button type="button" {...attributes} {...listeners} className="mt-0.5 cursor-grab active:cursor-grabbing text-text-secondary hover:text-text-primary focus:outline-none shrink-0" aria-label="Drag to reorder">
            <GripVertical className="h-4 w-4" />
          </button>
          <div><p className="font-medium text-text-primary">{cert.name}</p><p className="text-sm text-text-secondary">{cert.issuingOrg}</p></div>
        </div>
        <div className="flex gap-1 shrink-0">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(cert)}><Pencil className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-danger" onClick={() => onDelete(cert.id)}><Trash2 className="h-4 w-4" /></Button>
        </div>
      </li>
    );
  }

  return (
    <section className="ascend-card p-6">
      <div className="flex items-center justify-between">
        <h2 className="section-title">Certifications</h2>
        <Sheet open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="sm" className="btn-ghost" onClick={() => { reset(); setOpen(true); }}><Plus className="h-4 w-4 mr-1" /> Add</Button>
          </SheetTrigger>
          <SheetContent className="overflow-y-auto">
            <SheetHeader><SheetTitle>{editingId ? "Edit certification" : "Add certification"}</SheetTitle></SheetHeader>
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div><label className="ascend-label">Name</label><Input className="ascend-input" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required /></div>
              <div><label className="ascend-label">Issuing organization</label><Input className="ascend-input" value={form.issuingOrg} onChange={(e) => setForm((f) => ({ ...f, issuingOrg: e.target.value }))} required /></div>
              <label className="flex items-center gap-2"><Checkbox checked={form.doesNotExpire} onCheckedChange={(c) => setForm((f) => ({ ...f, doesNotExpire: !!c }))} /><span className="text-sm">Does not expire</span></label>
              <Button type="submit" className="btn-primary" disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
              {editingId && <Button type="button" className="btn-danger ml-2" onClick={() => handleDelete(editingId)}>Delete</Button>}
            </form>
          </SheetContent>
        </Sheet>
      </div>
      {certs.length === 0 ? <p className="text-text-secondary text-sm mt-2">Add certifications.</p> : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={certs.map((c) => c.id)} strategy={verticalListSortingStrategy}>
            <ul className="mt-4 space-y-3">
              {certs.map((c) => (
                <SortableCertItem key={c.id} cert={c} onEdit={(cert) => { setForm({ name: cert.name, issuingOrg: cert.issuingOrg, issueMonth: 0, issueYear: cert.issueYear ?? 0, doesNotExpire: cert.doesNotExpire, expiryMonth: 0, expiryYear: 0, credentialId: "", credentialUrl: "" }); setEditingId(cert.id); setOpen(true); }} onDelete={handleDelete} />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}
    </section>
  );
}
