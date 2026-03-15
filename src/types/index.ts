export interface Channel {
  id: string
  name: string
  handle?: string
  niche?: string
  style?: string
  brandingConfig?: Record<string, unknown>
  youtubeChannelId?: string
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
