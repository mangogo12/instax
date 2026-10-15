"use client"

import { useRef, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Upload, X, ImageIcon } from "lucide-react"
import { toast } from "sonner"

interface ImageUploadProps {
  value?: string
  restaurantId: string
  onChange: (url: string) => void
}

function compressToWebP(file: File, maxDim: number, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(objectUrl)
      let { width, height } = img
      if (width > maxDim || height > maxDim) {
        if (width > height) { height = Math.round(height * maxDim / width); width = maxDim }
        else { width = Math.round(width * maxDim / height); height = maxDim }
      }
      const canvas = document.createElement("canvas")
      canvas.width = width
      canvas.height = height
      canvas.getContext("2d")!.drawImage(img, 0, 0, width, height)
      canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error("Conversão falhou")), "image/webp", quality)
    }
    img.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error("Imagem inválida")) }
    img.src = objectUrl
  })
}

export function ImageUpload({ value, restaurantId, onChange }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState(value)

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) { toast.error("Selecione uma imagem"); return }
    setUploading(true)
    try {
      const webp = await compressToWebP(file, 1200, 0.85)
      const filename = `${restaurantId}/${crypto.randomUUID()}.webp`
      const supabase = createClient()
      const { error } = await supabase.storage
        .from("dish-images")
        .upload(filename, webp, { contentType: "image/webp" })
      if (error) throw error
      const { data: { publicUrl } } = supabase.storage.from("dish-images").getPublicUrl(filename)
      setPreview(publicUrl)
      onChange(publicUrl)
      toast.success("Imagem enviada")
    } catch (e: any) {
      toast.error(e?.message ?? "Erro no upload")
    } finally {
      setUploading(false)
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  return (
    <div className="flex flex-col gap-2">
      {preview ? (
        <div className="relative w-full max-w-xs">
          <img src={preview} alt="Preview" className="w-full aspect-video object-cover rounded-lg border border-border" />
          <Button
            size="icon-sm"
            variant="destructive"
            className="absolute top-1.5 right-1.5"
            onClick={() => { setPreview(undefined); onChange("") }}
          >
            <X className="size-3.5" />
          </Button>
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
          className="flex flex-col items-center justify-center gap-2 w-full max-w-xs aspect-video rounded-lg border-2 border-dashed border-border bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
        >
          <ImageIcon className="size-8 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">{uploading ? "Enviando…" : "Clique ou arraste uma imagem"}</span>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
      />
    </div>
  )
}
