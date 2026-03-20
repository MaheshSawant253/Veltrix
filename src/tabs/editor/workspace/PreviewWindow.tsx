import { useRef, useEffect, useState, useCallback } from 'react'
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
  const audioRef = useRef<HTMLAudioElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const textCanvasRef = useRef<HTMLCanvasElement>(null)

  const [activeMode, setActiveMode] = useState<'video' | 'image' | 'canvas'>('canvas')
  const currentTimeRef = useRef(currentTime)
  
  const activeClipRef = useRef<TimelineClip | null>(null)
  const activeAudioClipRef = useRef<TimelineClip | null>(null)

  const isPlayingRef = useRef(isPlaying)
  const onSeekRef = useRef(onSeek)
  const onPlayPauseRef = useRef(onPlayPause)

  // Update refs
  useEffect(() => { currentTimeRef.current = currentTime }, [currentTime])
  useEffect(() => { isPlayingRef.current = isPlaying }, [isPlaying])
  useEffect(() => { onSeekRef.current = onSeek }, [onSeek])
  useEffect(() => { onPlayPauseRef.current = onPlayPause }, [onPlayPause])

  // Fix 3: Render Text over everything
  const renderTextOverlays = useCallback((time: number) => {
    const canvas = textCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, 1920, 1080)

    const textTrack = timeline.tracks.find(t => t.type === 'text')
    if (!textTrack) return
    if (textTrack.isMuted) return

    const activeTextClips = textTrack.clips.filter(clip =>
      time >= clip.startTime && 
      time < clip.startTime + clip.duration
    )

    activeTextClips.forEach(clip => {
      const text = clip.content || clip.name || 'Text'
      const isTitle = clip.name?.toLowerCase().includes('title')
      const fontSize = isTitle ? 80 : 48
      const yPos = isTitle ? 200 : 900

      ctx.font = `bold ${fontSize}px Arial, sans-serif`
      ctx.textAlign = 'center'
      ctx.shadowColor = 'rgba(0,0,0,0.8)'
      ctx.shadowBlur = 8
      ctx.shadowOffsetX = 2
      ctx.shadowOffsetY = 2
      ctx.fillStyle = '#ffffff'
      ctx.fillText(text, 960, yPos, 1800)
      ctx.shadowColor = 'transparent'
      ctx.shadowBlur = 0
    })
  }, [timeline.tracks])

  useEffect(() => {
    renderTextOverlays(currentTime)
  }, [currentTime, renderTextOverlays])

  function toFileUrl(filePath: string): string {
    return 'file:///' + filePath.replace(/\\/g, '/')
  }

  function getActiveClipAtTime(time: number): {
    clip: TimelineClip | null
    type: 'video' | 'image' | 'none'
    isMuted: boolean
  } {
    const videoTrack = timeline.tracks.find(t => t.type === 'video')
    if (!videoTrack) return { clip: null, type: 'none', isMuted: false }
    const clip = videoTrack.clips.find(c =>
      time >= c.startTime && time < c.startTime + c.duration
    ) ?? null
    if (!clip) return { clip: null, type: 'none', isMuted: videoTrack.isMuted }
    const imageExts = ['jpg','jpeg','png','webp','gif']
    const ext = clip.filePath?.split('.').pop()?.toLowerCase() ?? ''
    const isImage = imageExts.includes(ext) || clip.type === 'image'
    return { clip, type: isImage ? 'image' : 'video', isMuted: videoTrack.isMuted }
  }

  function getActiveAudioClipAtTime(time: number): {
    clip: TimelineClip | null
    isMuted: boolean
  } {
    const audioTrack = timeline.tracks.find(t => t.type === 'audio')
    if (!audioTrack) return { clip: null, isMuted: false }
    const clip = audioTrack.clips.find(c =>
      time >= c.startTime && time < c.startTime + c.duration
    ) ?? null
    return { clip, isMuted: audioTrack.isMuted }
  }

  // Master Clock handling playback
  useEffect(() => {
    if (!isPlaying) return

    let lastRenderTime = performance.now()
    let localTime = currentTimeRef.current

    const intervalId = setInterval(() => {
      const now = performance.now()
      const delta = (now - lastRenderTime) / 1000
      lastRenderTime = now

      // Did parent override via user scrub?
      if (Math.abs(currentTimeRef.current - localTime) > 0.5) {
        localTime = currentTimeRef.current
      }

      const video = videoRef.current
      const audio = audioRef.current

      const videoClip = activeClipRef.current
      const audioClip = activeAudioClipRef.current

      const isVideoMedia = videoClip && videoClip.type === 'video'
      const isAudioMedia = !!audioClip

      if (isVideoMedia && video && video.readyState >= 2 && !video.ended && !video.paused) {
        localTime = video.currentTime - videoClip.trimIn + videoClip.startTime
      } else if (isAudioMedia && audio && audio.readyState >= 2 && !audio.ended && !audio.paused) {
        localTime = audio.currentTime - audioClip.trimIn + audioClip.startTime
      } else {
        // Gaps, images, or media buffering
        localTime += delta
      }

      localTime = Math.max(0, localTime)

      if (localTime >= duration && duration > 0) {
        onSeekRef.current(0)
        onPlayPauseRef.current()
        return
      }

      onSeekRef.current(localTime)
      renderTextOverlays(localTime)
    }, 250)

    return () => clearInterval(intervalId)
  }, [isPlaying, duration, renderTextOverlays])


  // Audio Track Effect
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const { clip, isMuted } = getActiveAudioClipAtTime(currentTime)
    audio.muted = isMuted

    if (clip?.id !== activeAudioClipRef.current?.id || clip?.filePath !== activeAudioClipRef.current?.filePath) {
      activeAudioClipRef.current = clip
      if (clip?.filePath) {
        audio.src = toFileUrl(clip.filePath)
        audio.load()
        const playExpectedTime = () => {
          const expectedTime = currentTimeRef.current - (clip.startTime || 0) + (clip.trimIn || 0)
          audio.currentTime = Math.max(0, expectedTime)
          if (isPlayingRef.current) audio.play().catch(console.error)
        }
        if (audio.readyState >= 2) {
          playExpectedTime()
        } else {
          audio.onloadedmetadata = playExpectedTime
        }
      } else {
        audio.src = ''
        audio.pause()
      }
    } else if (clip && audio.readyState >= 2) {
        const expectedTime = currentTime - clip.startTime + clip.trimIn
        const threshold = isPlayingRef.current ? 0.35 : 0.05
        if (Math.abs(audio.currentTime - expectedTime) > threshold) {
            audio.currentTime = expectedTime
        }
    }
  }, [currentTime, timeline.tracks])

  // Video Track Effect
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const { clip, type, isMuted } = getActiveClipAtTime(currentTime)
    video.muted = isMuted
    
    if (clip?.id !== activeClipRef.current?.id || clip?.filePath !== activeClipRef.current?.filePath) {
      activeClipRef.current = clip
      
      if (type === 'image' && clip?.filePath) {
        const img = imgRef.current
        if (img) img.src = toFileUrl(clip.filePath)
        setActiveMode('image')
        video.src = ''
        video.pause()
      } else if (type === 'video' && clip?.filePath) {
        video.src = toFileUrl(clip.filePath)
        video.load()
        const playExpectedTime = () => {
          const expectedTime = currentTimeRef.current - (clip.startTime || 0) + (clip.trimIn || 0)
          video.currentTime = Math.max(0, expectedTime)
          if (isPlayingRef.current) video.play().catch(console.error)
        }
        if (video.readyState >= 2) {
          playExpectedTime()
        } else {
          video.onloadedmetadata = playExpectedTime
        }
        setActiveMode('video')
      } else {
        video.src = ''
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
    } else if (clip && type === 'video' && video.readyState >= 2) {
        const expectedTime = currentTime - clip.startTime + clip.trimIn
        const threshold = isPlayingRef.current ? 0.35 : 0.05
        if (Math.abs(video.currentTime - expectedTime) > threshold) {
            video.currentTime = expectedTime
        }
    }
  }, [currentTime, timeline.tracks])

  // Top level Play/Pause toggling
  useEffect(() => {
    const video = videoRef.current
    const audio = audioRef.current
    
    if (isPlaying) {
      if (video && video.src && video.src !== window.location.href && activeMode === 'video') {
         const vClip = activeClipRef.current
         if (vClip && vClip.type === 'video' && video.readyState >= 2) {
             video.currentTime = currentTimeRef.current - vClip.startTime + vClip.trimIn
         }
         video.play().catch(console.error)
      }
      if (audio && audio.src && audio.src !== window.location.href) {
         const aClip = activeAudioClipRef.current
         if (aClip && audio.readyState >= 2) {
             audio.currentTime = currentTimeRef.current - aClip.startTime + aClip.trimIn
         }
         audio.play().catch(console.error)
      }
    } else {
      if (video) video.pause()
      if (audio) audio.pause()
    }
  }, [isPlaying, activeMode])

  useEffect(() => {
    if (videoRef.current) videoRef.current.volume = 1.0
    if (audioRef.current) audioRef.current.volume = 1.0
  }, [])

  return (
    <div style={{ flex: 1, minHeight: 0, display: 'flex', 
      flexDirection: 'column', backgroundColor: '#0a0a0a',
      overflow: 'hidden' }}>

      <audio ref={audioRef} style={{ display: 'none' }} />

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
          <video
            ref={videoRef}
            style={{
              width: '100%', 
              height: '100%',
              objectFit: 'contain',
              display: activeMode === 'video' ? 'block' : 'none',
              backgroundColor: '#000',
            }}
          />

          <img 
            ref={imgRef}
            alt="preview"
            style={{
              width: '100%', 
              height: '100%',
              objectFit: 'contain',
              display: activeMode === 'image' ? 'block' : 'none',
              backgroundColor: '#000'
            }} 
          />

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

          <canvas
            ref={textCanvasRef}
            width={1920}
            height={1080}
            style={{
              position: 'absolute',
              top: 0, left: 0,
              width: '100%', height: '100%',
              pointerEvents: 'none',
              zIndex: 5,
            }}
          />

          <div style={{ position: 'absolute', top: 8, right: 8,
            background: 'rgba(0,0,0,0.6)', color: '#fff',
            fontSize: 11, padding: '2px 8px', borderRadius: 4, zIndex: 10 }}>
            {resolutionLabel[project.settings.resolution] || '1080p'}
          </div>
        </div>
      </div>

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

      <div style={{ flexShrink: 0, height: 48,
        backgroundColor: '#111', borderTop: '1px solid #2a2a2a',
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', padding: '0 16px' }}>

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

        <div style={{ fontFamily: 'monospace', fontSize: 13,
          color: '#a1a1aa' }}>
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>

        <div style={{ color: '#a1a1aa', fontSize: 16 }}>🔊</div>
      </div>
    </div>
  )
}
