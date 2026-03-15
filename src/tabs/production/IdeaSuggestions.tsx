import { useAppStore } from '../../store/app.store'
import type { VideoIdea } from '../../types'

interface IdeaSuggestionsProps {
  ideas: VideoIdea[]
  isLoading: boolean
  hasRunAnalysis: boolean
}

export const IdeaSuggestions = ({
  ideas,
  isLoading,
  hasRunAnalysis
}: IdeaSuggestionsProps) => {
  const setPendingVideoIdea = useAppStore((s) => s.setPendingVideoIdea)
  const setActiveTab = useAppStore((s) => s.setActiveTab)

  const handleUseIdea = (idea: VideoIdea) => {
    setPendingVideoIdea(idea)
    setActiveTab('editor')
  }

  if (isLoading) {
    return (
      <div className="flex h-[500px] flex-col items-center justify-center rounded-xl border border-border bg-surface-2 p-6 text-center">
        <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent"></div>
        <p className="text-sm text-text-secondary">Generating personalized ideas...</p>
      </div>
    )
  }

  if (!hasRunAnalysis && ideas.length === 0) {
    return (
      <div className="flex h-[500px] flex-col items-center justify-center rounded-xl border border-dashed border-border py-12 text-center text-text-secondary">
        <span className="mb-2 text-2xl opacity-50">💡</span>
        <p className="text-sm">Run analysis first to generate ideas</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {ideas.map((idea, i) => (
        <div
          key={idea.id || i}
          className="flex flex-col rounded-xl border border-border bg-surface-2 p-5 text-sm transition-colors hover:border-accent/30"
        >
          {/* Header */}
          <div className="mb-3 flex items-start gap-3">
            <span className="text-xl">💡</span>
            <div className="flex-1">
              <h3 className="font-semibold text-text-primary leading-tight">
                {idea.title}
              </h3>
              <div className="mt-2 inline-block rounded bg-accent/15 px-2 py-0.5 text-[10px] font-medium text-accent">
                {idea.targetKeyword}
              </div>
            </div>
          </div>

          {/* Description */}
          <p className="mb-4 text-xs leading-relaxed text-text-secondary">
            {idea.description}
          </p>

          {/* Stats & Reason */}
          <div className="mb-4 rounded-lg bg-surface p-3 text-xs">
            <div className="mb-2 flex justify-between">
              <span className="text-text-secondary">Est. Views:</span>
              <span className="font-medium text-success">{idea.estimatedViews}</span>
            </div>
            <div>
              <span className="mb-1 block text-text-secondary">Why:</span>
              <span className="text-text-primary">{idea.reasonForSuggestion}</span>
            </div>
          </div>

          {/* Outline */}
          <div className="mb-5">
            <h4 className="mb-2 text-xs font-medium text-text-secondary">Outline:</h4>
            <ol className="list-decimal space-y-1 pl-4 text-xs text-text-primary">
              {idea.outline.map((point, idx) => (
                <li key={idx} className="pl-1">
                  {point}
                </li>
              ))}
            </ol>
          </div>

          {/* Action */}
          <button
            onClick={() => handleUseIdea(idea)}
            className="mt-auto w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
          >
            Use This Idea →
          </button>
        </div>
      ))}
    </div>
  )
}
