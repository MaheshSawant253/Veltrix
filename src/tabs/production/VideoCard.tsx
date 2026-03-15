import type { YouTubeVideo } from '../../types'

interface VideoCardProps {
  video: YouTubeVideo
  isSelected: boolean
  onClick: () => void
}

/**
 * Format a number to a compact string: 1234567 → "1.2M", 12345 → "12.3K"
 */
function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toString()
}

/**
 * Convert ISO date string to relative time: "3 days ago"
 */
function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  const weeks = Math.floor(days / 7)
  const months = Math.floor(days / 30)

  if (months > 0) return `${months}mo ago`
  if (weeks > 0) return `${weeks}w ago`
  if (days > 0) return `${days}d ago`
  if (hours > 0) return `${hours}h ago`
  if (minutes > 0) return `${minutes}m ago`
  return 'just now'
}

export const VideoCard = ({ video, isSelected, onClick }: VideoCardProps) => {
  return (
    <button
      onClick={onClick}
      className={`flex w-full gap-3 rounded-lg border p-3 text-left transition-all hover:bg-surface-2/80 ${
        isSelected
          ? 'border-accent/60 bg-accent/5'
          : 'border-border bg-surface-2 hover:border-border'
      }`}
    >
      {/* Thumbnail */}
      <img
        src={video.thumbnailUrl}
        alt={video.title}
        className="h-[45px] w-[60px] shrink-0 rounded object-cover"
      />

      {/* Content */}
      <div className="min-w-0 flex-1">
        <h4 className="line-clamp-2 text-xs font-medium leading-tight text-text-primary">
          {video.title}
        </h4>
        <p className="mt-1 text-[10px] text-text-secondary">
          {timeAgo(video.publishedAt)} · {video.duration}
        </p>
        <div className="mt-1 flex items-center gap-3 text-[10px] text-text-secondary">
          <span>👁 {formatCount(video.viewCount)}</span>
          <span>👍 {formatCount(video.likeCount)}</span>
          <span>💬 {formatCount(video.commentCount)}</span>
        </div>
      </div>
    </button>
  )
}
