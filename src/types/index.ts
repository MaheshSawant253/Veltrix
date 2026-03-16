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

// ── Phase 4A: Video Editor ──

export interface VideoSettings {
  resolution: '1920x1080' | '1280x720' | '3840x2160'
  fps: 24 | 30 | 60
  aspectRatio: '16:9' | '9:16' | '1:1'
  duration: number
}

export interface TimelineClip {
  id: string
  type: 'video' | 'audio' | 'text' | 'image'
  trackIndex: number
  startTime: number
  duration: number
  trimIn: number
  trimOut: number
  filePath?: string
  content?: string
  name: string
  color?: string
}

export interface TimelineTrack {
  id: string
  type: 'video' | 'audio' | 'text'
  label: string
  clips: TimelineClip[]
  isMuted: boolean
  isLocked: boolean
  height: number
}

export interface TimelineData {
  tracks: TimelineTrack[]
  totalDuration: number
  playheadPosition: number
}
export interface MediaAsset {
  id: string
  filePath: string
  fileName: string
  fileType: 'video' | 'audio' | 'image' | 'text'
  fileSize: number
  duration: number
  extension: string
  addedAt: string
}

export interface VideoProject {
  id: string
  channelId?: string
  title: string
  description: string
  niche: string
  style: string
  targetAudience: string
  status: 'draft' | 'in_progress' | 'ready' | 'exported'
  settings: VideoSettings
  timeline: TimelineData
  assets: MediaAsset[]
  scriptIdea?: string
  createdAt: string
  updatedAt: string
}

export interface NewVideoFormData {
  title: string
  description: string
  niche: string
  style: 'Fast-paced' | 'Cinematic' | 'Educational' | 'Vlog' | 'Documentary'
  targetAudience: string
  aspectRatio: '16:9' | '9:16' | '1:1'
  resolution: '1920x1080' | '1280x720' | '3840x2160'
  fps: 24 | 30 | 60
  channelId?: string
  scriptIdea?: string
}

// ── Phase 4C: Export Pipeline ──

export interface ExportSettings {
  outputPath: string
  resolution: '1920x1080' | '1280x720' | '3840x2160'
  fps: 24 | 30 | 60
  quality: 'high' | 'medium' | 'fast'
  format: 'mp4'
}

export interface ExportJob {
  id: string
  projectId: string
  projectTitle: string
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
  progress: number        // 0-100
  currentStep: string     // human readable status
  outputPath: string
  startedAt?: string
  completedAt?: string
  errorMessage?: string
  encoderUsed: string
}

export interface ExportProgressEvent {
  jobId: string
  progress: number
  currentStep: string
  timeElapsed: number     // seconds
  timeRemaining?: number  // estimated seconds
}

export interface ExportCommand {
  inputs: InputFile[]
  filterComplex: string
  outputOptions: string[]
  outputPath: string
  totalDuration: number
}

export interface InputFile {
  index: number
  filePath: string
  type: 'video' | 'audio' | 'image'
}
