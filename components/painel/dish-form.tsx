"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { createDish, updateDish } from "@/lib/actions/dishes"
import { createCategoryInline } from "@/lib/actions/categories"
import { ImageUpload } from "@/components/painel/image-upload"
import { VideoUpload } from "@/components/painel/video-upload"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Plus, Check, X } from "lucide-react"

type Category = { id: string; name: string }

type DishRow = {
  id: string
  name: string
  description: string | null
  ingredients: string | null
  serves: number | null
  prep_time_min: number | null
  price_cents: number
  category_id: string
  media_type: "image" | "video"
  image_url: string | null
  bunny_video_id: string | null
  is_available: boolean
  is_featured: boolean
}

interface DishFormProps {
  categories: Category[]
  restaurantId: string
  dish?: DishRow
}

export function DishForm({ categories: initialCategories, restaurantId, dish }: DishFormProps) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [categories, setCategories] = useState(initialCategories)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(dish?.category_id ?? null)
  const [addingCat, setAddingCat] = useState(false)
  const [newCatName, setNewCatName] = useState("")
  const [savingCat, setSavingCat] = useState(false)
  const [mediaType, setMediaType] = useState<"image" | "video">(dish?.media_type ?? "image")
  const [imageUrl, setImageUrl] = useState(dish?.image_url ?? "")
  const [videoId, setVideoId] = useState(dish?.bunny_video_id ?? "")
  const [isAvailable, setIsAvailable] = useState(dish?.is_available ?? true)
  const [isFeatured, setIsFeatured] = useState(dish?.is_featured ?? false)
  const [priceStr, setPriceStr] = useState(dish ? (dish.price_cents / 100).toFixed(2).replace(".", ",") : "")
  const [name, setName] = useState(dish?.name ?? "")

  async function handleCreateCategory() {
    if (!newCatName.trim()) return
    setSavingCat(true)
    const res = await createCategoryInline(newCatName.trim())
    setSavingCat(false)
    if (res.error) { toast.error(res.error); return }
    if (res.category) {
      setCategories(prev => [...prev, res.category!])
      setSelectedCategory(res.category!.id)
    }
    setNewCatName("")
    setAddingCat(false)
    toast.success("Categoria criada")
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const fd = new FormData(form)

    // Convert R$ to cents
    const priceCents = Math.round(parseFloat(priceStr.replace(",", ".")) * 100)
    if (isNaN(priceCents) || priceCents <= 0) { toast.error("Preço inválido"); return }
    fd.set("price_cents", String(priceCents))
    fd.set("media_type", mediaType)
    fd.set("image_url", imageUrl)
    fd.set("bunny_video_id", videoId)
    fd.set("is_available", String(isAvailable))
    fd.set("is_featured", String(isFeatured))

    startTransition(async () => {
      const res = dish ? await updateDish(dish.id, fd) : await createDish(fd)
      if (res.error) { toast.error(res.error); return }
      toast.success(dish ? "Prato atualizado" : "Prato criado")
      router.push("/painel/pratos")
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 max-w-2xl">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label htmlFor="name">Nome do prato</Label>
          <Input id="name" name="name" required maxLength={120} value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Hambúrguer Artesanal" />
        </div>

        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label htmlFor="description">Descrição</Label>
          <Textarea id="description" name="description" rows={3} maxLength={500} placeholder="Descrição curta exibida no feed" defaultValue={dish?.description ?? ""} />
        </div>

        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label htmlFor="ingredients">Ingredientes</Label>
          <Textarea id="ingredients" name="ingredients" rows={2} maxLength={500} placeholder="Ingredientes separados por vírgula" defaultValue={dish?.ingredients ?? ""} />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>Categoria</Label>
          <input type="hidden" name="category_id" value={selectedCategory ?? ""} />
          <Select value={selectedCategory ?? ""} onValueChange={setSelectedCategory} required>
            <SelectTrigger>
              <SelectValue placeholder="Selecione…">
                {selectedCategory
                  ? (categories.find(c => c.id === selectedCategory)?.name ?? "Selecione…")
                  : <span className="text-muted-foreground">Selecione…</span>}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          {addingCat ? (
            <div className="flex gap-1.5 mt-1">
              <Input
                autoFocus
                value={newCatName}
                onChange={e => setNewCatName(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); handleCreateCategory() } if (e.key === "Escape") setAddingCat(false) }}
                placeholder="Nome da categoria"
                className="h-8 text-sm"
              />
              <Button type="button" size="sm" className="h-8 px-2" onClick={handleCreateCategory} disabled={savingCat}>
                <Check className="size-4" />
              </Button>
              <Button type="button" size="sm" variant="outline" className="h-8 px-2" onClick={() => setAddingCat(false)}>
                <X className="size-4" />
              </Button>
            </div>
          ) : (
            <button type="button" onClick={() => setAddingCat(true)} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mt-0.5 w-fit">
              <Plus className="size-3" /> Nova categoria
            </button>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="price">Preço (R$)</Label>
          <Input
            id="price"
            inputMode="decimal"
            placeholder="0,00"
            value={priceStr}
            onChange={e => setPriceStr(e.target.value)}
            required
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="serves">Serve quantas pessoas</Label>
          <Input id="serves" name="serves" type="number" min={1} max={100} defaultValue={dish?.serves ?? ""} placeholder="1" />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="prep_time_min">Tempo de preparo (min)</Label>
          <Input id="prep_time_min" name="prep_time_min" type="number" min={1} max={300} defaultValue={dish?.prep_time_min ?? ""} placeholder="15" />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <Label>Mídia</Label>
        <div className="flex gap-2">
          <Button type="button" size="sm" variant={mediaType === "image" ? "default" : "outline"} onClick={() => setMediaType("image")}>Imagem</Button>
          <Button type="button" size="sm" variant={mediaType === "video" ? "default" : "outline"} onClick={() => setMediaType("video")}>Vídeo</Button>
        </div>
        {mediaType === "image" ? (
          <ImageUpload value={imageUrl || undefined} restaurantId={restaurantId} onChange={setImageUrl} />
        ) : (
          <VideoUpload value={videoId || undefined} dishName={name} onChange={setVideoId} />
        )}
      </div>

      <div className="flex flex-wrap gap-6">
        <div className="flex items-center gap-2">
          <Switch id="is_available" checked={isAvailable} onCheckedChange={setIsAvailable} />
          <Label htmlFor="is_available">Disponível</Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch id="is_featured" checked={isFeatured} onCheckedChange={setIsFeatured} />
          <Label htmlFor="is_featured">Destaque</Label>
        </div>
      </div>

      <div className="flex gap-2">
        <Button type="submit">{dish ? "Salvar alterações" : "Criar prato"}</Button>
        <Button type="button" variant="outline" onClick={() => router.push("/painel/pratos")}>Cancelar</Button>
      </div>
    </form>
  )
}
