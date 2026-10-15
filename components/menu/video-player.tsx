"use client"

import { useEffect, useRef } from "react"

interface VideoPlayerProps {
  videoId: string
  cdnHostname: string
  active: boolean
  preload?: boolean
}

export function VideoPlayer({ videoId, cdnHostname, active, preload }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const hlsRef = useRef<any>(null)

  const src = `https://${cdnHostname}/${videoId}/playlist.m3u8`

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    async function init() {
      if (video!.canPlayType("application/vnd.apple.mpegurl")) {
        video!.src = src
      } else {
        const Hls = (await import("hls.js")).default
        if (Hls.isSupported()) {
          const hls = new Hls({ autoStartLoad: preload ?? false, maxBufferLength: 30 })
          hls.loadSource(src)
          hls.attachMedia(video!)
          hlsRef.current = hls
        }
      }
    }
    init()

    return () => {
      hlsRef.current?.destroy()
      hlsRef.current = null
    }
  }, [src])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    if (active) {
      hlsRef.current?.startLoad?.()
      video.play().catch(() => {})
    } else {
      video.pause()
    }
  }, [active])

  return (
    <video
      ref={videoRef}
      className="absolute inset-0 w-full h-full object-cover"
      loop
      muted
      playsInline
    />
  )
}
