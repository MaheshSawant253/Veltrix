import { useRef, useEffect, useState } from 'react'
import type { VideoProject, TimelineData, TimelineClip } from '../../../types'

interface PreviewWindowProps {
  project: VideoProject
  timeline: TimelineData
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
  timeline,
  currentTime,
  isPlaying,
  onPlayPause,
  onSeek,
  duration
}: PreviewWindowProps) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [activeMode, setActiveMode] = useState<'video' | 'canvas'>('canvas')
  const currentTimeRef = useRef(currentTime)
  
  // Find which video/audio clip is active at a given time
  function getActiveVideoClip(time: number): TimelineClip | null {
    const videoTrack = timeline.tracks.find(t => t.type === 'video')
    if (!videoTrack) return null
    return videoTrack.clips.find(clip =>
      time >= clip.startTime && 
      time < clip.startTime + clip.duration
    ) ?? null
  }

  // Convert Windows path to file:// URL
  function toFileUrl(filePath: string): string {
    return 'file:///' + filePath.replace(/\\/g, '/').replace(/ /g, '%20')
  }

  // Draw image contained instead of stretching
  function drawImageContained(
    ctx: CanvasRenderingContext2D,
    img: HTMLImageElement | HTMLVideoElement,
    canvasW: number,
    canvasH: number
  ): void {
    const imgW = img instanceof HTMLImageElement 
      ? img.naturalWidth : (img as HTMLVideoElement).videoWidth
    const imgH = img instanceof HTMLImageElement 
      ? img.naturalHeight : (img as HTMLVideoElement).videoHeight

    if (!imgW || !imgH) return

    const scale = Math.min(canvasW / imgW, canvasH / imgH)
    const drawW = imgW * scale
    const drawH = imgH * scale
    const offsetX = (canvasW - drawW) / 2
    const offsetY = (canvasH - drawH) / 2

    // Fill background black first
    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, canvasW, canvasH)

    ctx.drawImage(img, offsetX, offsetY, drawW, drawH)
  }

  // When play state or currentTime changes
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const activeClip = getActiveVideoClip(currentTime)

    if (activeClip?.filePath) {
      // Check if it's an image
      const ext = activeClip.filePath.split('.').pop()?.toLowerCase() || ''
      if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext)) {
        setActiveMode('canvas')
        video.pause() // assure it's paused
        
        const canvas = canvasRef.current
        if (canvas) {
          const ctx = canvas.getContext('2d')
          if (ctx) {
            const img = new Image()
            img.onload = () => {
              drawImageContained(ctx, img, canvas.width, canvas.height)
            }
            img.src = toFileUrl(activeClip.filePath)
          }
        }
      } else {
        const fileUrl = toFileUrl(activeClip.filePath)
        
        // Only change src if different clip
        if (video.src !== fileUrl) {
          video.src = fileUrl
          video.load()
        }

        // Seek to correct position within clip
        const clipLocalTime = 
          currentTime - activeClip.startTime + activeClip.trimIn
        
        if (Math.abs(video.currentTime - clipLocalTime) > 0.3) {
          video.currentTime = clipLocalTime
        }

        setActiveMode('video')

        if (isPlaying) {
          video.play().catch(err => {
            console.error('Playback error:', err)
          })
        } else {
          video.pause()
        }
      }
    } else {
      // No video clip — show black canvas
      video.pause()
      setActiveMode('canvas')
      const canvas = canvasRef.current
      if (canvas) {
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.fillStyle = '#000'
          ctx.fillRect(0, 0, canvas.width, canvas.height)
        }
      }
    }
  }, [isPlaying, currentTime, timeline.tracks])

  // Track video time → update parent currentTime
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleTimeUpdate = () => {
      const activeClip = getActiveVideoClip(currentTimeRef.current)
      if (!activeClip) return
      const timelineTime = 
        video.currentTime - activeClip.trimIn + activeClip.startTime
      onSeek(timelineTime)
      currentTimeRef.current = timelineTime
    }

    const handleEnded = () => {
      // Only pause if this is the very end of the duration
      if (currentTimeRef.current >= duration - 0.5) {
        onPlayPause()
      }
    }

    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('ended', handleEnded)
    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('ended', handleEnded)
    }
  }, [duration, onSeek, onPlayPause, timeline.tracks])

  // Keep a ref of current time for the timeupdate callback
  useEffect(() => {
    currentTimeRef.current = currentTime
  }, [currentTime])

  return (
    <div style={{ flex: 1, minHeight: 0, display: 'flex', 
      flexDirection: 'column', backgroundColor: '#0a0a0a',
      overflow: 'hidden' }}>

      {/* Preview area */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden', padding: '8px', position: 'relative' }}>

        <div style={{ 
          position: 'relative',
          width: '100%', 
          maxHeight: '100%',
          aspectRatio: project.settings.aspectRatio.replace(':', '/'),
          backgroundColor: '#000',
          overflow: 'hidden'
        }}>
          {/* Video element — used for video/audio playback */}
          <video
            ref={videoRef}
            style={{
              width: '100%', 
              height: '100%',
              objectFit: 'contain',   // ← letterbox, no stretch
              display: activeMode === 'video' ? 'block' : 'none',
              backgroundColor: '#000',
            }}
          />

          {/* Canvas — used for images and empty state */}
          <canvas
            ref={canvasRef}
            width={1920}
            height={1080}
            style={{
              width: '100%',
              height: '100%',
              display: activeMode === 'canvas' ? 'block' : 'none',
              backgroundColor: '#000',
            }}
          />

          {/* Resolution badge */}
          <div style={{ position: 'absolute', top: 8, right: 8,
            background: 'rgba(0,0,0,0.6)', color: '#fff',
            fontSize: 11, padding: '2px 8px', borderRadius: 4 }}>
            {resolutionLabel[project.settings.resolution] || '1080p'}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div 
        style={{ height: 4, backgroundColor: '#2a2a2a', 
          flexShrink: 0, cursor: 'pointer' }}
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect()
          const ratio = (e.clientX - rect.left) / rect.width
          onSeek(ratio * duration)
        }}
      >
        <div style={{
          height: '100%',
          width: duration > 0 
            ? `${(currentTime / duration) * 100}%` : '0%',
          backgroundColor: '#6366f1',
          transition: 'width 0.1s linear',
        }} />
      </div>

      {/* Controls bar */}
      <div style={{ flexShrink: 0, height: 48,
        backgroundColor: '#111', borderTop: '1px solid #2a2a2a',
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', padding: '0 16px' }}>

        {/* Playback buttons */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {[
            { icon: '⏮', action: () => onSeek(0) },
            { icon: isPlaying ? '⏸' : '▶', action: onPlayPause },
            { icon: '⏭', action: () => onSeek(duration) },
          ].map((btn, i) => (
            <button key={i}
              onClick={btn.action}
              style={{ width: 32, height: 32, borderRadius: '50%',
                background: 'rgba(255,255,255,0.08)', border: 'none',
                color: '#fff', cursor: 'pointer', fontSize: 14 }}>
              {btn.icon}
            </button>
          ))}
        </div>

        {/* Timecode */}
        <div style={{ fontFamily: 'monospace', fontSize: 13,
          color: '#a1a1aa' }}>
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>

        {/* Volume (visual) */}
        <div style={{ color: '#a1a1aa', fontSize: 16 }}>🔊</div>
      </div>
    </div>
  )
}
