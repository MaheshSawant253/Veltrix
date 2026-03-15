import axios from 'axios'
import type { YouTubeVideo, VideoComment, TrendingTopic } from '../types'

const BASE_URL = 'https://www.googleapis.com/youtube/v3'

/**
 * Parse ISO 8601 duration (e.g. PT1H2M30S) to human-readable string.
 */
function parseISO8601Duration(iso: string): string {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!match) return '0:00'

  const hours = parseInt(match[1] || '0', 10)
  const minutes = parseInt(match[2] || '0', 10)
  const seconds = parseInt(match[3] || '0', 10)

  const paddedSeconds = seconds.toString().padStart(2, '0')

  if (hours > 0) {
    const paddedMinutes = minutes.toString().padStart(2, '0')
    return `${hours}:${paddedMinutes}:${paddedSeconds}`
  }

  return `${minutes}:${paddedSeconds}`
}

/**
 * Map YouTube API errors to structured error messages.
 */
function handleApiError(error: unknown, context: string): never {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status
    const message = error.response?.data?.error?.message || error.message

    if (!error.response) {
      throw new Error('MISSING_API_KEY')
    }
    if (status === 403) {
      throw new Error('QUOTA_EXCEEDED')
    }
    if (status === 404) {
      throw new Error('CHANNEL_NOT_FOUND')
    }
    throw new Error(`YOUTUBE_API_ERROR: ${context} - ${message}`)
  }
  throw new Error(`YOUTUBE_API_ERROR: ${context} - ${String(error)}`)
}

export const youtubeService = {
  /**
   * Fetch channel details by YouTube Channel ID.
   */
  async getChannelDetails(
    channelId: string,
    apiKey: string
  ): Promise<{
    title: string
    subscriberCount: number
    videoCount: number
    viewCount: number
    thumbnailUrl: string
  }> {
    if (!apiKey) throw new Error('MISSING_API_KEY')

    try {
      const { data } = await axios.get(`${BASE_URL}/channels`, {
        params: {
          part: 'statistics,snippet',
          id: channelId,
          key: apiKey
        }
      })

      if (!data.items || data.items.length === 0) {
        throw new Error('CHANNEL_NOT_FOUND')
      }

      const item = data.items[0]
      return {
        title: item.snippet.title,
        subscriberCount: parseInt(item.statistics.subscriberCount || '0', 10),
        videoCount: parseInt(item.statistics.videoCount || '0', 10),
        viewCount: parseInt(item.statistics.viewCount || '0', 10),
        thumbnailUrl: item.snippet.thumbnails?.default?.url || ''
      }
    } catch (err) {
      if (err instanceof Error && (err.message === 'CHANNEL_NOT_FOUND' || err.message === 'MISSING_API_KEY')) {
        throw err
      }
      handleApiError(err, 'getChannelDetails')
    }
  },

  /**
   * Fetch last 10 videos from a channel.
   */
  async getRecentVideos(channelId: string, apiKey: string): Promise<YouTubeVideo[]> {
    if (!apiKey) throw new Error('MISSING_API_KEY')

    try {
      // Step 1: Search for recent videos
      const { data: searchData } = await axios.get(`${BASE_URL}/search`, {
        params: {
          part: 'snippet',
          channelId,
          order: 'date',
          maxResults: 10,
          type: 'video',
          key: apiKey
        }
      })

      if (!searchData.items || searchData.items.length === 0) {
        return []
      }

      const videoIds = searchData.items.map((item: { id: { videoId: string } }) => item.id.videoId).join(',')

      // Step 2: Get full statistics + contentDetails
      const { data: videoData } = await axios.get(`${BASE_URL}/videos`, {
        params: {
          part: 'statistics,contentDetails,snippet',
          id: videoIds,
          key: apiKey
        }
      })

      return videoData.items.map(
        (item: {
          id: string
          snippet: { title: string; description: string; thumbnails: { medium: { url: string } }; publishedAt: string }
          statistics: { viewCount: string; likeCount: string; commentCount: string }
          contentDetails: { duration: string }
        }): YouTubeVideo => ({
          id: item.id,
          title: item.snippet.title,
          description: item.snippet.description,
          thumbnailUrl: item.snippet.thumbnails?.medium?.url || '',
          publishedAt: item.snippet.publishedAt,
          viewCount: parseInt(item.statistics.viewCount || '0', 10),
          likeCount: parseInt(item.statistics.likeCount || '0', 10),
          commentCount: parseInt(item.statistics.commentCount || '0', 10),
          duration: parseISO8601Duration(item.contentDetails.duration)
        })
      )
    } catch (err) {
      if (err instanceof Error && err.message === 'MISSING_API_KEY') throw err
      handleApiError(err, 'getRecentVideos')
    }
  },

  /**
   * Fetch top 20 comments from a video.
   */
  async getVideoComments(videoId: string, apiKey: string): Promise<VideoComment[]> {
    if (!apiKey) throw new Error('MISSING_API_KEY')

    try {
      const { data } = await axios.get(`${BASE_URL}/commentThreads`, {
        params: {
          part: 'snippet',
          videoId,
          maxResults: 20,
          order: 'relevance',
          key: apiKey
        }
      })

      if (!data.items) return []

      return data.items.map(
        (item: {
          id: string
          snippet: {
            topLevelComment: {
              snippet: { textDisplay: string; likeCount: number; publishedAt: string }
            }
          }
        }): VideoComment => ({
          id: item.id,
          text: item.snippet.topLevelComment.snippet.textDisplay,
          likeCount: item.snippet.topLevelComment.snippet.likeCount,
          publishedAt: item.snippet.topLevelComment.snippet.publishedAt
        })
      )
    } catch (err) {
      if (err instanceof Error && err.message === 'MISSING_API_KEY') throw err
      handleApiError(err, 'getVideoComments')
    }
  },

  /**
   * Search trending videos in a niche (last 7 days).
   */
  async getTrendingInNiche(niche: string, apiKey: string): Promise<TrendingTopic[]> {
    if (!apiKey) throw new Error('MISSING_API_KEY')

    const publishedAfter = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

    try {
      const { data } = await axios.get(`${BASE_URL}/search`, {
        params: {
          part: 'snippet',
          q: niche,
          order: 'viewCount',
          maxResults: 10,
          type: 'video',
          publishedAfter,
          regionCode: 'US',
          key: apiKey
        }
      })

      if (!data.items) return []

      // Get view counts for the found videos
      const videoIds = data.items.map((item: { id: { videoId: string } }) => item.id.videoId).join(',')

      const { data: statsData } = await axios.get(`${BASE_URL}/videos`, {
        params: {
          part: 'statistics',
          id: videoIds,
          key: apiKey
        }
      })

      const statsMap = new Map<string, number>()
      statsData.items?.forEach((item: { id: string; statistics: { viewCount: string } }) => {
        statsMap.set(item.id, parseInt(item.statistics.viewCount || '0', 10))
      })

      return data.items.map(
        (item: {
          id: { videoId: string }
          snippet: {
            title: string
            channelTitle: string
            thumbnails: { default: { url: string } }
            publishedAt: string
          }
        }): TrendingTopic => ({
          title: item.snippet.title,
          videoId: item.id.videoId,
          viewCount: statsMap.get(item.id.videoId) || 0,
          channelTitle: item.snippet.channelTitle,
          thumbnailUrl: item.snippet.thumbnails?.default?.url || '',
          publishedAt: item.snippet.publishedAt
        })
      )
    } catch (err) {
      if (err instanceof Error && err.message === 'MISSING_API_KEY') throw err
      handleApiError(err, 'getTrendingInNiche')
    }
  }
}
