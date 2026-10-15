"use client"

import { useState, useOptimistic, useTransition } from "react"
import { createCategory, updateCategory, deleteCategory, reorderCategories } from "@/lib/actions/categories"
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from "@dnd-kit/core"
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { KeyboardSensor } from "@dnd-kit/core"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { GripVertical, Pencil, Trash2, Check, X, Plus } from "lucide-react"
import { toast } from "sonner"

type Category = { id: string; name: string; sort_order: number }

function SortableCategory({ cat, onEdit, onDelete }: { cat: Category; onEdit: (id: string, name: string) => void; onDelete: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: cat.id })
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(cat.name)

  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }

  async function handleEdit() {
    const fd = new FormData()
    fd.set("name", name)
    const res = await updateCategory(cat.id, fd)
    if (res.error) { toast.error(res.error); setName(cat.name) }
    else { onEdit(cat.id, name); toast.success("Categoria atualizada") }
    setEditing(false)
  }

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-2 rounded-lg border border-border bg-card p-3">
      <button {...attributes} {...listeners} className="text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing">
        <GripVertical className="size-4" />
      </button>
      {editing ? (
        <>
          <Input value={name} onChange={e => setName(e.target.value)} className="h-7 flex-1 text-sm" autoFocus onKeyDown={e => { if (e.key === "Enter") handleEdit(); if (e.key === "Escape") { setEditing(false); setName(cat.name) } }} />
          <Button size="icon-sm" variant="ghost" onClick={handleEdit}><Check className="size-3.5" /></Button>
          <Button size="icon-sm" variant="ghost" onClick={() => { setEditing(false); setName(cat.name) }}><X className="size-3.5" /></Button>
        </>
      ) : (
        <>
          <span className="flex-1 text-sm">{cat.name}</span>
          <Button size="icon-sm" variant="ghost" onClick={() => setEditing(true)}><Pencil className="size-3.5" /></Button>
          <Button size="icon-sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => onDelete(cat.id)}><Trash2 className="size-3.5" /></Button>
        </>
      )}
    </div>
  )
}

export function CategoryList({ categories: initial }: { categories: Category[] }) {
  const [categories, setCategories] = useState(initial)
  const [newName, setNewName] = useState("")
  const [adding, setAdding] = useState(false)
  const [, startTransition] = useTransition()

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  async function handleAdd() {
    if (!newName.trim()) return
    const fd = new FormData()
    fd.set("name", newName)
    const res = await createCategory(fd)
    if (res.error) { toast.error(res.error); return }
    toast.success("Categoria criada")
    setNewName("")
    setAdding(false)
  }

  async function handleDelete(id: string) {
    const res = await deleteCategory(id)
    if (res.error) { toast.error(res.error); return }
    setCategories(c => c.filter(x => x.id !== id))
    toast.success("Categoria removida")
  }

  function handleDragEnd(event: any) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = categories.findIndex(c => c.id === active.id)
    const newIndex = categories.findIndex(c => c.id === over.id)
    const reordered = arrayMove(categories, oldIndex, newIndex)
    setCategories(reordered)
    startTransition(() => reorderCategories(reordered.map(c => c.id)))
  }

  return (
    <div className="flex flex-col gap-3">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={categories.map(c => c.id)} strategy={verticalListSortingStrategy}>
          {categories.map(cat => (
            <SortableCategory
              key={cat.id}
              cat={cat}
              onEdit={(id, name) => setCategories(c => c.map(x => x.id === id ? { ...x, name } : x))}
              onDelete={handleDelete}
            />
          ))}
        </SortableContext>
      </DndContext>

      {categories.length === 0 && !adding && (
        <p className="text-sm text-muted-foreground text-center py-8">Nenhuma categoria. Adicione a primeira.</p>
      )}

      {adding ? (
        <div className="flex gap-2">
          <Input
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="Nome da categoria"
            autoFocus
            onKeyDown={e => { if (e.key === "Enter") handleAdd(); if (e.key === "Escape") { setAdding(false); setNewName("") } }}
          />
          <Button size="sm" onClick={handleAdd}>Salvar</Button>
          <Button size="sm" variant="outline" onClick={() => { setAdding(false); setNewName("") }}>Cancelar</Button>
        </div>
      ) : (
        <Button variant="outline" size="sm" className="self-start" onClick={() => setAdding(true)}>
          <Plus className="size-4 mr-1" />
          Nova categoria
        </Button>
      )}
    </div>
  )
}
