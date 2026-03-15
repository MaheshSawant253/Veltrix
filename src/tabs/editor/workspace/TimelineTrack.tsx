import type { TimelineTrack as TrackType } from '../../../types'

interface TimelineTrackProps {
  track: TrackType
  zoom: number
  isSelected: boolean
  onClick: () => void
}

const trackColors: Record<string, string> = {
  video: '#6366f1',
  audio: '#22c55e',
  text: '#f59e0b'
}

export const TimelineTrack = ({
  track,
  isSelected,
  onClick
}: TimelineTrackProps) => {
  const color = trackColors[track.type] || '#6366f1'

  return (
    <div
      onClick={onClick}
      className={`flex cursor-pointer border-b transition-colors ${
        isSelected ? 'bg-[#161616]' : 'bg-[#111]'
      }`}
      style={{ height: track.height, borderColor: '#1e1e1e' }}
    >
      {/* Color strip */}
      <div className="w-[3px] shrink-0" style={{ backgroundColor: color }} />

      {/* Clip lane */}
      <div className="flex flex-1 items-center justify-center">
        {track.clips.length === 0 ? (
          <div className="rounded border border-dashed border-[#2a2a2a] px-4 py-1">
            <span className="text-[10px] text-[#3a3a3a]">Drop media here</span>
          </div>
        ) : null}
      </div>
    </div>
  )
}
