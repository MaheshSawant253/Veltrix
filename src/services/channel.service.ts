import type { Channel } from '../types'

interface ChannelRow {
  id: string
  name: string
  handle: string
  description: string
  niche: string
  editing_style: string
  tone_of_voice: string
  target_audience: string
  upload_frequency: string
  branding_config: string
  youtube_channel_id: string
  created_at: string
  updated_at: string
}

const mapRowToChannel = (row: ChannelRow): Channel => ({
  id: row.id,
  name: row.name,
  handle: row.handle || '',
  description: row.description || '',
  niche: row.niche || '',
  editingStyle: (row.editing_style || 'Educational') as Channel['editingStyle'],
  toneOfVoice: (row.tone_of_voice || 'Professional') as Channel['toneOfVoice'],
  targetAudience: row.target_audience || '',
  uploadFrequency: (row.upload_frequency || 'Weekly') as Channel['uploadFrequency'],
  brandingConfig: row.branding_config
    ? JSON.parse(row.branding_config)
    : { primaryColor: '#6366f1', fontStyle: 'Modern', videoStyle: 'Mixed' },
  youtubeChannelId: row.youtube_channel_id || '',
  createdAt: row.created_at,
  updatedAt: row.updated_at
})

const ensureColumns = async (): Promise<void> => {
  const columnsToAdd = [
    { name: 'description', type: 'TEXT DEFAULT ""' },
    { name: 'editing_style', type: 'TEXT DEFAULT "Educational"' },
    { name: 'tone_of_voice', type: 'TEXT DEFAULT "Professional"' },
    { name: 'target_audience', type: 'TEXT DEFAULT ""' },
    { name: 'upload_frequency', type: 'TEXT DEFAULT "Weekly"' }
  ]

  for (const col of columnsToAdd) {
    try {
      await window.veltrix.db.run(
        `ALTER TABLE channels ADD COLUMN ${col.name} ${col.type}`
      )
    } catch {
      // Column already exists — safe to ignore
    }
  }
}

let columnsEnsured = false

export const channelService = {
  async getAll(): Promise<Channel[]> {
    if (!columnsEnsured) {
      await ensureColumns()
      columnsEnsured = true
    }
    const rows = (await window.veltrix.db.query(
      'SELECT * FROM channels ORDER BY created_at DESC'
    )) as ChannelRow[]
    return rows.map(mapRowToChannel)
  },

  async getById(id: string): Promise<Channel | null> {
    if (!columnsEnsured) {
      await ensureColumns()
      columnsEnsured = true
    }
    const rows = (await window.veltrix.db.query(
      'SELECT * FROM channels WHERE id = ?',
      [id]
    )) as ChannelRow[]
    return rows.length > 0 ? mapRowToChannel(rows[0]) : null
  },

  async create(
    data: Omit<Channel, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Channel> {
    if (!columnsEnsured) {
      await ensureColumns()
      columnsEnsured = true
    }
    const id = crypto.randomUUID()
    await window.veltrix.db.run(
      `INSERT INTO channels (
        id, name, handle, description, niche, editing_style,
        tone_of_voice, target_audience, upload_frequency,
        branding_config, youtube_channel_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        data.name,
        data.handle,
        data.description,
        data.niche,
        data.editingStyle,
        data.toneOfVoice,
        data.targetAudience,
        data.uploadFrequency,
        JSON.stringify(data.brandingConfig),
        data.youtubeChannelId
      ]
    )
    const created = await this.getById(id)
    if (!created) throw new Error('Failed to retrieve created channel')
    return created
  },

  async update(id: string, data: Partial<Channel>): Promise<Channel> {
    const sets: string[] = []
    const params: unknown[] = []

    if (data.name !== undefined) { sets.push('name = ?'); params.push(data.name) }
    if (data.handle !== undefined) { sets.push('handle = ?'); params.push(data.handle) }
    if (data.description !== undefined) { sets.push('description = ?'); params.push(data.description) }
    if (data.niche !== undefined) { sets.push('niche = ?'); params.push(data.niche) }
    if (data.editingStyle !== undefined) { sets.push('editing_style = ?'); params.push(data.editingStyle) }
    if (data.toneOfVoice !== undefined) { sets.push('tone_of_voice = ?'); params.push(data.toneOfVoice) }
    if (data.targetAudience !== undefined) { sets.push('target_audience = ?'); params.push(data.targetAudience) }
    if (data.uploadFrequency !== undefined) { sets.push('upload_frequency = ?'); params.push(data.uploadFrequency) }
    if (data.brandingConfig !== undefined) {
      sets.push('branding_config = ?')
      params.push(JSON.stringify(data.brandingConfig))
    }
    if (data.youtubeChannelId !== undefined) { sets.push('youtube_channel_id = ?'); params.push(data.youtubeChannelId) }

    sets.push("updated_at = datetime('now')")
    params.push(id)

    await window.veltrix.db.run(
      `UPDATE channels SET ${sets.join(', ')} WHERE id = ?`,
      params
    )

    const updated = await this.getById(id)
    if (!updated) throw new Error('Failed to retrieve updated channel')
    return updated
  },

  async delete(id: string): Promise<void> {
    await window.veltrix.db.run('DELETE FROM channels WHERE id = ?', [id])
  }
}
