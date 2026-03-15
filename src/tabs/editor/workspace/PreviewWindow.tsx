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

const aspectPadding: Record<string, string> = {
  '16:9': '56.25%',
  '9:16': '177.78%',
  '1:1': '100%'
}

export const PreviewWindow = ({ project }: PreviewWindowProps) => {
  const padding = aspectPadding[project.settings.aspectRatio] || '56.25%'

  return (
    <div className="flex flex-1 flex-col items-center justify-center overflow-hidden bg-[#0a0a0a] p-4">
      {/* Canvas container */}
      <div className="relative w-full" style={{ maxWidth: project.settings.aspectRatio === '9:16' ? 280 : 640 }}>
        {/* Aspect ratio container */}
        <div className="relative w-full" style={{ paddingBottom: padding }}>
          <canvas
            id="preview-canvas"
            className="absolute inset-0 h-full w-full rounded bg-black"
          />

          {/* Resolution badge */}
          <div className="absolute right-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white">
            {resolutionLabel[project.settings.resolution] || '1080p'}
          </div>
        </div>

        {/* Playback controls */}
        <div className="mt-3 flex items-center justify-between rounded-lg bg-[#111] px-3 py-2">
          {/* Left: transport controls */}
          <div className="flex items-center gap-1">
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
          <span className="font-mono text-xs text-text-secondary">
            00:00:00 / 00:00:00
          </span>

          {/* Right: volume + fullscreen */}
          <div className="flex items-center gap-1">
            <button className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-text-secondary transition-colors hover:bg-white/10 hover:text-text-primary">
              <Volume2 size={14} />
            </button>
            <button className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-text-secondary transition-colors hover:bg-white/10 hover:text-text-primary">
              <Maximize size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
