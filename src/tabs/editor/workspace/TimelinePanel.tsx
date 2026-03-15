import { useState, useCallback, useRef } from 'react'
import { Volume2, VolumeX, Lock, Unlock, Minus, Plus } from 'lucide-react'
import type { TimelineData, TimelineTrack as TrackType, TimelineClip } from '../../../types'
import { TimelineRuler } from './TimelineRuler'

interface TimelinePanelProps {
  timeline: TimelineData
  onTimelineUpdate: (timeline: TimelineData) => void
  currentTime: number
  onSeek: (time: number) => void
}

const TRACK_COLORS: Record<string, { bg: string; border: string }> = {
  video: { bg: 'rgba(99,102,241,0.2)', border: '#6366f1' },
  audio: { bg: 'rgba(34,197,94,0.2)', border: '#22c55e' },
  text: { bg: 'rgba(245,158,11,0.2)', border: '#f59e0b' }
}

const STRIP_COLORS: Record<string, string> = {
  video: '#6366f1',
  audio: '#22c55e',
  text: '#f59e0b'
}

interface DragState {
  type: 'move' | 'trim-left' | 'trim-right'
  trackId: string
  clipId: string
  startMouseX: number
  originalClip: TimelineClip
}

const ClipBlock = ({
  clip,
  track,
  pxPerSec,
  onDragStart
}: {
  clip: TimelineClip
  track: TrackType
  pxPerSec: number
  onDragStart: (e: React.MouseEvent, type: DragState['type']) => void
}) => {
  const colors = TRACK_COLORS[track.type] || TRACK_COLORS.video
  const width = Math.max(clip.duration * pxPerSec, 4)
  const left = clip.startTime * pxPerSec

  return (
    <div
      className="absolute top-1 cursor-grab select-none overflow-hidden rounded"
      style={{
        left,
        width,
        height: track.height - 8,
        background: colors.bg,
        border: `1px solid ${colors.border}`
      }}
      onMouseDown={(e) => {
        e.stopPropagation()
        onDragStart(e, 'move')
      }}
    >
      {/* Left trim handle */}
      <div
        className="absolute left-0 top-0 h-full w-1.5 cursor-ew-resize"
        style={{ background: colors.border + '60' }}
        onMouseDown={(e) => {
          e.stopPropagation()
          onDragStart(e, 'trim-left')
        }}
      />
      {/* Clip label */}
      {width > 60 && (
        <div className="truncate px-2 py-1 text-[10px] text-white/80">
          {clip.name}
        </div>
      )}
      {/* Right trim handle */}
      <div
        className="absolute right-0 top-0 h-full w-1.5 cursor-ew-resize"
        style={{ background: colors.border + '60' }}
        onMouseDown={(e) => {
          e.stopPropagation()
          onDragStart(e, 'trim-right')
        }}
      />
    </div>
  )
}

export const TimelinePanel = ({
  timeline,
  onTimelineUpdate,
  currentTime,
  onSeek
}: TimelinePanelProps) => {
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null)
  const [zoom, setZoom] = useState(1)
  const dragRef = useRef<DragState | null>(null)
  const pxPerSec = 80 * zoom

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

  const handleRulerClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect()
      const x = e.clientX - rect.left
      const time = Math.max(0, x / pxPerSec)
      onSeek(time)
    },
    [pxPerSec, onSeek]
  )

  const startClipDrag = useCallback(
    (e: React.MouseEvent, type: DragState['type'], trackId: string, clip: TimelineClip) => {
      e.preventDefault()
      dragRef.current = {
        type,
        trackId,
        clipId: clip.id,
        startMouseX: e.clientX,
        originalClip: { ...clip }
      }

      const handleMouseMove = (me: MouseEvent) => {
        const drag = dragRef.current
        if (!drag) return
        const deltaX = me.clientX - drag.startMouseX
        const deltaSec = deltaX / pxPerSec

        const updatedTimeline = { ...timeline }
        const trackIdx = updatedTimeline.tracks.findIndex((t) => t.id === drag.trackId)
        if (trackIdx === -1) return
        const track = { ...updatedTimeline.tracks[trackIdx] }
        const clipIdx = track.clips.findIndex((c) => c.id === drag.clipId)
        if (clipIdx === -1) return
        const newClip = { ...drag.originalClip }

        if (drag.type === 'move') {
          newClip.startTime = Math.max(0, drag.originalClip.startTime + deltaSec)
        } else if (drag.type === 'trim-left') {
          const maxTrim = drag.originalClip.duration - 0.5
          const actualDelta = Math.min(deltaSec, maxTrim)
          newClip.trimIn = Math.max(0, drag.originalClip.trimIn + actualDelta)
          newClip.startTime = drag.originalClip.startTime + actualDelta
          newClip.duration = Math.max(0.5, drag.originalClip.duration - actualDelta)
        } else if (drag.type === 'trim-right') {
          newClip.duration = Math.max(0.5, drag.originalClip.duration + deltaSec)
          newClip.trimOut = Math.max(0, drag.originalClip.trimOut - deltaSec)
        }

        track.clips = [...track.clips]
        track.clips[clipIdx] = newClip
        updatedTimeline.tracks = [...updatedTimeline.tracks]
        updatedTimeline.tracks[trackIdx] = track

        // Recalculate total duration
        let maxEnd = 0
        for (const t of updatedTimeline.tracks) {
          for (const c of t.clips) {
            maxEnd = Math.max(maxEnd, c.startTime + c.duration)
          }
        }
        updatedTimeline.totalDuration = maxEnd

        onTimelineUpdate(updatedTimeline)
      }

      const handleMouseUp = () => {
        dragRef.current = null
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }

      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    },
    [timeline, pxPerSec, onTimelineUpdate]
  )

  const playheadLeft = currentTime * pxPerSec

  return (
    <div className="flex h-60 shrink-0 flex-col border-t border-border bg-[#111]">
      {/* Ruler row */}
      <div className="flex">
        <div className="w-[120px] shrink-0 border-b border-r border-[#1e1e1e] bg-[#0f0f0f]" />
        <div className="relative flex-1 cursor-crosshair overflow-hidden" onClick={handleRulerClick}>
          <TimelineRuler duration={timeline.totalDuration} zoom={zoom} />
          {/* Playhead on ruler */}
          <div
            className="absolute top-0 h-full w-0.5 bg-[#ef4444]"
            style={{ left: playheadLeft, zIndex: 10 }}
          />
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
        <div className="relative flex-1 overflow-x-auto">
          {/* Playhead line across tracks */}
          <div
            className="absolute top-0 h-full w-0.5 bg-[#ef4444] pointer-events-none"
            style={{ left: playheadLeft, zIndex: 10 }}
          />
          {timeline.tracks.map((track) => (
            <div
              key={track.id}
              onClick={() => setSelectedTrackId(track.id)}
              className={`relative cursor-pointer border-b transition-colors ${
                selectedTrackId === track.id ? 'bg-[#161616]' : 'bg-[#111]'
              }`}
              style={{ height: track.height, borderColor: '#1e1e1e' }}
            >
              {/* Color strip */}
              <div
                className="absolute left-0 top-0 h-full w-[3px]"
                style={{ backgroundColor: STRIP_COLORS[track.type] || '#6366f1' }}
              />

              {/* Clips */}
              {track.clips.map((clip) => (
                <ClipBlock
                  key={clip.id}
                  clip={clip}
                  track={track}
                  pxPerSec={pxPerSec}
                  onDragStart={(e, type) => startClipDrag(e, type, track.id, clip)}
                />
              ))}

              {/* Empty state */}
              {track.clips.length === 0 && (
                <div className="flex h-full items-center justify-center">
                  <div className="rounded border border-dashed border-[#2a2a2a] px-4 py-1">
                    <span className="text-[10px] text-[#3a3a3a]">Drop media here</span>
                  </div>
                </div>
              )}
            </div>
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
