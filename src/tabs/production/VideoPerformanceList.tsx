import type { YouTubeVideo } from '../../types'
import { VideoCard } from './VideoCard'

interface VideoPerformanceListProps {
  videos: YouTubeVideo[]
  isLoading: boolean
  selectedVideoId: string | null
  onSelectVideo: (videoId: string) => void
}

export const VideoPerformanceList = ({
  videos,
  isLoading,
  selectedVideoId,
  onSelectVideo
}: VideoPerformanceListProps) => {
  return (
    <div className="flex h-full flex-col">
      <h3 className="mb-4 text-sm font-semibold text-text-primary">
        Recent Videos (last 10)
      </h3>

      <div className="flex-1 overflow-y-auto pr-2">
        <div className="flex flex-col gap-2">
          {isLoading ? (
            // Loading Skeletons
            Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="flex animate-pulse gap-3 rounded-lg border border-border bg-surface-2 p-3"
              >
                <div className="h-[45px] w-[60px] rounded bg-border" />
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-3 w-3/4 rounded bg-border" />
                  <div className="h-3 w-1/2 rounded bg-border" />
                </div>
              </div>
            ))
          ) : videos.length === 0 ? (
            // Empty State
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-12 text-center">
              <span className="mb-2 text-2xl opacity-50">🎬</span>
              <p className="text-sm text-text-secondary">
                Select a channel and click Analyze
              </p>
            </div>
          ) : (
            // Data
            videos.map((video) => (
              <VideoCard
                key={video.id}
                video={video}
                isSelected={video.id === selectedVideoId}
                onClick={() => onSelectVideo(video.id)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  )
}
