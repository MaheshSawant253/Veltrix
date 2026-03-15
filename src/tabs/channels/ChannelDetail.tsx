import { useState } from 'react'
import { Pencil, Trash2, ExternalLink } from 'lucide-react'
import type { Channel } from '../../types'

interface ChannelDetailProps {
  channel: Channel
  onEdit: (channel: Channel) => void
  onDelete: (id: string) => Promise<void>
}

const InfoSection = ({
  label,
  children
}: {
  label: string
  children: React.ReactNode
}) => (
  <div className="space-y-3">
    <h3 className="text-xs font-medium uppercase tracking-wider text-text-secondary">
      {label}
    </h3>
    {children}
  </div>
)

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-start justify-between gap-4">
    <span className="text-sm text-text-secondary">{label}</span>
    <span className="text-right text-sm text-text-primary">{value || '—'}</span>
  </div>
)

export const ChannelDetail = ({ channel, onEdit, onDelete }: ChannelDetailProps) => {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    try {
      setDeleting(true)
      await onDelete(channel.id)
    } catch {
      setDeleting(false)
      setConfirmDelete(false)
    }
  }

  return (
    <div className="h-full overflow-auto p-6">
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Header */}
        <div className="rounded-xl border border-border bg-surface-2 p-6">
          <div className="flex items-start gap-4">
            <div
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-xl font-bold text-white"
              style={{ backgroundColor: channel.brandingConfig.primaryColor }}
            >
              {channel.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-text-primary">
                  {channel.name}
                </h2>
                <button
                  onClick={() => onEdit(channel)}
                  className="flex items-center gap-1.5 rounded-lg bg-accent/15 px-3 py-1.5 text-xs font-medium text-accent transition-colors hover:bg-accent/25"
                >
                  <Pencil size={13} />
                  Edit
                </button>
              </div>
              {channel.handle && (
                <p className="mt-0.5 text-sm text-text-secondary">
                  {channel.handle.startsWith('@')
                    ? channel.handle
                    : `@${channel.handle}`}
                </p>
              )}
              <div className="mt-2 flex flex-wrap gap-2">
                {channel.niche && (
                  <span className="rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-medium text-accent">
                    {channel.niche}
                  </span>
                )}
                {channel.editingStyle && (
                  <span className="rounded-full bg-[#222] px-2.5 py-0.5 text-xs text-text-secondary">
                    {channel.editingStyle}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Channel Info */}
        <div className="rounded-xl border border-border bg-surface-2 p-6">
          <InfoSection label="Channel Info">
            <InfoRow label="Description" value={channel.description} />
            <InfoRow label="Target Audience" value={channel.targetAudience} />
            <InfoRow label="Upload Frequency" value={channel.uploadFrequency} />
            <InfoRow label="Tone of Voice" value={channel.toneOfVoice} />
          </InfoSection>
        </div>

        {/* Branding */}
        <div className="rounded-xl border border-border bg-surface-2 p-6">
          <InfoSection label="Branding">
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-secondary">Primary Color</span>
              <div className="flex items-center gap-2">
                <div
                  className="h-5 w-5 rounded-full border border-white/20"
                  style={{ backgroundColor: channel.brandingConfig.primaryColor }}
                />
                <span className="text-sm text-text-primary">
                  {channel.brandingConfig.primaryColor}
                </span>
              </div>
            </div>
            <InfoRow label="Font Style" value={channel.brandingConfig.fontStyle} />
            <InfoRow label="Video Style" value={channel.brandingConfig.videoStyle} />
          </InfoSection>
        </div>

        {/* YouTube Link */}
        <div className="rounded-xl border border-border bg-surface-2 p-6">
          <InfoSection label="YouTube Link">
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-secondary">Channel ID</span>
              {channel.youtubeChannelId ? (
                <span className="flex items-center gap-1 text-sm text-accent">
                  {channel.youtubeChannelId}
                  <ExternalLink size={12} />
                </span>
              ) : (
                <span className="text-sm text-text-secondary/50">Not set</span>
              )}
            </div>
          </InfoSection>
        </div>

        {/* Delete */}
        <div className="rounded-xl border border-border bg-surface-2 p-6">
          {!confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm text-danger transition-colors hover:bg-danger/10"
            >
              <Trash2 size={15} />
              Delete Channel
            </button>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-text-primary">
                Are you sure? This cannot be undone.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="rounded-lg border border-border px-4 py-2 text-sm text-text-secondary transition-colors hover:bg-surface"
                  disabled={deleting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="rounded-lg bg-danger px-4 py-2 text-sm text-white transition-colors hover:bg-danger/80 disabled:opacity-50"
                >
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
