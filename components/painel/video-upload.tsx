"use client"

import { useRef, useState } from "react"
import * as tus from "tus-js-client"
import { Button } from "@/components/ui/button"
import { Upload, CheckCircle2, Video } from "lucide-react"
import { toast } from "sonner"

interface VideoUploadProps {
  value?: string
  dishName: string
  onChange: (videoId: string) => void
}

export function VideoUpload({ value, dishName, onChange }: VideoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [progress, setProgress] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [done, setDone] = useState(!!value)

  async function handleFile(file: File) {
    if (!file.type.startsWith("video/")) { toast.error("Selecione um vídeo"); return }
    setUploading(true)
    setProgress(0)
    setDone(false)
    try {
      const res = await fetch("/api/bunny/upload-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: dishName || file.name }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.error ?? "Falha ao criar vídeo")
      }
      const { videoId, libraryId, expirationTime, signature } = await res.json()

      await new Promise<void>((resolve, reject) => {
        const upload = new tus.Upload(file, {
          endpoint: "https://video.bunnycdn.com/tusupload",
          retryDelays: [0, 3000, 5000, 10000],
          chunkSize: 5 * 1024 * 1024,
          headers: {
            AuthorizationSignature: signature,
            AuthorizationExpire: String(expirationTime),
            VideoId: videoId,
            LibraryId: libraryId,
          },
          metadata: { filetype: file.type, title: dishName || file.name },
          onProgress(sent, total) { setProgress(Math.round((sent / total) * 100)) },
          onSuccess() { resolve() },
          onError(err) { reject(err) },
        })
        upload.start()
      })

      onChange(videoId)
      setDone(true)
      toast.success("Vídeo enviado")
    } catch (e: any) {
      toast.error(e?.message ?? "Erro no upload")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div
        onClick={() => !uploading && inputRef.current?.click()}
        className="flex flex-col items-center justify-center gap-2 w-full max-w-xs aspect-video rounded-lg border-2 border-dashed border-border bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
      >
        {done ? (
          <>
            <CheckCircle2 className="size-8 text-green-500" />
            <span className="text-sm text-muted-foreground">Vídeo enviado</span>
            <Button size="xs" variant="outline" onClick={e => { e.stopPropagation(); inputRef.current?.click() }}>Trocar vídeo</Button>
          </>
        ) : uploading ? (
          <>
            <Video className="size-8 text-muted-foreground" />
            <div className="w-32 h-1.5 rounded-full bg-muted overflow-hidden">
              <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
            </div>
            <span className="text-xs text-muted-foreground">{progress}%</span>
          </>
        ) : (
          <>
            <Upload className="size-8 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Clique para enviar vídeo</span>
          </>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
      />
    </div>
  )
}
