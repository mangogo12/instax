"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { deleteDish, toggleDishAvailability, toggleDishFeatured, reorderDishes } from "@/lib/actions/dishes"
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, KeyboardSensor } from "@dnd-kit/core"
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { GripVertical, Pencil, Trash2, Star } from "lucide-react"
import { toast } from "sonner"

type Dish = {
  id: string
  name: string
  price_cents: number
  category_id: string
  is_available: boolean
  is_featured: boolean
  sort_order: number
  media_type: "image" | "video"
  image_url: string | null
}

type Category = { id: string; name: string }

function SortableDish({
  dish, categoryName, onToggleAvail, onToggleFeatured, onDelete
}: {
  dish: Dish
  categoryName: string
  onToggleAvail: (id: string, val: boolean) => void
  onToggleFeatured: (id: string, val: boolean) => void
  onDelete: (id: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: dish.id })
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }
  const price = (dish.price_cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
      <button {...attributes} {...listeners} className="text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing shrink-0">
        <GripVertical className="size-4" />
      </button>

      {dish.image_url ? (
        <img src={dish.image_url} alt={dish.name} className="size-10 rounded object-cover shrink-0" />
      ) : (
        <div className="size-10 rounded bg-muted shrink-0 flex items-center justify-center text-xs text-muted-foreground">{dish.media_type === "video" ? "▶" : "?"}</div>
      )}

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{dish.name}</p>
        <p className="text-xs text-muted-foreground">{categoryName} · {price}</p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          title="Destaque"
          onClick={() => onToggleFeatured(dish.id, !dish.is_featured)}
          className={dish.is_featured ? "text-yellow-500" : "text-muted-foreground hover:text-foreground"}
        >
          <Star className="size-4" fill={dish.is_featured ? "currentColor" : "none"} />
        </button>
        <Switch
          checked={dish.is_available}
          onCheckedChange={val => onToggleAvail(dish.id, val)}
          title={dish.is_available ? "Disponível" : "Indisponível"}
        />
        <Link href={`/painel/pratos/${dish.id}`}>
          <Button size="icon-sm" variant="ghost"><Pencil className="size-3.5" /></Button>
        </Link>
        <Button size="icon-sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => onDelete(dish.id)}>
          <Trash2 className="size-3.5" />
        </Button>
      </div>
    </div>
  )
}

export function DishList({ dishes: initial, categories }: { dishes: Dish[]; categories: Category[] }) {
  const [dishes, setDishes] = useState(initial)
  const [, startTransition] = useTransition()

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  function categoryName(id: string) { return categories.find(c => c.id === id)?.name ?? "—" }

  async function handleDelete(id: string) {
    const res = await deleteDish(id)
    if (res.error) { toast.error(res.error); return }
    setDishes(d => d.filter(x => x.id !== id))
    toast.success("Prato removido")
  }

  function handleToggleAvail(id: string, val: boolean) {
    setDishes(d => d.map(x => x.id === id ? { ...x, is_available: val } : x))
    startTransition(() => toggleDishAvailability(id, val))
  }

  function handleToggleFeatured(id: string, val: boolean) {
    setDishes(d => d.map(x => x.id === id ? { ...x, is_featured: val } : x))
    startTransition(() => toggleDishFeatured(id, val))
  }

  function handleDragEnd(event: any) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = dishes.findIndex(d => d.id === active.id)
    const newIndex = dishes.findIndex(d => d.id === over.id)
    const reordered = arrayMove(dishes, oldIndex, newIndex)
    setDishes(reordered)
    startTransition(() => reorderDishes(reordered.map(d => d.id)))
  }

  if (dishes.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-12">Nenhum prato. Crie o primeiro!</p>
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={dishes.map(d => d.id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-2">
          {dishes.map(dish => (
            <SortableDish
              key={dish.id}
              dish={dish}
              categoryName={categoryName(dish.category_id)}
              onToggleAvail={handleToggleAvail}
              onToggleFeatured={handleToggleFeatured}
              onDelete={handleDelete}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}
