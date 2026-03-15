import { useState, useEffect, useCallback } from 'react'
import type {
  YouTubeVideo,
  VideoComment,
  CommentAnalysis,
  TrendingTopic,
  VideoIdea,
  Channel
} from '../../../types'
import { youtubeService } from '../../../services/youtube.service'
import { aiService } from '../../../services/ai.service'
import { channelService } from '../../../services/channel.service'

interface SettingsRow {
  key: string
  value: string
}

export const useProduction = () => {
  // ── API keys ──
  const [youtubeApiKey, setYoutubeApiKey] = useState('')
  const [geminiApiKey, setGeminiApiKey] = useState('')
  const [apiKeysConfigured, setApiKeysConfigured] = useState(false)

  // ── Channels ──
  const [channels, setChannels] = useState<Channel[]>([])
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null)

  // ── Videos ──
  const [videos, setVideos] = useState<YouTubeVideo[]>([])
  const [isLoadingVideos, setIsLoadingVideos] = useState(false)

  // ── Selected video ──
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null)

  // ── Comments ──
  const [comments, setComments] = useState<VideoComment[]>([])
  const [isLoadingComments, setIsLoadingComments] = useState(false)

  // ── Comment analysis ──
  const [commentAnalysis, setCommentAnalysis] = useState<CommentAnalysis | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  // ── Trending ──
  const [trendingTopics, setTrendingTopics] = useState<TrendingTopic[]>([])
  const [isLoadingTrends, setIsLoadingTrends] = useState(false)

  // ── Video ideas ──
  const [videoIdeas, setVideoIdeas] = useState<VideoIdea[]>([])
  const [isGeneratingIdeas, setIsGeneratingIdeas] = useState(false)

  // ── Error ──
  const [error, setError] = useState<string | null>(null)

  // ── Load API keys from DB on mount ──
  useEffect(() => {
    const loadKeys = async () => {
      try {
        const ytRows = (await window.veltrix.db.query(
          "SELECT value FROM settings WHERE key = 'youtube_api_key'"
        )) as SettingsRow[]
        const geminiRows = (await window.veltrix.db.query(
          "SELECT value FROM settings WHERE key = 'gemini_api_key'"
        )) as SettingsRow[]

        const yt = ytRows.length > 0 ? ytRows[0].value : ''
        const gm = geminiRows.length > 0 ? geminiRows[0].value : ''

        setYoutubeApiKey(yt)
        setGeminiApiKey(gm)
        setApiKeysConfigured(yt.length > 0 && gm.length > 0)
      } catch (err) {
        console.error('Failed to load API keys:', err)
        setApiKeysConfigured(false)
      }
    }
    loadKeys()
  }, [])

  // ── Load channels from DB on mount ──
  useEffect(() => {
    const loadChannels = async () => {
      try {
        const all = await channelService.getAll()
        setChannels(all.filter((c) => c.youtubeChannelId.length > 0))
      } catch (err) {
        console.error('Failed to load channels:', err)
      }
    }
    loadChannels()
  }, [])

  // ── Get the selected channel object ──
  const selectedChannel = channels.find((c) => c.id === selectedChannelId) || null

  // ── Actions ──

  const loadChannelVideos = useCallback(
    async (channelId: string) => {
      setIsLoadingVideos(true)
      setError(null)
      try {
        const channel = channels.find((c) => c.id === channelId)
        if (!channel) throw new Error('Channel not found')

        const vids = await youtubeService.getRecentVideos(
          channel.youtubeChannelId,
          youtubeApiKey
        )
        setVideos(vids)
        if (vids.length > 0) {
          setSelectedVideoId(vids[0].id)
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to load videos'
        setError(msg)
      } finally {
        setIsLoadingVideos(false)
      }
    },
    [channels, youtubeApiKey]
  )

  const loadComments = useCallback(
    async (videoId: string) => {
      setIsLoadingComments(true)
      setError(null)
      try {
        const result = await youtubeService.getVideoComments(videoId, youtubeApiKey)
        setComments(result)
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to load comments'
        setError(msg)
      } finally {
        setIsLoadingComments(false)
      }
    },
    [youtubeApiKey]
  )

  const analyzeComments = useCallback(async () => {
    if (comments.length === 0 || !selectedChannel) return
    setIsAnalyzing(true)
    setError(null)
    try {
      const analysis = await aiService.analyzeComments(
        comments,
        selectedChannel.niche,
        geminiApiKey
      )
      setCommentAnalysis(analysis)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to analyze comments'
      setError(msg)
    } finally {
      setIsAnalyzing(false)
    }
  }, [comments, selectedChannel, geminiApiKey])

  const loadTrending = useCallback(
    async (niche: string) => {
      setIsLoadingTrends(true)
      setError(null)
      try {
        const topics = await youtubeService.getTrendingInNiche(niche, youtubeApiKey)
        setTrendingTopics(topics)
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to load trends'
        setError(msg)
      } finally {
        setIsLoadingTrends(false)
      }
    },
    [youtubeApiKey]
  )

  const generateIdeas = useCallback(async () => {
    if (!selectedChannel || !commentAnalysis) return
    setIsGeneratingIdeas(true)
    setError(null)
    try {
      const ideas = await aiService.generateVideoIdeas({
        channelNiche: selectedChannel.niche,
        channelName: selectedChannel.name,
        editingStyle: selectedChannel.editingStyle,
        toneOfVoice: selectedChannel.toneOfVoice,
        targetAudience: selectedChannel.targetAudience,
        commentAnalysis,
        trendingTopics,
        recentVideoTitles: videos.map((v) => v.title),
        apiKey: geminiApiKey
      })
      setVideoIdeas(ideas)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to generate ideas'
      setError(msg)
    } finally {
      setIsGeneratingIdeas(false)
    }
  }, [selectedChannel, commentAnalysis, trendingTopics, videos, geminiApiKey])

  return {
    // API keys
    youtubeApiKey,
    geminiApiKey,
    apiKeysConfigured,

    // Channels
    channels,
    selectedChannelId,
    setSelectedChannelId,
    selectedChannel,

    // Videos
    videos,
    isLoadingVideos,
    selectedVideoId,
    setSelectedVideoId,

    // Comments
    comments,
    isLoadingComments,

    // Analysis
    commentAnalysis,
    isAnalyzing,

    // Trending
    trendingTopics,
    isLoadingTrends,

    // Ideas
    videoIdeas,
    isGeneratingIdeas,

    // Error
    error,

    // Actions
    loadChannelVideos,
    loadComments,
    analyzeComments,
    loadTrending,
    generateIdeas
  }
}
