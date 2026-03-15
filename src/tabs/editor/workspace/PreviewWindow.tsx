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

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  return [h, m, s].map((v) => v.toString().padStart(2, '0')).join(':')
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
  const currentClipRef = useRef<TimelineClip | null>(null)

  const aspectRatio = project.settings.aspectRatio

  // Find video clip at given time
  const findVideoClipAtTime = useCallback(
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

  // Render frame loop
  const renderFrame = useCallback(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || !isPlayingRef.current) return

    const ctx = canvas.getContext('2d')
    if (ctx && video.readyState >= 2) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    }

    if (isPlayingRef.current) {
      animFrameRef.current = requestAnimationFrame(renderFrame)
    }
  }, [])

  // Handle play/pause
  useEffect(() => {
    isPlayingRef.current = isPlaying
    const video = videoRef.current

    if (isPlaying) {
      const clip = findVideoClipAtTime(currentTime)
      if (clip && clip.filePath && video) {
        const fileUrl = 'file:///' + clip.filePath.replace(/\\/g, '/')
        const clipTime = currentTime - clip.startTime + clip.trimIn

        // Only reload if different clip
        if (currentClipRef.current?.id !== clip.id) {
          video.src = fileUrl
          currentClipRef.current = clip
        }
        video.currentTime = clipTime
        video.play().catch(() => {/* ignore autoplay errors */})
        animFrameRef.current = requestAnimationFrame(renderFrame)
      }
    } else {
      if (video) video.pause()
      cancelAnimationFrame(animFrameRef.current)
    }

    return () => {
      cancelAnimationFrame(animFrameRef.current)
    }
  }, [isPlaying, currentTime, findVideoClipAtTime, renderFrame])

  // Handle seeking — draw frame at seek position
  useEffect(() => {
    if (isPlaying) return
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    const clip = findVideoClipAtTime(currentTime)
    if (clip && clip.filePath) {
      const fileUrl = 'file:///' + clip.filePath.replace(/\\/g, '/')
      if (currentClipRef.current?.id !== clip.id) {
        video.src = fileUrl
        currentClipRef.current = clip
      }
      video.currentTime = currentTime - clip.startTime + clip.trimIn

      const handleSeeked = () => {
        const ctx = canvas.getContext('2d')
        if (ctx && video.readyState >= 2) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        }
      }
      video.addEventListener('seeked', handleSeeked, { once: true })
    }
  }, [currentTime, isPlaying, findVideoClipAtTime])

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
            width={1920}
            height={1080}
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
        {/* Left: playback buttons */}
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

        {/* Center: timecode */}
        <span className="font-mono text-[13px] text-text-secondary">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>

        {/* Right: volume + fullscreen */}
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
