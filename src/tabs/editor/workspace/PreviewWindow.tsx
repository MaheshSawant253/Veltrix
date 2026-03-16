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
    // Respect mute for text tracks (hidden)
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

  // Ensure text rendering stays up to date when jumping
  useEffect(() => {
    renderTextOverlays(currentTime)
  }, [currentTime, renderTextOverlays])

  // Convert Windows path to file:// URL
  function toFileUrl(filePath: string): string {
    return 'file:///' + filePath.replace(/\\/g, '/').replace(/ /g, '%20')
  }

  // Find active media clip
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

  // Find active audio clip
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

  // Effect 1A: Audio Track loading and seeking
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const { clip, isMuted } = getActiveAudioClipAtTime(currentTime)
    audio.muted = isMuted

    if (clip?.filePath !== activeAudioClipRef.current?.filePath) {
      activeAudioClipRef.current = clip
      if (clip?.filePath) {
        audio.src = toFileUrl(clip.filePath)
        audio.load()
        audio.onloadedmetadata = () => {
          const localTime = currentTime - clip.startTime + clip.trimIn
          audio.currentTime = Math.max(0, localTime)
          if (isPlayingRef.current) {
            audio.play().catch(console.error)
          }
        }
      } else {
        audio.src = ''
        audio.pause()
      }
    } else if (clip && audio.readyState >= 2) {
        const expectedTime = currentTime - clip.startTime + clip.trimIn
        if (Math.abs(audio.currentTime - expectedTime) > 0.3) {
            audio.currentTime = expectedTime
        }
    }
  }, [currentTime, timeline.tracks])

  // Effect 1B: Video Clip loading and seeking
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const { clip, type, isMuted } = getActiveClipAtTime(currentTime)
    video.muted = isMuted
    
    // Check if clip changed
    if (clip?.filePath !== activeClipRef.current?.filePath) {
      activeClipRef.current = clip
      
      if (type === 'image' && clip?.filePath) {
        const img = imgRef.current
        if (img) {
          img.src = toFileUrl(clip.filePath)
        }
        setActiveMode('image')
        video.src = ''
        video.pause()
      } else if (type === 'video' && clip?.filePath) {
        video.src = toFileUrl(clip.filePath)
        video.load()
        // Wait for metadata to be available before seeking
        video.onloadedmetadata = () => {
          const localTime = currentTime - clip.startTime + clip.trimIn
          video.currentTime = Math.max(0, localTime)
          if (isPlayingRef.current) {
            video.play().catch(console.error)
          }
        }
        setActiveMode('video')
      } else {
        // No clip active
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
        // Clip is same, but we might have done a manual seek while paused
        // Since event loop splits these, if currentTime is too far from video time, seek it
        const expectedTime = currentTime - clip.startTime + clip.trimIn
        // If diff > 0.3s (to avoid jitter during playback)
        if (Math.abs(video.currentTime - expectedTime) > 0.3) {
            video.currentTime = expectedTime
        }
    }
  }, [currentTime, timeline.tracks])

  // Effect 2: Play/Pause toggling
  useEffect(() => {
    const video = videoRef.current
    const audio = audioRef.current
    if (!video) return
    
    if (isPlaying) {
      // Only play if it's a valid source, to prevent failed play attempts
      if (video.src && video.src !== window.location.href && activeMode === 'video') {
        video.play().catch(console.error)
      }
      if (audio && audio.src && audio.src !== window.location.href) {
        audio.play().catch(console.error)
      }
    } else {
      video.pause()
      if (audio) audio.pause()
    }
  }, [isPlaying, activeMode])

  // Part C: Track currentTime from video OR explicitly using interval if NO video is present
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleTimeUpdate = () => {
      const clip = activeClipRef.current
      if (!clip) return
      // Only update parent if we are playing to avoid seek loops
      if (isPlayingRef.current) {
          const timelineTime = video.currentTime - clip.trimIn + clip.startTime
          onSeekRef.current(timelineTime)
          renderTextOverlays(timelineTime)
      }
    }

    const handleEnded = () => {
      const clip = activeClipRef.current
      if (!clip) return
      
      const nextTime = clip.startTime + clip.duration
      // Is there more content?
      const hasMoreContent = nextTime < duration
      
      if (hasMoreContent) {
        onSeekRef.current(nextTime)
      } else {
        onSeekRef.current(0)
        onPlayPauseRef.current()
      }
    }

    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('ended', handleEnded)
    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('ended', handleEnded)
    }
  }, [duration, renderTextOverlays])

  // Part D: Unmute volume master controls
  useEffect(() => {
    if (videoRef.current) videoRef.current.volume = 1.0
    if (audioRef.current) audioRef.current.volume = 1.0
  }, [])

  // Fix 5: Continuous playback ticker for images, gaps, & audio-only sections
  useEffect(() => {
    if (!isPlaying) return

    const interval = setInterval(() => {
      const clip = activeClipRef.current;
      const ext = clip?.filePath?.split('.').pop()?.toLowerCase() ?? '';
      const isImage = ['jpg','jpeg','png','webp','gif'].includes(ext) || clip?.type === 'image';
      
      // We manually tick if there's no video clip active
      if (!clip || isImage) {
        const next = currentTimeRef.current + 0.25
        if (next >= duration && duration > 0) {
            onSeekRef.current(0)
            onPlayPauseRef.current()
        } else {
            onSeekRef.current(next)
        }
      }
    }, 250)

    return () => clearInterval(interval)
  }, [isPlaying, duration])

  return (
    <div style={{ flex: 1, minHeight: 0, display: 'flex', 
      flexDirection: 'column', backgroundColor: '#0a0a0a',
      overflow: 'hidden' }}>

      {/* Hidden audio element for the audio track */}
      <audio ref={audioRef} style={{ display: 'none' }} />

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
          {/* Video element — used for video playback */}
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

          {/* Image element (underneath, for images) */}
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

          {/* Canvas — used for empty state */}
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

          {/* Text overlay canvas — ALWAYS on top */}
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

          {/* Resolution badge */}
          <div style={{ position: 'absolute', top: 8, right: 8,
            background: 'rgba(0,0,0,0.6)', color: '#fff',
            fontSize: 11, padding: '2px 8px', borderRadius: 4, zIndex: 10 }}>
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
