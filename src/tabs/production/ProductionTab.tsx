import { useState } from 'react'
import { useAppStore } from '../../store/app.store'
import { useProduction } from './hooks/useProduction'
import { ChannelSelector } from './ChannelSelector'
import { VideoPerformanceList } from './VideoPerformanceList'
import { CommentAnalysis } from './CommentAnalysis'
import { TrendingTopics } from './TrendingTopics'
import { IdeaSuggestions } from './IdeaSuggestions'

export const ProductionTab = () => {
  const setActiveTab = useAppStore((s) => s.setActiveTab)
  const [activeRightTab, setActiveRightTab] = useState<'analysis' | 'ideas'>('analysis')

  const {
    apiKeysConfigured,
    // Channels
    selectedChannelId,
    setSelectedChannelId,
    selectedChannel,
    // Videos
    videos,
    isLoadingVideos,
    selectedVideoId,
    setSelectedVideoId,
    // Comments & Analysis
    isLoadingComments,
    commentAnalysis,
    isAnalyzing,
    // Trends
    trendingTopics,
    isLoadingTrends,
    // Ideas
    videoIdeas,
    isGeneratingIdeas,
    // Actions
    loadChannelVideos,
    loadComments,
    analyzeComments,
    loadTrending,
    generateIdeas
  } = useProduction()

  // Guard: require API keys
  if (!apiKeysConfigured) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="max-w-md rounded-xl border border-warning/30 bg-warning/5 px-10 py-12 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-warning/20 text-2xl">
            ⚠️
          </div>
          <h1 className="mb-2 text-xl font-bold text-text-primary">
            API Keys Required
          </h1>
          <p className="mb-6 text-sm text-text-secondary leading-relaxed">
            To use Video Production features, you need to configure:
            <br />• YouTube Data API v3 key
            <br />• Google Gemini API key
          </p>
          <button
            onClick={() => setActiveTab('settings')}
            className="rounded-lg bg-accent px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
          >
            Go to Settings
          </button>
        </div>
      </div>
    )
  }

  const handleChannelSelect = (id: string) => {
    setSelectedChannelId(id)
    loadChannelVideos(id)
  }

  const handleVideoSelect = (id: string) => {
    setSelectedVideoId(id)
    loadComments(id)
  }

  const handleAnalyzeClick = async () => {
    if (!selectedChannelId || !selectedChannel) return

    // Ensure we have a video selected to analyze comments from
    if (!selectedVideoId && videos.length > 0) {
      setSelectedVideoId(videos[0].id)
      await loadComments(videos[0].id)
    } else if (selectedVideoId) {
      await loadComments(selectedVideoId)
    }

    // Run parallel AI and YouTube tasks
    await Promise.all([
      analyzeComments(),
      loadTrending(selectedChannel.niche)
    ])

    // Generate ideas dependent on analysis + trends
    await generateIdeas()
  }

  const isWorking =
    isLoadingVideos ||
    isLoadingComments ||
    isAnalyzing ||
    isLoadingTrends ||
    isGeneratingIdeas

  return (
    <div className="flex h-full flex-col">
      {/* Header bar */}
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-surface px-6">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold text-text-primary">
            Video Production
          </h1>
          <div className="h-6 w-px bg-border" />
          <ChannelSelector
            selectedChannelId={selectedChannelId}
            onSelect={handleChannelSelect}
          />
        </div>
        
        <button
          onClick={handleAnalyzeClick}
          disabled={!selectedChannelId || isWorking}
          className="flex items-center gap-2 rounded-lg bg-accent px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isWorking ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          ) : null}
          {isWorking ? 'Processing...' : 'Analyze →'}
        </button>
      </div>

      {/* Main Content: 2 Columns */}
      <div className="flex min-h-0 flex-1">
        
        {/* LEFT COLUMN: Recent Videos (45%) */}
        <div className="w-[45%] border-r border-border bg-background p-6">
          <VideoPerformanceList
            videos={videos}
            isLoading={isLoadingVideos}
            selectedVideoId={selectedVideoId}
            onSelectVideo={handleVideoSelect}
          />
        </div>

        {/* RIGHT COLUMN: Analysis & Ideas (55%) */}
        <div className="flex w-[55%] flex-col bg-surface p-6">
          
          {/* Right Column Tabs */}
          <div className="mb-6 flex gap-1 rounded-lg bg-surface-2 p-1">
            <button
              onClick={() => setActiveRightTab('analysis')}
              className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-colors ${
                activeRightTab === 'analysis'
                  ? 'bg-surface text-text-primary shadow-sm ring-1 ring-border'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Analysis
            </button>
            <button
              onClick={() => setActiveRightTab('ideas')}
              className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-colors ${
                activeRightTab === 'ideas'
                  ? 'bg-surface text-text-primary shadow-sm ring-1 ring-border'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Ideas
            </button>
          </div>

          {/* Right Column Content */}
          <div className="min-h-0 flex-1 overflow-y-auto pr-2">
            {activeRightTab === 'analysis' ? (
              <div className="flex flex-col gap-6 pb-6">
                <CommentAnalysis
                  analysis={commentAnalysis}
                  isLoading={isAnalyzing || isLoadingComments}
                />
                
                {(trendingTopics.length > 0 || isLoadingTrends) && (
                  <TrendingTopics
                    topics={trendingTopics}
                    isLoading={isLoadingTrends}
                    niche={selectedChannel?.niche || ''}
                  />
                )}
              </div>
            ) : (
              <div className="pb-6">
                <IdeaSuggestions
                  ideas={videoIdeas}
                  isLoading={isGeneratingIdeas}
                  hasRunAnalysis={!!commentAnalysis}
                />
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
