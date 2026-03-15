import type { TrendingTopic } from '../../types'

interface TrendingTopicsProps {
  topics: TrendingTopic[]
  isLoading: boolean
  niche: string
}

/**
 * Format view count: 1250000 -> "1.2M", 15000 -> "15K"
 */
function formatViews(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`
  return count.toString()
}

/**
 * Format relative date string
 */
function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  return `${days}d ago`
}

export const TrendingTopics = ({ topics, isLoading, niche }: TrendingTopicsProps) => {
  return (
    <div className="rounded-xl border border-border bg-surface-2 p-5 text-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold text-text-primary">
          Trending in {niche || 'Niche'}
        </h3>
        <span className="text-xs text-text-secondary">Last 7 days</span>
      </div>

      <div className="max-h-[280px] overflow-y-auto pr-2">
        <div className="flex flex-col gap-3">
          {isLoading ? (
            // Skeleton loader
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex animate-pulse items-center gap-3">
                <div className="text-xs text-text-secondary opacity-50">#{i + 1}</div>
                <div className="h-[30px] w-[40px] shrink-0 rounded bg-border" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-full rounded bg-border" />
                  <div className="h-2 w-1/2 rounded bg-border" />
                </div>
              </div>
            ))
          ) : topics.length === 0 ? (
            <p className="text-center text-xs text-text-secondary py-4">
              No trending topics found for this niche.
            </p>
          ) : (
            // Data list
            topics.slice(0, 10).map((topic, i) => (
              <div key={topic.videoId} className="flex items-center gap-3 group">
                <div className="w-4 shrink-0 text-center text-xs font-medium text-text-secondary">
                  {i + 1}
                </div>
                
                <img
                  src={topic.thumbnailUrl}
                  alt={topic.title}
                  className="h-[30px] w-[40px] shrink-0 rounded object-cover"
                />
                
                <div className="min-w-0 flex-1">
                  <h4 className="truncate text-xs font-medium text-text-primary group-hover:text-accent transition-colors">
                    <a
                      href={`https://youtube.com/watch?v=${topic.videoId}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {topic.title}
                    </a>
                  </h4>
                  <div className="mt-0.5 flex items-center gap-2 text-[10px] text-text-secondary">
                    <span className="truncate max-w-[100px]">{topic.channelTitle}</span>
                    <span>·</span>
                    <span>{formatViews(topic.viewCount)} views</span>
                    <span>·</span>
                    <span>{timeAgo(topic.publishedAt)}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
