import { useRef, useEffect, useCallback } from 'react'
import type { VideoProject, TimelineClip } from '../../../types'
import {
  SkipBack,
  Play,
  Pause,
  SkipForward,
  Volume2,
  Maximize
} from 'lucide-react'

interface PreviewWindowProps {
  project: VideoProject
  currentTime: number
  isPlaying: boolean
  onPlayPause: () => void
  onSeek: (time: number) => void
  duration: number
}

const resolutionLabel: Record<string, string> = {
  '1920x1080': '1080p',
  '1280x720': '720p',
  '3840x2160': '4K'
}

const IMAGE_EXTS = ['jpg', 'jpeg', 'png', 'webp', 'gif']

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  return [h, m, s].map((v) => v.toString().padStart(2, '0')).join(':')
}

function fileToUrl(filePath: string): string {
  return 'file:///' + filePath.replace(/\\/g, '/')
}

function isImageFile(filePath: string): boolean {
  const ext = filePath.split('.').pop()?.toLowerCase() || ''
  return IMAGE_EXTS.includes(ext)
}

export const PreviewWindow = ({
  project,
  currentTime,
  isPlaying,
  onPlayPause,
  onSeek,
  duration
}: PreviewWindowProps) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animFrameRef = useRef<number>(0)
  const isPlayingRef = useRef(false)
  const currentClipRef = useRef<string>('')
  const imageCache = useRef<Map<string, HTMLImageElement>>(new Map())

  const aspectRatio = project.settings.aspectRatio

  // Find clip at given time on video tracks
  const findClipAtTime = useCallback(
    (time: number): TimelineClip | null => {
      for (const track of project.timeline.tracks) {
        if (track.type !== 'video') continue
        for (const clip of track.clips) {
          if (
            clip.filePath &&
            time >= clip.startTime &&
            time < clip.startTime + clip.duration
          ) {
            return clip
          }
        }
      }
      return null
    },
    [project.timeline.tracks]
  )

  // Draw an image to the canvas
  const drawImage = useCallback((src: string) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const cached = imageCache.current.get(src)
    if (cached) {
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        // Contain the image
        const scale = Math.min(canvas.width / cached.width, canvas.height / cached.height)
        const w = cached.width * scale
        const h = cached.height * scale
        const x = (canvas.width - w) / 2
        const y = (canvas.height - h) / 2
        ctx.drawImage(cached, x, y, w, h)
      }
      return
    }

    const img = new Image()
    img.onload = () => {
      imageCache.current.set(src, img)
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        const scale = Math.min(canvas.width / img.width, canvas.height / img.height)
        const w = img.width * scale
        const h = img.height * scale
        const x = (canvas.width - w) / 2
        const y = (canvas.height - h) / 2
        ctx.drawImage(img, x, y, w, h)
      }
    }
    img.src = fileToUrl(src)
  }, [])

  // Draw a video frame to canvas
  const drawVideoFrame = useCallback(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return
    const ctx = canvas.getContext('2d')
    if (ctx && video.readyState >= 2) {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    }
  }, [])

  // Render frame loop for video playback
  const renderLoop = useCallback(() => {
    if (!isPlayingRef.current) return
    drawVideoFrame()
    animFrameRef.current = requestAnimationFrame(renderLoop)
  }, [drawVideoFrame])

  // Handle play/pause
  useEffect(() => {
    isPlayingRef.current = isPlaying
    const video = videoRef.current

    if (isPlaying) {
      const clip = findClipAtTime(currentTime)
      if (clip && clip.filePath) {
        if (isImageFile(clip.filePath)) {
          // Images: just draw, no animation needed
          drawImage(clip.filePath)
        } else if (video) {
          const url = fileToUrl(clip.filePath)
          if (currentClipRef.current !== clip.id) {
            video.src = url
            currentClipRef.current = clip.id
          }
          video.currentTime = currentTime - clip.startTime + clip.trimIn
          video.play().catch(() => {/* ignore */})
          animFrameRef.current = requestAnimationFrame(renderLoop)
        }
      }
    } else {
      if (video) video.pause()
      cancelAnimationFrame(animFrameRef.current)
    }

    return () => cancelAnimationFrame(animFrameRef.current)
  }, [isPlaying, currentTime, findClipAtTime, renderLoop, drawImage])

  // Handle seek (when paused) — show correct frame
  useEffect(() => {
    if (isPlaying) return
    const canvas = canvasRef.current
    if (!canvas) return

    const clip = findClipAtTime(currentTime)
    if (!clip || !clip.filePath) {
      // No clip at this time — clear canvas
      const ctx = canvas.getContext('2d')
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height)
      return
    }

    if (isImageFile(clip.filePath)) {
      drawImage(clip.filePath)
    } else {
      const video = videoRef.current
      if (!video) return
      const url = fileToUrl(clip.filePath)
      if (currentClipRef.current !== clip.id) {
        video.src = url
        currentClipRef.current = clip.id
      }
      video.currentTime = currentTime - clip.startTime + clip.trimIn
      video.addEventListener('seeked', drawVideoFrame, { once: true })
    }
  }, [currentTime, isPlaying, findClipAtTime, drawImage, drawVideoFrame])

  // Progress bar click
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (duration <= 0) return
    const rect = e.currentTarget.getBoundingClientRect()
    const ratio = (e.clientX - rect.left) / rect.width
    onSeek(Math.max(0, Math.min(duration, ratio * duration)))
  }

  const progressWidth = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div
      style={{
        flex: 1,
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#0a0a0a',
        overflow: 'hidden'
      }}
    >
      {/* Hidden video element for decoding */}
      <video ref={videoRef} className="hidden" muted preload="auto" />

      {/* Canvas area */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          position: 'relative',
          padding: 8
        }}
      >
        <div
          style={{
            position: 'relative',
            width: '100%',
            maxHeight: '100%',
            aspectRatio: aspectRatio.replace(':', '/')
          }}
        >
          <canvas
            ref={canvasRef}
            width={960}
            height={540}
            style={{
              width: '100%',
              height: '100%',
              display: 'block',
              backgroundColor: '#000',
              borderRadius: 4
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: 8,
              right: 8,
              background: 'rgba(0,0,0,0.6)',
              color: '#fff',
              fontSize: 11,
              padding: '2px 8px',
              borderRadius: 4
            }}
          >
            {resolutionLabel[project.settings.resolution] || '1080p'}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div
        className="h-1 w-full cursor-pointer bg-[#2a2a2a]"
        onClick={handleProgressClick}
        style={{ flexShrink: 0 }}
      >
        <div
          className="h-full bg-accent transition-[width] duration-100"
          style={{ width: `${progressWidth}%` }}
        />
      </div>

      {/* Controls bar */}
      <div
        style={{
          flexShrink: 0,
          height: 48,
          backgroundColor: '#111',
          borderTop: '1px solid #2a2a2a',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px'
        }}
      >
        <div className="flex items-center gap-2">
          <button
            onClick={() => onSeek(0)}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-text-secondary transition-colors hover:bg-white/10 hover:text-text-primary"
          >
            <SkipBack size={14} />
          </button>
          <button
            onClick={onPlayPause}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/20 text-accent transition-colors hover:bg-accent/30"
          >
            {isPlaying ? <Pause size={14} /> : <Play size={14} />}
          </button>
          <button
            onClick={() => onSeek(duration)}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-text-secondary transition-colors hover:bg-white/10 hover:text-text-primary"
          >
            <SkipForward size={14} />
          </button>
        </div>

        <span className="font-mono text-[13px] text-text-secondary">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>

        <div className="flex items-center gap-2">
          <button className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-text-secondary transition-colors hover:bg-white/10 hover:text-text-primary">
            <Volume2 size={14} />
          </button>
          <button className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-text-secondary transition-colors hover:bg-white/10 hover:text-text-primary">
            <Maximize size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}
