export interface BrandingConfig {
  primaryColor: string
  fontStyle: 'Modern' | 'Classic' | 'Playful' | 'Bold'
  videoStyle: 'Talking Head' | 'Screen Record' | 'Cinematic' | 'Animation' | 'Mixed'
}

export interface Channel {
  id: string
  name: string
  handle: string
  description: string
  niche: string
  editingStyle: 'Fast-paced' | 'Cinematic' | 'Educational' | 'Vlog' | 'Documentary'
  toneOfVoice: 'Educational' | 'Entertaining' | 'Inspirational' | 'Conversational' | 'Professional'
  targetAudience: string
  uploadFrequency: 'Daily' | '3x per week' | 'Weekly' | 'Bi-weekly' | 'Monthly'
  brandingConfig: BrandingConfig
  youtubeChannelId: string
  createdAt: string
  updatedAt: string
}

export interface Project {
  id: string
  channelId?: string
  title: string
  description?: string
  status: 'draft' | 'in_progress' | 'ready' | 'exported'
  timelineData?: unknown
  settings?: unknown
  createdAt: string
  updatedAt: string
}

export interface EncoderInfo {
  encoder: string
  gpu: string
  isHardware: boolean
}

export interface RenderJob {
  id: string
  projectId: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  progress: number
  encoderUsed?: string
  outputPath?: string
  errorMessage?: string
  startedAt?: string
  completedAt?: string
}

export interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
}

// ── Phase 3: Video Production ──

export interface YouTubeVideo {
  id: string
  title: string
  description: string
  thumbnailUrl: string
  publishedAt: string
  viewCount: number
  likeCount: number
  commentCount: number
  duration: string
}

export interface VideoComment {
  id: string
  text: string
  likeCount: number
  publishedAt: string
}

export interface CommentAnalysis {
  sentiment: 'positive' | 'neutral' | 'negative' | 'mixed'
  topThemes: string[]
  audienceRequests: string[]
  painPoints: string[]
  summary: string
}

export interface TrendingTopic {
  title: string
  videoId: string
  viewCount: number
  channelTitle: string
  thumbnailUrl: string
  publishedAt: string
}

export interface VideoIdea {
  id: string
  title: string
  description: string
  targetKeyword: string
  estimatedViews: string
  reasonForSuggestion: string
  outline: string[]
}

export interface ApiKeyStatus {
  youtubeApiKey: string
  geminiApiKey: string
}
