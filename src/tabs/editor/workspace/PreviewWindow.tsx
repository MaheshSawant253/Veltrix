import type { VideoProject } from '../../../types'
import {
  SkipBack,
  Rewind,
  Play,
  FastForward,
  SkipForward,
  Volume2,
  Maximize
} from 'lucide-react'

interface PreviewWindowProps {
  project: VideoProject
}

const resolutionLabel: Record<string, string> = {
  '1920x1080': '1080p',
  '1280x720': '720p',
  '3840x2160': '4K'
}

export const PreviewWindow = ({ project }: PreviewWindowProps) => {
  const aspectRatio = project.settings.aspectRatio

  return (
    // Outer container — fills available space, column flex
    <div style={{
      flex: 1,
      minHeight: 0,
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#0a0a0a',
      overflow: 'hidden'
    }}>

      {/* Canvas area — grows, shrinks, never overflows */}
      <div style={{
        flex: 1,
        minHeight: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        position: 'relative',
        padding: 8
      }}>

        {/* Aspect ratio box */}
        <div style={{
          position: 'relative',
          width: '100%',
          maxHeight: '100%',
          aspectRatio: aspectRatio.replace(':', '/')
        }}>
          <canvas
            id="preview-canvas"
            style={{
              width: '100%',
              height: '100%',
              display: 'block',
              backgroundColor: '#000',
              borderRadius: 4
            }}
          />
          {/* Resolution badge */}
          <div style={{
            position: 'absolute',
            top: 8,
            right: 8,
            background: 'rgba(0,0,0,0.6)',
            color: '#fff',
            fontSize: 11,
            padding: '2px 8px',
            borderRadius: 4
          }}>
            {resolutionLabel[project.settings.resolution] || '1080p'}
          </div>
        </div>
      </div>

      {/* Controls bar — NEVER compress this */}
      <div style={{
        flexShrink: 0,
        height: 48,
        backgroundColor: '#111',
        borderTop: '1px solid #2a2a2a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px'
      }}>

        {/* Left: playback buttons */}
        <div className="flex items-center gap-2">
          {[SkipBack, Rewind, Play, FastForward, SkipForward].map(
            (Icon, i) => (
              <button
                key={i}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-text-secondary transition-colors hover:bg-white/10 hover:text-text-primary"
              >
                <Icon size={14} />
              </button>
            )
          )}
        </div>

        {/* Center: timecode */}
        <span className="font-mono text-[13px] text-text-secondary">
          00:00:00 / 00:00:00
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
