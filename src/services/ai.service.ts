import { GoogleGenerativeAI } from '@google/generative-ai'
import type { VideoComment, CommentAnalysis, TrendingTopic, VideoIdea } from '../types'

const MODEL_NAME = 'gemini-1.5-flash'

/**
 * Safely parse a JSON string from Gemini's response.
 * Strips markdown fences if the model wraps them anyway.
 */
function safeParseJSON<T>(raw: string, fallback: T): T {
  try {
    // Remove potential markdown code fences
    const cleaned = raw
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/```\s*$/i, '')
      .trim()
    return JSON.parse(cleaned)
  } catch {
    return fallback
  }
}

export const aiService = {
  /**
   * Analyze YouTube comments and return structured insights.
   */
  async analyzeComments(
    comments: VideoComment[],
    channelNiche: string,
    apiKey: string
  ): Promise<CommentAnalysis> {
    const defaultAnalysis: CommentAnalysis = {
      sentiment: 'neutral',
      topThemes: [],
      audienceRequests: [],
      painPoints: [],
      summary: 'Unable to analyze comments at this time.'
    }

    if (!apiKey || comments.length === 0) return defaultAnalysis

    try {
      const genAI = new GoogleGenerativeAI(apiKey)
      const model = genAI.getGenerativeModel({ model: MODEL_NAME })

      const prompt = `You are analyzing YouTube comments for a ${channelNiche} channel.

Comments:
${comments.map((c) => `- "${c.text}"`).join('\n')}

Analyze these comments and respond ONLY with a JSON object (no markdown, no backticks) with this exact structure:
{
  "sentiment": "positive" | "neutral" | "negative" | "mixed",
  "topThemes": ["theme1", "theme2", "theme3"],
  "audienceRequests": ["request1", "request2"],
  "painPoints": ["pain1", "pain2"],
  "summary": "2-3 sentence summary of what the audience wants"
}`

      const result = await model.generateContent(prompt)
      const text = result.response.text()

      return safeParseJSON<CommentAnalysis>(text, defaultAnalysis)
    } catch (err) {
      console.error('AI analyzeComments error:', err)
      return defaultAnalysis
    }
  },

  /**
   * Generate video ideas based on analysis + trends.
   */
  async generateVideoIdeas(params: {
    channelNiche: string
    channelName: string
    editingStyle: string
    toneOfVoice: string
    targetAudience: string
    commentAnalysis: CommentAnalysis
    trendingTopics: TrendingTopic[]
    recentVideoTitles: string[]
    apiKey: string
  }): Promise<VideoIdea[]> {
    if (!params.apiKey) return []

    try {
      const genAI = new GoogleGenerativeAI(params.apiKey)
      const model = genAI.getGenerativeModel({ model: MODEL_NAME })

      const prompt = `You are a YouTube strategist for a ${params.channelNiche} channel called "${params.channelName}".

Channel style: ${params.editingStyle}, ${params.toneOfVoice} tone
Target audience: ${params.targetAudience}

Recent videos by this channel:
${params.recentVideoTitles.map((t) => `- ${t}`).join('\n')}

What the audience is asking for (from comment analysis):
- Themes: ${params.commentAnalysis.topThemes.join(', ')}
- Requests: ${params.commentAnalysis.audienceRequests.join(', ')}

Currently trending in ${params.channelNiche}:
${params.trendingTopics
  .slice(0, 5)
  .map((t) => `- ${t.title}`)
  .join('\n')}

Generate 3 unique video ideas. Respond ONLY with a JSON array (no markdown, no backticks):
[
  {
    "id": "1",
    "title": "exact video title",
    "description": "2-3 sentence video description",
    "targetKeyword": "main SEO keyword",
    "estimatedViews": "10K-50K",
    "reasonForSuggestion": "why this will perform well",
    "outline": ["intro point", "main point 1", "main point 2", "conclusion"]
  }
]`

      const result = await model.generateContent(prompt)
      const text = result.response.text()

      return safeParseJSON<VideoIdea[]>(text, [])
    } catch (err) {
      console.error('AI generateVideoIdeas error:', err)
      return []
    }
  }
}
