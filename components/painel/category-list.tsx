"use client"

import { useState, useTransition } from "react"
import { createCategoryInline, updateCategory, deleteCategory, reorderCategories } from "@/lib/actions/categories"
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, KeyboardSensor } from "@dnd-kit/core"
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical, Pencil, Trash2, Check, X, Plus } from "lucide-react"
import { toast } from "sonner"

type Category = { id: string; name: string; sort_order: number }

function SortableCategory({ cat, onEdit, onDelete }: { cat: Category; onEdit: (id: string, name: string) => void; onDelete: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: cat.id })
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(cat.name)

  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }

  async function handleEdit() {
    if (!name.trim() || name === cat.name) { setEditing(false); return }
    const fd = new FormData()
    fd.set("name", name)
    const res = await updateCategory(cat.id, fd)
    if (res.error) { toast.error(res.error); setName(cat.name) }
    else { onEdit(cat.id, name); toast.success("Categoria atualizada") }
    setEditing(false)
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 rounded-xl bg-[#161616] border border-white/5 px-4 py-3"
    >
      <button
        {...attributes}
        {...listeners}
        suppressHydrationWarning
        className="text-zinc-600 hover:text-zinc-400 cursor-grab active:cursor-grabbing shrink-0"
      >
        <GripVertical className="size-4" />
      </button>

      {editing ? (
        <>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            className="flex-1 bg-transparent text-sm text-white outline-none border-b border-orange-500/60 pb-0.5"
            autoFocus
            onKeyDown={e => {
              if (e.key === "Enter") handleEdit()
              if (e.key === "Escape") { setEditing(false); setName(cat.name) }
            }}
          />
          <button onClick={handleEdit} className="text-green-400 hover:text-green-300 shrink-0">
            <Check className="size-4" />
          </button>
          <button onClick={() => { setEditing(false); setName(cat.name) }} className="text-zinc-500 hover:text-zinc-300 shrink-0">
            <X className="size-4" />
          </button>
        </>
      ) : (
        <>
          <span className="flex-1 text-sm text-zinc-200">{cat.name}</span>
          <button onClick={() => setEditing(true)} className="text-zinc-600 hover:text-zinc-300 shrink-0">
            <Pencil className="size-3.5" />
          </button>
          <button onClick={() => onDelete(cat.id)} className="text-zinc-600 hover:text-red-400 shrink-0">
            <Trash2 className="size-3.5" />
          </button>
        </>
      )}
    </div>
  )
}

export function CategoryList({ categories: initial }: { categories: Category[] }) {
  const [categories, setCategories] = useState(initial)
  const [newName, setNewName] = useState("")
  const [adding, setAdding] = useState(false)
  const [saving, setSaving] = useState(false)
  const [, startTransition] = useTransition()

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  async function handleAdd() {
    if (!newName.trim()) return
    setSaving(true)
    const res = await createCategoryInline(newName.trim())
    setSaving(false)
    if (res.error) { toast.error(res.error); return }
    setCategories(c => [...c, { id: res.category!.id, name: res.category!.name, sort_order: c.length }])
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
    <div className="flex flex-col gap-2">
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
        <p className="text-sm text-zinc-600 text-center py-10">Nenhuma categoria ainda.</p>
      )}

      {adding ? (
        <div className="flex gap-2 mt-1">
          <input
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="Nome da categoria"
            autoFocus
            disabled={saving}
            onKeyDown={e => {
              if (e.key === "Enter") handleAdd()
              if (e.key === "Escape") { setAdding(false); setNewName("") }
            }}
            className="flex-1 rounded-xl bg-[#161616] border border-white/10 px-3 py-2 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-orange-500/50"
          />
          <button
            onClick={handleAdd}
            disabled={saving}
            className="rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm px-4 py-2 font-medium disabled:opacity-50 transition-colors"
          >
            {saving ? "…" : "Salvar"}
          </button>
          <button
            onClick={() => { setAdding(false); setNewName("") }}
            className="rounded-xl border border-white/10 text-zinc-400 hover:text-white text-sm px-3 py-2 transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="mt-1 flex items-center gap-2 self-start rounded-xl border border-dashed border-white/10 px-4 py-2.5 text-sm text-zinc-500 hover:text-zinc-200 hover:border-white/20 transition-colors"
        >
          <Plus className="size-4" />
          Nova categoria
        </button>
      )}
    </div>
  )
}
