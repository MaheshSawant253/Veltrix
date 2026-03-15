import { useState } from 'react'
import { Volume2, VolumeX, Lock, Unlock, Minus, Plus } from 'lucide-react'
import type { TimelineData } from '../../../types'
import { TimelineRuler } from './TimelineRuler'
import { TimelineTrack } from './TimelineTrack'

interface TimelinePanelProps {
  timeline: TimelineData
  onTimelineUpdate: (timeline: TimelineData) => void
}

export const TimelinePanel = ({
  timeline,
  onTimelineUpdate
}: TimelinePanelProps) => {
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null)
  const [zoom, setZoom] = useState(1)

  const toggleMute = (trackId: string) => {
    const updated = {
      ...timeline,
      tracks: timeline.tracks.map((t) =>
        t.id === trackId ? { ...t, isMuted: !t.isMuted } : t
      )
    }
    onTimelineUpdate(updated)
  }

  const toggleLock = (trackId: string) => {
    const updated = {
      ...timeline,
      tracks: timeline.tracks.map((t) =>
        t.id === trackId ? { ...t, isLocked: !t.isLocked } : t
      )
    }
    onTimelineUpdate(updated)
  }

  return (
    <div className="flex h-60 shrink-0 flex-col border-t border-border bg-[#111]">
      {/* Ruler row */}
      <div className="flex">
        {/* Label column header */}
        <div className="w-[120px] shrink-0 border-b border-r border-[#1e1e1e] bg-[#0f0f0f]" />
        {/* Ruler */}
        <div className="flex-1 overflow-hidden">
          <TimelineRuler duration={timeline.totalDuration} zoom={zoom} />
        </div>
      </div>

      {/* Tracks area */}
      <div className="flex min-h-0 flex-1 overflow-y-auto">
        {/* Track labels column */}
        <div className="w-[120px] shrink-0 border-r border-[#1e1e1e] bg-[#0f0f0f]">
          {timeline.tracks.map((track) => (
            <div
              key={track.id}
              className="flex items-center justify-between border-b border-[#1e1e1e] px-2"
              style={{ height: track.height }}
            >
              <span className="truncate text-[11px] font-medium text-text-secondary">
                {track.label}
              </span>
              <div className="flex gap-0.5">
                <button
                  onClick={() => toggleMute(track.id)}
                  className={`flex h-5 w-5 items-center justify-center rounded text-[10px] transition-colors ${
                    track.isMuted
                      ? 'bg-danger/20 text-danger'
                      : 'text-text-secondary/50 hover:text-text-secondary'
                  }`}
                  title={track.isMuted ? 'Unmute' : 'Mute'}
                >
                  {track.isMuted ? <VolumeX size={10} /> : <Volume2 size={10} />}
                </button>
                <button
                  onClick={() => toggleLock(track.id)}
                  className={`flex h-5 w-5 items-center justify-center rounded text-[10px] transition-colors ${
                    track.isLocked
                      ? 'bg-warning/20 text-warning'
                      : 'text-text-secondary/50 hover:text-text-secondary'
                  }`}
                  title={track.isLocked ? 'Unlock' : 'Lock'}
                >
                  {track.isLocked ? <Lock size={10} /> : <Unlock size={10} />}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Track lanes */}
        <div className="flex-1 overflow-x-auto">
          {timeline.tracks.map((track) => (
            <TimelineTrack
              key={track.id}
              track={track}
              zoom={zoom}
              isSelected={selectedTrackId === track.id}
              onClick={() => setSelectedTrackId(track.id)}
            />
          ))}
        </div>
      </div>

      {/* Zoom controls */}
      <div className="flex h-7 items-center justify-end gap-2 border-t border-[#1e1e1e] bg-[#0f0f0f] px-3">
        <button
          onClick={() => setZoom((z) => Math.max(0.25, z - 0.25))}
          className="text-text-secondary/50 hover:text-text-secondary"
        >
          <Minus size={12} />
        </button>
        <span className="w-10 text-center text-[10px] text-text-secondary">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={() => setZoom((z) => Math.min(4, z + 0.25))}
          className="text-text-secondary/50 hover:text-text-secondary"
        >
          <Plus size={12} />
        </button>
      </div>
    </div>
  )
}
