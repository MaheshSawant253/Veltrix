import { v4 as uuidv4 } from 'uuid'
import type { VideoProject, NewVideoFormData, TimelineData, VideoSettings, MediaAsset } from '../types'

function createEmptyTimeline(): TimelineData {
  return {
    tracks: [
      {
        id: uuidv4(),
        type: 'video',
        label: 'Video 1',
        clips: [],
        isMuted: false,
        isLocked: false,
        height: 64
      },
      {
        id: uuidv4(),
        type: 'audio',
        label: 'Audio 1',
        clips: [],
        isMuted: false,
        isLocked: false,
        height: 48
      },
      {
        id: uuidv4(),
        type: 'text',
        label: 'Text / Subtitles',
        clips: [],
        isMuted: false,
        isLocked: false,
        height: 40
      }
    ],
    totalDuration: 0,
    playheadPosition: 0
  }
}

interface ProjectRow {
  id: string
  channel_id: string | null
  title: string
  description: string | null
  status: string
  timeline_data: string | null
  settings: string | null
  created_at: string
  updated_at: string
}

function parseProject(row: ProjectRow): VideoProject {
  let timeline: TimelineData
  try {
    timeline = row.timeline_data ? JSON.parse(row.timeline_data) : createEmptyTimeline()
  } catch {
    timeline = createEmptyTimeline()
  }

  let settingsRaw: Record<string, unknown> = {}
  try {
    settingsRaw = row.settings ? JSON.parse(row.settings) : {}
  } catch {
    settingsRaw = {}
  }

  const settings: VideoSettings = {
    resolution: (settingsRaw.resolution as VideoSettings['resolution']) || '1920x1080',
    fps: (settingsRaw.fps as VideoSettings['fps']) || 30,
    aspectRatio: (settingsRaw.aspectRatio as VideoSettings['aspectRatio']) || '16:9',
    duration: (settingsRaw.duration as number) || 0
  }

  const assets: MediaAsset[] = Array.isArray(settingsRaw.assets)
    ? (settingsRaw.assets as MediaAsset[])
    : []

  return {
    id: row.id,
    channelId: row.channel_id || undefined,
    title: row.title,
    description: row.description || '',
    niche: (settingsRaw.niche as string) || '',
    style: (settingsRaw.style as string) || '',
    targetAudience: (settingsRaw.targetAudience as string) || '',
    status: (row.status as VideoProject['status']) || 'draft',
    settings,
    timeline,
    assets,
    scriptIdea: (settingsRaw.scriptIdea as string) || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

export const projectService = {
  async getAll(): Promise<VideoProject[]> {
    const rows = (await window.veltrix.db.query(
      'SELECT * FROM projects ORDER BY updated_at DESC'
    )) as ProjectRow[]
    return rows.map(parseProject)
  },

  async getById(id: string): Promise<VideoProject | null> {
    const rows = (await window.veltrix.db.query(
      'SELECT * FROM projects WHERE id = ?',
      [id]
    )) as ProjectRow[]
    return rows.length > 0 ? parseProject(rows[0]) : null
  },

  async create(formData: NewVideoFormData): Promise<VideoProject> {
    const id = uuidv4()
    const now = new Date().toISOString()
    const timeline = createEmptyTimeline()
    const settings: VideoSettings = {
      resolution: formData.resolution,
      fps: formData.fps,
      aspectRatio: formData.aspectRatio,
      duration: 0
    }

    const settingsJson = JSON.stringify({
      ...settings,
      niche: formData.niche,
      style: formData.style,
      targetAudience: formData.targetAudience,
      scriptIdea: formData.scriptIdea || '',
      assets: []
    })

    await window.veltrix.db.run(
      `INSERT INTO projects (
        id, channel_id, title, description, status,
        timeline_data, settings, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        formData.channelId || null,
        formData.title,
        formData.description,
        'draft',
        JSON.stringify(timeline),
        settingsJson,
        now,
        now
      ]
    )

    const created = await this.getById(id)
    if (!created) throw new Error('Failed to retrieve created project')
    return created
  },

  async updateTimeline(id: string, timeline: TimelineData): Promise<void> {
    await window.veltrix.db.run(
      "UPDATE projects SET timeline_data = ?, updated_at = datetime('now') WHERE id = ?",
      [JSON.stringify(timeline), id]
    )
  },

  async updateAssets(id: string, assets: MediaAsset[]): Promise<void> {
    const project = await this.getById(id)
    if (!project) return

    let settingsRaw: Record<string, unknown> = {}
    try {
      const rows = (await window.veltrix.db.query(
        'SELECT settings FROM projects WHERE id = ?',
        [id]
      )) as { settings: string }[]
      if (rows.length > 0 && rows[0].settings) {
        settingsRaw = JSON.parse(rows[0].settings)
      }
    } catch {
      settingsRaw = {}
    }

    settingsRaw.assets = assets

    await window.veltrix.db.run(
      "UPDATE projects SET settings = ?, updated_at = datetime('now') WHERE id = ?",
      [JSON.stringify(settingsRaw), id]
    )
  },

  async updateStatus(id: string, status: VideoProject['status']): Promise<void> {
    await window.veltrix.db.run(
      "UPDATE projects SET status = ?, updated_at = datetime('now') WHERE id = ?",
      [status, id]
    )
  },

  async delete(id: string): Promise<void> {
    await window.veltrix.db.run('DELETE FROM projects WHERE id = ?', [id])
  }
}
