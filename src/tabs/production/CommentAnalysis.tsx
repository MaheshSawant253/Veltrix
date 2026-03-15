import type { CommentAnalysis as ICommentAnalysis } from '../../types'

interface CommentAnalysisProps {
  analysis: ICommentAnalysis | null
  isLoading: boolean
}

export const CommentAnalysis = ({ analysis, isLoading }: CommentAnalysisProps) => {
  if (isLoading) {
    return (
      <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-border bg-surface-2 p-6 text-center">
        <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent"></div>
        <p className="text-sm text-text-secondary">AI is analyzing comments...</p>
      </div>
    )
  }

  if (!analysis) return null

  const sentimentColor = {
    positive: 'bg-success',
    neutral: 'bg-text-secondary',
    negative: 'bg-danger',
    mixed: 'bg-warning'
  }[analysis.sentiment]

  return (
    <div className="rounded-xl border border-border bg-surface-2 p-5 text-sm">
      <div className="mb-5 flex items-center justify-between">
        <h3 className="font-semibold text-text-primary">Comment Analysis</h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-secondary">Sentiment:</span>
          <div className="flex items-center gap-1.5 rounded-full border border-border bg-surface px-2.5 py-1">
            <div className={`h-2 w-2 rounded-full ${sentimentColor}`} />
            <span className="text-xs font-medium capitalize text-text-primary">
              {analysis.sentiment}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-5">
        <div>
          <h4 className="mb-2 text-xs font-medium text-text-secondary">Top Themes</h4>
          <div className="flex flex-wrap gap-2">
            {analysis.topThemes.map((theme, i) => (
              <span
                key={i}
                className="rounded-full border border-[#333] bg-[#222] px-2.5 py-1 text-xs text-text-primary"
              >
                {theme}
              </span>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="mb-2 text-xs font-medium text-text-secondary">
              What Audience Wants
            </h4>
            <ul className="space-y-1.5 pl-4 text-xs text-text-primary">
              {analysis.audienceRequests.map((req, i) => (
                <li key={i} className="list-disc leading-relaxed">
                  {req}
                </li>
              ))}
              {analysis.audienceRequests.length === 0 && (
                <li className="text-text-secondary pl-0 list-none">No clear requests found</li>
              )}
            </ul>
          </div>
          <div>
            <h4 className="mb-2 text-xs font-medium text-text-secondary">
              Pain Points
            </h4>
            <ul className="space-y-1.5 pl-4 text-xs text-text-primary">
              {analysis.painPoints.map((pain, i) => (
                <li key={i} className="list-disc leading-relaxed text-danger/90">
                  {pain}
                </li>
              ))}
              {analysis.painPoints.length === 0 && (
                <li className="text-text-secondary pl-0 list-none">No pain points found</li>
              )}
            </ul>
          </div>
        </div>

        <div className="rounded-lg bg-surface p-3">
          <h4 className="mb-1 text-xs font-medium text-text-secondary">Summary</h4>
          <p className="text-xs leading-relaxed text-text-primary">
            {analysis.summary}
          </p>
        </div>
      </div>
    </div>
  )
}
