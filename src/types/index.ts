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
